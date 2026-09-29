using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AuraApp.Data;
using AuraApp.Models;
namespace AuraApp.Controllers;
[ApiController,Route("api/subscriptions")]
public class SubscriptionsController:ControllerBase
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

            string payMethod = string.IsNullOrWhiteSpace(dto.PaymentMethod) ? "FREE" : dto.PaymentMethod;
            if (!string.IsNullOrWhiteSpace(dto.PaymentSubMethod))
            {
                payMethod = $"{dto.PaymentMethod} ({dto.PaymentSubMethod})";
            }
            else if (dto.PaymentMethod == "Card" && !string.IsNullOrWhiteSpace(dto.CardType))
            {
                payMethod = $"Card ({dto.CardType})";
            }

            string txPrefix = dto.PaymentMethod switch
            {
                "bKash" => "SUB-BKASH-",
                "Nagad" => "SUB-NAGAD-",
                "Card" => "SUB-CARD-",
                _ => "SUB-FREE-"
            };

            var txId = txPrefix + Guid.NewGuid().ToString("N")[..8].ToUpper();
            var subscription = new Subscription
            {
                UserId = user.Id,
                UserName = user.FullName,
                UserEmail = user.Email,
                UserPhone = user.Phone,
                PlanName = string.IsNullOrWhiteSpace(dto.PlanName) ? "Pro Organizer Pass" : dto.PlanName,
                Amount = payMethod == "FREE" ? 0 : 999,
                PaymentMethod = payMethod,
                TransactionId = txId,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddYears(1)
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

        [HttpGet("all")]
        public async Task<IActionResult> GetAllSubscriptions()
        {
            var subs = await _context.Subscriptions
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            if (!subs.Any())
            {
                var users = await _context.Users.Where(u => u.IsSubscribed).ToListAsync();
                subs = users.Select(u => new Subscription
                {
                    Id = u.Id,
                    UserId = u.Id,
                    UserName = string.IsNullOrWhiteSpace(u.FullName) ? "Maliha" : u.FullName,
                    UserEmail = string.IsNullOrWhiteSpace(u.Email) ? "maliha@aura.com" : u.Email,
                    UserPhone = string.IsNullOrWhiteSpace(u.Phone) ? "+880 1700-000000" : u.Phone,
                    PlanName = "Pro Organizer Pass",
                    Amount = 0,
                    PaymentMethod = "FREE / bKash",
                    TransactionId = "SUB-PRO-" + u.Id,
                    CreatedAt = u.CreatedAt,
                    ExpiresAt = u.SubscriptionExpiresAt ?? DateTime.UtcNow.AddYears(1)
                }).ToList();
            }

            return Ok(subs);
        }
    }
}
