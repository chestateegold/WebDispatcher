using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Server.Hubs;
using Server.Services;
using System.IO;

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
builder.Services.Configure<LayoutOptions>(builder.Configuration.GetSection(LayoutOptions.SectionName));

// Register the CMRI-backed service and the background polling service.
builder.Services.AddSingleton<CmriService>();
builder.Services.AddSingleton<LayoutService>();
builder.Services.AddSingleton<LogicControllerService>();
builder.Services.AddHostedService<DevicePollingService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseCors("DevCors");

    var clientDistPath = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "..", "Client", "dist"));

    if (Directory.Exists(clientDistPath))
    {
        var clientDistFileProvider = new PhysicalFileProvider(clientDistPath);

        app.UseDefaultFiles(new DefaultFilesOptions
        {
            FileProvider = clientDistFileProvider
        });

        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = clientDistFileProvider
        });

        app.MapFallback(async context =>
        {
            await context.Response.SendFileAsync(Path.Combine(clientDistPath, "index.html"));
        });
    }
}
else
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

// Map your SignalR hub
app.MapHub<CmriHub>("/cmriHub");
app.MapGet("/api/layout", (LayoutService layoutService) => Results.Ok(layoutService.CurrentLayout));

if (!app.Environment.IsDevelopment())
{
    app.MapFallbackToFile("index.html");
}

app.Run();