import React, { useState } from "react";

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

function describeWeather(code, language) {
  return weatherDescriptions[code]?.[language === "pl" ? 1 : 0] || (language === "pl" ? "Warunki pogodowe" : "Weather conditions");
}

export default function WeatherPage() {
  const [language, setLanguage] = useState("en");
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecastType, setForecastType] = useState("current");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const t = translations[language];

  async function searchWeather(event) {
    event.preventDefault();
    if (!city.trim()) {
      setError(language === "pl" ? "Wprowadź nazwę miasta." : "Please enter a city.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const params = new URLSearchParams({ city: city.trim(), language });
      const response = await fetch(`/api/weather?${params}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || t.error);
      setWeather(result);
      setStatus("ready");
    } catch (requestError) {
      setError(requestError.message || t.error);
      setStatus("error");
    }
  }

  return (
    <main className="project-page weather-page">
      <section className="weather-app">
        <header className="weather-header">
          <p className="eyebrow">Project C · Powered by Open-Meteo</p>
          <h1>{t.title}</h1>
        </header>
        <div className="weather-language">
          <label htmlFor="weather-language">Language</label>
          <select id="weather-language" value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="en">English</option>
            <option value="pl">Polski</option>
          </select>
        </div>
        <form className="weather-search" onSubmit={searchWeather}>
          <label className="sr-only" htmlFor="weather-city">{t.city}</label>
          <input id="weather-city" value={city} onChange={(event) => setCity(event.target.value)} placeholder={t.city} maxLength={120} />
          <button type="submit" disabled={status === "loading"}>{t.button}</button>
        </form>
        {status === "loading" && <p className="weather-message" role="status">{t.loading}</p>}
        {status === "error" && <p className="app-error" role="alert">{error}</p>}
        {status === "idle" && <p className="weather-message">{t.empty}</p>}
        {weather && status === "ready" && (
          <section className="weather-results" aria-live="polite">
            <div className="forecast-tabs" role="tablist" aria-label="Forecast range">
              <button type="button" role="tab" aria-selected={forecastType === "current"} className={forecastType === "current" ? "active" : ""} onClick={() => setForecastType("current")}>{t.current}</button>
              <button type="button" role="tab" aria-selected={forecastType === "fiveDay"} className={forecastType === "fiveDay" ? "active" : ""} onClick={() => setForecastType("fiveDay")}>{t.fiveDay}</button>
            </div>
            <h2>{weather.location.name}{weather.location.country ? `, ${weather.location.country}` : ""}</h2>
            {forecastType === "current" ? (
              <div className="current-weather">
                <div className="current-temperature">
                  <span className="weather-symbol" aria-hidden="true">{weather.current.weather_code <= 1 ? "☀️" : weather.current.weather_code < 50 ? "☁️" : weather.current.weather_code < 70 ? "🌧️" : weather.current.weather_code < 80 ? "❄️" : "⛈️"}</span>
                  <strong>{Math.round(weather.current.temperature_2m)}°C</strong>
                  <span>{describeWeather(weather.current.weather_code, language)}</span>
                </div>
                <div className="weather-facts">
                  <div><span>{t.feelsLike}</span><strong>{Math.round(weather.current.apparent_temperature)}°C</strong></div>
                  <div><span>{t.humidity}</span><strong>{weather.current.relative_humidity_2m}%</strong></div>
                  <div><span>{t.wind}</span><strong>{Math.round(weather.current.wind_speed_10m)} km/h</strong></div>
                </div>
              </div>
            ) : (
              <div className="forecast-days">
                {weather.daily.time.map((date, index) => (
                  <article className="forecast-day" key={date}>
                    <h3>{new Date(`${date}T12:00:00`).toLocaleDateString(language, { weekday: "short", month: "short", day: "numeric" })}</h3>
                    <span className="weather-symbol" aria-hidden="true">{weather.daily.weather_code[index] <= 1 ? "☀️" : weather.daily.weather_code[index] < 50 ? "☁️" : weather.daily.weather_code[index] < 70 ? "🌧️" : weather.daily.weather_code[index] < 80 ? "❄️" : "⛈️"}</span>
                    <p>{describeWeather(weather.daily.weather_code[index], language)}</p>
                    <strong>{Math.round(weather.daily.temperature_2m_max[index])}° / {Math.round(weather.daily.temperature_2m_min[index])}°</strong>
                    <small>{t.rain}: {weather.daily.precipitation_probability_max[index] ?? 0}%</small>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
