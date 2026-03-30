/**
 * HeatDecision Page - 换热站按需供热决策
 * Design: 能源科技暗黑大屏风
 * - 决策流程可视化
 * - 热源充足/不足两种场景切换
 * - 实时决策日志
 * - 供热调度时序图
 */
import { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts";
import { Zap, AlertTriangle, CheckCircle2, ArrowRight, Flame, Thermometer, Activity, Clock } from "lucide-react";

// Decision log entries
const generateDecisionLog = (scenario: "sufficient" | "insufficient") => {
  const now = new Date();
  const logs = scenario === "sufficient"
    ? [
        { time: -2, level: "info", msg: "AI预测：未来2小时热负荷需求 87.4 MW" },
        { time: -5, level: "success", msg: "热源供给 92.1 MW，充足，进入管网优化模式" },
        { time: -8, level: "info", msg: "水力平衡计算：8栋楼阀门开度已优化" },
        { time: -12, level: "success", msg: "A区室温均值 21.1°C，达标" },
        { time: -15, level: "success", msg: "B区室温均值 21.0°C，达标" },
        { time: -18, level: "info", msg: "C区远端楼栋阀门开度调整至 88%" },
        { time: -22, level: "success", msg: "C区室温均值 20.9°C，达标" },
        { time: -30, level: "info", msg: "系统运行正常，节能率 18.6%" },
      ]
    : [
        { time: -1, level: "warning", msg: "AI预测：未来1小时热负荷需求 94.2 MW" },
        { time: -3, level: "error", msg: "热源供给 78.5 MW，不足！缺口 15.7 MW" },
        { time: -4, level: "warning", msg: "启动热源申请流程，上报调度中心" },
        { time: -6, level: "info", msg: "临时措施：优先保障C区远端楼栋供热" },
        { time: -8, level: "warning", msg: "A区近端楼栋适当降低供水温度至 52°C" },
        { time: -10, level: "info", msg: "调度中心响应：增加热源 12 MW" },
        { time: -15, level: "success", msg: "热源补充到位，缺口缩小至 3.7 MW" },
        { time: -20, level: "info", msg: "系统进入恢复模式，逐步恢复正常供热" },
      ];

  return logs.map((l) => ({
    ...l,
    timestamp: new Date(now.getTime() + l.time * 60000).toLocaleTimeString("zh-CN", { hour12: false }),
  }));
};

// Generate heat supply timeline
function generateTimeline(scenario: "sufficient" | "insufficient") {
  return Array.from({ length: 24 }, (_, h) => {
    const demand = 80 + Math.sin((h / 24) * Math.PI * 2) * 15 + (Math.random() - 0.5) * 3;
    const supply = scenario === "sufficient"
      ? demand + 5 + (Math.random() - 0.5) * 3
      : h >= 8 && h <= 16
      ? demand - 15 + (Math.random() - 0.5) * 3
      : demand + 3 + (Math.random() - 0.5) * 3;
    return {
      hour: `${String(h).padStart(2, "0")}:00`,
      demand: +demand.toFixed(1),
      supply: +Math.max(60, supply).toFixed(1),
    };
  });
}

const decisionTree = [
  {
    id: "input",
    label: "AI室温预测",
    sublabel: "各楼栋未来室温",
    type: "input",
    x: 50,
    y: 50,
  },
  {
    id: "calc",
    label: "热负荷计算",
    sublabel: "总需求 = Σ(楼栋需求)",
    type: "process",
    x: 50,
    y: 160,
  },
  {
    id: "compare",
    label: "热源对比",
    sublabel: "需求 vs 供给",
    type: "decision",
    x: 50,
    y: 270,
  },
  {
    id: "sufficient",
    label: "热源充足",
    sublabel: "管网优化分配",
    type: "success",
    x: -80,
    y: 380,
  },
  {
    id: "insufficient",
    label: "热源不足",
    sublabel: "上报申请热源",
    type: "warning",
    x: 180,
    y: 380,
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
        }}
      >
        <p className="font-semibold mb-1" style={{ color: "oklch(0.85 0.008 220)" }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color || p.stroke }}>
            {p.name}: {p.value} MW
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function HeatDecision() {
  const [scenario, setScenario] = useState<"sufficient" | "insufficient">("sufficient");
  const [logs, setLogs] = useState(() => generateDecisionLog("sufficient"));
  const [timeline] = useState(() => ({
    sufficient: generateTimeline("sufficient"),
    insufficient: generateTimeline("insufficient"),
  }));
  const [newLogIndex, setNewLogIndex] = useState(-1);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLogs(generateDecisionLog(scenario));
  }, [scenario]);

  // Simulate new log entries
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const newEntry = scenario === "sufficient"
        ? {
            time: 0,
            level: "info" as const,
            msg: `系统巡检：所有楼栋室温正常，当前热负荷 ${(85 + Math.random() * 5).toFixed(1)} MW`,
            timestamp: now.toLocaleTimeString("zh-CN", { hour12: false }),
          }
        : {
            time: 0,
            level: "warning" as const,
            msg: `热源缺口监控：当前缺口 ${(3 + Math.random() * 5).toFixed(1)} MW，持续申请中`,
            timestamp: now.toLocaleTimeString("zh-CN", { hour12: false }),
          };
      setLogs((prev) => [newEntry, ...prev.slice(0, 9)]);
      setNewLogIndex(0);
      setTimeout(() => setNewLogIndex(-1), 1000);
    }, 5000);
    return () => clearInterval(timer);
  }, [scenario]);

  const currentData = timeline[scenario];
  const isSufficient = scenario === "sufficient";

  const totalDemand = 87.4;
  const totalSupply = isSufficient ? 92.1 : 78.5;
  const gap = totalSupply - totalDemand;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{ width: 44, height: 44, background: "oklch(0.70 0.20 290 / 15%)" }}
          >
            <Zap size={22} style={{ color: "oklch(0.75 0.20 290)" }} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "oklch(0.92 0.008 220)" }}>
              换热站按需供热决策
            </h2>
            <p className="text-xs" style={{ color: "oklch(0.50 0.012 220)" }}>
              基于AI预测热负荷，智能决策：热源充足→管网优化 / 热源不足→申请热源
            </p>
          </div>
        </div>

        {/* Scenario Toggle */}
        <div
          className="flex items-center rounded-lg p-1 gap-1"
          style={{ background: "oklch(0.14 0.025 235)", border: "1px solid oklch(1 0 0 / 8%)" }}
        >
          <button
            onClick={() => setScenario("sufficient")}
            className="px-4 py-2 rounded-md text-sm transition-all flex items-center gap-2"
            style={{
              background: isSufficient ? "oklch(0.65 0.18 150 / 20%)" : "transparent",
              color: isSufficient ? "oklch(0.75 0.18 150)" : "oklch(0.55 0.012 220)",
              border: isSufficient ? "1px solid oklch(0.65 0.18 150 / 40%)" : "1px solid transparent",
            }}
          >
            <CheckCircle2 size={14} />
            热源充足场景
          </button>
          <button
            onClick={() => setScenario("insufficient")}
            className="px-4 py-2 rounded-md text-sm transition-all flex items-center gap-2"
            style={{
              background: !isSufficient ? "oklch(0.65 0.22 25 / 20%)" : "transparent",
              color: !isSufficient ? "oklch(0.75 0.22 25)" : "oklch(0.55 0.012 220)",
              border: !isSufficient ? "1px solid oklch(0.65 0.22 25 / 40%)" : "1px solid transparent",
            }}
          >
            <AlertTriangle size={14} />
            热源不足场景
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div
        className="flex items-center gap-4 p-4 rounded-xl"
        style={{
          background: isSufficient ? "oklch(0.65 0.18 150 / 8%)" : "oklch(0.65 0.22 25 / 8%)",
          border: `1px solid ${isSufficient ? "oklch(0.65 0.18 150 / 30%)" : "oklch(0.65 0.22 25 / 30%)"}`,
        }}
      >
        {isSufficient ? (
          <CheckCircle2 size={24} style={{ color: "oklch(0.65 0.18 150)", flexShrink: 0 }} />
        ) : (
          <AlertTriangle size={24} style={{ color: "oklch(0.65 0.22 25)", flexShrink: 0 }} />
        )}
        <div className="flex-1">
          <p
            className="font-semibold text-sm"
            style={{ color: isSufficient ? "oklch(0.75 0.18 150)" : "oklch(0.75 0.22 25)" }}
          >
            {isSufficient ? "当前状态：热源充足，系统进入管网优化分配模式" : "当前状态：热源不足，系统已启动热源申请流程"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.012 220)" }}>
            {isSufficient
              ? `热源供给 ${totalSupply} MW > 需求 ${totalDemand} MW，盈余 ${gap.toFixed(1)} MW，正在优化各区域分配`
              : `热源供给 ${totalSupply} MW < 需求 ${totalDemand} MW，缺口 ${Math.abs(gap).toFixed(1)} MW，已向调度中心申请增供`}
          </p>
        </div>
        <div className="flex items-center gap-6">
          {[
            { label: "热需求", value: `${totalDemand} MW`, color: "oklch(0.72 0.18 55)" },
            { label: "热供给", value: `${totalSupply} MW`, color: isSufficient ? "oklch(0.65 0.18 150)" : "oklch(0.65 0.22 25)" },
            { label: gap >= 0 ? "盈余" : "缺口", value: `${Math.abs(gap).toFixed(1)} MW`, color: isSufficient ? "oklch(0.65 0.18 150)" : "oklch(0.65 0.22 25)" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-xs" style={{ color: "oklch(0.50 0.012 220)" }}>{item.label}</div>
              <div className="font-mono-data font-bold text-lg" style={{ color: item.color }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-5 gap-6">
        {/* Decision Flow */}
        <div
          className="col-span-2 p-5 rounded-xl"
          style={{
            background: "oklch(0.14 0.025 235)",
            border: "1px solid oklch(1 0 0 / 8%)",
          }}
        >
          <h3 className="font-semibold text-sm mb-4" style={{ color: "oklch(0.92 0.008 220)" }}>
            决策流程
          </h3>

          {/* Decision Tree Visual */}
          <div className="flex flex-col items-center gap-0">
            {/* Step 1 */}
            {[
              {
                icon: Thermometer,
                title: "室温辨识输出",
                desc: "各楼栋预测室温 → 计算热需求",
                color: "oklch(0.65 0.20 220)",
                active: true,
              },
              {
                icon: Activity,
                title: "热负荷汇总",
                desc: `总需求 = ${totalDemand} MW`,
                color: "oklch(0.72 0.18 55)",
                active: true,
              },
              {
                icon: Zap,
                title: "热源对比判断",
                desc: `供给 ${totalSupply} MW ${gap >= 0 ? ">" : "<"} 需求 ${totalDemand} MW`,
                color: "oklch(0.70 0.20 290)",
                active: true,
              },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex flex-col items-center w-full">
                  <div
                    className="flex items-center gap-3 p-3 rounded-xl w-full"
                    style={{
                      background: `${step.color}10`,
                      border: `1px solid ${step.color}30`,
                    }}
                  >
                    <div
                      className="flex items-center justify-center rounded-lg flex-shrink-0"
                      style={{ width: 36, height: 36, background: `${step.color}20` }}
                    >
                      <Icon size={18} style={{ color: step.color }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "oklch(0.88 0.008 220)" }}>
                        {step.title}
                      </div>
                      <div className="text-xs" style={{ color: "oklch(0.55 0.012 220)" }}>
                        {step.desc}
                      </div>
                    </div>
                  </div>
                  <div
                    className="w-0.5 h-6"
                    style={{ background: "oklch(1 0 0 / 15%)" }}
                  />
                </div>
              );
            })}

            {/* Branch */}
            <div className="flex items-start gap-3 w-full">
              {/* Sufficient */}
              <div
                className="flex-1 p-3 rounded-xl"
                style={{
                  background: isSufficient ? "oklch(0.65 0.18 150 / 15%)" : "oklch(0.65 0.18 150 / 5%)",
                  border: `1px solid ${isSufficient ? "oklch(0.65 0.18 150 / 50%)" : "oklch(0.65 0.18 150 / 15%)"}`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={14} style={{ color: "oklch(0.65 0.18 150)" }} />
                  <span className="text-xs font-semibold" style={{ color: "oklch(0.75 0.18 150)" }}>
                    热源充足
                  </span>
                </div>
                <ul className="flex flex-col gap-1">
                  {["计算最优分配方案", "调节各区阀门开度", "均衡各楼栋室温", "持续监控优化"].map((item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <ArrowRight size={10} style={{ color: "oklch(0.65 0.18 150)", flexShrink: 0 }} />
                      <span className="text-xs" style={{ color: "oklch(0.60 0.010 220)" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Insufficient */}
              <div
                className="flex-1 p-3 rounded-xl"
                style={{
                  background: !isSufficient ? "oklch(0.65 0.22 25 / 15%)" : "oklch(0.65 0.22 25 / 5%)",
                  border: `1px solid ${!isSufficient ? "oklch(0.65 0.22 25 / 50%)" : "oklch(0.65 0.22 25 / 15%)"}`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} style={{ color: "oklch(0.65 0.22 25)" }} />
                  <span className="text-xs font-semibold" style={{ color: "oklch(0.75 0.22 25)" }}>
                    热源不足
                  </span>
                </div>
                <ul className="flex flex-col gap-1">
                  {["计算热源缺口", "上报调度中心", "优先保障远端", "等待热源补充"].map((item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <ArrowRight size={10} style={{ color: "oklch(0.65 0.22 25)", flexShrink: 0 }} />
                      <span className="text-xs" style={{ color: "oklch(0.60 0.010 220)" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Supply/Demand Chart + Log */}
        <div className="col-span-3 flex flex-col gap-4">
          {/* Chart */}
          <div
            className="p-5 rounded-xl"
            style={{
              background: "oklch(0.14 0.025 235)",
              border: "1px solid oklch(1 0 0 / 8%)",
            }}
          >
            <h3 className="font-semibold text-sm mb-1" style={{ color: "oklch(0.92 0.008 220)" }}>
              24小时供需曲线
            </h3>
            <p className="text-xs mb-4" style={{ color: "oklch(0.50 0.012 220)" }}>
              热负荷需求（橙色）vs 热源供给（{isSufficient ? "绿色" : "红色"}）
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={currentData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradDemand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradSupply" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isSufficient ? "#10b981" : "#ef4444"} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isSufficient ? "#10b981" : "#ef4444"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" />
                <XAxis dataKey="hour" tick={{ fill: "oklch(0.50 0.012 220)", fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
                <YAxis domain={[60, 110]} tick={{ fill: "oklch(0.50 0.012 220)", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="demand" name="热需求" stroke="#f59e0b" fill="url(#gradDemand)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="supply" name="热供给" stroke={isSufficient ? "#10b981" : "#ef4444"} fill="url(#gradSupply)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Decision Log */}
          <div
            className="p-5 rounded-xl flex-1"
            style={{
              background: "oklch(0.14 0.025 235)",
              border: "1px solid oklch(1 0 0 / 8%)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm" style={{ color: "oklch(0.92 0.008 220)" }}>
                决策日志
              </h3>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: "oklch(0.65 0.18 150)",
                    boxShadow: "0 0 6px oklch(0.65 0.18 150)",
                    animation: "pulse-ring 2s ease-out infinite",
                  }}
                />
                <span className="text-xs" style={{ color: "oklch(0.55 0.012 220)" }}>实时更新</span>
              </div>
            </div>
            <div ref={logRef} className="flex flex-col gap-1.5 overflow-y-auto" style={{ maxHeight: 200 }}>
              {logs.map((log, i) => {
                const colors = {
                  info: "oklch(0.65 0.20 220)",
                  success: "oklch(0.65 0.18 150)",
                  warning: "oklch(0.72 0.18 55)",
                  error: "oklch(0.65 0.22 25)",
                };
                const icons = {
                  info: "ℹ",
                  success: "✓",
                  warning: "⚠",
                  error: "✗",
                };
                const color = colors[log.level as keyof typeof colors];
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-2 rounded-lg transition-all duration-500"
                    style={{
                      background: i === newLogIndex ? `${color}15` : "transparent",
                      border: `1px solid ${i === newLogIndex ? `${color}30` : "transparent"}`,
                    }}
                  >
                    <span
                      className="text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{ color, width: 12 }}
                    >
                      {icons[log.level as keyof typeof icons]}
                    </span>
                    <span
                      className="font-mono-data text-xs flex-shrink-0"
                      style={{ color: "oklch(0.45 0.010 220)" }}
                    >
                      {log.timestamp}
                    </span>
                    <span className="text-xs" style={{ color: "oklch(0.70 0.010 220)" }}>
                      {log.msg}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Station Cards */}
      <div>
        <h3 className="font-semibold text-sm mb-3" style={{ color: "oklch(0.75 0.010 220)" }}>
          换热站状态
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { name: "1号换热站", area: "A区", supply: 28.4, demand: 26.1, status: "normal" },
            { name: "2号换热站", area: "B区", supply: isSufficient ? 32.5 : 24.8, demand: 31.2, status: isSufficient ? "normal" : "warning" },
            { name: "3号换热站", area: "C区", supply: isSufficient ? 31.2 : 23.7, demand: 30.1, status: isSufficient ? "normal" : "warning" },
            { name: "备用换热站", area: "应急", supply: isSufficient ? 0 : 6.0, demand: 0, status: isSufficient ? "standby" : "active" },
          ].map((station) => {
            const statusColors = {
              normal: "oklch(0.65 0.18 150)",
              warning: "oklch(0.65 0.22 25)",
              standby: "oklch(0.55 0.012 220)",
              active: "oklch(0.72 0.18 55)",
            };
            const statusLabels = { normal: "正常运行", warning: "供热不足", standby: "待机", active: "应急启用" };
            const color = statusColors[station.status as keyof typeof statusColors];
            return (
              <div
                key={station.name}
                className="p-4 rounded-xl"
                style={{
                  background: "oklch(0.14 0.025 235)",
                  border: `1px solid ${color}30`,
                  borderTop: `2px solid ${color}`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "oklch(0.88 0.008 220)" }}>
                      {station.name}
                    </p>
                    <p className="text-xs" style={{ color: "oklch(0.50 0.012 220)" }}>
                      {station.area}
                    </p>
                  </div>
                  <Flame size={18} style={{ color }} />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <p className="text-xs" style={{ color: "oklch(0.50 0.012 220)" }}>供给</p>
                    <p className="font-mono-data font-bold" style={{ color }}>
                      {station.supply} <span className="text-xs font-normal">MW</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "oklch(0.50 0.012 220)" }}>需求</p>
                    <p className="font-mono-data font-bold" style={{ color: "oklch(0.72 0.18 55)" }}>
                      {station.demand} <span className="text-xs font-normal">MW</span>
                    </p>
                  </div>
                </div>
                <div
                  className="text-xs px-2 py-1 rounded text-center"
                  style={{ background: `${color}15`, color }}
                >
                  {statusLabels[station.status as keyof typeof statusLabels]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
