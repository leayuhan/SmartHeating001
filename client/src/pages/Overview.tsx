/**
 * Overview Page - 系统总览
 * Design: 能源科技暗黑大屏风
 * - Hero区展示系统架构
 * - 核心指标卡片
 * - 实时数据折线图
 * - 系统流程说明
 */
import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Thermometer,
  Cpu,
  Network,
  Zap,
  TrendingUp,
  Building2,
  Activity,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import StatCard from "@/components/StatCard";

// Generate simulated time-series data
function generateHeatData() {
  const data = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 3600000);
    const h = hour.getHours();
    const outdoor = -5 + Math.sin((h / 24) * Math.PI) * 4 + (Math.random() - 0.5) * 1.5;
    const predicted = 20 + Math.sin(((h - 6) / 24) * Math.PI * 2) * 1.5 + (Math.random() - 0.5) * 0.3;
    const actual = predicted + (Math.random() - 0.5) * 0.4;
    const supplyTemp = 55 + Math.sin(((h - 12) / 24) * Math.PI * 2) * 8 + (Math.random() - 0.5) * 1;
    data.push({
      time: `${String(hour.getHours()).padStart(2, "0")}:00`,
      outdoor: +outdoor.toFixed(1),
      predicted: +predicted.toFixed(2),
      actual: +actual.toFixed(2),
      supplyTemp: +supplyTemp.toFixed(1),
    });
  }
  return data;
}

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663428492122/CZm6BZEe2oQq4xtYABPMda/hero-bg-WdqBtXSZNoDh93R9cm2GZQ.webp";

