<!-- Copilot instructions for AI coding agents working on this repo -->
# NMTech Landing — Copilot Instructions

This repository is a simple static marketing landing site. The goal of edits should be to preserve the single-page, static nature and existing external integrations while improving content, accessibility, and performance.

- **Key files:** `index.html`, `images/` (hero and asset images), root-level favicons (`/favicon1.ico`, `/apple-touch-icon.png`).
- **Primary behaviors to preserve:** Netlify form handling, Google Analytics, Microsoft Clarity, and Schema.org LocalBusiness JSON-LD.

Big picture
- Single-page static HTML site (no server-side code in repo). Content, layout, and assets are contained in `index.html` and the `images/` folder.
- Form submissions use Netlify Forms via `data-netlify="true"` and `name="prospectForm"`. Do NOT remove or rename the hidden `form-name` input or the `data-netlify` attributes.
- External integrations:
  - Google Analytics: gtag snippet in `<head>`
  - Microsoft Clarity: clarity snippet in `<head>`
  - Netlify Forms: `form` attributes and `action="/success.html"`

Developer workflows
- Preview locally by opening `index.html` in a browser. For a simple static server use:

```bash
python -m http.server 8000
# or, if you prefer:
npx serve .  # requires 'serve' installed
```
- To emulate Netlify Forms locally, use the Netlify CLI: `netlify dev` (if available). Netlify-specific testing is optional but recommended before deploying form changes.

Project-specific conventions & patterns
- CSS is inline inside `index.html` within the `<style>` block in the `<head>`. Keep style changes compact and avoid extracting to new build toolchains.
- Hero background references `images/NMTECH4.jpg` and is case-sensitive on Linux. Ensure image filenames and paths match exactly.
- Accessibility: preserve the `.visually-hidden` class and the `data-netlify-honeypot="honeypot"` honeypot field (named `honeypot`) — these are used for spam protection and a11y.
- Progressive enhancement: the JavaScript only updates button text for UX and does not prevent the native form submit. Do not change the submit handling to use XHR unless you update Netlify handling accordingly.

When editing content or copy
- Keep marketing voice short, local to Atlanta, and factual (e.g., mention free assessment, 24/7 support) — examples are already placed in the hero and trust sections.
- For CTAs and form labels keep the existing `id` and `name` attributes (e.g., `company`, `name`, `email`, `employees`, `pain`) so Netlify mapping remains intact.

When adding features
- Prefer client-side, self-contained changes (HTML/CSS/JS) over introducing a backend. If a backend is required, document the integration and do not remove Netlify form attributes unless migrating forms.

Testing & deployment notes
- No test suite present. Manual QA: verify form submission (Netlify), page load, hero image renders, analytics and clarity snippets still load, and `success.html` redirect works.
- Deployment is expected to be to a static host (Netlify suggested by form attributes). Verify production canonical URL (`https://nmtechmsp.com/managed-it-services-atlanta`) remains correct.

Examples from repo
- Hero image: `images/NMTECH4.jpg` (used in CSS: `background: url('images/NMTECH4.jpg')`)
- Netlify form: `form id="prospectForm" name="prospectForm" data-netlify="true" data-netlify-honeypot="honeypot" action="/success.html"`

Editing guidelines for AI agents
- Preserve integrations: do not remove analytics, clarity, schema JSON-LD, or Netlify form attributes unless explicitly instructed by a human reviewer.
- Preserve accessibility hooks and hidden honeypot field names/IDs.
- When refactoring markup keep semantic structure (hero → `.hero`, form → `.cta-section`, features in `.features` grid).
- For any content changes that affect legal text (privacy/terms) flag for human review.

If this file already existed, merge by preserving any project-specific rules and appending or updating the sections above where they add clarity.

Questions? Ask for clarification on required changes, especially if you propose removing or migrating Netlify forms or analytics snippets.
