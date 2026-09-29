# AURA Stage 1 — architecture audit and visual/motion foundation

## Scope

This audit covers the active ASP.NET Core project and its served static assets. `wwwroot/index.html.bak` and `wwwroot/js/dashboard.js.bak` are backup snapshots; neither is referenced by the application. `wwwroot/images` is currently empty.

## Application map

### Pages

| Page | Purpose | Main implementation |
| --- | --- | --- |
| `wwwroot/index.html` | Entry gate, discovery, ticket booking, dashboard, seller and account modals | HTML shell plus `flow.js`, `auth.js`, `app.js`, `dashboard.js`, `animations.js` |
| `wwwroot/login.html` | Standalone sign-in | Inline page styles and inline form controller |
| `wwwroot/register.html` | Standalone registration | Inline page styles and inline form controller |

ASP.NET serves the static files and falls back to `index.html` for unmatched paths. The UI is not an MVC/Razor frontend.

### Shared UI/components in `index.html`

- Entrance gate, welcome dialog, intro screen, login gate
- Fixed navigation, user/subscription status, language selector
- Hero, event grid, pagination
- Full-screen dashboard: home, discovery, tickets, subscriptions, seller, admin, profile, settings
- Login, registration, booking, subscription, seller-warning and create-event dialogs
- Toast notification and footer

The standalone auth pages duplicate a subset of the login/register forms rather than sharing templates or components with the index page.

### Stylesheets

| File | Responsibility |
| --- | --- |
| `wwwroot/css/design-system.css` | New shared color, semantic, type, spacing, radius, shadow, timing and easing tokens |
| `wwwroot/css/site.css` | Global base, navigation, gates, marketplace, forms, dialogs, components and existing experience-layer overrides |
| `wwwroot/css/flow.css` | Entry/login stage visibility and transitions |
| `wwwroot/css/dashboard.css` | Full-screen dashboard layout and dashboard-specific experience-layer overrides |

`login.html` and `register.html` retain substantial page-specific inline CSS. Repeated global tokens have been removed from those blocks and now come from `design-system.css`; the page layouts themselves are unchanged.

### JavaScript

| File | Responsibility |
| --- | --- |
| `wwwroot/js/flow.js` | Entrance and login-gate state machine; polls local storage for a user |
| `wwwroot/js/auth.js` | Role assignment, index login/register button overrides, local-storage session checks, logout and another login poll |
| `wwwroot/js/app.js` | Main-page events, rendering, pagination, booking, subscriptions, event creation, language, modal handlers and some duplicate auth logic |
| `wwwroot/js/dashboard.js` | Dashboard section switching, user tickets, discover, seller, admin, profile/settings |
| `wwwroot/js/animations.js` | GSAP hero/scroll/card reveals, navbar scroll state, shared `AuraMotion` helpers and magnetic buttons |
| Inline scripts in `login.html` / `register.html` | Separate login/register submit, validation, offline fallbacks and password toggles |

The canvas animation in `app.js` has been guarded so it does not start a permanent requestAnimationFrame loop while `#aura-canvas` is hidden or reduced motion is enabled.

## Backend and API map

| Controller | Endpoints | Main role |
| --- | --- | --- |
| `AuthController` | `POST /api/auth/register`, `/api/auth/login`, `/api/auth/forgot-password`, `/api/auth/verify-otp`, `/api/auth/reset-password` | User records, password hashes and OTP recovery state |
| `EventsController` | `GET /api/events`, `GET /api/events/{id}`, `POST /api/events/create` | Event listing/details and subscriber-gated publishing |
| `BookingsController` | `POST /api/bookings`, `GET /api/bookings/user/{userId}` | Ticket booking, availability decrement and booking history |
| `SubscriptionsController` | `POST /api/subscriptions/subscribe`, `GET /api/subscriptions/status/{userId}` | Free organizer pass and status |

