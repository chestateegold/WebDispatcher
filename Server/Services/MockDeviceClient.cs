using System;
using System.Threading;
using System.Threading.Tasks;

namespace Server.Services
{
    // Temporary mock implementation. Replace with an adapter to your device library.
    public class MockDeviceClient : IDeviceClient
    {
        public Task<byte[]?> ReadAsync(CancellationToken cancellationToken)
        {
            // Simulate a small hardware read latency
            return Task.FromResult<byte[]?>(new byte[] { 1, 0, 0 });
        }
    }
}