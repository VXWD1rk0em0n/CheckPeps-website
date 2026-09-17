# CheckPeps — marketing site

Static HTML. No framework, no build step, no package manager, no dependencies.
Deploy by copying this directory to any static host.

```bash
python -m http.server 4321 --directory .
```

## Why it is built this way

The product is a health-adjacent educational tool with hard regulatory
boundaries. Every dependency added to this site is a new place for a tracker, a
leaked key, or an unreviewed claim to appear. So the site has none:

- **4 requests** to render the home page (HTML + CSS + JS + the hero art), all
  same-origin. Inner pages are 3 — they have no hero image.
- **24 KB gzipped** of text, plus the hero art: 32 KB at `hero-1200.jpg` or
  82 KB at `hero.jpg`, chosen by `srcset` from the viewport.
- **No web fonts** — system font stack only.
- **One raster image on the home page**: the hero art, in two `srcset` widths.
  All iconography and the flow diagram remain inline SVG. `og-image.png` is
  fetched by social crawlers rather than visitors, and `apple-touch-icon.png`
  only on install.
- **No analytics, no tags, no cookies, no forms, no inputs.** Verified: 0
  `<form>` and 0 `<input>` elements across all 8 pages.

If you add a dependency, re-run the checks in "Verification" below.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Home |
| `how-it-works.html` | The five-step conversation flow |
| `safety.html` | Scope, escalation, claims not made |
| `medical-disclaimer.html` | Plain-language boundary + placeholder for formal text |
| `privacy.html`, `terms.html`, `data-practices.html` | Placeholders, `noindex` |
| `404.html` | Not-found page |
| `styles.css` | All styles, light + dark via `prefers-color-scheme` |
| `main.js` | Mobile nav toggle and the motion layer (see "Motion"). The only script. |
| `_headers` | CSP + security headers (Netlify/Cloudflare format) |
| `robots.txt`, `sitemap.xml`, `site.webmanifest` | Crawl + install metadata |
| `favicon.svg`, `apple-touch-icon.png`, `og-image.png` | Icons and social card |

`og-image.png`, `apple-touch-icon.png`, and `media/hero*.jpg` are generated, not
hand-drawn. Their generators live outside this repo; regenerate if the brand or
the OG copy changes.

### Replacing the hero art

The hero art is an abstract peptide-chain motif — deliberately not photography
of vials, syringes, or reconstitution kits, since those depict the exact things
the site says it will not help with. If you swap in commissioned art, three
things must hold or the hero breaks:

1. **Keep roughly 3:2.** It is `object-fit: cover` at `object-position: 65% 50%`.
2. **Keep the left 55% quiet and dark.** The headline, lede, and chips sit there.
3. **Do not remove `.hero__media::after`.** That overlay is the only thing
   guaranteeing text contrast, and it is tuned to hold near-opaque across the
   copy column then release quickly so the art reads on the right.

After any swap, re-check contrast against the composited backdrop — not against
a screenshot, because text antialiasing contaminates pixel sampling.

The copy column is capped at `56vw` from 1100px up, so it never runs far past
the overlay's opaque zone.

## Visual design

An editorial, product-site look built from the existing palette, with no new
images and no web fonts:

- **Deep fields.** The masthead, inner-page headers, the safety block, and the
  closing call to action sit on the deep teal; the footer drops to ink, the
  darkest surface. Deep surfaces carry a faint hairline grid, and a glow tucked
  into the top-right corner away from body copy, so text contrast is still
  measured against the flat fill.
- **Editorial type.** Display headings use the platform's display face
  (`Segoe UI Variable Display` on Windows 11, the system face elsewhere),
  tightly tracked, with the second clause of a heading in the accent
  (`.h-accent`).
- **Chapter and entry numbers.** Section eyebrows count through the page
  ("01 | Who it is for") and grid cards carry "01", "02" in the corner.
