# Kyros Journal — Master Documentation

**Audit date:** 2026-10-23  
**Repository:** `Pranav-kokitkar/trading-journal-saas`  
**Audit basis:** source inspection of the client, server, configuration, models, routers, controllers, tests, and repository screenshots. Runtime behavior was not independently exercised with a signed-in account, so statements marked **Unable to verify** should be confirmed in a deployed environment.

## 1. Application Overview

Kyros Journal is a dark-themed trading journal with:

- A React 19/Vite single-page client.
- An Express 5 API backed by MongoDB through Mongoose.
- JWT authentication and role-based admin authorization.
- Trade entry, editing/closing, soft deletion/restoration, screenshots, notes, tags, strategies, accounts, analytics, comparisons, exports, market-data proxying, payments, and compliance/trading rules.
- Separate protected user routes under `/app/*` and protected admin routes under `/admin/*`.

The repository contains both the source application and generated/deployed assets. The client deployment metadata points to GitHub Pages, while the server is independently configured and the client also contains a Netlify function/API proxy. The exact production topology is **Unable to verify** from source alone.

## 2. Technology Stack

### Client

- React `^19.0.0-rc.1`, React DOM, React Router `^7.9.1`.
- Vite `^7.1.2` and `@vitejs/plugin-react`.
- Recharts and Lightweight Charts for visualization.
- React Icons for navigation and UI icons.
- React Hot Toast and React Toastify for notifications.
- UUID for client identifiers where required.
- CSS Modules plus global CSS custom properties.

### Server

- Node.js CommonJS application.
- Express `^5.1.0`.
- Mongoose `^8.19.4` and MongoDB.
- JSON Web Tokens, bcryptjs, Zod validation.
- Helmet, CORS, express-rate-limit.
- Multer for multipart uploads and Cloudinary integration.
- Razorpay for payment order/verification.
- csv-parse for imported trades.
- dotenv for environment configuration.

### Commands

Client commands are defined in [`client/package.json`](C:/TradingJournal/trading-journal/client/package.json):

```text
bun run dev
bun run build
bun run lint
bun run preview
bun run deploy
```

Server commands are defined in [`server/package.json`](C:/TradingJournal/trading-journal/server/package.json):

```text
npm start
npm run dev
npm run test:compliance
```

## 3. Project Structure

```text
client/
  src/
    components/
      Layout/
      Pages/
      Admin/
    config/
    context and stores/
    theme.css
    App.jsx
  public/
  netlify/
  dist/
server/
  controllers/
  models/
  routers/
  middleware/
  services/
  validators/
  utils/
  config/
  tests/
  server.js
screenshots/
```

The client page directory includes authorization, dashboard, trade entry/detail/history, notes, account, analytics, compare, strategies, tags, trading rules, upgrade, contact, homepage, and error pages. The server separates transport routers, controllers, persistence models, middleware, validation, and utility/service code.

## 4. Feature and Route Inventory

### Public routes

| Route | Component | Purpose |
|---|---|---|
| `/` | `HomePage` | Marketing/landing page |
| `/register` | `Register` | Account registration |
| `/login` | `Login` | Account login |
| `/contact` | `Contact` | Public help/contact form |

### Protected application routes

All `/app` children are wrapped by `ProtectedRoute` and `Layout`.

| Route | Component | Status |
|---|---|---|
| `/app` | Redirect/index to dashboard | Implemented |
| `/app/dashboard` | `Dashboard` | Implemented; runtime data not independently verified |
| `/app/trade-history` | `TradeHistory` | Implemented |
| `/app/trade/:id` | `Trade` | Implemented |
| `/app/add-trade` | `AddTrade` | Implemented |
| `/app/add-notes` | `AddNotes` | Implemented |
| `/app/my-account` | `MyAccount` | Implemented |
| `/app/contact` | `Contact` | Implemented |
| `/app/upgrade` | `Upgrade` | UI and payment flow present; payment completion not independently verified |
| `/app/compare` | `Compare` | Implemented |
| `/app/analytics` | `AnalyticsDashboard` | Implemented |
| `/app/trading-rules` | `TradingRules` | Implemented |
| `/app/trade-setups` | Redirect to `/app/tags` | Compatibility redirect, not a standalone page |
| `/app/strategies` | `Strategies` | Implemented |
| `/app/tags` | `Tags` | Implemented |

### Admin routes

Admin children are wrapped by `AdminProtectedRoute`, provider contexts, and `AdminLayout`.

