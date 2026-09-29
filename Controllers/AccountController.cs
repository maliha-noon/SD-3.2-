using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AuraApp.Data;
using AuraApp.Models;

namespace AuraApp.Controllers;

[ApiController]
[Route("api/account")]
public class AccountController : ControllerBase
{
    private readonly AuraDbContext db;
    public AccountController(AuraDbContext context) => db = context;

    private int? CurrentUserId => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    private async Task<User?> GetActiveUserAsync()
    {
        var id = CurrentUserId;
        if (id.HasValue)
        {
            var user = await db.Users.FindAsync(id.Value);
            if (user != null) return user;
        }
        return await db.Users.OrderBy(u => u.Id).FirstOrDefaultAsync();
    }

    [HttpGet("profile")]
    public async Task<IActionResult> Profile()
    {
        var u = await GetActiveUserAsync();
        if (u == null) return NotFound(new { message = "User not found." });
        return Ok(new
        {
            u.Id,
            u.FullName,
            u.Email,
            u.Phone,
            u.Preferences,
            IsSubscribed = u.IsSubscribed && (!u.SubscriptionExpiresAt.HasValue || u.SubscriptionExpiresAt > DateTime.UtcNow),
            u.SubscriptionExpiresAt,
            u.CreatedAt,
            u.Role
        });
    }

    public record ProfileDto(string? FullName, string? Email, string? Phone, string? Preferences);

