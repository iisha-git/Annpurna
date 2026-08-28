# Annpurna Developer Guide

Your map to this codebase. Written for someone new to React Native — read top to bottom once, then use as reference. Updated after every build step.

---

## 1. The big picture

Annpurna is a **native Android/iOS app** written in **JavaScript using React Native**, managed by the **Expo** toolkit.

```
You write JavaScript  →  Expo/Metro bundles it  →  phone renders REAL native UI
```

Key mental model: you never write HTML or CSS. You write **React components** (JavaScript functions returning UI descriptions called JSX) styled with JavaScript objects (`StyleSheet`). React Native translates those into actual native buttons, text, and views on the phone.

**Three tools you'll hear about constantly:**

| Tool | What it is |
|---|---|
| **Expo** | Toolkit around React Native: handles builds, device APIs (camera, GPS later), config |
| **Metro** | The bundler — collects all your JS files into one bundle the phone runs (like webpack) |
| **Expo Router** | Navigation library: your `app/` folder structure *is* your navigation |

---

## 2. Repository layout

```
Annpurna/                      ← git repo root
├── apps/
│   ├── student/               ← the student mobile app (Expo)
│   │   ├── app/               ← SCREENS & NAVIGATION (Expo Router)
│   │   │   ├── _layout.js     ← root layout: wraps every screen
│   │   │   ├── +not-found.js  ← shown for unknown URLs/routes
│   │   │   ├── login.js       ← /login — session gate + auth screen
│   │   │   └── (tabs)/        ← the bottom tab bar section
│   │   │       ├── _layout.js ← defines the 4 tabs
│   │   │       ├── index.js   ← Home tab = THE CROWD SCREEN (route wrapper)
│   │   │       ├── menu.js    ← Menu tab (/menu)
│   │   │       ├── status.js  ← Mess Status tab (/status)
│   │   │       └── profile.js ← Profile tab (/profile)
│   │   ├── shared/            ← used by ALL features
│   │   │   ├── theme/tokens.js    ← colors, spacing, fonts — single source of truth
│   │   │   ├── lib/api.js         ← the ONE API client (attach my JWT)
│   │   │   └── ui/                ← reusable building blocks (Card, Button…)
│   │   ├── features/
│   │   │   ├── crowd/         ← Step 5: THE CORE FEATURE
│   │   │   │   ├── domain/crowd-model.js      ← CrowdStatus / Report / Visit types
│   │   │   │   ├── domain/crowd-rules.js      ← aggregation + override resolution (PURE)
│   │   │   │   ├── data/mock-crowd-repository.js ← simulates GPS+push+other students
│   │   │   │   └── presentation/
│   │   │   │       ├── use-crowd-status.js    ← live subscription hook
│   │   │   │       ├── crowd-card.js          ← hero status card
│   │   │   │       ├── crowd-feedback-prompt.js ← push-notification stand-in modal
│   │   │   │       └── home-screen.js         ← composition + dev simulation panel
│   │   │   ├── menu/          ← reads /api/menu via the shared API client
│   │   │   ├── mess-status/   ← reads own leave dates from /api/leaves/mine
│   │   │   ├── profile/       ← reads /api/students/me
│   │   │   └── streak/        ← skeleton (upcoming)
│   │   ├── assets/images/     ← app icon, splash screen images
│   │   ├── app.json           ← app identity: name, icon, splash colors
│   │   ├── eas.json           ← cloud build profiles (dev/preview/production)
│   │   ├── package.json       ← dependencies + scripts
│   │   └── jsconfig.json      ← enables the @/ import shortcut
│   ├── owner-panel/           ← the mess owner's web panel (React + Vite)
│   │   └── src/
│   │       ├── api.js         ← its one API client (JWT in localStorage)
│   │       ├── App.jsx        ← login gate + tab shell
│   │       ├── LeavesEditor.jsx ← roster TSV import, leave toggles (polls API)
│   │       └── MenuEditor.jsx  ← week editor (GET/PUT /api/menu)
│   └── api/                   ← the MongoDB backend (Node + Express + Mongoose)
│       └── src/
│           ├── index.js       ← Express app, route mounting, connects Mongo
│           ├── config.js      ← env-driven settings (PORT, MONGODB_URI, JWT…)
│           ├── models/        ← Student, Owner, Menu, Leave schemas
│           ├── middleware/auth.js ← requireAuth + requireOwner (JWT)
│           ├── routes/        ← auth, menu, students, leaves
│           └── seed.js        ← idempotent startup seed (menu + owner)
```

### Why `features/<name>/{domain,data,presentation}`?

