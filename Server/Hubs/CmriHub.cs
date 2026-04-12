using Microsoft.AspNetCore.SignalR;
using Server.Services;

namespace Server.Hubs
{
    public class CmriHub : Hub
    {
        private readonly CmriState _cmriState;

        public CmriHub(CmriState cmriState)
        {
            _cmriState = cmriState;
        }

        public override async Task OnConnectedAsync()
        {
            var lastSentData = _cmriState.GetLastSentData();

            if (lastSentData is not null)
            {
                await Clients.Caller.SendAsync("ReceiveMessage", lastSentData);
            }

            await base.OnConnectedAsync();
        }
    }
}
