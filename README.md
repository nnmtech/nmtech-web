```markdown
# nmtech-web
```

Best-practice helpers added by the assistant:

- `scripts/compute_sri.js` — compute SHA384 SRI for built assets in `dist/`.
- `netlify.toml` — Netlify headers with CSP placeholders and static asset caching rules.
- Updated `package.json` with `npm run compute-sri` helper.

Workflow to prepare production deploy:

1. Build your front-end assets so the following files exist:
	- `dist/css/app.min.css`
	- `dist/js/app.min.js`

2. Compute SRI hashes:

```bash
npm install
npm run compute-sri
```

3. Replace `REPLACE_WITH_JS_HASH` and `REPLACE_WITH_CSS_HASH` in `netlify.toml` with the printed `sha384-...` values.

4. Ensure `index.html` uses the same SRI `integrity` values for the linked assets and includes `crossorigin="anonymous"`.

5. Deploy via Netlify CLI or CI:

```bash
# netlify deploy --prod --dir=dist
```

Environment variables for production functions:

- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (rate limiter)
- `APPS_SCRIPT_URL` (Google Apps Script webhook)

# nmtech-web