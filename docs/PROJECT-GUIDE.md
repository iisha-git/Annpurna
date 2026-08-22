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
    │       ├── index.js       ← Home tab ("/" route)
    │       ├── menu.js        ← Menu tab (/menu)
    │       ├── status.js      ← Mess Status tab (/status)
    │       └── profile.js     ← Profile tab (/profile)
    ├── shared/                ← used by ALL features
    │   ├── theme/tokens.js    ← colors, spacing, fonts — single source of truth
    │   └── ui/                ← reusable building blocks (Card, Button…)
    ├── features/              ← business areas, each split into 3 layers
    │   ├── crowd/domain/crowd-model.js
    │   └── menu | mess-status | profile | streak   (skeletons for now)
    ├── assets/images/         ← app icon, splash screen images
    ├── app.json               ← app identity: name, icon, splash colors
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

RN core components replace web tags: `<View>`≈div, `<Text>`≈p (all text MUST be inside Text), `<Pressable>`≈button.

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
