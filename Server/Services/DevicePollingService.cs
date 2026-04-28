using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Server.Contracts;
using Server.Hubs;

namespace Server.Services
{
    // BackgroundService that polls the device and pushes updates to connected SignalR clients.
    public class DevicePollingService : BackgroundService
    {
        private readonly ILogger<DevicePollingService> _logger;
        private readonly IHubContext<CmriHub> _hubContext;
        private readonly CmriService _cmriService;
        private readonly LogicControllerService _logicControllerService;
        private readonly TimeSpan _pollInterval = TimeSpan.FromMilliseconds(50); // adjust as needed

        public DevicePollingService(
            ILogger<DevicePollingService> logger,
            IHubContext<CmriHub> hubContext,
            CmriService cmriService,
            LogicControllerService logicControllerService)
        {
            _logger = logger;
            _hubContext = hubContext;
            _cmriService = cmriService;
            _logicControllerService = logicControllerService;
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

                        if (data is not null && !data.AsSpan().SequenceEqual(_logicControllerService.GetCurrentIndications()))
                        {
                            var payload = _logicControllerService.ApplyIndications(data);

                            _logger.LogInformation("Sending CMRI payload: {Payload}", string.Join(", ", data));

                            await _hubContext.Clients.All.SendAsync("ReceiveMessage", payload, cancellationToken: stoppingToken);
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