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
 private readonly AuraDbContext db; public SubscriptionsController(AuraDbContext c)=>db=c;
 private int? UserId=>int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier),out var id)?id:null;
 [HttpPost("subscribe"),Authorize]
 public IActionResult Subscribe()=>Conflict(new{message="Organizer subscriptions are not currently available."});
 [HttpGet("status/{userId:int}")]
 public async Task<IActionResult> Status(int userId){if(UserId!=userId)return User.Identity?.IsAuthenticated==true?Forbid():Unauthorized();var u=await db.Users.FindAsync(userId);return u==null?NotFound():Ok(new{u.Id,IsSubscribed=u.IsSubscribed&&(!u.SubscriptionExpiresAt.HasValue||u.SubscriptionExpiresAt>DateTime.UtcNow),u.SubscriptionExpiresAt,canSell=u.IsSubscribed&&(!u.SubscriptionExpiresAt.HasValue||u.SubscriptionExpiresAt>DateTime.UtcNow)});}
 [HttpGet("status"),Authorize]
 public async Task<IActionResult> MyStatus(){var u=await db.Users.FindAsync(UserId!.Value);if(u==null)return Unauthorized();return Ok(new{u.IsSubscribed,u.SubscriptionExpiresAt,canSell=u.IsSubscribed&&(!u.SubscriptionExpiresAt.HasValue||u.SubscriptionExpiresAt>DateTime.UtcNow)});}
}
