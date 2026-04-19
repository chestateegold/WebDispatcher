namespace Server.Contracts
{
    public sealed record CmriReceiveMessagePayload(byte[] Indications, byte[] DerivedIndications)
    {
        public static CmriReceiveMessagePayload FromIndications(byte[] indications)
        {
            var derivedIndications = new byte[indications.Length];
            Array.Fill(derivedIndications, (byte)0b00000001);

            return new([.. indications], [.. derivedIndications]);
        }
    }
}
