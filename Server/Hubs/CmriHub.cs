using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using Server.Contracts;
using Server.Services;

namespace Server.Hubs
{
    public class CmriHub : Hub
    {
        private readonly LogicControllerService _logicControllerService;
        private readonly ILogger<CmriHub> _logger;

        public CmriHub(LogicControllerService logicControllerService, ILogger<CmriHub> logger)
        {
            _logicControllerService = logicControllerService;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var lastPayload = _logicControllerService.TryGetCurrentPayload();

            if (lastPayload is not null)
            {
                await Clients.Caller.SendAsync("ReceiveMessage", lastPayload);
            }

            await base.OnConnectedAsync();
        }

        public Task SendControlMessage(JsonElement payloadJson)
        {
            return HandleControlMessage(payloadJson, false);
        }

        private Task HandleControlMessage(JsonElement payloadJson, bool logRawPayload)
        {
            var raw = payloadJson.GetRawText();

            if (logRawPayload)
            {
                _logger.LogInformation("Raw control payload: {Payload}", raw);
            }

            try
            {
                if (!payloadJson.TryGetProperty("controlType", out var controlTypeElement))
                {
                    _logger.LogWarning("Control payload is missing controlType");
                    return Task.CompletedTask;
                }

                var controlType = controlTypeElement.GetString();
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

                FrontendControlMessagePayload? payload = controlType switch
                {
                    "signal" => JsonSerializer.Deserialize<SignalControlMessagePayload>(raw, options),
                    "turnout" => JsonSerializer.Deserialize<TurnoutControlMessagePayload>(raw, options),
                    _ => null
                };

                if (payload is null)
                {
                    _logger.LogWarning("Unsupported controlType '{ControlType}'", controlType);
                    return Task.CompletedTask;
                }

                payload.Validate();
                _logger.LogInformation("Received control message {MessageId} (type={ControlType})", payload.MessageId, payload.ControlType);

                var responsePayload = _logicControllerService.ApplyControl(payload);

                return Clients.All.SendAsync("ReceiveMessage", responsePayload);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to deserialize control payload");
            }

            return Task.CompletedTask;
        }
    }
}
