using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Server.Hubs;

namespace Server.Services
{
    // BackgroundService that polls the device and pushes updates to connected SignalR clients.
    public class DevicePollingService : BackgroundService
    {
        private readonly ILogger<DevicePollingService> _logger;
        private readonly IHubContext<CmriHub> _hubContext;
        private readonly CmriService _cmriService;
        private readonly CmriState _cmriState;
        private readonly TimeSpan _pollInterval = TimeSpan.FromMilliseconds(250); // adjust as needed

        public DevicePollingService(
            ILogger<DevicePollingService> logger,
            IHubContext<CmriHub> hubContext,
            CmriService cmriService,
            CmriState cmriState)
        {
            _logger = logger;
            _hubContext = hubContext;
            _cmriService = cmriService;
            _cmriState = cmriState;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DevicePollingService started.");

            try
            {
                while (!stoppingToken.IsCancellationRequested)
                {
                    try
                    {
                        var data = await _cmriService.ReadAsync(stoppingToken);

                        if (data is not null && !data.AsSpan().SequenceEqual(_cmriState.GetLastSentData()))
                        {
                            _cmriState.SetLastSentData(data);

                            _logger.LogInformation("Sending CMRI payload: {Payload}", string.Join(", ", data));

                            // Send to all connected clients. Use a meaningful signal name and payload shape.
                            await _hubContext.Clients.All.SendAsync("ReceiveMessage", data, cancellationToken: stoppingToken);
                        }
                    }
                    catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                    {
                        // Graceful shutdown
                        break;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error reading device or sending to hub.");
                        // Consider backoff / retry policy for production
                    }

                    await Task.Delay(_pollInterval, stoppingToken);
                }
            }
            finally
            {
                _logger.LogInformation("DevicePollingService stopping.");
            }
        }
    }
}