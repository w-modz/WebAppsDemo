import express from "express";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.PORT || 3001);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDirectory = path.join(root, "data");
const tasksFile = path.join(dataDirectory, "tasks.json");
const validLanguages = new Set(["en", "pl"]);

app.use(express.json({ limit: "32kb" }));

async function readTasks() {
  try {
    return JSON.parse(await readFile(tasksFile, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return [];
  }
}

async function writeTasks(tasks) {
  await mkdir(dataDirectory, { recursive: true });
  const temporaryFile = `${tasksFile}.${randomUUID()}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(tasks, null, 2), "utf8");
  await rename(temporaryFile, tasksFile);
}

function validateTaskContent(content) {
  return typeof content === "string" && content.trim().length >= 3 && content.trim().length <= 255;
}

app.get("/api/health", (_request, response) => response.json({ status: "ok" }));

app.get("/api/tasks", async (_request, response, next) => {
  try {
    response.json(await readTasks());
  } catch (error) {
    next(error);
  }
});

app.post("/api/tasks", async (request, response, next) => {
  try {
    const { content, deadline } = request.body;
    const deadlineDate = new Date(deadline);
    if (!validateTaskContent(content) || !deadline || Number.isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
      return response.status(400).json({ error: "Enter a task of 3–255 characters and a future deadline." });
    }
    const tasks = await readTasks();
    const task = { id: randomUUID(), content: content.trim(), deadline: deadlineDate.toISOString(), createdAt: new Date().toISOString() };
    tasks.push(task);
    await writeTasks(tasks);
    response.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/tasks/:id", async (request, response, next) => {
  try {
    const { content } = request.body;
    if (!validateTaskContent(content)) {
      return response.status(400).json({ error: "Task text must be between 3 and 255 characters." });
    }
    const tasks = await readTasks();
    const task = tasks.find((item) => item.id === request.params.id);
    if (!task) return response.status(404).json({ error: "Task not found." });
    task.content = content.trim();
    await writeTasks(tasks);
    response.json(task);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/tasks/:id", async (request, response, next) => {
  try {
    const tasks = await readTasks();
    const filteredTasks = tasks.filter((item) => item.id !== request.params.id);
    if (filteredTasks.length === tasks.length) return response.status(404).json({ error: "Task not found." });
    await writeTasks(filteredTasks);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get("/api/weather", async (request, response, next) => {
  try {
    const city = String(request.query.city || "").trim();
    const language = validLanguages.has(request.query.language) ? request.query.language : "en";
    if (!city || city.length > 120) return response.status(400).json({ error: "Enter a city name (up to 120 characters)." });

    const geocodingUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
    geocodingUrl.search = new URLSearchParams({ name: city, count: "1", language, format: "json" }).toString();
    const geocodingResponse = await fetch(geocodingUrl, { signal: AbortSignal.timeout(10000) });
    if (!geocodingResponse.ok) throw new Error(`Geocoding service returned ${geocodingResponse.status}.`);
    const location = (await geocodingResponse.json()).results?.[0];
    if (!location) return response.status(404).json({ error: language === "pl" ? "Nie znaleziono miasta." : "City not found." });

    const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
    forecastUrl.search = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
      forecast_days: "5",
      timezone: "auto",
      temperature_unit: "celsius",
      wind_speed_unit: "kmh",
    }).toString();
    const forecastResponse = await fetch(forecastUrl, { signal: AbortSignal.timeout(10000) });
    if (!forecastResponse.ok) throw new Error(`Forecast service returned ${forecastResponse.status}.`);
    response.json({ location: { name: location.name, country: location.country }, ...(await forecastResponse.json()) });
  } catch (error) {
    next(error);
  }
});

const distDirectory = path.join(root, "dist");
if (existsSync(distDirectory)) {
  app.use(express.static(distDirectory));
  app.get(/.*/, (_request, response) => response.sendFile(path.join(distDirectory, "index.html")));
}

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: "The server could not complete the request." });
});

app.listen(port, () => console.log(`Node API listening at http://localhost:${port}`));
