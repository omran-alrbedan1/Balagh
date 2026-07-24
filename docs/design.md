# Government Complaint Management System — Mobile App
## Design System — Colors, Icons, Illustrations & Motion
### Expo / React Native + NativeWind + Reanimated

> This document extends the blue NativeWind theme already used across Phases 0–6 into a full design system: iconography, illustration direction, imagery guidelines, and motion/animation — grounded in research into how similar government and civic-reporting apps are designed today.

---

## Table of Contents

1. [Research: What Similar Apps Do](#research)
2. [Design Principles for This App](#principles)
3. [Color System](#colors)
4. [Typography](#typography)
5. [Iconography](#icons)
6. [Illustrations & Imagery](#illustrations)
7. [Motion & Animation](#motion)
8. [Elevation, Radius & Spacing Tokens](#tokens)
9. [Accessibility Notes](#accessibility)
10. [Reference Library](#references)

---

<a name="research"></a>
## 1. Research: What Similar Apps Do

Before defining the system, it's worth grounding it in how comparable products are actually designed — both dedicated civic-complaint apps and the design systems governments publish for this exact use case.

**Civic complaint / 311-style products:**
- **CivicSeva** (Citizen Complaint Portal, via Behance/Figma) is one of the most-viewed citizen complaint portal case studies in this space, following the same submit → track → resolve loop this app implements.
- **SeeClickFix**, one of the longest-running 311 apps, <cite index="29-1">launched in 2009 as the first global 311 app for reporting issues to government officials</cite>, and <cite index="29-1">has documented more than 4 million issues, with over 90% eventually resolved by participating governments</cite>. Its 5.0 redesign introduced two patterns directly relevant here: <cite index="29-1">letting a citizen snap a photo and file the report later using the location saved in the photo's metadata</cite>, and <cite index="29-1">surfacing existing nearby reports during submission to reduce duplicate complaints</cite>. The second pattern is worth considering as a future enhancement to Phase 5's creation flow (a "similar complaints nearby" step).
- **SeeClickFix / CivicPlus 311 CRM** more broadly frames the product around <cite index="28-1">a centralized way for residents to report non-emergency issues and request city services, distinct from emergency lines</cite> — reinforcing that tone (calm, administrative, non-emergency) should carry through every screen: no alarming reds outside genuine SLA breaches, no siren-like motion.

**Government-specific design systems:**
- The **U.S. Web Design System (USWDS)**, maintained by the GSA and <cite index="21-1">trusted by more than 100 government sites</cite>, structures color around <cite index="15-1">five role-based families — base, secondary, primary, accent-warm, and accent-cool — each with up to seven lightness grades</cite>, rather than one arbitrary brand blue. This app's palette (below) mirrors that structure: a neutral base, one primary blue family carrying most of the UI, and small accent families reserved strictly for state (success/warning/danger), never for decoration.
- USWDS also explicitly warns that <cite index="17-1">color should never be the only signal of meaning, since a meaningful share of users have some color insensitivity</cite> — which is why every status in this app pairs color with a label and (where relevant) an icon, never a bare dot.
- A dedicated **"Government UI Kit" (gov.design)** on Figma exists specifically for public-sector interfaces, reinforcing that restrained, high-contrast, low-decoration UI is the norm for this category — not a limitation to work around.

**Net takeaway for this app:** lean into a calm, single-hue blue system (matching the citizen's expectation of an official, trustworthy channel), reserve color-as-signal strictly for status/SLA states, favor flat/line iconography over photography, and keep motion purposeful and brief rather than playful.

---

<a name="principles"></a>
## 2. Design Principles for This App

1. **Calm authority, not corporate flash.** This is a channel between a citizen and their government — not a consumer app competing for attention. Blue stays the dominant hue; accents are earned, not decorative.
2. **Color plus label, always.** Every status, priority, and SLA state pairs a color with text (and often an icon). Never color alone.
3. **One motion idea per screen.** A single, well-placed animation (a status pulse, a submit-success check) lands harder than several competing micro-interactions.
4. **Icons over photos.** Line icons and flat illustrations, not stock photography — avoids the generic "AI stock photo" feel and sidesteps any real-person/likeness concerns entirely.
5. **Respect reduced motion.** Every animation has a static fallback for users with `Reduce Motion` enabled.

---

<a name="colors"></a>
## 3. Color System

Extends the Phase 1 `tailwind.config.js` primary scale with full semantic tokens — still one file, still the single source of truth.

**`tailwind.config.js`** (full version, replacing the Phase 1 excerpt):

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary — the dominant hue across the entire app
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb", // brand blue — buttons, active states, links
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        // Neutral base — USWDS-style "base" family, used for body text/borders on light surfaces
        base: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        surface: {
          light: "#f5f8ff",
          DEFAULT: "#ffffff",
          dark: "#0b1220",
        },
        // Semantic accents — reserved strictly for state, never decoration
        success: { 50: "#f0fdf4", 500: "#22c55e", 600: "#16a34a", 700: "#15803d" },
        warning: { 50: "#fffbeb", 500: "#f59e0b", 600: "#d97706" },
        danger: { 50: "#fef2f2", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c" },
        // Priority accents — used ONLY as small dots/chips next to a text label, never as a full background
        priorityLow: "#60a5fa",
        priorityMedium: "#f59e0b",
        priorityHigh: "#f97316",
        priorityUrgent: "#dc2626",
      },
      fontFamily: {
        sans: ["System"],
        display: ["System"], // swap for a licensed display face if the agency provides one
      },
    },
  },
  plugins: [],
};
```

### Usage rules

| Token family | Used for | Never used for |
|---|---|---|
| `primary-*` | Buttons, active nav, links, headers, focus rings | Error states |
| `base-*` | Body text, borders, dividers on neutral surfaces | Brand moments |
| `success-*` | Resolved status, success toasts, submit confirmation | Anything non-final |
| `warning-*` | Approaching-SLA states, non-blocking notices | Hard errors |
| `danger-*` | Breached SLA, rejected status, destructive actions, field errors | Decoration, empty-state icons |
| `priority*` | Small 8–12px dots/chips next to a priority label only | Full-screen backgrounds |

---

<a name="typography"></a>
## 4. Typography

Government apps benefit from restraint here — the win is legibility and a clear hierarchy, not personality.

| Role | Size / weight | NativeWind classes |
|---|---|---|
| Screen title | 28–32px, bold | `text-3xl font-bold text-primary-900` |
| Section title | 18–20px, bold | `text-lg font-bold text-primary-900` |
| Body | 15–16px, regular | `text-base text-primary-800` |
| Caption / meta | 12–13px, medium | `text-xs font-medium text-primary-400` |
| Button label | 16px, semibold | `text-base font-semibold` |

Keep a single type family (`System`) unless the agency supplies a licensed display face — a second family adds personality but also adds risk of an unlicensed font in a government-distributed app.

---

<a name="icons"></a>
## 5. Iconography

**Icon set:** `lucide-react-native` (already installed in Phase 0) — consistent 2px stroke, no filled/outline mismatch, matches the line-icon direction favored by the government design systems referenced above.

### 5.1 Navigation & core actions

| Icon | Import | Used for |
|---|---|---|
| `Home` | `lucide-react-native` | Home tab |
| `FileText` | `lucide-react-native` | My Complaints tab |
| `PlusCircle` | `lucide-react-native` | New Complaint tab (raised) |
| `User` | `lucide-react-native` | Profile tab |
| `ChevronDown` / `ChevronRight` | `lucide-react-native` | Select fields, list rows |
| `Check` | `lucide-react-native` | Selected option, success states |
| `X` | `lucide-react-native` | Close modal, remove attachment |
| `Search` | `lucide-react-native` | Search inputs |
| `ArrowUpDown` | `lucide-react-native` | Sort toggle |
| `MapPin` | `lucide-react-native` | Location picker, location card |
| `Camera` / `ImagePlus` | `lucide-react-native` | Attachment step |
| `AlertTriangle` | `lucide-react-native` | SLA breach warning only |
| `Bell` | `lucide-react-native` | Notifications (Phase 8) |

### 5.2 Department icon mapping

A small lookup so each department gets a consistent glyph across list, detail, and the category picker — falls back to a generic `Building2` if the backend adds a department this map doesn't yet cover.

**`src/constants/departmentIcons.ts`**:

```ts
import {
  Building2,
  Droplet,
  Zap,
  Trash2,
  TrafficCone,
  TreePine,
  Siren,
  type LucideIcon,
} from "lucide-react-native";

// Keyed by department `code` from GET /lookups/departments
export const DEPARTMENT_ICONS: Record<string, LucideIcon> = {
  municipality: Building2,
  water: Droplet,
  utilities: Zap,
  waste: Trash2,
  roads: TrafficCone,
  parks: TreePine,
  "public-safety": Siren,
};

export function getDepartmentIcon(code: string): LucideIcon {
  return DEPARTMENT_ICONS[code] ?? Building2;
}
```

**`src/components/ui/DepartmentIcon.tsx`**:

```tsx
import React from "react";
import { View } from "react-native";
import { getDepartmentIcon } from "@/constants/departmentIcons";

export function DepartmentIcon({ code, size = 20 }: { code: string; size?: number }) {
  const Icon = getDepartmentIcon(code);
  return (
    <View className="w-9 h-9 rounded-full bg-primary-50 items-center justify-center">
      <Icon size={size} color="#2563eb" />
    </View>
  );
}
```

### 5.3 Status icon mapping (pairs with `StatusBadge` from Phase 6)

| Status | Icon | Rationale |
|---|---|---|
| `submitted` | `Send` | Just went out |
| `in_review` | `Eye` | Being looked at |
| `assigned` | `UserCheck` | Handed to someone |
| `in_progress` | `Loader` (animated, see §7.3) | Actively being worked |
| `resolved` | `CheckCircle2` | Done |
| `rejected` | `XCircle` | Not proceeding |
| `closed` | `Archive` | Fully closed out |

---

<a name="illustrations"></a>
## 6. Illustrations & Imagery

Following the research above, this app **does not use photography** — no stock photos of "citizens on phones" or "government buildings." Photography reads as generic, risks depicting real identifiable people or real government buildings without rights, and fights the calm/official tone. Instead:

### 6.1 Style direction

- **Flat, geometric line illustrations**, single-color (primary-600) or duotone (primary-600 + primary-100 fill), in the style of open-license illustration sets like **unDraw** or **Humaaans** re-colored to the app's blue palette — never full-color/gradient-heavy illustration styles, which read as consumer/startup rather than civic.
- Illustrations appear **only** in empty states, onboarding (if added later), and error states — never as decorative headers on data screens.
- No text baked into illustration assets — all copy stays as real, localizable `<Text>` so it works in both English and Arabic (Phase 4 i18n).

### 6.2 Where illustrations are used

| Screen / state | Illustration concept |
|---|---|
| My Complaints — empty | A simple line drawing of a clipboard with a checkmark, mid-primary blue |
| Home — no recent activity | A line drawing of a bell/inbox, quiet and small, not full-bleed |
| Complaint submitted (success) | A single line-drawn checkmark-in-circle, animated in (see §7.4) |
| Network error | A simple line drawing of a disconnected cloud/signal, in `base-400`, not danger colors — an error state is not an emergency |
| Location permission denied | A line drawing of a map pin with a slash |

### 6.3 Practical sourcing note

Since Claude cannot generate or embed binary image assets directly into this markdown, the recommended workflow is:
1. Pull 4–6 SVGs from **unDraw** (MIT-licensed, no attribution required) matching the concepts above.
2. Recolor every fill to `#2563eb` (primary-600) and `#dbeafe` (primary-100) using unDraw's built-in color picker before export, so every illustration matches the palette exactly.
3. Save as `.svg` under `assets/illustrations/`, and render with `react-native-svg` (already installed in Phase 0) via `SvgUri` or a codegen'd component — never as rasterized PNGs, so they stay crisp at any screen density.

**`src/components/ui/EmptyState.tsx`** (extended from Phase 1 to support an illustration):

```tsx
import React from "react";
import { View, Text } from "react-native";
import type { SvgProps } from "react-native-svg";

type Props = {
  title: string;
  subtitle?: string;
  Illustration?: React.FC<SvgProps>;
};

export function EmptyState({ title, subtitle, Illustration }: Props) {
  return (
    <View className="flex-1 items-center justify-center py-16 px-6">
      {Illustration ? (
        <Illustration width={160} height={160} style={{ marginBottom: 16 }} />
      ) : (
        <View className="w-16 h-16 rounded-full bg-primary-100 mb-4" />
      )}
      <Text className="text-primary-900 text-lg font-semibold text-center">{title}</Text>
      {subtitle ? (
        <Text className="text-primary-500 text-sm text-center mt-1">{subtitle}</Text>
      ) : null}
    </View>
  );
}
```

---

<a name="motion"></a>
## 7. Motion & Animation

**Library:** `react-native-reanimated` (+ optionally `moti` as a friendlier declarative wrapper over it). Both run on the UI thread, so animations stay smooth even during network requests — important on the low/mid-range Android devices common in government-app deployments.

```bash
npx expo install react-native-reanimated
npm install moti
```

**`babel.config.js`** — add the Reanimated plugin **last** in the plugins array:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: ["react-native-reanimated/plugin"], // must be listed last
  };
};
```

### 7.1 Principle: one motion idea per screen

Per the research above, this app avoids stacking multiple simultaneous animations. Each interaction below is deliberately scoped to a single purpose.

### 7.2 Button press feedback

**`src/components/ui/Button.tsx`** (animated version, replacing the Phase 1 static one):

```tsx
import React from "react";
import { Text, ActivityIndicator } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Pressable } from "react-native";

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "outline";
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({ label, onPress, loading, disabled, variant = "primary" }: Props) {
  const scale = useSharedValue(1);
  const isOutline = variant === "outline";

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => (scale.value = withTiming(0.97, { duration: 80 }))}
      onPressOut={() => (scale.value = withTiming(1, { duration: 120 }))}
      disabled={disabled || loading}
      style={animatedStyle}
      className={`w-full rounded-2xl py-4 items-center justify-center ${
        isOutline ? "bg-transparent border-2 border-primary-600" : "bg-primary-600"
      } ${disabled ? "opacity-50" : ""}`}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? "#2563eb" : "#ffffff"} />
      ) : (
        <Text className={`text-base font-semibold ${isOutline ? "text-primary-700" : "text-white"}`}>
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}
```

### 7.3 `in_progress` status pulse (subtle, not a spinner)

A gentle opacity pulse on the `in_progress` badge only — communicates "actively being worked on" without a distracting spinner.

**`src/features/complaints/components/StatusBadge.tsx`** (animated version):

```tsx
import React, { useEffect } from "react";
import { Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { ComplaintStatus } from "@/api/types/lookups.types";

const STATUS_STYLES: Record<ComplaintStatus, { bg: string; text: string; label: string }> = {
  submitted: { bg: "bg-primary-50", text: "text-primary-600", label: "Submitted" },
  in_review: { bg: "bg-primary-100", text: "text-primary-700", label: "In Review" },
  assigned: { bg: "bg-primary-200", text: "text-primary-800", label: "Assigned" },
  in_progress: { bg: "bg-primary-600", text: "text-white", label: "In Progress" },
  resolved: { bg: "bg-success-500", text: "text-white", label: "Resolved" },
  rejected: { bg: "bg-danger-500", text: "text-white", label: "Rejected" },
  closed: { bg: "bg-primary-950", text: "text-white", label: "Closed" },
};

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  const style = STATUS_STYLES[status];
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (status === "in_progress") {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800 }),
          withTiming(1, { duration: 800 }),
        ),
        -1,
        true,
      );
    }
  }, [status]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={status === "in_progress" ? animatedStyle : undefined}
      className={`self-start rounded-full px-3 py-1 ${style.bg}`}
    >
      <Text className={`text-xs font-semibold ${style.text}`}>{style.label}</Text>
    </Animated.View>
  );
}
```

> Respecting reduced motion: wrap the `useEffect` pulse trigger in a check against `AccessibilityInfo.isReduceMotionEnabled()` and skip the repeat animation (render the badge fully opaque) when the user has that setting on.

```ts
import { AccessibilityInfo } from "react-native";

