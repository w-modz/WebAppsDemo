class WeatherApp {
    constructor() {
        this.apiKey = '7ded80d91f2b280ec979100cc8bbba94';
        this.currentLanguage = 'pl';
        this.currentForecastType = 'current';
        this.currentCoordinates = null;
        this.addressInput = document.getElementById('addressInput');
        this.weatherBtn = document.getElementById('weatherBtn');
        this.weatherDisplay = document.getElementById('weatherDisplay');
        this.languageSelector = document.getElementById('languageSelector');
        this.forecastSwitcher = document.getElementById('forecastSwitcher');
        this.currentBtn = document.getElementById('currentBtn');
        this.fiveDayBtn = document.getElementById('fiveDayBtn');

        this.translations = {
            pl: {
                title: 'Prognoza Pogody',
                placeholder: 'Wprowadź adres (np. Warszawa, Polska)',
                button: 'Pogoda',
                current: 'Aktualnie',
                fiveDay: 'Prognoza 5-dniowa',
                loading: 'Pobieranie danych pogodowych...',
                pleaseWait: 'Proszę czekać',
                enterAddress: 'Proszę wprowadzić adres.',
                humidity: 'Wilgotność',
                wind: 'Wiatr',
                locationNotFound: 'Nie znaleziono lokalizacji dla podanego adresu.',
                coordinatesError: 'Nie udało się pobrać współrzędnych dla podanego adresu.',
                weatherError: 'Wystąpił błąd podczas pobierania danych pogodowych.',
                emptyMessage: 'Wprowadź adres i kliknij "Pogoda", aby zobaczyć prognozę'
            },
            en: {
                title: 'Weather Forecast',
                placeholder: 'Enter address (e.g. Warsaw, Poland)',
                button: 'Weather',
                current: 'Current',
                fiveDay: '5-Day Forecast',
                loading: 'Loading weather data...',
                pleaseWait: 'Please wait',
                enterAddress: 'Please enter an address.',
                humidity: 'Humidity',
                wind: 'Wind',
                locationNotFound: 'Location not found for the given address.',
                coordinatesError: 'Failed to get coordinates for the given address.',
                weatherError: 'An error occurred while fetching weather data.',
                emptyMessage: 'Enter an address and click "Weather" to see the forecast'
            }
        };

        this.initEventListeners();
        this.updateLanguage();
    }

    initEventListeners() {
        this.weatherBtn.addEventListener('click', () => {
            this.getWeather();
        });

        this.addressInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.getWeather();
            }
        });

        this.languageSelector.addEventListener('change', (e) => {
            this.currentLanguage = e.target.value;
            this.updateLanguage();
        });

        this.currentBtn.addEventListener('click', () => {
            this.switchForecast('current');
        });

        this.fiveDayBtn.addEventListener('click', () => {
            this.switchForecast('fiveDay');
        });
    }

    updateLanguage() {
        const t = this.translations[this.currentLanguage];

        document.querySelector('h1').textContent = t.title;
        this.addressInput.placeholder = t.placeholder;
        this.weatherBtn.textContent = t.button;
        this.currentBtn.textContent = t.current;
        this.fiveDayBtn.textContent = t.fiveDay;
        document.title = t.title;

        if (this.weatherDisplay.innerHTML.trim() === '' ||
            this.weatherDisplay.textContent.includes('Wprowadź adres') ||
            this.weatherDisplay.textContent.includes('Enter an address')) {
            this.showEmptyMessage();
        }
    }

    showEmptyMessage() {
        const t = this.translations[this.currentLanguage];
        this.weatherDisplay.innerHTML = `
            <div style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.7); font-style: italic;">
                ${t.emptyMessage}
            </div>
        `;
    }

    async getWeather() {
        const address = this.addressInput.value.trim();
        const t = this.translations[this.currentLanguage];

        if (!address) {
            this.displayError(t.enterAddress);
            return;
        }

        this.displayLoading();

        try {
            const coordinates = await this.getCoordinates(address);

            if (coordinates) {
                this.currentCoordinates = coordinates;
                this.forecastSwitcher.style.display = 'flex';

                if (this.currentForecastType === 'current') {
                    const weatherData = await this.getWeatherData(coordinates);
                    if (weatherData) {
                        this.displayWeather(weatherData);
                    }
                } else {
                    const forecastData = await this.getFiveDayForecast(coordinates);
                    if (forecastData) {
                        this.displayFiveDayForecast(forecastData);
                    }
                }
            }

        } catch (error) {
            console.error('Weather fetch error:', error);
            this.displayError(t.weatherError);
        }
    }

    async getCoordinates(address) {
        try {
            const geocodingUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(address)}&limit=1&appid=${this.apiKey}`;
            const response = await fetch(geocodingUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.length === 0) {
                const t = this.translations[this.currentLanguage];
                this.displayError(t.locationNotFound);
                return null;
            }

            return {
                lat: data[0].lat,
                lon: data[0].lon,
                name: data[0].name,
                country: data[0].country
            };

        } catch (error) {
            console.error('Coordinates fetch error:', error);
            const t = this.translations[this.currentLanguage];
            this.displayError(t.coordinatesError);
            return null;
        }
    }

    getWeatherData(coordinates) {
        return new Promise((resolve, reject) => {
            const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${this.apiKey}&units=metric&lang=${this.currentLanguage}`;
            const xhr = new XMLHttpRequest();
            xhr.open('GET', weatherUrl, true);
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        const weatherData = {
                            location: `${coordinates.name}, ${coordinates.country}`,
                            temperature: `${Math.round(data.main.temp)}°C`,
                            description: this.capitalizeFirstLetter(data.weather[0].description),
                            humidity: `${data.main.humidity}%`,
                            wind: `${Math.round(data.wind.speed * 3.6)} km/h`,
                            windDirection: this.getWindDirectionWithDegrees(data.wind.deg),
                            iconUrl: `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
                        };

                        resolve(weatherData);
                    } catch (error) {
                        console.error('JSON parsing error:', error);
                        reject(error);
                    }
                } else {
                    console.error('HTTP error:', xhr.status);
                    reject(new Error(`HTTP error! status: ${xhr.status}`));
                }
            };

            xhr.onerror = () => {
                console.error('Network error');
                reject(new Error('Network error'));
            };

            xhr.send();
        });
    }

    async switchForecast(type) {
        if (!this.currentCoordinates) return;

        this.currentForecastType = type;
        this.currentBtn.classList.toggle('active', type === 'current');
        this.fiveDayBtn.classList.toggle('active', type === 'fiveDay');

        this.displayLoading();

        try {
            if (type === 'current') {
                const weatherData = await this.getWeatherData(this.currentCoordinates);
                if (weatherData) {
                    this.displayWeather(weatherData);
                }
            } else {
                const forecastData = await this.getFiveDayForecast(this.currentCoordinates);
                if (forecastData) {
                    this.displayFiveDayForecast(forecastData);
                }
            }
        } catch (error) {
            console.error('Forecast switch error:', error);
            const t = this.translations[this.currentLanguage];
            this.displayError(t.weatherError);
        }
    }

    async getFiveDayForecast(coordinates) {
        try {
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${this.apiKey}&units=metric&lang=${this.currentLanguage}`;
            const response = await fetch(forecastUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            return {
                location: `${coordinates.name}, ${coordinates.country}`,
                forecasts: data.list.filter((_, index) => index % 8 === 0).slice(0, 5)
            };

        } catch (error) {
            console.error('5-day forecast fetch error:', error);
            const t = this.translations[this.currentLanguage];
            this.displayError(t.weatherError);
            return null;
        }
    }

    displayFiveDayForecast(forecastData) {
        const forecastItems = forecastData.forecasts.map(forecast => {
            const date = new Date(forecast.dt * 1000);
            const dayName = date.toLocaleDateString(this.currentLanguage === 'pl' ? 'pl-PL' : 'en-US', { weekday: 'short' });

            return `
                <div style="text-align: center; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 10px; min-width: 120px; flex: 1;">
                    <div style="font-weight: bold; margin-bottom: 10px; font-size: 14px;">${dayName}</div>
                    <img src="http://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png" alt="${forecast.weather[0].description}" style="width: 40px; height: 40px;">
                    <div style="font-size: 16px; font-weight: bold; margin: 8px 0;">${Math.round(forecast.main.temp)}°C</div>
                    <div style="font-size: 12px; opacity: 0.8; margin-bottom: 5px;">${this.capitalizeFirstLetter(forecast.weather[0].description)}</div>
                    <div style="font-size: 10px; opacity: 0.6;">
                        ${this.translations[this.currentLanguage].humidity}: ${forecast.main.humidity}%<br>
                        ${this.translations[this.currentLanguage].wind}: ${Math.round(forecast.wind.speed * 3.6)} km/h
                    </div>
                </div>
            `;
        }).join('');

        this.weatherDisplay.innerHTML = `
            <div style="text-align: center;">
                <h2 style="margin: 0 0 20px 0; color: #fff;">${forecastData.location}</h2>
                <div style="display: flex; gap: 10px; margin-top: 20px; overflow-x: auto; padding: 0 10px;">
                    ${forecastItems}
                </div>
            </div>
        `;
    }

    getWindDirection(degrees) {
        if (degrees === undefined || degrees === null) {
            return 'N/A';
        }

        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    }

    getWindDirectionWithDegrees(degrees) {
        if (degrees === undefined || degrees === null) {
            return 'N/A';
        }

        const direction = this.getWindDirection(degrees);
        return `${direction} (${Math.round(degrees)}°)`;
    }

    capitalizeFirstLetter(string) {
        if (!string) return string;
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    displayLoading() {
        const t = this.translations[this.currentLanguage];
        this.weatherDisplay.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 18px;">${t.loading}</div>
                <div style="margin-top: 10px; opacity: 0.7;">${t.pleaseWait}</div>
            </div>
        `;
    }

    displayWeather(weatherData) {
        this.weatherDisplay.innerHTML = `
            <div style="text-align: center;">
                <h2 style="margin: 0 0 20px 0; color: #fff;">${weatherData.location}</h2>
                <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin: 20px 0;">
                    <img src="${weatherData.iconUrl}" alt="${weatherData.description}" style="width: 80px; height: 80px;">
                    <div style="text-align: left;">
                        <div style="font-size: 48px; font-weight: bold; margin: 0;">${weatherData.temperature}</div>
                        <div style="font-size: 20px; margin: 5px 0; opacity: 0.9;">${weatherData.description}</div>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-around; margin-top: 30px; flex-wrap: wrap;">
                    <div style="text-align: center; margin: 10px;">
                        <div style="opacity: 0.7;">${this.translations[this.currentLanguage].humidity}</div>
                        <div style="font-size: 18px; font-weight: bold;">${weatherData.humidity}</div>
                    </div>
                    <div style="text-align: center; margin: 10px;">
                        <div style="opacity: 0.7;">${this.translations[this.currentLanguage].wind}</div>
                        <div style="font-size: 18px; font-weight: bold;">${weatherData.wind}</div>
                        <div style="font-size: 14px; opacity: 0.8;">${weatherData.windDirection}</div>
                    </div>
                </div>
            </div>
        `;
    }

    displayError(message) {
        this.weatherDisplay.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ff7675;">
                <div style="font-size: 18px;">⚠️ ${message}</div>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});
