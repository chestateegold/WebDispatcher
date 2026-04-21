using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using Server.Contracts;
using Server.Services;

namespace Server.Hubs
{
    public class CmriHub : Hub
    {
        private readonly CmriState _cmriState;
        private readonly ILogger<CmriHub> _logger;

        public CmriHub(CmriState cmriState, ILogger<CmriHub> logger)
        {
            _cmriState = cmriState;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var lastSentData = _cmriState.GetLastSentData();

            if (lastSentData is not null)
            {
                await Clients.Caller.SendAsync("ReceiveMessage", CmriReceiveMessagePayload.FromIndications(lastSentData));
            }

            await base.OnConnectedAsync();
        }

        public Task SendControlMessage(FrontendControlMessagePayload payload)
        {
            if (payload is null)
            {
                throw new HubException("A control payload is required.");
            }

            try
            {
                payload.Validate();
            }
            catch (ArgumentException exception)
            {
                throw new HubException(exception.Message);
            }

            _logger.LogInformation("Received control message {MessageId} (type={ControlType})", payload.MessageId, payload.ControlType);

            return Task.CompletedTask;
        }

        // Diagnostic method: accept raw JSON, log it, and attempt a tolerant deserialize
        // Note: must not clash with the typed `SendControlMessage` SignalR method name
        public Task SendControlMessageJson(JsonElement payloadJson)
        {
            var raw = payloadJson.GetRawText();
            _logger.LogInformation("Raw control payload: {Payload}", raw);

            try
            {
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var payload = JsonSerializer.Deserialize<FrontendControlMessagePayload>(raw, options);
                if (payload is null)
                {
                    _logger.LogWarning("Deserialized payload was null");
                    return Task.CompletedTask;
                }

                payload.Validate();
                _logger.LogInformation("Deserialized control message {MessageId} (type={ControlType})", payload.MessageId, payload.ControlType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to deserialize control payload");
            }

            return Task.CompletedTask;
        }
    }
}
