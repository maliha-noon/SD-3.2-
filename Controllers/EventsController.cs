using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AuraApp.Data;
using AuraApp.Models;

namespace AuraApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EventsController : ControllerBase
    {
        private readonly AuraDbContext _context;

        public EventsController(AuraDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetEvents()
        {
            var events = await _context.Events.OrderBy(e => e.EventDate).ToListAsync();
            return Ok(events);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetEvent(int id)
        {
            var evt = await _context.Events.FindAsync(id);
            if (evt == null)
            {
                return NotFound(new { message = "Event not found." });
            }
            return Ok(evt);
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateEvent([FromBody] CreateEventDto dto)
        {
            var user = await _context.Users.FindAsync(dto.OrganizerUserId);
            if (user == null)
            {
                return BadRequest(new { message = "Organizer user not found." });
            }

            if (!user.IsSubscribed || (user.SubscriptionExpiresAt.HasValue && user.SubscriptionExpiresAt < DateTime.UtcNow))
            {
                return Unauthorized(new { message = "Only Subscribed Pro Organizers can list and sell tickets on AURA++. Please subscribe to unlock seller features." });
            }

            var evt = new Event
            {
                Title = dto.Title,
                Description = dto.Description,
                Venue = dto.Venue,
                Location = dto.Location,
                EventDate = dto.EventDate,
                Price = dto.Price,
                Currency = dto.Currency ?? "BDT",
                ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl)
                    ? "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800"
                    : dto.ImageUrl,
                TotalTickets = dto.TotalTickets,
                AvailableTickets = dto.TotalTickets,
                Category = dto.Category ?? "Concert",
                OrganizerUserId = dto.OrganizerUserId,
                SellerPaymentMethod = string.IsNullOrWhiteSpace(dto.SellerPaymentMethod) ? "bKash" : dto.SellerPaymentMethod,
                SellerAccountNumber = dto.SellerAccountNumber ?? string.Empty,
                SellerBankName = dto.SellerBankName ?? string.Empty,
                SellerAccountHolder = dto.SellerAccountHolder ?? string.Empty
            };

            _context.Events.Add(evt);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Event created successfully and listed for ticket sales!",
                evt
            });
        }
    }
}
