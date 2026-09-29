using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AuraApp.Data;

namespace AuraApp.Controllers;

[ApiController, Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly AuraDbContext db;
    public AdminController(AuraDbContext c) => db = c;

    // ── Summary Stats ──────────────────────────────────────────────────────────
    [HttpGet("summary")]
    public async Task<IActionResult> Summary()
    {
        var totalRevenue = await db.Bookings
            .Where(b => b.Status == "Confirmed")
            .Join(db.Events, b => b.EventId, e => e.Id, (b, e) => b.Quantity * e.Price)
            .SumAsync();

        return Ok(new
        {
            users        = await db.Users.CountAsync(),
            events       = await db.Events.CountAsync(),
            bookings     = await db.Bookings.CountAsync(),
            tickets      = await db.Tickets.CountAsync(),
            subscribers  = await db.Users.CountAsync(u => u.IsSubscribed && (!u.SubscriptionExpiresAt.HasValue || u.SubscriptionExpiresAt > DateTime.UtcNow)),
            pendingSubmissions = await db.EventSubmissions.CountAsync(x => x.Status == "Pending"),
            totalRevenue = totalRevenue,
            resaleListings = await db.ResaleListings.CountAsync(r => r.Status == "Active")
        });
    }

    // ── Per-Event Sales Breakdown ──────────────────────────────────────────────
    [HttpGet("events-sales")]
    public async Task<IActionResult> EventsSales()
    {
        var events = await db.Events
            .OrderByDescending(e => e.TotalTickets - e.AvailableTickets)
            .Select(e => new
            {
                e.Id,
                e.Title,
                e.Category,
                e.Venue,
                e.Location,
                e.EventDate,
                e.Price,
                e.Currency,
                e.TotalTickets,
                e.AvailableTickets,
                TicketsSold   = e.TotalTickets - e.AvailableTickets,
                Revenue       = (e.TotalTickets - e.AvailableTickets) * e.Price,
                SoldPercent   = e.TotalTickets > 0
                    ? (int)((e.TotalTickets - e.AvailableTickets) * 100 / e.TotalTickets)
                    : 0
            })
            .ToListAsync();

        return Ok(events);
    }

    // ── All Users ──────────────────────────────────────────────────────────────
    [HttpGet("users")]
    public async Task<IActionResult> Users()
    {
        var users = await db.Users
            .OrderBy(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                u.Phone,
                u.Role,
                u.IsSubscribed,
                u.SubscriptionExpiresAt,
                u.CreatedAt,
                BookingCount = db.Bookings.Count(b => b.UserId == u.Id),
                TotalSpent   = db.Bookings
                    .Where(b => b.UserId == u.Id && b.Status == "Confirmed")
                    .Join(db.Events, b => b.EventId, e => e.Id, (b, e) => b.Quantity * e.Price)
                    .Sum()
            })
            .ToListAsync();

        return Ok(users);
    }

    // ── All Bookings ───────────────────────────────────────────────────────────
    [HttpGet("bookings")]
    public async Task<IActionResult> Bookings()
    {
        var bookings = await db.Bookings
            .OrderByDescending(b => b.BookingDate)
            .Select(b => new
            {
                b.Id,
                b.BookingCode,
                b.UserName,
                b.UserEmail,
                b.EventTitle,
                b.Quantity,
                b.PaymentMethod,
                b.BookingDate,
                b.Status,
                TotalAmount = b.Event == null ? 0 : b.Event.Price * b.Quantity,
                EventDate   = b.Event == null ? (DateTime?)null : b.Event.EventDate,
                Venue       = b.Event == null ? "" : b.Event.Venue
            })
            .ToListAsync();

        return Ok(bookings);
    }

    // ── Revenue by Month (last 6) ──────────────────────────────────────────────
    [HttpGet("revenue-chart")]
    public async Task<IActionResult> RevenueChart()
    {
        var bookings = await db.Bookings
            .Where(b => b.Status == "Confirmed" && b.BookingDate >= DateTime.UtcNow.AddMonths(-6))
            .Join(db.Events, b => b.EventId, e => e.Id,
                (b, e) => new { b.BookingDate, b.Quantity, e.Price })
            .ToListAsync();

        var months = Enumerable.Range(0, 6)
            .Select(i => DateTime.UtcNow.AddMonths(-5 + i))
            .Select(d => new
            {
                label   = d.ToString("MMM"),
                year    = d.Year,
                month   = d.Month,
                revenue = bookings
                    .Where(b => b.BookingDate.Year == d.Year && b.BookingDate.Month == d.Month)
                    .Sum(b => b.Quantity * b.Price),
                bookingCount = bookings
                    .Count(b => b.BookingDate.Year == d.Year && b.BookingDate.Month == d.Month)
            })
            .ToList();

        return Ok(months);
    }

    // ── Pending Event Submissions ──────────────────────────────────────────────
    [HttpGet("submissions")]
    public async Task<IActionResult> Submissions()
    {
        return Ok(await db.EventSubmissions
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync());
    }

    // ── All Resale Listings (Selling Options) ──────────────────────────────────
    [HttpGet("resale-listings")]
    public async Task<IActionResult> ResaleListings()
    {
        var listings = await db.ResaleListings
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                r.TicketId,
                r.SellerUserId,
                r.AskingPrice,
                r.Status,
                r.CreatedAt,
                TicketCode = db.Tickets.Where(t => t.Id == r.TicketId).Select(t => t.TicketCode).FirstOrDefault() ?? "",
                SellerName = db.Users.Where(u => u.Id == r.SellerUserId).Select(u => u.FullName).FirstOrDefault() ?? "Unknown User",
                SellerEmail = db.Users.Where(u => u.Id == r.SellerUserId).Select(u => u.Email).FirstOrDefault() ?? "",
                EventTitle = db.Tickets.Where(t => t.Id == r.TicketId).Select(t => t.Event != null ? t.Event.Title : "Unknown Event").FirstOrDefault() ?? "Unknown Event",
                EventVenue = db.Tickets.Where(t => t.Id == r.TicketId).Select(t => t.Event != null ? t.Event.Venue : "").FirstOrDefault() ?? ""
            })
            .ToListAsync();

        return Ok(listings);
    }

    // ── Delete / Cancel Resale Listing (Selling Option) ─────────────────────────
    [HttpDelete("resale/{id:int}")]
    [HttpPost("resale/{id:int}/delete")]
    public async Task<IActionResult> DeleteResaleListing(int id)
    {
        var listing = await db.ResaleListings.FindAsync(id);
        if (listing == null) return NotFound(new { message = "Selling option listing not found." });

        var ticket = await db.Tickets.FindAsync(listing.TicketId);
        if (ticket != null && ticket.Status == "Listed")
        {
            ticket.Status = "Valid";
        }

        listing.Status = "Cancelled";
        db.ResaleListings.Remove(listing);
        await db.SaveChangesAsync();

        return Ok(new { message = "Selling option deleted and ticket restored to owner successfully." });
    }

    // ── Submission Approval & Rejection ─────────────────────────────────────────
    [HttpPost("submissions/{id:int}/approve")]
    public async Task<IActionResult> ApproveSubmission(int id)
    {
        var sub = await db.EventSubmissions.FindAsync(id);
        if (sub == null) return NotFound(new { message = "Submission not found." });

        sub.Status = "Approved";

        var evt = new AuraApp.Models.Event
        {
            Title = sub.Title,
            Description = sub.Description,
            Category = string.IsNullOrWhiteSpace(sub.Category) ? "Concert" : sub.Category,
            Venue = sub.Venue,
            Location = sub.Location,
            EventDate = sub.EventDate,
            Price = sub.Price,
            Currency = "BDT",
            TotalTickets = sub.Quantity > 0 ? sub.Quantity : 100,
            AvailableTickets = sub.Quantity > 0 ? sub.Quantity : 100,
            ImageUrl = string.IsNullOrWhiteSpace(sub.ImageUrl) ? "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1000" : sub.ImageUrl,
            OrganizerUserId = sub.UserId
        };
        db.Events.Add(evt);
        await db.SaveChangesAsync();

        return Ok(new { message = "Submission approved and event published.", eventId = evt.Id });
    }

    [HttpPost("submissions/{id:int}/reject")]
    public async Task<IActionResult> RejectSubmission(int id)
    {
        var sub = await db.EventSubmissions.FindAsync(id);
        if (sub == null) return NotFound(new { message = "Submission not found." });

        sub.Status = "Rejected";
        await db.SaveChangesAsync();

        return Ok(new { message = "Submission rejected." });
    }

    [HttpDelete("submissions/{id:int}")]
    public async Task<IActionResult> DeleteSubmission(int id)
    {
        var sub = await db.EventSubmissions.FindAsync(id);
        if (sub == null) return NotFound(new { message = "Submission not found." });

        db.EventSubmissions.Remove(sub);
        await db.SaveChangesAsync();

        return Ok(new { message = "Submission deleted successfully." });
    }

    // ── Delete Event ────────────────────────────────────────────────────────────
    [HttpDelete("events/{id:int}")]
    public async Task<IActionResult> DeleteEvent(int id)
    {
        var evt = await db.Events.FindAsync(id);
        if (evt == null) return NotFound(new { message = "Event not found." });

        db.Events.Remove(evt);
        await db.SaveChangesAsync();

        return Ok(new { message = "Event deleted successfully." });
    }

    // ── Delete User ─────────────────────────────────────────────────────────────
    [HttpDelete("users/{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await db.Users.FindAsync(id);
        if (user == null) return NotFound(new { message = "User not found." });
        if (user.Role == "Admin") return BadRequest(new { message = "Cannot delete an administrator account." });

        db.Users.Remove(user);
        await db.SaveChangesAsync();

        return Ok(new { message = "User deleted successfully." });
    }

    // ── Buyers Information & Purchase Confirmations ───────────────────────────
    [HttpGet("buyers")]
    public async Task<IActionResult> Buyers()
    {
        var buyers = await db.Bookings
            .OrderByDescending(b => b.BookingDate)
            .Select(b => new
            {
                b.Id,
                BookingId       = b.Id,
                BuyerName       = string.IsNullOrWhiteSpace(b.UserName) ? (b.User != null ? b.User.FullName : "Guest Buyer") : b.UserName,
                BuyerEmail      = string.IsNullOrWhiteSpace(b.UserEmail) ? (b.User != null ? b.User.Email : "buyer@aura.com") : b.UserEmail,
                EventTitle      = b.EventTitle ?? (b.Event != null ? b.Event.Title : "General Ticket"),
                TicketCode      = b.BookingCode,
                ConfirmationSign = "CONF-" + b.BookingCode,
                Quantity        = b.Quantity,
                TotalAmount     = b.Event != null ? b.Event.Price * b.Quantity : 300 * b.Quantity,
                PaymentMethod   = b.PaymentMethod,
                PurchaseDate    = b.BookingDate,
                Status          = b.Status,
                AdminName       = "Maliha Parvin"
            })
            .ToListAsync();

        return Ok(buyers);
    }

    // ── Delete Confirmation Sign / Booking (Admin Maliha Action) ─────────────
    [HttpDelete("confirmation-sign/{id:int}")]
    [HttpPost("confirmation-sign/{id:int}/delete")]
    public async Task<IActionResult> DeleteConfirmationSign(int id)
    {
        var booking = await db.Bookings.FindAsync(id);
        if (booking == null) return NotFound(new { message = "Buyer confirmation sign record not found." });

        // Optionally remove associated tickets
        var tickets = await db.Tickets.Where(t => t.BookingId == id).ToListAsync();
        db.Tickets.RemoveRange(tickets);

        db.Bookings.Remove(booking);
        await db.SaveChangesAsync();

        return Ok(new { message = "Confirmation sign and purchase record deleted by Admin Maliha.", deletedId = id });
    }

    // ── Delete Booking ─────────────────────────────────────────────────────────
    [HttpDelete("bookings/{id:int}")]
    [HttpPost("bookings/{id:int}/delete")]
    public async Task<IActionResult> DeleteBooking(int id)
    {
        var booking = await db.Bookings.FindAsync(id);
        if (booking == null) return NotFound(new { message = "Booking not found." });

        db.Bookings.Remove(booking);
        await db.SaveChangesAsync();

        return Ok(new { message = "Booking deleted successfully by Admin Maliha." });
    }
}


