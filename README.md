# SASE at UVA Instagram Insights

This dashboard hosts SASE @ UVA's weekly PR performance charts, milestones, a searchable content explorer, and an original audio loop.

## Run locally

From the repository root, start a static server:

```sh
python -m http.server 8000 --directory site
```

Open [localhost:8000](http://localhost:8000). No build or dependencies are required.

## Repository layout

- `site/index.html` — Dashboard entry point
- `site/assets/` — Stylesheets, JavaScript, and audio
- `site/data/instagram.js` — The fall 2026 Instagram dashboard dataset
- `design/references/` — Source artwork from earlier design iterations

The dataset and milestone content are part of this repository. Keep raw exports, API keys, environment files, and private deployment settings outside version control.