`Program.cs` selects MySQL or SQLite, creates/seeds the database, enables permissive CORS, serves static files and maps controllers. Data entities and request DTOs live in `Models/Models.cs`; EF configuration is in `Data/AuraDbContext.cs`.

### Frontend API calls

- Events: `GET /api/events` in the marketplace and dashboard; `GET /api/events/{id}` has no current frontend call.
- Booking: `POST /api/bookings` from inline checkout and the modal; `GET /api/bookings/user/{id}` from home, tickets and dashboard views.
- Auth: register/login calls exist in both `app.js`/`auth.js` and the standalone page scripts.
- Subscription and seller: `POST /api/subscriptions/subscribe`, `GET /api/subscriptions/status/{id}` (status is not consistently used), `POST /api/events/create`.
- Recovery: `POST /api/auth/forgot-password` and `/api/auth/reset-password` are called by functions in `app.js`, but the active index markup has no matching recovery form; `/verify-otp` has no frontend caller.
- Admin: `dashboard.js` requests `/api/admin/users`, but no admin controller or route exists. Event totals use `/api/events`; booking/subscriber totals are placeholders. The UI already displays a “not yet available” message when there is no user list.

## User flows

1. **Entry:** entrance gate → welcome → animated intro → login gate. A locally stored `aura_user` can bypass the gates and reveal the marketplace.
2. **Account:** index buttons route to `login.html` / `register.html`; successful or fallback sign-in stores a user object in `localStorage` and redirects/reveals the site.
3. **Discover/book:** event API → event cards/pagination → inline or modal checkout → booking API → update inventory and show confirmation.
4. **Organizer:** subscribe to the free plan → local user subscription state → create event form → event creation API.
5. **Dashboard:** open from nav → choose dashboard section; tickets/home and discovery/seller fetch data; profile/settings render local user/preferences.
6. **Recovery:** server has forgot/verify/reset endpoints, but no complete reachable UI exists in the active page flow.

## Existing colors and tokens

The shared token file now centralizes the existing brand palette without changing its values:

| Token | Existing value |
| --- | --- |
| cream / cream-soft / cream-deep | `#e8ddd4` / `#f2e9e1` / `#d9cfc4` |
| charcoal / charcoal-soft / charcoal-deep | `#171717` / `#232323` / `#0f0f0f` |
| lavender / lavender-soft | `#b8b0d4` / `#d8d2e8` |
| sky / sand | `#a8c5e0` / `#c9b8a8` |

Existing semantic neutrals, provider colors (bKash/Nagad/card) and success/warning/error colors are retained as separate tokens. No page layout or component appearance was redesigned in this stage. New primitives cover spacing, typography, radii, shadows, transition durations and easing so later stages can consume a common system.

The existing supporting values are: card white `#ffffff`, warm white `#faf6f1`, text `#171717` / `#4a4a4a` / `#6b6b6b`, cream border `#d9cfc4`, muted placeholder `#a8a0a0`, charcoal lift `#2a2a2a`, lavender hover `#9a91c0`, bKash `#e2136e`, Nagad `#f7931e` (with `#b45309` for its text contrast), card provider `#3b82f6`, error `#c73a3a`, warning `#c98a2c`, success `#4f8c5c`. `#4285f4` is only the Google brand icon; black and white mask/contrast literals are structural neutrals. Existing alpha/gradient variants use these same hues.

## Duplication and motion audit

- The original palette variables were repeated in `site.css`, `login.html` and `register.html`. They now have one source in `design-system.css`.
- Login/register UI and validation are implemented in both index modals and standalone pages. `app.js` and `auth.js` also both define auth-related handlers; script order determines which globals win.
- Entry/login visibility is coordinated by both `flow.js` and `auth.js`. Their duplicate 400/500 ms local-storage polling loops have been removed; auth completion calls the existing reveal handler directly and cross-tab changes use the `storage` event. The two scripts still have overlapping responsibilities and are a future consolidation candidate.
- Motion was split between CSS keyframes/transitions, GSAP (hero and scroll/card reveals), direct DOM transforms on event cards, and duplicate/dead cursor/parallax/tilt helpers. The direct card tilt and unused GSAP cursor/parallax/tilt implementations were removed; shared reveal, stagger, scale, slide, observer and magnetic helpers live in `AuraMotion`.
- The `#aura-canvas` particle loop used 70 particles and ran continuously despite CSS hiding the canvas. Startup now exits when the canvas is hidden or reduced motion is requested.
- Inline style attributes remain throughout `index.html` and generated event/dashboard markup. They are visual duplication candidates for later component-style extraction, but were not broadly rewritten in this foundation stage.

