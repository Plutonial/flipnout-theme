# Flip N Out Pinball — Project Guidelines

Shopify theme build for Flip N Out Pinball, a pinball machine retailer for collectors.
Forked from Shopify **Horizon** (v3.4.0). Built by Plutonial Inc.

- **Store:** flipnoutpinball.myshopify.com (password-protected during dev)
- **Repository:** Plutonial/flipnout-theme — **`develop` is the working branch**, auto-syncs to Shopify
- **Launch target:** mid-2026 (confirm current date with the team before treating as a deadline)

---

## CRITICAL RULES — these are violated most often, check them every task

1. **NEVER hardcode font sizes in px or clamp().** Use the theme's fluid tokens ONLY:
   `var(--font-size--3xs)` … `var(--font-size--6xl)`. Current scale: `xs`=13px, `sm`=14px,
   `md`=16px, `lg`=18px, `xl`=20px, `2xl`=24px, `3xl`=32px, `4xl`=40px, `5xl`=48px, `6xl`=56px.
   This is the single most repeated correction — check it before submitting.
2. **NEVER hardcode font families.** Inherit the theme's role fonts (headings = Oswald,
   body = Archivo, already set in Theme Settings). Do not write `font-family: Oswald`.
3. **NO `!important`.** Match specificity instead. If a rule won't apply, find what's overriding it.
4. **Conditional rendering on EVERY metafield-backed block.** An empty metafield must hide the
   block AND its heading with no leftover gap or empty container. Different games have different
   fields populated.
5. **Derive values, don't hardcode them.** If a measurement comes from another value (container
   width, logo height), express it via a CSS custom property / calc, not a literal.
6. **Boxed content in the site's page container** (reuse the header container width). Full-bleed
   only where a section is explicitly meant to be full-bleed.

---

## Architecture

### Content model
- Each **game** = a manual Collection with `is_game = true`, rendered by `collection.game.json`.
- Each **edition** = a Product (e.g. "Harry Potter Pinball Machine – Wizard Edition"),
  rendered by `product.json`.
- **Manufacturer** = automated collection by Vendor, rendered by `collection.brand.json`.
- Metafields live in the `custom` namespace.
- **Manufacturer-agnostic:** one schema + conditional rendering. NO per-brand logic in the theme.

### Horizon patterns
- Use Horizon's block-based architecture (`blocks/`, `sections/`, `snippets/`). Blocks nest up to
  8 levels.
- Prefer `{% style %}` blocks scoped to a unique block/section ID for section-specific CSS.
  (Exception: the shared UIkit component layer is a real CSS asset — see below.)
- Do not modify upstream Horizon files casually — keep custom work in custom blocks/sections so
  future `git pull upstream main` doesn't conflict.
- Lazy-load below-the-fold content; keep the above-fold hero eager.

### Assets
- **The `assets/` folder is FLAT** (Shopify rule — no subfolders).
- **Prefix all custom/vendored assets `fnop-`** (e.g. `fnop-logo.png`, `fnop-bullet.png`,
  `fnop-uikit.min.js`).
- Reference via `{{ 'name.ext' | asset_url }}`.

---

## UIkit component layer — ADOPTED (supersedes the old "no external JS" rule)

**UIkit is deliberately adopted for this project.** The previous guideline banning external JS
libraries no longer applies to UIkit specifically. Rationale: this theme is a template for ~431
games, so a component system is justified, and UIkit ships components + JS as static files with no
build step.

Native Web Components are still preferred for bespoke interactivity. Do NOT add other libraries
(jQuery, Swiper, Slick, etc.) — UIkit is the one sanctioned exception.

### How it loads
- `snippets/uikit-loader.liquid`, rendered from `layout/theme.liquid`.
- Gated to product pages and the game collection template:
  `{% if template.name == 'product' or template.suffix == 'game' %}`
- Loads, in order: `fnop-uikit-components.css` (curated subset), `fnop-uikit.min.js` (full JS),
  `fnop-uikit-icons.min.js`.
- Re-inits on `shopify:section:load` → `UIkit.update()` so components work in the theme editor.

### CRITICAL UIkit constraints
- **The full `fnop-uikit.min.css` is deliberately NOT loaded.** UIkit's CSS is NOT `.uk-scope`
  gated, so loading it whole would override Horizon's globals (body, headings, buttons, links,
  forms). Only the curated subset `fnop-uikit-components.css` is loaded.
- The subset includes: slider, slideshow, lightbox, **grid**, transition, animation, icon, close,
  spinner, slidenav, dotnav. It deliberately EXCLUDES base/reset/typography/button/link/form.
