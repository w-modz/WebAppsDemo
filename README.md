# WebApps Demo

This repository brings four university web-app projects together as one React application, backed by a shared Node.js/Express server.

## Included apps

- Intro page: editorial content layout
- Todo app: searchable tasks with server-side JSON persistence
- Map puzzle: Leaflet map capture and drag-and-drop puzzle
- Weather app: current conditions and five-day forecast from Open-Meteo

## Demo entry point

Install dependencies and start the React dev server and Node API together:

```sh
npm install
npm run dev
```

Use Node.js 18 or newer.

Open the URL printed by Vite (normally `http://localhost:5173/`). Each app is available from the navigation. The Express API runs on port 3001; tasks are stored in `data/tasks.json`.

Create and run the production build with:

```sh
npm run build
npm start
```

The Node server serves the built React app and its API on port 3001. The weather endpoint uses Open-Meteo and does not require an API key.

## Notes

All project screens are React routes in `src/projects`; the shared Node backend is in `server/`.
