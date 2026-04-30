namespace PronosticApp.Application.DTOs.Boosts;

/// <summary>Boost du catalogue avec la quantite en possession du joueur connecte.</summary>
public class BoostResponse
{
    public Guid   Id          { get; set; }
    public string Name        { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string BoostType   { get; set; } = string.Empty;
    public string Rarity      { get; set; } = string.Empty;
    public decimal EffectValue { get; set; }
    public int    OwnedQuantity { get; set; }
}
