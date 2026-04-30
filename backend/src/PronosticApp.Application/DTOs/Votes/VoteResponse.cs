namespace PronosticApp.Application.DTOs.Votes;

public class VoteResponse
{
    public Guid VoteId { get; set; }
    public Guid PredictionId { get; set; }
    public Guid OptionId { get; set; }
    public string OptionLabel { get; set; } = string.Empty;
    public Guid? SecondOptionId { get; set; }
    public string? SecondOptionLabel { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Message { get; set; } = string.Empty;
}
