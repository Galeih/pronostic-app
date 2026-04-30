using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PronosticApp.Application.DTOs.Auth;
using PronosticApp.Application.Interfaces;
using PronosticApp.Domain.Entities;

namespace PronosticApp.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly SignInManager<AppUser> _signInManager;
    private readonly ITokenService _tokenService;

    public AuthController(
        UserManager<AppUser> userManager,
        SignInManager<AppUser> signInManager,
        ITokenService tokenService)
    {
        _userManager    = userManager;
        _signInManager  = signInManager;
        _tokenService   = tokenService;
    }

    // ─── POST /api/auth/register ───────────────────────────────────────────

    /// <summary>Crée un nouveau compte utilisateur.</summary>
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        // Vérification manuelle simple (FluentValidation peut être ajouté plus tard)
        if (string.IsNullOrWhiteSpace(request.UserName) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Tous les champs sont obligatoires." });
        }

        var user = new AppUser
        {
            UserName  = request.UserName.Trim(),
            Email     = request.Email.Trim().ToLower(),
            CreatedAt = DateTime.UtcNow,
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            var errors = result.Errors.ToDictionary(e => e.Code, e => new[] { e.Description });
            return BadRequest(new { message = "Inscription échouée.", errors });
        }

        await _userManager.AddToRoleAsync(user, "Player");

        var roles = await _userManager.GetRolesAsync(user);
        var token = _tokenService.GenerateToken(user, roles);

        return Ok(BuildAuthResponse(user, token));
    }

    // ─── POST /api/auth/login ──────────────────────────────────────────────

    /// <summary>Connexion avec email + mot de passe.</summary>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Email et mot de passe obligatoires." });

        var user = await _userManager.FindByEmailAsync(request.Email.Trim().ToLower());
        if (user == null)
            return Unauthorized(new { message = "Email ou mot de passe incorrect." });

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);

        if (result.IsLockedOut)
            return Unauthorized(new { message = "Compte temporairement bloqué. Réessaie dans quelques minutes." });

        if (!result.Succeeded)
            return Unauthorized(new { message = "Email ou mot de passe incorrect." });

        // Mettre à jour la date de dernière connexion
        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        var roles = await _userManager.GetRolesAsync(user);
        var token = _tokenService.GenerateToken(user, roles);

        return Ok(BuildAuthResponse(user, token));
    }

    // ─── POST /api/auth/logout ─────────────────────────────────────────────

    /// <summary>Déconnexion (invalidation côté client uniquement avec JWT stateless).</summary>
    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        // Avec JWT stateless, la déconnexion réelle se fait côté client (supprimer le token).
        // Ici on peut ajouter une blacklist si nécessaire plus tard.
        return Ok(new { message = "Déconnecté avec succès." });
    }

    // ─── GET /api/auth/me ──────────────────────────────────────────────────

    /// <summary>Retourne les informations de l'utilisateur connecté.</summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        return Ok(MapToUserDto(user));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    private AuthResponse BuildAuthResponse(AppUser user, string token) => new()
    {
        Token     = token,
        ExpiresAt = _tokenService.GetExpiryDate(),
        User      = MapToUserDto(user),
    };

    private static UserDto MapToUserDto(AppUser user) => new()
    {
        Id          = user.Id,
        UserName    = user.UserName!,
        Email       = user.Email!,
        AvatarUrl   = user.AvatarUrl,
        Level       = user.Level,
        Experience  = user.Experience,
        TotalPoints = user.TotalPoints,
        IsGuest     = user.IsGuest,
        CreatedAt   = user.CreatedAt,
    };
}
