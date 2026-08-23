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
└── apps/student/              ← the student mobile app
    ├── app/                   ← SCREENS & NAVIGATION (Expo Router)
    │   ├── _layout.js         ← root layout: wraps every screen
    │   ├── +not-found.js      ← shown for unknown URLs/routes
    │   └── (tabs)/            ← the bottom tab bar section
    │       ├── _layout.js     ← defines the 4 tabs
    │       ├── index.js       ← Home tab = THE CROWD SCREEN (route wrapper)
    │       ├── menu.js        ← Menu tab (/menu)
    │       ├── status.js      ← Mess Status tab (/status)
    │       └── profile.js     ← Profile tab (/profile)
    ├── shared/                ← used by ALL features
    │   ├── theme/tokens.js    ← colors, spacing, fonts — single source of truth
    │   └── ui/                ← reusable building blocks (Card, Button…)
    ├── features/
    │   ├── crowd/             ← Step 5: THE CORE FEATURE
    │   │   ├── domain/crowd-model.js      ← CrowdStatus / Report / Visit types
    │   │   ├── domain/crowd-rules.js      ← aggregation + override resolution (PURE)
    │   │   ├── data/mock-crowd-repository.js  ← simulates GPS+push+other students
    │   │   └── presentation/
    │   │       ├── use-crowd-status.js    ← live subscription hook
    │   │       ├── crowd-card.js          ← hero status card
    │   │       ├── crowd-feedback-prompt.js ← push-notification stand-in modal
    │   │       └── home-screen.js         ← composition + dev simulation panel
    │   ├── menu/              ← complete feature (Step 2 pattern reference)
    │   ├── mess-status/       ← complete feature (Step 3)
    │   ├── profile/           ← complete feature (Step 4)
    │   └── streak/            ← skeleton (upcoming)
    ├── assets/images/         ← app icon, splash screen images
    ├── app.json               ← app identity: name, icon, splash colors
    ├── eas.json               ← cloud build profiles (dev/preview/production)
    ├── package.json           ← dependencies + scripts
    ├── jsconfig.json          ← enables the @/ import shortcut
    └── .gitignore             ← files git must ignore (node_modules etc.)
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
MenuScreen mounts → useWeeklyMenu() → menuRepository.getWeeklyMenu()
                  → fake 600ms delay → weekly data → state updates → UI renders
```

**Why the repository layer matters:** the screen never knows data was hardcoded.
When the owner panel exists and menus live in a database, we rewrite ONLY
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

---

## 5. Command cheat sheet

```bash
cd apps\student
npx expo start          # dev server + QR code (press r=reload, j=debugger)
npx expo export --platform android   # verify everything bundles (used before commits)
npm uninstall <pkg>     # remove dependency
```

Install **Expo Go** on your phone → scan QR → instant live testing.

---

## 6. Conventions in this project

1. Design values come from `tokens.js` only
2. New UI pieces go in `shared/ui`; feature-specific screens stay in their feature
3. Business vocabulary lives in `features/*/domain` with JSDoc typedefs
4. Mocks behind interfaces until backend exists (agreed architecture)
5. Guide updated after every build step

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
- **Step 7 — Cute pass** — Custom type system: Fredoka (headings) + Nunito (body) loaded JS-side via `useFonts` in `app/_layout.js`, exposed as `fonts` in tokens (no rebuild needed for fonts). Header/mascot anchored bottom-left of dark header. Tab icons switched to rounded MaterialCommunityIcons glyphs. Profile paragraph replaced by "Good to know" tiles. Hand-drawn doodle pack `shared/ui/doodles/Doodles.js` (DoodleBowl/DoodleFlame/DoodleSparkles) using `react-native-svg` — a NATIVE module, so this one required an EAS dev-build rebuild; future native modules will too.
