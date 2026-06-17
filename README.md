# AI Career 2026

Static landing page for the Upgrade course "Искусственный интеллект для карьеры 2026".

## Structure

- `project/index.html` — published page
- `project/styles.css` — shared styles
- `project/app.js` — menu, reveal animation, lead form behavior
- `project/assets/` — images and favicon
- `project/privacy.html` — privacy policy
- `project/offer.html` — offer template
- `project/requisites.html` — requisites template
- `ai-career-2026-standalone.html` — one-file HTML export for sharing

## Local Preview

Open `project/index.html` directly in a browser, or serve the `project` directory with any static file server:

```bash
python3 -m http.server 4173 --directory project
```

## Vercel

Deploy the `project` directory as the Vercel project root:

```bash
vercel deploy --cwd project -y
```

Production deploy:

```bash
vercel deploy --prod --cwd project -y
```
