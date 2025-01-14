
'use client'

import React, { useState, useEffect } from "react";
import axios from "axios";

const WeatherCard = ({ date, weather, maxTemp, minTemp, windSpeed }) => {
  return (
    <div className="bg-blue-200 p-4 m-2 rounded shadow-md">
      <h3 className="font-bold">{date}</h3>
      <img
        src={`/icons/${weather.icon}.png`}
        alt={weather.description}
        className="w-16 h-16 mx-auto"
      />
      <p>{weather.description}</p>
      <p>Max Temp: {maxTemp}°C</p>
      <p>Min Temp: {minTemp}°C</p>
      <p>Wind Speed: {windSpeed} km/h</p>
    </div>
  );
};

const WeatherApp = () => {
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        const response = await axios.get(
          "https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&daily=temperature_2m_max,temperature_2m_min,weathercode,windspeed_10m_max&timezone=auto"
        );

        const data = response.data;
        const dailyForecast = data.daily.time.map((time, index) => {
          return {
            date: new Date(time).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "short",
            }),
            weather: {
              icon: data.daily.weathercode[index], // Replace with appropriate mapping
              description: "Weather description here", // Replace with actual description if available
            },
            maxTemp: data.daily.temperature_2m_max[index],
            minTemp: data.daily.temperature_2m_min[index],
            windSpeed: data.daily.windspeed_10m_max[index],
          };
        });

        setForecast(dailyForecast);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch weather data. Please try again later.");
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Weather Forecast</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {forecast.map((day, index) => (
          <WeatherCard
            key={index}
            date={day.date}
            weather={day.weather}
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
