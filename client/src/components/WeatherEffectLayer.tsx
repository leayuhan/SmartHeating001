/**
 * WeatherEffectLayer - 天气动画覆盖层
 * 太阳飘过 / 云飘过 / 下雨动画
 */
import { useEffect, useState } from "react";
import { WeatherType } from "../pages/Home";

const SUNNY_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663428492122/CZm6BZEe2oQq4xtYABPMda/weather-sunny-3UfACFpPEkS79C9BnbJ5cJ.webp";
const CLOUDY_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663428492122/CZm6BZEe2oQq4xtYABPMda/weather-cloudy-QHM3V2QDbTtdR4DJAcxVf7.webp";
const RAINY_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663428492122/CZm6BZEe2oQq4xtYABPMda/weather-rainy-ZDgL8hDqwYRNR8UDACY2Lp.webp";

interface Props {
  weather: WeatherType;
  active: boolean;
}

// Rain drops
function RainDrops() {
  const drops = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 2}s`,
    duration: `${0.6 + Math.random() * 0.6}s`,
    opacity: 0.3 + Math.random() * 0.5,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {drops.map((d) => (
        <div
          key={d.id}
          className="absolute w-0.5 rounded-full"
          style={{
            left: d.left,
            top: "-20px",
            height: `${12 + Math.random() * 16}px`,
            background: "linear-gradient(180deg, transparent, #93c5fd)",
            opacity: d.opacity,
            animation: `rain-drop ${d.duration} linear ${d.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function WeatherEffectLayer({ weather, active }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
    } else {
      const t = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(t);
    }
  }, [active]);

  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-500"
      style={{ opacity: active ? 1 : 0 }}
    >
      {weather === "sunny" && (
        <>
          {/* Sun drifting across */}
          <div
            className="absolute"
            style={{
              top: "60px",
              left: "-120px",
              animation: "float-sun 3s ease-in-out forwards",
            }}
          >
            <img src={SUNNY_URL} alt="sun" className="w-24 h-24 object-contain" style={{ filter: "drop-shadow(0 0 20px #fbbf24)" }} />
          </div>
          {/* Warm overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at 50% 30%, rgba(251,191,36,0.12) 0%, transparent 70%)",
            }}
          />
          {/* Warm label */}
          <div
            className="absolute top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl text-center"
            style={{
              background: "rgba(255,251,235,0.95)",
              border: "2px solid #f59e0b",
              boxShadow: "0 8px 24px rgba(245,158,11,0.25)",
              animation: "slide-up 0.4s ease-out forwards",
            }}
          >
            <div className="text-2xl mb-1">☀️</div>
            <div className="font-bold text-base" style={{ color: "#d97706" }}>太阳出来了！</div>
            <div className="text-sm mt-0.5" style={{ color: "#92400e" }}>日照增强 → 室温上升 +1~2°C</div>
            <div className="text-xs mt-1" style={{ color: "#b45309" }}>AI模型正在重新预测各楼栋室温...</div>
          </div>
        </>
      )}

      {weather === "cloudy" && (
        <>
          {/* Clouds drifting */}
          <div
            className="absolute"
            style={{
              top: "40px",
              left: "-150px",
              animation: "float-cloud 3.5s ease-in-out forwards",
            }}
          >
            <img src={CLOUDY_URL} alt="cloud" className="w-40 h-40 object-contain" style={{ opacity: 0.85 }} />
          </div>
          <div
            className="absolute"
            style={{
              top: "80px",
              left: "-200px",
              animation: "float-cloud 4s ease-in-out 0.5s forwards",
            }}
          >
            <img src={CLOUDY_URL} alt="cloud" className="w-28 h-28 object-contain" style={{ opacity: 0.6 }} />
          </div>
          {/* Cool overlay */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(139,92,246,0.04)" }}
          />
          <div
            className="absolute top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl text-center"
            style={{
              background: "rgba(245,243,255,0.95)",
              border: "2px solid #8b5cf6",
              boxShadow: "0 8px 24px rgba(139,92,246,0.2)",
              animation: "slide-up 0.4s ease-out forwards",
            }}
          >
            <div className="text-2xl mb-1">⛅</div>
            <div className="font-bold text-base" style={{ color: "#7c3aed" }}>云层飘过！</div>
            <div className="text-sm mt-0.5" style={{ color: "#4c1d95" }}>遮挡日照 → 室温微降 -0.5°C</div>
            <div className="text-xs mt-1" style={{ color: "#6d28d9" }}>AI模型正在重新预测各楼栋室温...</div>
          </div>
        </>
      )}

      {weather === "rainy" && (
        <>
          <RainDrops />
          {/* Dark overlay */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(59,130,246,0.06)" }}
          />
          <div
            className="absolute top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl text-center"
            style={{
              background: "rgba(239,246,255,0.95)",
              border: "2px solid #3b82f6",
              boxShadow: "0 8px 24px rgba(59,130,246,0.2)",
              animation: "slide-up 0.4s ease-out forwards",
            }}
          >
            <div className="text-2xl mb-1">🌧️</div>
            <div className="font-bold text-base" style={{ color: "#1d4ed8" }}>下雨了！</div>
            <div className="text-sm mt-0.5" style={{ color: "#1e3a8a" }}>气温下降 → 室温降低 -2°C</div>
            <div className="text-xs mt-1" style={{ color: "#2563eb" }}>AI模型正在重新预测各楼栋室温...</div>
          </div>
        </>
      )}
    </div>
  );
}
