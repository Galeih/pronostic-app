using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PronosticApp.Application.DTOs.Boosts;
using PronosticApp.Domain.Entities;
using PronosticApp.Domain.Enums;
using PronosticApp.Infrastructure.Data;
using System.Security.Claims;

namespace PronosticApp.API.Controllers;

[ApiController]
[Authorize]
public class BoostsController : ControllerBase
{
    private readonly AppDbContext         _db;
    private readonly UserManager<AppUser> _userManager;

    public BoostsController(AppDbContext db, UserManager<AppUser> userManager)
    {
        _db          = db;
        _userManager = userManager;
    }

    private string CurrentUserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    // =========================================================
    //  GET /api/boosts
    //  Catalogue des boosts avec quantites possedees
    // =========================================================
    [HttpGet("api/boosts")]
    public async Task<ActionResult<List<BoostResponse>>> GetCatalog()
    {
        var boosts = await _db.Boosts
            .Where(b => b.IsActive)
            .OrderBy(b => b.BoostType)
            .ToListAsync();

        var inventory = await _db.UserBoosts
            .Where(ub => ub.UserId == CurrentUserId &&
                         (ub.ExpiresAt == null || ub.ExpiresAt > DateTime.UtcNow))
            .ToListAsync();

        var result = boosts.Select(b => new BoostResponse
        {
            Id            = b.Id,
            Name          = b.Name,
            Description   = b.Description,
            BoostType     = b.BoostType.ToString(),
            Rarity        = b.Rarity.ToString(),
            EffectValue   = b.EffectValue,
            OwnedQuantity = inventory
                .Where(ub => ub.BoostId == b.Id)
                .Sum(ub => ub.Quantity),
        }).ToList();

        return Ok(result);
    }

    // =========================================================
    //  GET /api/predictions/{id}/boosts
    //  Historique des boosts utilises sur un pronostic
    //  - Createur : tout voir
    //  - Autre    : uniquement ses propres usages
    //  - Apres resolution : tout est revele
    // =========================================================
    [HttpGet("api/predictions/{predictionId:guid}/boosts")]
    public async Task<ActionResult<List<BoostUsageResponse>>> GetUsages(Guid predictionId)
    {
        var prediction = await _db.Predictions
            .Include(p => p.BoostUsages)
                .ThenInclude(bu => bu.Boost)
            .Include(p => p.BoostUsages)
                .ThenInclude(bu => bu.User)
            .Include(p => p.BoostUsages)
                .ThenInclude(bu => bu.TargetUser)
            .FirstOrDefaultAsync(p => p.Id == predictionId);

        if (prediction == null) return NotFound();

        var isCreator  = prediction.CreatorId == CurrentUserId;
        var isResolved = prediction.Status == PredictionStatus.Resolved ||
                         prediction.Status == PredictionStatus.Archived;

        IEnumerable<PredictionBoostUsage> usages = prediction.BoostUsages;

        // Filtre : seul le createur ou apres resolution voit tout
        if (!isCreator && !isResolved)
            usages = usages.Where(bu => bu.UserId == CurrentUserId);

        var result = usages
            .OrderBy(bu => bu.UsedAt)
            .Select(bu => MapUsage(bu, isCreator || isResolved))
            .ToList();

        return Ok(result);
    }

