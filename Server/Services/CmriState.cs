namespace Server.Services
{
    public sealed class CmriState
    {
        private readonly object _syncRoot = new();
        private byte[]? _lastSentData;

        public void SetLastSentData(byte[] data)
        {
            lock (_syncRoot)
            {
                _lastSentData = [.. data];
            }
        }

        public byte[]? GetLastSentData()
        {
            lock (_syncRoot)
            {
                return _lastSentData is null ? null : [.. _lastSentData];
            }
        }
    }
}
