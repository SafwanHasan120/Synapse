# Design

## Overview

Synapse's visual identity derives from a mark of three concentric crescents in rust and sand on a warm cream ground. The interface carries this editorial warmth through a palette of warm neutrals and carefully restrained typography. Design decisions should feel considered and spacious, never cluttered or clinical. When in doubt: warmer, quieter, more space.

## Color

### Palette

| Name        | Value     | Usage                                                      |
|-------------|-----------|-----------------------------------------------------------|
| cream       | `#F2E8DC` | Page background (all surfaces)                           |
| surface     | `#EDE0D0` | Card backgrounds, slight elevation                       |
| border      | `#D9C9B5` | Borders, dividers, secondary input backgrounds           |
| rust        | `#7D3A2C` | Primary CTA, active nav, action states, approve buttons  |
| rust-dark   | `#6A2E22` | Rust hover / pressed state                               |
| brown       | `#B87550` | Secondary accent (currently unused; reserved)           |
| sand        | `#D4A472` | Accent, soft emphasis                                     |
| ink         | `#1C1208` | Primary text, headings                                    |
| warm        | `#7A6355` | Secondary text, metadata, labels                         |
| muted       | `#A8927E` | Placeholder text, disabled states, empty state copy      |
| sage        | `#5C7A52` | Approve button only — signals positive, irreversible action |

### Usage Rules

- **Background is always cream.** No dark mode, no elevation via shadow. Use borders and tonal shifts only.
- **Rust is the only call-to-action color.** Primary buttons, active nav states, approval actions. Never elsewhere.
- **Sage is used exactly once:** the Approve button. It must stay visually distinct from rust.
- **Never use pure black or pure white.** Ink (`#1C1208`) and cream (`#F2E8DC`) are the poles.
- **Contrast minimum:** All text must meet WCAG AA (4.5:1 for body, 3:1 for large text ≥18px or bold ≥14px).

## Typography

### Typefaces

- **DM Serif Display** (400 weight only) — Page headings, section headings, empty state copy, any narrative text. Carries editorial voice.
- **Inter** (400 weight) — All UI text, body copy, metadata, tags, buttons, labels.

### Scale

| Role               | Typeface         | Size  | Weight | Line Height | Notes                       |
|--------------------|------------------|-------|--------|-------------|------------------------------|
| Logotype           | DM Serif Display | 16px  | 400    | —           | Letter-spacing: 0.08em     |
| Page heading       | DM Serif Display | 24px  | 400    | 1.2         | No letter-spacing           |
| Section heading    | DM Serif Display | 18px  | 400    | 1.2         | —                           |
| Body               | Inter            | 14px  | 400    | 1.6         | Max line length: 65–75ch   |
| UI / labels        | Inter            | 13px  | 400    | 1.5         | —                           |
| Metadata / tags    | Inter            | 11px  | 400    | 1.4         | Letter-spacing: 0.02em     |

### Rules

- Headings never go bold. The weight and serif voice of DM Serif Display provides emphasis.
- Italic serif is used **only** for empty states and the "Reviewed ✓" confirmation — sparingly, never for body copy.
- All-caps is not used anywhere.
- Use `text-wrap: balance` on page and section headings for even line lengths; `text-wrap: pretty` on long prose to reduce orphans.

## Components

### Cards

```
background:        #EDE0D0
border:            1px solid #D9C9B5
border-radius:     8px
padding:           20px
box-shadow:        none
```

Cards are distinguished from the page background by a single border and a 1-step darker cream. No elevation, no hover lift.

### Buttons

#### Primary (Sign in, Approve context unit)

```
background:        #7D3A2C
color:             #F2E8DC
border:            none
border-radius:     6px
font:              Inter 13px 400
padding:           12px 16px
transition:        background 150ms ease-out
hover:             background #6A2E22
active:            background #5A2219
disabled:          opacity 50%
```

#### Secondary / Ghost

```
background:        transparent
border:            1px solid #D9C9B5
color:             #7A6355
border-radius:     6px
font:              Inter 13px 400
padding:           12px 16px
transition:        background 150ms ease-out
hover:             background #EDE0D0
disabled:          opacity 50%
```

