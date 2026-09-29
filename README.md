# AURA+ | Ultimate Event Experience & Seller Platform

![AURA+ Banner](https://img.shields.io/badge/AURA%2B-Event%20Marketplace-e50914?style=for-the-badge&logo=rocket)
![React 18](https://img.shields.io/badge/Frontend-React%2018-61dafb?style=for-the-badge&logo=react)
![.NET 8.0](https://img.shields.io/badge/Backend-.NET%208.0-512bd4?style=for-the-badge&logo=dotnet)
![SQL Database](https://img.shields.io/badge/Database-SQL%20Server%20%2F%20SQLite-00758f?style=for-the-badge&logo=sqlite)

---

## 🌟 Overview

**AURA+** is a high-performance, interactive event ticketing and seller platform built with **React 18 (Frontend SPA)**, **C# ASP.NET Core 8.0 Web API (Backend)**, and **Entity Framework Core SQL Database** (`aura_db`).

Featuring a modern glassmorphism UI with dynamic 3D neon canvas particle background, interactive seat selection matrix, real-time ticket availability tracking, 1-click Pro Seller subscriptions, bKash / Nagad / Card payment processing, and a built-in **Live SQL Database Admin Panel**.

---

## 🌟 Key Features

| Name | Student ID | Role & Responsibilities |
|---|---|---|
| **Nusrat Jahan Shanti** | `20230104089` | Frontend & Backeend  Developer |
| **Maliha Parvin** | `20230104077` | Frontend & Backend Developer |
| **MD Hisham Mahmud** | `20230104096` | Frontend & Backend Developer |

---

## ✨ Key Features

### ⚛️ 1. Modern React 18 Single Page Application (SPA)
- **Component Architecture**: Built with modular React state management (`App`, `HomeView`, `DashboardView`, `DatabaseAdminView`, `BookingModal`, `SubscribeModal`, `CreateEventModal`).
- **3D Neon Background Canvas**: Interactive particle system rendering in real-time.
- **Multi-Language System**: Instant language toggle for **English**, **🇧🇩 বাংলা**, and **🇪🇸 Español**.

### 🎟️ 2. Interactive Event Marketplace & Category Filtering
- **Dynamic Event Feed**: Instant search across titles, venues, locations, and categories.
- **Rich Categories**: Football & Stadium, Outdoor Sports, Horse Riding, Concerts, Gala, EDM, Esports, Fashion, Cinema, Theatre, and Gaming.
- **Live Ticket Stock Progress Bar**: Real-time stock counting with automatic deduction upon purchase.
- **Currency Formatting**: Prices displayed in local currency (**BDT ৳**).

### 💺 3. Ticket Checkout & Seat Matrix Engine
- **Seat Matrix Selector**: Interactive 4x6 grid (Row A to D) for picking specific seat numbers (e.g. `A-1`, `B-4`).
- **Multi-Payment Options**: Integrated payment modal for **bKash**, **Nagad**, and **Credit/Debit Card** (Visa, MasterCard, AMEX, DBBL Nexus).
- **Instant Generation**: Automatic issuance of unique ticket codes (`TKT-8F3K92X1`) and transaction IDs (`BKASH-`, `NAGAD-`, `VISA-`).

### 🤖 4. Interactive Mascot & Access Control
- Expressive SVG Mascot assistant with animated reactions.
- **Protected Access Control**: Non-subscribed sellers attempting to list events receive a protective Mascot modal guiding them to the subscription flow (`"Sorry! You must subscribe to our website to sell tickets"`).

### 👑 5. Instant 1-Click Free Pro Seller Subscription
- **100% Free Pro Seller Pass (0 BDT)**: 1-click subscription flow.
- **Navigation Badge Update**: Automatically updates navigation chip to green **`✓ SUBSCRIBED`**.
- **Seller Authorizations**: Grants instant access to publish and list ticket sales.

### 🎪 6. Event Organizer Portal & Payout Setup
- Subscribed organizers can list new events with venue, date, pricing, stock, category, and payout accounts (**bKash**, **Nagad**, **Bank Account**).

### 📊 7. Live SQL Database Admin Inspector
- Built-in SQL database table viewer querying EF Core tables (`Users`, `Events`, `Bookings`, `Subscriptions`, `Reviews`) with live row counts, columns, data grids, and search filters.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
|---|---|---|
| **Frontend Framework** | React 18 SPA | Single-Page Application with Babel JSX rendering |
| **Backend Framework** | C# .NET 8.0 | ASP.NET Core Web API Controllers |
| **Database Engine** | SQL Server / SQLite / MySQL | Auto-created & seeded Entity Framework Core database |
| **ORM & Data Access** | Entity Framework Core 8.0 | `AuraDbContext` with automatic schema migrations & backfills |
| **Styling & Icons** | Vanilla CSS3 & FontAwesome 6 | Glassmorphism UI, 3D Canvas, FontAwesome Icons |

---

## 🗄️ SQL Database Schema (`aura_db`)

The application automatically initializes and seeds the SQL database with 5 core tables:

1. **`Users`**: User credentials, phone numbers, password hashes, and Pro subscription status.
2. **`Events`**: Event listings, venue, location, date, price, total/available ticket stock, category, and seller payout details.
3. **`Bookings`**: Ticket purchases, seat number, payment method, transaction IDs, ticket codes, and buyer info.
4. **`Subscriptions`**: Pro Seller subscriptions, transaction IDs, subscriber details, and expiry dates.
5. **`Reviews`**: Customer testimonials, star ratings, and community feedback.

# 2. Build and run the ASP.NET Core web application
dotnet run

# 3. Access in browser
# http://localhost:5000 or http://localhost:5005
```

### Prerequisites
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) installed.

```bash
git clone https://github.com/maliha-noon/SD-3.2-.git
cd SD-3.2-
```

### 2. Build & Run the Application
Open PowerShell or Command Prompt in the project directory and execute:
```powershell
# Build ASP.NET Core Project
dotnet build

# Run ASP.NET Core & React Application
dotnet run --urls "http://localhost:5000"
```
SD-3.2-source/
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # GitHub Actions CI/CD Pipeline
├── Controllers/               # C# ASP.NET Core Web API Controllers
│   ├── AccountController.cs
│   ├── AdminController.cs    # Admin Maliha Control & Buyers Endpoints
│   ├── AuthController.cs
│   ├── BookingsController.cs
│   ├── EventsController.cs
│   └── ResaleController.cs
├── Data/
│   └── AuraDbContext.cs      # EF Core DbContext & Seed Data
├── Models/
│   └── Models.cs              # C# Data Models & Entities
├── wwwroot/                   # Static Frontend Web Assets
│   ├── css/                   # Design system & Admin panel CSS
│   ├── js/                    # Dashboard & Auth JS logic
│   └── index.html             # Main Dashboard & Admin UI
├── Dockerfile                 # Multi-stage Dockerfile
├── docker-compose.yml         # Container Orchestration
├── Program.cs                 # C# App Entrypoint & Middleware
└── README.md                  # Project Documentation
```

---


---
*Updated & Maintained by MD Hisham Mahmud (20230104096) for AURA+ Event Platform.*