    // =========================================================
    //  POST /api/predictions/{id}/boosts/correction
    //  Modifier son vote avant la deadline
    // =========================================================
    [HttpPost("api/predictions/{predictionId:guid}/boosts/correction")]
    public async Task<ActionResult> UseCorrection(
        Guid predictionId, [FromBody] UseCorrectionRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var prediction = await _db.Predictions
            .Include(p => p.Options)
            .Include(p => p.Votes)
            .Include(p => p.BoostUsages)
                .ThenInclude(bu => bu.Boost)
            .FirstOrDefaultAsync(p => p.Id == predictionId);

        if (prediction == null) return NotFound();

        // -- Regles metier ------------------------------------------------
        if (prediction.Status != PredictionStatus.Open)
            return BadRequest(new { message = "Les votes sont fermes." });

        if (prediction.VoteDeadline <= DateTime.UtcNow)
            return BadRequest(new { message = "La date limite de vote est depassee." });

        if (!prediction.AllowBoosts)
            return BadRequest(new { message = "Les boosts sont desactives sur ce pronostic." });

        var existingVote = prediction.Votes.FirstOrDefault(v => v.UserId == CurrentUserId);
        if (existingVote == null)
            return BadRequest(new { message = "Tu dois voter avant de corriger ton choix." });

        // Deja utilise la correction sur ce pronostic ?
        var alreadyUsed = prediction.BoostUsages.Any(bu =>
            bu.UserId == CurrentUserId &&
            bu.Boost.BoostType == BoostType.VoteCorrection);

        if (alreadyUsed)
            return Conflict(new { message = "Tu as deja utilise le boost Correction sur ce pronostic." });

        var newOption = prediction.Options.FirstOrDefault(o => o.Id == req.NewOptionId);
        if (newOption == null)
            return BadRequest(new { message = "Ce choix n'existe pas dans ce pronostic." });

        if (req.NewOptionId == existingVote.OptionId)
            return BadRequest(new { message = "Le nouveau choix doit etre different de l'actuel." });

        // -- Verifier possession du boost ---------------------------------
        var userBoost = await FindActiveUserBoost(BoostType.VoteCorrection);
        if (userBoost == null)
            return BadRequest(new { message = "Tu ne possedes pas le boost Correction." });

        // -- Appliquer l'effet -------------------------------------------
        var oldOptionId    = existingVote.OptionId;
        existingVote.OptionId   = req.NewOptionId;
        existingVote.UpdatedAt  = DateTime.UtcNow;
        existingVote.UsedCorrectionBoost = true;

        // Supprimer le second vote si l'option principale change
        existingVote.SecondOptionId = null;

        // Consommer le boost
        ConsumeBoost(userBoost);

        // Enregistrer l'usage
        var boostId = await GetBoostId(BoostType.VoteCorrection);
        _db.PredictionBoostUsages.Add(new PredictionBoostUsage
        {
            PredictionId  = predictionId,
            UserId        = CurrentUserId,
            BoostId       = boostId,
            EffectPayload = $"{{\"from\":\"{oldOptionId}\",\"to\":\"{req.NewOptionId}\"}}",
            IsRevealed    = true,
        });

        await _db.SaveChangesAsync();

        return Ok(new { message = $"Vote corrige : tu mises maintenant sur \"{newOption.Label}\"." });
    }

    // =========================================================
    //  POST /api/predictions/{id}/boosts/sabotage
    //  Reduire les gains d'un adversaire de 20 %
    // =========================================================
    [HttpPost("api/predictions/{predictionId:guid}/boosts/sabotage")]
    public async Task<ActionResult> UseSabotage(
        Guid predictionId, [FromBody] UseSabotageRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var prediction = await _db.Predictions
            .Include(p => p.Votes)
            .Include(p => p.BoostUsages)
                .ThenInclude(bu => bu.Boost)
            .FirstOrDefaultAsync(p => p.Id == predictionId);

        if (prediction == null) return NotFound();

        // -- Regles metier ------------------------------------------------
        if (prediction.Status != PredictionStatus.Open)
            return BadRequest(new { message = "Les votes sont fermes." });

        if (!prediction.AllowSabotage)
            return BadRequest(new { message = "Les sabotages sont desactives sur ce pronostic." });

        if (req.TargetUserId == CurrentUserId)
            return BadRequest(new { message = "Tu ne peux pas te saboter toi-meme." });

        var myVote = prediction.Votes.FirstOrDefault(v => v.UserId == CurrentUserId);
        if (myVote == null)
            return BadRequest(new { message = "Tu dois voter avant de saboter un adversaire." });

        var targetVote = prediction.Votes.FirstOrDefault(v => v.UserId == req.TargetUserId);
        if (targetVote == null)
            return BadRequest(new { message = "La cible n'a pas encore vote sur ce pronostic." });

        // Deja sabote quelqu'un sur ce pronostic ?
        var alreadySabotaged = prediction.BoostUsages.Any(bu =>
            bu.UserId == CurrentUserId &&
            bu.Boost.BoostType == BoostType.Sabotage);

        if (alreadySabotaged)
            return Conflict(new { message = "Tu as deja utilise le Sabotage sur ce pronostic." });

        // -- Verifier possession ------------------------------------------
        var userBoost = await FindActiveUserBoost(BoostType.Sabotage);
        if (userBoost == null)
            return BadRequest(new { message = "Tu ne possedes pas le boost Sabotage." });

        // -- Vérifier si la cible a un bouclier ---------------------------
        var targetHasShield = prediction.BoostUsages.Any(bu =>
            bu.UserId == req.TargetUserId &&
            bu.Boost.BoostType == BoostType.Shield &&
            !bu.WasBlocked);

        // Consommer le sabotage
        ConsumeBoost(userBoost);

        var boostId = await GetBoostId(BoostType.Sabotage);
        var usage   = new PredictionBoostUsage
        {
            PredictionId  = predictionId,
            UserId        = CurrentUserId,
            TargetUserId  = req.TargetUserId,
            BoostId       = boostId,
            IsRevealed    = false,
            WasBlocked    = false,
        };

        // Si bouclier actif -> bloquer immediatement
        if (targetHasShield)
        {
            usage.WasBlocked = true;

            // Marquer le bouclier comme utilise
            var shieldUsage = prediction.BoostUsages.First(bu =>
                bu.UserId == req.TargetUserId &&
                bu.Boost.BoostType == BoostType.Shield &&
                !bu.WasBlocked);
            shieldUsage.WasBlocked = true;
        }

        _db.PredictionBoostUsages.Add(usage);
        await _db.SaveChangesAsync();

        var msg = targetHasShield
            ? "Sabotage tente mais bloque par le Bouclier de la cible !"
            : "Sabotage lance ! Il prendra effet a la resolution.";

        return Ok(new { message = msg, wasBlocked = targetHasShield });
    }