- **If you use a `uk-*` class whose CSS is not in the subset, it will silently render broken.**
  The grid module was missing once and both sliders rendered as vertically stacked images with no
  error. Before using a new UIkit component, verify its CSS is in the subset — or add it.
- Components in use: **Slider** (gallery, highlights carousel) and **Lightbox** (gallery,
  highlights, rules flowchart). Use separate lightbox `group:` values per section.

---

## Design system (locked)

- **Headings:** Oswald SemiBold, H1/H2 uppercase. **Body/subheading:** Archivo. Hero H1 uses
  Phosphate (verify web licensing before launch; Oswald Bold fallback).
- **Brand red = `#FF0000`** pure (sampled from logo); there's a `--color-logo-red` var. An earlier
  `#E31E24` was ABANDONED — everything is `#FF0000`.
- **Look:** LIGHT and airy, Amini's-style (aminis.com). White + warm cream/beige bands + one dark
  cinematic section. Brand red accent. **No green.**
- Section headings: Oswald with a red accent line beneath.

---

## Intentional decisions — DO NOT "fix" these

- **Nav typography is a CSS override ON PURPOSE.** The theme's Font setting is global (nav +
  submenus together); setting it to Accent would make submenus Oswald too, but submenus must stay
  Archivo. So nav = Oswald and submenu = Archivo is enforced by CSS targeting `.menu-list__link` /
  `.mega-menu__link--parent` only. Moving this to settings WILL break submenus.
- **Decorate nav items with `background-image` only** — not pseudo-elements (nav items are
  flex-column so pseudos stack) and not `position` on `li` (collapses the mega menu).
- **Mega menu columns are content-sized, not equal thirds.** Unequal content should give unequal
  gaps, mirroring the header (logo/nav/icons each sized to content).
- **Mega menu separators use `border-left` + padding**, NOT box-shadow (clipped by
  `.menu-list__submenu-inner { overflow: hidden auto }`).
- **Drawer breakpoint is 990px** (not Horizon's 750px) — below 990 = hamburger, because at 820px
  only 4 of 9 nav items fit.
- **The header + mega menu are COMPLETE and verified** at 2560/991/989/768/390. Do not restructure
  the header. Additive polish only, when explicitly asked.

---

## Data vs Code (what's in git, what isn't)

- **DATA — Shopify admin, NOT git, never pulled:** products, collections, metafields, images,
  **menu structure**. Editing the menu is a data task.
- **CODE — git:** `.liquid`, `.css`, `.js`, `config/settings_data.json`,
  `config/settings_schema.json`. Pull after customizer edits AND after code pushes.

---

## Debugging discipline (learned the hard way — cost ~6 rounds once)

- **To test whether a CSS value is derived or hardcoded, change the SOURCE VARIABLE, not the
  symptom.** `getComputedStyle` resolves `calc()` and CSS vars, so a derived value and a literal
  look identical there. Forcing `padding-left` proves nothing if the value comes from
  `calc(var(...))`. Only moving the custom property distinguishes them.
- **Synthetic pointer events do NOT trigger real CSS `:hover`.** Verify hover with a real mouse.
- **Horizon colors the nav via CSS variables**, not direct color rules. Override
  `--menu-top-level-font-color(-rgb)` and `--opacity-subdued-text: 1` on the target element rather
  than fighting `:has()` specificity.
- **Verify by MEASURING, not by eye.** "It looks like a slider" is not "the slider works" — check
  the computed `display`, element positions, and whether a `::before` actually has `content`.
  A pseudo-element without `content: ""` never renders, no matter what background you give it.

---

## Product domain

Buyers are enthusiasts spending $1K–$10K. Provide depth, not gloss; trust signals matter.
Specs worth exposing via metafields: manufacturer, year, theme/license, designer, model tier
(Pro/Premium/LE), playfield condition, electronics generation, modifications, restoration status.

---

## Git workflow

- Work local → `git add -A && git commit -m "..."` → `git pull origin develop --no-edit` → `git push`
- `pull.rebase false`. Vim merge → `:wq`.
- Push to `develop` = Shopify updates automatically (GitHub integration). No manual theme push.
- **Never push directly to `main`** — only merge from `develop` after launch.
- Do not commit `.DS_Store`, `node_modules`, `.env`, or local config files.

---

## Performance

- Mobile-first: design for 375px, scale up. LCP target under 2.0s on 4G mobile.
- Lazy-load all images except the above-fold hero.
- Keep the UIkit CSS subset lean — don't pull in modules that aren't used.

---

## When reporting back on a task

- State what changed and where (file + what it does), so the diff can be reviewed.
- Flag anything you worked around rather than solving cleanly.
- If a requested approach conflicts with these guidelines, say so instead of silently picking one.