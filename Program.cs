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

var mySqlConnStr = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Server=localhost;Database=aura_db;User=root;Password=rootpassword;";
var sqliteConnStr = builder.Configuration.GetConnectionString("SqliteConnection") ?? "Data Source=aura.db";

string selectedMySqlConn = string.Empty;
bool canConnectMySql = false;

var candidates = new List<string>();
if (!string.IsNullOrWhiteSpace(mySqlConnStr)) candidates.Add(mySqlConnStr);
candidates.Add("Server=localhost;Database=aura_db;User=root;Password=rootpassword;");
candidates.Add("Server=localhost;Port=3306;Database=aura_db;User=root;Password=rootpassword;");
candidates.Add("Server=127.0.0.1;Port=3306;Database=aura_db;User=root;Password=rootpassword;");
candidates.Add("Server=mysql_db;Database=aura_db;User=root;Password=rootpassword;");
candidates.Add("Server=localhost;Database=aura_db;User=root;Password=;");
candidates.Add("Server=localhost;Database=aura_db;User=root;Password=root;");

foreach (var testConn in candidates.Distinct())
{
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

var finalMySqlConn = selectedMySqlConn;
var useMySql = canConnectMySql;

builder.Services.AddDbContext<AuraDbContext>(options =>
{
    if (useMySql && !string.IsNullOrEmpty(finalMySqlConn))
    {
        var serverVersion = new MySqlServerVersion(new Version(8, 0, 30));
        options.UseMySql(finalMySqlConn, serverVersion);
    }
    else
    {
        options.UseSqlite(sqliteConnStr);
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

        // Seed Users if table is empty
        if (!dbContext.Users.Any())
        {
            // Shanti â€” ADMIN
            var userShanti = new AuraApp.Models.User
            {
                FullName = "Nusrat Jahan Shanti",
                Email = "shanti@aura.com",
                Phone = "01711111111",
                PasswordHash = "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
                IsSubscribed = true,
                SubscriptionExpiresAt = DateTime.UtcNow.AddYears(10),
                Role = "Admin",
                CreatedAt = DateTime.UtcNow
            };

            // Maliha â€” ORGANIZER
            var userMaliha = new AuraApp.Models.User
            {
                FullName = "Maliha Parvin",
                Email = "maliha@aura.com",
                Phone = "01700000000",
                PasswordHash = "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
                IsSubscribed = true,
                SubscriptionExpiresAt = DateTime.UtcNow.AddDays(30),
                Role = "Organizer",
                CreatedAt = DateTime.UtcNow
            };

            // John â€” CUSTOMER
            var userJohn = new AuraApp.Models.User
            {
                FullName = "John Doe",
                Email = "john@aura.com",
                Phone = "01800000000",
                PasswordHash = "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
                IsSubscribed = false,
                Role = "Customer",
                CreatedAt = DateTime.UtcNow
            };

            dbContext.Users.AddRange(userShanti, userMaliha, userJohn);
            dbContext.SaveChanges();

            // Seed Subscriptions if table is empty
            if (!dbContext.Subscriptions.Any())
            {
                dbContext.Subscriptions.Add(new AuraApp.Models.Subscription
                {
                    UserId = userMaliha.Id,
                    UserName = userMaliha.FullName,
                    UserEmail = userMaliha.Email,
                    UserPhone = userMaliha.Phone,
                    PlanName = "Pro Organizer (FREE)",
                    Amount = 0,
                    PaymentMethod = "FREE",
                    TransactionId = "SUB-FREE-SEED001",
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddYears(10)
                });
            }

            // Seed Bookings if table is empty
            if (!dbContext.Bookings.Any())
            {
                dbContext.Bookings.Add(new AuraApp.Models.Booking
                {
                    UserId = userJohn.Id,
                    EventId = 1,
                    UserName = userJohn.FullName,
                    UserEmail = userJohn.Email,
                    EventTitle = "Red Carpet Countdown 2025",
                    Quantity = 2,
                    PaymentMethod = "bKash",
                    PaymentAccount = "01800000000",
                    TransactionId = "TXN-RED001",
                    BookingDate = DateTime.UtcNow,
                    BookingCode = "AURA-BK001",
                    Status = "Confirmed"
                });
            }

            dbContext.SaveChanges();
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

            // 1) Drop legacy TotalAmount column from Bookings if present
            using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'aura_db' AND TABLE_NAME = 'Bookings' AND COLUMN_NAME = 'TotalAmount';";
                var count = Convert.ToInt32(cmd.ExecuteScalar());
                if (count > 0)
                {
                    using var alterCmd = connection.CreateCommand();
                    alterCmd.CommandText = "ALTER TABLE Bookings DROP COLUMN TotalAmount;";
                    alterCmd.ExecuteNonQuery();
                    Console.WriteLine("Dropped legacy TotalAmount column from Bookings.");
                }
            }

            // 2) Add missing OTP columns on Users
            var userCols = new (string Name, string Type)[]
            {
                ("OtpCode", "VARCHAR(255) NOT NULL DEFAULT ''"),
                ("OtpExpiresAt", "DATETIME(6) NULL"),
                ("OtpRecoveryTarget", "VARCHAR(255) NOT NULL DEFAULT ''"),
                ("Role", "VARCHAR(20) NOT NULL DEFAULT 'Customer'")
            };
            foreach (var (colName, colType) in userCols)
            {
                using var checkCmd = connection.CreateCommand();
                checkCmd.CommandText = $"SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'aura_db' AND TABLE_NAME = 'Users' AND COLUMN_NAME = '{colName}';";
                var exists = Convert.ToInt32(checkCmd.ExecuteScalar()) > 0;
                if (!exists)
                {
                    using var alterCmd = connection.CreateCommand();
                    alterCmd.CommandText = $"ALTER TABLE Users ADD COLUMN {colName} {colType};";
                    alterCmd.ExecuteNonQuery();
                    Console.WriteLine($"Added '{colName}' column to Users table.");
                }
            }

            // 3) Add snapshot columns on Bookings
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
                    Console.WriteLine($"Added '{colName}' column to Bookings table.");
                }
            }

            // 4) Add snapshot columns on Subscriptions
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
                    Console.WriteLine($"Added '{colName}' column to Subscriptions table.");
                }
            }

            // 5) Set roles on the 3 known demo users (idempotent â€” safe to run every startup)
            using (var roleCmd = connection.CreateCommand())
            {
                roleCmd.CommandText = @"
                    UPDATE Users SET Role = 'Admin'      WHERE Email = 'shanti@aura.com';
                    UPDATE Users SET Role = 'Organizer'  WHERE Email = 'maliha@aura.com';
                    UPDATE Users SET Role = 'Customer'   WHERE Email = 'john@aura.com';
                ";
                roleCmd.ExecuteNonQuery();
            }

            // 6) Backfill subscriptions snapshot columns
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
                backfillCmd.ExecuteNonQuery();
            }

            // 7) Backfill bookings snapshot columns
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
                backfillCmd.ExecuteNonQuery();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Schema maintenance note: {ex.Message}");
        }

        Console.WriteLine("SQL Database 'aura_db' fully initialized and ready!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"DB Initialization Info: {ex.Message}");
    }
}

app.UseCors("AllowAll");
app.UseStaticFiles();
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