- **The wordmark.** The footer ends on a giant, faint "checkpeps". It lives in
  `styles.css`, not in eight copies of the footer markup.
- **Details.** Buttons that square their corners off under the pointer, links
  whose underline draws in from the left, ledger rules between list items.

The numbers and the wordmark are CSS-generated content with an empty
alternative (`content: "…" / ""`), so screen readers skip them; browsers without
that syntax drop the rule and show neither. Forced colours strip the fills, so
deep blocks get a real border and lose their decorative layers. Print drops the
fills and prints black on white.

## Motion

The home page tells its story as you scroll. The masthead copy rises in on load
and lifts away as you leave it; the five-step flow fills a trail and lights each
step as you read down it; the safety statement pins while its words come up in
reading order; sections ease in as they arrive; cards lean toward a mouse
pointer; the footer ends on a low brand glow. The inner pages pick up the
reveals, the card light, and the glow.

It follows the same rules as the rest of the site: no dependency, no network, no
storage, no inline styles or scripts. `main.js` only toggles classes and writes
CSS custom properties through the CSSOM, which the CSP allows.

What keeps it safe to have:

- **Optional by construction.** Every hidden starting state is scoped under
  `html.motion`, which `main.js` adds itself. No JS, no hidden content.
- **`prefers-reduced-motion: reduce`** turns all of it off, including when the
  setting changes mid-visit.
- **`prefers-contrast: more` and forced colours** get the statement as plain
  full-strength text, with no dimmed words, and none of the decorative trail,
  light, or glow.
- **Print** shows every block at full strength.
- **Only opacity and transforms animate.** Scroll work runs at most once per
  animation frame, reads before writes, and only for scenes near the viewport.
- **Keyboard focus** reveals a block immediately, before it has scrolled in.

To remove it, delete the second function in `main.js` and the "Scroll
storytelling" block at the end of `styles.css`. The statement markup in
`index.html` reads as ordinary static text without them.

## Before you deploy

1. **Replace the placeholder domain.** Every canonical, `og:url`, sitemap entry,
   and `robots.txt` sitemap line uses `https://checkpeps.com`. If that is not the
   production origin:

   ```bash
   grep -rl "checkpeps.com" . | xargs sed -i "s|https://checkpeps.com|https://YOUR-DOMAIN|g"
   ```

2. **Translate `_headers`** if you are not on Netlify or Cloudflare Pages. The
   CSP is `default-src 'none'` with `'self'` for script/style/img/font — no
   `unsafe-inline`, because the site has no inline scripts or handlers. For
   nginx, the equivalent is `add_header Content-Security-Policy "...";` with the
   same policy string.

3. **Wire the 404.** Most static hosts need to be told to serve `404.html`.

4. **Do not remove the `noindex` tags** on `privacy.html`, `terms.html`, and
   `data-practices.html` until the approved text is in. `robots.txt` disallows
   the same three; take both off together, and add them to `sitemap.xml` at the
   same time.

## Placeholders — every one must be resolved before launch

All are marked in the page with `[CONTENT PENDING TEAM REVIEW]`.

| Page | What is unwritten |
| --- | --- |
| Every page footer | Formal medical/legal/regulatory disclaimer; company and jurisdiction details |
| `index.html` | Access, waitlist, pricing, availability |
| `safety.html` | Escalation-condition list and referral wording; emergency guidance and region-specific contacts; regulatory-status statement |
| `medical-disclaimer.html` | All 8 formal sections |
| `privacy.html` | All 11 sections |
| `terms.html` | Drafted 2026-08-24, pending legal review. Remaining tokens: legal entity, effective date, venue county, contact details, region-specific emergency guidance |
| `data-practices.html` | All 10 sections |

## Claim boundaries this site holds

Asserted (product description, verified against the brief):

- Maps stated goals to relevant peptide categories
- Provides educational context on those categories
- Screens health information the user chooses to share
- Identifies escalation conditions
- Routes toward licensed professionals

Explicitly denied, in copy:

