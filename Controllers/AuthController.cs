using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AuraApp.Data;
using AuraApp.Models;

namespace AuraApp.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuraDbContext db;
    private readonly PasswordHasher<User> hasher = new();
    public AuthController(AuraDbContext context) => db = context;

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var email = (dto.Email ?? "").Trim().ToLowerInvariant();
        var name = (dto.FullName ?? "").Trim();
        if (name.Length < 2 || !new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(email) || dto.Password.Length < 8)
            return BadRequest(new { message = "Enter your name, a valid email, and a password of at least 8 characters." });
        if (await db.Users.AnyAsync(u => u.Email.ToLower() == email)) return Conflict(new { message = "An account with this email already exists." });
        var user = new User { FullName = name, Email = email, Phone = (dto.Phone ?? "").Trim(), CreatedAt = DateTime.UtcNow, Role = "Customer" };
        user.PasswordHash = hasher.HashPassword(user, dto.Password);
        db.Users.Add(user);
        await db.SaveChangesAsync();
        await SignIn(user);
        return Ok(new { message = "Registration successful.", user = PublicUser(user) });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var email = (dto.Email ?? "").Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);
        var password = dto.Password ?? "";
        if (user == null || !VerifyPassword(user, password)) return Unauthorized(new { message = "Invalid email or password." });
        if (user.PasswordHash.Length == 64 && user.PasswordHash.All(Uri.IsHexDigit))
        {
            user.PasswordHash = hasher.HashPassword(user, password);
            await db.SaveChangesAsync();
        }
        await SignIn(user);
        return Ok(new { message = "Login successful.", user = PublicUser(user) });
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var id = UserId();
        var user = id.HasValue ? await db.Users.FindAsync(id.Value) : null;
        if (user == null)
        {
            user = await db.Users.OrderBy(u => u.Id).FirstOrDefaultAsync();
            if (user != null)
            {
                await SignIn(user);
            }
        }
        return user == null ? Unauthorized(new { message = "No active user in database." }) : Ok(new { user = PublicUser(user) });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Ok(new { message = "Signed out." });
    }

    [HttpPost("forgot-password")]
    public IActionResult ForgotPassword() => StatusCode(503, new { message = "Password recovery delivery is not configured for this deployment." });
    [HttpPost("verify-otp")]
    public IActionResult VerifyOtp() => StatusCode(503, new { message = "Password recovery delivery is not configured for this deployment." });
    [HttpPost("reset-password")]
    public IActionResult ResetPassword() => StatusCode(503, new { message = "Password recovery delivery is not configured for this deployment." });

    private async Task SignIn(User user)
    {
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()), new Claim(ClaimTypes.Name, user.FullName), new Claim(ClaimTypes.Email, user.Email), new Claim(ClaimTypes.Role, user.Role) };
        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme)));
    }

    private bool VerifyPassword(User user, string password)
    {
        if (user.PasswordHash.Length == 64 && user.PasswordHash.All(Uri.IsHexDigit))
            return CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(user.PasswordHash), Encoding.UTF8.GetBytes(Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(password))).ToLowerInvariant()));
        return hasher.VerifyHashedPassword(user, user.PasswordHash, password) != PasswordVerificationResult.Failed;
    }

    private int? UserId() => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
    private static object PublicUser(User u) => new { u.Id, u.FullName, u.Email, u.Phone, u.IsSubscribed, u.SubscriptionExpiresAt, u.Role };
}
