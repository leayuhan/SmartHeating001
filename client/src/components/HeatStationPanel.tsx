/**
 * HeatStationPanel - 换热站供热决策面板
 * Theme: Light Tech — White base + precision blue data lines
 * Features: 24h supply/return temp trend, hydraulic balance bar chart, AI decision, building details
 */
import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Legend, ReferenceLine,
} from "recharts";
import type { HeatStation, Building, WeatherType } from "../pages/Home";

interface Props {
  station: HeatStation;
  buildings: Building[];
  weather: WeatherType;
  onClose: () => void;
}

/** Generate synthetic 24h supply/return temperature history */
function generate24hData(station: HeatStation, weather: WeatherType) {
  const now = new Date();
  const weatherNoise: Record<WeatherType, number> = { sunny: 0, cloudy: -1, rainy: -2.5, snowy: -5 };
  const wn = weatherNoise[weather] ?? 0;
  return Array.from({ length: 25 }, (_, i) => {
    const hoursAgo = 24 - i;
    const t = new Date(now.getTime() - hoursAgo * 3600_000);
    const hour = t.getHours();
    // Night setback: 0-6h supply temp drops ~3°C
    const nightOffset = hour < 6 ? -2.5 : hour < 8 ? -1 : 0;
    // Afternoon peak: 13-16h slight rise
    const afternoonBoost = hour >= 13 && hour <= 16 ? 1.5 : 0;
    const noise = Math.sin(i * 1.7 + station.id.charCodeAt(1)) * 0.6;
    const supplyT = +(station.supplyTemp + nightOffset + afternoonBoost + wn * 0.4 + noise).toFixed(1);
    const returnT = +(station.returnTemp + nightOffset * 0.6 + afternoonBoost * 0.4 + wn * 0.3 + noise * 0.5).toFixed(1);
    const label = `${String(t.getHours()).padStart(2, "0")}:00`;
    return { time: label, supply: supplyT, return: returnT, diff: +(supplyT - returnT).toFixed(1) };
  });
}

