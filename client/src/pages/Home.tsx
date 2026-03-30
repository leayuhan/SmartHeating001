/**
 * Home.tsx - 智慧供热展示主页面
 * Theme: LIGHT TECH — White base + precision blue data lines
 *
 * 核心功能：
 * 1. 实时气象模式：接入Open-Meteo API，真实天气 + 12h预报
 * 2. 演示模式：手动切换晴/多云/雨/雪，展会演示用
 * 3. 供热系统全景SVG交互图（热源→换热站→18栋楼）
 * 4. 楼栋室温随天气实时变化（含热惰性滞后）
 * 5. AI调度中心：当前预警 + 12h预判 + 具体操作建议
 * 6. 楼栋点击：每层每户室温 + 入户监测点（少数几户）+ 12h预测曲线
 * 7. 换热站点击：水力平衡 + AI决策
 */
import { useState, useEffect, useCallback, useRef } from "react";
import WeatherBar from "../components/WeatherBar";
import HeatingSystemMap from "../components/HeatingSystemMap";
import BuildingDetailPanel from "../components/BuildingDetailPanel";
import HeatStationPanel from "../components/HeatStationPanel";
import AIDispatchPanel from "../components/AIDispatchPanel";
import TechInfoModal from "../components/TechInfoModal";
import { useWeather } from "../hooks/useWeather";
import type { WeatherType as HookWeatherType } from "../hooks/useWeather";

// Re-export types for other components
export type WeatherType = "sunny" | "cloudy" | "rainy" | "snowy";

export interface Building {
  id: string;
  name: string;
  x: number;
  y: number;
  floors: number;
  area: number;
  temp: number;
  orientation: string;
  heatingType: string;
  position: string;
  glassRatio: number;
  stationId: string;
  hasMeter?: boolean;
}

export interface HeatStation {
  id: string;
  name: string;
  x: number;
  y: number;
  supplyTemp: number;
  returnTemp: number;
  flow: number;
  pressure: number;
  buildings: string[];
}

// Base room temperature offsets per weather type (applied with thermal inertia)
const WEATHER_TEMP_OFFSET: Record<WeatherType, number> = {
  sunny:  +1.5,
  cloudy: 0,
  rainy:  -1.8,
  snowy:  -3.2,
};