    [HttpPut("profile")]
    public async Task<IActionResult> Update(ProfileDto? d)
    {
        if (d == null) return BadRequest(new { message = "Profile details are required." });
        var u = await GetActiveUserAsync();
        if (u == null) return NotFound(new { message = "User not found." });
        var name = (d.FullName ?? "").Trim();
        var email = (d.Email ?? "").Trim().ToLowerInvariant();
        if (name.Length < 2 || name.Length > 120) return BadRequest(new { message = "Name must be between 2 and 120 characters." });
        if (!new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(email) || email.Length > 254) return BadRequest(new { message = "Enter a valid email address." });
        if ((d.Phone ?? "").Trim().Length > 40) return BadRequest(new { message = "Phone number must be 40 characters or fewer." });
        if ((d.Preferences ?? "").Trim().Length > 300) return BadRequest(new { message = "Favourite categories must be 300 characters or fewer." });
        if (await db.Users.AnyAsync(x => x.Id != u.Id && x.Email.ToLower() == email)) return Conflict(new { message = "That email is already in use." });

        u.FullName = name;
        u.Email = email;
        u.Phone = (d.Phone ?? "").Trim();
        u.Preferences = (d.Preferences ?? "").Trim();
        try { await db.SaveChangesAsync(); }
        catch (DbUpdateException) { return Conflict(new { message = "That email is already in use." }); }

        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, u.Id.ToString()), new Claim(ClaimTypes.Name, u.FullName), new Claim(ClaimTypes.Email, u.Email), new Claim(ClaimTypes.Role, u.Role) };
        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme)));

        return Ok(new
        {
            message = "Profile updated.",
            u.Id,
            u.FullName,
            u.Email,
            u.Phone,
            u.Preferences,
            IsSubscribed = u.IsSubscribed && (!u.SubscriptionExpiresAt.HasValue || u.SubscriptionExpiresAt > DateTime.UtcNow),
            u.SubscriptionExpiresAt,
            u.CreatedAt,
            u.Role
        });
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var u = await GetActiveUserAsync();
        var userId = u?.Id ?? 1;

        var tickets = await db.Tickets.Include(t => t.Event)
            .Where(t => t.OwnerUserId == userId && t.Status == "Valid")
            .OrderBy(t => t.Event!.EventDate)
            .Take(5)
            .Select(t => new { t.TicketCode, t.Event!.Title, t.Event.EventDate, t.Event.ImageUrl })
            .ToListAsync();

        var favorites = await db.SavedEvents.Where(x => x.UserId == userId)
            .Join(db.Events, x => x.EventId, e => e.Id, (x, e) => new { e.Id, e.Title, e.EventDate, e.Category })
            .ToListAsync();

        var submits = await db.EventSubmissions.Where(x => x.UserId == userId)
            .OrderByDescending(x => x.SubmittedAt)
            .Take(5)
            .ToListAsync();

        var listings = await db.ResaleListings.Include(x => x.Ticket)
            .Where(x => x.SellerUserId == userId && x.Status == "Active")
            .CountAsync();

        var recommendations = await db.Events.OrderBy(e => e.EventDate).Take(6).ToListAsync();

        return Ok(new
        {
            upcomingTickets = tickets,
            favorites = favorites,
            submissions = submits,
            activeListings = listings,
            isSubscribed = u != null && u.IsSubscribed && (!u.SubscriptionExpiresAt.HasValue || u.SubscriptionExpiresAt > DateTime.UtcNow),
            recommendations = recommendations
        });
    }

    public record ActivityItem(string Type, DateTime Date, string Title, string Detail);

    [HttpGet("history")]
    public async Task<IActionResult> History()
    {
        var u = await GetActiveUserAsync();
        var userId = u?.Id ?? 1;
        var items = new List<ActivityItem>();

        items.AddRange(await db.Bookings.Where(x => x.UserId == userId).Select(x => new ActivityItem("Purchase", x.BookingDate, x.EventTitle, x.BookingCode)).ToListAsync());
        items.AddRange(await db.VerificationAttempts.Where(x => x.UserId == userId).Select(x => new ActivityItem("Verification", x.CheckedAt, x.Result, x.TicketCode)).ToListAsync());
        items.AddRange(await db.EventSubmissions.Where(x => x.UserId == userId).Select(x => new ActivityItem("Event submission", x.SubmittedAt, x.Title, x.Status)).ToListAsync());
        items.AddRange(await db.Subscriptions.Where(x => x.UserId == userId).Select(x => new ActivityItem("Subscription", x.CreatedAt, x.PlanName, x.TransactionId)).ToListAsync());
        items.AddRange(await db.ResaleListings.Where(x => x.SellerUserId == userId).Join(db.Tickets, x => x.TicketId, t => t.Id, (x, t) => new ActivityItem("Resale listing", x.CreatedAt, t.TicketCode, x.Status)).ToListAsync());
        items.AddRange(await db.TicketTransfers.Where(x => x.FromUserId == userId || x.ToUserId == userId).Join(db.Tickets, x => x.TicketId, t => t.Id, (x, t) => new ActivityItem("Ownership transfer", x.TransferredAt, t.TicketCode, x.FromUserId == userId ? "Transferred" : "Received")).ToListAsync());

        return Ok(items.OrderByDescending(x => x.Date).Take(100));
    }

    [HttpGet("submissions")]
    public async Task<IActionResult> Submissions()
    {
        var u = await GetActiveUserAsync();
        var userId = u?.Id ?? 1;
        return Ok(await db.EventSubmissions.Where(x => x.UserId == userId).OrderByDescending(x => x.SubmittedAt).ToListAsync());
    }

    public record ReminderItem(string Type, string Title, DateTime EventDate, string Detail);

    [HttpGet("notifications")]
    public async Task<IActionResult> Notifications()
    {
        var u = await GetActiveUserAsync();
        var userId = u?.Id ?? 1;
        var now = DateTime.UtcNow;
        var items = new List<ReminderItem>();

        items.AddRange(await db.Tickets.Where(t => t.OwnerUserId == userId && t.Status == "Valid" && t.Event!.EventDate > now && t.Event.EventDate < now.AddDays(30)).Select(t => new ReminderItem("Upcoming ticket", t.Event!.Title, t.Event.EventDate, "Your AURA ticket is ready.")).ToListAsync());
        items.AddRange(await db.SavedEvents.Where(s => s.UserId == userId).Join(db.Events, s => s.EventId, e => e.Id, (s, e) => e).Where(e => e.EventDate > now && e.EventDate < now.AddDays(30)).Select(e => new ReminderItem("Saved event", e.Title, e.EventDate, "An event you saved is coming up.")).ToListAsync());

        return Ok(items.OrderBy(x => x.EventDate));
    }
}
