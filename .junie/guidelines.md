# Flip N Out Pinball - Project Guidelines

## Project Context
This is a Shopify theme build for Flip N Out Pinball, a pinball machine retailer
based on the Shopify Horizon theme (v3.4.0). Built by Plutonial Inc.

- **Live store URL:** flipnoutpinball.myshopify.com (password-protected during dev)
- **Launch target:** June 1-5, 2026
- **Repository:** Plutonial/flipnout-theme (GitHub-connected, develop branch auto-syncs)
- **Active branch:** develop

## Architecture Conventions

### Horizon-specific patterns
- Use Horizon's block-based architecture (blocks/, sections/, snippets/)
- Blocks can nest up to 8 levels deep — leverage this for complex product pages
- Use {% style %} tags for scoped CSS, not external CSS files
- Use Web Components for interactivity, not external JS libraries (no Swiper, no Slick)
- Lazy-load below-the-fold content with IntersectionObserver
- Every custom block should generate a unique ID and scope CSS to that ID

### Liquid style
- Use {% liquid %} blocks for multi-line logic
- Comment complex sections with {% comment %} tags
- Prefer Shopify's built-in filters over custom logic where possible

### Performance priorities
- Mobile-first: design for 375px viewport, scale up
- LCP target: under 2.0s on 4G mobile
- Lazy-load all images except above-fold hero
- Avoid loading external scripts when Web Components can do the job

## Product Domain Knowledge

Pinball machines have rich specs that should be exposed via Shopify metafields/metaobjects:
- Manufacturer (Stern, Jersey Jack, Chicago Gaming, etc.)
- Year of release
- Theme/license (e.g., "Godzilla", "John Wick")
- Designer name
- Model tier (Pro / Premium / Limited Edition)
- Playfield condition (New, Used-Excellent, Used-Good, Used-Fair, Restored)
- Electronics generation (Spike 2, SAM, Whitestar, etc.)
- Modifications/upgrades installed
- Restoration status (original / CPR playfield / fully restored)

Buyers tend to be enthusiasts — provide depth, not gloss. Trust signals matter heavily for high-ticket items.

## What NOT to do

- Do not modify upstream Horizon files casually — keep custom changes in custom blocks/sections so future `git pull upstream main` doesn't conflict
- Do not introduce external JS libraries (jQuery, Swiper, Slick, etc.) — use native Web Components
- Do not use inline `style=` attributes — use {% style %} blocks scoped to unique block IDs
- Do not commit .DS_Store, node_modules, .env files, or local config files
- Do not push directly to main branch — only merge from develop after launch