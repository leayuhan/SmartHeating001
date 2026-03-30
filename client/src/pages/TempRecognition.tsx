/**
 * TempRecognition Page - 室温辨识 & AI预测模型
 * Design: 能源科技暗黑大屏风
 * - 模型训练结果展示
 * - 交互式预测演示（用户可调节参数看预测结果）
 * - 特征重要性可视化
 * - 预测精度对比图
 */
import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  Brain,
  Thermometer,
  Wind,
  Droplets,
  Sun,
  Building2,
  Clock,
  Target,
  ChevronRight,
  Sliders,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";

const AI_MODEL_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663428492122/CZm6BZEe2oQq4xtYABPMda/ai-model-visual-CmJg5fo76xcYayqy7vVF8N.webp";
const BUILDING_THERMAL_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663428492122/CZm6BZEe2oQq4xtYABPMda/building-thermal-Zjy5NmGR3qiQJioYL2XkwV.webp";

// Model performance data
const modelPerformance = [
  {
    horizon: "30分钟",
    mae: 0.154,
    rmse: 0.202,
    r2: 0.9996,
    color: "oklch(0.65 0.18 150)",
    label: "极高精度",
  },
  {
    horizon: "1小时",
    mae: 0.220,
    rmse: 0.293,
    r2: 0.9991,
    color: "oklch(0.72 0.18 55)",
    label: "高精度",
  },
  {
    horizon: "2小时",
    mae: 0.322,
    rmse: 0.442,
    r2: 0.9979,
    color: "oklch(0.65 0.20 220)",
    label: "良好精度",
  },
];

// Feature importance data
const featureImportance = [
  { name: "供水温度", importance: 0.312, color: "oklch(0.72 0.18 55)" },
  { name: "室外温度", importance: 0.248, color: "oklch(0.65 0.20 220)" },
  { name: "历史热量", importance: 0.187, color: "oklch(0.65 0.18 150)" },
  { name: "楼栋朝向", importance: 0.089, color: "oklch(0.70 0.20 290)" },
  { name: "风速", importance: 0.072, color: "oklch(0.65 0.20 220)" },
  { name: "楼层高度", importance: 0.048, color: "oklch(0.65 0.22 25)" },
  { name: "玻璃窗占比", importance: 0.044, color: "oklch(0.65 0.18 150)" },
];

// Generate prediction vs actual scatter data
function generateScatterData(n = 80) {
  const data = [];
  for (let i = 0; i < n; i++) {
    const actual = 16 + Math.random() * 8;
    const noise = (Math.random() - 0.5) * 0.4;
    data.push({ actual: +actual.toFixed(2), predicted: +(actual + noise).toFixed(2) });
  }
  return data;
}

// Simple prediction function (simulated)
function predictTemperature(params: {
  outdoor: number;
  supplyTemp: number;
  windSpeed: number;
  sunshine: number;
  floor: number;
  windowRatio: number;
  orientation: number;
  hour: number;
}) {
  const base = 18;
  const outdoorEffect = (params.outdoor + 5) * 0.08;
  const supplyEffect = (params.supplyTemp - 50) * 0.12;
  const windEffect = -params.windSpeed * 0.05;
  const sunEffect = params.sunshine * 0.008;
  const floorEffect = params.floor * 0.03;
  const windowEffect = -params.windowRatio * 2;
  const orientEffect = Math.sin((params.orientation / 180) * Math.PI) * 0.5;
  const timeEffect = Math.sin(((params.hour - 6) / 24) * Math.PI * 2) * 0.8;
  const result = base + outdoorEffect + supplyEffect + windEffect + sunEffect +
    floorEffect + windowEffect + orientEffect + timeEffect;
  return Math.max(14, Math.min(28, result));
}

