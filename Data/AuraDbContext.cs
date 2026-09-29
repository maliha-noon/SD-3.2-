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
        public DbSet<Review> Reviews { get; set; } = null!;
        public DbSet<Notification> Notifications { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Ticket>().HasIndex(t => t.TicketCode).IsUnique();
            modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
            modelBuilder.Entity<Ticket>().HasOne(t => t.Booking).WithMany(b => b.Tickets).HasForeignKey(t => t.BookingId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Ticket>().HasOne(t => t.Event).WithMany().HasForeignKey(t => t.EventId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Ticket>().HasOne(t => t.Owner).WithMany().HasForeignKey(t => t.OwnerUserId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<ResaleListing>().HasOne(l => l.Ticket).WithMany().HasForeignKey(l => l.TicketId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<SavedEvent>().HasIndex(x => new { x.UserId, x.EventId }).IsUnique();
            modelBuilder.Entity<SavedEvent>().HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<SavedEvent>().HasOne<Event>().WithMany().HasForeignKey(x => x.EventId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<VerificationAttempt>().HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull);
            modelBuilder.Entity<ResaleListing>().HasOne<User>().WithMany().HasForeignKey(x => x.SellerUserId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<EventSubmission>().HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<TicketTransfer>().HasOne<Ticket>().WithMany().HasForeignKey(x => x.TicketId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<TicketTransfer>().HasOne<User>().WithMany().HasForeignKey(x => x.FromUserId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<TicketTransfer>().HasOne<User>().WithMany().HasForeignKey(x => x.ToUserId).OnDelete(DeleteBehavior.Restrict);

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
                },
                new Event
                {
                    Id = 17,
                    Title = "FIFA World Stadium Championship Super Match",
                    Description = "Witness live football stadium action with top international teams battling in a packed arena.",
                    Venue = "Santiago Bernabéu Stadium",
                    Location = "Madrid, Spain",
                    EventDate = new DateTime(2026, 10, 10, 18, 0, 0),
                    Price = 500,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800",
                    TotalTickets = 1500,
                    AvailableTickets = 920,
                    Category = "Football & Stadium"
                },
                new Event
                {
                    Id = 18,
                    Title = "Royal Horse Riding & Polo Derby",
                    Description = "Premier outdoor equestrian show jumping, royal polo tournament, and horse riding exhibition.",
                    Venue = "Windsor Outdoor Polo Club",
                    Location = "London, UK",
                    EventDate = new DateTime(2026, 10, 25, 14, 0, 0),
                    Price = 450,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800",
                    TotalTickets = 600,
                    AvailableTickets = 340,
                    Category = "Horse Riding"
                },
                new Event
                {
                    Id = 19,
                    Title = "Outdoor Extreme Kayaking & Rapids Fest",
                    Description = "Adrenaline-pumping river kayaking, outdoor water sports, and mountain wilderness adventure.",
                    Venue = "Zambezi River Rapids",
                    Location = "Victoria Falls, Africa",
                    EventDate = new DateTime(2026, 11, 05, 9, 0, 0),
                    Price = 350,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800",
                    TotalTickets = 400,
                    AvailableTickets = 210,
                    Category = "Outdoor Sports"
                },
                new Event
                {
                    Id = 20,
                    Title = "Grand Slam Tennis Masters Finals",
                    Description = "Live stadium court action featuring world number one tennis champions in a heated final match.",
                    Venue = "Arthur Ashe Stadium",
                    Location = "New York, USA",
                    EventDate = new DateTime(2026, 11, 18, 15, 30, 0),
                    Price = 400,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=800",
                    TotalTickets = 800,
                    AvailableTickets = 490,
                    Category = "Football & Stadium"
                },
                new Event
                {
                    Id = 21,
                    Title = "Outdoor Desert Dune Safari & Quad Games",
                    Description = "Thrilling desert sandboarding, quad bike races, and traditional Bedouin campfire under open skies.",
                    Venue = "Al Lahbab Red Dunes",
                    Location = "Dubai, UAE",
                    EventDate = new DateTime(2026, 12, 01, 16, 0, 0),
                    Price = 300,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800",
                    TotalTickets = 500,
                    AvailableTickets = 380,
                    Category = "Outdoor Sports"
                },
                new Event
                {
                    Id = 22,
                    Title = "Red Bull Outdoor Formula Circuit Racing",
                    Description = "High-octane outdoor motorsport racing with roaring engines, tight chicane turns, and podium glory.",
                    Venue = "Silverstone Circuit",
                    Location = "Towcester, UK",
                    EventDate = new DateTime(2026, 12, 15, 13, 0, 0),
                    Price = 550,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800",
                    TotalTickets = 1000,
                    AvailableTickets = 670,
                    Category = "Outdoor Sports"
                },
                new Event
                {
                    Id = 35,
                    Title = "Valorant World Championship Finals 2026",
                    Description = "Watch top international esports teams clash live in high-stakes tactical FPS battles.",
                    Venue = "Bashundhara Convention Centre",
                    Location = "Dhaka, Bangladesh",
                    EventDate = new DateTime(2026, 11, 15, 14, 0, 0),
                    Price = 350,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800",
                    TotalTickets = 2000,
                    AvailableTickets = 1420,
                    Category = "Gaming"
                },
                new Event
                {
                    Id = 36,
                    Title = "PUBG Mobile Global Invitational Dhaka",
                    Description = "Adrenaline-fueled battle royale showdown with 16 elite squads fighting for the championship trophy.",
                    Venue = "Army Stadium Arena",
                    Location = "Dhaka, Bangladesh",
                    EventDate = new DateTime(2026, 11, 20, 15, 30, 0),
                    Price = 300,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800",
                    TotalTickets = 2500,
                    AvailableTickets = 1890,
                    Category = "Gaming"
                },
                new Event
                {
                    Id = 37,
                    Title = "League of Legends Worlds Arena 2026",
                    Description = "The premier MOBA tournament featuring live orchestration, holo-stage visuals, and world-class pro teams.",
                    Venue = "Bangabandhu International Conference Center",
                    Location = "Dhaka, Bangladesh",
                    EventDate = new DateTime(2026, 11, 28, 16, 0, 0),
                    Price = 400,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800",
                    TotalTickets = 1800,
                    AvailableTickets = 1250,
                    Category = "Gaming"
                },
                new Event
                {
                    Id = 38,
                    Title = "Dota 2 International Major Dhaka",
                    Description = "Multi-million dollar Aegis cup tournament with legendary drafting, teamfights, and caster commentary.",
                    Venue = "Hatirjheel Amphitheatre",
                    Location = "Dhaka, Bangladesh",
                    EventDate = new DateTime(2026, 12, 05, 13, 0, 0),
                    Price = 450,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800",
                    TotalTickets = 1500,
                    AvailableTickets = 980,
                    Category = "Gaming"
                },
                new Event
                {
                    Id = 39,
                    Title = "Counter-Strike 2 Major Championship",
                    Description = "High-octane tactical shooter major with clutch defuses, sniper showdowns, and live audience roar.",
                    Venue = "Pan Pacific Ballroom",
                    Location = "Dhaka, Bangladesh",
                    EventDate = new DateTime(2026, 12, 12, 17, 0, 0),
                    Price = 380,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800",
                    TotalTickets = 1600,
                    AvailableTickets = 1100,
                    Category = "Gaming"
                },
                new Event
                {
                    Id = 40,
                    Title = "EA FC 26 FIFA Esports Masters",
                    Description = "Compete or watch live digital football stadium finals with commentary and pro gaming booths.",
                    Venue = "Dhaka Club Arena",
                    Location = "Dhaka, Bangladesh",
                    EventDate = new DateTime(2026, 12, 18, 12, 0, 0),
                    Price = 250,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800",
                    TotalTickets = 1200,
                    AvailableTickets = 850,
                    Category = "Gaming"
                },
                new Event
                {
                    Id = 41,
                    Title = "Tekken 8 World Tour Dhaka Finals",
                    Description = "Fierce 1v1 fighting game tournament with electric combos, arcade sticks, and international grandmasters.",
                    Venue = "International Convention City",
                    Location = "Dhaka, Bangladesh",
                    EventDate = new DateTime(2026, 12, 24, 14, 0, 0),
                    Price = 280,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=800",
                    TotalTickets = 1000,
                    AvailableTickets = 740,
                    Category = "Gaming"
                },
                new Event
                {
                    Id = 42,
                    Title = "Mobile Legends M6 Global Cup",
                    Description = "Mobile gaming spectacle with intense 5v5 laning battles and live cosplay showcases.",
                    Venue = "National Stadium",
                    Location = "Dhaka, Bangladesh",
                    EventDate = new DateTime(2026, 12, 30, 16, 0, 0),
                    Price = 220,
                    Currency = "BDT",
                    ImageUrl = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800",
                    TotalTickets = 3000,
                    AvailableTickets = 2200,
                    Category = "Gaming"
                }
            );
        }
    }
}
