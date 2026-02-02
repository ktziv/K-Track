# K-Track

A lightweight Node server that serves a mobile-friendly dashboard for quick status checks.

## Getting started

No external dependencies are required.

```bash
cd K-Track-Server
node server.js
```

Then open [http://localhost:3000](http://localhost:3000) on your phone or desktop browser. The layout is optimized for small screens and will display a list of users pulled from `users.json`.

## Netlify deployment

This project is configured for Netlify static hosting by publishing `K-Track-Server/public`. The included `netlify.toml` sets the publish directory automatically, and `_redirects` ensures all paths load the main page.

If you are using the Netlify UI, make sure:

- **Base directory** is the repo root.
- **Build command** is empty.
- **Publish directory** is `K-Track-Server/public`.

## Project structure

- `K-Track-Server/server.js`: Node server that serves static assets and an API endpoint.
- `K-Track-Server/public/`: Front-end assets (HTML/CSS/JS) designed for mobile.
- `K-Track-Server/users.json`: Sample data file for the dashboard.
- `K-Track-Server/package.json`: Basic metadata and script.
