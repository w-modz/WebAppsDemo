<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Static weather app demo." />
    <title>Weather App | WebApps Demo</title>
    <link rel="stylesheet" href="../styles.css" />
  </head>
  <body>
    <nav class="site-nav" aria-label="Main navigation">
      <a class="brand" href="../index.html">WebApps Demo</a>
      <div class="nav-links">
        <a href="./todo.html">Todo App</a>
        <a href="./puzzle.html">Map Puzzle</a>
        <a href="./weather.html">Weather App</a>
      </div>
    </nav>

    <main class="project-page">
      <section class="weather-app">
        <header class="weather-header">
          <p class="eyebrow">Project C · Powered by Open-Meteo</p>
          <h1>Weather Forecast</h1>
        </header>

        <div class="weather-language">
          <label for="weather-language">Language</label>
          <select id="weather-language">
            <option value="en">English</option>
            <option value="pl">Polski</option>
          </select>
        </div>

        <form id="weather-form" class="weather-search">
          <label class="sr-only" for="weather-city">Enter city</label>
          <input id="weather-city" type="text" placeholder="Enter city (e.g. Warsaw, Poland)" maxlength="120" />
          <button type="submit">Weather</button>
        </form>

        <p id="weather-status" class="weather-message">Enter a city to see the forecast.</p>
        <p id="weather-error" class="app-error" role="alert" hidden></p>

        <div id="weather-results" class="weather-results" hidden></div>
      </section>
    </main>

    <script src="./weather.js"></script>
  </body>
</html>
