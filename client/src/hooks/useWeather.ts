/**
 * useWeather - 气象数据Hook
 *
 * 两种模式：
 * 1. 实时模式（默认）：调用 Open-Meteo API 获取真实天气 + 未来12小时预报
 *    - 完全免费，无需API Key
 *    - 数据：温度、风速、湿度、日照、降水概率、天气代码
 *    - 每10分钟刷新一次
 *
 * 2. 演示模式：手动切换晴/多云/雨天场景，用于展会演示
 *
 * 默认城市：哈尔滨（供热城市典型代表）
 * 经纬度：lat=45.75, lon=126.63
 */

import { useState, useEffect, useCallback, useRef } from "react";

export type WeatherType = "sunny" | "cloudy" | "rainy" | "snowy";

export interface HourlyForecast {
  hour: string;       // "14:00"
  temp: number;       // °C
  weatherCode: number;
  weatherType: WeatherType;
  precipitation: number; // mm
  precipProb: number;    // %
  windSpeed: number;     // km/h
  cloudCover: number;    // %
  sunshine: number;      // W/m²
}

export interface WeatherData {
  // Current
  currentTemp: number;
  currentWeatherType: WeatherType;
  currentWeatherCode: number;
  windSpeed: number;
  humidity: number;
  sunshine: number;      // W/m² shortwave radiation
  cloudCover: number;    // %
  precipitation: number; // mm last hour
  precipProb: number;    // % next hour

  // 12-hour forecast
  forecast12h: HourlyForecast[];

  // Meta
  isDemo: boolean;
  demoWeather: WeatherType;
  lastUpdated: Date | null;
  loading: boolean;
  error: string | null;
  city: string;
}

// WMO weather code → WeatherType
function wmoToWeatherType(code: number): WeatherType {
  if (code === 0 || code === 1) return "sunny";
  if (code >= 2 && code <= 3) return "cloudy";
  if (code >= 71 && code <= 77) return "snowy";
  if (code >= 85 && code <= 86) return "snowy";
  return "rainy"; // 51-67, 80-82, 95-99
}

// WMO weather code → Chinese description
export function wmoToLabel(code: number): string {
  if (code === 0) return "晴";
  if (code === 1) return "晴间多云";
  if (code === 2) return "多云";
  if (code === 3) return "阴";
  if (code >= 51 && code <= 55) return "毛毛雨";
  if (code >= 61 && code <= 65) return "雨";
  if (code >= 71 && code <= 75) return "雪";
  if (code >= 80 && code <= 82) return "阵雨";
  if (code >= 85 && code <= 86) return "阵雪";
  if (code >= 95 && code <= 99) return "雷雨";
  return "多云";
}

// Demo weather presets (typical heating season values for Harbin)
const DEMO_PRESETS: Record<WeatherType, Omit<WeatherData, "isDemo"|"demoWeather"|"lastUpdated"|"loading"|"error"|"city"|"forecast12h">> = {
  sunny: {
    currentTemp: -3,
    currentWeatherType: "sunny",
    currentWeatherCode: 1,
    windSpeed: 8,
    humidity: 38,
    sunshine: 420,
    cloudCover: 10,
    precipitation: 0,
    precipProb: 2,
  },
  cloudy: {
    currentTemp: -6,
    currentWeatherType: "cloudy",
    currentWeatherCode: 3,
    windSpeed: 14,
    humidity: 65,
    sunshine: 60,
    cloudCover: 78,
    precipitation: 0,
    precipProb: 25,
  },
  rainy: {
    currentTemp: -2,
    currentWeatherType: "rainy",
    currentWeatherCode: 63,
    windSpeed: 18,
    humidity: 92,
    sunshine: 8,
    cloudCover: 97,
    precipitation: 1.2,
    precipProb: 88,
  },
  snowy: {
    currentTemp: -10,
    currentWeatherType: "snowy",
    currentWeatherCode: 73,
    windSpeed: 22,
    humidity: 85,
    sunshine: 15,
    cloudCover: 95,
    precipitation: 0.8,
    precipProb: 75,
  },
};

function genDemoForecast(baseWeather: WeatherType, baseTemp: number): HourlyForecast[] {
  const now = new Date();
  return Array.from({ length: 13 }, (_, i) => {
    const h = new Date(now.getTime() + i * 3600000);
    const hourStr = `${h.getHours().toString().padStart(2, "0")}:00`;
    // Simulate gradual weather change in demo
    let wt = baseWeather;
    let temp = baseTemp;
    let precipProb = DEMO_PRESETS[baseWeather].precipProb;
    let sunshine = DEMO_PRESETS[baseWeather].sunshine;

    // Add some variation over 12 hours
    const variation = Math.sin(i * 0.5) * 0.8;
    temp = +(baseTemp + variation).toFixed(1);

    const code = DEMO_PRESETS[baseWeather].currentWeatherCode;
    return {
      hour: i === 0 ? "现在" : hourStr,
      temp,
      weatherCode: code,
      weatherType: wt,
      precipitation: baseWeather === "rainy" ? +(Math.random() * 0.5).toFixed(1) : 0,
      precipProb: Math.round(precipProb + Math.sin(i) * 10),
      windSpeed: Math.round(DEMO_PRESETS[baseWeather].windSpeed + Math.sin(i * 0.7) * 3),
      cloudCover: Math.round(DEMO_PRESETS[baseWeather].cloudCover + Math.sin(i * 0.3) * 8),
      sunshine: Math.round(sunshine + Math.sin(i * 0.4) * 30),
    };
  });
}

