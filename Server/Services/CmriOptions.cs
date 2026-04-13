namespace Server.Services
{
    public class CmriOptions
    {
        public string Transport { get; set; } = "Serial";
        public int NodeAddress { get; set; }
        public string NodeType { get; set; } = "SMINI";
        public int TimeoutMs { get; set; } = 3000;
        public int Delay { get; set; }
        public int MaxBuf { get; set; } = 64;
        public MemoryTransportOptions Memory { get; set; } = new();
        public TcpTransportOptions Tcp { get; set; } = new();
        public SerialTransportOptions Serial { get; set; } = new();
        public byte[]? Ct { get; set; }
    }

    public class MemoryTransportOptions
    {
        public byte[] MockInputs { get; set; } = [0, 8, 0];
    }

    public class TcpTransportOptions
    {
        public string Host { get; set; } = "cmripi";
        public int Port { get; set; } = 3333;
    }

    public class SerialTransportOptions
    {
        public int ComPort { get; set; } = 5;
        public int Baud100 { get; set; } = 1152;
    }
}
