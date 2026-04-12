using Microsoft.AspNetCore.SignalR;

namespace Server.Hubs
{
    public class CmriHub : Hub
    {
        public Task SendMessage()
        {
            return Clients.All.SendAsync("ReceiveMessage", "test");
        }
    }
}