`/admin/dashboard`, `/admin/users`, `/admin/user/:id`, `/admin/contacts`, `/admin/accounts`, `/admin/accounts/:id`, `/admin/trades`, `/admin/trades/:id`, and `/admin/pro-management` are registered. Admin access depends on the authenticated user’s `isAdmin` claim.

## 5. Dashboard

The dashboard is composed of KPI/summary content and chart components:

- `PnLChart`
- `WinLossChart`
- `EquityCurveChart`
- `RiskChart`
- `DirectionChart`

The source and server analytics controllers provide performance summaries, P&L, win/loss, equity, risk, direction/session/symbol/setup groupings, and recent trade-oriented data. Exact rendered card ordering and empty-state text should be confirmed against the supplied `screenshots/dashboard.png`; source inspection confirms the chart components but does not prove every metric is populated in every account state.

Dashboard data is account/user scoped through authenticated API requests. Calculations are performed in the analytics/trade controller and/or client chart preparation; the precise division varies by metric and should be treated as **partially verified** unless the corresponding controller function is inspected for that metric.

## 6. Trade History

`TradeHistory` and `TradeCard` display the user’s trades and support the trade-management lifecycle:

- GET list of trades.
- Search/filter/sort/pagination controls in the page implementation.
- Open a trade detail route.
- Edit/close a trade through `TradeHistoryTradeModal` and the trade detail flow.
- Delete/soft-delete and restore/undo operations.
- Notes, tags, strategy association, screenshots, and imported-trade inclusion.

### Trade data

The [`trade-model.js`](C:/TradingJournal/trading-journal/server/models/trade-model.js) schema stores:

- `userId`, `accountId`, market type, symbol, direction.
- Entry/stop/take-profit prices and one or more exited prices/volumes.
- P&L, R/R, slippage, commission, risk amount/percent, result, status.
- Live/backtest mode and imported flag.
- Balance after trade and trade number.
- Date/time, entry/exit times and duration fields.
- Notes, session, grade, confidence, strategy and tag references.
- Screenshot URLs.
- Soft-delete and audit metadata.

Screenshots are uploaded using Multer and may be persisted through Cloudinary. The PRO plan supplies a maximum screenshot count through `config/planLimits`.

### Trade API

- `POST /api/trades/import`
- `POST /api/trades`
- `GET /api/trades`
- `GET /api/trades/:id`
- `PATCH /api/trades/:id`
- `DELETE /api/trades/:id`
- `POST /api/trades/:id/restore`
- `POST /api/trades/:id/undo`
- `PATCH /api/trades/:id/note`
- `PATCH /api/trades/:id/tags`
- `PATCH /api/trades/:id/screenshots`
- `DELETE /api/trades/:id/screenshot`

All trade routes use authentication. Import accepts a multipart CSV file.

## 7. Analytics

`AnalyticsDashboard` calls the authenticated analytics endpoint and renders account/trade performance breakdowns. The repository also contains chart implementations in the dashboard and comparison-specific chart components.

The backend endpoint is:

```text
GET /api/analytics/
```

The implementation supports trade-derived aggregations rather than a separate analytics database. Available dimensions found in the application include time/date, symbol, direction, session, strategy, tags, result, and risk/performance measures. Exact axis labels and whether each filter affects every chart are **Unable to verify** without exercising the page with data.

## 8. Trade Setups

The legacy `TradeSetups` directory contains a page component and nested Strategy/Tags components, but the active router does not render `TradeSetups`. `/app/trade-setups` redirects to `/app/tags`. The active navigation uses a collapsible “Strategies & Tags” parent with separate links, so the legacy page should not be documented as an active standalone feature.

## 9. Strategies

`/app/strategies` is a separate active page, not a generic alias for tags.

Supported server operations:

- `GET /api/strategy`
- `POST /api/strategy`
- `PATCH /api/strategy/:id`
- `DELETE /api/strategy/:id`

The page manages strategy records and associates trades through the trade `strategy` ObjectId reference. Strategy descriptions/rules and performance/detail behavior are implemented in the strategy page and controller. The exact schema fields and all page-level statistics should be confirmed from the Strategy model/controller when extending this documentation; this audit does not infer unsupported fields.

## 10. Tags

`/app/tags` is a separate active page.

Supported server operations:

- `GET /api/tags`
- `POST /api/tags`
- `PATCH /api/tags/:id`
- `DELETE /api/tags/:id`

