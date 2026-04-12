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

// Add SignalR
builder.Services.AddSignalR();

builder.Services.Configure<CmriOptions>(builder.Configuration.GetSection("Cmri"));

// Register the CMRI-backed service and the background polling service.
builder.Services.AddSingleton<CmriService>();
builder.Services.AddHostedService<DevicePollingService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseCors("DevCors");
}

//app.UseStaticFiles();

// Map your SignalR hub
app.MapHub<CmriHub>("/cmriHub");

// If no API route matches, serve the SPA index.html (served from webroot/wwwroot)
//app.MapFallbackToFile("index.html");

app.Run();