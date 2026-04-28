using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Server.Contracts
{
    public sealed class LayoutDefinition
    {
        public string Id { get; set; } = string.Empty;
        public List<LayoutRowItem> Row { get; set; } = [];
    }

    public sealed class LayoutRowItem
    {
        public string Id { get; set; } = string.Empty;
        public string Kind { get; set; } = string.Empty;

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? Size { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public bool? BlockEndLeft { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public bool? BlockEndRight { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Orientation { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Direction { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public LayoutMapping? Mapping { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public LayoutOutputMapping? Outputs { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public TurnoutControlPointMetadata? ControlPoint { get; set; }
    }

    public sealed class LayoutMapping
    {
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public BitSourceLike? Occupied { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public BitSource? SwitchPosition { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public BitSourceLike? ClearLeft { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public BitSourceLike? ClearRight { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public BitSourceLike? TrackOneOccupied { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public BitSourceLike? TrackTwoOccupied { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public BitSourceLike? MainOccupied { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public BitSourceLike? CrossingOccupied { get; set; }
    }

    public sealed class LayoutOutputMapping
    {
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public TurnoutOutputMapping? Turnout { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public SignalOutputMapping? Signal { get; set; }
    }

    public sealed class TurnoutOutputMapping
    {
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public BitSource? SwitchPosition { get; set; }
    }

    public sealed class SignalOutputMapping
    {
        public List<SignalHeadOutputMapping> Heads { get; set; } = [];
    }

    public sealed class SignalHeadOutputMapping
    {
        public string HeadId { get; set; } = string.Empty;

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public BitSource? Bit0 { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public BitSource? Bit1 { get; set; }
    }

    public sealed class TurnoutControlPointMetadata
    {
        public string Id { get; set; } = string.Empty;

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public List<TurnoutClearRouteSource>? ClearRouteSources { get; set; }
    }

    public sealed class TurnoutClearRouteSource
    {
        public string Direction { get; set; } = string.Empty;
    }

    public sealed class BitSource
    {
        public int Byte { get; set; }
        public int Bit { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Array { get; set; }
    }

    [JsonConverter(typeof(BitSourceLikeJsonConverter))]
    public sealed class BitSourceLike
    {
        public BitSourceLike()
        {
        }

        public BitSourceLike(IEnumerable<BitSource> sources)
        {
            Sources.AddRange(sources);
        }

        public List<BitSource> Sources { get; } = [];
    }

    public sealed class BitSourceLikeJsonConverter : JsonConverter<BitSourceLike>
    {
        public override BitSourceLike? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
            {
                return null;
            }

            if (reader.TokenType == JsonTokenType.StartObject)
            {
                var source = JsonSerializer.Deserialize<BitSource>(ref reader, options);
                return source is null ? null : new BitSourceLike([source]);
            }

            if (reader.TokenType == JsonTokenType.StartArray)
            {
                var sources = JsonSerializer.Deserialize<List<BitSource>>(ref reader, options);
                return sources is null ? null : new BitSourceLike(sources);
            }

            throw new JsonException("Bit source value must be an object or an array.");
        }

        public override void Write(Utf8JsonWriter writer, BitSourceLike value, JsonSerializerOptions options)
        {
            if (value.Sources.Count == 1)
            {
                JsonSerializer.Serialize(writer, value.Sources[0], options);
                return;
            }

            JsonSerializer.Serialize(writer, value.Sources, options);
        }
    }
}