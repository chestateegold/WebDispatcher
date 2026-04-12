namespace Server.Services
{
    public class CmriOptions
    {
        public string Transport { get; set; } = "Memory";
        public int NodeAddress { get; set; }
        public string NodeType { get; set; } = "SMINI";
        public int TimeoutMs { get; set; } = 3000;
        public int Delay { get; set; }
        public int MaxBuf { get; set; } = 64;
        public string Host { get; set; } = "CmriPi";
        public int Port { get; set; } = 3333;
        public int ComPort { get; set; } = 5;
        public int Baud100 { get; set; } = 1152;
        public byte[] MockInputs { get; set; } = [1, 0, 0];
        public byte[]? Ct { get; set; }
    }
}