// Harbin coordinates (default city for heating demo)
const DEFAULT_LAT = 45.75;
const DEFAULT_LON = 126.63;
const DEFAULT_CITY = "哈尔滨";

async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
  const now = new Date();
  const startHour = now.toISOString().slice(0, 13) + ":00";
  const endDate = new Date(now.getTime() + 13 * 3600000).toISOString().slice(0, 16);

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,cloud_cover,wind_speed_10m,shortwave_radiation&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,cloud_cover,wind_speed_10m,shortwave_radiation&forecast_days=2&timezone=Asia%2FShanghai`;

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Weather API error: ${resp.status}`);
  const data = await resp.json();

  const cur = data.current;
  const currentTemp = Math.round(cur.temperature_2m * 10) / 10;
  const currentCode = cur.weather_code ?? 0;
  const currentWeatherType = wmoToWeatherType(currentCode);

  // Find current hour index in hourly data
  const nowHourStr = now.toISOString().slice(0, 13) + ":00";
  const hourlyTimes: string[] = data.hourly.time;
  const startIdx = Math.max(0, hourlyTimes.findIndex(t => t >= nowHourStr));

  const forecast12h: HourlyForecast[] = [];
  for (let i = 0; i <= 12; i++) {
    const idx = startIdx + i;
    if (idx >= hourlyTimes.length) break;
    const t = new Date(hourlyTimes[idx]);
    const hourStr = i === 0 ? "现在" : `${t.getHours().toString().padStart(2, "0")}:00`;
    const wCode = data.hourly.weather_code[idx] ?? 0;
    forecast12h.push({
      hour: hourStr,
      temp: Math.round(data.hourly.temperature_2m[idx] * 10) / 10,
      weatherCode: wCode,
      weatherType: wmoToWeatherType(wCode),
      precipitation: data.hourly.precipitation[idx] ?? 0,
      precipProb: data.hourly.precipitation_probability[idx] ?? 0,
      windSpeed: Math.round(data.hourly.wind_speed_10m[idx] ?? 0),
      cloudCover: data.hourly.cloud_cover[idx] ?? 0,
      sunshine: Math.round(data.hourly.shortwave_radiation[idx] ?? 0),
    });
  }

  return {
    currentTemp,
    currentWeatherType,
    currentWeatherCode: currentCode,
    windSpeed: Math.round(cur.wind_speed_10m ?? 0),
    humidity: cur.relative_humidity_2m ?? 0,
    sunshine: Math.round(cur.shortwave_radiation ?? 0),
    cloudCover: cur.cloud_cover ?? 0,
    precipitation: cur.precipitation ?? 0,
    precipProb: forecast12h[1]?.precipProb ?? 0,
    forecast12h,
    isDemo: false,
    demoWeather: currentWeatherType,
    lastUpdated: new Date(),
    loading: false,
    error: null,
    city: DEFAULT_CITY,
  };
}

const INITIAL_STATE: WeatherData = {
  currentTemp: -5,
  currentWeatherType: "cloudy",
  currentWeatherCode: 3,
  windSpeed: 12,
  humidity: 60,
  sunshine: 80,
  cloudCover: 70,
  precipitation: 0,
  precipProb: 20,
  forecast12h: [],
  isDemo: false,
  demoWeather: "cloudy",
  lastUpdated: null,
  loading: true,
  error: null,
  city: DEFAULT_CITY,
};

export function useWeather(lat = DEFAULT_LAT, lon = DEFAULT_LON) {
  const [weather, setWeather] = useState<WeatherData>(INITIAL_STATE);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoWeather, setDemoWeather] = useState<WeatherType>("cloudy");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadRealWeather = useCallback(async () => {
    if (isDemoMode) return;
    try {
      setWeather(prev => ({ ...prev, loading: true, error: null }));
      const data = await fetchWeatherData(lat, lon);
      setWeather(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "气象数据加载失败";
      setWeather(prev => ({
        ...prev,
        loading: false,
        error: msg,
        // Keep last known data, just mark error
      }));
    }
  }, [lat, lon, isDemoMode]);

  // Initial load + refresh every 10 minutes
  useEffect(() => {
    if (!isDemoMode) {
      loadRealWeather();
      intervalRef.current = setInterval(loadRealWeather, 10 * 60 * 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isDemoMode, loadRealWeather]);

  // Apply demo preset when demo mode is active
  useEffect(() => {
    if (isDemoMode) {
      const preset = DEMO_PRESETS[demoWeather];
      const forecast = genDemoForecast(demoWeather, preset.currentTemp);
      setWeather({
        ...preset,
        forecast12h: forecast,
        isDemo: true,
        demoWeather,
        lastUpdated: new Date(),
        loading: false,
        error: null,
        city: DEFAULT_CITY,
      });
    }
  }, [isDemoMode, demoWeather]);

  const enterDemoMode = useCallback((w: WeatherType) => {
    setIsDemoMode(true);
    setDemoWeather(w);
  }, []);

  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false);
    loadRealWeather();
  }, [loadRealWeather]);

  const setDemoWeatherType = useCallback((w: WeatherType) => {
    setDemoWeather(w);
  }, []);

  return {
    weather,
    isDemoMode,
    enterDemoMode,
    exitDemoMode,
    setDemoWeatherType,
    refresh: loadRealWeather,
  };
}
