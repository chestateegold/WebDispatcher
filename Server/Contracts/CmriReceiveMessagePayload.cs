namespace Server.Contracts
{
    public sealed record CmriReceiveMessagePayload(byte[] Indications, byte[] DerivedIndications, byte[] Outputs)
    {
        public static CmriReceiveMessagePayload FromIndications(byte[] indications)
        {
            return Create(indications, new byte[indications.Length], new byte[indications.Length]);
        }

        public static CmriReceiveMessagePayload Create(byte[] indications, byte[] derivedIndications, byte[] outputs)
        {
            return new([.. indications], [.. derivedIndications], [.. outputs]);
        }
    }
}
