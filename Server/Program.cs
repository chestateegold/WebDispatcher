using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Server.Hubs;
using Server.Services;

var builder = WebApplication.CreateBuilder(args);

// Allow dev server (vite) to call the API during development.
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add SignalR with case-insensitive JSON for payloads
builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.Configure<CmriOptions>(builder.Configuration.GetSection("Cmri"));

// Register the CMRI-backed service and the background polling service.
builder.Services.AddSingleton<CmriState>();
builder.Services.AddSingleton<CmriService>();
builder.Services.AddHostedService<DevicePollingService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseCors("DevCors");
}
else
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

// Map your SignalR hub
app.MapHub<CmriHub>("/cmriHub");

if (!app.Environment.IsDevelopment())
{
    app.MapFallbackToFile("index.html");
}

app.Run();