## Senior creative and engineering review follow-up — 2026-09-26

### Highest-impact corrections

- The first-visit sequence previously ended at a mandatory login gate, preventing people from seeing the event product before creating an account. The intro now opens public discovery; booking and account tools keep their existing sign-in checks. The palette is unchanged.
- Shared interaction timing now comes from `design-system.css`; `interactions.css` no longer overrides the fast and standard duration tokens.
- Booking rejects zero/negative quantities, unsupported payment methods, and unknown user IDs instead of silently assigning the booking to the first database user. Subscription creation likewise rejects unknown user IDs instead of activating the first user.
- Password recovery no longer creates phantom accounts or reports that an OTP was sent without a delivery provider. It returns an explicit unavailable response until delivery is configured.

### Review results and limits

- Source review covered the public homepage/entry flow, event discovery and inline booking, ticket verification, resale story, dashboard sections, and standalone login/register pages. Static checks found no missing homepage anchor targets or unresolved inline handlers.
- `dotnet build --no-restore -p:UseAppHost=false -p:OutputPath=review-build/` succeeded with zero warnings and errors. The built app returned all 16 event records. Isolated API smoke checks exercised registration, login, organizer subscription, event creation, booking, verification, booking history, and subscription status. The uniquely labeled review records were removed and checked for leftovers.
- Invalid-user booking/subscription requests returned 404, zero-quantity booking returned 400, and password recovery returned 503. `git diff --check` reported only the repository's LF/CRLF normalization notices.
- The in-app browser service returned no available browser. I could not visually inspect desktop/tablet/mobile screenshots, emulate reduced-motion mode, or observe browser console and external asset network failures. HTTP checks confirmed the homepage, auth pages, shared CSS/JS files, and event API return successfully.

### Product and security gaps still affecting end-to-end coherence

- The resale section is an explanatory interaction only. There is no resale listing, payment, buyer-protection, or ownership-transfer API, so AURA cannot complete resale or issue a new owner-bound ticket.
- Booking creates a confirmed record and synthetic transaction ID; no payment gateway processes bKash, Nagad, or card payments. The UI must not be treated as a real payment flow until a provider is integrated.
- The API trusts a client-supplied user ID and the frontend stores account identity in local storage; valid IDs can be impersonated because the project has no authenticated server session/token middleware. The invalid-ID fallback is fixed, but this does not replace real authorization.
- Verification history exists only for the current page session, and several dashboard areas have no backing endpoint. OTP email/SMS delivery is not configured.
- The seeded event catalog is demo content. On the review date, 15 of the 16 returned event dates were already past; the dates/venues/currencies should be refreshed from approved event data rather than invented.

### Current animation inventory

- `flow.css`: `introLineIn`, `introBtnFadeIn`, `siteFadeIn`; gate, welcome and login stage opacity/visibility transitions.
- `site.css`: `waveEmoji`, `inlineSlideDown`, mascot `floatMascot`, `waveArm`, `blinkEyes`, `starPulse`; button/card/image/nav/modal/toast/form transitions; event loading shimmer `auraShimmer`.
- `dashboard.css`: `dashSectionIn` and dashboard state/hover transitions.
- `animations.js`: staggered hero letter reveal, hero supporting-item reveal, scroll-triggered fades, event-card reveal, magnetic-button response and navbar scroll state. Public reusable helpers are under `window.AuraMotion`.
- `flow.js` / `auth.js`: gate classes and short delayed class transitions; duplicate timer-based localStorage polling has been removed.
- `app.js`: legacy canvas particle animation remains available only when its canvas is visible and reduced motion is off; the active stylesheet hides it, so it does not start. The duplicated direct card-tilt handlers were removed.

