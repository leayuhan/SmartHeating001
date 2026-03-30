/**
 * Home.tsx - 智慧供热展示主页面 v4.0
 * 7幕剧演示 · GSAP时序 · 焦点遮罩 · 语音播报 · 面包屑 · 数字滚动 · 压差弹窗
 */
import { useState, useEffect, useCallback, useRef } from "react";
import gsap from "gsap";
import WeatherBar from "../components/WeatherBar";
import HeatingSystemMap from "../components/HeatingSystemMap";
import BuildingDetailPanel from "../components/BuildingDetailPanel";
import HeatStationPanel from "../components/HeatStationPanel";
import AIDispatchPanel from "../components/AIDispatchPanel";
import TechInfoModal from "../components/TechInfoModal";
import AIBrainPanel from "../components/AIBrainPanel";
import TimeScrubber from "../components/TimeScrubber";
import HeatSourcePanel from "../components/HeatSourcePanel";
import PipeDiagnostics from "../components/PipeDiagnostics";
import AIModelingVisualization from "../components/AIModelingVisualization";
import WeatherIntelligence from "../components/WeatherIntelligence";
import { StrategyComparison } from "../components/StrategyComparison";
import CameraController, { type CameraControllerRef } from "../components/CameraController";
import { OneTowerTwoUnits, type UnitData } from "../components/OneTowerTwoUnits";
import { useHeatSourceLogic } from "../hooks/useHeatSourceLogic";
import CinematicScene from "../components/CinematicScene";
import FlippingBuilding from "../components/FlippingBuilding";
import FlippingHeatSource from "../components/FlippingHeatSource";
import FlippingStation from "../components/FlippingStation";
import { useHeatSourceDynamics } from "../hooks/useHeatSourceDynamics";
import { useWeather } from "../hooks/useWeather";
import type { WeatherType as HookWeatherType } from "../hooks/useWeather";
// FluidSimulation and PipeTwinDemo removed (orange particle flow disabled)
import ZoomableElement from "../components/ZoomableElement";
import EnergyDashboard from "../components/EnergyDashboard";
import EnergyInlineBar from "../components/EnergyInlineBar";
import DualModeTimeline, { DEMO_12_STAGES } from "../components/DualModeTimeline";
import ThermalInertiaFormula from "../components/ThermalInertiaFormula";
import HeatLossDiagnostic from "../components/HeatLossDiagnostic";
import { audio as audioEngine } from "../utils/audioEngine";
import BuildingZoomView from "../components/BuildingZoomView";
import RoomTempDashboard from "../components/RoomTempDashboard";
import ClosedLoopPanel from "../components/ClosedLoopPanel";
import DemoModeSelector, { type DemoMode } from "../components/DemoModeSelector";
import AIBrainIndicator from "../components/AIBrainIndicator";
import ColdWaveDemo from "../components/ColdWaveDemo";
import FiveStepLoop from "../components/FiveStepLoop";
import InteractiveControl from "../components/InteractiveControl";
import SystemFlowPanel from "../components/SystemFlowPanel";
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

const WEATHER_TEMP_OFFSET: Record<WeatherType, number> = {
  sunny:  +1.5,
  cloudy: 0,
  rainy:  -1.8,
  snowy:  -3.2,
};

// 9栋樿型布局：3换热站 × 3栋楼（S1-1/2/3, S2-1/2/3, S2-3=原6号楼演示重点）
const BASE_BUILDINGS: Building[] = [
  // S1 换热站A — 3栋楼
  // 雪天模式下: 1号楼→20.6°C(监测), 2号楼→19.6°C(监测), 3号楼→17.1°C(立即)
  { id: "1",  name: "1号楼",  x: 440, y: 110, floors: 22, area: 6600, temp: 22.5, orientation: "南北", heatingType: "散热器", position: "近端", glassRatio: 0.28, stationId: "S1", hasMeter: true  },
  { id: "2",  name: "2号楼",  x: 505, y: 110, floors: 18, area: 5400, temp: 21.5, orientation: "东西", heatingType: "地暖",   position: "中端", glassRatio: 0.32, stationId: "S1", hasMeter: false },
  { id: "3",  name: "3号楼",  x: 570, y: 110, floors: 14, area: 4200, temp: 19.0, orientation: "南北", heatingType: "散热器", position: "远端", glassRatio: 0.26, stationId: "S1", hasMeter: false },
  // S2 换热站B — 3栋楼（第3栋 = 原6号楼演示重点）
  // 雪天模式下: 4号楼→20.9°C(监测), 5号楼→18.6°C(12h内→17.2°C), 6号楼→16.0°C(立即)
  { id: "4",  name: "4号楼",  x: 440, y: 330, floors: 24, area: 7200, temp: 22.8, orientation: "南北", heatingType: "地暖",   position: "近端", glassRatio: 0.30, stationId: "S2", hasMeter: true  },
  { id: "5",  name: "5号楼",  x: 505, y: 330, floors: 20, area: 6000, temp: 20.5, orientation: "东西", heatingType: "散热器", position: "中端", glassRatio: 0.25, stationId: "S2", hasMeter: false },
  { id: "9",  name: "6号楼",  x: 570, y: 330, floors: 16, area: 4800, temp: 15.2, orientation: "南北", heatingType: "散热器", position: "远端", glassRatio: 0.22, stationId: "S2", hasMeter: false },
  // S3 换热站C — 3栋楼
  // 雪天模式下: 7号楼→20.3°C(监测), 8号楼→18.9°C(12h内→17.5°C), 6号楼→17.4°C(立即)
  { id: "7",  name: "7号楼",  x: 440, y: 550, floors: 20, area: 6000, temp: 22.2, orientation: "南北", heatingType: "散热器", position: "近端", glassRatio: 0.27, stationId: "S3", hasMeter: false },
  { id: "8",  name: "8号楼",  x: 505, y: 550, floors: 16, area: 4800, temp: 20.5, orientation: "东西", heatingType: "散热器", position: "中端", glassRatio: 0.31, stationId: "S3", hasMeter: false },
  { id: "9b", name: "9号楼",  x: 570, y: 550, floors: 12, area: 3600, temp: 19.3, orientation: "南北", heatingType: "散热器", position: "远端", glassRatio: 0.29, stationId: "S3", hasMeter: false },
];

const INITIAL_STATIONS: HeatStation[] = [
  { id: "S1", name: "换热站A", x: 330, y: 110, supplyTemp: 56, returnTemp: 45, flow: 128, pressure: 31, buildings: ["1","2","3"] },
  { id: "S2", name: "换热站B", x: 330, y: 330, supplyTemp: 52, returnTemp: 41, flow: 112, pressure: 38, buildings: ["4","5","9"] },
  { id: "S3", name: "换热站C", x: 330, y: 550, supplyTemp: 60, returnTemp: 48, flow: 143, pressure: 27, buildings: ["7","8","9b"] },
];

// ── 7阶段演示时间轴 ──────────────────────────────────────────────────────────
// Phase 0: 算法训练(7s) · Phase 1: 感知(4s) · Phase 2: 预警(5s)
// Phase 3: 诊断(5s) · Phase 4: 决策(7s) · Phase 5: 执行(13s) · Phase 6: 完成(4s)
export type DemoPhase = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const DEMO_PHASE_DURATIONS = [7000, 4000, 5000, 5000, 7000, 13000, 4000];
const TOTAL_DEMO_MS = DEMO_PHASE_DURATIONS.reduce((a, b) => a + b, 0);
const DEMO_TARGET_BUILDING_ID = "9";
const DEMO_TARGET_STATION_ID = "S2";
const DEMO_TARGET_TEMP = 18;  // 目标室温 18°C
const DEMO_START_TEMP = 16.0; // 6号楼初始室温 16°C

// AI诊断文本（打字机效果）
const AI_ANALYSIS_TEXT = `【说明对象】换热站B → 6号楼（远端楼栈）
检测到 6号楼 1-6层全部户平均室温 16.0°C，低于设定値 18°C。

▸ 根因分析：
  • 6号楼位于换热站B远端，属最远端楼栈
  • 换热站B→楼内管网压差 35kPa（阈値 30kPa）
  • 换热站B当前供水温 53°C，流量 118 t/h
  • 6号楼入户小阀开度低，水力失调明显
  • 小区天气预报：未来 2h 负荷上涨 8%

▸ 排查结论：
  • 换热站B管网无物理故障
  • 根因：远端水力失调 + 供热量不足

▸ 建议措施：
  • 换热站B供水温度提升：53°C → 55°C
  • 换热站B循环泵频率增大：流量 118 → 130 t/h
  • 6号楼入户总阀开度调至 85%
  • 建议安排管道检修，排查远端支路漏水隐患
  • 预计 25 分钟后室温恢复至 18°C 以上`;

const DEMO_STRATEGIES = [
  { id: "A", title: "快速响应方案", desc: "供温↑53→55°C + 流量↑10%", detail: "供水温度 53→55°C，流量 118→130 t/h", time: "约25分钟恢复", risk: "能耗增加约8%", color: "#1A56DB", recommended: true },
  { id: "B", title: "温和调节方案", desc: "供温↑53→54°C + 流量↑5%",  detail: "供水温度 53→54°C，流量 118→124 t/h", time: "约45分钟恢复", risk: "能耗增加约4%", color: "#059669", recommended: false },
  { id: "C", title: "多站联动方案", desc: "三站协同优化水力平衡",  detail: "S1/S2/S3 同步调节，消除水力失调",   time: "约35分钟恢复", risk: "需全局协调，复杂度高", color: "#7C3AED", recommended: false },
];

const PHASE_LABELS = ["算法训练", "感知", "预警", "诊断", "决策", "执行", "完成"];

function calcBuildingTemp(base: number, weatherType: WeatherType, transitionFactor: number, seed = 0): number {
  const offset = WEATHER_TEMP_OFFSET[weatherType] * 0.5;
  const noise = (Math.sin(base * 13.7 + seed * 1.1) * 0.5 + Math.cos(base * 7.3 + seed * 0.7) * 0.3);
  const raw = base + offset * transitionFactor + noise;
  return +Math.max(16, Math.min(24, raw)).toFixed(1);
}

function calcBuildingTempFromRealWeather(base: number, outdoorTemp: number, weatherType: WeatherType, transitionFactor: number, seed = 0): number {
  const refOutdoorTemp = -5;
  const outdoorDiff = outdoorTemp - refOutdoorTemp;
  const indoorAdjust = outdoorDiff * 0.06;
  const weatherOffset = WEATHER_TEMP_OFFSET[weatherType] * 0.25;
  const noise = (Math.sin(base * 13.7 + seed * 1.1) * 0.5 + Math.cos(base * 7.3 + seed * 0.7) * 0.3);
  const raw = base + (indoorAdjust + weatherOffset) * transitionFactor + noise;
  return +Math.max(16, Math.min(24, raw)).toFixed(1);
}

const AUTO_DEMO_SEQ: WeatherType[] = ["sunny", "cloudy", "rainy", "snowy", "cloudy"];

function mapHookWeather(w: HookWeatherType): WeatherType {
  if (w === "sunny") return "sunny";
  if (w === "rainy") return "rainy";
  if (w === "snowy") return "snowy";
  return "cloudy";
}

// 女声候选名单（中文女声优先）
// 注：getChineseFemaleVoice是function声明，会被提升，speak()可安全调用
const ZH_FEMALE_VOICE_NAMES = [
  'Microsoft Xiaoxiao',   // Windows 11 标准女声
  'Microsoft Yaoyao',     // 旧版Windows女声
  'Xiaoxiao',
  'Yaoyao',
  'Google 普通话（中国大陆）',  // Chrome内置女声
  'Tingting',             // macOS女声
  'Sinji',
];

// 获取最佳中文女声（带缓存）
let _cachedFemaleVoice: SpeechSynthesisVoice | null | undefined = undefined;
function getChineseFemaleVoice(): SpeechSynthesisVoice | null {
  if (_cachedFemaleVoice !== undefined) return _cachedFemaleVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null; // 列表未加载，稍后重试
  // 按优先级逐一匹配
  for (const name of ZH_FEMALE_VOICE_NAMES) {
    const v = voices.find(v => v.name.includes(name));
    if (v) { _cachedFemaleVoice = v; return v; }
  }
  // 回退：任zh-CN女声（名字含女性关键词）
  const zhFemale = voices.find(v => v.lang.startsWith('zh') && /female|woman|女/i.test(v.name));
  if (zhFemale) { _cachedFemaleVoice = zhFemale; return zhFemale; }
  // 最后回退：任zh-CN声音
  const zhAny = voices.find(v => v.lang === 'zh-CN' || v.lang === 'zh_CN');
  _cachedFemaleVoice = zhAny ?? null;
  return _cachedFemaleVoice;
}

// 播放单个utterance，返回Promise（播完resolve）
function speakUtterance(text: string, lang: string, rate = 0.90): Promise<void> {
  return new Promise(resolve => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = rate; // 统一语速
    utter.pitch = 1.1; // 稍高音调，更像女声
    // 统一使用中文女声
    const femaleVoice = getChineseFemaleVoice();
    if (femaleVoice) utter.voice = femaleVoice;
    const minWait = Math.max(400, text.length * (lang === 'en-US' ? 300 : 180));
    let resolved = false;
    let startTime = Date.now();
    const doResolve = () => {
      if (resolved) return;
      const elapsed = Date.now() - startTime;
      if (elapsed < minWait) {
        setTimeout(() => { resolved = true; resolve(); }, minWait - elapsed);
      } else {
        resolved = true;
        resolve();
      }
    };
    utter.onstart = () => { startTime = Date.now(); };
    utter.onend = doResolve;
    utter.onerror = doResolve;
    window.speechSynthesis.speak(utter);
  });
}

// 全局暂停引用（供speakAndWait访问，由Home组件的demoPauseRef赋値）
let _globalPauseRef: { paused: boolean; resume: (() => void) | null } | null = null;

// 语音播报（Web Speech API）
function speak(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'zh-CN';
  utter.rate = 0.95;
  utter.pitch = 1.1;
  const femaleVoice = getChineseFemaleVoice();
  if (femaleVoice) utter.voice = femaleVoice;
  window.speechSynthesis.speak(utter);
}