// 18 buildings across 3 heat stations (6 per station)
// Layout: SVG 920x680, heat source at x=75, stations at x=230
// Station A: y=120, Station B: y=340, Station C: y=560
// Buildings arranged in 2 rows × 3 cols per station
const BASE_BUILDINGS: Building[] = [
  // Station A (换热站A) — 5 buildings, single row y=130
  { id: "A1", name: "A1栋", x: 370, y: 130, floors: 18, area: 5400, temp: 21.2, orientation: "南北", heatingType: "散热器", position: "近端", glassRatio: 0.28, stationId: "S1", hasMeter: false },
  { id: "A2", name: "A2栋", x: 480, y: 130, floors: 22, area: 6600, temp: 20.8, orientation: "东西", heatingType: "地暖",   position: "近端", glassRatio: 0.32, stationId: "S1", hasMeter: true  },
  { id: "A3", name: "A3栋", x: 590, y: 130, floors: 15, area: 4500, temp: 19.4, orientation: "南北", heatingType: "散热器", position: "中端", glassRatio: 0.25, stationId: "S1", hasMeter: false },
  { id: "A4", name: "A4栋", x: 700, y: 130, floors: 20, area: 6000, temp: 20.1, orientation: "东西", heatingType: "散热器", position: "远端", glassRatio: 0.30, stationId: "S1", hasMeter: false },
  { id: "A5", name: "A5栋", x: 810, y: 130, floors: 16, area: 4800, temp: 19.7, orientation: "南北", heatingType: "地暖",   position: "远端", glassRatio: 0.27, stationId: "S1", hasMeter: false },
  // Station B (换热站B) — 5 buildings, single row y=340
  { id: "B1", name: "B1栋", x: 370, y: 340, floors: 20, area: 6000, temp: 20.5, orientation: "南北", heatingType: "地暖",   position: "近端", glassRatio: 0.30, stationId: "S2", hasMeter: false },
  { id: "B2", name: "B2栋", x: 480, y: 340, floors: 16, area: 4800, temp: 19.8, orientation: "东西", heatingType: "散热器", position: "近端", glassRatio: 0.35, stationId: "S2", hasMeter: true  },
  { id: "B3", name: "B3栋", x: 590, y: 340, floors: 12, area: 3600, temp: 18.6, orientation: "南北", heatingType: "散热器", position: "中端", glassRatio: 0.22, stationId: "S2", hasMeter: false },
  { id: "B4", name: "B4栋", x: 700, y: 340, floors: 18, area: 5400, temp: 19.3, orientation: "东西", heatingType: "地暖",   position: "远端", glassRatio: 0.33, stationId: "S2", hasMeter: false },
  { id: "B5", name: "B5栋", x: 810, y: 340, floors: 24, area: 7200, temp: 20.2, orientation: "南北", heatingType: "散热器", position: "远端", glassRatio: 0.28, stationId: "S2", hasMeter: false },
  // Station C (换热站C) — 5 buildings, single row y=550
  { id: "C1", name: "C1栋", x: 370, y: 550, floors: 24, area: 7200, temp: 19.2, orientation: "东西", heatingType: "地暖",   position: "近端", glassRatio: 0.38, stationId: "S3", hasMeter: false },
  { id: "C2", name: "C2栋", x: 480, y: 550, floors: 18, area: 5400, temp: 17.8, orientation: "南北", heatingType: "散热器", position: "近端", glassRatio: 0.28, stationId: "S3", hasMeter: true  },
  { id: "C3", name: "C3栋", x: 590, y: 550, floors: 14, area: 4200, temp: 18.3, orientation: "东西", heatingType: "散热器", position: "中端", glassRatio: 0.30, stationId: "S3", hasMeter: false },
  { id: "C4", name: "C4栋", x: 700, y: 550, floors: 20, area: 6000, temp: 19.6, orientation: "南北", heatingType: "地暖",   position: "远端", glassRatio: 0.32, stationId: "S3", hasMeter: false },
  { id: "C5", name: "C5栋", x: 810, y: 550, floors: 16, area: 4800, temp: 20.4, orientation: "东西", heatingType: "散热器", position: "远端", glassRatio: 0.29, stationId: "S3", hasMeter: false },
];

const INITIAL_STATIONS: HeatStation[] = [
  { id: "S1", name: "换热站A", x: 230, y: 130, supplyTemp: 58, returnTemp: 42, flow: 185, pressure: 0.42, buildings: ["A1","A2","A3","A4","A5"] },
  { id: "S2", name: "换热站B", x: 230, y: 340, supplyTemp: 55, returnTemp: 40, flow: 162, pressure: 0.38, buildings: ["B1","B2","B3","B4","B5"] },
  { id: "S3", name: "换热站C", x: 230, y: 550, supplyTemp: 52, returnTemp: 38, flow: 148, pressure: 0.35, buildings: ["C1","C2","C3","C4","C5"] },
];

// Calculate building temp based on weather type and thermal inertia transition factor
function calcBuildingTemp(base: number, weatherType: WeatherType, transitionFactor: number): number {
  const offset = WEATHER_TEMP_OFFSET[weatherType];
  const noise = Math.sin(base * 13.7) * 0.08;
  return +(base + offset * transitionFactor + noise).toFixed(1);
}

// Map real outdoor temp to building temp adjustment
function calcBuildingTempFromRealWeather(
  base: number,
  outdoorTemp: number,
  weatherType: WeatherType,
  transitionFactor: number
): number {
  const refOutdoorTemp = -5;
  const outdoorDiff = outdoorTemp - refOutdoorTemp;
  const indoorAdjust = outdoorDiff * 0.15;
  const weatherOffset = WEATHER_TEMP_OFFSET[weatherType] * 0.3;
  const noise = Math.sin(base * 13.7) * 0.08;
  return +(base + (indoorAdjust + weatherOffset) * transitionFactor + noise).toFixed(1);
}

const AUTO_DEMO_SEQ: WeatherType[] = ["sunny", "cloudy", "rainy", "snowy", "cloudy"];

