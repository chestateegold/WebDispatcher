using System;
using System.Collections.Generic;
using Server.Contracts;

namespace Server.Services
{
    public sealed class LogicControllerService
    {
        private readonly object _syncRoot = new();
        private readonly LayoutDefinition _layout;
        private readonly ILogger<LogicControllerService> _logger;
        private readonly Dictionary<string, LayoutItemState> _layoutItemsById;
        private readonly Dictionary<string, SignalControlPointDefinition> _signalControlPoints;
        private readonly Dictionary<SignalControlKey, ActiveSignalControl> _activeSignalControls;
        private byte[] _latestIndications = [];
        private byte[] _latestDerivedIndications = [];
        private byte[] _latestOutputs = [];

        public LogicControllerService(LayoutService layoutService, ILogger<LogicControllerService> logger)
        {
            ArgumentNullException.ThrowIfNull(layoutService);

            _layout = layoutService.CurrentLayout;
            _logger = logger;
            _layoutItemsById = BuildLayoutItemIndex(_layout);
            _signalControlPoints = BuildSignalControlPoints(_layout, _layoutItemsById);
            _activeSignalControls = new Dictionary<SignalControlKey, ActiveSignalControl>();

            var inactiveCount = 0;

            foreach (var layoutItem in _layoutItemsById.Values)
            {
                if (!layoutItem.IsSignalControlled)
                {
                    inactiveCount++;
                }
            }

            _logger.LogInformation(
                "Initialized logic controller for layout {LayoutId} with {ItemCount} layout items, {SignalControlPointCount} signal control points, and {InactiveCount} inactive entries.",
                _layout.Id,
                _layoutItemsById.Count,
                _signalControlPoints.Count,
                inactiveCount);
        }

        public CmriReceiveMessagePayload ApplyIndications(byte[] indications)
        {
            ArgumentNullException.ThrowIfNull(indications);

            lock (_syncRoot)
            {
                _latestIndications = [.. indications];
                Recompute();

                return CreatePayload();
            }
        }

        public CmriReceiveMessagePayload ApplyControl(FrontendControlMessagePayload control)
        {
            ArgumentNullException.ThrowIfNull(control);

            lock (_syncRoot)
            {
                EnsureKnownLayout(control.LayoutId);

                if (control is not SignalControlMessagePayload signalControl)
                {
                    _logger.LogInformation(
                        "Ignoring unsupported control type {ControlType} for layout item {LayoutItemId}.",
                        control.ControlType,
                        control.LayoutItemId);

                    return CreatePayload();
                }

                var controlPoint = GetSignalControlPoint(signalControl.Metadata.ControlPointId);

                if (!string.Equals(controlPoint.LayoutItemId, signalControl.LayoutItemId, StringComparison.Ordinal))
                {
                    throw new InvalidOperationException(
                        $"Signal control point '{signalControl.Metadata.ControlPointId}' is attached to layout item '{controlPoint.LayoutItemId}', not '{signalControl.LayoutItemId}'.");
                }

                if (!controlPoint.DirectionMappings.ContainsKey(signalControl.Target.Direction))
                {
                    throw new InvalidOperationException(
                        $"Signal control point '{signalControl.Metadata.ControlPointId}' does not support direction '{signalControl.Target.Direction}'.");
                }

                var key = new SignalControlKey(signalControl.Metadata.ControlPointId, signalControl.Target.Direction);

                if (string.Equals(signalControl.Action, "cancel", StringComparison.OrdinalIgnoreCase))
                {
                    _activeSignalControls.Remove(key);
                }
                else
                {
                    _activeSignalControls[key] = new ActiveSignalControl(
                        signalControl.Metadata.ControlPointId,
                        signalControl.LayoutItemId,
                        signalControl.Target.Direction,
                        signalControl.Target.SignalId,
                        signalControl.SentAt);
                }

                Recompute();

                return CreatePayload();
            }
        }

