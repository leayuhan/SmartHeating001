/**
 * TopBar Component
 * Design: 能源科技暗黑大屏风 - 顶部实时关键指标状态栏
 */
import { useEffect, useState } from "react";
import { Thermometer, Wind, Droplets, Sun, Clock } from "lucide-react";

function useRealTimeClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return time;
}

// Simulated real-time weather data
function useWeatherData() {
  const [data, setData] = useState({
    outdoor: -3.2,
    wind: 3.5,
    humidity: 62,
    sunshine: 45,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setData((prev) => ({
        outdoor: +(prev.outdoor + (Math.random() - 0.5) * 0.2).toFixed(1),
        wind: +(prev.wind + (Math.random() - 0.5) * 0.3).toFixed(1),
        humidity: Math.max(30, Math.min(95, prev.humidity + Math.round((Math.random() - 0.5) * 2))),
        sunshine: Math.max(0, Math.min(100, prev.sunshine + Math.round((Math.random() - 0.5) * 3))),
      }));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return data;
}

interface TopBarProps {
  title?: string;
}

export default function TopBar({ title = "系统总览" }: TopBarProps) {
  const time = useRealTimeClock();
  const weather = useWeatherData();

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("zh-CN", { hour12: false });
  const formatDate = (d: Date) =>
    d.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" });

  const metrics = [
    {
      icon: Thermometer,
      label: "室外温度",
      value: `${weather.outdoor}°C`,
      color: weather.outdoor < 0 ? "oklch(0.65 0.20 220)" : "oklch(0.72 0.18 55)",
    },
    {
      icon: Wind,
      label: "风速",
      value: `${weather.wind} m/s`,
      color: "oklch(0.70 0.15 200)",
    },
    {
      icon: Droplets,
      label: "湿度",
      value: `${weather.humidity}%`,
      color: "oklch(0.65 0.18 200)",
    },
    {
      icon: Sun,
      label: "日照强度",
      value: `${weather.sunshine} W/m²`,
      color: "oklch(0.80 0.18 80)",
    },
  ];

  return (
    <header
      className="flex items-center justify-between px-6 py-3 flex-shrink-0"
      style={{
        background: "oklch(0.11 0.025 238)",
        borderBottom: "1px solid oklch(1 0 0 / 8%)",
        height: "60px",
      }}
    >
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <h1
          className="text-lg font-bold"
          style={{ color: "oklch(0.92 0.008 220)" }}
        >
          {title}
        </h1>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{
            background: "oklch(0.65 0.20 220 / 15%)",
            color: "oklch(0.75 0.20 220)",
            border: "1px solid oklch(0.65 0.20 220 / 30%)",
          }}
        >
          DEMO
        </span>
      </div>

      {/* Weather Metrics */}
      <div className="flex items-center gap-6">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="flex items-center gap-2">
              <Icon size={14} style={{ color: m.color }} />
              <span
                className="text-xs"
                style={{ color: "oklch(0.55 0.015 220)" }}
              >
                {m.label}
              </span>
              <span
                className="text-xs font-mono-data font-semibold"
                style={{ color: m.color }}
              >
                {m.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Clock */}
      <div className="flex items-center gap-2">
        <Clock size={14} style={{ color: "oklch(0.55 0.015 220)" }} />
        <div className="text-right">
          <div
            className="font-mono-data text-sm font-semibold"
            style={{ color: "oklch(0.85 0.008 220)" }}
          >
            {formatTime(time)}
          </div>
          <div
            className="text-xs"
            style={{ color: "oklch(0.50 0.012 220)" }}
          >
            {formatDate(time)}
          </div>
        </div>
      </div>
    </header>
  );
}
