using Microsoft.EntityFrameworkCore;
using AuraApp.Models;

namespace AuraApp.Data
{
    public class AuraDbContext : DbContext
    {
        public AuraDbContext(DbContextOptions<AuraDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Event> Events { get; set; } = null!;
        public DbSet<Booking> Bookings { get; set; } = null!;
        public DbSet<Subscription> Subscriptions { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Event>().HasData(
                new Event
                {
                    Id = 1,
                    Title = "Red Carpet Countdown 2025",
                    Description = "Exclusive New Year celebration with live performances, grand dinner, and midnight fireworks.",
                    Venue = "Grand Ball Room, Radisson Blu",
                    Location = "Dhaka, Bangladesh",
                    EventDate = new DateTime(2025, 12, 31, 20, 0, 0),
                    Price = 300,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800",
                    TotalTickets = 500,
                    AvailableTickets = 320,
                    Category = "Gala"
                },
                new Event
                {
                    Id = 2,
                    Title = "Electric Dreams Festival",
                    Description = "The biggest EDM event of the season featuring world-renowned DJs and spectacular laser shows.",
                    Venue = "City Convention Center",
                    Location = "Mumbai, India",
                    EventDate = new DateTime(2026, 1, 15, 18, 0, 0),
                    Price = 250,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800",
                    TotalTickets = 1000,
                    AvailableTickets = 750,
                    Category = "Festival"
                },
                new Event
                {
                    Id = 3,
                    Title = "Summer Vibes Concert",
                    Description = "An open-air music extravaganza showcasing rock, pop, and indie bands under the stars.",
                    Venue = "Open Air Stadium",
                    Location = "Dubai, UAE",
                    EventDate = new DateTime(2026, 2, 20, 19, 30, 0),
                    Price = 350,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800",
                    TotalTickets = 800,
                    AvailableTickets = 450,
                    Category = "Concert"
                },
                new Event
                {
                    Id = 4,
                    Title = "CyberTech Expo 2026",
                    Description = "Explore breakthrough AI innovations, web3 tech, and futuristic gadgets with global pioneers.",
                    Venue = "Suntec Convention Centre",
                    Location = "Singapore",
                    EventDate = new DateTime(2026, 3, 10, 10, 0, 0),
                    Price = 500,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800",
                    TotalTickets = 400,
                    AvailableTickets = 120,
                    Category = "Tech"
                },
                new Event
                {
                    Id = 5,
                    Title = "Neon Nights EDM Fest",
                    Description = "An immersive neon universe of hypnotic beats, bass drops, and high-energy crowd vibes.",
                    Venue = "Impact Arena",
                    Location = "Bangkok, Thailand",
                    EventDate = new DateTime(2026, 3, 25, 21, 0, 0),
                    Price = 400,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800",
                    TotalTickets = 600,
                    AvailableTickets = 0,
                    Category = "EDM"
                },
                new Event
                {
                    Id = 6,
                    Title = "Valorant Champions Arena",
                    Description = "Watch top esports athletes battle live in intense tactical showdowns for the world trophy.",
                    Venue = "KSPODOME Arena",
                    Location = "Seoul, South Korea",
                    EventDate = new DateTime(2026, 4, 12, 14, 0, 0),
                    Price = 200,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800",
                    TotalTickets = 1200,
                    AvailableTickets = 890,
                    Category = "Esports"
                },
                new Event
                {
                    Id = 7,
                    Title = "Symphony Under Stars",
                    Description = "Enchanting classical orchestra performance playing Mozart and Beethoven in the open air.",
                    Venue = "Vienna Philharmonic Hall",
                    Location = "Vienna, Austria",
                    EventDate = new DateTime(2026, 5, 05, 19, 0, 0),
                    Price = 450,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=800",
                    TotalTickets = 350,
                    AvailableTickets = 45,
                    Category = "Classical"
                },
                new Event
                {
                    Id = 8,
                    Title = "Paris Haute Couture Fashion",
                    Description = "High fashion runway showcasing luxury autumn collections by premier international designers.",
                    Venue = "Grand Palais",
                    Location = "Paris, France",
                    EventDate = new DateTime(2026, 5, 18, 17, 30, 0),
                    Price = 600,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800",
                    TotalTickets = 300,
                    AvailableTickets = 80,
                    Category = "Fashion"
                },
                new Event
                {
                    Id = 9,
                    Title = "Rock Revolution Live",
                    Description = "Heavy riffs and iconic anthems featuring legendary rock headline acts live on stage.",
                    Venue = "Wembley Arena",
                    Location = "London, UK",
                    EventDate = new DateTime(2026, 6, 01, 18, 30, 0),
                    Price = 320,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=800",
                    TotalTickets = 1500,
                    AvailableTickets = 620,
                    Category = "Rock"
                },
                new Event
                {
                    Id = 10,
                    Title = "Broadway Musical Gala",
                    Description = "Spectacular musical theatre night with award-winning singers, dancers, and stage visuals.",
                    Venue = "Majestic Theatre",
                    Location = "New York, USA",
                    EventDate = new DateTime(2026, 6, 15, 20, 0, 0),
                    Price = 550,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=800",
                    TotalTickets = 500,
                    AvailableTickets = 210,
                    Category = "Theatre"
                },
                new Event
                {
                    Id = 11,
                    Title = "Tokyo Anime & Gaming Con",
                    Description = "The ultimate paradise for cosplayers, anime creators, voice actors, and gaming enthusiasts.",
                    Venue = "Big Sight Convention Center",
                    Location = "Tokyo, Japan",
                    EventDate = new DateTime(2026, 7, 04, 10, 0, 0),
                    Price = 280,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800",
                    TotalTickets = 2000,
                    AvailableTickets = 1450,
                    Category = "Convention"
                },
                new Event
                {
                    Id = 12,
                    Title = "Sunset Beach Jazz Night",
                    Description = "Smooth sax melodies, ocean breeze, and tropical cocktails under sunset skies.",
                    Venue = "Kuta Beach Amphitheatre",
                    Location = "Bali, Indonesia",
                    EventDate = new DateTime(2026, 7, 20, 17, 0, 0),
                    Price = 220,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=800",
                    TotalTickets = 400,
                    AvailableTickets = 180,
                    Category = "Jazz"
                },
                new Event
                {
                    Id = 13,
                    Title = "International Comedy Championship",
                    Description = "Non-stop laughter with world-famous stand-up comedians competing live on stage.",
                    Venue = "The Comedy Store",
                    Location = "Los Angeles, USA",
                    EventDate = new DateTime(2026, 8, 05, 20, 0, 0),
                    Price = 260,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?q=80&w=800",
                    TotalTickets = 500,
                    AvailableTickets = 310,
                    Category = "Comedy"
                },
                new Event
                {
                    Id = 14,
                    Title = "Global Indie Film Festival",
                    Description = "Exclusive premiere screenings, director Q&As, and red carpet indie cinema showcases.",
                    Venue = "TIFF Bell Lightbox",
                    Location = "Toronto, Canada",
                    EventDate = new DateTime(2026, 8, 22, 16, 0, 0),
                    Price = 380,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800",
                    TotalTickets = 450,
                    AvailableTickets = 190,
                    Category = "Cinema"
                },
                new Event
                {
                    Id = 15,
                    Title = "Grand Chess Masters Invitational",
                    Description = "Watch international grandmasters clash in high-stakes rapid and blitz chess battles.",
                    Venue = "Harpa Concert Hall",
                    Location = "Reykjavik, Iceland",
                    EventDate = new DateTime(2026, 9, 10, 13, 0, 0),
                    Price = 180,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=800",
                    TotalTickets = 300,
                    AvailableTickets = 95,
                    Category = "Gaming"
                },
                new Event
                {
                    Id = 16,
                    Title = "Carnival De Rio Night",
                    Description = "Vibrant samba dancers, fiery parade floats, and authentic Brazilian beats.",
                    Venue = "Sambadrome Marquês",
                    Location = "Rio de Janeiro, Brazil",
                    EventDate = new DateTime(2026, 9, 28, 21, 30, 0),
                    Price = 420,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800",
                    TotalTickets = 1500,
                    AvailableTickets = 840,
                    Category = "Festival"
                }
            );
        }
    }
}
