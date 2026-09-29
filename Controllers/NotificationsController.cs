using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AuraApp.Data;
using AuraApp.Models;

namespace AuraApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly AuraDbContext _context;
        public NotificationsController(AuraDbContext context) => _context = context;

        // GET: /api/notifications?userId=5
        // Returns notifications for a specific user + broadcast (userId=null) notifications
        [HttpGet]
        public async Task<IActionResult> GetNotifications([FromQuery] int? userId)
        {
            var query = _context.Notifications.AsQueryable();

            if (userId.HasValue)
            {
                query = query.Where(n => n.UserId == null || n.UserId == userId.Value);
            }
            else
            {
                query = query.Where(n => n.UserId == null); // only broadcast
            }

            var notifications = await query
                .OrderByDescending(n => n.CreatedAt)
                .Take(50)
                .ToListAsync();

            return Ok(notifications);
        }

        // GET: /api/notifications/unread-count?userId=5
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount([FromQuery] int? userId)
        {
            var query = _context.Notifications.Where(n => !n.IsRead);

            if (userId.HasValue)
                query = query.Where(n => n.UserId == null || n.UserId == userId.Value);
            else
                query = query.Where(n => n.UserId == null);

            var count = await query.CountAsync();
            return Ok(new { count });
        }

        // POST: /api/notifications
        [HttpPost]
        public async Task<IActionResult> CreateNotification([FromBody] CreateNotificationDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Message))
                return BadRequest(new { message = "Title and message are required." });

            var notification = new Notification
            {
                UserId = dto.UserId,
                Title = dto.Title.Trim(),
                Message = dto.Message.Trim(),
                Type = dto.Type ?? "info",
                Icon = dto.Icon ?? "fa-bell",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
            return Ok(notification);
        }

        // PATCH: /api/notifications/{id}/read
        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null) return NotFound();
            notification.IsRead = true;
            await _context.SaveChangesAsync();
            return Ok(notification);
        }

        // PATCH: /api/notifications/mark-all-read?userId=5
        [HttpPatch("mark-all-read")]
        public async Task<IActionResult> MarkAllRead([FromQuery] int? userId)
        {
            var query = _context.Notifications.Where(n => !n.IsRead);

            if (userId.HasValue)
                query = query.Where(n => n.UserId == null || n.UserId == userId.Value);
            else
                query = query.Where(n => n.UserId == null);

            var notifications = await query.ToListAsync();
            notifications.ForEach(n => n.IsRead = true);
            await _context.SaveChangesAsync();
            return Ok(new { updated = notifications.Count });
        }

        // DELETE: /api/notifications/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null) return NotFound();
            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Notification deleted." });
        }
    }
}
