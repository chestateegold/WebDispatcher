namespace Server.Services
{
    public sealed class LayoutOptions
    {
        public const string SectionName = "Layout";

        public string FilePath { get; set; } = "Data/currentLayout.json";
    }
}