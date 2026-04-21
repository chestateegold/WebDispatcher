using System.Text.Json.Serialization;

namespace Server.Contracts
{
    [JsonPolymorphic(TypeDiscriminatorPropertyName = "controlType")]
    [JsonDerivedType(typeof(SignalControlMessagePayload), "signal")]
    [JsonDerivedType(typeof(TurnoutControlMessagePayload), "turnout")]
    public abstract record FrontendControlMessagePayload(
        string MessageId,
        string LayoutId,
        string LayoutItemId,
        string ControlType,
        string Action,
        FrontendControlMetadataPayload Metadata,
        DateTimeOffset SentAt)
    {
        protected void ValidateBase()
        {
            if (string.IsNullOrWhiteSpace(MessageId))
            {
                throw new ArgumentException("messageId is required.");
            }

            if (string.IsNullOrWhiteSpace(LayoutId))
            {
                throw new ArgumentException("layoutId is required.");
            }

            if (string.IsNullOrWhiteSpace(LayoutItemId))
            {
                throw new ArgumentException("layoutItemId is required.");
            }

            if (string.IsNullOrWhiteSpace(ControlType))
            {
                throw new ArgumentException("controlType is required.");
            }

            if (string.IsNullOrWhiteSpace(Action))
            {
                throw new ArgumentException("action is required.");
            }

            if (Metadata is null || string.IsNullOrWhiteSpace(Metadata.ControlPointId))
            {
                throw new ArgumentException("metadata.controlPointId is required.");
            }

            if (SentAt == default)
            {
                throw new ArgumentException("sentAt is required.");
            }
        }

        public abstract void Validate();
    }

    public sealed record FrontendControlMetadataPayload(string ControlPointId);

    public sealed record SignalControlTargetPayload(string SignalId, string Direction);

    public sealed record TurnoutControlTargetPayload(string TurnoutId, string SelectedSignalId);

    public sealed record SignalControlMessagePayload(
        string MessageId,
        string LayoutId,
        string LayoutItemId,
        string Action,
        SignalControlTargetPayload Target,
        FrontendControlMetadataPayload Metadata,
        DateTimeOffset SentAt)
        : FrontendControlMessagePayload(MessageId, LayoutId, LayoutItemId, "signal", Action, Metadata, SentAt)
    {
        public override void Validate()
        {
            ValidateBase();

            if (Action != "request" && Action != "cancel")
            {
                throw new ArgumentException("signal action must be request or cancel.");
            }

            if (Target is null)
            {
                throw new ArgumentException("target is required.");
            }

            if (string.IsNullOrWhiteSpace(Target.SignalId))
            {
                throw new ArgumentException("target.signalId is required.");
            }

            if (Target.Direction != "left" && Target.Direction != "right")
            {
                throw new ArgumentException("target.direction must be left or right.");
            }
        }
    }

    public sealed record TurnoutControlMessagePayload(
        string MessageId,
        string LayoutId,
        string LayoutItemId,
        string Action,
        TurnoutControlTargetPayload Target,
        FrontendControlMetadataPayload Metadata,
        DateTimeOffset SentAt)
        : FrontendControlMessagePayload(MessageId, LayoutId, LayoutItemId, "turnout", Action, Metadata, SentAt)
    {
        public override void Validate()
        {
            ValidateBase();

            if (Action != "toggle")
            {
                throw new ArgumentException("turnout action must be toggle.");
            }

            if (Target is null)
            {
                throw new ArgumentException("target is required.");
            }

            if (string.IsNullOrWhiteSpace(Target.TurnoutId))
            {
                throw new ArgumentException("target.turnoutId is required.");
            }

            if (string.IsNullOrWhiteSpace(Target.SelectedSignalId))
            {
                throw new ArgumentException("target.selectedSignalId is required.");
            }
        }
    }
}