- Prescribing, dosing, injection technique, reconstitution, stacking
- Replacing a licensed professional
- FDA approval/clearance/registration
- Diagnosis, treatment, cure, prevention
- Clinical efficacy
- Any guarantee of safety, results, or outcomes

Never asserted anywhere, including in metadata: HIPAA compliance, medical-device
status, certification, or any regulatory claim. Those belong to the team's legal
review, not to marketing copy.

The site makes **one** factual privacy statement, on `data-practices.html`: that
this website as built has no forms, cookies, third-party resources, or analytics.
It is explicitly labelled as a description of the current build rather than a
policy commitment, because the team has not approved any privacy commitments yet.

## Verification

Run these after any change. All currently pass.

```bash
grep -rniE "FDA|HIPAA|guarantee|cure|medical device|clinically proven|certified|compliant" --include="*.html" .
```

Every hit must be inside a negation ("No claim of…", "not a guarantee of…").

```bash
grep -rniE "api[_-]?key|secret|password|token|bearer |sk-[A-Za-z0-9]{12,}|AKIA[0-9A-Z]{16}" --include="*.html" --include="*.js" .
```

Must return nothing.

In-browser checks performed, all 8 pages, light **and** dark:

- 551 text elements, **0 WCAG AA contrast failures** (re-run after the visual
  refresh)
- Exactly one `<h1>` per page, **no skipped heading levels**
- 0 images without `alt`, 0 accessibility-exposed unlabelled SVGs, 0 empty links
- 0 inline event handlers, 0 inline scripts, 0 inline `style` attributes in the
  markup, 0 cross-origin resources
- 0 forms, 0 inputs
- No horizontal overflow across all 8 pages at 320, 375, 414, 600, 768, 899,
  900, 1024, 1280, 1440, and 1920px; all tap targets ≥ 24px at 375px
  (WCAG 2.2 SC 2.5.8)
- WCAG 1.4.12 text spacing: no clipping or overflow with line-height 1.5,
  letter-spacing 0.12em, word-spacing 0.16em, paragraph spacing 2em, across all
  8 pages at 320, 375, and 1280px
- Windows High Contrast supported via `@media (forced-colors: active)` — controls
  whose meaning was carried by a background fill keep an explicit border
- Nav toggle: opens, closes, closes on `Escape` with focus returned, closes on
  link activation

Motion layer, checked in-browser in light **and** dark, with screenshots of every
effect at 1280px and of the hero, flow, and statement at 375px:

- Contrast of the text states it introduces: statement 12.2:1 (dark 9.6:1); its
  mint phrase and eyebrow 7.35:1 (dark 6.2:1); flow numbers unlit 6.97:1
  (dark 7.2:1) and lit 6.3:1 (dark 8.45:1)
- No horizontal overflow at 320px on the home, how-it-works, safety, medical
  disclaimer, and 404 pages, at 375px and 1280px on the home page, or at 1920px
  on how-it-works
- One `<h1>` per page and the heading order unchanged
- Removing `html.motion` leaves 0 hidden or dimmed elements
- Tabbing to a block that has not scrolled in reveals it immediately
- No transitions fire on load; the only load animations are the hero intro
- 0 console errors

Run contrast audits with reduced motion emulated, or after scrolling to the end
of the page: blocks that have not revealed yet sit at opacity 0 and read as
failures.

## Known gaps

- **Screenshot review has been Chromium-only**: the visual refresh was reviewed
  at 1280px in light and dark and at 375px in light, in an embedded browser pane.
  Look at it on real devices, and in Safari and Firefox, before launch.
- Page chrome (header/footer) is duplicated across 8 files. That is the cost of
  having no build step. If the site grows past ~10 pages, revisit.
- The motion layer's reduced-motion, increased-contrast, and forced-colours paths
  were verified by reading the gates and by removing `html.motion` in the
  browser, not by emulating those OS settings. It was tested in Chromium only.
