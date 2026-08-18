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

- **3 requests** to render the home page (HTML + CSS + JS), all same-origin.
- **10.7 KB gzipped** critical path.
- **No web fonts** — system font stack only.
- **No raster images** in the page. All iconography and the flow diagram are
  inline SVG. The only PNGs are `og-image.png` (fetched by social crawlers, not
  by visitors) and `apple-touch-icon.png`.
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
| `main.js` | Mobile nav toggle. The only script. |
| `_headers` | CSP + security headers (Netlify/Cloudflare format) |
| `robots.txt`, `sitemap.xml`, `site.webmanifest` | Crawl + install metadata |
| `favicon.svg`, `apple-touch-icon.png`, `og-image.png` | Icons and social card |

`og-image.png` and `apple-touch-icon.png` are generated, not hand-drawn. Their
generator lives outside this repo; regenerate if the brand or the OG copy
changes.

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
| `terms.html` | All 13 sections |
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

- 538 text elements, **0 WCAG AA contrast failures**
- Exactly one `<h1>` per page, **no skipped heading levels**
- 0 images without `alt`, 0 accessibility-exposed unlabelled SVGs, 0 empty links
- 0 inline event handlers, 0 inline scripts, 0 cross-origin references
- 0 forms, 0 inputs
- No horizontal overflow at **any width from 320px to 1920px**, across all 8
  pages; all tap targets ≥ 24px (WCAG 2.2 SC 2.5.8)
- WCAG 1.4.12 text spacing: no clipping or overflow with line-height 1.5,
  letter-spacing 0.12em, word-spacing 0.16em, paragraph spacing 2em
- Windows High Contrast supported via `@media (forced-colors: active)` — controls
  whose meaning was carried by a background fill keep an explicit border
- Nav toggle: opens, closes, closes on `Escape` with focus returned, closes on
  link activation

## Known gaps

- **No visual screenshot review was possible** in the environment this was built
  in — the browser pane could not composite frames, so verification was done
  through the DOM, the CSSOM, computed styles, and the accessibility tree rather
  than by eye. Look at it on a real screen before launch.
- Page chrome (header/footer) is duplicated across 8 files. That is the cost of
  having no build step. If the site grows past ~10 pages, revisit.
