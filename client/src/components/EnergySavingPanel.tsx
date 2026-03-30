/**
 * EnergySavingPanel - 节能对比面板（右下角）
 * Theme: Light Tech Indigo
 */
import type { Building, WeatherType } from "../pages/Home";

interface Props {
  weather: WeatherType;
  buildings: Building[];
}

export default function EnergySavingPanel({ weather, buildings }: Props) {
  const avgTemp = buildings.reduce((s, b) => s + b.temp, 0) / buildings.length;
  const totalArea = buildings.reduce((s, b) => s + b.area, 0);
  
  // Simulated energy: before AI (fixed supply) vs after AI (demand-based)
  const baseEnergy = totalArea * 0.058;
  const aiEnergy = totalArea * (weather === "sunny" ? 0.044 : weather === "cloudy" ? 0.050 : 0.055);
  const savings = +(((baseEnergy - aiEnergy) / baseEnergy) * 100).toFixed(1);
  const savedGJ = +((baseEnergy - aiEnergy) / 1000).toFixed(1);

  return (
    <div className="rounded-xl p-3 text-xs"
      style={{
        background: "rgba(255,255,255,0.96)",
        border: "1.5px solid rgba(79,70,229,0.12)",
        boxShadow: "0 4px 20px rgba(79,70,229,0.1)",
        minWidth: 200,
      }}>
      <div className="font-bold mb-2" style={{ color: "#4F46E5" }}>⚡ AI节能效果</div>
      
      <div className="flex items-center gap-3 mb-2">
        <div className="text-center">
          <div className="text-[9px]" style={{ color: "#9CA3AF" }}>调节前</div>
          <div className="text-sm font-black" style={{ color: "#EF4444" }}>
            {(baseEnergy / 1000).toFixed(1)} GJ
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg">→</div>
        </div>
        <div className="text-center">
          <div className="text-[9px]" style={{ color: "#9CA3AF" }}>AI调节后</div>
          <div className="text-sm font-black" style={{ color: "#10B981" }}>
            {(aiEnergy / 1000).toFixed(1)} GJ
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-2 rounded-lg"
        style={{ background: "linear-gradient(135deg, #D1FAE5, #A7F3D0)" }}>
        <span style={{ color: "#065F46" }}>节约热量</span>
        <span className="font-black text-sm" style={{ color: "#059669" }}>
          {savedGJ} GJ ({savings}%)
        </span>
      </div>

      <div className="mt-1.5 text-[9px] text-center" style={{ color: "#9CA3AF" }}>
        均温 {avgTemp.toFixed(1)}°C · {totalArea.toLocaleString()} m² 供热面积
      </div>
    </div>
  );
}