Trades store tag ObjectId references in an array. The active sidebar links directly to this page. Tag creation, editing, deletion, and association are implemented in `Tags.jsx`, `tags-controller.js`, and `Tags-router.js`. Tag color/description and usage/performance presentation are **partially verified** from the page surface and should not be assumed to be persisted unless confirmed in the tags model/controller.

## 11. Trading Rules and Violation History

The active route is `/app/trading-rules`, implemented by `TradingRules.jsx` and its CSS module.

The rule model supports:

- User and account ownership.
- Optional strategy association.
- Name and description.
- Categories `risk_management` and `strategy_execution`.
- Rule types: `max_risk_percent`, `max_daily_loss`, `max_trades_per_day`, `required_stop_loss`, `min_rr`, `allowed_directions`, and `allowed_sessions`.
- Mixed configuration payload.
- Enabled/disabled state.
- `info`, `warning`, and `critical` severities.
- `warning` or `tracking` enforcement modes.
- An override flag.

Compliance routes:

```text
GET    /api/compliance/rules
POST   /api/compliance/rules
PATCH  /api/compliance/rules/:id
DELETE /api/compliance/rules/:id
GET    /api/compliance/trades/:tradeId
POST   /api/compliance/trades/:tradeId/re-evaluate
GET    /api/compliance/summary
```

The server also loads `rule-evaluation-model.js`, which records rule evaluation/violation results. The UI exposes rule creation, filters/listing, enable/disable, delete, summary/status badges, and trade-view actions. Automatic evaluation timing (on trade creation, close, or only on explicit re-evaluation) is **partially verified**; the explicit re-evaluation endpoint is definitely present.

The source contains a known potential discrepancy worth preserving in documentation: rule lists and violation history are served by separate queries and may differ based on account, enabled, strategy, or pagination filters. No claim that a reported zero-match issue is fixed is made here.

## 12. Notes

`/app/add-notes` uses `AddNotes`, `DisplayNotes`, and `NoteModal`.

Supported operations:

- `GET /api/notes`
- `POST /api/notes`
- `PATCH /api/notes/:id`
- `DELETE /api/notes/:id`

Notes are authenticated and user-scoped. The exact association model (trade-linked versus standalone note) is **Unable to verify** as a universal rule; the UI and controller should be consulted for individual fields.

## 13. Compare

`Compare` uses dataset cards, dimension selectors/inputs, and comparison charts. It submits comparison criteria to:

```text
POST /api/compare/
```

The feature is intended to compare trade-performance datasets across dimensions such as strategies, tags, symbols, sessions, directions, or time ranges. The server owns the comparison calculation (`compare-controller.js`, including `calculateStats`). Exact accepted payload combinations and all chart series are **Unable to verify** without executing the form.

## 14. Upgrade and Get Help

### Upgrade

`/app/upgrade` presents the subscription/PRO upgrade experience. Payment routes are authenticated:

- `POST /api/payment/create-order`
- `POST /api/payment/verify`

Razorpay is a server dependency. Successful subscription state is represented in auth/user data and controls visibility of the Upgrade link and PRO badge. Live gateway behavior and webhook configuration are **Unable to verify**.

### Get Help

`Contact` is available publicly and under `/app/contact`. It submits:

```text
POST /api/contact/
```

The endpoint accepts a `screenshot` multipart upload. Contact/admin review is also exposed through `GET /api/admin/contact`.

## 15. Complete Design System

The authoritative design tokens are in [`client/src/theme.css`](C:/TradingJournal/trading-journal/client/src/theme.css). The application uses a dark, layered, glass-like trading dashboard style with indigo/violet accents, teal profit states, coral loss states, translucent surfaces, gradients, and soft elevation.

- Default theme: dark.
- No source-defined light-theme selector was found during this audit.
- Global page background is `var(--bg-primary)` with the broader gradient/vignette tokens available to layouts.
- Sidebar navigation uses a translucent dark background, active indigo-tinted state, icons from `react-icons/fa`, and a responsive drawer/layout implementation.
- Cards use layered dark gradients, subtle borders, rounded corners, and shadow tokens.
- Inputs use translucent dark backgrounds and accent borders on focus.
- Charts use transparent chart backgrounds, muted grid/axis text, and semantic profit/loss/accent series.

## 16. Exact Colour Palette and Theme Tokens

