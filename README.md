# AURA++ | 3D Ultimate Event Experience & Seller Platform

![AURA++ Banner](https://img.shields.io/badge/AURA%2B%2B-3D%20Event%20Marketplace-e50914?style=for-the-badge&logo=rocket)
![.NET 8.0](https://img.shields.io/badge/.NET-8.0-512bd4?style=for-the-badge&logo=dotnet)
![MySQL](https://img.shields.io/badge/Database-MySQL-4479a1?style=for-the-badge&logo=mysql)
![PHPMyAdmin](https://img.shields.io/badge/Admin-phpMyAdmin-f39c12?style=for-the-badge&logo=phpmyadmin)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## 🌟 Overview

**AURA++** is a state-of-the-art 3D interactive event ticketing and seller platform built with **C# ASP.NET Core 8.0 Web API** and **MySQL**. Featuring a futuristic glassmorphic UI with dynamic neon particle effects, real-time ticket availability tracking, instant 1-click Pro Seller subscriptions, and an expressive animated cute cartoon mascot system.

---

## 👥 Project Team & Contributors

| Name | Student ID | Role & Responsibilities |
|---|---|---|
| **Maliha Parvin** 👑 | `20230104077` | **Team Leader** & Backend Developer |
| **Nusrat Jahan Shanti** | `20230104089` | Frontend & Backend Developer |
| **MD Hisham Mahmud** | `20230104096` | Frontend & Backend Developer |

---

## ✨ Key Features

### 🎟️ 1. Interactive 3D Event Marketplace
- **Dynamic Event Feed**: Browse top concerts, tech summits, esports tournaments, and festivals.
- **Category Filtering**: Filter events seamlessly by Concert, Tech, Festival, Gaming, and Art.
- **Real-Time Ticket Stock**: Live available ticket counting with automatic stock deduction upon booking.
- **Dynamic Price Display**: Full support for local currency formatting (**BDT ৳**).

### 🤖 2. Animated Cute Cartoon Mascot System
- Expressive SVG mascot with animated blinking eyes, floating animations, and dynamic state reactions.
- **Celebratory Thank You View**: Instant popup thanking new subscribers (`"Thank You! 🎉 You are now an official Subscribed Pro Seller!"`).
- **Sad Warning Mascot View**: Non-subscribed sellers attempting to publish events receive a protective warning modal blocking access until subscribed (`"Sorry! You must subscribe to our website to sell tickets"`).

### 👑 3. Instant 1-Click Free Pro Seller Subscription
- **100% Free Pro Seller Pass (0 BDT)**: Zero cost subscription flow.
- **Navigation Badge Update**: Automatically turns the top navigation button into a green **`✓ SUBSCRIBED`** badge.
- **Access Control**: Grants instant authorization to create and publish events.

### 🎪 4. Event Organizer & Seller Payout Setup
- Subscribed organizers can publish new events with ticket pricing, stock, category, and date.
- Integrated payout receiving options (**bKash**, **Nagad**, **Bank Account**).

### 💳 5. Fast Ticket Booking Engine
- Inline ticket checkout forms with real-time total price calculation.
- Supports **bKash**, **Nagad**, and **Credit/Debit Card** checkout options.
- Generates unique ticket codes (e.g. `AURA-BK982A`) and transaction IDs (`TXN-...`).

### 🔐 6. Account Management & Security
- User registration and login with white eye-icon password visibility toggles (`fa-eye`).
- **OTP Password Recovery**: Forgot password recovery system with 6-digit OTP code dispatch and verification.
- **User Dashboard**: Dedicated dashboard tab to view purchased tickets and seller pass status.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
|---|---|---|
| **Backend Framework** | C# .NET 8.0 | ASP.NET Core Web API Architecture |
| **Database Engine** | MySQL 8.0 / MariaDB | Database Schema `aura_db` |
| **ORM Access** | Entity Framework Core 8.0 | Pomelo MySQL EF Core Provider |
| **Database Tool** | phpMyAdmin | Web-based database management (`http://localhost:8080/phpmyadmin/`) |
| **Frontend UI** | HTML5 / CSS3 / ES6+ JS | 3D Glassmorphism, Cyberpunk Neon Styles & Async Client |
| **Visual Assets** | FontAwesome 6 Pro & SVG | Custom Animated Mascot System & Canvas Engine |

---

## 📁 Repository Structure

```
E:\3.2(SD)\
├── Controllers/
│   ├── AuthController.cs          # Authentication, Registration & OTP Recovery APIs
│   ├── BookingsController.cs      # Ticket Booking & User Ticket History APIs
│   ├── DatabaseAdminController.cs # Database inspection APIs for phpMyAdmin
│   ├── EventsController.cs        # Event feed, filters, and creation APIs
│   └── SubscriptionsController.cs # Pro Seller Subscription APIs
├── Data/
│   └── AuraDbContext.cs           # Entity Framework Core DB Context
├── Models/
│   └── Models.cs                  # Data Models (User, Event, Booking, Subscription) & DTOs
├── wwwroot/                       # Frontend Static Files
│   ├── index.html                 # Main Single Page Application (SPA)
│   ├── css/
│   │   └── site.css               # 3D Glassmorphism & Cyberpunk Neon Stylesheet
│   └── js/
│       └── app.js                 # Frontend Client Logic & Canvas Renderer
├── Program.cs                     # Application Entrypoint, Database Auto-Creation & Seeding
├── AuraApp.csproj                 # C# Project File
└── appsettings.json              # App Configuration & MySQL Connection Strings
```

---

## 🗄️ Database Schema (`aura_db`)

The application automatically creates and seeds the MySQL `aura_db` database with 4 core tables:

1. **`Users`**: Stores user credentials, phone numbers, and subscription status (`IsSubscribed`, `SubscriptionExpiresAt`).
2. **`Events`**: Stores event titles, venues, ticket stock, category, price, and seller payout accounts.
3. **`Bookings`**: Stores ticket purchases, quantities, payment method, transaction IDs, ticket codes, and buyer info (`UserName`, `UserEmail`).
4. **`Subscriptions`**: Stores Pro Seller subscriptions, transaction IDs, subscriber details (`UserName`, `UserEmail`, `UserPhone`), and expiry dates.

---

## 🚦 Getting Started & Local Setup

### Prerequisites
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) installed.
- [XAMPP](https://www.apachefriends.org/) (MySQL running on port 3306, Apache / phpMyAdmin running on port 8080).

### 1. Clone the Repository
```bash
git clone https://github.com/maliha-noon/SD-3.2-.git
cd SD-3.2-
git checkout noon
```

### 2. Run the Application
Open PowerShell in the project directory and execute:
```powershell
# Stop any existing process instance
taskkill /F /IM AuraApp.exe 2>$null

# Launch ASP.NET Core Application
dotnet run
```

### 3. Open in Browser
- **Web Application**: `http://localhost:5000`
- **phpMyAdmin Database**: `http://localhost:8080/phpmyadmin/index.php?route=/database/structure&db=aura_db`

---

## 📜 License

Distributed under the **MIT License**. Built with ❤️ by the AURA++ Team.