This is our agreed architecture, enforced by folders:

- **domain/** — pure business logic & data shapes. No UI code, no network calls. Testable, reusable.
- **data/** — repositories: where data comes from (mock today, real backend later). Swapping mock→real changes nothing above.
- **presentation/** — screens/components for that feature.

Rule of thumb: **presentation imports domain; nothing imports data except through interfaces.**

---

## 3. File-by-file walkthrough

### `package.json`
Lists dependencies (libraries the app needs) and scripts (shortcuts).
- `npm start` → runs `expo start` → starts Metro bundler + shows QR code
- Dependencies live in `node_modules/` (never edit, never commit — that's why `.gitignore` excludes it)

### `app.json`
Native-app configuration: display name ("Annpurna"), app icon paths, splash screen image/colors, orientation. This becomes real settings inside the APK when we build it.

### `jsconfig.json`
Lets us write `import Card from '@/shared/ui/Card'` instead of painful relative paths like `../../shared/ui/Card`. `@/` means "from app root".

### `app/_layout.js` (root layout)
Every screen renders inside this. It:
- pins the app to light appearance (warm palette has no dark mode yet)
- sets the status bar style
- declares a **Stack navigator**: screens slide over each other; the `(tabs)` group sits on top of the stack

### `app/(tabs)/_layout.js`
Defines the bottom tab bar. The parentheses in `(tabs)` mean **route group** — it organizes routes without adding to the URL. Each `<Tabs.Screen>` maps a file in this folder to a tab (icon + label).

### Tab screens (`index.js`, `menu.js`, …)
Each file default-exports a **component** = a function returning JSX. Right now they're placeholders showing where real content will land.

### `shared/theme/tokens.js`
All design decisions as plain constants (colors, spacing scale, type sizes). If a color needs changing, change it here — the entire app follows. No screen ever hardcodes `#E8632B`.

### `shared/ui/` components
- **Screen** — page container: warm background + safe-area padding (safe area = avoiding notches/status bar)
- **AppText** — text with preset styles via `variant="h1"` etc.
- **Card** — white rounded surface with soft shadow
- **Button** — pressable action button with pressed-state feedback
- `index.js` re-exports them all so screens do `import { Card } from '@/shared/ui'`

### `features/crowd/domain/crowd-model.js`
The crowd feature's vocabulary: `CrowdStatus`, `CrowdReport`, `MessVisit` described with **JSDoc typedefs** (since we chose JS over TS, JSDoc gives us editor autocomplete + documentation without a compile step). Also `CROWD_LEVELS` constants.

---

## 3.5 Anatomy of a feature — the Menu (read this twice)

Menu is our template for every future feature:

```
app/(tabs)/menu.js            ← 5-line ROUTE: just renders MenuScreen
features/menu/
  domain/menu-model.js        ← WHAT a menu is (types, weekday helpers)
  data/menu-repository.js     ← WHERE data comes from (mock today, API tomorrow)
  presentation/
    use-weekly-menu.js        ← HOW the screen gets data (loading/week/error)
    menu-screen.js            ← WHAT you see
```

Data flow on screen:
```
MenuScreen mounts → useWeeklyMenu() → menuRepository.subscribeToWeeklyMenu()
                  → poll GET /api/menu every 5s → weekly data → UI renders
```

**Why the repository layer matters:** the screen never knows the week came
over HTTP. Two apps share the same backend now: the owner panel edits
`/api/menu` and this app polls it. If the API ever changes, we rewrite ONLY
`menu-repository.js` internals. Zero UI changes. This is the single most
important architecture idea in this project.

**Route-file pattern:** files in `app/` are URLs, so they stay thin wrappers;
real screens live in their feature folder. Keeps navigation separate from logic.

---

## 4. React Native concepts you need (crash course)

| Concept | Meaning | Example in our code |
|---|---|---|
| **Component** | Function returning UI | `HomeScreen()` |
| **JSX** | HTML-like syntax inside JS | `<Card><AppText>hi</AppText></Card>` |
| **Props** | Inputs passed to components | `variant="h1"`, `style={{ marginTop: 16 }}` |
| **default export** | The one main thing a file gives out | every screen file |
| **Named export** | Extra things, imported by `{ name }` | `CROWD_LEVELS` |
| **StyleSheet.create** | Optimized styling objects (like CSS but JS) | bottom of each ui file |
| **SafeAreaView** | Container respecting notch/status bar | inside `Screen` |
| **Pressable** | Touchable wrapper with pressed states | inside `Button` |
| **Layout** | Flexbox by default: `flex: 1` fills space | every screen root |
| **useState** | Remembers a value across renders; changing it re-renders | `selectedDay` in MenuScreen |
| **useEffect** | Runs side-effects (fetching, timers) after render; `[]` deps = once | `useWeeklyMenu` |
| **Custom hook** | Your own `useXxx()` function bundling state+effects | `useWeeklyMenu` |
| **ActivityIndicator** | Built-in spinner for loading states | MenuScreen loading branch |
| **ScrollView horizontal** | Horizontally scrollable row (day chips) | MenuScreen |
| **key prop** | Unique id for each item in a rendered list — React needs it to track items | `key={meal.slot}` |
| **Dependency array** | `[year, month]` in useEffect = "re-run only when these change" | `useMonthlyStatus` |
| **Conditional rendering** | `condition ? <A/> : <B/>` picks what renders; `undefined` status renders nothing | DayCell dots |

RN core components replace web tags: `<View>`≈div, `<Text>`≈p (all text MUST be inside Text), `<Pressable>`≈button.

**Layout trick used in the calendar:** a 7-column grid without any table component —
a row-wrapping container (`flexWrap`) where each cell takes exactly `width: 100/7 %`.
Leading blank cells push day 1 onto the correct weekday. Pure math, no library.

---

## 3.6 The crowd engine — how "live data" works without a backend

`data/mock-crowd-repository.js` is the most important file to understand:

```
enterMess() ──► visit created ──► (8s, real: ~10 min) ──► feedbackPending = true
                                                              │
                                              Home shows the prompt modal
                                                              │
submitFeedback(level) ──► report stored (ONE per visit) ──► emit()
                                                              │
synthetic fake-student reports on a 12s timer ────────────────┤
                                                              ▼
                            getSnapshot(): aggregate fresh reports (30-min window)
                                          → resolveCrowdStatus(ownerOverride wins?)
                                          → { status, ... } pushed to subscribers
```

Key ideas:
- **Pub/sub**: `subscribe(listener)` + `emit()`. The hook `useCrowdStatus` subscribes;
  React re-renders whenever a new snapshot arrives. Same pattern real-time backends use.
- **Snapshot pattern**: state is never mutated in place — a fresh object is computed
  and handed out. UI can't corrupt engine internals.
- **Business rules live in `domain/crowd-rules.js`** as pure functions with the agreed
  defaults baked in (30-min validity, tie→higher level, min 3 responses, override wins).
- **`__DEV__`**: RN global, true only in dev builds — that's why Simulation tools
  will vanish from production APKs automatically.
- **Cross-feature imports stay one-way** (crowd reads profile for the greeting).
  Circular imports = bugs; if two features ever need each other, move shared code down
  into domain or shared/.

---

## 4.5 Troubleshooting — lessons already learned

| Error | Cause | Lesson |
|---|---|---|
| "Project is incompatible with this version of Expo Go" | Play Store Expo Go lags behind newest SDK (we're on SDK 57) | We solved this permanently with our own dev build from EAS |
| `Cannot read property 'create' of undefined` at `StyleSheet.create` | Imported `StyleSheet` from the wrong library (`react-native-safe-area-context`) | `StyleSheet`, `View`, `Text`, `Pressable` come ONLY from `'react-native'`; libraries export just their own tools |
| Red screen after an error is fixed | Bundler kept the crashed state | Press `r` in the expo terminal for a full reload |
| `MongooseServerSelectionError` … `tlsv1 alert internal error` when the API connects to Atlas | The network is filtering connections to the Atlas shard IPs (firewalls do this on some campus/hostel/ISP connections); DNS, HTTPS and the Atlas control plane all still work | Try a different network (mobile hotspot) or a VPN. Verify with `tls.connect` to the shard host on 27017; also allow your IP in Atlas → Network Access |

---

## 5. Command cheat sheet

Student app:

```bash
cd apps\student
npx expo start          # dev server + QR code (press r=reload, j=debugger)
npx expo export --platform android   # verify everything bundles (used before commits)
```

Backend:

```bash
cd apps\api
npm run seed            # create/update the owner + default menu from .env
npm run dev             # start the API on http://localhost:4000
```

Owner panel:

```bash
cd apps\owner-panel
npm run dev             # start on http://localhost:5173
npm run build           # production build (verify before commits)
```

Install **Expo Go** on your phone → scan QR → instant live testing. On a real
phone, point both apps at your computer's LAN IP (`VITE_API_URL` /
`EXPO_PUBLIC_API_URL`) instead of `localhost`.

---

## 6. Conventions in this project

1. Design values come from `tokens.js` only
2. New UI pieces go in `shared/ui`; feature-specific screens stay in their feature
3. Business vocabulary lives in `features/*/domain` with JSDoc typedefs
4. Screens never touch the network: `data/*-repository.js` wraps `shared/lib/api.js`
5. Guide updated after every build step

## 6.5 The backend (Node + Express + Mongoose)

`apps/api` owns all data and auth. Every client (owner web panel + student
phone) talks to it over JSON at `http://<host>:4000/api`:

- **Auth is JWT + bcrypt.** Student sign-in is *mess number + password*;
  sign-up claims a roster number by matching name + mobile against the list
  the owner imported. The owner signs in with an email + password (created
  by `npm run seed`). No Firebase anywhere anymore.
- **Collections:** `students` keys docs by mess number; `leaves` are unique
  per (messNumber, date); `menus` is a single "current" week document.
- **Roster importing** accepts the mess office TSV (6 columns). Only the
  first mobile is kept; students with a missing/10-digit-invalid mobile are
  skipped and reported, so the owner can fix numbers and re-import.
- Owner-only routes go through `[requireAuth, requireOwner]`; students can
  read the menu and their own leave dates / profile only.

---

## Changelog

- **Step 1** — Scaffolded Expo app, design system, tab shell, crowd domain model. First push to GitHub.
- **Setup** — EAS linked (`eas init`), dev build configured and installed on phone; `expo-dev-client` replaces Expo Go.
- **Step 2** — Menu feature end-to-end: domain model, mock repository (simulated latency), custom hook, day-chip selector UI, route-wrapper pattern.
- **Step 3** — Monthly Mess Status calendar: month navigation (clamped to today), 7-column dot grid, green=present / red=approved leave, future days blank. Mock leaves hardcoded per month.
- **Step 4** — Profile screen: initials avatar, owner-assigned mess number badge (`/^\d{2,3}$/` rule lives in domain), detail rows. Reinforces: students never edit mess data.
- **Step 5** — Crowd feature core: mock engine simulating GPS entry → delayed prompt → one-tap feedback (one-per-visit) → live aggregation with 30-min validity + majority/tie rules → owner override priority. Home = live crowd card; notification-style prompt modal; dev-only simulation panel.
- **Polish** — Home redesign: dark header (`colors.dark`) with greeting/name/mess-ID + mascot image; floating dark tab bar (detached, rounded, elevated). Owner palette adopted into `tokens.js` as the single source of truth: `backgroundDark #0E0B13`, `primary #FF9D00` (amber — primary buttons use DARK ink for contrast), `primaryLight #FFF0D6`, `textDark #17141A`, `muted #8B8380`.
- **Step 6** — Streak feature: `shared/lib/date.js` local day keys (`YYYY-MM-DD`); `features/streak/domain/streak-model.js` pure rules (consecutive days ending today-or-yesterday = grace window so a streak survives midnight); crowd repo records `myCheckInDays` on every accepted feedback and exposes `checkInDates` in snapshots; `StreakCard` flame counter on Profile with three states (invite / keep-it-alive / done-today). Approved-leave pause NOT yet implemented (needs real leave data).
- **Step 7 — Cute pass** — Custom type system: Fredoka (headings) + Nunito (body) loaded JS-side via `useFonts` in `app/_layout.js`, exposed as `fonts` in tokens (no rebuild needed for fonts). Header/mascot anchored bottom-left of dark header. Tab icons switched to rounded MaterialCommunityIcons glyphs. Profile paragraph replaced by "Good to know" tiles. Hand-drawn doodle pack `shared/ui/doodles/Doodles.js` (DoodleBowl/DoodleFlame/DoodleSparkles + carrot/apple/broccoli/cherries/mushroom/chili/fries) using `react-native-svg` — a NATIVE module, so this one required an EAS dev-build rebuild; future native modules will too. Animated food-doodle wallpaper across the whole header (`header-doodles.js`: 3-band lattice with organic jitter, FloatingDoodle = translateY+wobble loops).
- **Step 8 — Home answers three questions** — Crowd ("Before you walk in…" card), Food, Time. New: `features/menu/domain/meal-schedule.js` (structured serving windows + `mealMomentFor` → SERVING/UPCOMING + minutes-until, rolls over past midnight-dinner to tomorrow's breakfast); `TodayFoodCard` on Home = next-meal strip + up-to-4 dish chips (+N more), whole card pressable → `/menu`; streak flame badge appears in the header next to the mess pill once streak ≥ 1. Crowd card decluttered to pill + people meter + one SHORT_TAKE verdict line.