        public CmriReceiveMessagePayload GetCurrentPayload()
        {
            lock (_syncRoot)
            {
                return CreatePayload();
            }
        }

        private void Recompute()
        {
            var derivedLength = GetRequiredArrayLength("derivedIndications", _latestIndications.Length);
            var outputsLength = GetRequiredArrayLength("outputs", _latestIndications.Length);
            var derivedIndications = new byte[derivedLength];
            var outputs = new byte[outputsLength];

            // Placeholder behavior for the first controller pass:
            // a requested signal simply drives its mapped derived indication bit.
            foreach (var activeControl in _activeSignalControls.Values)
            {
                var controlPoint = GetSignalControlPoint(activeControl.ControlPointId);
                var mapping = controlPoint.DirectionMappings[activeControl.Direction];
                SetBit(derivedIndications, mapping);
            }

            _latestDerivedIndications = derivedIndications;
            _latestOutputs = outputs;
        }

        private CmriReceiveMessagePayload CreatePayload()
        {
            return CmriReceiveMessagePayload.Create(_latestIndications, _latestDerivedIndications, _latestOutputs);
        }

        private void EnsureKnownLayout(string layoutId)
        {
            if (!string.Equals(_layout.Id, layoutId, StringComparison.Ordinal))
            {
                throw new InvalidOperationException($"Received control for layout '{layoutId}', but controller is loaded with layout '{_layout.Id}'.");
            }
        }

        private SignalControlPointDefinition GetSignalControlPoint(string controlPointId)
        {
            if (_signalControlPoints.TryGetValue(controlPointId, out var controlPoint))
            {
                return controlPoint;
            }

            throw new InvalidOperationException($"Unknown signal control point '{controlPointId}'.");
        }

