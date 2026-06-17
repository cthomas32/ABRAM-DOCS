# ABRAM Design System

This is the canonical design system for the ABRAM documentation and landing page. All agents and developers must follow these specifications when building or modifying UI. Do not deviate without explicit approval.

---

## 1. Font Stack

### Primary Font — Geist Sans

- **Loaded via**: `next/font/google` in `layout.tsx`
- **CSS variable**: `--font-geist-sans`
- **Tailwind class**: `font-sans`
- **Weights available**: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

### Display Font — Archivo (VERY SPARSE USE)

- **Loaded via**: `next/font/google` in `layout.tsx`
- **CSS variable**: `--font-archivo`
- **Tailwind class**: `font-display`
- Use **ONLY** for a small number of uppercase section headers on the landing page
- **NEVER** use for body text, docs, navigation, or buttons

### Monospace Font — Geist Mono

- **Loaded via**: `next/font/google` in `layout.tsx`
- **CSS variable**: `--font-geist-mono`
- **Tailwind class**: `font-mono`
- Use for code blocks and inline code only

> [!IMPORTANT]
> Never use inline `style={{ fontFamily }}` overrides. Always use Tailwind utility classes (`font-sans`, `font-display`, `font-mono`).

---

## 2. Typography Scale

| Token | Tailwind Classes | Usage |
|---|---|---|
| Display | `text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white` | Hero headline only |
| H1 | `text-3xl font-bold tracking-tight text-zinc-50` | Page titles |
| H2 | `text-2xl font-semibold tracking-tight text-zinc-50` | Section headings |
| H3 | `text-xl font-semibold tracking-tight text-zinc-100` | Subsections |
| H4 | `text-lg font-semibold tracking-tight text-zinc-200` | Minor headings |
| Body | `text-base font-normal leading-7 text-zinc-400` | Paragraphs, main content |
| Body Small | `text-sm font-normal leading-relaxed text-zinc-400` | Card text, secondary content |
| Caption | `text-xs font-medium tracking-wide text-zinc-500` | Labels, metadata, sidebar links |
| Overline | `text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500` | Section labels ("FOR PRODUCERS") |
| Micro | `text-[9px] font-medium tracking-widest uppercase text-zinc-500` | Badges, step indicators, copyright |
| Mono | `text-sm font-mono font-normal text-zinc-100` | Code blocks, inline code |

---

## 3. Color System

### Brand Colors

| Name | Hex | CSS Variable | Usage |
|---|---|---|---|
| ABRAM Black | `#0A0A0A` | `--color-abram-black` | Backgrounds |
| ABRAM Cream | `#FAFAF9` | `--color-abram-cream` | Light text, logo |
| ABRAM Accent | `#CE1C1C` | `--color-abram-accent` | Accent red (sparingly) |
| Light Blue | `#8ECAFF` | — | Accent highlights, active indicators |
| Standard Blue | `#3B82F6` | — | Interactive highlights |

### Text Color Tiers

> [!IMPORTANT]
> Use `zinc-*` colors ONLY. Never use `neutral-*` for text.

| Tier | Class | Usage |
|---|---|---|
| Primary | `text-white` or `text-zinc-50` | Headlines, active nav, hero text |
| Secondary | `text-zinc-300` | Subheadings, important support text |
| Tertiary | `text-zinc-400` | Body text, descriptions, card content |
| Muted | `text-zinc-500` | Captions, labels, inactive nav, timestamps |
| Ghost | `text-zinc-600` | Copyright, decorative, helper hints |

### Border Colors

| Name | Class | Usage |
|---|---|---|
| Subtle | `border-white/5` | Card borders, dividers |
| Default | `border-white/8` or `border-white/10` | Active borders, nav |
| Hover | `border-white/15` or `border-white/20` | Interactive hover states |

---

## 4. Button System

All interactive buttons use glass-morphism styling. Minimal padding, compact feel. No large buttons.

### Base Traits (all buttons)

- Border radius: `rounded-full` (pill shape)
- Transition: `transition-all duration-200`
- Focus: `outline-none focus-visible:ring-2 focus-visible:ring-white/50`
- Cursor: `cursor-pointer`
- Font: Geist Sans (inherits from body)

### Button Variants

Use CSS utility classes defined in `globals.css`:

| Variant | Class | Visual | Usage |
|---|---|---|---|
| Primary (Solid) | `.btn-primary` | White bg, black text | Main CTAs: "Sign Up" |
| Glass (Default) | `.btn-glass` | Semi-transparent bg, backdrop-blur, subtle border | Most buttons: "View Docs", "Start Building", nav actions |
| Ghost | `.btn-ghost` | Transparent, subtle border on hover only | Toolbar buttons, secondary actions |
| Danger | `.btn-danger` | Red-tinted glass | Delete, destructive actions |

