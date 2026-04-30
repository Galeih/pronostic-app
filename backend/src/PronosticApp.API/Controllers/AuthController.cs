using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PronosticApp.Application.DTOs.Auth;
using PronosticApp.Application.Interfaces;
using PronosticApp.Domain.Entities;
using PronosticApp.Domain.Enums;
using PronosticApp.Infrastructure.Data;

namespace PronosticApp.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<AppUser>    _userManager;
    private readonly SignInManager<AppUser>  _signInManager;
    private readonly ITokenService           _tokenService;
    private readonly AppDbContext            _db;

    public AuthController(
        UserManager<AppUser>   userManager,
        SignInManager<AppUser> signInManager,
        ITokenService          tokenService,
        AppDbContext           db)
    {
        _userManager   = userManager;
        _signInManager = signInManager;
        _tokenService  = tokenService;
        _db            = db;
    }

    // POST /api/auth/register
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserName) ||
            string.IsNullOrWhiteSpace(request.Email)    ||
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
            return BadRequest(new { message = "Inscription echouee.", errors });
        }

        await _userManager.AddToRoleAsync(user, "Player");

        // Boosts de depart
        await GrantStarterBoostsAsync(user.Id);

        var roles = await _userManager.GetRolesAsync(user);
        var token = _tokenService.GenerateToken(user, roles);

        return Ok(BuildAuthResponse(user, token));
    }

    // POST /api/auth/login
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
            return Unauthorized(new { message = "Compte temporairement bloque. Reessaie dans quelques minutes." });

        if (!result.Succeeded)
            return Unauthorized(new { message = "Email ou mot de passe incorrect." });

        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        var roles = await _userManager.GetRolesAsync(user);
        var token = _tokenService.GenerateToken(user, roles);

        return Ok(BuildAuthResponse(user, token));
    }

    // POST /api/auth/logout
    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        return Ok(new { message = "Deconnecte avec succes." });
    }

    // GET /api/auth/me
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

    // ── Helpers ────────────────────────────────────────────────────────────

    /// <summary>
    /// Kit de boosts offert a chaque nouvel inscrit :
    ///   2x Correction  1x Double Vote  1x Sabotage  1x Bouclier
    /// </summary>
    private async Task GrantStarterBoostsAsync(string userId)
    {
        var starterKit = new[]
        {
            (BoostType.VoteCorrection, 2),
            (BoostType.SecondVote,     1),
            (BoostType.Sabotage,       1),
            (BoostType.Shield,         1),
        };

        var boosts = await _db.Boosts
            .Where(b => b.IsActive)
            .ToListAsync();

        foreach (var (boostType, qty) in starterKit)
        {
            var boost = boosts.FirstOrDefault(b => b.BoostType == boostType);
            if (boost == null) continue;

            _db.UserBoosts.Add(new UserBoost
            {
                UserId     = userId,
                BoostId    = boost.Id,
                Quantity   = qty,
                AcquiredAt = DateTime.UtcNow,
            });
        }

        await _db.SaveChangesAsync();
    }

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
