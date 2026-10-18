# Static site snapshot

This directory contains a static GitHub Pages-friendly version of the project.

- The original app remains unchanged in the repo root.
- This static version is intended for `docs/` deployment from GitHub Pages.
- Included examples:
  - `index.html` landing page
  - `projects/todo.html` with browser localStorage persistence
  - `projects/puzzle.html` with a draggable map puzzle using Leaflet + html2canvas
  - `projects/weather.html` fetching Open-Meteo directly from the browser

To use it with GitHub Pages, enable GitHub Pages in the repository settings and select the `docs` folder as the source.

This page intentionally avoids the Express backend used by the main app, so it works without a server.