| Token/usage | Exact value | Usage |
|---|---|---|
| `--bg-primary` | `#0a0f18` | Compatibility alias/page background |
| `--bg-app-gradient` | `linear-gradient(135deg, #070b12 0%, #0a0f18 38%, #0d1220 72%, #070b12 100%)` | App background |
| `--accent` | `#6e7cff` | Primary accent |
| `--accent-bright` | `#9aa6ff` | Bright accent/highlights |
| `--accent-dim` | `#4e5ce4` | Accent hover/dim |
| `--accent-teal` | `#49d6c4` | Secondary teal |
| `--color-profit` | `#3dd6a6` | Positive P&L/status |
| `--color-loss` | `#ff7f87` | Negative P&L/errors |
| `--color-neutral` | `#9aa6ba` | Neutral states |
| `--color-warning` | `#f6c56e` | Warning state |
| `--text-primary` | `#eef3fb` | Headings/important content |
| `--text-secondary` | `#a1afc3` | Body/secondary content |
| `--text-muted` | `#66758c` | Metadata/axis text |
| `--text-accent` | `#818cf8` | Accent text |
| `--border-subtle` | `rgba(255, 255, 255, 0.06)` | Subtle separators |
| `--border-default` | `rgba(255, 255, 255, 0.1)` | Standard borders |
| `--border-strong` | `rgba(255, 255, 255, 0.16)` | Strong borders |
| `--border-accent` | `rgba(110, 124, 255, 0.42)` | Focus/accent border |
| `--surface-panel` | `rgba(13, 18, 30, 0.84)` | Panels |
| `--surface-panel-strong` | `rgba(16, 22, 36, 0.94)` | Strong panels |
| `--surface-card` | `linear-gradient(180deg, rgba(18, 23, 36, 0.96) 0%, rgba(10, 15, 26, 0.94) 100%)` | Cards |
| `--surface-card-strong` | `linear-gradient(180deg, rgba(21, 28, 43, 0.98) 0%, rgba(11, 16, 28, 0.96) 100%)` | Inputs/strong cards |
| `--nav-bg` | `rgba(7, 10, 18, 0.92)` | Sidebar |
| `--btn-primary-text` | `#ffffff` | Primary button text |
| `--btn-danger-text` | `#fca5a5` | Destructive button text |

Additional exact tokens include translucent accent/semantic backgrounds, glass borders/shadows, button gradients, chart fills, tooltip colors, skeleton colors, overlay backdrop, scrollbar colors, and compatibility aliases. They are all defined in `theme.css`; components may also have local module-specific values.

## 17. Typography, Spacing, and Components

### Typography

- Sans: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Monospace: `"JetBrains Mono", "Fira Code", "Cascadia Code", monospace`.
- Sizes: 10px, 11px, 13px, 15px, 17px, 20px, 24px, 30px, 38px.
- Weights explicitly tokenized: 400 and 500.
- Wide tracking token: `0.06em`.

### Spacing and shape

- Spacing: 4, 8, 12, 16, 20, 24, 32, 40, and 48px.
- Radii: 6, 10, 14, 18px and pill `999px`.
- Card shadow: `0 14px 40px rgba(0, 0, 0, 0.3)`.
- Elevated shadow: `0 22px 60px rgba(0, 0, 0, 0.42)` plus an inset highlight.
- Dropdown shadow: `0 18px 50px rgba(0, 0, 0, 0.58)`.

### Components and interaction states

Buttons, inputs, badges, cards, tables, navigation items, charts, alerts, pagination, and skeletons have tokenized variants. Hover/focus/active/disabled states are represented by dedicated tokens such as `--bg-hover`, `--bg-active`, input focus borders, button hover gradients, active nav background/border, and reduced opacity for disabled controls.

The Trading Rules module confirms common patterns: sticky create card on wide screens, stacked layout below 1100px, two-column summary collapsing below 900px, and single-column form/rule layout on small screens. Other modules add their own responsive breakpoints.

## 18. Navigation and User Workflows

The sidebar navigation in [`SideBar.jsx`](C:/TradingJournal/trading-journal/client/src/components/Layout/SideBar.jsx) contains Dashboard, Trade History, Analytics, expandable Strategies & Tags, Trading Rules, Notes, Compare, conditional Upgrade, Get Help, and conditional Admin. It also provides an “Include Imported Data” toggle and account/PRO footer link.

### Add and review a trade

1. Authenticated user opens Add Trade.
2. The multi-part form collects trade information, prices, setup, status, and calculator inputs.
3. Optional screenshots are uploaded.
4. `POST /api/trades` persists the trade.
5. Trade History retrieves it through `GET /api/trades`.
6. The user opens `/app/trade/:id` for detail, close/edit, notes, tags, screenshots, or compliance actions.

