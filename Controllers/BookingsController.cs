using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AuraApp.Data;
using AuraApp.Models;

namespace AuraApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingsController : ControllerBase
    {
        private readonly AuraDbContext _context;

        public BookingsController(AuraDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateBooking([FromBody] CreateBookingDto dto)
        {
            var evt = await _context.Events.FindAsync(dto.EventId);
            if (evt == null)
            {
                return NotFound(new { message = "Event not found." });
            }

            if (evt.AvailableTickets < dto.Quantity)
            {
                return BadRequest(new { message = "Not enough available tickets." });
            }

            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null)
            {
                user = await _context.Users.FirstOrDefaultAsync();
                if (user == null)
                {
                    user = new User
                    {
                        FullName = "Maliha xd",
                        Email = "maliha@aura.com",
                        Phone = "01700000000",
                        PasswordHash = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
                        IsSubscribed = false,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();
                }
            }

            string paymentAccount = dto.PaymentMethod switch
            {
                "bKash" => dto.AccountNumber,
                "Nagad" => dto.AccountNumber,
                "Card" => !string.IsNullOrEmpty(dto.CardNumber) && dto.CardNumber.Length >= 4
                          ? "**** **** **** " + dto.CardNumber[^4..]
                          : "Card Payment",
                _ => dto.AccountNumber
            };

            var txId = "TXN-" + Guid.NewGuid().ToString("N")[..10].ToUpper();

            var booking = new Booking
            {
                UserId = user.Id,
                EventId = dto.EventId,
                UserName = user.FullName,
                UserEmail = user.Email,
                EventTitle = evt.Title,
                Quantity = dto.Quantity,
                PaymentMethod = dto.PaymentMethod,
                PaymentAccount = paymentAccount,
                TransactionId = txId,
                BookingDate = DateTime.UtcNow,
                BookingCode = "AURA-" + Guid.NewGuid().ToString("N")[..8].ToUpper(),
                Status = "Confirmed"
            };

            evt.AvailableTickets -= dto.Quantity;
            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Booking confirmed successfully!",
                booking = new
                {
                    booking.Id,
                    booking.BookingCode,
                    TotalAmount = evt.Price * dto.Quantity,
                    booking.Quantity,
                    booking.PaymentMethod,
                    booking.TransactionId,
                    EventTitle = evt.Title,
                    evt.Venue,
                    evt.Location,
                    evt.EventDate
                }
            });
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserBookings(int userId)
        {
            var bookings = await _context.Bookings
                .Include(b => b.Event)
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.BookingDate)
                .Select(b => new
                {
                    b.Id,
                    b.BookingCode,
                    b.Quantity,
                    TotalAmount = b.Event != null ? b.Event.Price * b.Quantity : 0,
                    b.PaymentMethod,
                    b.TransactionId,
                    b.BookingDate,
                    b.Status,
                    Event = new
                    {
                        b.Event!.Id,
                        b.Event.Title,
                        b.Event.Venue,
                        b.Event.Location,
                        b.Event.EventDate,
                        b.Event.Price,
                        b.Event.Currency,
                        b.Event.ImageUrl
                    }
                })
                .ToListAsync();

            return Ok(bookings);
        }
    }
}