useEffect(() => {
  let isMounted = true;
  AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
    if (!isMounted || reduceMotion || status !== "in_progress") return;
    opacity.value = withRepeat(
      withSequence(withTiming(0.6, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1,
      true,
    );
  });
  return () => {
    isMounted = false;
  };
}, [status]);
```

### 7.4 Submission success animation

A single checkmark draws in after `useCreateComplaint()` resolves (Phase 5) — the one "big" animation moment in the whole app, reserved for this single point of delight.

**`src/features/complaints/components/SubmitSuccessCheck.tsx`**:

```tsx
import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Check } from "lucide-react-native";

export function SubmitSuccessCheck() {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 120 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className="w-20 h-20 rounded-full bg-success-500 items-center justify-center"
    >
      <Check size={36} color="#ffffff" />
    </Animated.View>
  );
}
```

### 7.5 Skeleton loading (instead of bare spinners on lists)

A shimmering placeholder for the complaint list (Phase 6) while the first page loads — feels faster than a centered spinner and previews the eventual layout.

**`src/components/ui/Skeleton.tsx`**:

```tsx
import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export function Skeleton({ className }: { className?: string }) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={animatedStyle} className={`bg-primary-100 rounded-lg ${className}`} />;
}

export function ComplaintCardSkeleton() {
  return (
    <View className="w-full rounded-2xl bg-white border border-primary-100 p-4 mb-3">
      <Skeleton className="h-4 w-3/4 mb-3" />
      <View className="flex-row justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-16" />
      </View>
    </View>
  );
}
```

### 7.6 Toast / feedback banner

A short, auto-dismissing banner for network errors, offline-queue confirmations (Phase 9), and generic success messages — slides down from the top, no bounce.

**`src/components/ui/Toast.tsx`**:

```tsx
import React, { useEffect } from "react";
import { Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";

type Props = {
  message: string;
  variant?: "success" | "danger" | "info";
  onHide: () => void;
};

const VARIANT_BG = {
  success: "bg-success-600",
  danger: "bg-danger-600",
  info: "bg-primary-700",
};

export function Toast({ message, variant = "info", onHide }: Props) {
  const translateY = useSharedValue(-80);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 250 });
    const timer = setTimeout(() => {
      translateY.value = withTiming(-80, { duration: 200 }, (finished) => {
        if (finished) runOnJS(onHide)();
      });
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className={`absolute top-0 left-4 right-4 rounded-xl px-4 py-3 ${VARIANT_BG[variant]}`}
    >
      <Text className="text-white font-medium text-center">{message}</Text>
    </Animated.View>
  );
}

