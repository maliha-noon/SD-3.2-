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

            string effectiveMethod = dto.PaymentMethod;
            if (!string.IsNullOrWhiteSpace(dto.PaymentSubMethod))
            {
                effectiveMethod = $"{dto.PaymentMethod} ({dto.PaymentSubMethod})";
            }
            else if (dto.PaymentMethod == "Card" && !string.IsNullOrWhiteSpace(dto.CardType))
            {
                effectiveMethod = $"Card ({dto.CardType})";
            }

            string paymentAccount = dto.PaymentMethod switch
            {
                "bKash" => !string.IsNullOrEmpty(dto.AccountNumber) ? dto.AccountNumber : "bKash Account",
                "Nagad" => !string.IsNullOrEmpty(dto.AccountNumber) ? dto.AccountNumber : "Nagad Account",
                "Card" => !string.IsNullOrEmpty(dto.CardNumber) && dto.CardNumber.Length >= 4
                          ? $"{(!string.IsNullOrWhiteSpace(dto.CardType) ? dto.CardType : "Card")} **** {dto.CardNumber[^4..]}"
                          : (!string.IsNullOrWhiteSpace(dto.CardHolderName) ? dto.CardHolderName : "Card Payment"),
                _ => !string.IsNullOrEmpty(dto.AccountNumber) ? dto.AccountNumber : dto.PaymentMethod
            };

            string txPrefix = dto.PaymentMethod switch
            {
                "bKash" => "BKASH-",
                "Nagad" => "NAGAD-",
                "Card" => (!string.IsNullOrWhiteSpace(dto.CardType) && dto.CardType.ToUpper().Contains("AMEX")) ? "AMEX-" :
                          (!string.IsNullOrWhiteSpace(dto.CardType) && dto.CardType.ToUpper().Contains("VISA")) ? "VISA-" :
                          (!string.IsNullOrWhiteSpace(dto.CardType) && dto.CardType.ToUpper().Contains("MASTER")) ? "MC-" : "CARD-",
                _ => "TXN-"
            };

            var txId = txPrefix + Guid.NewGuid().ToString("N")[..10].ToUpper();
            var seat = !string.IsNullOrWhiteSpace(dto.SeatNumber) ? dto.SeatNumber : ("A-" + Random.Shared.Next(1, 50));

            var booking = new Booking
            {
                UserId = user.Id,
                EventId = dto.EventId,
                UserName = user.FullName,
                UserEmail = user.Email,
                EventTitle = evt.Title,
                Quantity = dto.Quantity,
                SeatNumber = seat,
                PaymentMethod = effectiveMethod,
                PaymentAccount = paymentAccount,
                TransactionId = txId,
                BookingDate = DateTime.UtcNow,
                BookingCode = "TKT-" + Guid.NewGuid().ToString("N")[..8].ToUpper(),
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
                    SeatNumber = booking.SeatNumber,
                    TotalAmount = evt.Price * dto.Quantity,
                    booking.Quantity,
                    booking.PaymentMethod,
                    booking.TransactionId,
                    booking.Status,
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
                    SeatNumber = "A-25",
                    EventTitle = !string.IsNullOrEmpty(b.EventTitle) ? b.EventTitle : (b.Event != null ? b.Event.Title : "Event Ticket"),
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

        [HttpGet("all")]
        public async Task<IActionResult> GetAllBookings()
        {
            var bookings = await _context.Bookings
                .Include(b => b.Event)
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
                    TotalAmount = b.Event != null ? b.Event.Price * b.Quantity : 0,
                    b.PaymentMethod,
                    b.TransactionId,
                    b.BookingDate,
                    b.Status,
                    Venue = b.Event != null ? b.Event.Venue : "City Convention Center",
                    Location = b.Event != null ? b.Event.Location : "Dhaka, Bangladesh",
                    EventDate = b.Event != null ? b.Event.EventDate : b.BookingDate
                })
                .ToListAsync();

            return Ok(bookings);
        }

        public class ScanRequestDto
        {
            public string Code { get; set; } = string.Empty;
        }

        [HttpPost("verify")]
        public async Task<IActionResult> VerifyTicket([FromBody] ScanRequestDto dto)
        {
            var code = (dto.Code ?? string.Empty).Trim().ToUpper();
            var booking = await _context.Bookings
                .Include(b => b.Event)
                .FirstOrDefaultAsync(b => b.BookingCode.ToUpper() == code || b.TransactionId.ToUpper() == code);

            if (booking == null)
            {
                return NotFound(new { valid = false, status = "NOT_FOUND", message = $"No ticket record found matching '{code}'." });
            }

            bool isUsed = booking.Status == "Checked In";
            return Ok(new
            {
                valid = !isUsed,
                status = isUsed ? "USED" : "VALID",
                message = isUsed ? "Ticket has already been checked-in!" : "Ticket is Valid and Ready for Gate Entry!",
                booking = new
                {
                    booking.Id,
                    booking.BookingCode,
                    EventTitle = booking.EventTitle ?? booking.Event?.Title,
                    booking.UserName,
                    booking.UserEmail,
                    booking.Quantity,
                    booking.Status,
                    booking.PaymentMethod
                }
            });
        }

        [HttpPost("checkin")]
        public async Task<IActionResult> CheckInTicket([FromBody] ScanRequestDto dto)
        {
            var code = (dto.Code ?? string.Empty).Trim().ToUpper();
            var booking = await _context.Bookings
                .Include(b => b.Event)
                .FirstOrDefaultAsync(b => b.BookingCode.ToUpper() == code || b.TransactionId.ToUpper() == code);

            if (booking == null)
            {
                return NotFound(new { success = false, message = "Ticket code invalid or not found." });
            }

            if (booking.Status == "Checked In")
            {
                return BadRequest(new { success = false, status = "ALREADY_USED", message = $"Ticket {booking.BookingCode} was ALREADY checked in." });
            }

            booking.Status = "Checked In";
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"TICKET VALIDATED! Welcome {booking.UserName} to {booking.EventTitle}",
                booking
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBooking(int id)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null)
            {
                return NotFound(new { success = false, message = "Booking record not found." });
            }

            if (booking.EventId > 0)
            {
                var evt = await _context.Events.FindAsync(booking.EventId);
                if (evt != null)
                {
                    evt.AvailableTickets += booking.Quantity;
                }
            }

            _context.Bookings.Remove(booking);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = $"Booking #{id} deleted successfully." });
        }
    }
}