## Broken, incomplete or risky interactions found

These are audit findings, not changes made to booking or authentication behavior in this stage.

| Finding | Evidence / impact |
| --- | --- |
| Forgot password is not reachable end-to-end | The standalone login link opens an alert saying recovery is unavailable; index recovery functions have no corresponding active form markup. The OTP verify endpoint also has no frontend caller. |
| OTP delivery is not implemented | `AuthController` says the OTP was dispatched but contains no email/SMS provider integration and does not return the generated code. A normal user cannot receive the code. |
| Recovery can create a new account | `ForgotPassword` creates a user when the target is unknown, assigning a known default password (`123456`) before recording an OTP. This is both a broken recovery behavior and a security risk. |
| Offline auth silently bypasses the API | `auth.js` and standalone login/register pages synthesize users when requests fail; the Google button creates a fixed demo identity without Google OAuth. The UI can appear authenticated without a backend account. |
| Admin data endpoints are absent | `/api/admin/users` is called but no controller implements it; booking/subscriber analytics are placeholders. The admin page is a partial shell. |
| Client-side role/session state is trusted | Role and identity are held in `localStorage`; API endpoints do not use ASP.NET authentication/authorization middleware. Some write operations accept user IDs from request bodies. |
| Main and standalone auth flows can drift | Duplicate implementations perform different validation, errors and fallbacks. `auth.js` replaces index globals after `app.js` loads. |
| Event fallback data is hardcoded and time-sensitive | `app.js` has a large fallback catalogue with fixed venues, prices, availability, dates and image URLs; seed records and demo users also live in `Program.cs`. Several sample dates are already in the past. |
| Resale and ticket verification are absent | No resale/verification controllers, routes, models, page components or frontend API calls are present in the active project. |
| Legacy snapshots can confuse maintenance | `.bak` files are not served as routes or loaded scripts, but remain beside active files. |

## Foundation architecture for later stages

1. **Tokens (`design-system.css`):** palette → semantic aliases → spacing/type/shape/elevation/timing primitives. New component rules should consume these variables; legacy literal use in component and inline styles remains a migration target. Provider colors stay isolated as provider tokens.
2. **Base and components (`site.css`):** global reset, typography baseline, shared controls, navigation, form fields, dialogs, notices and marketplace components.
3. **Experience shells (`flow.css`, `dashboard.css`):** keep entry-state and dashboard-specific layout/state rules separate from shared controls.
4. **Motion API (`animations.js`, `window.AuraMotion`):** `reveal`, `fadeIn`, `slideIn`, `scaleIn`, `staggerReveal`, `observe`, and `magnetic`; all must honor reduced motion and degrade to visible content without GSAP.
5. **Interaction ownership:** one implementation per interaction. CSS owns short hover/focus/pressed feedback; `AuraMotion` owns entrance/reveal/magnetic behavior; application scripts own booking/auth/dashboard state only.
6. **Later component extraction:** replace repeated inline styles and duplicate auth markup after the audit findings are prioritized. Keep existing endpoints/contracts unless a separate functionality stage authorizes behavior changes.

## Stage 1 foundation changes

- Added `wwwroot/css/design-system.css` and linked it before page styles on all three active pages.
- Removed duplicated root token declarations from the marketplace/auth pages while preserving their exact prior values.
- Added reusable non-color primitives and `AuraMotion` helpers.
- Removed unused cursor/parallax/tilt implementations and the competing direct event-card tilt handler; removed the duplicate local-storage polling loops from the two gate scripts.
- Prevented hidden-canvas animation work from running.
- No controller, schema, API contract, booking, subscription, or page layout was intentionally changed.
