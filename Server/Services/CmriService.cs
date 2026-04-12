using System;
using System.Threading;
using System.Threading.Tasks;
using CmriSubroutines;
using CmriSubroutines.Transports;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Server.Services
{
    public sealed class CmriService : IDisposable
    {
        private readonly ILogger<CmriService> _logger;
        private readonly CmriOptions _options;
        private readonly ITransport _transport;
        private readonly Subroutines _subroutines;

        public CmriService(IOptions<CmriOptions> options, ILogger<CmriService> logger)
        {
            _logger = logger;
            _options = options.Value;

            _transport = CreateTransport(_options);
            _subroutines = new Subroutines(_transport, _options.TimeoutMs, _options.Delay, _options.MaxBuf);

            var nodeType = ParseNodeType(_options.NodeType);
            InitializeNode(nodeType, _options);

            _logger.LogInformation(
                "Initialized CMRI device client using transport {Transport} for node {NodeAddress} ({NodeType}).",
                _options.Transport,
                _options.NodeAddress,
                nodeType);
        }

        public async Task<byte[]?> ReadAsync(CancellationToken cancellationToken)
        {
            return await _subroutines.InputsAsync(_options.NodeAddress, cancellationToken);
        }

        public void Dispose()
        {
            _transport.Dispose();
        }

        private static NodeType ParseNodeType(string value)
        {
            if (Enum.TryParse<NodeType>(value, ignoreCase: true, out var nodeType))
            {
                return nodeType;
            }

            throw new InvalidOperationException($"Unsupported CMRI node type '{value}'.");
        }

        private static ITransport CreateTransport(CmriOptions options)
        {
            if (string.Equals(options.Transport, "Tcp", StringComparison.OrdinalIgnoreCase))
            {
                return new TcpTransport(options.Host, options.Port);
            }

            if (string.Equals(options.Transport, "Serial", StringComparison.OrdinalIgnoreCase))
            {
                return new SerialTransport(options.ComPort, options.Baud100, options.MaxBuf);
            }

            if (string.Equals(options.Transport, "Memory", StringComparison.OrdinalIgnoreCase))
            {
                return new CmriMemoryLoopbackTransport(options.NodeAddress, options.MockInputs);
            }

            throw new InvalidOperationException($"Unsupported CMRI transport '{options.Transport}'.");
        }

        private void InitializeNode(NodeType nodeType, CmriOptions options)
        {
            if (options.Ct is { Length: > 0 })
            {
                _subroutines.Init(options.NodeAddress, nodeType, options.Ct);
                return;
            }

            if (nodeType is NodeType.MAXI24 or NodeType.MAXI32)
            {
                throw new InvalidOperationException("CMRI CT configuration is required for MAXI nodes.");
            }

            _subroutines.Init(options.NodeAddress, nodeType);
        }
    }
}
