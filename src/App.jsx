import { useState, useCallback } from "react";
import axios from "axios";
import "./App.css";

// Preconfigured axios instance
const api = axios.create({
  baseURL: "https://api.openweathermap.org",
  params: {
    appid: import.meta.env.VITE_WEATHER_API_KEY,
    units: "metric",
  },
});

function App() {
  const [city, setCity] = useState("");
  const [weatherData, setWeatherData] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState(null);

  const fetchWeather = useCallback(
    async (e) => {
      e.preventDefault();

      if (!city.trim()) {
        setError("Please enter a city name");
        return;
      }

      setLoading(true);
      setError("");
      setWeatherData(null);
      setForecast([]);

      try {
        // Get coordinates
        const geoRes = await api.get("/geo/1.0/direct", {
          params: { q: city },
        });
        if (geoRes.data.length === 0) {
          setError(`${city} not found`);
          setLoading(false);
          return;
        }

        const { lat, lon } = geoRes.data[0];

        // Parallel weather + forecast fetch
        const [weatherRes, forecastRes] = await Promise.all([
          api.get("/data/2.5/weather", { params: { lat, lon } }),
          api.get("/data/2.5/forecast", { params: { lat, lon } }),
        ]);

        // Group forecast by date
        const grouped = forecastRes.data.list.reduce((acc, entry) => {
          const date = entry.dt_txt.split(" ")[0];
          acc[date] = acc[date] || [];
          acc[date].push(entry);
          return acc;
        }, {});

        const dailyForecast = Object.entries(grouped)
          .slice(0, 5)
          .map(([date, entries]) => {
            const temps = entries.map((e) => e.main.temp);
            return {
              date,
              min: Math.min(...temps),
              max: Math.max(...temps),
              entries,
            };
          });

        setWeatherData(weatherRes.data);
        setForecast(dailyForecast);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch weather data. Try again later.");
      } finally {
        setLoading(false);
      }
    },
    [city]
  );

  return (
    <section
      id="weather-app"
      className="min-h-screen flex flex-col justify-center items-center p-6"
    >
      <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">
        Weather App
      </h1>

      <form
        onSubmit={fetchWeather}
        className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-md"
      >
        <input
          type="text"
          aria-label="City name"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter city name..."
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          aria-label="Search weather"
          className={`px-6 py-2 font-semibold rounded-lg shadow transition-all
            ${
              loading
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
        >
          {loading ? "Loading..." : "Search"}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-red-600 font-medium text-center">{error}</p>
      )}

      {weatherData && (
        <div className="mt-6 bg-white rounded-xl shadow-lg p-5 text-center">
          <h2 className="text-2xl font-bold text-gray-800">{`${weatherData.name}, ${weatherData.sys.country}`}</h2>
          <p className="text-lg text-gray-600 mt-2">
            Temperature: {weatherData.main.temp}°C
          </p>
          <p className="text-lg text-gray-600 capitalize">
            Condition: {weatherData.weather[0].description}
          </p>
          <p className="text-lg text-gray-600">
            Wind Speed: {weatherData.wind.speed} m/s
          </p>
          <p className="text-lg text-gray-600">
            Humidity: {weatherData.main.humidity}%
          </p>
        </div>
      )}

      {forecast.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
            5-Day Forecast
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {forecast.map((day) => (
              <div
                key={day.date}
                onClick={() => setSelectedDay(day)}
                className="bg-white rounded-xl shadow-md p-4 text-center hover:shadow-lg transition cursor-pointer"
              >
                <p className="font-semibold text-gray-700">
                  {new Date(day.date).toLocaleDateString("en-IN")}
                </p>
                <p className="text-gray-600 mt-2">
                  {console.log(day)}
                  Min: {day.min}°C | Max: {day.max}°C
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Day Details */}
      {selectedDay && (
        <div className="mt-8 w-full max-w-3xl bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
            Details for {new Date(selectedDay.date).toLocaleDateString("en-IN")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {selectedDay.entries.map((entry) => (
              <div
                key={entry.dt}
                className="bg-gray-50 rounded-lg p-3 shadow-sm text-center"
              >
                <p className="font-semibold text-gray-700">
                  {new Date(entry.dt_txt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-gray-600 mt-1">Temp: {entry.main.temp}°C</p>
                <p className="capitalize text-gray-600">
                  {entry.weather[0].description}
                </p>
                <p className="text-gray-600">Wind: {entry.wind.speed} m/s</p>
                <p className="text-gray-600">
                  Humidity: {entry.main.humidity}%
                </p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setSelectedDay(null)}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Close
          </button>
        </div>
      )}
    </section>
  );
}

export default App;