        private int GetRequiredArrayLength(string arrayName, int fallbackLength)
        {
            var requiredLength = fallbackLength;

            foreach (var controlPoint in _signalControlPoints.Values)
            {
                foreach (var mapping in controlPoint.DirectionMappings.Values)
                {
                    if (!string.Equals(mapping.Array, arrayName, StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    requiredLength = Math.Max(requiredLength, mapping.Byte + 1);
                }
            }

            return requiredLength;
        }

        private static Dictionary<string, LayoutItemState> BuildLayoutItemIndex(LayoutDefinition layout)
        {
            if (string.IsNullOrWhiteSpace(layout.Id))
            {
                throw new InvalidOperationException("Layout id is required.");
            }

            if (layout.Row.Count == 0)
            {
                throw new InvalidOperationException("Layout row must contain at least one item.");
            }

            var layoutItems = new Dictionary<string, LayoutItemState>(StringComparer.Ordinal);

            foreach (var rowItem in layout.Row)
            {
                if (string.IsNullOrWhiteSpace(rowItem.Id))
                {
                    throw new InvalidOperationException("Each layout item must have an id.");
                }

                if (!layoutItems.TryAdd(rowItem.Id, new LayoutItemState(rowItem.Id, rowItem.Kind, false)))
                {
                    throw new InvalidOperationException($"Duplicate layout item id '{rowItem.Id}'.");
                }
            }

            return layoutItems;
        }

        private static Dictionary<string, SignalControlPointDefinition> BuildSignalControlPoints(
            LayoutDefinition layout,
            Dictionary<string, LayoutItemState> layoutItemsById)
        {
            var controlPoints = new Dictionary<string, SignalControlPointDefinition>(StringComparer.Ordinal);

            foreach (var rowItem in layout.Row)
            {
                if (rowItem.ControlPoint is null)
                {
                    continue;
                }

                if (string.IsNullOrWhiteSpace(rowItem.ControlPoint.Id))
                {
                    throw new InvalidOperationException($"Layout item '{rowItem.Id}' has a control point without an id.");
                }

                if (rowItem.ControlPoint.ClearRouteSources is null || rowItem.ControlPoint.ClearRouteSources.Count == 0)
                {
                    throw new InvalidOperationException($"Layout item '{rowItem.Id}' control point '{rowItem.ControlPoint.Id}' must define at least one clear route source.");
                }

                var mapping = rowItem.Mapping
                    ?? throw new InvalidOperationException($"Layout item '{rowItem.Id}' control point '{rowItem.ControlPoint.Id}' is missing mapping data.");

                var directionMappings = new Dictionary<string, BitSource>(StringComparer.OrdinalIgnoreCase);

                foreach (var clearRouteSource in rowItem.ControlPoint.ClearRouteSources)
                {
                    if (string.IsNullOrWhiteSpace(clearRouteSource.Direction))
                    {
                        throw new InvalidOperationException($"Layout item '{rowItem.Id}' control point '{rowItem.ControlPoint.Id}' has a clear route source without a direction.");
                    }

                    var bitSource = clearRouteSource.Direction switch
                    {
                        "left" => mapping.ClearLeft?.Sources.Count > 0 ? mapping.ClearLeft.Sources[0] : null,
                        "right" => mapping.ClearRight?.Sources.Count > 0 ? mapping.ClearRight.Sources[0] : null,
                        _ => throw new InvalidOperationException(
                            $"Layout item '{rowItem.Id}' control point '{rowItem.ControlPoint.Id}' has unsupported direction '{clearRouteSource.Direction}'.")
                    };

                    if (bitSource is null)
                    {
                        throw new InvalidOperationException(
                            $"Layout item '{rowItem.Id}' control point '{rowItem.ControlPoint.Id}' direction '{clearRouteSource.Direction}' is missing a derived indication mapping.");
                    }

                    if (!string.Equals(bitSource.Array, "derivedIndications", StringComparison.OrdinalIgnoreCase))
                    {
                        throw new InvalidOperationException(
                            $"Layout item '{rowItem.Id}' control point '{rowItem.ControlPoint.Id}' direction '{clearRouteSource.Direction}' must target the derivedIndications array.");
                    }

                    if (!directionMappings.TryAdd(clearRouteSource.Direction, bitSource))
                    {
                        throw new InvalidOperationException(
                            $"Layout item '{rowItem.Id}' control point '{rowItem.ControlPoint.Id}' repeats direction '{clearRouteSource.Direction}'.");
                    }
                }

                if (!controlPoints.TryAdd(
                    rowItem.ControlPoint.Id,
                    new SignalControlPointDefinition(rowItem.ControlPoint.Id, rowItem.Id, directionMappings)))
                {
                    throw new InvalidOperationException($"Duplicate signal control point id '{rowItem.ControlPoint.Id}'.");
                }

                layoutItemsById[rowItem.Id] = layoutItemsById[rowItem.Id] with { IsSignalControlled = true };
            }

            return controlPoints;
        }

        private static void SetBit(byte[] buffer, BitSource bitSource)
        {
            if (bitSource.Byte < 0 || bitSource.Byte >= buffer.Length)
            {
                throw new InvalidOperationException($"Bit source byte index {bitSource.Byte} is outside the computed '{bitSource.Array}' buffer length {buffer.Length}.");
            }

            if (bitSource.Bit < 0 || bitSource.Bit > 7)
            {
                throw new InvalidOperationException($"Bit source bit index {bitSource.Bit} is invalid. Expected a value between 0 and 7.");
            }

            buffer[bitSource.Byte] |= (byte)(1 << bitSource.Bit);
        }

        private sealed record SignalControlPointDefinition(
            string Id,
            string LayoutItemId,
            Dictionary<string, BitSource> DirectionMappings);

        private sealed record ActiveSignalControl(
            string ControlPointId,
            string LayoutItemId,
            string Direction,
            string SignalId,
            DateTimeOffset SentAt);

        private sealed record SignalControlKey(string ControlPointId, string Direction);

        private sealed record LayoutItemState(string Id, string Kind, bool IsSignalControlled);
    }
}