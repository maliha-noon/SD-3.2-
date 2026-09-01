using Microsoft.EntityFrameworkCore;
using AuraApp.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
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

        // Seed Users if table is empty
        if (!dbContext.Users.Any())
        {
            var user1 = new AuraApp.Models.User
            {
                FullName = "Maliha xd",
                Email = "maliha@aura.com",
                Phone = "01700000000",
                PasswordHash = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
                IsSubscribed = true,
                SubscriptionExpiresAt = DateTime.UtcNow.AddDays(30),
                CreatedAt = DateTime.UtcNow
            };
            var user2 = new AuraApp.Models.User
            {
                FullName = "John Doe",
                Email = "john@aura.com",
                Phone = "01800000000",
                PasswordHash = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
                IsSubscribed = false,
                CreatedAt = DateTime.UtcNow
            };
            dbContext.Users.AddRange(user1, user2);
            dbContext.SaveChanges();

            // Seed Subscriptions if table is empty
            if (!dbContext.Subscriptions.Any())
            {
                dbContext.Subscriptions.Add(new AuraApp.Models.Subscription
                {
                    UserId = user1.Id,
                    UserName = user1.FullName,
                    UserEmail = user1.Email,
                    UserPhone = user1.Phone,
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
                    UserId = user1.Id,
                    EventId = 1,
                    UserName = user1.FullName,
                    UserEmail = user1.Email,
                    EventTitle = "Seed Event",
                    Quantity = 2,
                    PaymentMethod = "bKash",
                    PaymentAccount = "01700000000",
                    TransactionId = "TXN-RED001",
                    BookingDate = DateTime.UtcNow,
                    BookingCode = "AURA-BK001",
                    Status = "Confirmed"
                });
            }

            dbContext.SaveChanges();
        }

        // Drop TotalAmount column from MySQL if it exists from previous schema
        try
        {
            var connection = dbContext.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open)
            {
                connection.Open();
            }
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
        catch { }

        Console.WriteLine("MySQL Database 'aura_db' fully seeded and ready for phpMyAdmin!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"DB Initialization Info: {ex.Message}");
    }
}

app.UseCors("AllowAll");
app.UseStaticFiles();
app.UseRouting();

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
