using System.ComponentModel.DataAnnotations;

namespace AuraApp.Models
{
    public class User
    {
        public int Id { get; set; }
        [Required]
        public string FullName { get; set; } = string.Empty;
        [Required]
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        public bool IsSubscribed { get; set; } = false;
        public DateTime? SubscriptionExpiresAt { get; set; }
        public string OtpCode { get; set; } = string.Empty;
        public DateTime? OtpExpiresAt { get; set; }
        public string OtpRecoveryTarget { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class Event
    {
        public int Id { get; set; }
        [Required]
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Venue { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public DateTime EventDate { get; set; }
        public decimal Price { get; set; }
        public string Currency { get; set; } = "BDT";
        public string ImageUrl { get; set; } = string.Empty;
        public int TotalTickets { get; set; }
        public int AvailableTickets { get; set; }
        public string Category { get; set; } = "Concert";
        public int? OrganizerUserId { get; set; }
        public string SellerPaymentMethod { get; set; } = "bKash"; // bKash, Nagad, Bank Account
        public string SellerAccountNumber { get; set; } = string.Empty;
        public string SellerBankName { get; set; } = string.Empty;
        public string SellerAccountHolder { get; set; } = string.Empty;
    }

    public class Booking
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int EventId { get; set; }
        public string UserName { get; set; } = string.Empty;   // snapshot of name
        public string UserEmail { get; set; } = string.Empty;  // snapshot of email
        public string EventTitle { get; set; } = string.Empty; // snapshot of event title
        public int Quantity { get; set; }
        public string PaymentMethod { get; set; } = "bKash"; // bKash, Nagad, Card
        public string PaymentAccount { get; set; } = string.Empty;
        public string TransactionId { get; set; } = string.Empty;
        public DateTime BookingDate { get; set; } = DateTime.UtcNow;
        public string BookingCode { get; set; } = string.Empty;
        public string Status { get; set; } = "Confirmed";

        public User? User { get; set; }
        public Event? Event { get; set; }
    }

    public class Subscription
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;   // snapshot of name
        public string UserEmail { get; set; } = string.Empty;  // snapshot of email
        public string UserPhone { get; set; } = string.Empty;  // snapshot of phone
        public string PlanName { get; set; } = "Pro Organizer";
        public decimal Amount { get; set; } = 0;
        public string PaymentMethod { get; set; } = "FREE";
        public string TransactionId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(30);

        public User? User { get; set; }
    }

    // DTOs
    public class RegisterDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class CreateBookingDto
    {
        public int UserId { get; set; }
        public int EventId { get; set; }
        public int Quantity { get; set; } = 1;
        public string PaymentMethod { get; set; } = "bKash"; // bKash, Nagad, Card
        public string AccountNumber { get; set; } = string.Empty;
        public string CardNumber { get; set; } = string.Empty;
        public string ExpiryDate { get; set; } = string.Empty;
        public string Cvv { get; set; } = string.Empty;
    }

    public class SubscribeDto
    {
        public int UserId { get; set; }
        public string PlanName { get; set; } = "Pro Organizer";
        public string PaymentMethod { get; set; } = "bKash"; // bKash, Nagad, Card
        public string AccountNumber { get; set; } = string.Empty;
        public string CardNumber { get; set; } = string.Empty;
        public string ExpiryDate { get; set; } = string.Empty;
        public string Cvv { get; set; } = string.Empty;
    }

    public class CreateEventDto
    {
        public int OrganizerUserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Venue { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public DateTime EventDate { get; set; }
        public decimal Price { get; set; }
        public string Currency { get; set; } = "BDT";
        public string ImageUrl { get; set; } = string.Empty;
        public int TotalTickets { get; set; }
        public string Category { get; set; } = "Concert";
        public string SellerPaymentMethod { get; set; } = "bKash"; // bKash, Nagad, Bank Account
        public string SellerAccountNumber { get; set; } = string.Empty;
        public string SellerBankName { get; set; } = string.Empty;
        public string SellerAccountHolder { get; set; } = string.Empty;
    }

    public class ForgotPasswordDto
    {
        public string Target { get; set; } = string.Empty; // Email or Phone
    }

    public class VerifyOtpDto
    {
        public string Target { get; set; } = string.Empty;
        public string OtpCode { get; set; } = string.Empty;
    }

    public class ResetPasswordDto
    {
        public string Target { get; set; } = string.Empty;
        public string OtpCode { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
