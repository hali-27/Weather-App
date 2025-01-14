"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

const WeatherCard = ({ date, description, maxTemp, minTemp, windSpeed }) => {
  return (
    <div className="bg-blue-200 p-4 m-2 rounded shadow-md">
      <h3 className="font-bold">{date}</h3>
      <p>{description}</p>
      <p>Max Temp: {maxTemp}°C</p>
      <p>Min Temp: {minTemp}°C</p>
      <p>Wind Speed: {windSpeed} km/h</p>
    </div>
  );
};

const WeatherApp = () => {
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [city, setCity] = useState("London");
  const [debouncedCity, setDebouncedCity] = useState(city);

  // Debounce the city input to avoid frequent API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCity(city);
    }, 500); // Delay of 300ms

    return () => {
      clearTimeout(handler); // Clear timeout on cleanup
    };
  }, [city]);

  const fetchLatLon = async (cityName) => {
    if (!cityName.trim()) {
      return null; // Skip if input is empty
    }

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      cityName
    )}&count=1`;
    const response = await axios.get(geoUrl);
    const results = response.data.results;

    if (!results || results.length === 0) {
      return null; // No results found
    }

    return {
      latitude: results[0].latitude,
      longitude: results[0].longitude,
    };
  };

  const fetchWeatherData = async (cityName) => {
    try {
      setLoading(true);
      setError(null);

      const latLon = await fetchLatLon(cityName);
      if (!latLon) {
        setForecast([]);
        return;
      }

      const { latitude, longitude } = latLon;
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode,windspeed_10m_max&timezone=auto`;
      const response = await axios.get(weatherUrl);
      const data = response.data;

      const dailyForecast = data.daily.time.map((time, index) => ({
        date: new Date(time).toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "short",
        }),
        description: `Weather Code: ${data.daily.weathercode[index]}`,
        maxTemp: data.daily.temperature_2m_max[index],
        minTemp: data.daily.temperature_2m_min[index],
        windSpeed: data.daily.windspeed_10m_max[index],
      }));

      setForecast(dailyForecast);
    } catch (err) {
      setError("Failed to fetch weather data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData(debouncedCity);
  }, [debouncedCity]);

  const handleCityChange = (e) => {
    setCity(e.target.value);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Weather Forecast</h1>
      <div className="mb-4 text-center">
        <input
          type="text"
          value={city}
          onChange={handleCityChange}
          placeholder="Enter city name"
          className="p-2 border border-gray-300 rounded"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {forecast.map((day, index) => (
          <WeatherCard
            key={index}
            date={day.date}
            description={day.description}
            maxTemp={day.maxTemp}
            minTemp={day.minTemp}
            windSpeed={day.windSpeed}
          />
        ))}
      </div>
    </div>
  );
};

export default WeatherApp;
