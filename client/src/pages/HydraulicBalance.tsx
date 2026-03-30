/**
 * HydraulicBalance Page - 二网水力平衡
 * Design: 能源科技暗黑大屏风
 * - 热网拓扑可视化（SVG动态节点）
 * - 各楼栋室温对比（优化前后）
 * - 阀门调节状态
 * - 水力平衡指标
 */
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import { Network, Droplets, Gauge, ArrowUpDown, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";

const HEAT_NETWORK_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663428492122/CZm6BZEe2oQq4xtYABPMda/heat-network-map-T8xsFCwKHQmhfMuiq8zpXB.webp";

// Building data with before/after optimization
const buildingData = [
  { id: "A1", name: "A1栋", position: "近端", before: 23.8, after: 21.2, valve: 45, floor: 18 },
  { id: "A2", name: "A2栋", position: "近端", before: 23.1, after: 21.0, valve: 48, floor: 15 },
  { id: "B1", name: "B1栋", position: "中端", before: 21.5, after: 21.1, valve: 62, floor: 20 },
  { id: "B2", name: "B2栋", position: "中端", before: 21.2, after: 21.0, valve: 65, floor: 22 },
  { id: "B3", name: "B3栋", position: "中端", before: 20.8, after: 21.2, valve: 70, floor: 18 },
  { id: "C1", name: "C1栋", position: "远端", before: 18.2, after: 20.8, valve: 88, floor: 16 },
  { id: "C2", name: "C2栋", position: "远端", before: 17.8, after: 20.9, valve: 92, floor: 14 },
  { id: "C3", name: "C3栋", position: "远端", before: 18.5, after: 21.1, valve: 85, floor: 12 },
];

// Network topology nodes
const networkNodes = [
  // Heat source
  { id: "source", x: 400, y: 50, type: "source", label: "热源/换热站", temp: 65 },
  // Primary loop
  { id: "main", x: 400, y: 150, type: "main", label: "主管网", temp: 60 },
  // Secondary branches
  { id: "branchA", x: 180, y: 250, type: "branch", label: "A区支管", temp: 58 },
  { id: "branchB", x: 400, y: 250, type: "branch", label: "B区支管", temp: 55 },
  { id: "branchC", x: 620, y: 250, type: "branch", label: "C区支管", temp: 50 },
  // Buildings
  { id: "A1", x: 100, y: 360, type: "building", label: "A1栋", temp: 21.2, position: "近端" },
  { id: "A2", x: 260, y: 360, type: "building", label: "A2栋", temp: 21.0, position: "近端" },
  { id: "B1", x: 320, y: 360, type: "building", label: "B1栋", temp: 21.1, position: "中端" },
  { id: "B2", x: 400, y: 360, type: "building", label: "B2栋", temp: 21.0, position: "中端" },
  { id: "B3", x: 480, y: 360, type: "building", label: "B3栋", temp: 21.2, position: "中端" },
  { id: "C1", x: 540, y: 360, type: "building", label: "C1栋", temp: 20.8, position: "远端" },
  { id: "C2", x: 620, y: 360, type: "building", label: "C2栋", temp: 20.9, position: "远端" },
  { id: "C3", x: 700, y: 360, type: "building", label: "C3栋", temp: 21.1, position: "远端" },
];

const networkEdges = [
  { from: "source", to: "main" },
  { from: "main", to: "branchA" },
  { from: "main", to: "branchB" },
  { from: "main", to: "branchC" },
  { from: "branchA", to: "A1" },
  { from: "branchA", to: "A2" },
  { from: "branchB", to: "B1" },
  { from: "branchB", to: "B2" },
  { from: "branchB", to: "B3" },
  { from: "branchC", to: "C1" },
  { from: "branchC", to: "C2" },
  { from: "branchC", to: "C3" },
];

function getNodePos(id: string) {
  return networkNodes.find((n) => n.id === id)!;
}

function getTempColor(temp: number, isBuilding: boolean) {
  if (!isBuilding) return "#3b82f6";
  if (temp >= 21 && temp <= 22) return "#10b981";
  if (temp < 20) return "#3b82f6";
  if (temp > 23) return "#ef4444";
  return "#f59e0b";
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="p-3 rounded-lg text-xs"
        style={{
          background: "oklch(0.16 0.025 235)",
          border: "1px solid oklch(1 0 0 / 15%)",
        }}
      >
        <p className="font-semibold mb-2" style={{ color: "oklch(0.85 0.008 220)" }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.fill }} className="mb-1">
            {p.name}: {p.value}°C
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function HydraulicBalance() {
  const [showOptimized, setShowOptimized] = useState(true);
  const [animatedNodes, setAnimatedNodes] = useState<string[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);

  useEffect(() => {
    // Animate nodes one by one
    networkNodes.forEach((node, i) => {
      setTimeout(() => {
        setAnimatedNodes((prev) => [...prev, node.id]);
      }, i * 100);
    });
  }, []);

  const chartData = buildingData.map((b) => ({
    name: b.name,
    优化前: b.before,
    优化后: b.after,
    position: b.position,
  }));

  const selectedBuildingData = selectedBuilding
    ? buildingData.find((b) => b.id === selectedBuilding)
    : null;

  const imbalanceScore = showOptimized ? 0.31 : 5.6;
  const stdDev = showOptimized ? 0.14 : 2.1;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{ width: 44, height: 44, background: "oklch(0.65 0.18 150 / 15%)" }}
          >
            <Network size={22} style={{ color: "oklch(0.75 0.18 150)" }} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "oklch(0.92 0.008 220)" }}>
              二网水力平衡
            </h2>
            <p className="text-xs" style={{ color: "oklch(0.50 0.012 220)" }}>
              基于室温辨识结果，自动调节各楼栋阀门开度，消除冷热不均
            </p>
          </div>
        </div>

        {/* Toggle */}
        <div
          className="flex items-center rounded-lg p-1 gap-1"
          style={{ background: "oklch(0.14 0.025 235)", border: "1px solid oklch(1 0 0 / 8%)" }}
        >
          <button
            onClick={() => setShowOptimized(false)}
            className="px-4 py-2 rounded-md text-sm transition-all"
            style={{
              background: !showOptimized ? "oklch(0.65 0.22 25 / 20%)" : "transparent",
              color: !showOptimized ? "oklch(0.75 0.22 25)" : "oklch(0.55 0.012 220)",
              border: !showOptimized ? "1px solid oklch(0.65 0.22 25 / 40%)" : "1px solid transparent",
            }}
          >
            优化前
          </button>
          <button
            onClick={() => setShowOptimized(true)}
            className="px-4 py-2 rounded-md text-sm transition-all"
            style={{
              background: showOptimized ? "oklch(0.65 0.18 150 / 20%)" : "transparent",
              color: showOptimized ? "oklch(0.75 0.18 150)" : "oklch(0.55 0.012 220)",
              border: showOptimized ? "1px solid oklch(0.65 0.18 150 / 40%)" : "1px solid transparent",
            }}
          >
            优化后
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "不平衡度",
            value: imbalanceScore.toFixed(2),
            unit: "°C",
            desc: showOptimized ? "已达标（<0.5°C）" : "超标（目标<0.5°C）",
            color: showOptimized ? "oklch(0.65 0.18 150)" : "oklch(0.65 0.22 25)",
            icon: ArrowUpDown,
          },
          {
            label: "室温标准差",
            value: stdDev.toFixed(2),
            unit: "°C",
            desc: showOptimized ? "分布均匀" : "分布不均",
            color: showOptimized ? "oklch(0.65 0.18 150)" : "oklch(0.65 0.22 25)",
            icon: Gauge,
          },
          {
            label: "调节楼栋数",
            value: "8",
            unit: "栋",
            desc: "全部完成调节",
            color: "oklch(0.65 0.20 220)",
            icon: Network,
          },
          {
            label: "节热量",
            value: "12.4",
            unit: "%",
            desc: "较优化前节省",
            color: "oklch(0.72 0.18 55)",
            icon: TrendingUp,
          },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="p-4 rounded-xl"
              style={{
                background: "oklch(0.14 0.025 235)",
                border: `1px solid ${m.color}30`,
                borderTop: `2px solid ${m.color}`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: "oklch(0.55 0.012 220)" }}>
                  {m.label}
                </span>
                <Icon size={15} style={{ color: m.color }} />
              </div>
              <div
                className="text-3xl font-bold font-mono-data"
                style={{ color: m.color }}
              >
                {m.value}
                <span className="text-sm font-normal ml-1">{m.unit}</span>
              </div>
              <p className="text-xs mt-1" style={{ color: "oklch(0.50 0.012 220)" }}>
                {m.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Content: Network Topology + Bar Chart */}
      <div className="grid grid-cols-5 gap-6">
        {/* Network Topology SVG */}
        <div
          className="col-span-3 p-5 rounded-xl"
          style={{
            background: "oklch(0.14 0.025 235)",
            border: "1px solid oklch(1 0 0 / 8%)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: "oklch(0.92 0.008 220)" }}>
              热网拓扑图
            </h3>
            <div className="flex items-center gap-4 text-xs" style={{ color: "oklch(0.50 0.012 220)" }}>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: "oklch(0.65 0.18 150)" }} />
                舒适（20~22°C）
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: "oklch(0.65 0.20 220)" }} />
                偏冷
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: "oklch(0.65 0.22 25)" }} />
                偏热
              </span>
            </div>
          </div>
          <div className="relative" style={{ height: 420 }}>
            <img
              src={HEAT_NETWORK_IMG}
              alt="热网拓扑"
              className="absolute inset-0 w-full h-full object-cover rounded-lg"
              style={{ opacity: 0.15 }}
            />
            <svg
              viewBox="0 0 800 430"
              className="w-full h-full relative z-10"
              style={{ overflow: "visible" }}
            >
              {/* Edges */}
              {networkEdges.map((edge) => {
                const from = getNodePos(edge.from);
                const to = getNodePos(edge.to);
                if (!from || !to) return null;
                return (
                  <g key={`${edge.from}-${edge.to}`}>
                    <line
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke="#3b82f6"
                      strokeWidth={from.type === "source" || to.type === "main" ? 3 : 2}
                      strokeOpacity={0.4}
                    />
                    {/* Animated flow particle */}
                    <circle r={3} fill="#f59e0b" opacity={0.8}>
                      <animateMotion
                        dur={`${2 + Math.random() * 2}s`}
                        repeatCount="indefinite"
                        path={`M${from.x},${from.y} L${to.x},${to.y}`}
                      />
                    </circle>
                  </g>
                );
              })}

              {/* Nodes */}
              {networkNodes.map((node) => {
                const isBuilding = node.type === "building";
                const isVisible = animatedNodes.includes(node.id);
                const color = getTempColor(node.temp, isBuilding);
                const isSelected = selectedBuilding === node.id;
                const nodeData = isBuilding ? buildingData.find((b) => b.id === node.id) : null;
                const displayTemp = isBuilding && nodeData
                  ? showOptimized ? nodeData.after : nodeData.before
                  : node.temp;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transition: "opacity 0.5s",
                      cursor: isBuilding ? "pointer" : "default",
                    }}
                    onClick={() => isBuilding && setSelectedBuilding(isSelected ? null : node.id)}
                  >
                    {/* Glow */}
                    <circle
                      r={isBuilding ? 22 : 28}
                      fill={color}
                      opacity={0.1}
                    />
                    {/* Main circle */}
                    <circle
                      r={isBuilding ? 16 : 22}
                      fill={isBuilding ? "oklch(0.14 0.025 235)" : "oklch(0.12 0.025 238)"}
                      stroke={isSelected ? "white" : color}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                    {/* Type icon text */}
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={isBuilding ? 9 : 8}
                      fill={color}
                      fontWeight="600"
                    >
                      {isBuilding ? `${displayTemp.toFixed(1)}°` : node.type === "source" ? "热源" : "管"}
                    </text>
                    {/* Label */}
                    <text
                      y={isBuilding ? 28 : 36}
                      textAnchor="middle"
                      fontSize={9}
                      fill="#6b7280"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Selected building detail */}
          {selectedBuildingData && (
            <div
              className="mt-3 p-3 rounded-lg flex items-center gap-6"
              style={{
                background: "oklch(0.65 0.20 220 / 8%)",
                border: "1px solid oklch(0.65 0.20 220 / 25%)",
              }}
            >
              <div>
                <span className="text-xs" style={{ color: "oklch(0.55 0.012 220)" }}>楼栋</span>
                <p className="font-semibold text-sm" style={{ color: "oklch(0.90 0.008 220)" }}>
                  {selectedBuildingData.name} · {selectedBuildingData.position}
                </p>
              </div>
              <div>
                <span className="text-xs" style={{ color: "oklch(0.55 0.012 220)" }}>优化前室温</span>
                <p className="font-mono-data font-bold" style={{ color: "oklch(0.65 0.22 25)" }}>
                  {selectedBuildingData.before}°C
                </p>
              </div>
              <div>
                <span className="text-xs" style={{ color: "oklch(0.55 0.012 220)" }}>优化后室温</span>
                <p className="font-mono-data font-bold" style={{ color: "oklch(0.65 0.18 150)" }}>
                  {selectedBuildingData.after}°C
                </p>
              </div>
              <div>
                <span className="text-xs" style={{ color: "oklch(0.55 0.012 220)" }}>阀门开度</span>
                <p className="font-mono-data font-bold" style={{ color: "oklch(0.72 0.18 55)" }}>
                  {selectedBuildingData.valve}%
                </p>
              </div>
              <div>
                <span className="text-xs" style={{ color: "oklch(0.55 0.012 220)" }}>楼层数</span>
                <p className="font-mono-data font-bold" style={{ color: "oklch(0.65 0.20 220)" }}>
                  {selectedBuildingData.floor}层
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bar Chart + Valve Status */}
        <div className="col-span-2 flex flex-col gap-4">
          {/* Temperature Comparison */}
          <div
            className="p-5 rounded-xl flex-1"
            style={{
              background: "oklch(0.14 0.025 235)",
              border: "1px solid oklch(1 0 0 / 8%)",
            }}
          >
            <h3 className="font-semibold text-sm mb-1" style={{ color: "oklch(0.92 0.008 220)" }}>
              各楼栋室温对比
            </h3>
            <p className="text-xs mb-3" style={{ color: "oklch(0.50 0.012 220)" }}>
              {showOptimized ? "优化后：室温趋于均匀" : "优化前：近端偏热，远端偏冷"}
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "oklch(0.50 0.012 220)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[15, 26]}
                  tick={{ fill: "oklch(0.50 0.012 220)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <ReferenceLine
                  y={20}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                />
                <ReferenceLine
                  y={22}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                />
                <Bar dataKey={showOptimized ? "优化后" : "优化前"} radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => {
                    const val = showOptimized ? entry["优化后"] : entry["优化前"];
                    const color = val >= 20 && val <= 22
                      ? "#10b981"
                      : val < 20
                      ? "#3b82f6"
                      : "#ef4444";
                    return <Cell key={index} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Valve Status */}
          <div
            className="p-5 rounded-xl"
            style={{
              background: "oklch(0.14 0.025 235)",
              border: "1px solid oklch(1 0 0 / 8%)",
            }}
          >
            <h3 className="font-semibold text-sm mb-3" style={{ color: "oklch(0.92 0.008 220)" }}>
              阀门调节状态
            </h3>
            <div className="flex flex-col gap-2">
              {buildingData.slice(0, 6).map((b) => {
                const isOptimal = b.after >= 20 && b.after <= 22;
                return (
                  <div key={b.id} className="flex items-center gap-3">
                    <span
                      className="text-xs w-12 flex-shrink-0"
                      style={{ color: "oklch(0.65 0.010 220)" }}
                    >
                      {b.name}
                    </span>
                    <div
                      className="flex-1 h-4 rounded overflow-hidden"
                      style={{ background: "oklch(1 0 0 / 5%)" }}
                    >
                      <div
                        className="h-full rounded transition-all duration-1000"
                        style={{
                          width: showOptimized ? `${b.valve}%` : `${Math.max(30, b.valve - 20)}%`,
                          background: isOptimal
                            ? "linear-gradient(90deg, #10b98199, #10b981)"
                            : "linear-gradient(90deg, #3b82f699, #3b82f6)",
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-mono-data w-8 text-right flex-shrink-0"
                      style={{ color: "oklch(0.65 0.010 220)" }}
                    >
                      {showOptimized ? b.valve : Math.max(30, b.valve - 20)}%
                    </span>
                    {isOptimal ? (
                      <CheckCircle2 size={13} style={{ color: "oklch(0.65 0.18 150)", flexShrink: 0 }} />
                    ) : (
                      <AlertTriangle size={13} style={{ color: "oklch(0.72 0.18 55)", flexShrink: 0 }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Principle Explanation */}
      <div
        className="p-5 rounded-xl"
        style={{
          background: "oklch(0.14 0.025 235)",
          border: "1px solid oklch(1 0 0 / 8%)",
        }}
      >
        <h3 className="font-semibold text-sm mb-4" style={{ color: "oklch(0.92 0.008 220)" }}>
          水力平衡优化原理
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              title: "问题：近热远冷",
              icon: "⚠️",
              color: "oklch(0.65 0.22 25)",
              content: "传统供热中，靠近换热站的楼栋（近端）水压大、流量多，室温偏高；远端楼栋水压小、流量少，室温偏低，形成近热远冷现象。",
            },
            {
              title: "方案：AI驱动阀门调节",
              icon: "🤖",
              color: "oklch(0.65 0.20 220)",
              content: "系统根据AI预测的各楼栋室温，自动计算最优阀门开度。近端楼栋适当关小阀门，远端楼栋开大阀门，重新分配水力，使各楼栋流量趋于均衡。",
            },
            {
              title: "效果：均匀舒适+节能",
              icon: "✅",
              color: "oklch(0.65 0.18 150)",
              content: "优化后各楼栋室温均控制在20~22°C舒适区间，室温标准差从2.1°C降至0.14°C，同时减少过热楼栋的无效热耗，综合节能12%以上。",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-4 rounded-lg"
              style={{
                background: `${item.color}08`,
                border: `1px solid ${item.color}25`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{item.icon}</span>
                <span className="font-semibold text-sm" style={{ color: item.color }}>
                  {item.title}
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "oklch(0.60 0.010 220)" }}>
                {item.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
