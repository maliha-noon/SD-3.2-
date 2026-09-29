# AURA++ — Event Ticketing Platform

A full-stack event ticketing web application built with **ASP.NET Core 8** (backend) and **Vanilla JS + React 18** (frontend).

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | ASP.NET Core 8 Web API (C#) |
| **Database** | SQLite (default) / MySQL 8 (auto-detected) |
| **ORM** | Entity Framework Core 8 |
| **Frontend** | HTML5 + Vanilla JS + React 18 (CDN) |
| **Auth** | Cookie-based authentication (ASP.NET Core Identity) |
| **Styling** | Vanilla CSS (no Tailwind, no PHP) |

> ⚠️ **No PHP is used anywhere in this project.** The backend is 100% C# ASP.NET Core.

---

## Quick Start

```powershell
# 1. Navigate to project root
cd d:\SD-3.2-source

# 2. Run the application (builds automatically)
dotnet run

# 3. Open in browser
# http://localhost:5000
```

---

## Database

The app uses **SQLite by default** (`aura.db` in the project root). If a MySQL server is running on `localhost:3306`, it auto-connects to `aura_db` instead.

### Database Tables

| Table | Description |
|---|---|
| `Users` | Registered accounts (Admin, Organizer, Customer roles) |
| `Events` | Published event listings |
| `Bookings` | Ticket booking records |
| `Tickets` | Individual ticket instances per booking |
| `Subscriptions` | Pro Seller / Organizer subscriptions |
| `SavedEvents` | User-saved/favorited events |
| `ResaleListings` | Active resale listings for tickets |
| `TicketTransfers` | Ownership transfer history |
| `VerificationAttempts` | Ticket verification check log |
| `EventSubmissions` | Organizer event submission requests |

### Seed Accounts

| Name | Email | Password | Role |
|---|---|---|---|
| Nusrat Jahan Shanti | shanti@aura.com | 123456 | Admin |
| Maliha Parvin | maliha@aura.com | 123456 | Organizer |
| John Doe | john@aura.com | 123456 | Customer |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/register` | Register |
| `GET` | `/api/auth/me` | Current session user |
| `GET` | `/api/events` | List all events |
| `POST` | `/api/events` | Create event (Organizer+) |
| `GET` | `/api/bookings` | My bookings |
| `POST` | `/api/bookings` | Create booking |
| `GET` | `/api/bookings/tickets` | My tickets |
| `POST` | `/api/bookings/verify` | Verify ticket |
| `GET` | `/api/account/profile` | My profile |
| `PUT` | `/api/account/profile` | Update profile |
| `GET` | `/api/account/dashboard` | Dashboard overview |
| `GET` | `/api/account/history` | Activity history |
| `GET` | `/api/account/notifications` | Notifications |
| `GET` | `/api/subscriptions/status` | Subscription status |
| `GET` | `/api/resale/listings` | Public resale listings |
| `POST` | `/api/resale/list` | List ticket for resale |
| `GET` | `/api/admin/summary` | Admin stats (Admin only) |
| `GET` | `/api/admin/users` | All users (Admin only) |

---

## Project Structure

```
SD-3.2-source/
├── Controllers/          # ASP.NET Core API controllers
│   ├── AuthController.cs
│   ├── AccountController.cs
│   ├── BookingsController.cs
│   ├── EventsController.cs
│   ├── ResaleController.cs
│   ├── SubscriptionsController.cs
│   └── AdminController.cs
├── Data/
│   └── AuraDbContext.cs  # Entity Framework DbContext
├── Models/
│   └── Models.cs         # C# entity models
├── wwwroot/              # Static frontend files
│   ├── index.html        # Main SPA shell
│   ├── login.html        # Login page
│   ├── register.html     # Register page
│   ├── css/              # Stylesheets
│   └── js/
│       ├── app.js        # Main application logic
│       ├── auth.js       # Auth helpers
│       ├── dashboard.js  # Dashboard controller
│       ├── animations.js # UI animations
│       ├── flow.js       # Scroll/flow animations
│       └── react-app.js  # React 18 components
├── Program.cs            # App startup & DB seeding
├── appsettings.json      # Config (connection strings)
└── AuraApp.csproj        # .NET 8 project file
```

---

## Dashboard Features

The dashboard is a full SPA panel (no page reload) with:

- **Home** — Stats: tickets bought, total spend, bookings; booking chart; upcoming tickets
- **Discover** — Browse events inside dashboard
- **My Tickets** — Digital ticket cards with verification buttons
- **Verification** — Ticket check history
- **Resale** — Active resale listings management
- **Subscriptions** — Pro Seller status
- **My Events** — Organizer event management (Organizer/Admin only)
- **Admin Panel** — Platform stats + user list (Admin only)
- **Profile** — Edit name, email, phone
- **History** — Full activity log
- **Notifications** — Upcoming event reminders
- **Settings** — Language preference

---

## Stop the Application

```powershell
# Press Ctrl+C in the terminal, or:
taskkill /F /IM AuraApp.exe
```
