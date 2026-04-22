using System;
using System.IO;
using System.Text.Json;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Server.Contracts;

namespace Server.Services
{
    public sealed class LayoutService
    {
        public LayoutService(IOptions<LayoutOptions> options, IHostEnvironment environment, ILogger<LayoutService> logger)
        {
            var relativeOrAbsolutePath = options.Value.FilePath;
            var fullPath = Path.IsPathRooted(relativeOrAbsolutePath)
                ? relativeOrAbsolutePath
                : Path.Combine(environment.ContentRootPath, relativeOrAbsolutePath);

            if (!File.Exists(fullPath))
            {
                throw new InvalidOperationException($"Layout file '{fullPath}' was not found.");
            }

            using var stream = File.OpenRead(fullPath);
            CurrentLayout = JsonSerializer.Deserialize<LayoutDefinition>(stream, CreateSerializerOptions())
                ?? throw new InvalidOperationException($"Layout file '{fullPath}' did not contain a valid layout definition.");

            logger.LogInformation("Loaded layout {LayoutId} from {LayoutFilePath}.", CurrentLayout.Id, fullPath);
        }

        public LayoutDefinition CurrentLayout { get; }

        private static JsonSerializerOptions CreateSerializerOptions()
        {
            return new JsonSerializerOptions(JsonSerializerDefaults.Web)
            {
                PropertyNameCaseInsensitive = true,
            };
        }
    }
}