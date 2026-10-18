const translations = {
  en: {
    title: "Weather Forecast",
    city: "Enter city (e.g. Warsaw, Poland)",
    button: "Weather",
    current: "Current",
    fiveDay: "5-Day Forecast",
    empty: "Enter a city to see the forecast.",
    humidity: "Humidity",
    wind: "Wind",
    feelsLike: "Feels like",
    rain: "Rain chance",
    loading: "Loading forecast…",
    error: "Could not load the weather. Please try again.",
  },
  pl: {
    title: "Prognoza pogody",
    city: "Wprowadź miasto (np. Warszawa, Polska)",
    button: "Pogoda",
    current: "Aktualnie",
    fiveDay: "Prognoza 5-dniowa",
    empty: "Wprowadź miasto, aby zobaczyć prognozę.",
    humidity: "Wilgotność",
    wind: "Wiatr",
    feelsLike: "Odczuwalna",
    rain: "Szansa opadów",
    loading: "Pobieranie prognozy…",
    error: "Nie udało się pobrać pogody. Spróbuj ponownie.",
  },
};

const weatherDescriptions = {
  0: ["Clear sky", "Bezchmurnie"],
  1: ["Mainly clear", "Przeważnie bezchmurnie"],
  2: ["Partly cloudy", "Częściowe zachmurzenie"],
  3: ["Overcast", "Pochmurno"],
  45: ["Fog", "Mgła"],
  48: ["Depositing rime fog", "Osadzająca się mgła"],
  51: ["Light drizzle", "Lekka mżawka"],
  53: ["Drizzle", "Mżawka"],
  55: ["Dense drizzle", "Intensywna mżawka"],
  61: ["Light rain", "Lekki deszcz"],
  63: ["Rain", "Deszcz"],
  65: ["Heavy rain", "Silny deszcz"],
  71: ["Light snow", "Lekki śnieg"],
  73: ["Snow", "Śnieg"],
  75: ["Heavy snow", "Intensywny śnieg"],
  80: ["Rain showers", "Przelotny deszcz"],
  81: ["Rain showers", "Przelotny deszcz"],
  82: ["Heavy rain showers", "Silne przelotne opady"],
  95: ["Thunderstorm", "Burza"],
  96: ["Thunderstorm with hail", "Burza z gradem"],
  99: ["Thunderstorm with hail", "Burza z gradem"],
};

const form = document.getElementById("weather-form");
const cityInput = document.getElementById("weather-city");
const langSelect = document.getElementById("weather-language");
const statusEl = document.getElementById("weather-status");
const errorEl = document.getElementById("weather-error");
const resultsEl = document.getElementById("weather-results");

function describeWeather(code, language) {
  return weatherDescriptions[code]?.[language === "pl" ? 1 : 0] || (language === "pl" ? "Warunki pogodowe" : "Weather conditions");
}

function setStatus(message) {
  statusEl.textContent = message;
}

function setError(message) {
  if (!message) {
    errorEl.hidden = true;
    errorEl.textContent = "";
    return;
  }
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function renderCurrent(weather, language) {
  const t = translations[language];
  return `
    <div class="current-weather">
      <div class="current-temperature">
        <span class="weather-symbol" aria-hidden="true">${weather.current.weather_code <= 1 ? "☀️" : weather.current.weather_code < 50 ? "☁️" : "🌧️"}</span>
        <strong>${Math.round(weather.current.temperature_2m)}°C</strong>
        <span>${describeWeather(weather.current.weather_code, language)}</span>
      </div>
      <div class="weather-facts">
        <div><span>${t.feelsLike}</span><strong>${Math.round(weather.current.apparent_temperature)}°C</strong></div>
        <div><span>${t.humidity}</span><strong>${weather.current.relative_humidity_2m}%</strong></div>
        <div><span>${t.wind}</span><strong>${Math.round(weather.current.wind_speed_10m)} km/h</strong></div>
      </div>
    </div>
  `;
}

function renderForecast(weather, language) {
  const t = translations[language];
  return `
    <div class="forecast-days">
      ${weather.daily.time.map((date, index) => `
        <article class="forecast-day" key="${date}">
          <h3>${new Date(`${date}T12:00:00`).toLocaleDateString(language, { weekday: "short", month: "short", day: "numeric" })}</h3>
          <span class="weather-symbol" aria-hidden="true">${weather.daily.weather_code[index] <= 1 ? "☀️" : weather.daily.weather_code[index] < 50 ? "☁️" : "🌧️"}</span>
          <p>${describeWeather(weather.daily.weather_code[index], language)}</p>
          <strong>${Math.round(weather.daily.temperature_2m_max[index])}° / ${Math.round(weather.daily.temperature_2m_min[index])}°</strong>
          <small>${t.rain}: ${weather.daily.precipitation_probability_max[index] ?? 0}%</small>
        </article>
      `).join("")}
    </div>
  `;
}

function renderWeather(weather, language) {
  const t = translations[language];
  resultsEl.innerHTML = `
    <div class="forecast-tabs" role="tablist" aria-label="Forecast range">
      <button type="button" class="active" data-view="current">${t.current}</button>
      <button type="button" data-view="fiveDay">${t.fiveDay}</button>
    </div>
    <h2>${weather.location.name}${weather.location.country ? `, ${weather.location.country}` : ""}</h2>
    <div id="forecast-content">${renderCurrent(weather, language)}</div>
  `;

  const tabButtons = resultsEl.querySelectorAll("button[data-view]");
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.toggle("active", btn === button));
      const view = button.dataset.view;
      const content = document.getElementById("forecast-content");
      content.innerHTML = view === "current" ? renderCurrent(weather, language) : renderForecast(weather, language);
    });
  });

  resultsEl.hidden = false;
}

async function searchWeather(event) {
  event.preventDefault();
  const language = langSelect.value;
  const city = cityInput.value.trim();
  const t = translations[language];

  if (!city) {
    setStatus(language === "pl" ? "Wprowadź nazwę miasta." : "Please enter a city.");
    setError("");
    resultsEl.hidden = true;
    return;
  }

  setStatus(t.loading);
  setError("");

  try {
    const geocodingUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
    geocodingUrl.search = new URLSearchParams({ name: city, count: "1", language, format: "json" }).toString();
    const geocodingResponse = await fetch(geocodingUrl, { signal: AbortSignal.timeout(10000) });
    if (!geocodingResponse.ok) throw new Error();

    const location = (await geocodingResponse.json()).results?.[0];
    if (!location) {
      throw new Error(language === "pl" ? "Nie znaleziono miasta." : "City not found.");
    }

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
    if (!forecastResponse.ok) throw new Error();

    const weather = { location: { name: location.name, country: location.country }, ...(await forecastResponse.json()) };
    renderWeather(weather, language);
    setStatus("");
  } catch (requestError) {
    const message = requestError.message || t.error;
    setError(message);
    setStatus("");
    resultsEl.hidden = true;
  }
}

langSelect.addEventListener("change", () => {
  const language = langSelect.value;
  const t = translations[language];
  cityInput.placeholder = t.city;
  const button = form.querySelector("button[type='submit']");
  button.textContent = t.button;
});

form.addEventListener("submit", searchWeather);