function exportCSV(station: HeatStation, trendData: ReturnType<typeof generate24hData>) {
  const header = "时间,供水温度(°C),回水温度(°C),供回水温差(°C)";
  const rows = trendData.map(d => `${d.time},${d.supply},${d.return},${d.diff}`);
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${station.name}_24h供回水温度_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HeatStationPanel({ station, buildings, weather, onClose }: Props) {
  const avgTemp = +(buildings.reduce((s, b) => s + b.temp, 0) / buildings.length).toFixed(1);
  const riskBuildings = buildings.filter(b => b.temp < 18);
  const needsMore = avgTemp < 20;
  const weatherLabel = weather === "sunny" ? "晴天" : weather === "cloudy" ? "多云" : weather === "rainy" ? "雨天" : "雪天";

  const balanceData = buildings.map(b => ({
    name: b.name,
    temp: b.temp,
    target: 20.5,
    diff: +(b.temp - 20.5).toFixed(1),
  }));

  const trendData = useMemo(() => generate24hData(station, weather), [station.id, weather]);

  // Show only every 4th label to avoid crowding
  const trendTick = (value: string, index: number) => index % 4 === 0 ? value : "";

  return (
    <div
      className="flex flex-col h-full overflow-hidden flex-shrink-0 animate-slide-in-right"
      style={{
        width: 360,
        background: "#FFFFFF",
        borderLeft: "1px solid #E2E8F0",
        boxShadow: "-4px 0 20px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2" style={{ borderBottom: "1px solid #E2E8F0" }}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="panel-title-accent" />
              <span className="text-base font-black" style={{ color: "#111827" }}>{station.name}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{
                  background: needsMore ? "#FEF3C7" : "#D1FAE5",
                  color: needsMore ? "#92400E" : "#065F46",
                }}>
                {needsMore ? "需增热" : "运行正常"}
              </span>
            </div>
            <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
              管辖 {buildings.length} 栋楼 · {weatherLabel} · 均温 {avgTemp}°C
            </div>
          </div>
          <button onClick={onClose}
            className="close-btn">
            ✕
          </button>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: "供水温度", value: `${station.supplyTemp}°C`, color: "#EF4444", bg: "#FEE2E2" },
            { label: "回水温度", value: `${station.returnTemp}°C`, color: "#3B82F6", bg: "#DBEAFE" },
            { label: "流量", value: `${station.flow} t/h`, color: "#4F46E5", bg: "#EEF2FF" },
            { label: "压力", value: `${station.pressure} MPa`, color: "#10B981", bg: "#D1FAE5" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="rounded-lg p-1.5 text-center" style={{ background: bg }}>
              <div className="text-[9px]" style={{ color: "#9CA3AF" }}>{label}</div>
              <div className="text-xs font-black" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">

        {/* ── 24h Supply/Return Trend Chart ── */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-xs font-bold" style={{ color: "#374151" }}>
              过去24小时 供/回水温度趋势
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div style={{ width: 10, height: 2, background: "#F97316", borderRadius: 1 }} />
                <span className="text-[9px]" style={{ color: "#9CA3AF", fontFamily: "'Share Tech Mono', monospace" }}>供水</span>
              </div>
              <div className="flex items-center gap-1">
                <div style={{ width: 10, height: 2, background: "#3B82F6", borderRadius: 1 }} />
                <span className="text-[9px]" style={{ color: "#9CA3AF", fontFamily: "'Share Tech Mono', monospace" }}>回水</span>
              </div>
            </div>
          </div>
          <div style={{ height: 130 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 8, fill: "#9CA3AF", fontFamily: "'Share Tech Mono', monospace" }}
                  tickFormatter={trendTick}
                  interval={0}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 8, fill: "#9CA3AF", fontFamily: "'Share Tech Mono', monospace" }}
                  unit="°"
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 10, borderRadius: 6, border: "1px solid #E2E8F0",
                    background: "#FFFFFF", boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                  formatter={(v: number, name: string) => [`${v}°C`, name === "supply" ? "供水温度" : "回水温度"]}
                  labelStyle={{ color: "#374151", fontWeight: 700, fontFamily: "'Share Tech Mono', monospace" }}
                />
                <Line
                  type="monotone" dataKey="supply"
                  stroke="#F97316" strokeWidth={2} dot={false}
                  activeDot={{ r: 3, fill: "#F97316" }}
                />
                <Line
                  type="monotone" dataKey="return"
                  stroke="#3B82F6" strokeWidth={2} dot={false}
                  activeDot={{ r: 3, fill: "#3B82F6" }}
                  strokeDasharray="5 3"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Supply-return differential */}
          <div className="flex items-center justify-between mt-1 px-1">
            <span className="text-[9px]" style={{ color: "#9CA3AF", fontFamily: "'Share Tech Mono', monospace" }}>
              当前供回水温差
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded"
              style={{
                background: "#FFF7ED", color: "#C2410C",
                border: "1px solid #FED7AA",
                fontFamily: "'Share Tech Mono', monospace",
              }}>
              ΔT = {station.supplyTemp - station.returnTemp}°C
            </span>
          </div>
        </div>

        {/* ── Hydraulic Balance Chart ── */}
        <div className="mb-3">
          <div className="text-xs font-bold mb-1.5" style={{ color: "#374151" }}>
            二网水力平衡 — 各楼栋室温 vs 目标值
          </div>
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={balanceData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#9CA3AF" }} />
                <YAxis domain={[16, 24]} tick={{ fontSize: 9, fill: "#9CA3AF" }} />
                <ReferenceLine y={20.5} stroke="#10B981" strokeDasharray="4 2" strokeWidth={1.5}
                  label={{ value: "目标", position: "right", fontSize: 8, fill: "#10B981" }} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E2E8F0" }}
                  formatter={(v: number) => [`${v}°C`, "室温"]}
                />
                <Bar dataKey="temp" radius={[4, 4, 0, 0]} name="实际室温">
                  {balanceData.map((d, i) => (
                    <Cell key={i} fill={
                      d.temp >= 22 ? "#EF4444" :
                      d.temp >= 20 ? "#10B981" :
                      d.temp >= 18 ? "#3B82F6" : "#DC2626"
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[9px] text-center mt-1" style={{ color: "#9CA3AF" }}>
            红=偏热 · 绿=正常 · 蓝=偏冷 · 深红=低温预警
          </div>
        </div>

        {/* ── AI Decision ── */}
        <div className="p-3 rounded-xl mb-3"
          style={{
            background: needsMore
              ? "linear-gradient(135deg, #FEF3C7, #FDE68A)"
              : "linear-gradient(135deg, #D1FAE5, #A7F3D0)",
            border: `1px solid ${needsMore ? "#F59E0B" : "#10B981"}40`,
          }}>
          <div className="text-sm font-bold mb-1.5" style={{ color: needsMore ? "#92400E" : "#065F46" }}>
            {needsMore ? "⚡ AI决策：申请增加热源" : "✅ AI决策：维持当前供热"}
          </div>
          <div className="text-xs" style={{ color: needsMore ? "#B45309" : "#047857", lineHeight: 1.7 }}>
            {needsMore ? (
              <>
                均温 {avgTemp}°C 低于目标，{riskBuildings.length > 0 ? `${riskBuildings.length}栋低温预警，` : ""}
                建议向热源申请增加 {Math.round((20.5 - avgTemp) * 12)} kW 热量供给。<br />
                同时优化二网阀门分配，优先保障偏冷楼栋。
              </>
            ) : (
              <>
                各楼栋室温均在目标范围内，供热充足。
                当前{weatherLabel}条件下，维持供水温度 {station.supplyTemp}°C，
                流量 {station.flow} t/h，无需调整。
              </>
            )}
          </div>
        </div>

        {/* ── CSV Export ── */}
        <div className="mb-3">
          <button
            onClick={() => exportCSV(station, trendData)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
              border: "1px solid #BFDBFE",
              color: "#1A56DB",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 13 }}>↓</span>
            导出24h供回水温度报表 (CSV)
          </button>
        </div>

        {/* ── Building Details ── */}
        <div>
          <div className="text-xs font-bold mb-2" style={{ color: "#374151" }}>各楼栋详情</div>
          {buildings.map(b => {
            const tc = b.temp >= 22 ? "#EF4444" : b.temp >= 20 ? "#10B981" : b.temp >= 18 ? "#3B82F6" : "#DC2626";
            const tb = b.temp >= 22 ? "#FEE2E2" : b.temp >= 20 ? "#D1FAE5" : b.temp >= 18 ? "#DBEAFE" : "#FEE2E2";
            const valvePos = b.position === "近端" ? 45 : b.position === "中端" ? 62 : 82;
            return (
              <div key={b.id} className="flex items-center gap-2 p-2 rounded-lg mb-1.5"
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
                  style={{ background: tb }}>
                  <span className="text-xs font-black" style={{ color: tc }}>{b.temp}°</span>
                  <span className="text-[8px]" style={{ color: tc }}>C</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold" style={{ color: "#374151" }}>{b.name}</span>
                    <span className="text-[10px]" style={{ color: "#9CA3AF" }}>阀门 {valvePos}%</span>
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>
                    {b.floors}层 · {b.heatingType} · {b.position}
                  </div>
                  <div className="h-1 rounded-full mt-1 overflow-hidden" style={{ background: "#E2E8F0" }}>
                    <div className="h-full rounded-full"
                      style={{ width: `${valvePos}%`, background: tc }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
