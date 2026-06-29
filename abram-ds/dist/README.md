# ABRAM Design System

Dark-only glassmorphic design system for ABRAM — a creative production platform. Every design must use these tokens, components, and patterns.

## Setup

Every design must import `index.css` for tokens and component styles. Wrap the page in `<BackgroundGlow>` for the ambient gradient.

```tsx
import "@abram/design-system/index.css";
import { BackgroundGlow, Section, SectionHeader, Button } from "@abram/design-system";

export default function Page() {
  return (
    <BackgroundGlow variant="brand">
      <Section maxWidth="lg">
        <SectionHeader
          overline="FOR PRODUCERS"
          title="Ship productions faster"
          description="Manage crews, budgets, and schedules in one place."
        />
        <Button variant="primary">Get Started</Button>
        <Button variant="glass">Learn More</Button>
      </Section>
    </BackgroundGlow>
  );
}
```

## Brand Colors

| Token | Value | Usage |
|---|---|---|
| `--abram-black` | `#0A0A0A` | Page backgrounds |
| `--abram-cream` | `#FAFAF9` | Primary text, logo |
| `--abram-accent` | `#CE1C1C` | Red accent (use sparingly) |
| `--abram-light-blue` | `#8ECAFF` | Highlights, active indicators |
| `--abram-standard-blue` | `#3B82F6` | Interactive highlights |

## Text Color Tiers (zinc scale only — NEVER use neutral-*)

| Tier | Token | Hex | Usage |
|---|---|---|---|
| Primary | `--abram-text-primary` | `#ffffff` | Headlines, hero text |
| Secondary | `--abram-text-secondary` | `#d4d4d8` | Subheadings |
| Tertiary | `--abram-text-tertiary` | `#a1a1aa` | Body text, descriptions |
| Muted | `--abram-text-muted` | `#71717a` | Captions, labels |
| Ghost | `--abram-text-ghost` | `#52525b` | Copyright, decorative |

## Fonts

- **Primary**: Geist Sans (`--abram-font-sans`) — all UI text
- **Display**: Archivo (`--abram-font-display`) — ONLY for sparse uppercase section headers
- **Mono**: Geist Mono (`--abram-font-mono`) — code blocks only

## Typography Scale

| Level | Size | Weight | Color |
|---|---|---|---|
| Display | 2.25-3.75rem | 500 | white |
| H1 | 1.875rem | 700 | zinc-50 |
| H2 | 1.5rem | 600 | zinc-50 |
| H3 | 1.25rem | 600 | zinc-100 |
| H4 | 1.125rem | 600 | zinc-200 |
| Body | 1rem | 400, line-height 1.75 | zinc-400 |
| Body Small | 0.875rem | 400 | zinc-400 |
| Caption | 0.75rem | 500 | zinc-500 |
| Overline | 10px | 600, tracking 0.2em, uppercase | zinc-500 |
| Micro | 9px | 500, tracking widest, uppercase | zinc-500 |

## Components

### Button
4 variants, all pill-shaped (`border-radius: 9999px`), compact sizing:
- **`primary`** — white bg, black text. Main CTAs only ("Sign Up", "Get Started")
- **`glass`** — semi-transparent + backdrop-blur. Default for most buttons ("View Docs", "Learn More")
- **`ghost`** — transparent, border appears on hover. Secondary/toolbar actions
- **`danger`** — red-tinted glass, rounded-lg (not pill). Destructive actions

Sizes: `default` (px-5 py-2), `sm` (px-4 py-1.5), `xs` (px-3 py-1)

### GlassPanel
Container with heavy backdrop-blur (60px), subtle border, inset top-edge highlight. Use for modals, cards, elevated surfaces.
- `hover` prop adds lift + accent glow on hover
- `rounded`: "lg" | "xl" | "2xl"

### FeatureCard
Glass card with optional icon, title, description. Links are supported. Use for feature grids.

### WorkflowCard + WorkflowCardGroup
Step-based cards showing process flows. Each card has: step number, title, tag badge, description.
`WorkflowCardGroup` lays them in a grid (1-4 columns).

### Input
Pill-shaped dark input with optional label (overline style) and error state.

### Badge
Pill-shaped label. Variants: `default` (glass), `accent` (red), `muted` (dim).

### Section + SectionHeader
Page layout sections with max-width constraint. SectionHeader provides overline + title + description pattern.

### BackgroundGlow
Full-page ambient gradient background. 6 presets:
- `brand` — ABRAM red/blue/purple (use for main pages)
- `premium` — violet/blue (docs theme)
- `space` — subtle gray radial
- `emerald`, `amber`, `rose` — accent themes
- `techGrid` prop adds subtle grid overlay

## Design Rules

1. **Dark mode only** — background is always `#0A0A0A`
2. **Zinc scale only** — never use `neutral-*` for any color
3. **Geist Sans everywhere** — Archivo only for rare uppercase display headers
4. **Buttons are compact** — no oversized buttons, ever
5. **Glass aesthetic** — elevated surfaces use backdrop-blur, not solid backgrounds
6. **Subtle borders** — white at 5-10% opacity, never solid colored borders
7. **Accent red sparingly** — `#CE1C1C` for emphasis only, never as a primary background
