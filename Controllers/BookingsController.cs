using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AuraApp.Data;
using AuraApp.Models;

namespace AuraApp.Controllers;

[ApiController, Route("api/bookings")]
public class BookingsController : ControllerBase
{
    private readonly AuraDbContext db;
    public BookingsController(AuraDbContext context) => db = context;

    private int? CurrentUserId => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    private async Task<int> GetEffectiveUserIdAsync()
    {
        var id = CurrentUserId;
        if (id.HasValue && await db.Users.AnyAsync(u => u.Id == id.Value)) return id.Value;
        var firstUser = await db.Users.OrderBy(u => u.Id).FirstOrDefaultAsync();
        return firstUser?.Id ?? 1;
    }

    [HttpPost]
    public async Task<IActionResult> CreateBooking(CreateBookingDto dto)
    {
        if (dto.Quantity is < 1 or > 10) return BadRequest(new { message = "Choose between 1 and 10 tickets." });
        if (dto.PaymentMethod != "Reservation") return BadRequest(new { message = "Choose reservation to continue." });

        var userId = await GetEffectiveUserIdAsync();
        var user = await db.Users.FindAsync(userId);
        if (user == null) return Unauthorized(new { message = "User record not found." });

        await using var transaction = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
        var inventoryUpdated = await db.Events.Where(e => e.Id == dto.EventId && e.AvailableTickets >= dto.Quantity)
            .ExecuteUpdateAsync(setters => setters.SetProperty(e => e.AvailableTickets, e => e.AvailableTickets - dto.Quantity));
        if (inventoryUpdated == 0)
        {
            if (!await db.Events.AnyAsync(e => e.Id == dto.EventId)) return NotFound(new { message = "Event not found." });
            return Conflict(new { message = "Not enough tickets are available." });
        }
        var evt = await db.Events.AsNoTracking().FirstAsync(e => e.Id == dto.EventId);

        var booking = new Booking
        {
            UserId = user.Id,
            EventId = evt.Id,
            UserName = user.FullName,
            UserEmail = user.Email,
            EventTitle = evt.Title,
            Quantity = dto.Quantity,
            PaymentMethod = "Reservation",
            PaymentAccount = "",
            TransactionId = "",
            BookingDate = DateTime.UtcNow,
            BookingCode = "AURA-" + Guid.NewGuid().ToString("N")[..10].ToUpperInvariant(),
            Status = "Confirmed"
        };
        db.Bookings.Add(booking);
        await db.SaveChangesAsync();

        for (var i = 0; i < dto.Quantity; i++)
        {
            db.Tickets.Add(new Ticket
            {
                BookingId = booking.Id,
                EventId = evt.Id,
                OwnerUserId = user.Id,
                Price = evt.Price,
                TicketCode = "AURAT-" + Guid.NewGuid().ToString("N")[..12].ToUpperInvariant(),
                Status = "Valid"
            });
        }
        await db.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(new
        {
            message = "Booking confirmed.",
            booking = new
            {
                booking.Id,
                booking.BookingCode,
                booking.Quantity,
                TotalAmount = evt.Price * dto.Quantity,
                booking.PaymentMethod,
                booking.TransactionId,
                EventTitle = evt.Title,
                evt.Venue,
                evt.Location,
                evt.EventDate
            },
            tickets = await db.Tickets.Where(t => t.BookingId == booking.Id).Select(t => t.TicketCode).ToListAsync()
        });
    }

