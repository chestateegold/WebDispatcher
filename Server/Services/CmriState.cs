using Server.Contracts;

namespace Server.Services
{
    public sealed class CmriState
    {
        private readonly object _syncRoot = new();
        private CmriReceiveMessagePayload? _lastPayload;

        public void SetLastPayload(CmriReceiveMessagePayload payload)
        {
            lock (_syncRoot)
            {
                _lastPayload = CmriReceiveMessagePayload.Create(payload.Indications, payload.DerivedIndications, payload.Outputs);
            }
        }

        public CmriReceiveMessagePayload? GetLastPayload()
        {
            lock (_syncRoot)
            {
                return _lastPayload is null
                    ? null
                    : CmriReceiveMessagePayload.Create(_lastPayload.Indications, _lastPayload.DerivedIndications, _lastPayload.Outputs);
            }
        }

        public byte[]? GetLastIndications()
        {
            lock (_syncRoot)
            {
                return _lastPayload is null ? null : [.. _lastPayload.Indications];
            }
        }
    }
}