function mapHookWeather(w: HookWeatherType): WeatherType {
  if (w === "sunny") return "sunny";
  if (w === "rainy") return "rainy";
  if (w === "snowy") return "snowy";
  return "cloudy";
}

export default function Home() {
  const weatherHook = useWeather();
  const weather = weatherHook.weather;
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoWeatherType, setDemoWeatherType] = useState<WeatherType>("cloudy");
  const [isAutoDemo, setIsAutoDemo] = useState(false);
  const autoDemoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoDemoIdxRef = useRef(0);

  // Thermal inertia: 0 = just switched, 1 = fully transitioned
  const [transitionFactor, setTransitionFactor] = useState(1);
  const prevWeatherRef = useRef<WeatherType>("cloudy");
  const transitionRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedStation, setSelectedStation] = useState<HeatStation | null>(null);
  const [showTechModal, setShowTechModal] = useState(false);
  const [stations] = useState<HeatStation[]>(INITIAL_STATIONS);

  const effectiveWeatherType: WeatherType = isDemoMode
    ? demoWeatherType
    : mapHookWeather(weather.currentWeatherType);

  // Thermal inertia transition when weather changes
  useEffect(() => {
    if (effectiveWeatherType !== prevWeatherRef.current) {
      prevWeatherRef.current = effectiveWeatherType;
      setTransitionFactor(0);
      if (transitionRef.current) clearInterval(transitionRef.current);
      // Transition over ~8 minutes simulated as 8 seconds for demo
      transitionRef.current = setInterval(() => {
        setTransitionFactor(prev => {
          const next = prev + 0.025;
          if (next >= 1) {
            if (transitionRef.current) clearInterval(transitionRef.current);
            return 1;
          }
          return next;
        });
      }, 200);
    }
    return () => { if (transitionRef.current) clearInterval(transitionRef.current); };
  }, [effectiveWeatherType]);

  // Calculate current building temps
  const buildings: Building[] = BASE_BUILDINGS.map(b => ({
    ...b,
    temp: isDemoMode
      ? calcBuildingTemp(b.temp, effectiveWeatherType, transitionFactor)
      : calcBuildingTempFromRealWeather(b.temp, weather.currentTemp, effectiveWeatherType, transitionFactor),
  }));


  const enterDemoMode = useCallback((w: WeatherType) => {
    weatherHook.enterDemoMode(w);
    setIsDemoMode(true);
    setDemoWeatherType(w);
  }, [weatherHook]);

  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false);
    setIsAutoDemo(false);
    if (autoDemoRef.current) clearInterval(autoDemoRef.current);
  }, []);

  const handleToggleAutoDemo = useCallback(() => {
    if (isAutoDemo) {
      setIsAutoDemo(false);
      if (autoDemoRef.current) clearInterval(autoDemoRef.current);
    } else {
      if (!isDemoMode) enterDemoMode("cloudy");
      setIsAutoDemo(true);
      autoDemoIdxRef.current = 0;
      autoDemoRef.current = setInterval(() => {
        autoDemoIdxRef.current = (autoDemoIdxRef.current + 1) % AUTO_DEMO_SEQ.length;
        setDemoWeatherType(AUTO_DEMO_SEQ[autoDemoIdxRef.current]);
      }, 6000);
    }
  }, [isAutoDemo, isDemoMode, enterDemoMode]);

  useEffect(() => {
    return () => { if (autoDemoRef.current) clearInterval(autoDemoRef.current); };
  }, []);

  const handleExitDemo = useCallback(() => {
    setIsAutoDemo(false);
    if (autoDemoRef.current) clearInterval(autoDemoRef.current);
    exitDemoMode();
  }, [exitDemoMode]);

  const handleSelectBuilding = useCallback((b: Building) => {
    setSelectedBuilding(b);
    setSelectedStation(null);
  }, []);

  const handleSelectStation = useCallback((s: HeatStation) => {
    setSelectedStation(s);
    setSelectedBuilding(null);
  }, []);

  return (
    <div className="app-shell">
      {/* Top weather bar */}
      <WeatherBar
        weather={weather}
        isDemoMode={isDemoMode}
        onEnterDemo={enterDemoMode}
        onExitDemo={handleExitDemo}
        onSetDemoWeather={(w) => {
          if (!isDemoMode) enterDemoMode(w);
          else setDemoWeatherType(w);
        }}
        isAutoDemo={isAutoDemo}
        onToggleAutoDemo={handleToggleAutoDemo}
      />

      {/* Main content */}
      <div className="main-content">
        {/* Left: AI Dispatch Panel */}
        <div className="left-panel">
          <AIDispatchPanel
            buildings={buildings}
            weather={effectiveWeatherType}
            outdoorTemp={weather.currentTemp}
            transitionFactor={transitionFactor}
            onSelectBuilding={handleSelectBuilding}
            onShowTechModal={() => setShowTechModal(true)}
            isAutoDemo={isAutoDemo}
            onToggleAutoDemo={handleToggleAutoDemo}
          />
        </div>

        {/* Center: Heating System Map */}
        <div className="flex-1 overflow-hidden relative">
          {/* Per-station thermal inertia indicator */}
          {transitionFactor < 0.98 && (
            <div
              className="absolute top-3 left-1/2 z-10 animate-fade-in-up"
              style={{
                transform: "translateX(-50%)",
                background: "rgba(255,255,255,0.97)",
                border: "1px solid rgba(230, 119, 0, 0.35)",
                boxShadow: "0 4px 16px rgba(230, 119, 0, 0.12)",
                borderRadius: 10,
                padding: "6px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div className="w-2 h-2 rounded-full animate-blink" style={{ background: "#f97316" }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "#E67700", fontFamily: "'Noto Sans SC', sans-serif", whiteSpace: "nowrap" }}>
                  热惰性响应中
                </span>
              </div>
              <div style={{ width: 1, height: 20, background: "rgba(0,0,0,0.08)" }} />
              {/* Per-station progress */}
              {stations.map(s => {
                // Each station has slightly different inertia based on heating type mix
                const stationBuildings = buildings.filter(b => b.stationId === s.id);
                const underfloorCount = stationBuildings.filter(b => b.heatingType === "地暖").length;
                // More underfloor = slower response (lower effective factor)
                const stationFactor = Math.min(1, transitionFactor * (1 - underfloorCount * 0.04));
                const stationColors: Record<string, string> = { S1: "#1A56DB", S2: "#059669", S3: "#D97706" };
                const sc = stationColors[s.id] || "#6B7280";
                return (
                  <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: 72, marginBottom: 1 }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: sc, fontFamily: "'Noto Sans SC', sans-serif" }}>{s.name}</span>
                      <span style={{ fontSize: 8, color: "#9CA3AF", fontFamily: "'Share Tech Mono', monospace" }}>{Math.round(stationFactor * 100)}%</span>
                    </div>
                    <div style={{ width: 72, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 2,
                        width: `${stationFactor * 100}%`,
                        background: `linear-gradient(90deg, ${sc}, #22c55e)`,
                        transition: "width 0.3s ease",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <HeatingSystemMap
            buildings={buildings}
            stations={stations}
            weather={effectiveWeatherType}
            onSelectBuilding={handleSelectBuilding}
            onSelectStation={handleSelectStation}
            selectedBuildingId={selectedBuilding?.id ?? undefined}
            selectedStationId={selectedStation?.id ?? undefined}
          />
        </div>

        {/* Right: Detail Panel */}
        {selectedBuilding && (
          <div className="right-panel" style={{ animation: 'slide-in-right 0.25s ease' }}>
            <BuildingDetailPanel
              building={selectedBuilding}
              weather={effectiveWeatherType}
              outdoorTemp={weather.currentTemp}
              onClose={() => setSelectedBuilding(null)}
            />
          </div>
        )}
        {selectedStation && !selectedBuilding && (
          <div className="right-panel" style={{ animation: 'slide-in-right 0.25s ease' }}>
            <HeatStationPanel
              station={selectedStation}
              buildings={buildings.filter(b => selectedStation.buildings.includes(b.id))}
              weather={effectiveWeatherType}
              onClose={() => setSelectedStation(null)}
            />
          </div>
        )}
      </div>

      {/* Tech info modal */}
      {showTechModal && <TechInfoModal onClose={() => setShowTechModal(false)} />}
    </div>
  );
}