// Generate 24h prediction curve
function generatePredictionCurve(params: any) {
  return Array.from({ length: 24 }, (_, h) => {
    const pred = predictTemperature({ ...params, hour: h });
    const actual = pred + (Math.random() - 0.5) * 0.3;
    return {
      hour: `${String(h).padStart(2, "0")}:00`,
      predicted: +pred.toFixed(2),
      actual: +actual.toFixed(2),
    };
  });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="p-3 rounded-lg text-xs"
        style={{
          background: "oklch(0.16 0.025 235)",
          border: "1px solid oklch(1 0 0 / 15%)",
        }}
      >
        <p className="font-semibold mb-1" style={{ color: "oklch(0.85 0.008 220)" }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {p.value}°C
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function TempRecognition() {
  const [scatterData] = useState(generateScatterData);
  const [params, setParams] = useState({
    outdoor: -3,
    supplyTemp: 55,
    windSpeed: 3,
    sunshine: 50,
    floor: 5,
    windowRatio: 0.35,
    orientation: 180,
    hour: 14,
  });
  const [predictionCurve, setPredictionCurve] = useState(() => generatePredictionCurve(params));
  const [currentPred, setCurrentPred] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  const recalculate = useCallback(() => {
    setIsCalculating(true);
    setTimeout(() => {
      const pred = predictTemperature(params);
      setCurrentPred(pred);
      setPredictionCurve(generatePredictionCurve(params));
      setIsCalculating(false);
    }, 400);
  }, [params]);

  useEffect(() => {
    recalculate();
  }, [recalculate]);

  const inputFeatures = [
    { key: "outdoor", label: "室外温度", unit: "°C", min: -20, max: 15, step: 0.5, icon: Thermometer, color: "oklch(0.65 0.20 220)" },
    { key: "supplyTemp", label: "供水温度", unit: "°C", min: 40, max: 80, step: 1, icon: Thermometer, color: "oklch(0.72 0.18 55)" },
    { key: "windSpeed", label: "风速", unit: "m/s", min: 0, max: 12, step: 0.5, icon: Wind, color: "oklch(0.70 0.15 200)" },
    { key: "sunshine", label: "日照强度", unit: "W/m²", min: 0, max: 800, step: 10, icon: Sun, color: "oklch(0.80 0.18 80)" },
    { key: "floor", label: "楼层", unit: "层", min: 1, max: 30, step: 1, icon: Building2, color: "oklch(0.65 0.20 220)" },
    { key: "windowRatio", label: "玻璃窗占比", unit: "", min: 0.1, max: 0.8, step: 0.05, icon: Building2, color: "oklch(0.65 0.18 150)" },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ width: 44, height: 44, background: "oklch(0.72 0.18 55 / 15%)" }}
            >
              <Brain size={22} style={{ color: "oklch(0.80 0.18 55)" }} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: "oklch(0.92 0.008 220)" }}>
                室温辨识 · AI预测模型
              </h2>
              <p className="text-xs" style={{ color: "oklch(0.50 0.012 220)" }}>
                基于1296万条全仿真数据训练 · 无需入户安装温度计
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "oklch(0.65 0.012 220)" }}>
            通过融合室外气象数据（温度、风速、日照、湿度）、楼栋拓扑信息（高度、面积、朝向、玻璃窗占比）、
            管网位置关系（近端/远端）及历史供热数据（热量、供回水温度、流量、压力），
            AI模型可精准预测每户室温，实现"虚拟温度计"效果。
          </p>
        </div>
        <div
          className="rounded-xl overflow-hidden flex-shrink-0"
          style={{ width: 280, height: 160 }}
        >
          <img
            src={BUILDING_THERMAL_IMG}
            alt="建筑热成像"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Model Performance Cards */}
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "oklch(0.75 0.010 220)" }}>
          模型训练结果
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {modelPerformance.map((m) => (
            <div
              key={m.horizon}
              className="p-5 rounded-xl"
              style={{
                background: "oklch(0.14 0.025 235)",
                border: `1px solid ${m.color}30`,
                borderTop: `2px solid ${m.color}`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} style={{ color: m.color }} />
                  <span className="font-semibold text-sm" style={{ color: "oklch(0.90 0.008 220)" }}>
                    {m.horizon}预测
                  </span>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: `${m.color}15`,
                    color: m.color,
                    border: `1px solid ${m.color}30`,
                  }}
                >
                  {m.label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "MAE", value: m.mae.toFixed(3), unit: "°C", desc: "平均绝对误差" },
                  { label: "RMSE", value: m.rmse.toFixed(3), unit: "°C", desc: "均方根误差" },
                  { label: "R²", value: m.r2.toFixed(4), unit: "", desc: "决定系数" },
                ].map((metric) => (
                  <div key={metric.label} className="text-center">
                    <div
                      className="text-xs mb-1"
                      style={{ color: "oklch(0.50 0.012 220)" }}
                    >
                      {metric.label}
                    </div>
                    <div
                      className="font-mono-data font-bold text-lg"
                      style={{ color: m.color }}
                    >
                      {metric.value}
                      <span className="text-xs font-normal ml-0.5">{metric.unit}</span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "oklch(0.45 0.010 220)" }}>
                      {metric.desc}
                    </div>
                  </div>
                ))}
              </div>
              {/* R2 progress bar */}
              <div className="mt-3">
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: "oklch(1 0 0 / 8%)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${m.r2 * 100}%`,
                      background: `linear-gradient(90deg, ${m.color}, oklch(0.80 0.20 220))`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs" style={{ color: "oklch(0.45 0.010 220)" }}>R² 拟合度</span>
                  <span className="text-xs font-mono-data" style={{ color: m.color }}>
                    {(m.r2 * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Demo + Charts */}
      <div className="grid grid-cols-5 gap-6">
        {/* Interactive Parameter Panel */}
        <div
          className="col-span-2 p-5 rounded-xl flex flex-col gap-4"
          style={{
            background: "oklch(0.14 0.025 235)",
            border: "1px solid oklch(1 0 0 / 8%)",
          }}
        >
          <div className="flex items-center gap-2">
            <Sliders size={16} style={{ color: "oklch(0.72 0.18 55)" }} />
            <h3 className="font-semibold text-sm" style={{ color: "oklch(0.92 0.008 220)" }}>
              交互式预测演示
            </h3>
          </div>
          <p className="text-xs" style={{ color: "oklch(0.50 0.012 220)" }}>
            调节参数，实时查看AI预测室温结果
          </p>

          {/* Prediction Result */}
          <div
            className="p-4 rounded-xl text-center"
            style={{
              background: isCalculating
                ? "oklch(0.72 0.18 55 / 8%)"
                : "oklch(0.65 0.18 150 / 10%)",
              border: `1px solid ${isCalculating ? "oklch(0.72 0.18 55 / 30%)" : "oklch(0.65 0.18 150 / 30%)"}`,
              transition: "all 0.4s",
            }}
          >
            <p className="text-xs mb-1" style={{ color: "oklch(0.55 0.012 220)" }}>
              AI预测室温
            </p>
            <div
              className="text-5xl font-bold font-mono-data"
              style={{
                color: isCalculating ? "oklch(0.72 0.18 55)" : "oklch(0.75 0.18 150)",
              }}
            >
              {isCalculating ? "..." : currentPred.toFixed(1)}
              <span className="text-xl ml-1">°C</span>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Target size={12} style={{ color: "oklch(0.55 0.012 220)" }} />
              <span className="text-xs" style={{ color: "oklch(0.55 0.012 220)" }}>
                目标范围: 20~22°C
              </span>
            </div>
            <div
              className="mt-2 text-xs px-3 py-1 rounded-full inline-block"
              style={{
                background: currentPred >= 20 && currentPred <= 22
                  ? "oklch(0.65 0.18 150 / 20%)"
                  : currentPred < 20
                  ? "oklch(0.65 0.20 220 / 20%)"
                  : "oklch(0.72 0.18 55 / 20%)",
                color: currentPred >= 20 && currentPred <= 22
                  ? "oklch(0.75 0.18 150)"
                  : currentPred < 20
                  ? "oklch(0.75 0.20 220)"
                  : "oklch(0.80 0.18 55)",
              }}
            >
              {currentPred >= 20 && currentPred <= 22
                ? "✓ 舒适区间"
                : currentPred < 20
                ? "↑ 需要增热"
                : "↓ 可适当减热"}
            </div>
          </div>

          {/* Parameter Sliders */}
          <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: 320 }}>
            {inputFeatures.map((feat) => {
              const Icon = feat.icon;
              const val = params[feat.key as keyof typeof params] as number;
              return (
                <div key={feat.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Icon size={13} style={{ color: feat.color }} />
                      <span className="text-xs" style={{ color: "oklch(0.70 0.010 220)" }}>
                        {feat.label}
                      </span>
                    </div>
                    <span
                      className="font-mono-data text-xs font-semibold"
                      style={{ color: feat.color }}
                    >
                      {feat.key === "windowRatio"
                        ? `${(val * 100).toFixed(0)}%`
                        : `${val}${feat.unit}`}
                    </span>
                  </div>
                  <Slider
                    min={feat.min}
                    max={feat.max}
                    step={feat.step}
                    value={[val]}
                    onValueChange={([v]) =>
                      setParams((p) => ({ ...p, [feat.key]: v }))
                    }
                    className="h-1"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Prediction Curve Chart */}
        <div className="col-span-3 flex flex-col gap-4">
          <div
            className="p-5 rounded-xl flex-1"
            style={{
              background: "oklch(0.14 0.025 235)",
              border: "1px solid oklch(1 0 0 / 8%)",
            }}
          >
            <h3 className="font-semibold text-sm mb-1" style={{ color: "oklch(0.92 0.008 220)" }}>
              24小时室温预测曲线
            </h3>
            <p className="text-xs mb-4" style={{ color: "oklch(0.50 0.012 220)" }}>
              基于当前参数的全天室温预测（橙色虚线）vs 模拟实测值（绿色实线）
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={predictionCurve} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: "oklch(0.50 0.012 220)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={3}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fill: "oklch(0.50 0.012 220)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={20}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                  label={{ value: "20°C", fill: "#10b981", fontSize: 10 }}
                />
                <ReferenceLine
                  y={22}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                  label={{ value: "22°C", fill: "#10b981", fontSize: 10 }}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  name="AI预测"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="模拟实测"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Feature Importance */}
          <div
            className="p-5 rounded-xl"
            style={{
              background: "oklch(0.14 0.025 235)",
              border: "1px solid oklch(1 0 0 / 8%)",
            }}
          >
            <h3 className="font-semibold text-sm mb-4" style={{ color: "oklch(0.92 0.008 220)" }}>
              特征重要性分析
            </h3>
            <div className="flex flex-col gap-2">
              {featureImportance.map((f) => (
                <div key={f.name} className="flex items-center gap-3">
                  <span
                    className="text-xs w-20 text-right flex-shrink-0"
                    style={{ color: "oklch(0.65 0.010 220)" }}
                  >
                    {f.name}
                  </span>
                  <div
                    className="flex-1 h-5 rounded overflow-hidden"
                    style={{ background: "oklch(1 0 0 / 5%)" }}
                  >
                    <div
                      className="h-full rounded flex items-center justify-end pr-2"
                      style={{
                        width: `${f.importance * 100 / 0.35}%`,
                        background: `linear-gradient(90deg, ${f.color}60, ${f.color})`,
                        minWidth: "30px",
                      }}
                    >
                      <span
                        className="text-xs font-mono-data font-semibold"
                        style={{ color: "white" }}
                      >
                        {(f.importance * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Data Inputs Explanation */}
      <div
        className="p-5 rounded-xl"
        style={{
          background: "oklch(0.14 0.025 235)",
          border: "1px solid oklch(1 0 0 / 8%)",
        }}
      >
        <h3 className="font-semibold text-sm mb-4" style={{ color: "oklch(0.92 0.008 220)" }}>
          模型输入特征体系
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              category: "气象数据",
              icon: "🌡️",
              color: "oklch(0.65 0.20 220)",
              items: ["室外温度（实时+预报）", "风速", "日照强度", "湿度"],
              note: "数据缺失时自动补全",
            },
            {
              category: "楼栋拓扑",
              icon: "🏢",
              color: "oklch(0.72 0.18 55)",
              items: ["楼层高度", "建筑面积", "玻璃窗占比", "朝向"],
              note: "静态特征，一次录入",
            },
            {
              category: "管网信息",
              icon: "🔧",
              color: "oklch(0.65 0.18 150)",
              items: ["管网位置关系", "近端/远端标识", "管径参数", "阀门状态"],
              note: "影响热量分配效率",
            },
            {
              category: "历史供热",
              icon: "📊",
              color: "oklch(0.70 0.20 290)",
              items: ["历史热量数据", "供回水温度", "供热流量", "系统压力"],
              note: "时序特征，滑动窗口",
            },
          ].map((cat) => (
            <div
              key={cat.category}
              className="p-4 rounded-lg"
              style={{
                background: `${cat.color}08`,
                border: `1px solid ${cat.color}25`,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{cat.icon}</span>
                <span className="font-semibold text-sm" style={{ color: cat.color }}>
                  {cat.category}
                </span>
              </div>
              <ul className="flex flex-col gap-1.5 mb-3">
                {cat.items.map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <ChevronRight size={12} style={{ color: cat.color, flexShrink: 0 }} />
                    <span className="text-xs" style={{ color: "oklch(0.65 0.010 220)" }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <div
                className="text-xs px-2 py-1 rounded"
                style={{
                  background: `${cat.color}12`,
                  color: cat.color,
                }}
              >
                {cat.note}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
