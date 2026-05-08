using System.Text.Json;
using System.Text.Json.Serialization;

namespace PronosticApp.API.Json;

/// <summary>
/// Force la sérialisation des DateTime avec le suffixe 'Z' (UTC).
/// SQLite + EF Core renvoie DateTimeKind.Unspecified, ce qui amène
/// System.Text.Json à omettre le 'Z' — le navigateur interprète alors
/// la date comme heure locale au lieu d'UTC.
/// </summary>
public class UtcDateTimeConverter : JsonConverter<DateTime>
{
    public override DateTime Read(
        ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var dt = reader.GetDateTime();
        return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
    }

    public override void Write(
        Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        // Toujours écrire en UTC avec suffixe 'Z'
        writer.WriteStringValue(
            DateTime.SpecifyKind(value, DateTimeKind.Utc)
                    .ToString("yyyy-MM-ddTHH:mm:ssZ"));
    }
}

/// <summary>Idem pour DateTime? nullable.</summary>
public class UtcNullableDateTimeConverter : JsonConverter<DateTime?>
{
    public override DateTime? Read(
        ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null) return null;
        var dt = reader.GetDateTime();
        return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
    }

    public override void Write(
        Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (value is null) { writer.WriteNullValue(); return; }
        writer.WriteStringValue(
            DateTime.SpecifyKind(value.Value, DateTimeKind.Utc)
                    .ToString("yyyy-MM-ddTHH:mm:ssZ"));
    }
}
