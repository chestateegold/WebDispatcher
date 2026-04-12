using System;
using System.Threading;
using System.Threading.Tasks;
using CmriSubroutines.Transports;

namespace Server.Services
{
    internal sealed class CmriMemoryLoopbackTransport : ITransport
    {
        private readonly MemoryTransport _inner = new();
        private readonly object _syncRoot = new();
        private readonly int _nodeAddress;
        private byte[] _currentInputs;

        public CmriMemoryLoopbackTransport(int nodeAddress, byte[]? initialInputs = null)
        {
            _nodeAddress = nodeAddress;
            _currentInputs = NormalizeInputs(initialInputs);
        }

        public int BytesToRead => _inner.BytesToRead;

        public int BytesToWrite => _inner.BytesToWrite;

        public int ReadBufferSize
        {
            get => _inner.ReadBufferSize;
            set => _inner.ReadBufferSize = value;
        }

        public int WriteBufferSize
        {
            get => _inner.WriteBufferSize;
            set => _inner.WriteBufferSize = value;
        }

        public int ReadTimeoutMs
        {
            get => _inner.ReadTimeoutMs;
            set => _inner.ReadTimeoutMs = value;
        }

        public int WriteTimeoutMs
        {
            get => _inner.WriteTimeoutMs;
            set => _inner.WriteTimeoutMs = value;
        }

        public void SetInputs(byte[] inputs)
        {
            lock (_syncRoot)
            {
                _currentInputs = NormalizeInputs(inputs);
            }
        }

        public void Open() => _inner.Open();

        public Task OpenAsync(CancellationToken cancellationToken = default) => _inner.OpenAsync(cancellationToken);

        public void Close() => _inner.Close();

        public Task CloseAsync(CancellationToken cancellationToken = default) => _inner.CloseAsync(cancellationToken);

        public void Dispose() => _inner.Dispose();

        public int ReadByte() => _inner.ReadByte();

        public Task<int> ReadByteAsync(CancellationToken cancellationToken = default) => _inner.ReadByteAsync(cancellationToken);

        public int Read(byte[] buffer, int offset, int count) => _inner.Read(buffer, offset, count);

        public Task<int> ReadAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken = default) =>
            _inner.ReadAsync(buffer, offset, count, cancellationToken);

        public void Write(byte[] buffer, int offset, int count)
        {
            _inner.Write(buffer, offset, count);
            EnqueuePollResponseIfNeeded(buffer, offset, count);
        }

        public Task WriteAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            Write(buffer, offset, count);
            return Task.CompletedTask;
        }

        public void DiscardInBuffer() => _inner.DiscardInBuffer();

        public void DiscardOutBuffer() => _inner.DiscardOutBuffer();

        private void EnqueuePollResponseIfNeeded(byte[] buffer, int offset, int count)
        {
            if (count < 6)
            {
                return;
            }

            if (buffer[offset + 2] != 2 || buffer[offset + 3] != _nodeAddress + 65 || buffer[offset + 4] != 'P')
            {
                return;
            }

            byte[] inputs;
            lock (_syncRoot)
            {
                inputs = [.. _currentInputs];
            }

            _inner.EnqueueRead(BuildEscapedResponse((byte)(_nodeAddress + 65), inputs));
        }

        private static byte[] BuildEscapedResponse(byte ua, byte[] inputs)
        {
            var response = new byte[12];
            var index = 0;

            response[index++] = 2;
            response[index++] = ua;
            response[index++] = (byte)'R';

            foreach (var input in inputs)
            {
                if (input is 2 or 3 or 16)
                {
                    response[index++] = 16;
                }

                response[index++] = input;
            }

            response[index++] = 3;

            if (index == response.Length)
            {
                return response;
            }

            Array.Resize(ref response, index);
            return response;
        }

        private static byte[] NormalizeInputs(byte[]? inputs)
        {
            if (inputs is null || inputs.Length == 0)
            {
                return [0, 0, 0];
            }

            if (inputs.Length == 3)
            {
                return [.. inputs];
            }

            var normalized = new byte[3];
            Array.Copy(inputs, normalized, Math.Min(inputs.Length, normalized.Length));
            return normalized;
        }
    }
}