#### Approve button (queue action)

```
background:        #5C7A52
color:             #F2E8DC
border:            none
border-radius:     6px
font:              Inter 13px 400
padding:           8px 16px
hover:             background #4A6843
```

#### Reject button (queue action)

```
background:        transparent
border:            1px solid #D9C9B5
color:             #7A6355
border-radius:     6px
font:              Inter 13px 400
padding:           8px 16px
hover:             background #EDE0D0
```

### Tags and Badges

#### Default (team scope, source labels)

```
background:        #D9C9B5
color:             #7A6355
border-radius:     4px
padding:           4px 10px
font:              Inter 11px 400
```

#### Agent-sourced (agent proposals)

```
background:        #EDD8C0
color:             #7D3A2C
border-radius:     4px
padding:           4px 10px
font:              Inter 11px 400
```

This subtle tint distinction signals agent origin without alarming the viewer.

### Navigation Header

```
background:        #F2E8DC (same as page bg)
border-bottom:     1px solid #D9C9B5
padding:           16px 24px
```

#### Active nav link

```
color:             #7D3A2C
border-bottom:     2px solid #7D3A2C
```

#### Default nav link

```
color:             #7A6355
transition:        color 150ms ease-out
hover:             color #1C1208
```

### Form Inputs

```
background:        #F2E8DC
border:            1px solid #D9C9B5
border-radius:     6px
padding:           10px 12px
font:              Inter 14px 400
color:             #1C1208
placeholder:       #A8927E
transition:        border-color 150ms ease-out
focus:             border-color #7D3A2C, outline none
```

### Empty States

Display using italic DM Serif Display at 14px in `#A8927E` (muted). No illustrations. Example: *"No proposals awaiting review."*

### Error States

Use rust (`#7D3A2C`) for error text and error borders. Never alarming red. Pair with clear, warm copy explaining the issue and the next action.

## Layout & Spacing

- **Max content width:** 1280px (`max-w-5xl` in Tailwind)
- **Page padding:** 24px horizontal, 32px vertical
- **Card stack gap:** 16px
- **Section heading to first element:** 24px
- **Component internal padding:** Varies by component (see component specs above)

**Principle:** Space generously. The cream palette only works if it has room to breathe. When in doubt, add margin rather than subtract it.

## Motion

**Current phase:** None. When motion is added:
- Use ease-out curves (exponential: ease-out-quart or ease-out-expo) for entrance animations.
- Limit duration to 150–300ms for UI transitions.
- Always provide a `@media (prefers-reduced-motion: reduce)` alternative; typically a crossfade or instant transition.
- Never animate layout properties; use transform or opacity instead.

## Brand Elements

The Synapse mark (three concentric crescents) appears in the header or footer. Use the mark at 1:1 (no stretching) and only in rust on cream, or cream on rust. Never alter the proportions or add effects.

---

## Implementation Notes

### Current Setup

- Framework: Next.js 14 with React 18
- Styling: Tailwind CSS 3.4
- No custom component library yet; components are single-file React components

### Tailwind Configuration

All colors are defined as CSS custom properties or Tailwind extensions. When setting up `tailwind.config.ts`, map the palette above to Tailwind's color system:

```javascript
theme: {
  extend: {
    colors: {
      cream: '#F2E8DC',
      surface: '#EDE0D0',
      border: '#D9C9B5',
      rust: '#7D3A2C',
      'rust-dark': '#6A2E22',
      brown: '#B87550',
      sand: '#D4A472',
      ink: '#1C1208',
      warm: '#7A6355',
      muted: '#A8927E',
      sage: '#5C7A52',
    },
  },
}
```

Then use Tailwind's utilities: `bg-cream`, `text-ink`, `border-border`, etc.

### Typography Setup

Import DM Serif Display and Inter from a font service (Google Fonts, Fontsource, etc.) in the layout's `<head>` or via `@import` in the root CSS file.

Example (Google Fonts):
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500&display=swap" rel="stylesheet">
```

Then apply in Tailwind config:
```javascript
fontFamily: {
  serif: ['DM Serif Display', 'serif'],
  sans: ['Inter', 'sans-serif'],
}
```
