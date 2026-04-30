namespace PronosticApp.Domain.Enums;

public enum PredictionStatus
{
    Draft,
    Open,
    VoteClosed,
    AwaitingResolution,
    Resolved,
    Archived,
    Cancelled
}