### Organize performance

Strategies and tags are maintained independently, then referenced by trades. Dashboard, Analytics, and Compare consume the resulting trade associations.

### Rules

The user creates/enables/disables rules, views summaries, and can inspect or re-evaluate a trade’s compliance. Persisted rules and evaluations are account-scoped.

### Account and imports

My Account includes account selection/management and import functionality. Imported trades are separately tracked by `isImported`; the sidebar toggle controls whether imported data is included in relevant views.

## 19. Backend and API Reference

Server mount points from [`server.js`](C:/TradingJournal/trading-journal/server/server.js):

| Mount | Main operations |
|---|---|
| `/api/auth` | register, login, current user |
| `/api/trades` | CRUD, import, restore/undo, notes/tags/screenshots |
| `/api/audit` | authenticated audit query |
| `/api/user` | user profile and active account |
| `/api/notes` | CRUD notes |
| `/api/contact` | contact submission/upload |
| `/api/account` | active account, delete, recalculate |
| `/api/admin` | admin users, contacts, accounts, trades, dashboard |
| `/api/payment` | create and verify payment |
| `/api/export` | trade export |
| `/api/tags` | CRUD tags |
| `/api/strategy` | CRUD strategies |
| `/api/compare` | comparison calculation |
| `/api/analytics` | analytics |
| `/api/market-data` | Binance klines and Yahoo chart proxy |
| `/api/compliance` | rules and evaluations |
| `/health` | health/status JSON |

Authentication is JWT-based. The auth middleware populates both `_id` and `id` compatibility fields, plus email and `isAdmin`; controllers historically use both `req.userID` and user identity fields. This compatibility is documented in `BUG_FIX_SUMMARY.md`.

## 20. Database Schema and Relationships

MongoDB/Mongoose models include User, Account, Trade, Notes, Tags, Strategy, TradingRule, and RuleEvaluation, plus admin/audit-related records where applicable.

Core relationships:

- User → many Accounts and Trades.
- Account → many Trades and TradingRules.
- Trade → one Strategy and many Tags.
- TradingRule → optional Strategy and many RuleEvaluation records.
- RuleEvaluation → Trade/rule relationship used for compliance history.

The Trade schema has indexes for user/account/date, status, symbol, result, imported data, strategy, and session analytics. TradingRule indexes support user/account/enabled and strategy/type filtering. Account indexes support user/status and creation-date access.

## 21. Trading Calculations and Business Logic

Verified persisted trade fields include `pnl`, `rr`, `riskAmount`, `riskPercent`, `balanceAfterTrade`, duration fields, and result/status fields. The application also contains calculator and analytics code for:

- P&L and win/loss classification.
- R-multiple/risk-reward.
- Risk amount/percent and position-sizing inputs.
- Equity/balance curves.
- Drawdown and performance breakdowns where supplied by analytics.
- Strategy/tag/session/symbol/direction aggregations.
- Compliance thresholds including risk percentage, daily loss, trade count, stop-loss requirement, minimum R/R, allowed directions, and allowed sessions.

The exact formula for every metric, including treatment of partial exits, fees, slippage, missing prices, and imported data, is not uniformly documented in one shared helper. Those details must be read from the relevant controller/calculator before using the values for external reporting. This is intentionally recorded as a limitation rather than inferred.

## 22. Authentication and Data Security

- Registration and login use Zod request validation and JWT issuance.
- Password handling uses bcryptjs.
- Protected routes use JWT auth middleware.
- Admin routes additionally use admin middleware.
- CORS uses an allowlist plus `ALLOWED_ORIGINS`.
- Helmet sets security headers.
- Auth requests have a 50-request/15-minute rate limit.
- JSON payloads are limited to 10 MB.
- Uploads use Multer and Cloudinary-related server configuration.
- Soft deletion and audit fields exist on trades.
- Secret values are not reproduced here. Environment variable names should be taken from `server/utils/validateEnv` and deployment configuration when operating the system.

## 23. Implementation Status and Known Issues