// 将文本整段用中文女声读（包括A I）——不再分段，避免男女声切换
function splitTextForTTS(rawText: string): Array<{text: string; lang: string}> {
  const preprocessed = rawText
    .replace(/第一步/g, '第1步')
    .replace(/第一，/g, '第1，');
  // 全部用zh-CN，不分段
  return [{ text: preprocessed, lang: 'zh-CN' }];
}

// 语音播报 + 返回 Promise（播完后 resolve）
// 支持：AI字母用en-US读、暂停/恢复
function speakAndWait(rawText: string): Promise<void> {
  return new Promise(resolve => {
    if (!('speechSynthesis' in window)) {
      setTimeout(resolve, Math.max(1500, rawText.length * 180));
      return;
    }
    const parts = splitTextForTTS(rawText);
    let idx = 0;
    // 暂停轮询interval
    let pauseCheckInterval: ReturnType<typeof setInterval> | null = null;

    const speakNext = () => {
      if (idx >= parts.length) {
        if (pauseCheckInterval) clearInterval(pauseCheckInterval);
        resolve();
        return;
      }
      const part = parts[idx++];
      speakUtterance(part.text, part.lang).then(speakNext);
    };

    // 每100ms检查暂停状态，同步到speechSynthesis
    pauseCheckInterval = setInterval(() => {
      if (!_globalPauseRef) return;
      if (_globalPauseRef.paused && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
      } else if (!_globalPauseRef.paused && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 100);

    speakNext();
  });
}

// 等待指定毫秒
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// GSAP数字滚动（直接操作DOM元素）
function animateNumber(el: HTMLElement | null, from: number, to: number, duration = 2, decimals = 1) {
  if (!el) return;
  const obj = { val: from };
  gsap.to(obj, {
    val: to,
    duration,
    ease: "power2.out",
    snap: { val: parseFloat("0." + "0".repeat(decimals - 1) + "1") },
    onUpdate() {
      el.textContent = obj.val.toFixed(decimals);
    },
  });
}

export default function Home() {
  const weatherHook = useWeather();
  const weather = weatherHook.weather;
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoWeatherType, setDemoWeatherType] = useState<WeatherType>("cloudy");
  const [isAutoDemo, setIsAutoDemo] = useState(false);
  const autoDemoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoDemoIdxRef = useRef(0);

  const [transitionFactor, setTransitionFactor] = useState(1);
  const prevWeatherRef = useRef<WeatherType>("cloudy");
  const transitionRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedStation, setSelectedStation] = useState<HeatStation | null>(null);
  const [unitViewBuilding, setUnitViewBuilding] = useState<Building | null>(null);

  // Camera controller ref
  const cameraRef = useRef<CameraControllerRef>(null);

  // Heat source logic (legacy)
  const { heatSource: _legacyHeatSource, simulatePhase } = useHeatSourceLogic();
  // Heat source dynamics (new)
  const heatSourceDynamics = useHeatSourceDynamics();
  // Phase title for cinematic display
  const PHASE_TITLES_4CHAR = ["模型加载", "数据感知", "低温预警", "AI诊断", "策略决策", "三级联动", "调控完成"];
  const [showPhaseTitle, setShowPhaseTitle] = useState(false);
  const phaseTitleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Flip states for interactive elements
  const [flippedBuilding, setFlippedBuilding] = useState<string | null>(null);
  const [flippedStation, setFlippedStation] = useState<string | null>(null);
  const [showFlipHeatSource, setShowFlipHeatSource] = useState(false);

  const BUILDING_HOUSE_RANGES: Record<string, [number, number]> = {
    // 9栋樿型：S1(1/2/3) + S2(4/5/9) + S3(7/8/6)，每栋映射到对应house_id区间
    "1": [0, 55],   "2": [56, 111],  "3": [112, 167],
    "4": [168, 223], "5": [224, 279], "9": [280, 335],
    "7": [336, 391], "8": [392, 447], "9b": [448, 499],
  };
  const [apiTemps, setApiTemps] = useState<Record<string, number>>({});
  const apiPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 动态温度波动：每3秒更新一次噪声种子，让所有楼栋温度持续微小变化
  const [noiseSeed, setNoiseSeed] = useState(0);
  const noiseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Use a ref to avoid closure issues with isDemoRunning (declared later)
  const isDemoRunningRef = useRef(false);
  useEffect(() => {
    noiseTimerRef.current = setInterval(() => {
      setNoiseSeed(prev => prev + 1);
      // 同时动态更新换热站数据（微小波动）
      if (!isDemoRunningRef.current) {
        setStations(prev => prev.map(s => {
          const t = Date.now() / 1000;
          const noise1 = Math.sin(t * 0.07 + s.id.charCodeAt(1)) * 0.4;
          const noise2 = Math.cos(t * 0.11 + s.id.charCodeAt(1) * 2) * 0.3;
          const noise3 = Math.sin(t * 0.05 + s.id.charCodeAt(1) * 3) * 2;
          const noise4 = Math.cos(t * 0.09 + s.id.charCodeAt(1)) * 0.8;
          return {
            ...s,
            supplyTemp: parseFloat(Math.max(50, Math.min(65, s.supplyTemp + noise1)).toFixed(1)),
            returnTemp: parseFloat(Math.max(40, Math.min(55, s.returnTemp + noise2)).toFixed(1)),
            flow: parseFloat(Math.max(100, Math.min(160, s.flow + noise3)).toFixed(0)),
            pressure: parseFloat(Math.max(20, Math.min(45, s.pressure + noise4)).toFixed(1)),
          };
        }));
      }
    }, 3000);
    return () => { if (noiseTimerRef.current) clearInterval(noiseTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchTemps = async () => {
      try {
        const res = await fetch("/api/model_eval");
        if (!res.ok) return;
        const data: Array<{ house_id: number; t0_act: number }> = await res.json();
        const temps: Record<string, number> = {};
        const POSITION_OFFSET: Record<string, number> = {
          // S1区：近端偏暖
          "1": +3.5, "2": +2.0, "3": +0.5,
          // S2区：中端正常，6号楼远端偏冷
          "4": +2.0, "5": +0.5, "9": -3.0,
          // S3区：近端偏暖
          "7": +2.5, "8": +1.0, "9b": -0.5,
        };
        for (const [bid, [lo, hi]] of Object.entries(BUILDING_HOUSE_RANGES)) {
          const group = data.filter(h => h.house_id >= lo && h.house_id <= hi);
          if (group.length > 0) {
            const rawAvg = group.reduce((s, h) => s + h.t0_act, 0) / group.length;
            const ratio = Math.max(0, Math.min(1, (rawAvg - 10) / (53.34 - 10)));
            const base = 16 + ratio * (24 - 16);
            const offset = POSITION_OFFSET[bid] ?? 0;
            temps[bid] = +Math.max(16, Math.min(24, base + offset)).toFixed(1);
          }
        }
        setApiTemps(temps);
      } catch { /* ignore */ }
    };
    fetchTemps();
    apiPollRef.current = setInterval(fetchTemps, 30000);
    return () => { if (apiPollRef.current) clearInterval(apiPollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showTechModal, setShowTechModal] = useState(false);
  const [stations, setStations] = useState<HeatStation[]>(INITIAL_STATIONS);
  const [mobileTab, setMobileTab] = useState<"map" | "ai" | "detail">("map");

  // ── Demo state ──────────────────────────────────────────────────────────
  const [demoPhase, setDemoPhase] = useState<DemoPhase>(0);
  const [demoStep, setDemoStep] = useState(0);  // 12步演示进度（0-12）
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  // Keep ref in sync for use in timer callbacks
  isDemoRunningRef.current = isDemoRunning;
  const [demoAiText, setDemoAiText] = useState("");
  const [demoSelectedStrategy, setDemoSelectedStrategy] = useState<string | null>(null);
  const [demoProgress, setDemoProgress] = useState(0);
  const [demoBuildingTemps, setDemoBuildingTemps] = useState<Record<string, number>>({});
  const [showPressureAlert, setShowPressureAlert] = useState(false);
  const [showWeatherIntel, setShowWeatherIntel] = useState(false);
  const [showAIModeling, setShowAIModeling] = useState(false);
  const [showStrategyComparison, setShowStrategyComparison] = useState(false);
  const [showHeatSource, setShowHeatSource] = useState(false);
  const [zoomBuilding, setZoomBuilding] = useState<Building | null>(null);
  // 热源选中状态（点击热源SVG展开48h面板）
  const [heatSourceSelected, setHeatSourceSelected] = useState(false);
  // 地图上的演示标注（直接在SVG对应位置显示）
  const [demoAnnotations, setDemoAnnotations] = useState<import('../components/HeatingSystemMap').DemoAnnotation[]>([]);
  // 演示文字框：当前播报内容
  const [demoNarration, setDemoNarration] = useState<{ step: number; title: string; text: string } | null>(null);
  // 暂停/恢复状态
  const [isDemoPaused, setIsDemoPaused] = useState(false);
  const demoPauseRef = useRef<{ paused: boolean; resume: (() => void) | null }>({ paused: false, resume: null });

  // ── 三大演示模式状态 ──────────────────────────────────────────────────
  const [demoMode, setDemoMode] = useState<DemoMode>("none");
  const [aiBrainStep, setAiBrainStep] = useState(0);
  const [aiBrainLabel, setAiBrainLabel] = useState("");
  const [isAIThinking, setIsAIThinking] = useState(false);

  const demoTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const demoAiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const demoProgressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gsapTlRef      = useRef<gsap.core.Timeline | null>(null);

  // GSAP数字滚动目标refs
  const supplyTempRef = useRef<HTMLSpanElement>(null);
  const flowRef       = useRef<HTMLSpanElement>(null);
  const buildingTempRef = useRef<HTMLSpanElement>(null);

  const clearDemoTimers = useCallback(() => {
    if (demoTimerRef.current)    clearTimeout(demoTimerRef.current);
    if (demoAiTimerRef.current)  clearInterval(demoAiTimerRef.current);
    if (demoProgressRef.current) clearInterval(demoProgressRef.current);
    gsapTlRef.current?.kill();
  }, []);

  // ── 启动演示（12步纯async串行） ────────────────────────────────────────────────────────────────────────────────
  const startDemoAbortRef = useRef<{ aborted: boolean }>({ aborted: false });
  // 跳转防重入锁（防止进度条拖拽引发多次并发跳转）
  const isJumpingRef = useRef(false);

  const startDemo = useCallback((fromStep = 0) => {
    clearDemoTimers();
    window.speechSynthesis?.cancel();

    // 重置所有状态
    setIsDemoRunning(true);
    setDemoPhase(0);
    setDemoStep(fromStep > 0 ? fromStep : 0);
    setDemoAiText("");
    setDemoSelectedStrategy(null);
    setDemoProgress(0);
    setDemoBuildingTemps({});
    setUnitViewBuilding(null);
    setShowPressureAlert(false);
    setShowWeatherIntel(false);
    setShowAIModeling(false);
    setShowStrategyComparison(false);
    setDemoAnnotations([]);
    setDemoNarration(null);
    setIsDemoPaused(false);
    demoPauseRef.current = { paused: false, resume: null };

    if (!isDemoMode) {
      weatherHook.enterDemoMode("snowy");
      setIsDemoMode(true);
      setDemoWeatherType("snowy");
    } else {
      setDemoWeatherType("snowy");
    }
    setStations(INITIAL_STATIONS.map(s => ({ ...s })));

    // 中止标志（用于stopDemo时终止async流程）
    startDemoAbortRef.current = { aborted: false };
    const abort = startDemoAbortRef.current;
    // 将demoPauseRef暴露给全局speakAndWait函数
    _globalPauseRef = demoPauseRef.current;

    // 12步纯async串行演示
    void (async () => {
      // 辅助函数：带中止检查的wait
      const waitCheck = (ms: number) => new Promise<void>(resolve => {
        if (abort.aborted) { resolve(); return; }
        const t = setTimeout(resolve, ms);
        // 每50ms轮询一次，中止时立即解除
        const check = setInterval(() => {
          if (abort.aborted) { clearTimeout(t); clearInterval(check); resolve(); }
        }, 50);
        setTimeout(() => clearInterval(check), ms + 200);
      });

      // 辅助函数：带中止检查的speakAndWait
      // 每次说话前：先cancel旧语音，等录80ms让cancel生效，再开始新语音
      const speakCheck = async (text: string, stepTitle?: string, stepNum?: number) => {
        if (abort.aborted) return;
        // 更新演示文字框
        if (stepTitle !== undefined && stepNum !== undefined) {
          setDemoNarration({ step: stepNum, title: stepTitle, text });
        } else {
          setDemoNarration(prev => prev ? { ...prev, text } : null);
        }
        window.speechSynthesis?.cancel();
        await new Promise<void>(r => setTimeout(r, 80));
        if (abort.aborted) return;
        // 暂停检查：如果暂停则等待resume
        if (demoPauseRef.current.paused) {
          await new Promise<void>(resolve => { demoPauseRef.current.resume = resolve; });
        }
        if (abort.aborted) return;
        await speakAndWait(text);
      };

      // 辅助函数：带暂停支持的waitCheck
      const pauseableWait = async (ms: number) => {
        if (abort.aborted) return;
        // 暂停检查
        if (demoPauseRef.current.paused) {
          await new Promise<void>(resolve => { demoPauseRef.current.resume = resolve; });
        }
        await waitCheck(ms);
      };

      // 进度更新（每步 = 100/12 ≈ 8.33%）
      const setStep = (step: number) => {
        if (abort.aborted) return;
        setDemoStep(step);
        setDemoProgress(Math.round((step / 12) * 100));
      };

      // 跳转到指定步骤（如果 fromStep > 0，跳过前面的步骤）
      const skipTo = fromStep;

      // ── 第0步：外部输入 ──────────────────────────────────────────────────────────────────────────────────────────────────
      if (abort.aborted) return;
      setDemoPhase(0);
      if (skipTo <= 0) {
        setStep(0);
        setShowAIModeling(true);
        setDemoAnnotations([{
          id: 'step0-weather',
          svgX: 75, svgY: 120,
          title: '🌍 外部输入',
          body: '天气·时段·用户行为',
          color: 'cyan',
          pulse: true,
          arrowDir: 'down',
        }]);
        await speakCheck("外部输入：全局外生变量持续输入。包括天气、时段、用户行为，这些因素同时影响当前室温和未来热负荷预测。", "外部输入", 0);
        await pauseableWait(4000);
      }

      // ── 第1步：室温辨识 ──────────────────────────────────────────────────────────────────
      if (abort.aborted) return;
      setDemoPhase(1);
      if (skipTo <= 1) {
        setStep(1);
        setShowAIModeling(false);
        setShowWeatherIntel(true);
        setDemoAnnotations([
          {
            id: 'step1-bldg1',
            svgX: 420, svgY: 160,
            title: '🌡️ 室温辨识',
            body: '物理+AI融合估计',
            color: 'cyan',
            pulse: true,
            arrowDir: 'down',
          },
          {
            id: 'step1-bldg9',
            svgX: 580, svgY: 430,
            title: '🌡️ 6号楼',
            body: '室温 16.0°C',
            color: 'yellow',
            pulse: true,
            arrowDir: 'down',
          },
        ]);
        await speakCheck("第一步：室温辨识。使用物理模型加热力学机理模型，融合数据驱动A I模型进行估计。基于室外气象、历史运行数据和少量真实室温测量值。", "室温辨识", 1);
        await pauseableWait(4000);
      }

      // ── 第2步：AI参数识别 ──────────────────────────────────────────────────────────────────
      if (abort.aborted) return;
      setDemoPhase(1);
      if (skipTo <= 2) {
        setStep(2);
        setShowWeatherIntel(false);
        setDemoAnnotations([{
          id: 'step2-ai',
          svgX: 75, svgY: 380,
          title: '🤖 AI参数识别',
          body: '散热系数·热惯性·保温',
          color: 'cyan',
          pulse: true,
          arrowDir: 'right',
        }]);
        await speakCheck("第二步：A I参数识别。因为真实世界太复杂，A I需要做两件事。第一，参数识别：用历史数据反推散热系数、热惯性时间常数、保温水平、供热响应速度，把纸面上的楼修正成真实运行中的楼。", "A I参数识别", 2);
        await pauseableWait(4000);
        await speakCheck("第二，误差补偿：即使机理模型计算了室温，A I还可以进一步学习修正，提高预测精度。");
        await pauseableWait(4000);
      }

      // ── 第3步：目标设定 ──────────────────────────────────────────────
      if (abort.aborted) return;
      setDemoPhase(1);
      if (skipTo <= 3) {
        setStep(3);
        setDemoAnnotations([{
          id: 'step3-target',
          svgX: 75, svgY: 200,
          title: '🎯 目标设定',
          body: '全区室温 ≥ 18°C',
          color: 'green',
          pulse: true,
          arrowDir: 'right',
        }]);
        await speakCheck("第三步：目标室温设定。策略输入：希望设定所有用户都能满足最低温超过18度。", "目标设定", 3);
        await pauseableWait(4000);
      }

      // ── 第4步：热负荷预测 ──────────────────────────────────────────────
      if (abort.aborted) return;
      setDemoPhase(2);
      if (skipTo <= 4) {
        setStep(4);
        setDemoBuildingTemps({ [DEMO_TARGET_BUILDING_ID]: DEMO_START_TEMP });
        audioEngine.playAlertBeep();
        setDemoAnnotations([
        {
          id: 'step4-heat-source',
          svgX: 75, svgY: 380,
          title: '🔥 热负荷预测',
          body: '48h四级汇总预测',
          color: 'yellow',
          pulse: true,
          arrowDir: 'right',
        },
        {
          id: 'step4-alert-bldg9',
          svgX: 580, svgY: 430,
          title: '⚠️ 6号楼低温',
          body: '室温 16.0°C < 18°C',
          color: 'red',
          pulse: true,
          arrowDir: 'down',
        },
        ]);
        await speakCheck("第四步：四级热负荷预测，预测未来48小时。根据天气、当前状态和历史数据，从户到楼栋，到换热站，再到热源，逐级汇总预测。", "热负荷预测", 4);
        await pauseableWait(4000);
      }

      // ── 第5步：差值计算 ──────────────────────────────────────────────
      if (abort.aborted) return;
      setDemoPhase(2);
      if (skipTo <= 5) {
        setStep(5);
        setShowPressureAlert(true);
      setDemoAnnotations([
        {
          id: 'step5-diff',
          svgX: 75, svgY: 300,
          title: '📊 差值计算',
          body: '目标-当前+趋势',
          color: 'yellow',
          pulse: true,
          arrowDir: 'right',
        },
        {
          id: 'step5-pressure',
          svgX: 230, svgY: 380,
          title: '⚠️ 换热站B压差',
          body: '35kPa > 阈值 30kPa',
          color: 'yellow',
          pulse: true,
          arrowDir: 'down',
        },
      ]);
        await speakCheck("第五步：差值计算。计算目标温度减去当前温度，加上预测趋势。不只是看现在冷不冷，还要看未来会不会更冷。", "差值计算", 5);
        await pauseableWait(4000);
      }

      // ── 第6步：系统决策 ──────────────────────────────────────────────
      if (abort.aborted) return;
      setDemoPhase(3);
      if (skipTo <= 6) {
        setStep(6);
        setShowPressureAlert(false);
        setShowStrategyComparison(true);
        setDemoSelectedStrategy("A");
        // AI诊断文字打字机
        let charIdx = 0;
      const typeInterval = setInterval(() => {
        charIdx += 3;
        setDemoAiText(AI_ANALYSIS_TEXT.slice(0, charIdx));
        if (charIdx >= AI_ANALYSIS_TEXT.length) clearInterval(typeInterval);
      }, 25);
      setDemoAnnotations([
        {
          id: 'step6-diag-heat-source',
          svgX: 75, svgY: 380,
          title: '🔥 热源评估',
          body: '总负荷 2420MW，充足',
          color: 'green',
          pulse: true,
          arrowDir: 'right',
        },
        {
          id: 'step6-diag-station-b',
          svgX: 230, svgY: 380,
          title: '🔍 诊断：换热站B',
          body: '远端水力失调根因',
          color: 'yellow',
          pulse: true,
          arrowDir: 'down',
        },
      ]);
        await speakCheck("第六步：系统决策。全网水力加热力优化模型计算。系统从计算需要多少热量，转换成换热站要怎么调。这一步本质是室温到热负荷到控制参数的转换。", "系统决策", 6);
        await pauseableWait(4000);
        await speakCheck("选择调控模式：定流量调控、定压差调控、供温调控、或室温闭环调控。");
        await pauseableWait(4000);
      }

      // ── 第7步：换热站调节 ──────────────────────────────────────────────
      if (abort.aborted) return;
      setDemoPhase(4);
      if (skipTo <= 7) {
        setStep(7);
        setShowStrategyComparison(false);
        audioEngine.playValveClick();
      setDemoAnnotations([
        {
          id: 'step7-station-b',
          svgX: 230, svgY: 380,
          title: '⬆️ 换热站B提升',
          body: '供温53→55°C，流量+10%',
          color: 'cyan',
          pulse: true,
          arrowDir: 'down',
        },
        {
          id: 'step7-station-a',
          svgX: 230, svgY: 200,
          title: '⬇️ 换热站A微降',
          body: '下调冗余，全网均衡',
          color: 'yellow',
          pulse: false,
        },
        {
          id: 'step7-station-c',
          svgX: 230, svgY: 580,
          title: '⬇️ 换热站C微降',
          body: '下调冗余，全网均衡',
          color: 'yellow',
          pulse: false,
        },
      ]);
      // 换热站数字滚动
      setStations(prev => prev.map(s =>
        s.id === DEMO_TARGET_STATION_ID ? { ...s, supplyTemp: 45 } : s
      ));
      animateNumber(supplyTempRef.current, 45, 47, 3, 1);
      animateNumber(flowRef.current, 100, 110, 3, 0);
      setTimeout(() => {
        setStations(prev => prev.map(s =>
          s.id === DEMO_TARGET_STATION_ID ? { ...s, supplyTemp: 47, flow: 110 } : s
        ));
      }, 3000);
        await speakCheck("第七步：开始执行。下发四级调节指令，自动调节。首先是换热站调节：调节供水温度、循环流量、管网压差，确定二网热量总量。", "换热站调节", 7);
        await pauseableWait(4000);
      }

      // ── 第8步：楼阀平衡 ──────────────────────────────────────────────
      if (abort.aborted) return;
      setDemoPhase(5);
      if (skipTo <= 8) {
        setStep(8);
      setDemoAnnotations([
        {
          id: 'step8-exec-station-b',
          svgX: 230, svgY: 380,
          title: '⚙️ 换热站B执行',
          body: '供温55°C，流量130t/h',
          color: 'cyan',
          pulse: true,
          arrowDir: 'down',
        },
        {
          id: 'step8-exec-bldg9',
          svgX: 580, svgY: 430,
          title: '🏠 楼阀平衡',
          body: '6号楼总阀 → 85%',
          color: 'cyan',
          pulse: true,
          arrowDir: 'down',
        },
      ]);
        await speakCheck("第八步：楼阀平衡。决定热量怎么分配到各楼，调节楼前阀门，让各楼分得合理。", "楼阀平衡", 8);
        await pauseableWait(4000);
      }

      // ── 第9步：户阀调节 ──────────────────────────────────────────────
      if (abort.aborted) return;
      setDemoPhase(5);
      if (skipTo <= 9) {
        setStep(9);
      setDemoAnnotations([{
        id: 'step9-exec-bldg9',
        svgX: 580, svgY: 430,
        title: '🔧 户阀调节',
        body: '末端细调，消除不均',
        color: 'cyan',
        pulse: true,
        arrowDir: 'down',
      }]);
        await speakCheck("第九步：户阀调节。末端细调，解决楼内不均匀问题。", "户阀调节", 9);
        await pauseableWait(4000);
      }

      // ── 第10步：室温变化 ──────────────────────────────────────────────
      if (abort.aborted) return;
      setDemoPhase(5);
      if (skipTo <= 10) {
        setStep(10);
        // 启动室温回升动画
      const tempObj = { val: DEMO_START_TEMP };
      gsap.to(tempObj, {
        val: DEMO_TARGET_TEMP + 0.2,
        duration: 8,
        ease: "power2.out",
        snap: { val: 0.1 },
        onUpdate() {
          setDemoBuildingTemps({ [DEMO_TARGET_BUILDING_ID]: parseFloat(tempObj.val.toFixed(1)) });
          if (buildingTempRef.current) {
            buildingTempRef.current.textContent = tempObj.val.toFixed(1);
          }
        },
      });
      setDemoAnnotations([{
        id: 'step10-temp-rise',
        svgX: 580, svgY: 430,
        title: '📈 室温上升',
          body: `${DEMO_START_TEMP}°C → 17°C → ${DEMO_TARGET_TEMP}°C`,
        color: 'green',
        pulse: true,
        arrowDir: 'down',
      }]);
        await speakCheck("第十步：室温变化反馈。举例：6号楼温度从16度，逐步上升到17度、18度。关键不是变热，而是全部收敛到目标值18度。", "室温变化", 10);
        await pauseableWait(4000);
      }

      // ── 第11步：达到目标 ──────────────────────────────────────────────
      if (abort.aborted) return;
      setDemoPhase(6);
      if (skipTo <= 11) {
        setStep(11);
        setDemoBuildingTemps({ [DEMO_TARGET_BUILDING_ID]: DEMO_TARGET_TEMP + 0.2 });
        audioEngine.playSuccessChime();
      setDemoAnnotations([
        {
          id: 'step11-done-bldg9',
          svgX: 580, svgY: 430,
          title: '✅ 6号楼已恢复',
          body: `室温 ${DEMO_TARGET_TEMP + 0.2}°C，正常`,
          color: 'green',
          pulse: false,
        },
        {
          id: 'step11-done-station-b',
          svgX: 230, svgY: 380,
          title: '✅ 换热站B稳定',
          body: '供温55°C，流量130t/h',
          color: 'green',
          pulse: false,
        },
      ]);
        await speakCheck("第十一步：达到目标值，闭环收敛。实时采集运行数据，回到第一步持续迭代。所有楼栋温度逐渐变一致，颜色统一变绿。", "闭环收敛", 11);
        await pauseableWait(4000);
      }

      // ── 第12步：诊断能力 ──────────────────────────────────────────────
      if (abort.aborted) return;
      setDemoPhase(6);
      if (skipTo <= 12) {
        setStep(12);
      setDemoAnnotations([
        {
          id: 'step12-diag-alert',
          svgX: 580, svgY: 430,
          title: '🔴 异常诊断',
          body: '供热足但室温不达标',
          color: 'red',
          pulse: true,
          arrowDir: 'down',
        },
        {
          id: 'step12-diag-ai',
          svgX: 75, svgY: 380,
          title: '🤖 AI分析',
          body: '管网问题或泄漏检测',
          color: 'yellow',
          pulse: true,
          arrowDir: 'right',
        },
      ]);
        await speakCheck("第十二步：诊断能力。如果供的热够，但室温不达标，系统会标红提示，A I模型分析问题：可能是管网问题或泄漏。", "诊断能力", 12);
        await pauseableWait(4000);
      }

      // ── 演示结束，自动重置 ──────────────────────────────────────────────
      if (abort.aborted) return;
      setDemoProgress(100);
      await waitCheck(2000);
      if (abort.aborted) return;
      setIsDemoRunning(false);
      setDemoPhase(0);
      setDemoStep(0);
      setDemoAiText("");
      setDemoSelectedStrategy(null);
      setDemoProgress(0);
      setDemoBuildingTemps({});
      setStations(INITIAL_STATIONS.map(s => ({ ...s })));
      setDemoAnnotations([]);
    })();
  }, [isDemoMode, weatherHook, clearDemoTimers]);

  const stopDemo = useCallback(() => {
    startDemoAbortRef.current.aborted = true;  // 中止 async 流程
    clearDemoTimers();
    window.speechSynthesis?.cancel();
    setIsDemoRunning(false);
    setDemoPhase(0);
    setDemoStep(0);
    setDemoAiText("");
    setDemoSelectedStrategy(null);
    setDemoProgress(0);
    setDemoBuildingTemps({});
    setStations(INITIAL_STATIONS.map(s => ({ ...s })));
    setShowPressureAlert(false);
    setShowStrategyComparison(false);
    setDemoAnnotations([]);
    setDemoNarration(null);
    setIsDemoPaused(false);
    demoPauseRef.current = { paused: false, resume: null };
  }, [clearDemoTimers]);

  // 暂停/恢复演示
  const toggleDemoPause = useCallback(() => {
    if (!isDemoRunning) return;
    const newPaused = !isDemoPaused;
    setIsDemoPaused(newPaused);
    demoPauseRef.current.paused = newPaused;
    // 同步到speechSynthesis
    if (newPaused) {
      // 暂停语音
      if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
      }
    } else {
      // 恢复语音
      if ('speechSynthesis' in window && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      // 解除async流程的暂停阻塞
      if (demoPauseRef.current.resume) {
        const resumeFn = demoPauseRef.current.resume;
        demoPauseRef.current.resume = null;
        resumeFn();
      }
    }
  }, [isDemoRunning, isDemoPaused]);

  const restartDemo = useCallback(() => {
    stopDemo();
    setTimeout(() => startDemo(), 100);
  }, [stopDemo, startDemo]);

  // 演示阶段变化时触发镜头推近 + 4字大标题
  useEffect(() => {
    if (!isDemoRunning) return;
    // 镜头控制
    if (cameraRef.current) {
      if (demoPhase === 2 || demoPhase === 3) {
        cameraRef.current.panTo(40, -20, 1.4);
      } else if (demoPhase === 5) {
        cameraRef.current.panTo(20, -10, 1.6);
      } else if (demoPhase === 0 || demoPhase === 6) {
        cameraRef.current.resetCamera(1.0);
      }
    }
    // 4字大标题（每阶段切换时显示1.5秒）
    setShowPhaseTitle(true);
    if (phaseTitleTimerRef.current) clearTimeout(phaseTitleTimerRef.current);
    phaseTitleTimerRef.current = setTimeout(() => setShowPhaseTitle(false), 1800);
    // 热源动态逻辑
    heatSourceDynamics.simulatePhase(demoPhase);
  }, [demoPhase, isDemoRunning]);

  // 热源逻辑随演示阶段更新（legacy）
  useEffect(() => {
    if (isDemoRunning) simulatePhase(demoPhase);
  }, [demoPhase, isDemoRunning, simulatePhase]);

  useEffect(() => {
    return () => clearDemoTimers();
  }, [clearDemoTimers]);

  // 预加载语音列表，确保女声缓存在首次播报前就就绪
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    // 如果列表已就绪，直接缓存
    if (window.speechSynthesis.getVoices().length > 0) {
      getChineseFemaleVoice();
      return;
    }
    // 否则监听voiceschanged事件
    const handler = () => { getChineseFemaleVoice(); };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', handler);
  }, []);

  const effectiveWeatherType: WeatherType = isDemoMode
    ? demoWeatherType
    : mapHookWeather(weather.currentWeatherType);

  useEffect(() => {
    if (effectiveWeatherType !== prevWeatherRef.current) {
      prevWeatherRef.current = effectiveWeatherType;
      setTransitionFactor(0);
      if (transitionRef.current) clearInterval(transitionRef.current);
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

  const buildings: Building[] = BASE_BUILDINGS.map(b => {
    if (demoBuildingTemps[b.id] !== undefined) {
      return { ...b, temp: demoBuildingTemps[b.id] };
    }
    return {
      ...b,
      temp: isDemoMode
        ? calcBuildingTemp(b.temp, effectiveWeatherType, transitionFactor, noiseSeed)
        : apiTemps[b.id] !== undefined
          ? +Math.max(16, Math.min(24, apiTemps[b.id] + (Math.sin(b.temp * 13.7 + noiseSeed * 1.1) * 0.5 + Math.cos(b.temp * 7.3 + noiseSeed * 0.7) * 0.3))).toFixed(1)
          : calcBuildingTempFromRealWeather(b.temp, weather.currentTemp, effectiveWeatherType, transitionFactor, noiseSeed),
    };
  });

  const enterDemoMode = useCallback((w: WeatherType) => {
    weatherHook.enterDemoMode(w);
    setIsDemoMode(true);
    setDemoWeatherType(w);
  }, [weatherHook]);

  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false);
    setIsAutoDemo(false);
    if (autoDemoRef.current) clearInterval(autoDemoRef.current);
    stopDemo();
  }, [stopDemo]);

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
        const nextW = AUTO_DEMO_SEQ[autoDemoIdxRef.current];
        setDemoWeatherType(nextW);
        weatherHook.setDemoWeatherType(nextW); // keep WeatherBar in sync
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
    setUnitViewBuilding(null);
    setMobileTab("detail");
    // 触发楼栋放大弹出视图
    setZoomBuilding(b);
  }, []);

  const handleSelectStation = useCallback((s: HeatStation) => {
    setSelectedStation(s);
    setSelectedBuilding(null);
    setUnitViewBuilding(null);
    setMobileTab("detail");
  }, []);

  const handleDrillToUnit = useCallback((b: Building) => {
    setUnitViewBuilding(b);
  }, []);

  // 稳定的onAnnotationsChange回调，避免ColdWaveDemo/FiveStepLoop的useEffect无限循环
  const handleAnnotationsChange = useCallback((anns: import('../components/HeatingSystemMap').DemoAnnotation[]) => {
    setDemoAnnotations(anns);
  }, []);

  const handleBackFromUnit = useCallback(() => {
    setUnitViewBuilding(null);
  }, []);

  // ── 面包屑导航 ──────────────────────────────────────────────────────────
  type BreadcrumbItem = { label: string; action?: () => void };
  const breadcrumb: BreadcrumbItem[] = (() => {
    const items: BreadcrumbItem[] = [
      { label: "总览", action: () => { setSelectedBuilding(null); setSelectedStation(null); setUnitViewBuilding(null); } },
    ];
    if (selectedStation || selectedBuilding) {
      const stationName = selectedStation?.name
        ?? (selectedBuilding?.stationId === "S1" ? "换热站A"
          : selectedBuilding?.stationId === "S2" ? "换热站B"
          : "换热站C");
      items.push({ label: stationName, action: () => { setUnitViewBuilding(null); setSelectedBuilding(null); } });
    }
    if (selectedBuilding) {
      items.push({ label: selectedBuilding.name, action: () => setUnitViewBuilding(null) });
    }
    if (unitViewBuilding) {
      items.push({ label: "户端" });
    }
    return items;
  })();

  // ── 焦点遮罩（预警/诊断阶段） ──────────────────────────────────────────
  const showFocusMask = isDemoRunning && (demoPhase === 2 || demoPhase === 3);

  // 当前换热站B数据
  const stationB = stations.find(s => s.id === DEMO_TARGET_STATION_ID);

  return (
    <div className="app-shell" style={{ paddingBottom: 56 }}>
      {/* Top weather bar */}
      <WeatherBar
        weather={weather}
        isDemoMode={isDemoMode}
        onEnterDemo={enterDemoMode}
        onExitDemo={handleExitDemo}
        onSetDemoWeather={(w) => {
          if (!isDemoMode) enterDemoMode(w);
          else {
            setDemoWeatherType(w);
            weatherHook.setDemoWeatherType(w); // sync hook's demoWeather so WeatherBar shows correct selected state
          }
        }}
        isAutoDemo={isAutoDemo}
        onToggleAutoDemo={handleToggleAutoDemo}
      />

      {/* Mobile tab bar */}
      <div className="mobile-tab-bar">
        {[
          { id: "map" as const, icon: "🗺️", label: "管网图" },
          { id: "ai" as const, icon: "🧠", label: "AI智脑" },
          { id: "detail" as const, icon: "📊", label: (selectedBuilding || selectedStation) ? (selectedBuilding ? selectedBuilding.name : selectedStation!.name) : "详情" },
        ].map(tab => (
          <button key={tab.id}
            className={`mobile-tab-btn ${mobileTab === tab.id ? "active" : ""}`}
            onClick={() => setMobileTab(tab.id)}>
            <span style={{ fontSize: 16 }}>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.id === "detail" && (selectedBuilding || selectedStation) && (
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5B7FD4", display: "inline-block", marginLeft: 2 }} />
            )}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="main-content">
        {/* Left: AI Dispatch Panel */}
        <div className={`left-panel mobile-tab-content ${mobileTab === "ai" ? "mobile-tab-active" : ""}`}>

          {/* AI Brain Panel */}
          <AIBrainPanel
            demoPhase={demoPhase}
            isDemoRunning={isDemoRunning}
            alertBuilding={isDemoRunning && demoPhase >= 2 ? "6号楼" : undefined}
            alertTemp={isDemoRunning && demoPhase >= 2 ? (demoBuildingTemps["9"] ?? DEMO_START_TEMP) : undefined}
            beamTargetId={isDemoRunning && (demoPhase === 2 || demoPhase === 5) ? "building-9" : undefined}
          />

          {/* 热源负荷进度条 */}
          <div style={{
            padding: "6px 12px",
            borderBottom: "1px solid rgba(0,180,255,0.08)",
            background: "rgba(0,8,30,0.7)",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "center" }}>
              <span style={{ fontSize: 9.5, color: "rgba(100,160,220,0.6)", fontFamily: "'Noto Sans SC', sans-serif" }}>🔥 热源负荷</span>
              <span style={{
                fontSize: 9.5, fontWeight: 700,
                color: heatSourceDynamics.loadPercent >= 90 ? "#FF4444" : heatSourceDynamics.loadPercent >= 70 ? "#FFB347" : "#00FF9D",
                fontFamily: "'Share Tech Mono', monospace",
              }}>
                {heatSourceDynamics.heatSource.currentLoad}MW / {heatSourceDynamics.heatSource.capacity}MW
              </span>
            </div>
            <div style={{ height: 5, borderRadius: 2.5, background: "rgba(0,40,100,0.4)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2.5,
                width: `${heatSourceDynamics.loadPercent}%`,
                background: heatSourceDynamics.loadPercent >= 90
                  ? "linear-gradient(90deg, #FF4444, #FF8800)"
                  : heatSourceDynamics.loadPercent >= 70
                  ? "linear-gradient(90deg, #FF8800, #FFD700)"
                  : "linear-gradient(90deg, #00A8FF, #00FF9D)",
                transition: "width 0.5s ease, background 0.5s ease",
                boxShadow: heatSourceDynamics.loadPercent >= 90 ? "0 0 8px rgba(255,60,60,0.7)" : "0 0 6px rgba(0,200,255,0.4)",
                animation: heatSourceDynamics.loadPercent >= 90 ? "ai-blink 0.8s infinite" : undefined,
              }} />
            </div>
          </div>



           {/* 能耗数据行（节能% + 减碳kg/h，原能耗看板数据整合至此） */}
          <EnergyInlineBar demoPhase={demoPhase} isExecuting={isDemoRunning && demoPhase === 5} />
          {/* 热源预测快捷按钮已移除：点击地图左上角热源卡片直接展开48h预测 */}
          {/* 全区室温分布Dashboard */}
          <div style={{ padding: '6px 8px', borderBottom: '1px solid rgba(0,180,255,0.08)' }}>
            <RoomTempDashboard
              buildings={buildings.map(b => {
                const curTemp = demoBuildingTemps[b.id] ?? b.temp;
                // 简单计算12h预测温度（基于天气趋势）
                const trendMap: Record<string, number> = { sunny: 0.08, cloudy: -0.05, rainy: -0.14, snowy: -0.22 };
                const trend = trendMap[effectiveWeatherType] ?? -0.05;
                const predicted12h = Math.max(14, Math.min(26, curTemp + trend * 12));
                return {
                  id: b.id,
                  name: b.name,
                  temp: curTemp,
                  stationId: b.stationId,
                  predicted12h,
                };
              })}
              demoPhase={demoPhase}
              isDemoRunning={isDemoRunning}
              targetTemp={22}
            />
          </div>

          {/* 系统全流程演示按钮 */}
          <div style={{
            padding: "6px 12px",
            borderBottom: "1px solid rgba(0,180,255,0.08)",
            background: "rgba(0,12,40,0.5)",
            flexShrink: 0,
          }}>
            {!isDemoRunning ? (
              <button onClick={() => startDemo()} style={{
                width: "100%", padding: "6px 12px", borderRadius: 8,
                border: "1px solid rgba(0,212,255,0.3)",
                background: "rgba(0,80,180,0.2)",
                color: "rgba(0,212,255,0.7)", fontSize: 11, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontFamily: "'Noto Sans SC', sans-serif",
              }}>
                <span>▶</span> 系统全流程演示
              </button>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#00D4FF", fontFamily: "'Noto Sans SC', sans-serif" }}>
                    {DEMO_12_STAGES[demoStep]?.shortLabel ?? "演示中"}
                  </span>
                  <span style={{ fontSize: 10, color: "rgba(100,180,255,0.6)", fontFamily: "'Share Tech Mono', monospace" }}>
                    {Math.round(demoProgress)}%
                  </span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(0,60,150,0.3)", overflow: "hidden", marginBottom: 5 }}>
                  <div style={{
                    height: "100%", borderRadius: 2,
                    width: `${demoProgress}%`,
                    background: "linear-gradient(90deg, #1A56DB, #00D4FF)",
                    transition: "width 0.1s linear",
                  }} />
                </div>
                <button onClick={stopDemo} style={{
                  width: "100%", padding: "4px 10px", borderRadius: 6,
                  border: "1px solid rgba(255,80,100,0.3)",
                  background: "rgba(200,20,40,0.1)",
                  color: "rgba(255,120,140,0.8)", fontSize: 10, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'Noto Sans SC', sans-serif",
                }}>■ 停止演示</button>
              </div>
            )}
          </div>
          <AIDispatchPanel
            buildings={buildings}
            weather={effectiveWeatherType}
            outdoorTemp={weather.currentTemp}
            transitionFactor={transitionFactor}
            onSelectBuilding={handleSelectBuilding}
            onShowTechModal={() => setShowTechModal(false)}
            isAutoDemo={isAutoDemo}
            onToggleAutoDemo={handleToggleAutoDemo}
          />
        </div>

        {/* Center: Map */}
        <div className={`flex-1 overflow-visible relative mobile-tab-content ${mobileTab === "map" ? "mobile-tab-active" : ""}`} style={{ paddingBottom: 72 }}>

          {/* ── 焦点遣罩（预警/诊断阶段） ── */}
          {showFocusMask && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 10,
              pointerEvents: "none",
              background: "radial-gradient(circle at 70% 60%, transparent 150px, rgba(0,0,0,0.85) 250px)",
              transition: "opacity 0.5s",
            }} />
          )}

          {/* ── 面包屑导航（顶部固定） ── */}
          {breadcrumb.length > 1 && (
            <div style={{
              position: "absolute", top: 8, left: 12, zIndex: 20,
              display: "flex", alignItems: "center", gap: 4,
              padding: "5px 12px", borderRadius: 20,
              background: "rgba(0,15,50,0.9)",
              border: "1px solid rgba(0,180,255,0.25)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
              backdropFilter: "blur(8px)",
            }}>
              {breadcrumb.map((crumb, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {i > 0 && <span style={{ color: "rgba(0,180,255,0.4)", fontSize: 10 }}>›</span>}
                  <span
                    style={{
                      fontSize: 10, fontWeight: i === breadcrumb.length - 1 ? 700 : 500,
                      color: i === breadcrumb.length - 1 ? "#00D4FF" : "rgba(148,210,255,0.55)",
                      fontFamily: "'Noto Sans SC', sans-serif",
                      cursor: crumb.action ? "pointer" : "default",
                      transition: "color 0.2s",
                    }}
                    onClick={crumb.action}
                  >
                    {crumb.label}
                  </span>
                </span>
              ))}
            </div>
          )}

          {/* ── Phase 0: 算法训练横幅 ── */}
          {isDemoRunning && demoPhase === 0 && (
            <div style={{
              position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
              zIndex: 20,
              background: "rgba(0,20,60,0.95)",
              border: "2px solid rgba(0,180,255,0.5)",
              borderRadius: 12, padding: "10px 20px",
              display: "flex", alignItems: "center", gap: 12,
              boxShadow: "0 0 30px rgba(0,180,255,0.3)",
              minWidth: 320,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(0,80,200,0.2)", border: "2px solid rgba(0,180,255,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0,
                animation: "spin 2s linear infinite",
              }}>⚙</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#00D4FF", fontFamily: "'Noto Sans SC', sans-serif" }}>
                  算法模型加载中
                </div>
                <div style={{ fontSize: 11, color: "rgba(100,180,255,0.7)", fontFamily: "'Share Tech Mono', monospace", marginTop: 2 }}>
                  室温辨识AI · 供热预测模型 · 水力平衡算法
                </div>
              </div>
              <div style={{
                marginLeft: "auto", padding: "4px 10px", borderRadius: 6,
                background: "rgba(0,80,200,0.2)", border: "1px solid rgba(0,180,255,0.3)",
                fontSize: 11, fontWeight: 700, color: "#00D4FF",
                fontFamily: "'Share Tech Mono', monospace", flexShrink: 0,
                animation: "ai-blink 1s infinite",
              }}>LOADING</div>
            </div>
          )}

          {/* ── Phase 2: 预警横幅 ── */}
          {isDemoRunning && demoPhase === 2 && (
            <div style={{
              position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
              zIndex: 20,
              background: "rgba(30,5,10,0.95)",
              border: "2px solid rgba(255,60,60,0.7)",
              borderRadius: 12, padding: "10px 20px",
              display: "flex", alignItems: "center", gap: 12,
              boxShadow: "0 0 30px rgba(255,60,60,0.4), 0 8px 32px rgba(0,0,0,0.5)",
              animation: "pulse-border 0.8s ease-in-out infinite",
              minWidth: 320,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(200,20,20,0.2)", border: "2px solid rgba(255,60,60,0.6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0, boxShadow: "0 0 12px rgba(255,60,60,0.4)",
              }}>⚠️</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#FF6060", fontFamily: "'Noto Sans SC', sans-serif", textShadow: "0 0 10px rgba(255,60,60,0.5)" }}>
                  低温告警 — 6号楼
                </div>
                <div style={{ fontSize: 11, color: "rgba(200,180,180,0.7)", fontFamily: "'Share Tech Mono', monospace", marginTop: 2 }}>
                  室温 16.0°C · 低于设定値 18°C · 换热站B远端
                </div>
              </div>
              <div style={{
                marginLeft: "auto", padding: "4px 10px", borderRadius: 6,
                background: "rgba(200,20,20,0.2)", border: "1px solid rgba(255,60,60,0.4)",
                fontSize: 11, fontWeight: 700, color: "#FF6060",
                fontFamily: "'Share Tech Mono', monospace", flexShrink: 0,
                textShadow: "0 0 8px rgba(255,60,60,0.5)",
              }}>ALERT</div>
            </div>
          )}

          {/* ── Phase 6: 完成横幅 ── */}
          {isDemoRunning && demoPhase === 6 && (
            <div style={{
              position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
              zIndex: 20,
              background: "rgba(5,25,15,0.95)",
              border: "2px solid rgba(0,220,100,0.6)",
              borderRadius: 12, padding: "10px 20px",
              display: "flex", alignItems: "center", gap: 12,
              boxShadow: "0 0 30px rgba(0,220,100,0.35), 0 8px 32px rgba(0,0,0,0.5)",
              minWidth: 320,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(0,180,80,0.15)", border: "2px solid rgba(0,220,100,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0, boxShadow: "0 0 12px rgba(0,220,100,0.4)",
              }}>✅</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#00FF9D", fontFamily: "'Noto Sans SC', sans-serif", textShadow: "0 0 10px rgba(0,220,100,0.5)" }}>
                  调控完成 — 6号楼室温恢复正常
                </div>
                <div style={{ fontSize: 11, color: "rgba(150,220,180,0.7)", fontFamily: "'Share Tech Mono', monospace", marginTop: 2 }}>
                  室温 18.2°C · 换热站B供温 55°C · 流量 130 t/h
                </div>
              </div>
              <div style={{
                marginLeft: "auto", padding: "4px 10px", borderRadius: 6,
                background: "rgba(0,180,80,0.15)", border: "1px solid rgba(0,220,100,0.35)",
                fontSize: 11, fontWeight: 700, color: "#00FF9D",
                fontFamily: "'Share Tech Mono', monospace", flexShrink: 0,
                textShadow: "0 0 8px rgba(0,220,100,0.5)",
              }}>DONE</div>
            </div>
          )}

          {/* 热惰性指示 */}
          {transitionFactor < 0.98 && !isDemoRunning && (
            <div className="absolute top-3 left-1/2 z-10" style={{
              transform: "translateX(-50%)",
              background: "rgba(0,15,50,0.92)",
              border: "1px solid rgba(0,180,255,0.25)",
              borderRadius: 10, padding: "5px 14px",
              display: "flex", alignItems: "center", gap: 10,
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#F97316", animation: "blink 1s infinite" }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#FB923C", fontFamily: "'Noto Sans SC', sans-serif" }}>热惰性响应中</span>
            </div>
          )}

          {/* 4字大标题（阶段切换时全屏显示1.8秒） */}
          {isDemoRunning && showPhaseTitle && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 40,
              display: "flex", alignItems: "center", justifyContent: "center",
              pointerEvents: "none",
              background: "rgba(0,5,20,0.6)",
              backdropFilter: "blur(2px)",
              animation: "phase-title-in 0.4s ease",
            }}>
              <div style={{
                fontSize: 52, fontWeight: 900,
                color: demoPhase === 2 ? "#FF4444" : demoPhase === 6 ? "#00FF9D" : "#00D4FF",
                fontFamily: "'Noto Sans SC', sans-serif",
                letterSpacing: 12,
                textShadow: `0 0 40px ${demoPhase === 2 ? "rgba(255,60,60,0.8)" : demoPhase === 6 ? "rgba(0,220,100,0.8)" : "rgba(0,212,255,0.8)"}`,
                textAlign: "center",
              }}>
                {PHASE_TITLES_4CHAR[demoPhase]}
              </div>
            </div>
          )}

          {/* ── 地图渲染区域（bottom:72px避开底部工具栏，确保最下方楼栋可点击） ── */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 72, overflow: 'visible' }}>
          <CinematicScene enableParallax={!isDemoRunning}>
            <CameraController ref={cameraRef}>
              <HeatingSystemMap
                buildings={buildings}
                stations={stations}
                weather={effectiveWeatherType}
                onSelectBuilding={handleSelectBuilding}
                onSelectStation={handleSelectStation}
                onSelectHeatSource={() => setHeatSourceSelected(prev => !prev)}
                selectedBuildingId={selectedBuilding?.id ?? undefined}
                selectedStationId={selectedStation?.id ?? undefined}
                demoPhase={demoPhase}
                demoTargetBuildingId={isDemoRunning ? DEMO_TARGET_BUILDING_ID : undefined}
                demoHighlightZone={isDemoRunning && demoPhase >= 5 ? DEMO_TARGET_STATION_ID : undefined}
                demoAnnotations={demoAnnotations}
                heatSourceSelected={heatSourceSelected}
              />
            </CameraController>
          </CinematicScene>
          </div>{/* end map render area */}

          {/* ── 天气视觉效果层（在CinematicScene之后渲染，确保覆盖在地图之上） ── */}

          {effectiveWeatherType === 'sunny' && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none',
              overflow: 'hidden',
            }}>
              {/* 顶部渐变光晕（仅顶部，不遮挡楼栋） */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '35%',
                background: 'linear-gradient(180deg, rgba(224,246,255,0.55) 0%, rgba(212,238,255,0.25) 60%, transparent 100%)',
                animation: 'sunFadeIn 1.5s ease forwards',
              }} />
              {/* 太阳 + 12条光芒 SVG（整体旋转，中心对准太阳） */}
              <svg
                style={{
                  position: 'absolute',
                  top: -30,
                  right: -30,
                  width: 320,
                  height: 320,
                  animation: 'sunRotate 10s linear infinite',
                  transformOrigin: '160px 160px',
                  overflow: 'visible',
                }}
                viewBox="0 0 320 320"
              >
                {/* 12条光芒 */}
                {[0,30,60,90,120,150,180,210,240,270,300,330].map((angle, i) => (
                  <line
                    key={i}
                    x1="160" y1="160"
                    x2={160 + Math.cos((angle - 90) * Math.PI / 180) * 155}
                    y2={160 + Math.sin((angle - 90) * Math.PI / 180) * 155}
                    stroke={`rgba(255,220,50,${0.55 + (i % 3) * 0.1})`}
                    strokeWidth={i % 3 === 0 ? 4 : 2.5}
                    strokeLinecap="round"
                  />
                ))}
                {/* 太阳外晕 */}
                <circle cx="160" cy="160" r="100" fill="rgba(255,230,80,0.12)" />
                <circle cx="160" cy="160" r="80" fill="rgba(255,220,50,0.22)" />
                {/* 太阳本体 */}
                <circle cx="160" cy="160" r="62" fill="url(#sunGrad)" />
                <defs>
                  <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFFDE0" />
                    <stop offset="40%" stopColor="#FFE040" />
                    <stop offset="80%" stopColor="#FFB800" />
                    <stop offset="100%" stopColor="rgba(255,160,0,0)" />
                  </radialGradient>
                </defs>
              </svg>
              {/* 太阳光晕（不旋转，固定在右上角） */}
              <div style={{
                position: 'absolute', top: 50, right: 50,
                width: 180, height: 180,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,240,100,0.0) 40%, rgba(255,220,50,0.18) 65%, rgba(255,200,30,0.08) 80%, transparent 100%)',
                boxShadow: '0 0 80px 40px rgba(255,220,50,0.30)',
                animation: 'sunRise 1.5s ease forwards',
              }} />
              {/* 晴天无云 — 仅保留太阳光效 */}
            </div>
          )}

          {/* 多云：3朵明显云彩飘动 */}
          {effectiveWeatherType === 'cloudy' && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none',
              overflow: 'hidden',
            }}>
              {/* 顶部淡灰蓝渐变（仅顶部，不遮挡楼栋） */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '30%',
                background: 'linear-gradient(180deg, rgba(176,196,222,0.50) 0%, rgba(168,188,218,0.20) 60%, transparent 100%)',
                animation: 'cloudFadeIn 2s ease forwards',
              }} />
              {/* 云 1（最大，最明显，右上） */}
              <div style={{
                position: 'absolute', top: 15, right: '8%',
                width: 300, height: 95,
                background: 'rgba(230,238,252,0.82)',
                borderRadius: '60px',
                boxShadow: '0 8px 32px rgba(180,205,240,0.55), inset 0 -4px 12px rgba(160,185,220,0.2)',
                animation: 'cloudFloat2 26s linear infinite',
              }}>
                {/* 云顶凸起 */}
                <div style={{
                  position: 'absolute', top: -35, left: '25%',
                  width: 110, height: 75,
                  background: 'rgba(235,242,255,0.80)',
                  borderRadius: '50%',
                }} />
                <div style={{
                  position: 'absolute', top: -22, left: '52%',
                  width: 80, height: 55,
                  background: 'rgba(232,240,255,0.75)',
                  borderRadius: '50%',
                }} />
              </div>
              {/* 云 2（左侧，中等） */}
              <div style={{
                position: 'absolute', top: -5, left: '-5%',
                width: 280, height: 85,
                background: 'rgba(225,235,250,0.78)',
                borderRadius: '55px',
                boxShadow: '0 6px 28px rgba(170,198,235,0.50)',
                animation: 'cloudFloat1 34s linear 4s infinite',
              }}>
                <div style={{
                  position: 'absolute', top: -28, left: '30%',
                  width: 100, height: 65,
                  background: 'rgba(230,240,255,0.75)',
                  borderRadius: '50%',
                }} />
              </div>
              {/* 云 3（中间偏下，较小） */}
              <div style={{
                position: 'absolute', top: 65, left: '38%',
                width: 220, height: 68,
                background: 'rgba(218,230,248,0.72)',
                borderRadius: '50px',
                boxShadow: '0 5px 22px rgba(160,190,225,0.42)',
                animation: 'cloudFloat2 44s linear 9s infinite',
              }}>
                <div style={{
                  position: 'absolute', top: -20, left: '20%',
                  width: 85, height: 52,
                  background: 'rgba(225,236,252,0.70)',
                  borderRadius: '50%',
                }} />
              </div>
            </div>
          )}

          {/* 雪天：40个雪花粒子 */}
          {effectiveWeatherType === 'snowy' && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none',
              overflow: 'hidden',
            }}>
              {/* 顶部淡蓝渐变（仅顶部装饰，不遮挡楼栋） */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '25%',
                background: 'linear-gradient(180deg, rgba(100,140,200,0.30) 0%, rgba(80,120,180,0.10) 60%, transparent 100%)',
              }} />
              {/* 40个雪花 */}
              {Array.from({ length: 40 }).map((_, i) => {
                const size = 5 + (i % 6) * 2;
                const left = (i * 2.5) % 100;
                const dur = 4 + (i % 6) * 0.7;
                const delay = (i % 10) * 0.5;
                const swing = (i % 2 === 0) ? 'snowFallSwingL' : 'snowFallSwingR';
                return (
                  <div key={i} style={{
                    position: 'absolute',
                    top: `-${size + 5}px`,
                    left: `${left}%`,
                    width: size, height: size,
                    borderRadius: '50%',
                    background: 'rgba(230,242,255,0.92)',
                    boxShadow: `0 0 ${size}px rgba(200,225,255,0.7)`,
                    animation: `${swing} ${dur}s ease-in-out ${delay}s infinite`,
                  }} />
                );
              })}
            </div>
          )}

          {/* 雨天：80个雨滴 */}
          {effectiveWeatherType === 'rainy' && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none',
              overflow: 'hidden',
            }}>
              {/* 顶部暗色渐变（仅顶部装饰，不遮挡楼栋） */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '20%',
                background: 'linear-gradient(180deg, rgba(20,40,80,0.35) 0%, rgba(15,30,65,0.12) 60%, transparent 100%)',
              }} />
              {/* 80个雨滴 */}
              {Array.from({ length: 80 }).map((_, i) => {
                const left = (i * 1.25) % 100;
                const dur = 0.45 + (i % 6) * 0.08;
                const delay = (i % 12) * 0.06;
                const height = 16 + (i % 4) * 5;
                return (
                  <div key={i} style={{
                    position: 'absolute',
                    top: `-${height + 5}px`,
                    left: `${left}%`,
                    width: 1.5,
                    height,
                    background: 'linear-gradient(to bottom, transparent, rgba(140,190,255,0.75), transparent)',
                    borderRadius: 1,
                    transform: 'rotate(8deg)',
                    animation: `rainFall ${dur}s linear ${delay}s infinite`,
                  }} />
                );
              })}
            </div>
          )}


          {/* PipeTwinDemo 已移除 — 去掉橙黄色流动粒子 */}

          {/* 能耗看板已整合至左侧面板 */}

          {/* 热惰性公式动画（气象预警阶段） */}
          <ThermalInertiaFormula
            visible={showWeatherIntel}
            targetTemp={22}
            deltaTemp={5}
            tau={2.5}
            onComplete={() => setShowWeatherIntel(false)}
          />

          {/* 热量流失诊断（点击低温楼栋触发） */}
          <HeatLossDiagnostic
            buildingId={isDemoRunning && demoPhase >= 2 ? DEMO_TARGET_BUILDING_ID : null}
            buildingName="6号楼"
            temperature={demoBuildingTemps[DEMO_TARGET_BUILDING_ID] ?? DEMO_START_TEMP}
            position={{ x: 600, y: 300 }}
            onClose={() => {}}
          />

          {/* 热源选中后展开48h预测面板（左上角，不遮挡地图主体） */}
          {heatSourceSelected && (
            <div style={{
              position: "absolute", top: 8, left: 8, zIndex: 30,
              width: 300,
              background: "rgba(0,15,50,0.97)",
              border: "1.5px solid rgba(0,255,180,0.5)",
              borderRadius: 14,
              padding: "14px 16px",
              boxShadow: "0 0 32px rgba(0,255,180,0.15), 0 8px 32px rgba(0,0,0,0.6)",
              backdropFilter: "blur(12px)",
            }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00FFB4", boxShadow: "0 0 8px #00FFB4" }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#00FFB4", fontFamily: "'Noto Sans SC', sans-serif" }}>热源 · 48h负荷预测</span>
                </div>
                <button onClick={() => setHeatSourceSelected(false)} style={{
                  background: "none", border: "none", color: "rgba(0,255,180,0.6)",
                  fontSize: 16, cursor: "pointer", padding: "0 4px", lineHeight: 1,
                }}>×</button>
              </div>
              {/* Current metrics */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
                {[
                  { label: "当前负荷", value: `${heatSourceDynamics.heatSource.currentLoad}kW`, color: "#00FFB4" },
                  { label: "供水温", value: `${stations[0]?.supplyTemp ?? 50}℃`, color: "#7DD3FC" },
                  { label: "循环流量", value: `${stations[0]?.flow ?? 108}t/h`, color: "#A78BFA" },
                ].map(m => (
                  <div key={m.label} style={{ background: "rgba(0,40,80,0.6)", borderRadius: 8, padding: "6px 8px", border: `1px solid ${m.color}30` }}>
                    <div style={{ fontSize: 8, color: "rgba(148,210,255,0.6)", marginBottom: 2 }}>{m.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: m.color, fontFamily: "'Share Tech Mono', monospace" }}>{m.value}</div>
                  </div>
                ))}
              </div>
              {/* Weather factors */}
              <div style={{ marginBottom: 10, padding: "8px 10px", background: "rgba(0,30,70,0.5)", borderRadius: 8, border: "1px solid rgba(0,180,255,0.15)" }}>
                <div style={{ fontSize: 8.5, fontWeight: 700, color: "rgba(125,211,252,0.8)", marginBottom: 6, fontFamily: "'Noto Sans SC', sans-serif" }}>天气因素分析</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  {[
                    { icon: "🌡️", label: "室外温度", value: `${weather.currentTemp.toFixed(1)}℃` },
                    { icon: "💨", label: "风速", value: "3.2m/s" },
                    { icon: "☀️", label: "日照强度", value: "42W/m²" },
                    { icon: "💧", label: "相对湿度", value: "68%" },
                  ].map(f => (
                    <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 10 }}>{f.icon}</span>
                      <span style={{ fontSize: 8, color: "rgba(148,210,255,0.6)" }}>{f.label}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#7DD3FC", marginLeft: "auto", fontFamily: "'Share Tech Mono', monospace" }}>{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* 48h chart with Y-axis (0-3000 MW) */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 8.5, fontWeight: 700, color: "rgba(125,211,252,0.8)", marginBottom: 6, fontFamily: "'Noto Sans SC', sans-serif" }}>48小时负荷曲线</div>
                {/* Chart area: left 32px for Y-axis labels, right area for chart */}
                <div style={{ display: 'flex', gap: 0 }}>
                  {/* Y-axis labels */}
                  <svg width={32} height={90} viewBox="0 0 32 90" style={{ flexShrink: 0 }}>
                    {/* Y-axis line */}
                    <line x1={30} y1={5} x2={30} y2={75} stroke="rgba(0,180,255,0.3)" strokeWidth={0.8} />
                    {/* Y-axis ticks and labels: 3000/2500/2000/1500/1000/500/0 MW */}
                    {[3000,2500,2000,1500,1000,500,0].map((v, i) => {
                      const yPos = 5 + (i / 6) * 70;
                      return (
                        <g key={v}>
                          <line x1={26} y1={yPos} x2={30} y2={yPos} stroke="rgba(0,180,255,0.4)" strokeWidth={0.8} />
                          <text x={24} y={yPos + 2.5} textAnchor="end" fontSize={5.5} fill="rgba(148,210,255,0.7)" fontFamily="monospace">
                            {v >= 1000 ? `${v/1000}k` : v === 0 ? '0' : `${v}`}
                          </text>
                        </g>
                      );
                    })}
                    <text x={8} y={50} fontSize={5.5} fill="rgba(148,210,255,0.5)" fontFamily="monospace"
                      transform="rotate(-90, 8, 50)">MW</text>
                  </svg>
                  {/* Main chart */}
                  <svg width="100%" height={90} viewBox="0 0 236 90" style={{ flex: 1 }}>
                    {/* Background grid */}
                    {[0,1,2,3,4,5,6].map(i => (
                      <line key={i} x1={0} y1={5 + i*(70/6)} x2={236} y2={5 + i*(70/6)}
                        stroke="rgba(0,180,255,0.08)" strokeWidth={0.5} />
                    ))}
                    {/* Vertical time grid (every 6h) */}
                    {[0,6,12,18,24,30,36,42,48].map((h, i) => (
                      <g key={h}>
                        <line x1={i*(236/8)} y1={5} x2={i*(236/8)} y2={75}
                          stroke="rgba(0,180,255,0.06)" strokeWidth={0.5} />
                        <text x={i*(236/8)} y={83} textAnchor="middle" fontSize={5.5}
                          fill="rgba(148,210,255,0.5)" fontFamily="monospace">{h}h</text>
                      </g>
                    ))}
                    {/* Predicted load curve (0-3000MW mapped to y 5-75) */}
                    <polyline
                      points={Array.from({length:25},(_,i)=>{
                        const x = i*(236/24);
                        // MW values: base ~2400, weather effect, daily cycle
                        const weatherEffect = effectiveWeatherType === "snowy" ? 400 : effectiveWeatherType === "rainy" ? 200 : -150;
                        const mw = 2400 + weatherEffect + Math.sin(i*0.4)*300 + (i>12?-200:200);
                        const clampedMw = Math.max(0, Math.min(3000, mw));
                        const y = 5 + (1 - clampedMw/3000) * 70;
                        return `${x},${y}`;
                      }).join(" ")}
                      fill="none" stroke="rgba(255,150,50,0.8)" strokeWidth={1.5} strokeDasharray="4 2"
                    />
                    {/* Actual load curve (first 24h) */}
                    <polyline
                      points={Array.from({length:13},(_,i)=>{
                        const x = i*(236/24);
                        const weatherEffect = effectiveWeatherType === "snowy" ? 380 : effectiveWeatherType === "rainy" ? 180 : -130;
                        const mw = 2380 + weatherEffect + Math.sin(i*0.4)*280;
                        const clampedMw = Math.max(0, Math.min(3000, mw));
                        const y = 5 + (1 - clampedMw/3000) * 70;
                        return `${x},${y}`;
                      }).join(" ")}
                      fill="none" stroke="rgba(0,212,255,0.9)" strokeWidth={2}
                    />
                    {/* Current time line (at x=6h mark) */}
                    <line x1={6*(236/24)} y1={5} x2={6*(236/24)} y2={75}
                      stroke="rgba(0,255,180,0.6)" strokeWidth={1} strokeDasharray="3 2" />
                    <text x={6*(236/24)+2} y={12} fontSize={5.5} fill="rgba(0,255,180,0.8)" fontFamily="monospace">当前</text>
                    {/* Peak label */}
                    {(() => {
                      const weatherEffect = effectiveWeatherType === "snowy" ? 400 : effectiveWeatherType === "rainy" ? 200 : -150;
                      const peakMw = Math.round(2400 + weatherEffect + 300 + 200);
                      const peakX = 0*(236/24);
                      const peakY = 5 + (1 - Math.min(3000, peakMw)/3000) * 70;
                      return (
                        <g>
                          <circle cx={peakX} cy={peakY} r={3} fill="rgba(255,150,50,0.9)" />
                          <text x={peakX+4} y={peakY-2} fontSize={5.5} fill="rgba(255,150,50,0.9)" fontFamily="monospace">峰{peakMw}MW</text>
                        </g>
                      );
                    })()}
                    {/* Valley label */}
                    {(() => {
                      const weatherEffect = effectiveWeatherType === "snowy" ? 400 : effectiveWeatherType === "rainy" ? 200 : -150;
                      const valleyMw = Math.round(2400 + weatherEffect - 300 - 200);
                      const valleyX = 18*(236/24);
                      const valleyY = 5 + (1 - Math.max(0, valleyMw)/3000) * 70;
                      return (
                        <g>
                          <circle cx={valleyX} cy={valleyY} r={3} fill="rgba(100,200,255,0.9)" />
                          <text x={valleyX-30} y={valleyY+8} fontSize={5.5} fill="rgba(100,200,255,0.9)" fontFamily="monospace">谷{valleyMw}MW</text>
                        </g>
                      );
                    })()}
                    {/* Legend */}
                    <line x1={4} y1={86} x2={16} y2={86} stroke="rgba(255,150,50,0.8)" strokeWidth={1.5} strokeDasharray="4 2" />
                    <text x={19} y={89} fontSize={5.5} fill="rgba(255,150,50,0.8)" fontFamily="monospace">预测</text>
                    <line x1={55} y1={86} x2={67} y2={86} stroke="rgba(0,212,255,0.9)" strokeWidth={2} />
                    <text x={70} y={89} fontSize={5.5} fill="rgba(0,212,255,0.9)" fontFamily="monospace">实测</text>
                    <line x1={106} y1={86} x2={118} y2={86} stroke="rgba(0,255,180,0.6)" strokeWidth={1} strokeDasharray="3 2" />
                    <text x={121} y={89} fontSize={5.5} fill="rgba(0,255,180,0.8)" fontFamily="monospace">当前</text>
                  </svg>
                </div>
              </div>
              <div style={{ fontSize: 7.5, color: "rgba(148,210,255,0.5)", textAlign: "center", fontFamily: "'Share Tech Mono', monospace" }}>
                LSTM+天气修正 · MAE &lt;2.3% · 每15min更新
              </div>
            </div>
          )}

          {/* FlippingStation 换热站翻转卡片（每个换热站右上角） */}
          {stations.map((st, idx) => (
            <div key={st.id} style={{
              position: "absolute",
              top: idx === 0 ? 60 : idx === 1 ? 180 : 300,
              right: 12, zIndex: 25,
            }}>
              <ZoomableElement
                label={st.name}
                zoomedContent={
                  <div style={{ padding: 24, minWidth: 360 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#06b6d4', marginBottom: 16 }}>🏭 {st.name} 详细参数</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {[['\u4f9b\u6c34\u6e29', `${st.supplyTemp}\u2103`],
                        ['\u56de\u6c34\u6e29', `${st.returnTemp}\u2103`],
                        ['\u6d41\u91cf', `${st.flow}m\u00b3/h`],
                        ['\u538b\u5dee', `${st.pressure}kPa`],
                      ].map(([k, v]) => (
                        <div key={k} style={{ background: 'rgba(6,182,212,0.1)', borderRadius: 8, padding: '10px 14px', border: '1px solid rgba(6,182,212,0.3)' }}>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{k}</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#06b6d4', fontFamily: 'monospace' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(6,182,212,0.05)', borderRadius: 8, border: '1px solid rgba(6,182,212,0.2)' }}>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>供暖楼栋</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {st.buildings.map(bid => (
                          <span key={bid} style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(6,182,212,0.15)', borderRadius: 4, color: '#67e8f9' }}>{bid.replace('b', '')}号楼</span>
                        ))}
                      </div>
                    </div>
                  </div>
                }
              >
                <FlippingStation
                  station={{ ...st, pressureDiff: st.pressure }}
                  isAlert={isDemoRunning && demoPhase >= 2 && st.id === DEMO_TARGET_STATION_ID}
                  onFlip={(id, flipped) => setFlippedStation(flipped ? id : null)}
                />
              </ZoomableElement>
            </div>
          ))}

          {/* AI建模可视化（阶段0覆盖层） */}
          <AIModelingVisualization
            isActive={showAIModeling}
            onComplete={() => {}}
          />

          {/* 气象预警阶段1.5（覆盖层） */}
          <WeatherIntelligence
            isActive={showWeatherIntel}
            onComplete={() => setShowWeatherIntel(false)}
          />

          {/* 管道诊断红点（常驻层） */}
          <PipeDiagnostics
            isActive={isDemoRunning && demoPhase >= 2}
          />

          {/* 策略对比面板（右侧浮动，不遮挡系统图） */}
          <StrategyComparison
            isActive={showStrategyComparison}
            onSelect={() => setShowStrategyComparison(false)}
          />

          {/* 压差异常弹窗（阶段2触发） */}
          {showPressureAlert && (
            <div style={{
              position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)",
              zIndex: 30,
              background: "rgba(30,20,5,0.97)",
              border: "2px solid rgba(255,180,0,0.7)",
              borderRadius: 12, padding: "14px 20px",
              boxShadow: "0 0 30px rgba(255,180,0,0.4)",
              minWidth: 300, maxWidth: 400,
              animation: "pulse-yellow 1s ease-in-out infinite",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>⚡</span>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#FFB800", fontFamily: "'Noto Sans SC', sans-serif" }}>
                  管网支路压差异常
                </div>
                <button
                  onClick={() => setShowPressureAlert(false)}
                  style={{ marginLeft: "auto", color: "rgba(255,180,0,0.6)", background: "none", border: "none", cursor: "pointer", fontSize: 16 }}
                >✕</button>
              </div>
              <div style={{ fontSize: 11, color: "rgba(220,180,100,0.85)", fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.7 }}>
                <div>• 换热站B → 6号楼支路压差：<strong style={{ color: "#FFB800" }}>35 kPa</strong>（阈值 30 kPa）</div>
                <div>• 诊断：疑似管道局部堵塞或阀门开度不足</div>
                <div>• 建议：检查该支路截止阀，或启动AI自动平衡</div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Demo overlay OR Detail panels */}
        <div className={`right-panel mobile-tab-content ${mobileTab === "detail" ? "mobile-tab-active" : ""}`}
          style={{
            display: (isDemoRunning && (demoPhase >= 3 || demoNarration !== null)) || selectedBuilding || selectedStation || mobileTab === "detail" ? undefined : "none",
          }}>

          {/* 演示文字框：当前步骤播报内容 */}
          {isDemoRunning && demoNarration && (
            <div style={{
              flexShrink: 0,
              padding: '10px 14px',
              background: 'rgba(0,15,40,0.97)',
              borderBottom: '1px solid rgba(0,180,255,0.15)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(0,80,200,0.7), rgba(100,0,200,0.6))',
                  border: '1px solid rgba(0,180,255,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11,
                }}>🎙</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 3,
                      background: 'rgba(0,80,200,0.3)', border: '1px solid rgba(0,180,255,0.3)',
                      color: '#00D4FF', fontFamily: "'Share Tech Mono', monospace",
                    }}>STEP {demoNarration.step}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#E0F4FF', fontFamily: "'Noto Sans SC', sans-serif" }}>
                      {demoNarration.title}
                    </span>
                    {isDemoPaused && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 3,
                        background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)',
                        color: '#f59e0b', fontFamily: "'Share Tech Mono', monospace",
                        animation: 'ai-blink 1s infinite',
                      }}>PAUSED</span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: 10.5, lineHeight: 1.75, color: 'rgba(148,210,255,0.85)',
                fontFamily: "'Noto Sans SC', sans-serif",
                borderLeft: '2px solid rgba(0,180,255,0.3)',
                paddingLeft: 8,
                maxHeight: 60, overflowY: 'auto',
              }}>
                {demoNarration.text}
              </div>
            </div>
          )}

          {/* Unit view (4th layer) */}
          {unitViewBuilding && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16, gap: 10, overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <button
                  onClick={handleBackFromUnit}
                  style={{
                    padding: '5px 12px', borderRadius: 8,
                    border: '1px solid rgba(0,180,255,0.3)',
                    background: 'rgba(0,30,80,0.5)',
                    color: '#00D4FF', fontSize: 11, cursor: 'pointer',
                    fontFamily: "'Noto Sans SC', sans-serif",
                  }}
                >← 返回楼栋</button>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#E0F4FF', fontFamily: "'Noto Sans SC', sans-serif" }}>
                  {unitViewBuilding.name} · 户端详情
                </span>
              </div>
              <OneTowerTwoUnits
                buildingId={unitViewBuilding.id}
                buildingName={unitViewBuilding.name}
                floors={6}
                unitData={Array.from({ length: 12 }, (_, i) => {
                  const floor = Math.floor(i / 2) + 1;
                  const isLeft = i % 2 === 0;
                  const isEdge = isLeft;
                  const isTop = floor === 6;
                  const baseTemp = unitViewBuilding.temp;
                  const floorOffset = (floor - 3) * 0.3;
                  const edgeOffset = isEdge ? -0.8 : 0;
                  const topOffset = isTop ? -1.2 : 0;
                  return {
                    temp: parseFloat((baseTemp + floorOffset + edgeOffset + topOffset + (Math.random() - 0.5) * 0.4).toFixed(1)),
                    valve: 50 + Math.floor(Math.random() * 40),
                    isEdge,
                    isTop,
                  } as UnitData;
                })}
                mainValveOpenPct={isDemoRunning && demoPhase === 5 ? 85 : 70}
                isAdjusting={isDemoRunning && demoPhase === 5}
                onUnitClick={(floor, side) => console.log('Unit clicked:', floor, side)}
              />
            </div>
          )}

          {/* Demo Phase 3: AI诊断（打字机） */}
          {!unitViewBuilding && isDemoRunning && demoPhase === 3 && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 14, gap: 10, overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, borderBottom: "1px solid rgba(0,180,255,0.12)" }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: "linear-gradient(135deg, rgba(0,80,200,0.6), rgba(100,0,200,0.5))",
                  border: "1px solid rgba(0,180,255,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 17, flexShrink: 0,
                }}>🔍</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#E0F4FF", fontFamily: "'Noto Sans SC', sans-serif" }}>AI 诊断分析</div>
                  <div style={{ fontSize: 9.5, color: "rgba(100,180,255,0.6)", fontFamily: "'Share Tech Mono', monospace" }}>SENSE · PREDICT · DECIDE · ACT</div>
                </div>
                <div style={{
                  marginLeft: "auto", display: "flex", alignItems: "center", gap: 4,
                  padding: "3px 8px", borderRadius: 6,
                  background: "rgba(0,80,200,0.2)", border: "1px solid rgba(0,180,255,0.25)",
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00D4FF", animation: "ai-blink 1s infinite" }} />
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: "#00D4FF", fontFamily: "'Share Tech Mono', monospace" }}>分析中</span>
                </div>
              </div>
              <div style={{
                flex: 1, padding: "10px 12px", borderRadius: 10,
                background: "rgba(0,20,60,0.5)", border: "1px solid rgba(0,180,255,0.15)",
                fontSize: 11.5, lineHeight: 1.9, color: "rgba(148,210,255,0.9)",
                fontFamily: "'Noto Sans SC', sans-serif",
                whiteSpace: "pre-wrap", overflowY: "auto", minHeight: 200,
              }}>
                {demoAiText}
                <span style={{
                  display: "inline-block", width: 2, height: 13,
                  background: "#00D4FF", marginLeft: 2, verticalAlign: "middle",
                  animation: "ai-blink 0.8s infinite",
                  boxShadow: "0 0 6px rgba(0,212,255,0.8)",
                }} />
              </div>
            </div>
          )}

          {/* Demo Phase 4: 决策（策略卡片由AIBrainPanel轮播，右侧显示方案列表） */}
          {!unitViewBuilding && isDemoRunning && demoPhase === 4 && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 14, gap: 10, overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, borderBottom: "1px solid rgba(0,180,255,0.12)" }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: "linear-gradient(135deg, rgba(0,150,80,0.5), rgba(0,80,200,0.5))",
                  border: "1px solid rgba(0,212,255,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 17, flexShrink: 0,
                }}>⚡</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#E0F4FF", fontFamily: "'Noto Sans SC', sans-serif" }}>AI 调控策略</div>
                  <div style={{ fontSize: 9.5, color: "rgba(100,180,255,0.6)", fontFamily: "'Noto Sans SC', sans-serif" }}>已生成 3 套方案，推荐方案A</div>
                </div>
              </div>

              {DEMO_STRATEGIES.map(strategy => (
                <div key={strategy.id}
                  onClick={() => setDemoSelectedStrategy(strategy.id)}
                  style={{
                    padding: "10px 12px", borderRadius: 10,
                    border: `2px solid ${demoSelectedStrategy === strategy.id ? strategy.color : "rgba(0,100,200,0.2)"}`,
                    background: demoSelectedStrategy === strategy.id ? `${strategy.color}18` : "rgba(0,20,60,0.4)",
                    cursor: "pointer", transition: "all 0.2s", position: "relative",
                    boxShadow: demoSelectedStrategy === strategy.id ? `0 0 16px ${strategy.color}40` : "none",
                    opacity: demoSelectedStrategy && demoSelectedStrategy !== strategy.id ? 0.5 : 1,
                    transform: demoSelectedStrategy === strategy.id ? "scale(1.02)" : "scale(1)",
                  }}>
                  {strategy.recommended && (
                    <div style={{
                      position: "absolute", top: -8, right: 10,
                      padding: "2px 8px", borderRadius: 4,
                      background: strategy.color, color: "white",
                      fontSize: 9, fontWeight: 700, fontFamily: "'Noto Sans SC', sans-serif",
                    }}>AI推荐</div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6, background: strategy.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800, color: "white", flexShrink: 0,
                    }}>{strategy.id}</div>
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#E0F4FF", fontFamily: "'Noto Sans SC', sans-serif" }}>{strategy.title}</div>
                      <div style={{ fontSize: 9.5, color: strategy.color, fontWeight: 600, fontFamily: "'Share Tech Mono', monospace" }}>{strategy.desc}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 9.5, color: "rgba(148,210,255,0.7)", fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.6 }}>
                    <div>{strategy.detail}</div>
                    <div style={{ display: "flex", gap: 10, marginTop: 3 }}>
                      <span style={{ color: "#00FF9D" }}>⏱ {strategy.time}</span>
                      <span style={{ color: "#FFB347" }}>⚠ {strategy.risk}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Demo Phase 5: 执行（GSAP时序控制） */}
          {!unitViewBuilding && isDemoRunning && demoPhase === 5 && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 14, gap: 10, overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, borderBottom: "1px solid rgba(0,180,255,0.12)" }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: "linear-gradient(135deg, #1A56DB, #059669)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 17, flexShrink: 0,
                  animation: "spin 2s linear infinite",
                }}>⚙️</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#E0F4FF", fontFamily: "'Noto Sans SC', sans-serif" }}>三级联动调控执行中</div>
                  <div style={{ fontSize: 9.5, color: "#00D4FF", fontFamily: "'Noto Sans SC', sans-serif" }}>方案A — 快速响应 · 换热站B</div>
                </div>
                <div style={{
                  marginLeft: "auto", padding: "3px 8px", borderRadius: 6,
                  background: "rgba(0,80,200,0.2)", border: "1px solid rgba(0,180,255,0.3)",
                  fontSize: 9.5, fontWeight: 700, color: "#00D4FF",
                  fontFamily: "'Share Tech Mono', monospace",
                  animation: "ai-blink 1s infinite",
                }}>EXECUTING</div>
              </div>

              {/* 三级联动步骤 */}
              <div style={{ fontSize: 9.5, color: "rgba(100,180,255,0.55)", fontFamily: "'Noto Sans SC', sans-serif", letterSpacing: 1, marginBottom: 2 }}>
                三级联动时序（GSAP控制）
              </div>
              {[
                { level: "一级", name: "换热站B供温", action: "53→55°C", status: "执行中", color: "#EF4444", delay: "0s" },
                { level: "二级", name: "主管网流量",  action: "118→130 t/h", status: "执行中", color: "#3B82F6", delay: "2s" },
                { level: "三级", name: "户端阀门",    action: "开度↑55%", status: "执行中", color: "#22C55E", delay: "4.5s" },
              ].map((item, i) => (
                <div key={i} style={{
                  padding: "8px 10px", borderRadius: 8,
                  background: "rgba(0,20,60,0.5)",
                  border: `1px solid ${item.color}40`,
                  display: "flex", alignItems: "center", gap: 8,
                  animation: `flow-in 0.3s ease ${i * 0.2}s both`,
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: `${item.color}20`, border: `1.5px solid ${item.color}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 800, color: item.color, flexShrink: 0,
                  }}>{item.level[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#E0F4FF", fontFamily: "'Noto Sans SC', sans-serif" }}>{item.name}</div>
                    <div style={{ fontSize: 9, color: item.color, fontFamily: "'Share Tech Mono', monospace" }}>{item.action}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      padding: "2px 6px", borderRadius: 4,
                      background: `${item.color}20`, border: `1px solid ${item.color}50`,
                      fontSize: 8.5, fontWeight: 700, color: item.color,
                      fontFamily: "'Share Tech Mono', monospace",
                      animation: "ai-blink 1s infinite",
                    }}>{item.status}</div>
                    <div style={{ fontSize: 8, color: "rgba(100,150,200,0.5)", marginTop: 2 }}>延迟{item.delay}</div>
                  </div>
                </div>
              ))}

              {/* 换热站B实时参数（GSAP数字滚动目标） */}
              {stationB && (
                <div style={{
                  padding: "10px 12px", borderRadius: 10,
                  background: "rgba(0,30,80,0.5)", border: "1.5px solid rgba(0,180,255,0.2)",
                }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#00D4FF", marginBottom: 7, fontFamily: "'Noto Sans SC', sans-serif" }}>
                    换热站B — 实时参数
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px" }}>
                    <div>
                      <div style={{ fontSize: 8.5, color: "rgba(100,150,200,0.55)", fontFamily: "'Noto Sans SC', sans-serif" }}>供水温度</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#FF6060", fontFamily: "'Share Tech Mono', monospace" }}>
                        <span ref={supplyTempRef}>{stationB.supplyTemp.toFixed(1)}</span>°C
                        <span style={{ fontSize: 9.5, marginLeft: 4, color: "#00FF9D" }}>↑</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 8.5, color: "rgba(100,150,200,0.55)", fontFamily: "'Noto Sans SC', sans-serif" }}>循环流量</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#00D4FF", fontFamily: "'Share Tech Mono', monospace" }}>
                        <span ref={flowRef}>{stationB.flow}</span> t/h
                        <span style={{ fontSize: 9.5, marginLeft: 4, color: "#00FF9D" }}>↑</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 8.5, color: "rgba(100,150,200,0.55)", fontFamily: "'Noto Sans SC', sans-serif" }}>回水温度</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "rgba(148,210,255,0.8)", fontFamily: "'Share Tech Mono', monospace" }}>
                        {stationB.returnTemp.toFixed(1)}°C
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 8.5, color: "rgba(100,150,200,0.55)", fontFamily: "'Noto Sans SC', sans-serif" }}>供回压差</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "rgba(148,210,255,0.8)", fontFamily: "'Share Tech Mono', monospace" }}>
                        {stationB.pressure} kPa
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 6号楼室温回升（GSAP数字滚动） */}
              <div style={{
                padding: "10px 12px", borderRadius: 10,
                background: "rgba(40,20,0,0.5)", border: "1.5px solid rgba(255,180,50,0.3)",
              }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#FFB347", marginBottom: 7, fontFamily: "'Noto Sans SC', sans-serif" }}>
                  6号楼 — 室温恢复中
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "#FFB347", fontFamily: "'Share Tech Mono', monospace", textShadow: "0 0 12px rgba(255,150,0,0.5)" }}>
                    <span ref={buildingTempRef}>{(demoBuildingTemps["9"] ?? DEMO_START_TEMP).toFixed(1)}</span>°C
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 8.5, color: "rgba(150,130,80,0.7)" }}>
                      <span>{DEMO_START_TEMP}°C</span>
                      <span>目标 {DEMO_TARGET_TEMP}°C</span>
                    </div>
                    <div style={{ height: 7, borderRadius: 3.5, background: "rgba(60,40,0,0.5)", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 3.5,
                        width: `${Math.max(0, Math.min(100, ((demoBuildingTemps["9"] ?? DEMO_START_TEMP) - DEMO_START_TEMP) / (DEMO_TARGET_TEMP - DEMO_START_TEMP) * 100))}%`,
                        background: "linear-gradient(90deg, #F97316, #22C55E)",
                        transition: "width 0.4s ease",
                        boxShadow: "0 0 6px rgba(249,115,22,0.5)",
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Normal: Building/Station detail */}
          {!unitViewBuilding && !isDemoRunning && (
            <>
              {selectedBuilding ? (
                <BuildingDetailPanel
                  building={selectedBuilding}
                  weather={effectiveWeatherType}
                  outdoorTemp={weather.currentTemp}
                  onClose={() => { setSelectedBuilding(null); setMobileTab("map"); }}
                  onDrillToUnit={() => handleDrillToUnit(selectedBuilding)}
                />
              ) : selectedStation ? (
                <HeatStationPanel
                  station={selectedStation}
                  buildings={buildings.filter(b => selectedStation.buildings.includes(b.id))}
                  weather={effectiveWeatherType}
                  onClose={() => { setSelectedStation(null); setMobileTab("map"); }}
                />
              ) : (
                <SystemFlowPanel />
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom DualModeTimeline */}
      <DualModeTimeline
        currentPhase={demoStep}
        currentTime={demoStep * (112 / 12)}
        isPlaying={isDemoRunning}
        isPaused={isDemoPaused}
        stages={DEMO_12_STAGES}
        totalSec={112}
        onPhaseClick={(phase) => {
          // 点击步骤标签跳转到该步骤
          stopDemo();
          setTimeout(() => startDemo(phase), 150);
        }}
        onSeek={(time) => {
          // 拖动进度条跳转到对应步骤
          const stage = DEMO_12_STAGES.find(s => time >= s.startSec && time < s.endSec)
            ?? (time >= 104 ? DEMO_12_STAGES[12] : DEMO_12_STAGES[0]);
          stopDemo();
          setTimeout(() => startDemo(stage.id), 150);
        }}
        onPlayPause={() => {
          if (isDemoRunning) {
            // 如果正在播放，点击停止按钮则停止
            stopDemo();
          } else {
            // 如果已停止，从头开始
            startDemo();
          }
        }}
        onPause={toggleDemoPause}
        onRestart={restartDemo}
      />
      {/* Tech modal */}
      {showTechModal && <TechInfoModal onClose={() => setShowTechModal(false)} />}

      {/* 热源大面板已移除：功能已整合到FlippingHeatSource卡片展开态 */}

      {/* StrategyComparison已移到map-center内部（右侧浮动） */}

      {/* BuildingZoomView 楼栋放大弹出层 */}
      {zoomBuilding && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setZoomBuilding(null)}
        >
          <div onClick={e => e.stopPropagation()}>
            <BuildingZoomView
              buildingId={zoomBuilding.id}
              buildingName={zoomBuilding.name}
              floors={6}
              baseTemp={demoBuildingTemps[zoomBuilding.id] ?? zoomBuilding.temp}
              demoPhase={demoPhase}
              isAlertTarget={isDemoRunning && zoomBuilding.id === DEMO_TARGET_BUILDING_ID && demoPhase >= 2}
              isExecuting={isDemoRunning && demoPhase === 5}
              onClose={() => setZoomBuilding(null)}
            />
          </div>
        </div>
      )}

      {/* ClosedLoopPanel 闭环可视化（演示阶段2-5浮动在地图右下角） */}
      {isDemoRunning && demoPhase >= 2 && demoPhase <= 5 && (
        <div style={{
          position: 'fixed',
          bottom: 70,
          right: 16,
          zIndex: 40,
          width: 280,
          pointerEvents: 'none',
        }}>
          <ClosedLoopPanel
            demoPhase={demoPhase}
            isDemoRunning={isDemoRunning}
            alertBuilding="6号楼"
            alertTemp={demoBuildingTemps[DEMO_TARGET_BUILDING_ID] ?? DEMO_START_TEMP}
          />
        </div>
      )}

      {/* AI大脑指示器（三大演示模式运行时显示在顶部中央） */}
      {demoMode !== "none" && isAIThinking && (
        <AIBrainIndicator
          currentStep={String(aiBrainStep)}
          stepLabel={aiBrainLabel}
          isThinking={isAIThinking}
          mode={demoMode === "coldwave" ? "coldwave" : demoMode === "realtime" ? "realtime" : demoMode === "interactive" ? "interactive" : "idle"}
        />
      )}

      {/* 模式A：寒潮场景演示 */}
      <ColdWaveDemo
        isActive={demoMode === "coldwave"}
        onClose={() => { setDemoMode("none"); setIsAIThinking(false); setDemoAnnotations([]); }}
        onAnnotationsChange={handleAnnotationsChange}
      />

      {/* 模式B：五步闭环展示 */}
      <FiveStepLoop
        isActive={demoMode === "realtime"}
        onClose={() => { setDemoMode("none"); setIsAIThinking(false); setDemoAnnotations([]); }}
        currentWeatherTemp={weather.currentTemp}
        onStepChange={(step, label) => { setAiBrainStep(step); setAiBrainLabel(label); }}
        onAnnotationsChange={handleAnnotationsChange}
      />

      {/* 模式C：自由操控系统 */}
      <InteractiveControl
        isActive={demoMode === "interactive"}
        onClose={() => { setDemoMode("none"); setIsAIThinking(false); }}
        onTargetTempChange={(temp) => {
          setAiBrainLabel(`目标室温已调整为 ${temp}°C`);
        }}
        onStrategyChange={(strategy) => {
          setAiBrainLabel(`已切换策略: ${strategy}`);
        }}
        onFaultSimulate={(fault, buildingId) => {
          if (fault === "close-valve") {
            const bid = buildingId ?? "9";
            setDemoBuildingTemps(prev => ({ ...prev, [bid]: DEMO_START_TEMP }));
          } else if (fault === "restore") {
            setDemoBuildingTemps({});
          } else if (fault === "low-temp-9") {
            setDemoBuildingTemps(prev => ({ ...prev, "9": DEMO_START_TEMP }));
          }
        }}
        onStationParamChange={(stationId, params) => {
          // 将手动调节的换热站参数同步到全局换热站状态
          setStations(prev => prev.map(s =>
            s.id === stationId ? { ...s, ...params } : s
          ));
        }}
        onBuildingValveChange={(buildingId, open) => {
          if (!open) {
            setDemoBuildingTemps(prev => ({ ...prev, [buildingId]: DEMO_START_TEMP }));
          } else {
            setDemoBuildingTemps(prev => {
              const next = { ...prev };
              delete next[buildingId];
              return next;
            });
          }
        }}
        onFaultAIDiagnosis={(fault) => {
          // 展示故障场景时高亮对应标注
          if (fault.id === "low-temp-9") {
            setDemoAnnotations([
              {
                id: 'fault-bldg9',
                svgX: 580, svgY: 430,
                title: '🥶 6号楼低温告警',
                body: '室温 16.0°C — A I诊断中',
                color: 'red',
                pulse: true,
              },
              {
                id: 'fault-station-b',
                svgX: 230, svgY: 380,
                title: '⚠️ 换热站B异常',
                body: '供温偏低，AI调控中',
                color: 'yellow',
                pulse: true,
              },
            ]);
          } else if (fault.id === "pressure-fault") {
            setDemoAnnotations([
              {
                id: 'fault-pressure',
                svgX: 230, svgY: 380,
                title: '⚡ 换热站B压力异常',
                body: '压差 0.25→0.12 MPa',
                color: 'yellow',
                pulse: true,
              },
            ]);
          } else if (fault.id === "pump-fail") {
            setDemoAnnotations([
              {
                id: 'fault-pump',
                svgX: 230, svgY: 580,
                title: '⚠️ 换热站C泵故障',
                body: '循环流量骤降，备用泵切换中',
                color: 'blue',
                pulse: true,
              },
            ]);
          } else if (fault.id === "restore") {
            setDemoAnnotations([]);
          }
          // 8秒后清除标注
          setTimeout(() => setDemoAnnotations([]), 8000);
        }}
        onHighlightStation={(stationId) => {
          // 将换热站高亮信息传递到地图
          if (stationId) {
            setDemoAnnotations(prev => {
              const filtered = prev.filter(a => a.id !== 'highlight-station');
              const station = INITIAL_STATIONS.find(s => s.id === stationId);
              if (!station) return filtered;
              const svgPositions: Record<string, { x: number; y: number }> = {
                S1: { x: 230, y: 200 },
                S2: { x: 230, y: 380 },
                S3: { x: 230, y: 560 },
              };
              const pos = svgPositions[stationId];
              if (!pos) return filtered;
              return [...filtered, {
                id: 'highlight-station',
                svgX: pos.x, svgY: pos.y,
                title: `⚙️ ${station.name}`,
                body: '参数调节中...',
                color: 'cyan',
                pulse: true,
              }];
            });
          } else {
            setDemoAnnotations(prev => prev.filter(a => a.id !== 'highlight-station'));
          }
        }}
        onHighlightBuilding={(buildingId) => {
          if (buildingId) {
            setDemoAnnotations(prev => {
              const filtered = prev.filter(a => a.id !== 'highlight-building');
              return [...filtered, {
                id: 'highlight-building',
                svgX: 580, svgY: 430,
                title: `🏠 ${buildingId}号楼`,
                body: '阀门状态已更新',
                color: 'green',
                pulse: false,
              }];
            });
          } else {
            setDemoAnnotations(prev => prev.filter(a => a.id !== 'highlight-building'));
          }
        }}
      />

      <style>{`
        @keyframes phase-title-in {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 30px rgba(255,60,60,0.4), 0 8px 32px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 50px rgba(255,60,60,0.7), 0 8px 32px rgba(0,0,0,0.6), 0 0 0 4px rgba(255,60,60,0.15); }
        }
        @keyframes pulse-yellow {
          0%, 100% { box-shadow: 0 0 20px rgba(255,180,0,0.3); }
          50% { box-shadow: 0 0 40px rgba(255,180,0,0.6), 0 0 0 3px rgba(255,180,0,0.15); }
        }
        @keyframes ai-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes flow-in { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
      `}</style>
    </div>
  );
}
