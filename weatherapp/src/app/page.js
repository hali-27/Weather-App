"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
// import { weatherCodeMap } from "./weatherCodes";  // Import the weather code map

const WeatherCard = ({
  date,
  description,
  maxTemp,
  minTemp,
  windSpeed,
  icon,
}) => {
  return (
    <div className="bg-blue-200 p-4 m-2 rounded shadow-md">
      <h3 className="font-bold">{date}</h3>
      <p>{description}</p>
      <img src={icon} alt={description} className="w-12 h-12 mx-auto" />
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
  const [bgImage, setBgImage] = useState("./sunny.jpg");


  // Debounce the city input to avoid frequent API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCity(city);
    }, 2500); // Delay of 2500ms

    return () => {
      clearTimeout(handler); // Cleanup timeout
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

      const dailyForecast = data.daily.time.map((time, index) => {
        const weatherCode = data.daily.weathercode[index];
        const isDay = new Date(time).getHours() < 18; // Assume day if hour < 18
        const weather = weatherCodeMap[weatherCode];

        return {
          date: new Date(time).toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "short",
          }),
          description: weather
            ? isDay
              ? weather.day.description
              : weather.night.description
            : "Unknown",
          icon: weather
            ? isDay
              ? weather.day.image
              : weather.night.image
            : "http://openweathermap.org/img/wn/01d@2x.png", // Default icon if not found
          maxTemp: data.daily.temperature_2m_max[index],
          minTemp: data.daily.temperature_2m_min[index],
          windSpeed: data.daily.windspeed_10m_max[index],

           // CHANGED: store the numeric weather code
           weatherCode: weatherCode,
        };
      });

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



  useEffect(() => {
    // Ensure forecast exists and has at least one entry
    if (forecast.length === 0) {
      setBgImage("/sunny.jpg"); // fallback to sunny if no forecast
      return;
    }
  
    // Get the weather code for the first day
    const mainCode = forecast[0].weatherCode;
  
    // Decide background image based on weather code
    if (mainCode === 0) {
      setBgImage("/sunny.jpg");
    } else if ([1, 2, 3].includes(mainCode)) {
      setBgImage("/cloudy.jpg");
    } else if ([45, 48].includes(mainCode)) {
      setBgImage("/cloudy.jpg"); // or fog.jpg
    } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(mainCode)) {
      setBgImage("/rainy.jpg");
    } else if ([71, 73, 75, 77, 85, 86].includes(mainCode)) {
      setBgImage("/snowy.jpg");
    } else if ([95, 96, 99].includes(mainCode)) {
      setBgImage("/rainy.jpg"); // or stormy.jpg
    } else {
      setBgImage("/sunny.jpg"); // Default fallback
    }
  }, [forecast]); // Watch `forecast` array for changes
  
  
  const handleCityChange = (e) => {
    e.preventDefault(); // Prevent the form from refreshing the page
    setCity(e.target.city.value); // Update the city with the value from the input field
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (

    <div
      style={{
        minHeight: "100vh",
        background: `url(${bgImage}) center center / cover no-repeat`,
      }}
    >  
           
           <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Weather Forecast</h1>
	  <p className="text-xl text-center mb-4">Enter a city in the box below:</p>

	  <div className="mb-4 text-center">
	      <input
	        type="text"
	        name="city"  // Add a name attribute to the input so we can reference it in the handler
	        value={city}
	        onChange={(e) => setCity(e.target.value)}  // Update city as the user types
	        placeholder="Enter city name"
	        className="p-2 border border-gray-900 rounded"
	      />
		  <button className="ms-2 p-2 border border-gray-300 rounded bg-white hover:bg-gray-100">
  🔍
</button>

 </div>

      <h2 className="text-xl font-bold text-center mb-4">Location: {city || "_______"}</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {forecast.map((day, index) => (
            <WeatherCard
              key={index}
              date={day.date}
              description={day.description}
              maxTemp={day.maxTemp}
              minTemp={day.minTemp}
              windSpeed={day.windSpeed}
              icon={day.icon}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeatherApp;

// Weather code map

export const weatherCodeMap = {
  0: {
    day: {
      description: "Sunny",
      image: "http://openweathermap.org/img/wn/01d@2x.png",
    },
    night: {
      description: "Clear",
      image: "http://openweathermap.org/img/wn/01n@2x.png",
    },
  },
  1: {
    day: {
      description: "Mainly Sunny",
      image: "http://openweathermap.org/img/wn/01d@2x.png",
    },
    night: {
      description: "Mainly Clear",
      image: "http://openweathermap.org/img/wn/01n@2x.png",
    },
  },
  2: {
    day: {
      description: "Partly Cloudy",
      image: "http://openweathermap.org/img/wn/02d@2x.png",
    },
    night: {
      description: "Partly Cloudy",
      image: "http://openweathermap.org/img/wn/02n@2x.png",
    },
  },
  3: {
    day: {
      description: "Cloudy",
      image: "http://openweathermap.org/img/wn/03d@2x.png",
    },
    night: {
      description: "Cloudy",
      image: "http://openweathermap.org/img/wn/03n@2x.png",
    },
  },
  45: {
    day: {
      description: "Foggy",
      image: "http://openweathermap.org/img/wn/50d@2x.png",
    },
    night: {
      description: "Foggy",
      image: "http://openweathermap.org/img/wn/50n@2x.png",
    },
  },
  48: {
    day: {
      description: "Rime Fog",
      image: "http://openweathermap.org/img/wn/50d@2x.png",
    },
    night: {
      description: "Rime Fog",
      image: "http://openweathermap.org/img/wn/50n@2x.png",
    },
  },
  51: {
    day: {
      description: "Light Drizzle",
      image: "http://openweathermap.org/img/wn/09d@2x.png",
    },
    night: {
      description: "Light Drizzle",
      image: "http://openweathermap.org/img/wn/09n@2x.png",
    },
  },
  53: {
    day: {
      description: "Drizzle",
      image: "http://openweathermap.org/img/wn/09d@2x.png",
    },
    night: {
      description: "Drizzle",
      image: "http://openweathermap.org/img/wn/09n@2x.png",
    },
  },
  55: {
    day: {
      description: "Heavy Drizzle",
      image: "http://openweathermap.org/img/wn/09d@2x.png",
    },
    night: {
      description: "Heavy Drizzle",
      image: "http://openweathermap.org/img/wn/09n@2x.png",
    },
  },
  56: {
    day: {
      description: "Light Freezing Drizzle",
      image: "http://openweathermap.org/img/wn/09d@2x.png",
    },
    night: {
      description: "Light Freezing Drizzle",
      image: "http://openweathermap.org/img/wn/09n@2x.png",
    },
  },
  57: {
    day: {
      description: "Freezing Drizzle",
      image: "http://openweathermap.org/img/wn/09d@2x.png",
    },
    night: {
      description: "Freezing Drizzle",
      image: "http://openweathermap.org/img/wn/09n@2x.png",
    },
  },
  61: {
    day: {
      description: "Light Rain",
      image: "http://openweathermap.org/img/wn/10d@2x.png",
    },
    night: {
      description: "Light Rain",
      image: "http://openweathermap.org/img/wn/10n@2x.png",
    },
  },
  63: {
    day: {
      description: "Rain",
      image: "http://openweathermap.org/img/wn/10d@2x.png",
    },
    night: {
      description: "Rain",
      image: "http://openweathermap.org/img/wn/10n@2x.png",
    },
  },
  65: {
    day: {
      description: "Heavy Rain",
      image: "http://openweathermap.org/img/wn/10d@2x.png",
    },
    night: {
      description: "Heavy Rain",
      image: "http://openweathermap.org/img/wn/10n@2x.png",
    },
  },
  66: {
    day: {
      description: "Light Freezing Rain",
      image: "http://openweathermap.org/img/wn/10d@2x.png",
    },
    night: {
      description: "Light Freezing Rain",
      image: "http://openweathermap.org/img/wn/10n@2x.png",
    },
  },
  67: {
    day: {
      description: "Freezing Rain",
      image: "http://openweathermap.org/img/wn/10d@2x.png",
    },
    night: {
      description: "Freezing Rain",
      image: "http://openweathermap.org/img/wn/10n@2x.png",
    },
  },
  71: {
    day: {
      description: "Light Snow",
      image: "http://openweathermap.org/img/wn/13d@2x.png",
    },
    night: {
      description: "Light Snow",
      image: "http://openweathermap.org/img/wn/13n@2x.png",
    },
  },
  73: {
    day: {
      description: "Snow",
      image: "http://openweathermap.org/img/wn/13d@2x.png",
    },
    night: {
      description: "Snow",
      image: "http://openweathermap.org/img/wn/13n@2x.png",
    },
  },
  75: {
    day: {
      description: "Heavy Snow",
      image: "http://openweathermap.org/img/wn/13d@2x.png",
    },
    night: {
      description: "Heavy Snow",
      image: "http://openweathermap.org/img/wn/13n@2x.png",
    },
  },
  77: {
    day: {
      description: "Snow Grains",
      image: "http://openweathermap.org/img/wn/13d@2x.png",
    },
    night: {
      description: "Snow Grains",
      image: "http://openweathermap.org/img/wn/13n@2x.png",
    },
  },
  80: {
    day: {
      description: "Light Showers",
      image: "http://openweathermap.org/img/wn/09d@2x.png",
    },
    night: {
      description: "Light Showers",
      image: "http://openweathermap.org/img/wn/09n@2x.png",
    },
  },
  81: {
    day: {
      description: "Showers",
      image: "http://openweathermap.org/img/wn/09d@2x.png",
    },
    night: {
      description: "Showers",
      image: "http://openweathermap.org/img/wn/09n@2x.png",
    },
  },
  82: {
    day: {
      description: "Heavy Showers",
      image: "http://openweathermap.org/img/wn/09d@2x.png",
    },
    night: {
      description: "Heavy Showers",
      image: "http://openweathermap.org/img/wn/09n@2x.png",
    },
  },
  85: {
    day: {
      description: "Light Snow Showers",
      image: "http://openweathermap.org/img/wn/13d@2x.png",
    },
    night: {
      description: "Light Snow Showers",
      image: "http://openweathermap.org/img/wn/13n@2x.png",
    },
  },
  86: {
    day: {
      description: "Snow Showers",
      image: "http://openweathermap.org/img/wn/13d@2x.png",
    },
    night: {
      description: "Snow Showers",
      image: "http://openweathermap.org/img/wn/13n@2x.png",
    },
  },
  95: {
    day: {
      description: "Thunderstorm",
      image: "http://openweathermap.org/img/wn/11d@2x.png",
    },
    night: {
      description: "Thunderstorm",
      image: "http://openweathermap.org/img/wn/11n@2x.png",
    },
  },
  96: {
    day: {
      description: "Light Thunderstorms With Hail",
      image: "http://openweathermap.org/img/wn/11d@2x.png",
    },
    night: {
      description: "Light Thunderstorms With Hail",
      image: "http://openweathermap.org/img/wn/11n@2x.png",
    },
  },
  99: {
    day: {
      description: "Thunderstorm With Hail",
      image: "http://openweathermap.org/img/wn/11d@2x.png",
    },
    night: {
      description: "Thunderstorm With Hail",
      image: "http://openweathermap.org/img/wn/11n@2x.png",
    },
  },
};