    // =========================================================
    //  POST /api/predictions/{id}/boosts/shield
    //  Deployer un bouclier contre les sabotages
    // =========================================================
    [HttpPost("api/predictions/{predictionId:guid}/boosts/shield")]
    public async Task<ActionResult> UseShield(Guid predictionId)
    {
        var prediction = await _db.Predictions
            .Include(p => p.BoostUsages)
                .ThenInclude(bu => bu.Boost)
            .FirstOrDefaultAsync(p => p.Id == predictionId);

        if (prediction == null) return NotFound();

        // -- Regles metier ------------------------------------------------
        if (prediction.Status != PredictionStatus.Open)
            return BadRequest(new { message = "Les votes sont fermes." });

        if (!prediction.AllowBoosts)
            return BadRequest(new { message = "Les boosts sont desactives sur ce pronostic." });

        // Deja un bouclier actif ?
        var alreadyShielded = prediction.BoostUsages.Any(bu =>
            bu.UserId == CurrentUserId &&
            bu.Boost.BoostType == BoostType.Shield);

        if (alreadyShielded)
            return Conflict(new { message = "Tu as deja un Bouclier actif sur ce pronostic." });

        // -- Verifier possession ------------------------------------------
        var userBoost = await FindActiveUserBoost(BoostType.Shield);
        if (userBoost == null)
            return BadRequest(new { message = "Tu ne possedes pas le boost Bouclier." });

        // -- Appliquer -------------------------------------------------------
        ConsumeBoost(userBoost);

        // Verifie s'il y a des sabotages non bloques sur soi
        var incomingSabotages = prediction.BoostUsages
            .Where(bu => bu.TargetUserId == CurrentUserId &&
                         bu.Boost.BoostType == BoostType.Sabotage &&
                         !bu.WasBlocked)
            .ToList();

        bool blockedNow = incomingSabotages.Any();
        if (blockedNow)
        {
            foreach (var sab in incomingSabotages)
                sab.WasBlocked = true;
        }

        var boostId = await GetBoostId(BoostType.Shield);
        _db.PredictionBoostUsages.Add(new PredictionBoostUsage
        {
            PredictionId = predictionId,
            UserId       = CurrentUserId,
            BoostId      = boostId,
            IsRevealed   = false,
            WasBlocked   = blockedNow, // bouclier consomme si sabotage retroactif bloque
        });

        await _db.SaveChangesAsync();

        var msg = blockedNow
            ? "Bouclier deploye et sabotage entrant bloque !"
            : "Bouclier deploye. Tu es protege contre le prochain sabotage.";

        return Ok(new { message = msg, blockedSabotageCount = incomingSabotages.Count });
    }

    // =========================================================
    //  Helpers prives
    // =========================================================

    private async Task<UserBoost?> FindActiveUserBoost(BoostType type)
    {
        return await _db.UserBoosts
            .Include(ub => ub.Boost)
            .FirstOrDefaultAsync(ub =>
                ub.UserId == CurrentUserId &&
                ub.Boost.BoostType == type &&
                ub.Quantity > 0 &&
                (ub.ExpiresAt == null || ub.ExpiresAt > DateTime.UtcNow));
    }

    private static void ConsumeBoost(UserBoost ub) => ub.Quantity--;

    private async Task<Guid> GetBoostId(BoostType type)
    {
        return (await _db.Boosts.FirstAsync(b => b.BoostType == type)).Id;
    }

    private static BoostUsageResponse MapUsage(PredictionBoostUsage bu, bool reveal) => new()
    {
        Id             = bu.Id,
        BoostName      = bu.Boost.Name,
        BoostType      = bu.Boost.BoostType.ToString(),
        UserId         = reveal ? bu.UserId : "***",
        UserName       = reveal ? (bu.User?.UserName ?? "?") : "???",
        TargetUserId   = reveal ? bu.TargetUserId : null,
        TargetUserName = reveal ? (bu.TargetUser?.UserName ?? null) : null,
        UsedAt         = bu.UsedAt,
        WasBlocked     = bu.WasBlocked,
        IsRevealed     = bu.IsRevealed,
    };
}
