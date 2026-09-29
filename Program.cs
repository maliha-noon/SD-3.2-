using Microsoft.EntityFrameworkCore;
using AuraApp.Data;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

builder.Services.AddControllers();
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie(options =>
{
    options.Cookie.Name = "aura.session";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.ExpireTimeSpan = TimeSpan.FromDays(14);
    options.SlidingExpiration = true;
    options.Events.OnRedirectToLogin = context => { context.Response.StatusCode = 401; return Task.CompletedTask; };
    options.Events.OnRedirectToAccessDenied = context => { context.Response.StatusCode = 403; return Task.CompletedTask; };
});
builder.Services.AddAuthorization();
var auraKeyPath = Path.Combine(Path.GetTempPath(), "aura-dataprotection-keys");
Directory.CreateDirectory(auraKeyPath);
builder.Services.AddDataProtection().PersistKeysToFileSystem(new DirectoryInfo(auraKeyPath));
builder.Services.AddEndpointsApiExplorer();

var sqlServerConnStr = builder.Configuration.GetConnectionString("SqlServerConnection") ?? "Server=.\\SQLEXPRESS;Database=aura_db;Trusted_Connection=True;TrustServerCertificate=True;";
var mySqlConnStr = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Server=localhost;Database=aura_db;User=root;Password=rootpassword;";
var sqliteConnStr = builder.Configuration.GetConnectionString("SqliteConnection") ?? "Data Source=aura.db";

string selectedSqlServerConn = string.Empty;
bool canConnectSqlServer = false;

var sqlServerCandidates = new List<string>();
if (!string.IsNullOrWhiteSpace(sqlServerConnStr)) sqlServerCandidates.Add(sqlServerConnStr);
sqlServerCandidates.Add("Server=.\\SQLEXPRESS03;Database=aura_db;Trusted_Connection=True;TrustServerCertificate=True;");
sqlServerCandidates.Add("Server=LAPTOP-5EAU74EF\\SQLEXPRESS03;Database=aura_db;Trusted_Connection=True;TrustServerCertificate=True;");
sqlServerCandidates.Add("Server=.\\SQLEXPRESS;Database=aura_db;Trusted_Connection=True;TrustServerCertificate=True;");
sqlServerCandidates.Add("Server=.\\SQLEXPRESS01;Database=aura_db;Trusted_Connection=True;TrustServerCertificate=True;");
sqlServerCandidates.Add("Server=.\\SQLEXPRESS02;Database=aura_db;Trusted_Connection=True;TrustServerCertificate=True;");
sqlServerCandidates.Add("Server=localhost\\SQLEXPRESS;Database=aura_db;Trusted_Connection=True;TrustServerCertificate=True;");
sqlServerCandidates.Add("Server=(localdb)\\mssqllocaldb;Database=aura_db;Trusted_Connection=True;TrustServerCertificate=True;");
sqlServerCandidates.Add("Server=localhost;Database=aura_db;Trusted_Connection=True;TrustServerCertificate=True;");
sqlServerCandidates.Add("Server=127.0.0.1;Database=aura_db;Trusted_Connection=True;TrustServerCertificate=True;");

foreach (var rawConn in sqlServerCandidates.Distinct())
{
    var testConn = rawConn;
    if (!testConn.Contains("Connection Timeout", StringComparison.OrdinalIgnoreCase) && !testConn.Contains("Connect Timeout", StringComparison.OrdinalIgnoreCase))
    {
        testConn = testConn.TrimEnd(';') + ";Connect Timeout=2;";
    }

    try
    {
        using (var conn = new Microsoft.Data.SqlClient.SqlConnection(testConn))
        {
            conn.Open();
            canConnectSqlServer = true;
            selectedSqlServerConn = testConn;
            break;
        }
    }
    catch
    {
        try
        {
            var masterBuilderStr = new Microsoft.Data.SqlClient.SqlConnectionStringBuilder(testConn)
            {
                InitialCatalog = "master"
            }.ConnectionString;

            using var masterConn = new Microsoft.Data.SqlClient.SqlConnection(masterBuilderStr);
            masterConn.Open();
            using var createCmd = masterConn.CreateCommand();
            createCmd.CommandText = "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'aura_db') BEGIN CREATE DATABASE [aura_db]; END";
            createCmd.ExecuteNonQuery();

            using var conn = new Microsoft.Data.SqlClient.SqlConnection(testConn);
            conn.Open();
            canConnectSqlServer = true;
            selectedSqlServerConn = testConn;
            break;
        }
        catch
        {
            // try next candidate
        }
    }
}

string selectedMySqlConn = string.Empty;
bool canConnectMySql = false;

if (!canConnectSqlServer)
{
    var candidates = new List<string>();
    if (!string.IsNullOrWhiteSpace(mySqlConnStr)) candidates.Add(mySqlConnStr);
    candidates.Add("Server=localhost;Database=aura_db;User=root;Password=rootpassword;");
    candidates.Add("Server=localhost;Port=3306;Database=aura_db;User=root;Password=rootpassword;");
    candidates.Add("Server=127.0.0.1;Port=3306;Database=aura_db;User=root;Password=rootpassword;");
    candidates.Add("Server=mysql_db;Database=aura_db;User=root;Password=rootpassword;");
    candidates.Add("Server=localhost;Database=aura_db;User=root;Password=;");
    candidates.Add("Server=localhost;Database=aura_db;User=root;Password=root;");

    foreach (var rawConn in candidates.Distinct())
    {
        var testConn = rawConn;
        if (!testConn.Contains("Connection Timeout", StringComparison.OrdinalIgnoreCase) && !testConn.Contains("Connect Timeout", StringComparison.OrdinalIgnoreCase))
        {
            testConn = testConn.TrimEnd(';') + ";Connection Timeout=1;";
        }

        try
        {
            using (var conn = new MySqlConnector.MySqlConnection(testConn))
            {
                conn.Open();
                canConnectMySql = true;
                selectedMySqlConn = testConn;
                break;
            }
        }
        catch
        {
            try
            {
                var builderConn = new MySqlConnector.MySqlConnectionStringBuilder(testConn)
                {
                    Database = ""
                };
                using var serverConn = new MySqlConnector.MySqlConnection(builderConn.ConnectionString);
                serverConn.Open();
                using var createCmd = serverConn.CreateCommand();
                createCmd.CommandText = "CREATE DATABASE IF NOT EXISTS aura_db;";
                createCmd.ExecuteNonQuery();

                using var conn = new MySqlConnector.MySqlConnection(testConn);
                conn.Open();
                canConnectMySql = true;
                selectedMySqlConn = testConn;
                break;
            }
            catch
            {
                // try next candidate
            }
        }
    }
}

