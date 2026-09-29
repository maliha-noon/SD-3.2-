using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AuraApp.Data;
using AuraApp.Models;

namespace AuraApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly AuraDbContext _context;

        public DashboardController(AuraDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gets overall system analytics summary stats for the master dashboard.
        /// </summary>
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var totalBookings = await _context.Bookings.CountAsync();
            var acceptedCount = await _context.Bookings.CountAsync(b => b.Status == "Confirmed" || b.Status == "Accepted");
            var pendingCount = await _context.Bookings.CountAsync(b => b.Status == "Pending");
            
            var bookingsWithEvents = await _context.Bookings.Include(b => b.Event).ToListAsync();
            var totalRevenue = bookingsWithEvents.Sum(b => (b.Event != null ? b.Event.Price * b.Quantity : 300 * b.Quantity));

            var totalEvents = await _context.Events.CountAsync();
            var activeSubscriptions = await _context.Subscriptions.CountAsync();

            return Ok(new
            {
                totalBookings,
                acceptedCount,
                pendingCount,
                totalRevenue,
                totalEvents,
                activeSubscriptions
            });
        }

        /// <summary>
        /// Gets all system booking records with optional status filter (ALL, ACCEPTED, PENDING).
        /// </summary>
        [HttpGet("records")]
        public async Task<IActionResult> GetRecords([FromQuery] string status = "ALL")
        {
            var query = _context.Bookings.Include(b => b.Event).AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                if (status.Equals("ACCEPTED", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(b => b.Status == "Confirmed" || b.Status == "Accepted");
                }
                else if (status.Equals("PENDING", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(b => b.Status == "Pending");
                }
            }

            var records = await query
                .OrderByDescending(b => b.BookingDate)
                .Select(b => new
                {
                    b.Id,
                    b.BookingCode,
                    SeatNumber = "A-25",
                    b.UserName,
                    b.UserEmail,
                    EventTitle = !string.IsNullOrEmpty(b.EventTitle) ? b.EventTitle : (b.Event != null ? b.Event.Title : "Event Ticket"),
                    b.Quantity,
                    TotalAmount = b.Event != null ? b.Event.Price * b.Quantity : 300 * b.Quantity,
                    b.PaymentMethod,
                    b.TransactionId,
                    b.BookingDate,
                    b.Status,
                    Venue = b.Event != null ? b.Event.Venue : "City Stadium",
                    Location = b.Event != null ? b.Event.Location : "Dhaka, Bangladesh",
                    EventDate = b.Event != null ? b.Event.EventDate : b.BookingDate
                })
                .ToListAsync();

            return Ok(records);
        }

        /// <summary>
        /// Gets all subscription pass records.
        /// </summary>
        [HttpGet("subscriptions")]
        public async Task<IActionResult> GetSubscriptions()
        {
            var subs = await _context.Subscriptions
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
            return Ok(subs);
        }

        /// <summary>
        /// Approves and accepts a pending ticket booking by ID.
        /// </summary>
        [HttpPost("approve/{id}")]
        public async Task<IActionResult> ApproveBooking(int id)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null)
            {
                return NotFound(new { message = "Booking record not found." });
            }

            booking.Status = "Accepted";
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Ticket {booking.BookingCode} status updated to ACCEPTED!",
                booking
            });
        }
    }
}