    [HttpGet]
    public async Task<IActionResult> Mine()
    {
        var uid = await GetEffectiveUserIdAsync();
        return Ok(await db.Bookings.Where(b => b.UserId == uid)
            .OrderByDescending(b => b.BookingDate)
            .Select(b => new
            {
                b.Id,
                b.BookingCode,
                b.Quantity,
                TotalAmount = b.Event == null ? 0 : b.Event.Price * b.Quantity,
                b.PaymentMethod,
                b.TransactionId,
                b.BookingDate,
                b.Status,
                Event = b.Event == null ? null : new
                {
                    b.Event.Id,
                    b.Event.Title,
                    b.Event.Venue,
                    b.Event.Location,
                    b.Event.EventDate,
                    b.Event.Price,
                    b.Event.Currency,
                    b.Event.ImageUrl
                }
            }).ToListAsync());
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserBookings(int userId)
    {
        var uid = await GetEffectiveUserIdAsync();
        return Ok(await db.Bookings.Where(b => b.UserId == userId)
            .OrderByDescending(b => b.BookingDate)
            .Select(b => new
            {
                b.Id,
                b.BookingCode,
                b.Quantity,
                TotalAmount = b.Event == null ? 0 : b.Event.Price * b.Quantity,
                b.PaymentMethod,
                b.TransactionId,
                b.BookingDate,
                b.Status,
                b.EventTitle,
                Event = b.Event == null ? null : new
                {
                    b.Event.Id,
                    b.Event.Title,
                    b.Event.Venue,
                    b.Event.Location,
                    b.Event.EventDate,
                    b.Event.Price,
                    b.Event.Currency,
                    b.Event.ImageUrl
                }
            }).ToListAsync());
    }

    [HttpGet("tickets")]
    public async Task<IActionResult> Tickets()
    {
        var uid = await GetEffectiveUserIdAsync();
        return Ok(await db.Tickets.Include(t => t.Event).Include(t => t.Booking)
            .Where(t => t.OwnerUserId == uid)
            .OrderByDescending(t => t.IssuedAt)
            .Select(t => new
            {
                t.Id,
                t.TicketCode,
                t.Status,
                t.Price,
                t.IssuedAt,
                t.EventId,
                Event = t.Event == null ? null : new { t.Event.Title, t.Event.EventDate, t.Event.Venue, t.Event.Location, t.Event.ImageUrl },
                Booking = t.Booking == null ? null : new { t.Booking.BookingCode, t.Booking.TransactionId, t.Booking.BookingDate, t.Booking.PaymentMethod }
            }).ToListAsync());
    }

    [HttpPost("verify")]
    public async Task<IActionResult> VerifyBooking(VerifyBookingDto dto)
    {
        var code = (dto.BookingCode ?? "").Trim().ToUpperInvariant();
        if (code.Length == 0) return BadRequest(new { state = "invalid", message = "Enter a ticket ID to verify." });

        var ticket = await db.Tickets.Include(t => t.Event).Include(t => t.Owner).FirstOrDefaultAsync(t => t.TicketCode == code);
        var booking = ticket == null ? await db.Bookings.Include(b => b.Event).Include(b => b.User).FirstOrDefaultAsync(b => b.BookingCode == code) : null;
        var result = ticket?.Status ?? booking?.Status ?? "NotFound";
        var state = result.Equals("Used", StringComparison.OrdinalIgnoreCase) || result.Equals("Redeemed", StringComparison.OrdinalIgnoreCase) ? "used"
            : result.Equals("Cancelled", StringComparison.OrdinalIgnoreCase) ? "cancelled"
            : result.Equals("Resold", StringComparison.OrdinalIgnoreCase) ? "resold"
            : ticket != null && ticket.Status == "Valid" || booking?.Status == "Confirmed" ? "verified" : "notFound";

        var uid = CurrentUserId;
        db.VerificationAttempts.Add(new VerificationAttempt { UserId = uid, TicketCode = code, Result = state, CheckedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        if (state == "notFound") return NotFound(new { state = "notFound", message = "Ticket not found. This ticket could not be verified through AURA." });

        object ticketInfo = ticket != null
            ? new { ticketId = ticket.TicketCode, ticket.Status, ticket.Price, ticketType = "General admission", @event = ticket.Event?.Title, eventDate = ticket.Event?.EventDate, venue = ticket.Event?.Venue, owner = uid == ticket.OwnerUserId ? ticket.Owner?.FullName : null }
            : new { ticketId = booking!.BookingCode, booking.Status, price = 0m, ticketType = "Booking", @event = booking.Event?.Title, eventDate = booking.Event?.EventDate, venue = booking.Event?.Venue, owner = (string?)null };

        return Ok(new { state, message = state switch { "verified" => "Verified ticket. Ownership and active status confirmed through AURA.", "used" => "Ticket already used.", "cancelled" => "This ticket was cancelled.", "resold" => "This ticket was transferred to a new owner.", _ => "Ticket could not be verified." }, ticket = ticketInfo });
    }

    [HttpGet("verification-history")]
    public async Task<IActionResult> VerificationHistory()
    {
        var uid = await GetEffectiveUserIdAsync();
        return Ok(await db.VerificationAttempts.Where(v => v.UserId == uid)
            .OrderByDescending(v => v.CheckedAt)
            .Take(100)
            .Select(v => new
            {
                v.Id,
                v.TicketCode,
                v.Result,
                v.CheckedAt,
                EventTitle = db.Tickets.Where(t => t.TicketCode == v.TicketCode).Select(t => t.Event!.Title).FirstOrDefault() ?? db.Bookings.Where(b => b.BookingCode == v.TicketCode).Select(b => b.Event!.Title).FirstOrDefault()
            }).ToListAsync());
    }
}