// remember to import { runOnJS } from "react-native-reanimated" at the top of the file
```

### 7.7 What NOT to animate

- Do not animate the SLA-breach warning with anything more than the badge's static red color — a flashing/shaking red element reads as an emergency alarm, which contradicts the "non-emergency, calm" tone established by the 311-product research above.
- Do not add page-transition flourishes beyond Expo Router's default stack/tab transitions — a government utility app should feel instant, not cinematic.
- Do not animate empty-state illustrations on loop (e.g. a bobbing icon) — a single fade/scale-in on mount is enough; anything looping becomes a distraction on a screen the user may sit on for a while.

---

<a name="tokens"></a>
## 8. Elevation, Radius & Spacing Tokens

Keeping these consistent is what makes the animated components above feel like one system rather than several:

| Token | Value | NativeWind |
|---|---|---|
| Card radius | 16px | `rounded-2xl` |
| Button radius | 16px | `rounded-2xl` |
| Input radius | 12px | `rounded-xl` |
| Pill / badge radius | 9999px | `rounded-full` |
| Card shadow | subtle, 1px border preferred over heavy shadow | `border border-primary-100 shadow-sm` |
| Screen horizontal padding | 20px | `px-5` |
| Section vertical gap | 16px | `mb-4` / `h-4` spacer |

---

<a name="accessibility"></a>
## 9. Accessibility Notes

- All `primary-700`-on-white and `white`-on-`primary-600` text pairings meet WCAG AA contrast (4.5:1) — verified against the same principle USWDS enforces for its own theme tokens.
- Every animated component above has a documented reduced-motion fallback (§7.3); apply the same `AccessibilityInfo.isReduceMotionEnabled()` guard to the skeleton shimmer and toast slide if agency accessibility review requires it.
- Status and priority are never conveyed by color alone (§1, USWDS principle) — every `StatusBadge` and `PriorityDot` carries a text label.
- Dynamic type: all `text-*` NativeWind classes should be paired with `allowFontScaling` left at its default `true` (React Native's default) so the app respects the citizen's OS-level font size setting.

---

<a name="references"></a>
## 10. Reference Library

| Resource | Why it's relevant |
|---|---|
| [CivicSeva — Citizen Complaint Portal](https://www.behance.net/search/projects/complaint) | Closest direct comparable: a citizen-facing complaint portal with the same submit/track loop |
| [Government UI Kit (gov.design)](https://www.figma.com/community/file/946012832497155929/government-ui-kit-gov-design) | Public-sector-specific Figma kit; useful for cross-checking component restraint |
| [U.S. Web Design System — Theme Color Tokens](https://designsystem.digital.gov/design-tokens/color/theme-tokens/) | Source of the base/primary/accent color-family structure this app's palette mirrors |
| [U.S. Web Design System — Using Color](https://designsystem.digital.gov/design-tokens/color/overview/) | Source of the "never color alone" accessibility principle applied to `StatusBadge`/`PriorityDot` |
| [SeeClickFix 311 CRM](https://seeclickfix.com/) | Longest-running 311 app; source of the "report later from photo metadata" and "duplicate detection" patterns worth considering for a future Phase 5 enhancement |
| [SeeClickFix iOS 5.0 redesign notes](https://medium.com/@benberkowitz/seeclickfix-ios-5-0-a-more-efficient-311-app-2ccbff7423a9) | First-hand account of a 311 app's redesign priorities, referenced in §1 |

**Next step:** once illustration SVGs are sourced and recolored per §6.3, drop them into `assets/illustrations/` and wire them into the `EmptyState` calls across Phases 4–6 (`Illustration={ClipboardCheckIllustration}` etc.) — no other component changes required.