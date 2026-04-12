using System.Threading;
using System.Threading.Tasks;

namespace Server.Services
{
    // Simple abstraction for your hardware library. Implement this against your real library.
    public interface IDeviceClient
    {
        // Read one sample / message from the device.
        // Return null if nothing available or throw on hardware failures.
        Task<byte[]?> ReadAsync(CancellationToken cancellationToken);
    }
}