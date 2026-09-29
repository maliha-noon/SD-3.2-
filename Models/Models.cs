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

        // NEW — role system. Values: "Customer" | "Subscriber" | "Organizer" | "Admin"
        public string Role { get; set; } = "Customer";
        public string Preferences { get; set; } = "";
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
        public string SellerPaymentMethod { get; set; } = "bKash";
        public string SellerAccountNumber { get; set; } = string.Empty;
        public string SellerBankName { get; set; } = string.Empty;
        public string SellerAccountHolder { get; set; } = string.Empty;
    }

    public class Booking
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int EventId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string EventTitle { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string PaymentMethod { get; set; } = "bKash";
        public string PaymentAccount { get; set; } = string.Empty;
        public string TransactionId { get; set; } = string.Empty;
        public DateTime BookingDate { get; set; } = DateTime.UtcNow;
        public string BookingCode { get; set; } = string.Empty;
        public string Status { get; set; } = "Confirmed";

        public User? User { get; set; }
        public Event? Event { get; set; }
        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    }

    public class Ticket
    {
        public int Id { get; set; }
        [Required] public string TicketCode { get; set; } = Guid.NewGuid().ToString("N").ToUpperInvariant();
        public int BookingId { get; set; }
        public Booking? Booking { get; set; }
        public int EventId { get; set; }
        public Event? Event { get; set; }
        public int OwnerUserId { get; set; }
        public User? Owner { get; set; }
        public decimal Price { get; set; }
        public string Status { get; set; } = "Valid";
        public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    }

    public class VerificationAttempt
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public string TicketCode { get; set; } = "";
        public string Result { get; set; } = "NotFound";
        public DateTime CheckedAt { get; set; } = DateTime.UtcNow;
    }

    public class SavedEvent { public int Id { get; set; } public int UserId { get; set; } public int EventId { get; set; } public DateTime CreatedAt { get; set; } = DateTime.UtcNow; }
    public class ResaleListing
    {
        public int Id { get; set; } public int TicketId { get; set; } public Ticket? Ticket { get; set; }
        public int SellerUserId { get; set; } public decimal AskingPrice { get; set; }
        public string Status { get; set; } = "Active"; public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
    public class EventSubmission
    {
        public int Id { get; set; } public int UserId { get; set; } public string Title { get; set; } = "";
        public string Category { get; set; } = ""; public string Description { get; set; } = "";
        public string Venue { get; set; } = ""; public string Location { get; set; } = "";
        public DateTime EventDate { get; set; } public decimal Price { get; set; } public int Quantity { get; set; }
        public string Status { get; set; } = "Pending"; public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
        public string ImageUrl { get; set; } = ""; public string ContactEmail { get; set; } = ""; public string ContactPhone { get; set; } = "";
    }
    public class TicketTransfer { public int Id { get; set; } public int TicketId { get; set; } public int FromUserId { get; set; } public int ToUserId { get; set; } public decimal Price { get; set; } public DateTime TransferredAt { get; set; } = DateTime.UtcNow; }

    public class Subscription
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string UserPhone { get; set; } = string.Empty;
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
        public string PaymentMethod { get; set; } = "Reservation";
        public string AccountNumber { get; set; } = string.Empty;
        public string CardNumber { get; set; } = string.Empty;
        public string ExpiryDate { get; set; } = string.Empty;
        public string Cvv { get; set; } = string.Empty;
    }

    public class VerifyBookingDto
    {
        public string BookingCode { get; set; } = string.Empty;
    }

    public class SubscribeDto
    {
        public int UserId { get; set; }
        public string PlanName { get; set; } = "Pro Organizer";
        public string PaymentMethod { get; set; } = "bKash";
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
        public string SellerPaymentMethod { get; set; } = "bKash";
        public string SellerAccountNumber { get; set; } = string.Empty;
        public string SellerBankName { get; set; } = string.Empty;
        public string SellerAccountHolder { get; set; } = string.Empty;
        public string ContactEmail { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
    }

    public class ForgotPasswordDto
    {
        public string Target { get; set; } = string.Empty;
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
