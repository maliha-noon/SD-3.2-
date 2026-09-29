using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AuraApp.Data;
using AuraApp.Models;
namespace AuraApp.Controllers;
[ApiController, Route("api/events")]
public class EventsController : ControllerBase
{
    private readonly AuraDbContext db;
    public EventsController(AuraDbContext context) => db=context;
    private int? UserId => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)?id:null;
    [HttpGet]
    public async Task<IActionResult> GetEvents([FromQuery]string? q,[FromQuery]string? category,[FromQuery]string? location,[FromQuery]DateTime? from,[FromQuery]DateTime? to,[FromQuery]decimal? minPrice,[FromQuery]decimal? maxPrice,[FromQuery]string? sort)
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
                return Unauthorized(new { message = "Only Subscribed Pro Organizers can list and sell tickets on AURA. Please subscribe to unlock seller features." });
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
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetEvent(int id)
    {
        var e = await db.Events.AsNoTracking().Where(x => x.Id == id)
            .Select(x => new { x.Id, x.Title, x.Description, x.Venue, x.Location, x.EventDate, x.Price, x.Currency, x.ImageUrl, x.TotalTickets, x.AvailableTickets, x.Category, x.OrganizerUserId })
            .FirstOrDefaultAsync();
        if (e == null) return NotFound(new { message = "Event not found." });
        var organizerName = e.OrganizerUserId.HasValue
            ? await db.Users.AsNoTracking().Where(u => u.Id == e.OrganizerUserId.Value).Select(u => u.FullName).FirstOrDefaultAsync()
            : null;
        return Ok(new { e.Id, e.Title, e.Description, e.Venue, e.Location, e.EventDate, e.Price, e.Currency, e.ImageUrl, e.TotalTickets, e.AvailableTickets, e.Category, e.OrganizerUserId, OrganizerName = organizerName });
    }
    [HttpGet("saved"),Authorize]
    public async Task<IActionResult> Saved()=>Ok(await db.SavedEvents.Where(x=>x.UserId==UserId).Join(db.Events,x=>x.EventId,e=>e.Id,(x,e)=>e).ToListAsync());
    [HttpPost("{id:int}/save"),Authorize]
    public async Task<IActionResult> Save(int id){if(!await db.Events.AnyAsync(e=>e.Id==id))return NotFound();var saved=await db.SavedEvents.FirstOrDefaultAsync(x=>x.UserId==UserId&&x.EventId==id);if(saved==null)db.SavedEvents.Add(new SavedEvent{UserId=UserId!.Value,EventId=id});else db.SavedEvents.Remove(saved);await db.SaveChangesAsync();return Ok(new{saved=saved==null});}
    [HttpPost("create"),Authorize(Roles="Admin")]
    public async Task<IActionResult> CreateEvent(CreateEventDto dto){var user=await db.Users.FindAsync(UserId!.Value);if(user==null)return Unauthorized();if(!Active(user))return Forbid();if(string.IsNullOrWhiteSpace(dto.Title)||dto.EventDate<=DateTime.UtcNow||dto.TotalTickets<1||dto.Price<0)return BadRequest(new{message="Enter a title, future date, positive ticket quantity and valid price."});var e=new Event{Title=dto.Title.Trim(),Description=dto.Description,Venue=dto.Venue,Location=dto.Location,EventDate=dto.EventDate,Price=dto.Price,Currency="BDT",ImageUrl=dto.ImageUrl,TotalTickets=dto.TotalTickets,AvailableTickets=dto.TotalTickets,Category=dto.Category??"Concert",OrganizerUserId=user.Id};db.Events.Add(e);await db.SaveChangesAsync();return Ok(new{message="Event created.",evt=e});}
    [HttpPost("submit"),Authorize]
    public async Task<IActionResult> Submit(CreateEventDto dto){var user=await db.Users.FindAsync(UserId!.Value);if(user==null)return Unauthorized();if(!Active(user))return StatusCode(403,new{message="Bring your event to AURA with an active subscription."});if(string.IsNullOrWhiteSpace(dto.Title)||dto.EventDate<=DateTime.UtcNow)return BadRequest(new{message="Enter an event name and a future date."});var s=new EventSubmission{UserId=user.Id,Title=dto.Title.Trim(),Category=dto.Category??"Concert",Description=dto.Description,Venue=dto.Venue,Location=dto.Location,EventDate=dto.EventDate,Price=dto.Price,Quantity=dto.TotalTickets,ImageUrl=dto.ImageUrl??"",ContactEmail=string.IsNullOrWhiteSpace(dto.ContactEmail)?user.Email:dto.ContactEmail,ContactPhone=string.IsNullOrWhiteSpace(dto.ContactPhone)?user.Phone:dto.ContactPhone};db.EventSubmissions.Add(s);await db.SaveChangesAsync();return Ok(new{message="Your event submission is pending review.",submission=s});}
    private static bool Active(User u)=>u.IsSubscribed&&(!u.SubscriptionExpiresAt.HasValue||u.SubscriptionExpiresAt> DateTime.UtcNow);
}