const systemFlow = [
  {
    step: "01",
    icon: Thermometer,
    title: "多源数据采集",
    desc: "室外温度、风速、日照、湿度实时获取，楼栋拓扑、管网位置关系同步接入",
    color: "oklch(0.65 0.20 220)",
  },
  {
    step: "02",
    icon: Cpu,
    title: "AI室温辨识",
    desc: "基于1296万条仿真数据训练，R²=0.9996，30分钟预测误差仅0.15°C",
    color: "oklch(0.72 0.18 55)",
  },
  {
    step: "03",
    icon: Network,
    title: "二网水力平衡",
    desc: "根据预测室温自动调节各楼栋阀门开度，消除冷热不均，实现精准分配",
    color: "oklch(0.65 0.18 150)",
  },
  {
    step: "04",
    icon: Zap,
    title: "换热站决策",
    desc: "热源充足时优化管网分配；热源不足时自动上报需求，智能调度",
    color: "oklch(0.70 0.20 290)",
  },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="p-3 rounded-lg text-xs"
        style={{
          background: "oklch(0.16 0.025 235)",
          border: "1px solid oklch(1 0 0 / 15%)",
          boxShadow: "0 4px 20px oklch(0 0 0 / 40%)",
        }}
      >
        <p className="font-semibold mb-2" style={{ color: "oklch(0.85 0.008 220)" }}>
          {label}
        </p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="mb-1">
            {p.name}: {p.value}
            {p.name.includes("温度") || p.name.includes("室温") ? "°C" : ""}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Overview() {
  const [chartData] = useState(generateHeatData);
  const [liveStats, setLiveStats] = useState({
    buildings: 128,
    avgIndoor: 21.3,
    heatLoad: 87.4,
    savings: 18.6,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveStats((prev) => ({
        buildings: prev.buildings,
        avgIndoor: +(prev.avgIndoor + (Math.random() - 0.5) * 0.1).toFixed(1),
        heatLoad: +(prev.heatLoad + (Math.random() - 0.5) * 0.5).toFixed(1),
        savings: +(prev.savings + (Math.random() - 0.5) * 0.2).toFixed(1),
      }));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full">
      {/* Hero Section */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ minHeight: 260 }}
      >
        <img
          src={HERO_BG}
          alt="智慧供热系统"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.55 }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.10 0.025 240 / 85%) 0%, oklch(0.12 0.025 235 / 60%) 100%)",
          }}
        />
        <div className="relative z-10 p-8 flex flex-col justify-between h-full" style={{ minHeight: 260 }}>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span
                className="text-xs font-mono-data px-3 py-1 rounded-full"
                style={{
                  background: "oklch(0.65 0.20 220 / 20%)",
                  border: "1px solid oklch(0.65 0.20 220 / 50%)",
                  color: "oklch(0.80 0.20 220)",
                }}
              >
                AI-POWERED · SMART HEATING
              </span>
            </div>
            <h1
              className="text-4xl font-bold mb-2"
              style={{ color: "white", textShadow: "0 2px 20px oklch(0 0 0 / 50%)" }}
            >
              智慧供热
              <span className="gradient-text-blue ml-3">室温辨识</span>
              系统
            </h1>
            <p
              className="text-base max-w-2xl"
              style={{ color: "oklch(0.80 0.010 220)" }}
            >
              基于AI预测模型，无需入户安装温度计，通过多维数据融合精准辨识每户室温，
              实现二网水力平衡与换热站按需供热，节能降耗、提升居民舒适度。
            </p>
          </div>

          <div className="flex items-center gap-6 mt-6">
            {[
              { label: "训练数据量", value: "1,296万条", icon: "📊" },
              { label: "30分钟预测R²", value: "99.96%", icon: "🎯" },
              { label: "预测误差MAE", value: "0.154°C", icon: "📉" },
              { label: "覆盖楼栋", value: "128栋", icon: "🏢" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 px-4 py-2 rounded-lg"
                style={{
                  background: "oklch(1 0 0 / 8%)",
                  border: "1px solid oklch(1 0 0 / 15%)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <span className="text-lg">{item.icon}</span>
                <div>
                  <div
                    className="font-mono-data font-bold text-sm"
                    style={{ color: "oklch(0.92 0.008 220)" }}
                  >
                    {item.value}
                  </div>
                  <div className="text-xs" style={{ color: "oklch(0.60 0.010 220)" }}>
                    {item.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="接入楼栋"
          value={liveStats.buildings}
          unit="栋"
          icon={Building2}
          variant="blue"
          trend={{ value: 12, label: "较上月" }}
        />
        <StatCard
          title="平均室温"
          value={liveStats.avgIndoor}
          unit="°C"
          icon={Thermometer}
          variant="orange"
          subtitle="目标 20~22°C"
        />
        <StatCard
          title="当前热负荷"
          value={liveStats.heatLoad}
          unit="MW"
          icon={Activity}
          variant="green"
          trend={{ value: -3.2, label: "较昨日" }}
        />
        <StatCard
          title="节能率"
          value={liveStats.savings}
          unit="%"
          icon={TrendingUp}
          variant="purple"
          trend={{ value: 2.1, label: "较去年同期" }}
        />
      </div>

      {/* Chart + Flow */}
      <div className="grid grid-cols-3 gap-6">
        {/* Temperature Chart */}
        <div
          className="col-span-2 p-5 rounded-xl"
          style={{
            background: "oklch(0.14 0.025 235)",
            border: "1px solid oklch(1 0 0 / 8%)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3
                className="font-semibold text-sm"
                style={{ color: "oklch(0.92 0.008 220)" }}
              >
                24小时温度趋势
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "oklch(0.50 0.012 220)" }}>
                室外温度 · AI预测室温 · 实测室温 · 供水温度
              </p>
            </div>
            <span
              className="text-xs px-2 py-1 rounded"
              style={{
                background: "oklch(0.65 0.18 150 / 15%)",
                color: "oklch(0.75 0.18 150)",
              }}
            >
              实时更新
            </span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradOrange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" />
              <XAxis
                dataKey="time"
                tick={{ fill: "oklch(0.50 0.012 220)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={3}
              />
              <YAxis
                tick={{ fill: "oklch(0.50 0.012 220)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "12px", color: "oklch(0.60 0.012 220)" }}
              />
              <Area
                type="monotone"
                dataKey="outdoor"
                name="室外温度"
              stroke="#3b82f6"
              fill="url(#gradBlue)"
                strokeWidth={2}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="predicted"
                name="AI预测室温"
              stroke="#f59e0b"
              fill="url(#gradOrange)"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="actual"
                name="实测室温"
              stroke="#10b981"
              fill="none"
                strokeWidth={1.5}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* System Status */}
        <div
          className="p-5 rounded-xl flex flex-col gap-3"
          style={{
            background: "oklch(0.14 0.025 235)",
            border: "1px solid oklch(1 0 0 / 8%)",
          }}
        >
          <h3
            className="font-semibold text-sm mb-1"
            style={{ color: "oklch(0.92 0.008 220)" }}
          >
            子系统状态
          </h3>
          {[
            { name: "室温辨识模型", status: "运行中", load: 92, color: "oklch(0.65 0.18 150)" },
            { name: "数据采集服务", status: "运行中", load: 78, color: "oklch(0.65 0.18 150)" },
            { name: "水力平衡控制", status: "运行中", load: 65, color: "oklch(0.65 0.18 150)" },
            { name: "换热站决策引擎", status: "运行中", load: 84, color: "oklch(0.65 0.18 150)" },
            { name: "预报数据接口", status: "运行中", load: 45, color: "oklch(0.65 0.18 150)" },
          ].map((item) => (
            <div key={item.name} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} style={{ color: item.color }} />
                  <span className="text-xs" style={{ color: "oklch(0.75 0.010 220)" }}>
                    {item.name}
                  </span>
                </div>
                <span className="text-xs font-mono-data" style={{ color: item.color }}>
                  {item.load}%
                </span>
              </div>
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ background: "oklch(1 0 0 / 8%)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${item.load}%`,
                    background: `linear-gradient(90deg, ${item.color}, oklch(0.75 0.20 220))`,
                  }}
                />
              </div>
            </div>
          ))}

          <div
            className="mt-2 p-3 rounded-lg"
            style={{ background: "oklch(0.65 0.18 150 / 8%)", border: "1px solid oklch(0.65 0.18 150 / 20%)" }}
          >
            <p className="text-xs font-semibold" style={{ color: "oklch(0.75 0.18 150)" }}>
              今日节能统计
            </p>
            <p className="text-2xl font-bold font-mono-data mt-1" style={{ color: "oklch(0.80 0.18 150)" }}>
              2,847 <span className="text-sm font-normal">kWh</span>
            </p>
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.50 0.012 220)" }}>
              较基准供热节省 18.6%
            </p>
          </div>
        </div>
      </div>

      {/* System Flow */}
      <div
        className="p-6 rounded-xl"
        style={{
          background: "oklch(0.14 0.025 235)",
          border: "1px solid oklch(1 0 0 / 8%)",
        }}
      >
        <h3
          className="font-semibold text-sm mb-5"
          style={{ color: "oklch(0.92 0.008 220)" }}
        >
          系统工作流程
        </h3>
        <div className="flex items-start gap-2">
          {systemFlow.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="flex items-start gap-2 flex-1">
                <div className="flex flex-col items-center gap-3 flex-1">
                  <div
                    className="flex items-center gap-3 p-4 rounded-xl w-full"
                    style={{
                      background: `${step.color}10`,
                      border: `1px solid ${step.color}30`,
                    }}
                  >
                    <div
                      className="flex items-center justify-center rounded-lg flex-shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        background: `${step.color}20`,
                      }}
                    >
                      <Icon size={20} style={{ color: step.color }} />
                    </div>
                    <div>
                      <div
                        className="text-xs font-mono-data mb-1"
                        style={{ color: step.color }}
                      >
                        STEP {step.step}
                      </div>
                      <div
                        className="text-sm font-semibold"
                        style={{ color: "oklch(0.90 0.008 220)" }}
                      >
                        {step.title}
                      </div>
                      <div
                        className="text-xs mt-1 leading-relaxed"
                        style={{ color: "oklch(0.55 0.012 220)" }}
                      >
                        {step.desc}
                      </div>
                    </div>
                  </div>
                </div>
                {idx < systemFlow.length - 1 && (
                  <div className="flex items-center mt-8 flex-shrink-0">
                    <ArrowRight
                      size={20}
                      style={{ color: "oklch(0.40 0.010 220)" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
