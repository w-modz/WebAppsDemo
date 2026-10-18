import React, { Suspense, lazy } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";

const TodoPage = lazy(() => import("./projects/TodoPage.jsx"));
const PuzzlePage = lazy(() => import("./projects/PuzzlePage.jsx"));
const WeatherPage = lazy(() => import("./projects/WeatherPage.jsx"));

const projects = [
  { label: "A", title: "Todo App", path: "/projects/todo", description: "Search, add, edit, and remove tasks with deadlines." },
  { label: "B", title: "Map Puzzle", path: "/projects/puzzle", description: "Turn a live map into an interactive drag-and-drop puzzle." },
  { label: "C", title: "Weather App", path: "/projects/weather", description: "Current conditions and a five-day forecast by city." },
];

function HomePage() {
  return (
    <>
      <header className="topbar">
        <div className="container">
          <p className="eyebrow">A collection of university projects</p>
          <h1>WebApps Demo</h1>
          <p>Explore three web apps, brought together in one React site.</p>
        </div>
      </header>
      <main className="container home-main">
        <section className="grid" aria-label="Project demos">
          {projects.map((project) => (
            <Link className="card" to={project.path} key={project.path}>
              <span className="badge">Project {project.label}</span>
              <h2>{project.title}</h2>
              <p>{project.description}</p>
              <span className="card-cta">Open project <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </section>
      </main>
    </>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <nav className="site-nav" aria-label="Main navigation">
        <Link className="brand" to="/">WebApps Demo</Link>
        <div className="nav-links">
          {projects.map((project) => (
            <NavLink key={project.path} to={project.path}>{project.title}</NavLink>
          ))}
        </div>
      </nav>
      <Suspense fallback={<main className="project-page" role="status">Loading project…</main>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/projects/todo" element={<TodoPage />} />
          <Route path="/projects/puzzle" element={<PuzzlePage />} />
          <Route path="/projects/weather" element={<WeatherPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Suspense>
    </div>
  );
}
