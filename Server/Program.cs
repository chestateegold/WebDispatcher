using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Server.Hubs;
using Server.Services;

var builder = WebApplication.CreateBuilder(args);

// Allow dev server (vite) to call the API during development.
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // change port if your dev server uses a different port
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add SignalR
builder.Services.AddSignalR();

// Register your device client and the background polling service.
// Replace MockDeviceClient with an adapter that wraps your real hardware library.
builder.Services.AddSingleton<IDeviceClient, MockDeviceClient>();
builder.Services.AddHostedService<DevicePollingService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseCors("DevCors");
}

app.UseStaticFiles();

// Map your SignalR hub
app.MapHub<CmriHub>("/cmriHub");

// If no API route matches, serve the SPA index.html (served from webroot/wwwroot)
app.MapFallbackToFile("index.html");

app.Run();