builder.Services.AddDbContext<AuraDbContext>(options =>
{
    if (canConnectSqlServer && !string.IsNullOrEmpty(selectedSqlServerConn))
    {
        options.UseSqlServer(selectedSqlServerConn);
        Console.WriteLine($"[DB] Connected to SQL Server (SSMS Compatible): {selectedSqlServerConn}");
    }
    else if (canConnectMySql && !string.IsNullOrEmpty(selectedMySqlConn))
    {
        var serverVersion = new MySqlServerVersion(new Version(8, 0, 30));
        options.UseMySql(selectedMySqlConn, serverVersion);
        Console.WriteLine($"[DB] Connected to MySQL: {selectedMySqlConn}");
    }
    else
    {
        options.UseSqlite(sqliteConnStr);
        Console.WriteLine($"[DB] Connected to SQLite: {sqliteConnStr}");
    }
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<AuraDbContext>();
        dbContext.Database.EnsureCreated();
        EnsureAdditiveSchema(dbContext);

        var demoCategories = new[] { "Cinema", "Classical", "Comedy", "Concert", "Convention", "EDM", "eSports" };
        var eventIdeas = new Dictionary<string, string[]> {
            ["Cinema"] = new[] { "Dhaka Independent Film Week", "Bangla Classics on the Big Screen", "Short Film Showcase Dhaka" },
            ["Classical"] = new[] { "An Evening of South Asian Strings", "Dhaka Chamber Orchestra: New Voices", "Moonlight Piano Recital" },
            ["Comedy"] = new[] { "Dhaka Stand-up Social", "The Friday Laugh Room", "New Voices in Comedy" },
            ["Concert"] = new[] { "Dhaka Indie Sessions", "Rooftop Sound: Live in Dhaka", "Bangla Acoustic Night" },
            ["Convention"] = new[] { "Dhaka Creator Convention", "Bangladesh Pop Culture Expo", "Future Makers Dhaka" },
            ["EDM"] = new[] { "Monsoon Frequencies: Dhaka", "Neon River Electronic Night", "Pulse District: Dhaka" },
            ["eSports"] = new[] { "Dhaka Arena Open: Valorant", "Bangladesh Esports Weekend", "Campus Rivals Finals" }
        };
        foreach (var category in demoCategories)
        {
            var remaining = Math.Max(0, 3 - dbContext.Events.Count(e => e.Category.ToLower() == category.ToLower() && e.EventDate >= DateTime.UtcNow));
            foreach (var title in eventIdeas[category].Take(remaining))
            {
                var offset = dbContext.Events.Count() + 1;
                dbContext.Events.Add(new AuraApp.Models.Event
                {
                    Title = title,
                    Description = "Sample listing: This illustrative event is not a confirmed announcement.",
                    Category = category, Venue = "Bangladesh Shilpakala Academy", Location = "Dhaka, Bangladesh",
                    EventDate = DateTime.UtcNow.Date.AddDays(45 + offset * 12).AddHours(18), Price = 500 + offset * 50,
                    Currency = "BDT", TotalTickets = 250, AvailableTickets = 250,
                    ImageUrl = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1000"
                });
            }
        }
        foreach (var seededEvent in dbContext.Events.Where(e => e.Id <= 16 || e.Title.Contains("Demo concept")))
        {
            seededEvent.Title = seededEvent.Title.Replace(" (Demo concept)", "").Replace("AURA Demo", "Dhaka");
            if (seededEvent.Id <= 16 || seededEvent.Description.StartsWith("Sample AURA event concept;", StringComparison.OrdinalIgnoreCase))
                seededEvent.Description = "Sample listing: This illustrative event is not a confirmed announcement.";
        }
        dbContext.SaveChanges();

        // Ensure the review table also exists for databases created before reviews were added.
        var isSqlServerProvider = (dbContext.Database.ProviderName ?? "").Contains("SqlServer", StringComparison.OrdinalIgnoreCase);
        var isMySqlProvider = (dbContext.Database.ProviderName ?? "").Contains("MySql", StringComparison.OrdinalIgnoreCase)
            || (dbContext.Database.ProviderName ?? "").Contains("Pomelo", StringComparison.OrdinalIgnoreCase);

        if (isSqlServerProvider)
        {
            dbContext.Database.ExecuteSqlRaw(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Reviews')
                BEGIN
                    CREATE TABLE Reviews (
                        Id INT IDENTITY(1,1) PRIMARY KEY,
                        UserId INT NULL,
                        UserName NVARCHAR(255) NOT NULL,
                        Content NVARCHAR(MAX) NOT NULL,
                        Rating INT NOT NULL,
                        CreatedAt DATETIME2 NOT NULL
                    );
                END
            ");
        }
        else if (isMySqlProvider)
        {
            dbContext.Database.ExecuteSqlRaw("CREATE TABLE IF NOT EXISTS Reviews (Id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, UserId INT NULL, UserName VARCHAR(255) NOT NULL, Content TEXT NOT NULL, Rating INT NOT NULL, CreatedAt DATETIME NOT NULL);");
        }
        else
        {
            dbContext.Database.ExecuteSqlRaw("CREATE TABLE IF NOT EXISTS Reviews (Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, UserId INTEGER NULL, UserName TEXT NOT NULL, Content TEXT NOT NULL, Rating INTEGER NOT NULL, CreatedAt TEXT NOT NULL);");
        }

        // Ensure Primary Admin Users exist (handling email variations and phone 01793755378)
        var passHash22222 = "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b"; // SHA256 of "22222"
        var adminAccounts = new[]
        {
            (Email: "noonmaliha8@gmail.com", Phone: "01793755378"),
            (Email: "noonmaliha8@gamil.com", Phone: "01793755378"),
            (Email: "maliha@aura.com", Phone: "01700000000")
        };

        foreach (var acc in adminAccounts)
        {
            var u = dbContext.Users.FirstOrDefault(x => x.Email.ToLower() == acc.Email.ToLower() || x.Phone == acc.Phone);
            if (u == null)
            {
                dbContext.Users.Add(new AuraApp.Models.User
                {
                    FullName = "Maliha Parvin",
                    Email = acc.Email,
                    Phone = acc.Phone,
                    PasswordHash = passHash22222,
                    IsSubscribed = true,
                    SubscriptionExpiresAt = DateTime.UtcNow.AddDays(3650),
                    CreatedAt = DateTime.UtcNow
                });
            }
            else
            {
                u.FullName = "Maliha Parvin";
                u.PasswordHash = passHash22222;
                u.IsSubscribed = true;
            }
        }
        dbContext.SaveChanges();

        var defaultAdmin = dbContext.Users.FirstOrDefault(x => x.Email == "noonmaliha8@gmail.com") ?? dbContext.Users.First();

        // Seed Subscriptions if table is empty
        if (!dbContext.Subscriptions.Any())
        {
            dbContext.Subscriptions.Add(new AuraApp.Models.Subscription
            {
                UserId = defaultAdmin.Id,
                UserName = defaultAdmin.FullName,
                UserEmail = defaultAdmin.Email,
                UserPhone = defaultAdmin.Phone,
                PlanName = "Pro Organizer (FREE)",
                Amount = 0,
                PaymentMethod = "FREE",
                TransactionId = "SUB-FREE-SEED001",
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddYears(10)
            });
            dbContext.SaveChanges();
        }

        // Seed Bookings with dummy records if count < 5
        if (dbContext.Bookings.Count() < 5)
        {
            var seedBookings = new List<AuraApp.Models.Booking>
            {
                new()
                {
                    UserId = defaultAdmin.Id,
                    EventId = 17,
                    UserName = "Maliha Parvin",
                    UserEmail = "noonmaliha8@gmail.com",
                    EventTitle = "FIFA World Stadium Championship Super Match",
                    Quantity = 2,
                    PaymentMethod = "bKash (Direct Online)",
                    PaymentAccount = "01793755378",
                    TransactionId = "BKASH-98A72F104C",
                    BookingDate = DateTime.UtcNow.AddHours(-5),
                    BookingCode = "TKT-AURA8810",
                    Status = "Accepted"
                },
                new()
                {
                    UserId = defaultAdmin.Id,
                    EventId = 18,
                    UserName = "Nadia Rahman",
                    UserEmail = "nadia@aura.com",
                    EventTitle = "Royal Horse Riding & Polo Derby",
                    Quantity = 1,
                    PaymentMethod = "Card (Visa)",
                    PaymentAccount = "Visa **** 4821",
                    TransactionId = "VISA-7719A4210B",
                    BookingDate = DateTime.UtcNow.AddHours(-12),
                    BookingCode = "TKT-AURA9921",
                    Status = "Confirmed"
                },
                new()
                {
                    UserId = defaultAdmin.Id,
                    EventId = 19,
                    UserName = "Arif Hasan",
                    UserEmail = "arif@aura.com",
                    EventTitle = "Outdoor Extreme Kayaking & Rapids Fest",
                    Quantity = 3,
                    PaymentMethod = "Nagad (Send Money)",
                    PaymentAccount = "01812345678",
                    TransactionId = "NAGAD-4412F9810A",
                    BookingDate = DateTime.UtcNow.AddHours(-2),
                    BookingCode = "TKT-AURA3345",
                    Status = "Pending"
                },
                new()
                {
                    UserId = defaultAdmin.Id,
                    EventId = 44,
                    UserName = "Sadia Noor",
                    UserEmail = "sadia@aura.com",
                    EventTitle = "Dhaka City Live Concert",
                    Quantity = 2,
                    PaymentMethod = "bKash (Merchant QR)",
                    PaymentAccount = "01987654321",
                    TransactionId = "BKASH-1102A8849E",
                    BookingDate = DateTime.UtcNow.AddMinutes(-30),
                    BookingCode = "TKT-AURA5512",
                    Status = "Accepted"
                },
                new()
                {
                    UserId = defaultAdmin.Id,
                    EventId = 20,
                    UserName = "Tanvir Ahmed",
                    UserEmail = "tanvir@aura.com",
                    EventTitle = "Grand Slam Tennis Masters Finals",
                    Quantity = 1,
                    PaymentMethod = "Card (MasterCard)",
                    PaymentAccount = "MasterCard **** 9912",
                    TransactionId = "MC-882019A443",
                    BookingDate = DateTime.UtcNow.AddMinutes(-10),
                    BookingCode = "TKT-AURA6678",
                    Status = "Pending"
                }
            };

            var validEventId = dbContext.Events.Select(e => e.Id).FirstOrDefault();
            if (validEventId != 0)
            {
                foreach (var sb in seedBookings)
                {
                    if (!dbContext.Bookings.Any(b => b.BookingCode == sb.BookingCode))
                    {
                        if (!dbContext.Events.Any(e => e.Id == sb.EventId))
                        {
                            sb.EventId = validEventId;
                        }
                        dbContext.Bookings.Add(sb);
                    }
                }
                dbContext.SaveChanges();
                Console.WriteLine("Seeded dummy booking records with Confirmed, Accepted, and Pending statuses.");
            }
        }

        if (!dbContext.Reviews.Any())
        {
            dbContext.Reviews.AddRange(
                new AuraApp.Models.Review { UserName = "Nadia Rahman", Rating = 5, Content = "The event discovery and ticket booking experience is smooth and exciting." },
                new AuraApp.Models.Review { UserName = "Arif Hasan", Rating = 5, Content = "I found football and outdoor tickets quickly. Great event variety!" },
                new AuraApp.Models.Review { UserName = "Sadia Noor", Rating = 4, Content = "The category search makes it easy to find exactly what I want." }
            );
            dbContext.SaveChanges();
        }

        // Backfill missing Outdoor Sports, Football, and Horse Riding events if needed
        if (!dbContext.Events.Any(e => e.Category == "Football & Stadium" || e.Category == "Horse Riding" || e.Category == "Outdoor Sports"))
        {
            var sportsEvents = new List<AuraApp.Models.Event>
            {
                new AuraApp.Models.Event
                {
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
                new AuraApp.Models.Event
                {
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
                new AuraApp.Models.Event
                {
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
                new AuraApp.Models.Event
                {
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
                new AuraApp.Models.Event
                {
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
                new AuraApp.Models.Event
                {
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
                }
            };
            dbContext.Events.AddRange(sportsEvents);
            dbContext.SaveChanges();
            Console.WriteLine("Seeded 6 outdoor sports & stadium events.");
        }

        // Keep the marketplace balanced: every category has at least two events.
        // Existing databases receive only titles that are not already present.
        var categoryExpansionEvents = new List<AuraApp.Models.Event>
        {
            new() { Title = "Dhaka Heritage Gala Evening", Description = "A formal cultural celebration with dinner, music, and awards.", Venue = "Pan Pacific Ballroom", Location = "Dhaka, Bangladesh", EventDate = new DateTime(2026, 10, 2, 19, 0, 0), Price = 380, Currency = "BDT", ImageUrl = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800", TotalTickets = 500, AvailableTickets = 360, Category = "Gala" },
            new() { Title = "Dhaka City Live Concert", Description = "A high-energy live music night with local and international artists.", Venue = "Army Stadium", Location = "Dhaka, Bangladesh", EventDate = new DateTime(2026, 10, 4, 18, 30, 0), Price = 420, Currency = "BDT", ImageUrl = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800", TotalTickets = 1200, AvailableTickets = 900, Category = "Concert" },
            new() { Title = "Pulse EDM Riverside", Description = "Open-air electronic music, visual installations, and DJ performances.", Venue = "Hatirjheel Amphitheatre", Location = "Dhaka, Bangladesh", EventDate = new DateTime(2026, 10, 8, 20, 0, 0), Price = 350, Currency = "BDT", ImageUrl = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800", TotalTickets = 900, AvailableTickets = 720, Category = "EDM" },
            new() { Title = "Bangladesh Esports League Finals", Description = "Watch the country’s best competitive gaming teams battle live.", Venue = "Bashundhara Convention Centre", Location = "Dhaka, Bangladesh", EventDate = new DateTime(2026, 10, 12, 12, 0, 0), Price = 250, Currency = "BDT", ImageUrl = "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800", TotalTickets = 1500, AvailableTickets = 1100, Category = "Esports" },
            new() { Title = "Moonlight Classical Orchestra", Description = "An elegant evening of classical compositions performed by a full orchestra.", Venue = "Bangladesh Shilpakala Academy", Location = "Dhaka, Bangladesh", EventDate = new DateTime(2026, 10, 16, 19, 30, 0), Price = 320, Currency = "BDT", ImageUrl = "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=800", TotalTickets = 650, AvailableTickets = 470, Category = "Classical" },
            new() { Title = "Bangladesh Fashion Week", Description = "Runway presentations from emerging designers and established labels.", Venue = "International Convention City", Location = "Dhaka, Bangladesh", EventDate = new DateTime(2026, 10, 20, 17, 0, 0), Price = 480, Currency = "BDT", ImageUrl = "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800", TotalTickets = 700, AvailableTickets = 530, Category = "Fashion" },
            new() { Title = "Future Creators Convention", Description = "Meet creators, publishers, artists, and technology communities.", Venue = "Bangabandhu International Conference Center", Location = "Dhaka, Bangladesh", EventDate = new DateTime(2026, 10, 23, 10, 0, 0), Price = 200, Currency = "BDT", ImageUrl = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800", TotalTickets = 1000, AvailableTickets = 780, Category = "Convention" },
            new() { Title = "Riverfront Jazz Sessions", Description = "A relaxed riverside night of jazz ensembles and soul singers.", Venue = "Hatirjheel Lakefront", Location = "Dhaka, Bangladesh", EventDate = new DateTime(2026, 10, 27, 18, 0, 0), Price = 280, Currency = "BDT", ImageUrl = "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=800", TotalTickets = 550, AvailableTickets = 390, Category = "Jazz" },
            new() { Title = "Stadium Rock Legends", Description = "Guitar-driven anthems and a live rock festival experience.", Venue = "National Stadium", Location = "Dhaka, Bangladesh", EventDate = new DateTime(2026, 11, 1, 18, 30, 0), Price = 450, Currency = "BDT", ImageUrl = "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=800", TotalTickets = 1300, AvailableTickets = 940, Category = "Rock" },
            new() { Title = "Bengal Theatre Premiere", Description = "A contemporary theatre production by leading stage performers.", Venue = "Experimental Theatre Hall", Location = "Dhaka, Bangladesh", EventDate = new DateTime(2026, 11, 4, 19, 0, 0), Price = 300, Currency = "BDT", ImageUrl = "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=800", TotalTickets = 450, AvailableTickets = 280, Category = "Theatre" },
            new() { Title = "Board Game Masters Meetup", Description = "Tournament play, strategy tables, and casual board game sessions.", Venue = "Dhaka Club", Location = "Dhaka, Bangladesh", EventDate = new DateTime(2026, 11, 8, 11, 0, 0), Price = 150, Currency = "BDT", ImageUrl = "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=800", TotalTickets = 400, AvailableTickets = 310, Category = "Gaming" },
            new() { Title = "Dhaka International Film Showcase", Description = "Independent films, filmmaker Q and A sessions, and premieres.", Venue = "Star Cineplex", Location = "Dhaka, Bangladesh", EventDate = new DateTime(2026, 11, 12, 16, 0, 0), Price = 260, Currency = "BDT", ImageUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800", TotalTickets = 600, AvailableTickets = 410, Category = "Cinema" }
        };
        var existingEventTitles = dbContext.Events.Select(e => e.Title).ToHashSet();
        var missingExpansionEvents = categoryExpansionEvents.Where(e => !existingEventTitles.Contains(e.Title)).ToList();
        if (missingExpansionEvents.Count > 0)
        {
            dbContext.Events.AddRange(missingExpansionEvents);
            dbContext.SaveChanges();
            Console.WriteLine($"Seeded {missingExpansionEvents.Count} additional category events.");
        }

        // Convert legacy booking records into individually addressable AURA tickets once.
        foreach (var booking in dbContext.Bookings.Include(b => b.Event).Where(b => b.Status == "Confirmed").ToList())
        {
            if (dbContext.Tickets.Any(t => t.BookingId == booking.Id)) continue;
            var ticketCount = Math.Clamp(booking.Quantity, 0, 10);
            for (var index = 0; index < ticketCount; index++)
                dbContext.Tickets.Add(new AuraApp.Models.Ticket
                {
                    BookingId = booking.Id, EventId = booking.EventId, OwnerUserId = booking.UserId,
                    Price = booking.Event?.Price ?? 0, Status = "Valid",
                    TicketCode = "AURAT-" + Guid.NewGuid().ToString("N")[..12].ToUpperInvariant(),
                    IssuedAt = booking.BookingDate
                });
        }
        dbContext.SaveChanges();

        // ============================================================
        // Schema maintenance â€” non-destructive additions + backfills
        // ============================================================
        try
        {
            var connection = dbContext.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open)
            {
                connection.Open();
            }

            var providerName = dbContext.Database.ProviderName ?? "";
            bool isSqlServerProviderCurrent = providerName.Contains("SqlServer", StringComparison.OrdinalIgnoreCase);
            bool isMySqlProviderCurrent = providerName.Contains("MySql", StringComparison.OrdinalIgnoreCase)
                || providerName.Contains("Pomelo", StringComparison.OrdinalIgnoreCase);

            if (isSqlServerProviderCurrent)
            {
                using var cmd = connection.CreateCommand();
                cmd.CommandText = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_CATALOG = DB_NAME() AND TABLE_NAME = 'Bookings' AND COLUMN_NAME = 'TotalAmount';";
                var count = Convert.ToInt32(cmd.ExecuteScalar());
                if (count > 0)
                {
                    using var alterCmd = connection.CreateCommand();
                    alterCmd.CommandText = "ALTER TABLE Bookings DROP COLUMN TotalAmount;";
                    alterCmd.ExecuteNonQuery();
                    Console.WriteLine("Successfully dropped TotalAmount column from SQL Server Bookings table.");
                }

                var missingCols = new (string Name, string Type)[]
                {
                    ("OtpCode", "NVARCHAR(255) NOT NULL DEFAULT ''"),
                    ("OtpExpiresAt", "DATETIME2 NULL"),
                    ("OtpRecoveryTarget", "NVARCHAR(255) NOT NULL DEFAULT ''")
                };

                foreach (var (colName, colType) in missingCols)
                {
                    using var checkCmd = connection.CreateCommand();
                    checkCmd.CommandText = $"SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_CATALOG = DB_NAME() AND TABLE_NAME = 'Users' AND COLUMN_NAME = '{colName}';";
                    var exists = Convert.ToInt32(checkCmd.ExecuteScalar()) > 0;
                    if (!exists)
                    {
                        using var alterCmd = connection.CreateCommand();
                        alterCmd.CommandText = $"ALTER TABLE Users ADD {colName} {colType};";
                        alterCmd.ExecuteNonQuery();
                        Console.WriteLine($"Added '{colName}' column to SQL Server Users table.");
                    }
                }

                var bookingCols = new (string Name, string Type)[]
                {
                    ("UserName", "NVARCHAR(255) NOT NULL DEFAULT ''"),
                    ("UserEmail", "NVARCHAR(255) NOT NULL DEFAULT ''"),
                    ("EventTitle", "NVARCHAR(255) NOT NULL DEFAULT ''")
                };
                foreach (var (colName, colType) in bookingCols)
                {
                    using var checkCmd = connection.CreateCommand();
                    checkCmd.CommandText = $"SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_CATALOG = DB_NAME() AND TABLE_NAME = 'Bookings' AND COLUMN_NAME = '{colName}';";
                    var exists = Convert.ToInt32(checkCmd.ExecuteScalar()) > 0;
                    if (!exists)
                    {
                        using var alterCmd = connection.CreateCommand();
                        alterCmd.CommandText = $"ALTER TABLE Bookings ADD {colName} {colType};";
                        alterCmd.ExecuteNonQuery();
                        Console.WriteLine($"Added '{colName}' column to SQL Server Bookings table.");
                    }
                }

                var subCols = new (string Name, string Type)[]
                {
                    ("UserName", "NVARCHAR(255) NOT NULL DEFAULT ''"),
                    ("UserEmail", "NVARCHAR(255) NOT NULL DEFAULT ''"),
                    ("UserPhone", "NVARCHAR(50) NOT NULL DEFAULT ''")
                };
                foreach (var (colName, colType) in subCols)
                {
                    using var checkCmd = connection.CreateCommand();
                    checkCmd.CommandText = $"SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_CATALOG = DB_NAME() AND TABLE_NAME = 'Subscriptions' AND COLUMN_NAME = '{colName}';";
                    var exists = Convert.ToInt32(checkCmd.ExecuteScalar()) > 0;
                    if (!exists)
                    {
                        using var alterCmd = connection.CreateCommand();
                        alterCmd.CommandText = $"ALTER TABLE Subscriptions ADD {colName} {colType};";
                        alterCmd.ExecuteNonQuery();
                        Console.WriteLine($"Added '{colName}' column to SQL Server Subscriptions table.");
                    }
                }

                using (var backfillCmd = connection.CreateCommand())
                {
                    backfillCmd.CommandText = @"
                        UPDATE Subscriptions
                        SET
                            UserName  = CASE WHEN Subscriptions.UserName  = '' OR Subscriptions.UserName  IS NULL THEN u.FullName ELSE Subscriptions.UserName  END,
                            UserEmail = CASE WHEN Subscriptions.UserEmail = '' OR Subscriptions.UserEmail IS NULL THEN u.Email    ELSE Subscriptions.UserEmail END,
                            UserPhone = CASE WHEN Subscriptions.UserPhone = '' OR Subscriptions.UserPhone IS NULL THEN u.Phone    ELSE Subscriptions.UserPhone END
                        FROM Subscriptions
                        INNER JOIN Users u ON Subscriptions.UserId = u.Id;
                    ";
                    var rows = backfillCmd.ExecuteNonQuery();
                    if (rows > 0) Console.WriteLine($"Backfilled {rows} SQL Server Subscriptions rows.");
                }

                using (var backfillCmd = connection.CreateCommand())
                {
                    backfillCmd.CommandText = @"
                        UPDATE Bookings
                        SET
                            UserName   = CASE WHEN Bookings.UserName   = '' OR Bookings.UserName   IS NULL THEN u.FullName ELSE Bookings.UserName   END,
                            UserEmail  = CASE WHEN Bookings.UserEmail  = '' OR Bookings.UserEmail  IS NULL THEN u.Email    ELSE Bookings.UserEmail  END,
                            EventTitle = CASE WHEN Bookings.EventTitle = '' OR Bookings.EventTitle IS NULL THEN ISNULL(e.Title, 'Unknown Event') ELSE Bookings.EventTitle END
                        FROM Bookings
                        INNER JOIN Users u ON Bookings.UserId = u.Id
                        LEFT JOIN Events e ON Bookings.EventId = e.Id;
                    ";
                    var rows = backfillCmd.ExecuteNonQuery();
                    if (rows > 0) Console.WriteLine($"Backfilled {rows} SQL Server Bookings rows.");
                }
            }
            else if (isMySqlProviderCurrent)
            {
                using var cmd = connection.CreateCommand();
                cmd.CommandText = "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'aura_db' AND TABLE_NAME = 'Bookings' AND COLUMN_NAME = 'TotalAmount';";
                var count = Convert.ToInt32(cmd.ExecuteScalar());
                if (count > 0)
                {
                    using var alterCmd = connection.CreateCommand();
                    alterCmd.CommandText = "ALTER TABLE Bookings DROP COLUMN TotalAmount;";
                    alterCmd.ExecuteNonQuery();
                    Console.WriteLine("Successfully dropped TotalAmount column from MySQL Bookings table.");
                }

                var missingCols = new (string Name, string Type)[]
                {
                    ("OtpCode", "VARCHAR(255) NOT NULL DEFAULT ''"),
                    ("OtpExpiresAt", "DATETIME(6) NULL"),
                    ("OtpRecoveryTarget", "VARCHAR(255) NOT NULL DEFAULT ''")
                };

                foreach (var (colName, colType) in missingCols)
                {
                    using var checkCmd = connection.CreateCommand();
                    checkCmd.CommandText = $"SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'aura_db' AND TABLE_NAME = 'Users' AND COLUMN_NAME = '{colName}';";
                    var exists = Convert.ToInt32(checkCmd.ExecuteScalar()) > 0;
                    if (!exists)
                    {
                        using var alterCmd = connection.CreateCommand();
                        alterCmd.CommandText = $"ALTER TABLE Users ADD COLUMN {colName} {colType};";
                        alterCmd.ExecuteNonQuery();
                        Console.WriteLine($"Added '{colName}' column to MySQL Users table.");
                    }
                }

                // Add new UserName/UserEmail/EventTitle columns to Bookings table
                var bookingCols = new (string Name, string Type)[]
                {
                    ("UserName", "VARCHAR(255) NOT NULL DEFAULT ''"),
                    ("UserEmail", "VARCHAR(255) NOT NULL DEFAULT ''"),
                    ("EventTitle", "VARCHAR(255) NOT NULL DEFAULT ''")
                };
                foreach (var (colName, colType) in bookingCols)
                {
                    using var checkCmd = connection.CreateCommand();
                    checkCmd.CommandText = $"SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'aura_db' AND TABLE_NAME = 'Bookings' AND COLUMN_NAME = '{colName}';";
                    var exists = Convert.ToInt32(checkCmd.ExecuteScalar()) > 0;
                    if (!exists)
                    {
                        using var alterCmd = connection.CreateCommand();
                        alterCmd.CommandText = $"ALTER TABLE Bookings ADD COLUMN {colName} {colType};";
                        alterCmd.ExecuteNonQuery();
                        Console.WriteLine($"Added '{colName}' column to MySQL Bookings table.");
                    }
                }

                // Add new UserName/UserEmail/UserPhone columns to Subscriptions table
                var subCols = new (string Name, string Type)[]
                {
                    ("UserName", "VARCHAR(255) NOT NULL DEFAULT ''"),
                    ("UserEmail", "VARCHAR(255) NOT NULL DEFAULT ''"),
                    ("UserPhone", "VARCHAR(50) NOT NULL DEFAULT ''")
                };
                foreach (var (colName, colType) in subCols)
                {
                    using var checkCmd = connection.CreateCommand();
                    checkCmd.CommandText = $"SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'aura_db' AND TABLE_NAME = 'Subscriptions' AND COLUMN_NAME = '{colName}';";
                    var exists = Convert.ToInt32(checkCmd.ExecuteScalar()) > 0;
                    if (!exists)
                    {
                        using var alterCmd = connection.CreateCommand();
                        alterCmd.CommandText = $"ALTER TABLE Subscriptions ADD COLUMN {colName} {colType};";
                        alterCmd.ExecuteNonQuery();
                        Console.WriteLine($"Added '{colName}' column to MySQL Subscriptions table.");
                    }
                }

                // BACKFILL: Update existing Subscriptions rows that have blank UserName/UserEmail/UserPhone
                using (var backfillCmd = connection.CreateCommand())
                {
                    backfillCmd.CommandText = @"
                        UPDATE Subscriptions s
                        INNER JOIN Users u ON s.UserId = u.Id
                        SET
                            s.UserName  = CASE WHEN s.UserName  = '' OR s.UserName  IS NULL THEN u.FullName ELSE s.UserName  END,
                            s.UserEmail = CASE WHEN s.UserEmail = '' OR s.UserEmail IS NULL THEN u.Email    ELSE s.UserEmail END,
                            s.UserPhone = CASE WHEN s.UserPhone = '' OR s.UserPhone IS NULL THEN u.Phone    ELSE s.UserPhone END;
                    ";
                    var rows = backfillCmd.ExecuteNonQuery();
                    if (rows > 0) Console.WriteLine($"Backfilled {rows} Subscriptions rows with UserName/UserEmail/UserPhone.");
                }

                // BACKFILL: Update existing Bookings rows that have blank UserName/UserEmail/EventTitle
                using (var backfillCmd = connection.CreateCommand())
                {
                    backfillCmd.CommandText = @"
                        UPDATE Bookings b
                        INNER JOIN Users u ON b.UserId = u.Id
                        LEFT JOIN Events e ON b.EventId = e.Id
                        SET
                            b.UserName  = CASE WHEN b.UserName  = '' OR b.UserName  IS NULL THEN u.FullName ELSE b.UserName  END,
                            b.UserEmail = CASE WHEN b.UserEmail = '' OR b.UserEmail IS NULL THEN u.Email    ELSE b.UserEmail END,
                            b.EventTitle = CASE WHEN b.EventTitle = '' OR b.EventTitle IS NULL THEN COALESCE(e.Title, 'Unknown Event') ELSE b.EventTitle END;
                    ";
                    var rows = backfillCmd.ExecuteNonQuery();
                    if (rows > 0) Console.WriteLine($"Backfilled {rows} Bookings rows with UserName/UserEmail/EventTitle.");
                }
            }
            else
            {
                // SQLite migrations/column additions & backfills
                var sqliteCols = new (string Table, string Name, string Type)[]
                {
                    ("Users", "OtpCode", "TEXT NOT NULL DEFAULT ''"),
                    ("Users", "OtpExpiresAt", "TEXT NULL"),
                    ("Users", "OtpRecoveryTarget", "TEXT NOT NULL DEFAULT ''"),
                    ("Bookings", "UserName", "TEXT NOT NULL DEFAULT ''"),
                    ("Bookings", "UserEmail", "TEXT NOT NULL DEFAULT ''"),
                    ("Bookings", "EventTitle", "TEXT NOT NULL DEFAULT ''"),
                    ("Subscriptions", "UserName", "TEXT NOT NULL DEFAULT ''"),
                    ("Subscriptions", "UserEmail", "TEXT NOT NULL DEFAULT ''"),
                    ("Subscriptions", "UserPhone", "TEXT NOT NULL DEFAULT ''")
                };

                foreach (var (tbl, colName, colType) in sqliteCols)
                {
                    using var checkCmd = connection.CreateCommand();
                    checkCmd.CommandText = $"PRAGMA table_info(\"{tbl}\");";
                    bool exists = false;
                    using (var reader = checkCmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            if (string.Equals(reader.GetString(1), colName, StringComparison.OrdinalIgnoreCase))
                            {
                                exists = true;
                                break;
                            }
                        }
                    }
                    if (!exists)
                    {
                        using var alterCmd = connection.CreateCommand();
                        alterCmd.CommandText = $"ALTER TABLE \"{tbl}\" ADD COLUMN \"{colName}\" {colType};";
                        alterCmd.ExecuteNonQuery();
                        Console.WriteLine($"Added '{colName}' column to SQLite {tbl} table.");
                    }
                }

                // SQLite Backfill Subscriptions
                using (var backfillCmd = connection.CreateCommand())
                {
                    backfillCmd.CommandText = @"
                        UPDATE Subscriptions
                        SET
                            UserName  = CASE WHEN UserName  = '' OR UserName  IS NULL THEN (SELECT FullName FROM Users WHERE Users.Id = Subscriptions.UserId) ELSE UserName  END,
                            UserEmail = CASE WHEN UserEmail = '' OR UserEmail IS NULL THEN (SELECT Email    FROM Users WHERE Users.Id = Subscriptions.UserId) ELSE UserEmail END,
                            UserPhone = CASE WHEN UserPhone = '' OR UserPhone IS NULL THEN (SELECT Phone    FROM Users WHERE Users.Id = Subscriptions.UserId) ELSE UserPhone END;
                    ";
                    backfillCmd.ExecuteNonQuery();
                }

                // SQLite Backfill Bookings
                using (var backfillCmd = connection.CreateCommand())
                {
                    backfillCmd.CommandText = @"
                        UPDATE Bookings
                        SET
                            UserName   = CASE WHEN UserName   = '' OR UserName   IS NULL THEN (SELECT FullName FROM Users  WHERE Users.Id  = Bookings.UserId)  ELSE UserName   END,
                            UserEmail  = CASE WHEN UserEmail  = '' OR UserEmail  IS NULL THEN (SELECT Email    FROM Users  WHERE Users.Id  = Bookings.UserId)  ELSE UserEmail  END,
                            EventTitle = CASE WHEN EventTitle = '' OR EventTitle IS NULL THEN COALESCE((SELECT Title FROM Events WHERE Events.Id = Bookings.EventId), 'Unknown Event') ELSE EventTitle END;
                    ";
                    backfillCmd.ExecuteNonQuery();
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Migration exception: {ex.Message}");
        }

        Console.WriteLine("Database fully seeded and ready!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"DB Initialization Info: {ex.Message}");
    }
}

var contentTypeProvider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
contentTypeProvider.Mappings[".jsx"] = "application/javascript";

app.UseCors("AllowAll");
app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = contentTypeProvider
});
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("index.html");

if (app.Environment.IsDevelopment())
{
    app.Lifetime.ApplicationStarted.Register(() =>
    {
        try
        {
            var url = "http://localhost:5000";
            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
            {
                FileName = url,
                UseShellExecute = true
            });
        }
        catch { }
    });
}

app.Run();

static void EnsureAdditiveSchema(AuraDbContext db)
{
    var sqlite = db.Database.IsSqlite();
    var statements = sqlite ? new[] {
        "ALTER TABLE Users ADD COLUMN Preferences TEXT NOT NULL DEFAULT ''",
        "CREATE TABLE IF NOT EXISTS Tickets (Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, TicketCode TEXT NOT NULL, BookingId INTEGER NOT NULL, EventId INTEGER NOT NULL, OwnerUserId INTEGER NOT NULL, Price TEXT NOT NULL, Status TEXT NOT NULL, IssuedAt TEXT NOT NULL, FOREIGN KEY(BookingId) REFERENCES Bookings(Id) ON DELETE CASCADE, FOREIGN KEY(EventId) REFERENCES Events(Id) ON DELETE RESTRICT, FOREIGN KEY(OwnerUserId) REFERENCES Users(Id) ON DELETE RESTRICT)",
        "CREATE UNIQUE INDEX IF NOT EXISTS IX_Tickets_TicketCode ON Tickets(TicketCode)",
        "CREATE TABLE IF NOT EXISTS VerificationAttempts (Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, UserId INTEGER NULL, TicketCode TEXT NOT NULL, Result TEXT NOT NULL, CheckedAt TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS SavedEvents (Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, UserId INTEGER NOT NULL, EventId INTEGER NOT NULL, CreatedAt TEXT NOT NULL)",
        "CREATE UNIQUE INDEX IF NOT EXISTS IX_SavedEvents_UserId_EventId ON SavedEvents(UserId, EventId)",
        "CREATE TABLE IF NOT EXISTS ResaleListings (Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, TicketId INTEGER NOT NULL, SellerUserId INTEGER NOT NULL, AskingPrice TEXT NOT NULL, Status TEXT NOT NULL, CreatedAt TEXT NOT NULL, FOREIGN KEY(TicketId) REFERENCES Tickets(Id) ON DELETE CASCADE)",
        "CREATE TABLE IF NOT EXISTS EventSubmissions (Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, UserId INTEGER NOT NULL, Title TEXT NOT NULL, Category TEXT NOT NULL, Description TEXT NOT NULL, Venue TEXT NOT NULL, Location TEXT NOT NULL, EventDate TEXT NOT NULL, Price TEXT NOT NULL, Quantity INTEGER NOT NULL, Status TEXT NOT NULL, SubmittedAt TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS TicketTransfers (Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, TicketId INTEGER NOT NULL, FromUserId INTEGER NOT NULL, ToUserId INTEGER NOT NULL, Price TEXT NOT NULL, TransferredAt TEXT NOT NULL)"
    } : new[] {
        "ALTER TABLE Users ADD COLUMN Preferences VARCHAR(1000) NOT NULL DEFAULT ''",
        "CREATE TABLE IF NOT EXISTS Tickets (Id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, TicketCode VARCHAR(255) NOT NULL, BookingId INT NOT NULL, EventId INT NOT NULL, OwnerUserId INT NOT NULL, Price DECIMAL(65,30) NOT NULL, Status VARCHAR(255) NOT NULL, IssuedAt DATETIME(6) NOT NULL, UNIQUE KEY IX_Tickets_TicketCode(TicketCode))",
        "CREATE TABLE IF NOT EXISTS VerificationAttempts (Id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, UserId INT NULL, TicketCode VARCHAR(255) NOT NULL, Result VARCHAR(255) NOT NULL, CheckedAt DATETIME(6) NOT NULL)",
        "CREATE TABLE IF NOT EXISTS SavedEvents (Id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, UserId INT NOT NULL, EventId INT NOT NULL, CreatedAt DATETIME(6) NOT NULL, UNIQUE KEY IX_SavedEvents_UserId_EventId(UserId, EventId))",
        "CREATE TABLE IF NOT EXISTS ResaleListings (Id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, TicketId INT NOT NULL, SellerUserId INT NOT NULL, AskingPrice DECIMAL(65,30) NOT NULL, Status VARCHAR(255) NOT NULL, CreatedAt DATETIME(6) NOT NULL)",
        "CREATE TABLE IF NOT EXISTS EventSubmissions (Id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, UserId INT NOT NULL, Title VARCHAR(255) NOT NULL, Category VARCHAR(255) NOT NULL, Description LONGTEXT NOT NULL, Venue VARCHAR(255) NOT NULL, Location VARCHAR(255) NOT NULL, EventDate DATETIME(6) NOT NULL, Price DECIMAL(65,30) NOT NULL, Quantity INT NOT NULL, Status VARCHAR(255) NOT NULL, SubmittedAt DATETIME(6) NOT NULL)",
        "CREATE TABLE IF NOT EXISTS TicketTransfers (Id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, TicketId INT NOT NULL, FromUserId INT NOT NULL, ToUserId INT NOT NULL, Price DECIMAL(65,30) NOT NULL, TransferredAt DATETIME(6) NOT NULL)"
    };
    foreach (var sql in statements)
    {
        if (sql.StartsWith("ALTER TABLE Users ADD COLUMN Preferences", StringComparison.OrdinalIgnoreCase))
        {
            var exists = false;
            var connection = db.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) connection.Open();
            using var check = connection.CreateCommand();
            if (sqlite) check.CommandText = "PRAGMA table_info(Users)";
            else check.CommandText = "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Users'";
            using var reader = check.ExecuteReader();
            while (reader.Read())
            {
                var column = sqlite ? reader.GetString(1) : reader.GetString(0);
                if (column.Equals("Preferences", StringComparison.OrdinalIgnoreCase)) exists = true;
            }
            reader.Close();
            if (!exists) db.Database.ExecuteSqlRaw(sql);
            continue;
        }
        try { db.Database.ExecuteSqlRaw(sql); }
        catch (Exception ex) when (sql.StartsWith("ALTER TABLE", StringComparison.OrdinalIgnoreCase))
        { Console.WriteLine("Schema column already exists or requires manual migration: " + ex.Message); }
    }
    try
    {
        foreach (var (name, type) in new[] { ("ImageUrl", sqlite ? "TEXT NOT NULL DEFAULT ''" : "LONGTEXT NOT NULL"), ("ContactEmail", sqlite ? "TEXT NOT NULL DEFAULT ''" : "VARCHAR(255) NOT NULL DEFAULT ''"), ("ContactPhone", sqlite ? "TEXT NOT NULL DEFAULT ''" : "VARCHAR(100) NOT NULL DEFAULT ''") })
        {
            var exists = false;
            var connection = db.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) connection.Open();
            using var check = connection.CreateCommand();
            if (sqlite) check.CommandText = "PRAGMA table_info(EventSubmissions)";
            else check.CommandText = "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'EventSubmissions'";
            using var reader = check.ExecuteReader();
            while (reader.Read()) if ((sqlite ? reader.GetString(1) : reader.GetString(0)).Equals(name, StringComparison.OrdinalIgnoreCase)) exists = true;
            reader.Close();
            if (!exists) db.Database.ExecuteSqlRaw("ALTER TABLE EventSubmissions ADD COLUMN " + name + " " + type);
        }
        var conn = db.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open) conn.Open();
        using (var duplicateCheck = conn.CreateCommand())
        {
            duplicateCheck.CommandText = "SELECT COUNT(*) FROM (SELECT LOWER(Email) FROM Users GROUP BY LOWER(Email) HAVING COUNT(*) > 1) duplicates";
            if (Convert.ToInt32(duplicateCheck.ExecuteScalar()) == 0)
            {
                if (sqlite) db.Database.ExecuteSqlRaw("CREATE UNIQUE INDEX IF NOT EXISTS IX_Users_Email ON Users(Email)");
                else
                {
                    using var indexCheck = conn.CreateCommand();
                    indexCheck.CommandText = "SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Users' AND INDEX_NAME = 'IX_Users_Email'";
                    if (Convert.ToInt32(indexCheck.ExecuteScalar()) == 0) db.Database.ExecuteSqlRaw("CREATE UNIQUE INDEX IX_Users_Email ON Users(Email)");
                }
            }
        }
        if (!sqlite)
        {
            var constraints = new[] {
                ("Tickets","FK_Tickets_Bookings_BookingId","ALTER TABLE Tickets ADD CONSTRAINT FK_Tickets_Bookings_BookingId FOREIGN KEY (BookingId) REFERENCES Bookings(Id) ON DELETE CASCADE"),
                ("Tickets","FK_Tickets_Events_EventId","ALTER TABLE Tickets ADD CONSTRAINT FK_Tickets_Events_EventId FOREIGN KEY (EventId) REFERENCES Events(Id) ON DELETE RESTRICT"),
                ("Tickets","FK_Tickets_Users_OwnerUserId","ALTER TABLE Tickets ADD CONSTRAINT FK_Tickets_Users_OwnerUserId FOREIGN KEY (OwnerUserId) REFERENCES Users(Id) ON DELETE RESTRICT"),
                ("SavedEvents","FK_SavedEvents_Users_UserId","ALTER TABLE SavedEvents ADD CONSTRAINT FK_SavedEvents_Users_UserId FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE"),
                ("SavedEvents","FK_SavedEvents_Events_EventId","ALTER TABLE SavedEvents ADD CONSTRAINT FK_SavedEvents_Events_EventId FOREIGN KEY (EventId) REFERENCES Events(Id) ON DELETE CASCADE"),
                ("VerificationAttempts","FK_VerificationAttempts_Users_UserId","ALTER TABLE VerificationAttempts ADD CONSTRAINT FK_VerificationAttempts_Users_UserId FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE SET NULL"),
                ("ResaleListings","FK_ResaleListings_Tickets_TicketId","ALTER TABLE ResaleListings ADD CONSTRAINT FK_ResaleListings_Tickets_TicketId FOREIGN KEY (TicketId) REFERENCES Tickets(Id) ON DELETE CASCADE"),
                ("ResaleListings","FK_ResaleListings_Users_SellerUserId","ALTER TABLE ResaleListings ADD CONSTRAINT FK_ResaleListings_Users_SellerUserId FOREIGN KEY (SellerUserId) REFERENCES Users(Id) ON DELETE RESTRICT"),
                ("EventSubmissions","FK_EventSubmissions_Users_UserId","ALTER TABLE EventSubmissions ADD CONSTRAINT FK_EventSubmissions_Users_UserId FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE"),
                ("TicketTransfers","FK_TicketTransfers_Tickets_TicketId","ALTER TABLE TicketTransfers ADD CONSTRAINT FK_TicketTransfers_Tickets_TicketId FOREIGN KEY (TicketId) REFERENCES Tickets(Id) ON DELETE RESTRICT"),
                ("TicketTransfers","FK_TicketTransfers_Users_FromUserId","ALTER TABLE TicketTransfers ADD CONSTRAINT FK_TicketTransfers_Users_FromUserId FOREIGN KEY (FromUserId) REFERENCES Users(Id) ON DELETE RESTRICT"),
                ("TicketTransfers","FK_TicketTransfers_Users_ToUserId","ALTER TABLE TicketTransfers ADD CONSTRAINT FK_TicketTransfers_Users_ToUserId FOREIGN KEY (ToUserId) REFERENCES Users(Id) ON DELETE RESTRICT")
            };
            foreach (var (table, name, sql) in constraints)
            {
                using var check = conn.CreateCommand();
                check.CommandText = "SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = @table AND CONSTRAINT_NAME = @name AND CONSTRAINT_TYPE = 'FOREIGN KEY'";
                var tableParam = check.CreateParameter(); tableParam.ParameterName = "@table"; tableParam.Value = table; check.Parameters.Add(tableParam);
                var nameParam = check.CreateParameter(); nameParam.ParameterName = "@name"; nameParam.Value = name; check.Parameters.Add(nameParam);
                if (Convert.ToInt32(check.ExecuteScalar()) == 0) db.Database.ExecuteSqlRaw(sql);
            }
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine("Schema maintenance note: " + ex.Message);
    }
}
