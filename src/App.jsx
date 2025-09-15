import { useState, useCallback } from "react";
import axios from "axios";
import {
  Search,
  MapPin,
  Wind,
  Droplets,
  Eye,
  Thermometer,
  X,
} from "lucide-react";

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
        // Parallel weather + forecast fetch
        const [weatherRes, forecastRes] = await Promise.all([
          api.get("/data/2.5/weather", { params: { q: city } }),
          api.get("/data/2.5/forecast", { params: { q: city } }),
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

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="bg-white/70 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Weather App
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Search for a city..."
              onKeyDown={(e) => e.key === "Enter" && fetchWeather(e)}
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm hover:shadow-md"
            />
            <button
              onClick={fetchWeather}
              disabled={loading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-xl font-medium transition-colors"
            >
              {loading ? "Loading..." : "Search"}
            </button>
          </div>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-center">
            {error}
          </div>
        )}

        {/* Current Weather */}
        {weatherData && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
                <MapPin className="w-4 h-4" />
                <span className="text-lg">
                  {weatherData.name}, {weatherData.sys.country}
                </span>
              </div>

              <div className="text-6xl mb-4">
                <img
                  src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@4x.png`}
                  alt={weatherData.weather[0].description}
                  className="mx-auto w-24 h-24 mb-4"
                />
              </div>

              <div className="text-5xl font-light text-gray-800 mb-2">
                {Math.round(weatherData.main.temp)} °C
              </div>

              <div className="text-gray-600 capitalize text-lg mb-6">
                {weatherData.weather[0].description}
              </div>

              {/* Weather Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3">
                  <Thermometer className="w-5 h-5 text-orange-500 mx-auto mb-2" />
                  <div className="text-sm text-gray-500">Feels like</div>
                  <div className="font-semibold">
                    {Math.round(weatherData.main.feels_like)} °C
                  </div>
                </div>

                <div className="text-center p-3">
                  <Wind className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                  <div className="text-sm text-gray-500">Wind</div>
                  <div className="font-semibold">
                    {weatherData.wind.speed} m/s
                  </div>
                </div>

                <div className="text-center p-3">
                  <Droplets className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-500">Humidity</div>
                  <div className="font-semibold">
                    {weatherData.main.humidity}%
                  </div>
                </div>

                <div className="text-center p-3">
                  <Eye className="w-5 h-5 text-gray-500 mx-auto mb-2" />
                  <div className="text-sm text-gray-500">Visibility</div>
                  <div className="font-semibold">
                    {(weatherData.visibility / 1000).toFixed(1)} km
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Today's Forecast */}
        {forecast[0] &&
          forecast[0].entries &&
          forecast[0].entries.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Today's Forecast
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {forecast[0].entries.map((entry) => (
                  <div
                    key={entry.dt}
                    className="text-center p-4 rounded-2xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
                  >
                    <div className="text-sm text-gray-600 mb-2">
                      {new Date(entry.dt_txt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>

                    <div className="text-2xl mb-2">
                      <img
                        src={`https://openweathermap.org/img/wn/${entry.weather[0].icon}@2x.png`}
                        alt={entry.weather[0].description}
                        className="mx-auto w-12 h-12 mb-2"
                      />
                    </div>

                    <div className="text-xl font-semibold text-gray-800 mb-1">
                      {Math.round(entry.main.temp)}°
                    </div>

                    <div className="text-xs text-gray-500 capitalize">
                      {entry.weather[0].description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* 4-Day Forecast */}
        {forecast.length > 1 && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              4-Day Forecast
            </h3>
            <div className="space-y-3">
              {forecast.slice(1).map((day) => (
                <div
                  key={day.date}
                  onClick={() => day.entries?.length > 0 && setSelectedDay(day)}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${
                    day.entries?.length > 0
                      ? "hover:bg-gray-50 cursor-pointer"
                      : "opacity-75"
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">
                      {formatDate(day.date)}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold text-gray-800">
                        {day.max}°C / {day.min}°C
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Day Modal */}
        {selectedDay && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  Details for {formatDate(selectedDay.date)}
                </h3>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedDay.entries.map((entry) => (
                    <div key={entry.dt} className="p-4 rounded-2xl bg-gray-50">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          {new Date(entry.dt_txt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>

                        <div className="text-2xl mb-2">
                          <img
                            src={`https://openweathermap.org/img/wn/${entry.weather[0].icon}@2x.png`}
                            alt={entry.weather[0].description}
                            className="mx-auto w-12 h-12 mb-2"
                          />
                        </div>

                        <div className="text-xl font-semibold text-gray-800 mb-3">
                          {Math.round(entry.main.temp)}°
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Condition</span>
                            <span className="capitalize">
                              {entry.weather[0].description}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Wind</span>
                            <span>{entry.wind.speed} m/s</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Humidity</span>
                            <span>{entry.main.humidity}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