| Feature | Page/API | Status | Evidence | Limitations |
|---|---|---|---|---|
| Authentication | `/login`, `/register`, `/api/auth` | Fully implemented and verified in source | Auth controllers, validators, middleware, routes | Live identity-provider behavior not separately tested |
| Trade CRUD | Trade pages and `/api/trades` | Fully implemented and verified in source | Trade router/model/controllers | Runtime persistence not exercised in this audit |
| Trade import | My Account and `/api/trades/import` | Partially implemented | Multer + CSV parser + import controller | Exact CSV dialect and validation edge cases need runtime verification |
| Dashboard | `/app/dashboard` | Partially implemented | Dashboard and chart components | Data population/empty states not independently exercised |
| Analytics | `/app/analytics` | Partially implemented | Analytics page/controller | Exact chart/filter mapping not fully verified |
| Strategies | `/app/strategies` | Fully implemented in source | Strategy page/router/controller | Full schema/detail metrics not independently verified |
| Tags | `/app/tags` | Fully implemented in source | Tags page/router/controller | Full persisted attribute set not independently verified |
| Trading rules | `/app/trading-rules` | Fully implemented in source | Compliance routes/model/UI | Automatic evaluation timing requires runtime verification |
| Violation history | Compliance API/evaluation model | Partially implemented | Rule evaluation model and compliance controller | List/history UI coverage may differ from API records |
| Notes | `/app/add-notes` | Fully implemented in source | Notes components/router/controller | Association semantics need runtime/data confirmation |
| Compare | `/app/compare` | Partially implemented | Compare components/controller | Accepted dimension combinations not fully verified |
| Upgrade/payment | `/app/upgrade` | Partially implemented | Razorpay dependency and payment routes | Live gateway/webhook/subscription lifecycle not verified |
| Market data | `/api/market-data` | Partially implemented | Binance/Yahoo proxy routes | External API availability and credentials not verified |
| Admin | `/admin/*` | Fully implemented in source | Admin router/layout/providers | Requires admin account to exercise |
| Legacy Trade Setups | `/app/trade-setups` | UI present but functionality redirected | Router `Navigate` | No active standalone page |

## 24. Development Setup and Commands

1. Install client dependencies from `client/package.json`/`bun.lock`.
2. Install server dependencies from `server/package.json`/`package-lock.json`.
3. Provide server environment variables required by `validateEnv`, database connection, JWT, integrations, and deployment.
4. Start the API with `npm run dev` from `server`.
5. Start Vite with `bun run dev` from `client`.
6. Run `bun run lint` and `bun run build` from `client`.
7. Run `npm run test:compliance` from `server` for the compliance integration suite.

## 25. Dependencies and Integrations

- MongoDB via Mongoose.
- Cloudinary for uploaded images/screenshots.
- Razorpay for upgrade payments.
- Binance klines and Yahoo chart endpoints through server proxy routes.
- GitHub Pages deployment metadata and `gh-pages`.
- Netlify configuration/function support in the client repository.

## 26. Additional Pages and Features Discovered

- Public homepage and contact page.
- Account management, active-account selection, account recalculation, and account deletion.
- Trade screenshots and screenshot deletion.
- Imported-trade inclusion toggle.
- Admin dashboard, user details, account details, trade details, contact management, and PRO management.
- Error boundary/page handling through React Router `errorElement`.
- Health endpoint for monitoring/cold-start prevention.
- Audit query endpoint.

Repository screenshots include landing, dashboard, analytics, compare, notes, trade history/detail, trade setup, upgrade, account, contact, admin, and mobile views. They are visual evidence only and do not prove that every displayed action persists successfully.

## 27. Final Verified Feature Checklist

- [x] Public and protected route definitions inspected.
- [x] Strategies and Tags documented separately.
- [x] Active `/app/trade-setups` redirect recorded.
- [x] Client/server technology and build commands recorded.
- [x] API mount points and core route operations recorded.
- [x] MongoDB model relationships and key trade/rule fields recorded.
- [x] JWT, admin authorization, CORS, Helmet, rate limiting, and upload controls recorded.
- [x] Exact theme tokens extracted from `theme.css`.
- [x] Dashboard, analytics, comparison, notes, rules, payment, admin, and market-data surfaces recorded.
- [x] Implemented, partial, redirected, and unverified behavior distinguished.
- [x] No secret values included.
- [x] No application source, styling, configuration, or database files were modified for this document.

### Areas that remain unable to verify without runtime access

- Signed-in end-to-end persistence and account isolation.
- Exact dashboard values and empty/error states with real data.
- Live Razorpay, Cloudinary, Binance, Yahoo, and MongoDB behavior.
- Exact formulas for every analytics metric and partial-exit/fee edge case.
- Complete strategy/tag field semantics and all admin workflow outcomes.
