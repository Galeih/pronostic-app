using PronosticApp.Domain.Entities;

namespace PronosticApp.Application.Interfaces;

/// <summary>
/// Contrat de génération et de validation des tokens JWT.
/// </summary>
public interface ITokenService
{
    /// <summary>Génère un JWT signé pour l'utilisateur donné.</summary>
    string GenerateToken(AppUser user, IList<string> roles);

    /// <summary>Retourne la date d'expiration d'un token fraîchement généré.</summary>
    DateTime GetExpiryDate();
}
