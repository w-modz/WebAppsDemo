# WebApps Demo

This is the GitHub Pages demo of WebApps Demo, a collection of three small React projects:

- **Todo app** — search, add, edit, and delete tasks with deadlines.
- **Map puzzle** — capture a map and arrange its pieces; location lookup is optional and requires browser permission.
- **Weather app** — look up current conditions and a five-day forecast by city.

The demo is available as a static website, so no installation or account is needed to try it. The map and weather features use online third-party services and require an internet connection.

## How this version differs from the main app

The Pages demo is built from the same React source as the main app, but it runs entirely in the browser:

- Todo items are stored in the current browser's local storage. They are private to that browser and are not shared across devices or visitors.
- Weather information is fetched directly from Open-Meteo.
- It does not use the Node.js/Express API or read and write `data/tasks.json`.
- Routes use URL hashes (for example, `/#/projects/todo`) to work on GitHub Pages.

The main app runs with a Node.js/Express server. Its todo items are stored server-side in `data/tasks.json`, so clients using the same server share that data. The server also provides the weather endpoint and serves the React app.

## Run locally

To preview the published static build, serve this directory with any static file server. For example, from the repository root with Python installed:

```sh
python -m http.server 8000 --directory docs
```

Then open `http://localhost:8000`.

To run the main, server-backed app instead, see the repository's [main README](../README.md).