### Button Sizes

| Size | Additional Classes | Usage |
|---|---|---|
| Default | `px-5 py-2 text-xs` | Standard buttons |
| Small (sm) | `px-4 py-1.5 text-xs` | Navbar, compact contexts |
| Tiny (xs) | `px-3 py-1 text-[10px]` | Tags, badges |

### CSS Class Definitions (in `globals.css`)

```css
.btn-primary {
  @apply inline-flex items-center justify-center gap-1.5 rounded-full
    bg-white text-black text-xs font-semibold
    px-5 py-2
    hover:bg-zinc-200
    transition-all duration-200
    outline-none focus-visible:ring-2 focus-visible:ring-white/50
    cursor-pointer select-none;
}

.btn-glass {
  @apply inline-flex items-center justify-center gap-1.5 rounded-full
    bg-white/[0.04] backdrop-blur-md border border-white/10
    text-white text-xs font-medium
    px-5 py-2
    hover:bg-white/[0.08] hover:border-white/15
    transition-all duration-200
    outline-none focus-visible:ring-2 focus-visible:ring-white/50
    cursor-pointer select-none;
}

.btn-ghost {
  @apply inline-flex items-center justify-center gap-1.5 rounded-full
    bg-transparent border border-transparent
    text-zinc-400 text-xs font-medium
    px-4 py-1.5
    hover:bg-white/[0.04] hover:border-white/5 hover:text-zinc-200
    transition-all duration-200
    cursor-pointer select-none;
}

.btn-danger {
  @apply inline-flex items-center justify-center gap-1.5 rounded-lg
    bg-red-500/10 border border-red-500/20
    text-red-400 text-xs font-semibold
    px-4 py-1.5
    hover:bg-red-500/20
    transition-all duration-200
    cursor-pointer select-none;
}
```

---

## 5. Card System

| Type | Radius | Border | Background | Hover |
|---|---|---|---|---|
| Feature card | `rounded-2xl` | `border-white/5` | `bg-zinc-950/20 backdrop-blur-md` | `hover:border-white/10 hover:bg-zinc-900/30` |
| Nav card | `rounded-xl` | `border-zinc-800` | `bg-zinc-950` | `hover:border-zinc-700` |
| Code block | `rounded-lg` | `border-zinc-800` | `bg-zinc-950` | — |

---

## 6. Glassmorphism

| Element | Classes |
|---|---|
| Header / Navbar | `bg-black/50 backdrop-blur-[20px] border-b border-white/8` |
| Footer | `bg-[#0A0A0A] border-t border-white/[0.08]` (Standardized on all pages) |
| Panels / Modals | Use `.glass-panel` class from `globals.css` |
| Buttons | Use `.btn-glass` class |

---

## 7. Spacing & Layout

| Context | Max Width | Padding |
|---|---|---|
| Landing sections | `max-w-5xl` or `max-w-7xl` | `px-6` |
| Doc content | `max-w-3xl` | `p-6 md:p-8 lg:p-12` |
| Full-width shell | `max-w-[90rem]` | `px-4 sm:px-6 lg:px-8` |
| Sidebar | `w-64` | `px-4` |
| TOC | `w-56` | `pl-4` |

---

## 8. Rules

1. **One font everywhere** — Geist Sans for all body/UI text. Archivo ONLY for sparse uppercase display headers.
2. **No inline fontFamily** — Never use `style={{ fontFamily: '...' }}`. Use Tailwind classes.
3. **zinc only, no neutral** — Always use `text-zinc-*`, `bg-zinc-*`, `border-zinc-*`. Never `neutral-*`.
4. **No arbitrary pixel sizes** except `text-[10px]` (Overline) and `text-[9px]` (Micro). Use Tailwind's standard scale for everything else.
5. **Buttons are glass or solid** — Use `.btn-glass` for most buttons, `.btn-primary` for main CTAs. Nothing oversized.
6. **Consistent heading weights** — `font-bold` for H1, `font-semibold` for H2–H4, `font-medium` for Display.
7. **leading-7 for body text** — All paragraph body text uses `leading-7`. Card/secondary text uses `leading-relaxed`.
8. **Dark mode only** — This app is always dark. No light-mode prefixed classes needed unless explicitly required for prose elements.

---

*Last updated: June 2026*
