using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AuraApp.Data;
using AuraApp.Models;

namespace AuraApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubscriptionsController : ControllerBase
    {
        private readonly AuraDbContext _context;

        public SubscriptionsController(AuraDbContext context)
        {
            _context = context;
        }

        [HttpPost("subscribe")]
        public async Task<IActionResult> Subscribe([FromBody] SubscribeDto dto)
        {
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
                        IsSubscribed = true,
                        SubscriptionExpiresAt = DateTime.UtcNow.AddDays(30),
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();
                }
            }

            var txId = "SUB-FREE-" + Guid.NewGuid().ToString("N")[..8].ToUpper();
            var subscription = new Subscription
            {
                UserId = user.Id,
                UserName = user.FullName,
                UserEmail = user.Email,
                UserPhone = user.Phone,
                PlanName = string.IsNullOrWhiteSpace(dto.PlanName) ? "Pro Organizer (FREE)" : dto.PlanName,
                Amount = 0,
                PaymentMethod = "FREE",
                TransactionId = txId,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddYears(10)
            };

            user.IsSubscribed = true;
            user.SubscriptionExpiresAt = subscription.ExpiresAt;

            _context.Subscriptions.Add(subscription);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Congratulations! Your Pro Organizer subscription is now active.",
                subscription = new
                {
                    subscription.Id,
                    subscription.PlanName,
                    subscription.Amount,
                    subscription.PaymentMethod,
                    subscription.TransactionId,
                    subscription.ExpiresAt
                },
                user = new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.IsSubscribed,
                    user.SubscriptionExpiresAt
                }
            });
        }

        [HttpGet("status/{userId}")]
        public async Task<IActionResult> GetSubscriptionStatus(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            return Ok(new
            {
                user.Id,
                user.IsSubscribed,
                user.SubscriptionExpiresAt,
                canSell = user.IsSubscribed && (user.SubscriptionExpiresAt == null || user.SubscriptionExpiresAt > DateTime.UtcNow)
            });
        }
    }
}
