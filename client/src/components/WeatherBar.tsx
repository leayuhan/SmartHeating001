/**
 * WeatherBar.tsx — Top header: logo + weather + demo controls
 * Design: White header, blue accent line at bottom, crisp data typography
 */
import { useEffect, useState } from "react";
import type { WeatherData, HourlyForecast } from "../hooks/useWeather";
import type { WeatherType } from "../pages/Home";

interface Props {
  weather: WeatherData;
  isDemoMode: boolean;
  isAutoDemo: boolean;
  onSetDemoWeather: (w: WeatherType) => void;
  onEnterDemo: (w: WeatherType) => void;
  onExitDemo: () => void;
  onToggleAutoDemo: () => void;
  onShowTechModal?: () => void;
}

const WEATHER_ICONS: Record<WeatherType, string> = {
  sunny: "☀️", cloudy: "⛅", rainy: "🌧️", snowy: "❄️",
};
const WEATHER_LABELS: Record<WeatherType, string> = {
  sunny: "晴天", cloudy: "多云", rainy: "雨天", snowy: "雪天",
};

function LiveClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const dateStr = time.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit", weekday: "short" });
  const timeStr = time.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return (
    <div style={{ textAlign: "right", flexShrink: 0 }}>
      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 15, fontWeight: 700, color: "#1A56DB",
        lineHeight: 1, letterSpacing: "0.05em",
      }}>{timeStr}</div>
      <div style={{ fontSize: 8, color: "#9CA3AF", marginTop: 2, letterSpacing: "0.05em" }}>{dateStr}</div>
    </div>
  );
}

function Seg({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  return (
    <div className="header-weather-segment">
      <span style={{ fontSize: 14 }}>{icon}</span>
      <div>
        <div className="header-weather-label">{label}</div>
        <div className="header-weather-value" style={color ? { color } : {}}>{value}</div>
      </div>
    </div>
  );
}

export default function WeatherBar({
  weather, isDemoMode, isAutoDemo,
  onSetDemoWeather, onEnterDemo, onExitDemo, onToggleAutoDemo, onShowTechModal,
}: Props) {
  const displayWeather: WeatherType = weather.currentWeatherType;
  const demoWeather: WeatherType = weather.demoWeather;
  const activeWeather = isDemoMode ? demoWeather : displayWeather;

  const tempColor = weather.currentTemp > 0 ? "#D97706"
    : weather.currentTemp > -5 ? "#1A56DB"
    : "#4338CA";

  return (
    <header className="top-header">
      {/* Logo */}
      <div className="header-logo">
        <div className="header-logo-icon">🔥</div>
        <div>
          <div className="header-title">智慧供热 · 室温辨识AI系统</div>
          <div className="header-subtitle">SMART HEATING · AI THERMAL RECOGNITION PLATFORM</div>
        </div>
      </div>

      <div className="header-divider" />

      {/* Weather data */}
      <Seg icon={WEATHER_ICONS[activeWeather]} label="天气" value={WEATHER_LABELS[activeWeather]} />
      <Seg
        icon="🌡️" label="室外温度"
        value={`${weather.currentTemp > 0 ? "+" : ""}${weather.currentTemp.toFixed(1)}°C`}
        color={tempColor}
      />
      <Seg icon="💨" label="风速" value={`${weather.windSpeed.toFixed(1)} m/s`} />
      <Seg icon="💧" label="湿度" value={`${weather.humidity}%`} />
      <Seg icon="☀" label="日照" value={`${weather.sunshine} W/m²`} />

      {/* 12h forecast strip (real mode only) */}
      {!isDemoMode && weather.forecast12h.length > 0 && (
        <>
          <div className="header-divider" />
          <div className="forecast-strip">
            <span style={{ fontSize: 8, color: "#9CA3AF", fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1, whiteSpace: "nowrap" }}>
              12H预报
            </span>
            {weather.forecast12h.slice(0, 5).map((h: HourlyForecast, i: number) => (
              <div key={i} className="forecast-item">
                <div className="forecast-hour">{i === 0 ? "现在" : `${h.hour}`}</div>
                <div className="forecast-icon">{WEATHER_ICONS[h.weatherType] ?? "🌤️"}</div>
                <div className="forecast-temp" style={{
                  color: h.temp > 0 ? "#D97706" : h.temp > -5 ? "#1A56DB" : "#4338CA",
                }}>
                  {h.temp > 0 ? "+" : ""}{h.temp.toFixed(0)}°
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Demo weather buttons */}
      {isDemoMode && (
        <>
          <div className="header-divider" />
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {(["sunny", "cloudy", "rainy", "snowy"] as WeatherType[]).map(w => (
              <button key={w}
                className={`weather-mode-btn ${demoWeather === w ? "selected" : "unselected"}`}
                onClick={() => onSetDemoWeather(w)}>
                {WEATHER_ICONS[w]} {WEATHER_LABELS[w]}
              </button>
            ))}
          </div>
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Status pills */}
      <div style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "3px 10px",
        background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 5,
      }}>
        <div className="status-dot online" />
        <span style={{ fontSize: 9, color: "#059669", fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 }}>AI运行中</span>
      </div>
      <div style={{
        padding: "3px 10px",
        background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 5,
      }}>
        <span style={{ fontSize: 9, color: "#1A56DB", fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 }}>R²=0.9996</span>
      </div>

      <div className="header-divider" />

      {/* Auto demo */}
      {isDemoMode && (
        <button className={`demo-mode-btn ${isAutoDemo ? "active" : "inactive"}`} onClick={onToggleAutoDemo}>
          {isAutoDemo ? "⏹ 停止循环" : "▶ 自动循环"}
        </button>
      )}

      {/* Demo/Live toggle */}
      <button
        className={`demo-mode-btn ${isDemoMode ? "active" : "inactive"}`}
        onClick={isDemoMode ? onExitDemo : () => onEnterDemo("cloudy")}
        style={isDemoMode ? {
          borderColor: "#D97706", color: "#D97706", background: "#FFFBEB",
        } : {}}
      >
        {isDemoMode ? "📡 实时模式" : "🎬 演示模式"}
      </button>

      {onShowTechModal && (
        <button className="demo-mode-btn inactive" onClick={onShowTechModal}>
          🧠 技术说明
        </button>
      )}

      <div className="header-divider" />
      <LiveClock />
    </header>
  );
}
