/**
 * BuildingDetailPanel - 楼栋详情侧边面板
 * Design: Light tech — white background, blue/indigo accents
 *
 * 功能：
 * 1. 每层楼的每户估算室温（AI模型推算）
 * 2. 入户室温计用户（真实采样，标注"实测"）
 * 3. 未来12小时室温预测曲线（含热惰性滞后效果）
 * 4. 低于18°C风险用户预警
 * 5. AI决策建议（具体数值）
 */
import { useState, useEffect, useMemo } from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { Building, WeatherType } from "../pages/Home";

interface Props {
  building: Building;
  weather: WeatherType;
  outdoorTemp: number;
  onClose: () => void;
}

const METER_CONFIG: Record<string, Record<number, number>> = {
  A1: { 3: 2, 11: 1 },
  B2: { 7: 3 },
  C2: { 5: 2, 15: 1 },
  C3: { 2: 1 },
};

function calcFloorTemp(b: Building, floor: number): number {
  const base = b.temp;
  const topEffect = floor === b.floors ? -0.9 : floor === b.floors - 1 ? -0.5 : 0;
  const bottomEffect = floor === 1 ? -0.6 : floor === 2 ? -0.3 : 0;
  const midEffect = (floor > 3 && floor < b.floors - 2) ? 0.25 : 0;
  const orientEffect = b.orientation === "南北" ? 0.2 : -0.15;
  const noise = Math.sin(floor * 7.3 + b.id.charCodeAt(0)) * 0.25;
  return +(base + topEffect + bottomEffect + midEffect + orientEffect + noise).toFixed(1);
}

function genForecast(b: Building, weather: WeatherType, outdoorTemp: number) {
  const isUnderfloor = b.heatingType === "地暖";
  const responseDelay = isUnderfloor ? 5.5 : 2.5;
  const settleTime = isUnderfloor ? 18 : 7;
  const weatherEffect = { sunny: 1.4, cloudy: -0.6, rainy: -1.8, snowy: -2.6 }[weather] ?? -0.6;
  const aiTarget = Math.min(22, Math.max(18.5, b.temp + (b.temp < 20 ? 1.8 : 0)));

  return Array.from({ length: 13 }, (_, i) => {
    const progress = i <= responseDelay ? 0
      : Math.min(1, (i - responseDelay) / (settleTime - responseDelay));
    const smooth = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    const predicted = +(b.temp + weatherEffect * smooth + (aiTarget - b.temp) * smooth * 0.65).toFixed(1);
    const noAI = +(b.temp + weatherEffect * smooth).toFixed(1);
    return {
      h: i === 0 ? "现在" : `+${i}h`,
      predicted,
      noAI,
      outdoor: +(outdoorTemp + (weather === "sunny" ? 0.4 : -0.2) * smooth).toFixed(1),
    };
  });
}

function tempColor(t: number) {
  if (t >= 22) return "#EF4444";
  if (t >= 21) return "#F59E0B";
  if (t >= 20) return "#10B981";
  if (t >= 19) return "#3B82F6";
  if (t >= 18) return "#7C3AED";
  return "#DC2626";
}
function tempBg(t: number) {
  if (t >= 22) return "#FEE2E2";
  if (t >= 21) return "#FEF3C7";
  if (t >= 20) return "#D1FAE5";
  if (t >= 19) return "#DBEAFE";
  if (t >= 18) return "#EDE9FE";
  return "#FEE2E2";
}
function tempLabel(t: number) {
  if (t >= 22) return "偏热";
  if (t >= 21) return "略热";
  if (t >= 20) return "舒适";
  if (t >= 19) return "略凉";
  if (t >= 18) return "偏冷";
  return "⚠危险";
}

export default function BuildingDetailPanel({ building, weather, outdoorTemp, onClose }: Props) {
  const [tab, setTab] = useState<"floors" | "forecast" | "history" | "ai">("floors");
  const [expandedFloor, setExpandedFloor] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 30); }, []);
  useEffect(() => { setExpandedFloor(null); setTab("floors"); }, [building.id]);

  // Generate 24h historical room temperature data
  const historyData = useMemo(() => {
    const now = new Date();
    const weatherDrop: Record<WeatherType, number> = { sunny: 0, cloudy: -0.5, rainy: -1.2, snowy: -2.0 };
    const wd = weatherDrop[weather] ?? 0;
    return Array.from({ length: 25 }, (_, i) => {
      const hoursAgo = 24 - i;
      const t = new Date(now.getTime() - hoursAgo * 3600_000);
      const hour = t.getHours();
      // Night cool-down, morning warm-up pattern
      const nightDip = hour < 5 ? -1.2 : hour < 8 ? -0.6 : hour >= 22 ? -0.4 : 0;
      const afternoonBoost = hour >= 14 && hour <= 17 ? 0.4 : 0;
      const noise = Math.sin(i * 2.1 + building.id.charCodeAt(0) * 0.3) * 0.2;
      const temp = +(building.temp + nightDip + afternoonBoost + wd * (i / 24) + noise).toFixed(1);
      return {
        time: `${String(t.getHours()).padStart(2, "0")}:00`,
        temp,
        target: 20.5,
      };
    });
  }, [building.id, building.temp, weather]);

  const meterCfg = METER_CONFIG[building.id];
  const isUnderfloor = building.heatingType === "地暖";
  const responseDelayStr = isUnderfloor ? "4~8小时" : "2~4小时";
  const settleStr = isUnderfloor ? "12~24小时" : "6~8小时";
  const forecast = genForecast(building, weather, outdoorTemp);

  const floors = Array.from({ length: building.floors }, (_, i) => {
    const floor = building.floors - i;
    const temp = calcFloorTemp(building, floor);
    const hasMeter = meterCfg ? floor in meterCfg : false;
    return { floor, temp, hasMeter };
  });

  const avgTemp = +(floors.reduce((s, f) => s + f.temp, 0) / floors.length).toFixed(1);
  const riskFloors = floors.filter(f => f.temp < 18);
  const minTemp = Math.min(...floors.map(f => f.temp));
  const maxTemp = Math.max(...floors.map(f => f.temp));

  const needsAction = avgTemp < 20.5;
  const currentValve = building.position === "近端" ? 45 : building.position === "中端" ? 62 : 82;
  const targetValve = needsAction ? Math.min(currentValve + 18, 100) : avgTemp > 22.5 ? Math.max(currentValve - 15, 20) : currentValve;
  const targetSupplyTemp = needsAction ? Math.min(60, Math.round(52 + (20.5 - avgTemp) * 3)) : 50;

  return (
    <div
      style={{
        display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
        width: "100%",
        background: "#FFFFFF",
        transform: visible ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      {/* ===== HEADER ===== */}
      <div style={{
        flexShrink: 0, padding: "12px 14px 10px",
        borderBottom: "1px solid #E2E8F0",
        background: "#FFFFFF",
      }}>
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#111827" }}>{building.name}</span>
              <span style={{
                padding: "1px 7px", borderRadius: 10, fontSize: 10, fontWeight: 700,
                background: tempBg(avgTemp), color: tempColor(avgTemp),
              }}>
                {tempLabel(avgTemp)}
              </span>
              {meterCfg && (
                <span style={{
                  padding: "1px 7px", borderRadius: 10, fontSize: 9, fontWeight: 600,
                  background: "#EFF6FF", color: "#1A56DB", border: "1px solid #BFDBFE",
                }}>
                  📡 有入户计
                </span>
              )}
              {riskFloors.length > 0 && (
                <span style={{
                  padding: "1px 7px", borderRadius: 10, fontSize: 9, fontWeight: 700,
                  background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA",
                }}>
                  ⚠ {riskFloors.length}层低温
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#6B7280", flexWrap: "wrap" }}>
              <span>{building.floors}层</span>
              <span>·</span>
              <span>{building.area.toLocaleString()} m²</span>
              <span>·</span>
              <span>{building.orientation}朝向</span>
              <span>·</span>
              <span style={{ color: "#1A56DB", fontWeight: 600 }}>{building.heatingType}</span>
              <span>·</span>
              <span>{building.position}</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 26, height: 26, borderRadius: "50%",
            border: "1px solid #E2E8F0", background: "#F8FAFC",
            color: "#6B7280", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, cursor: "pointer", flexShrink: 0,
            transition: "all 0.15s",
          }}>✕</button>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5, marginBottom: 8 }}>
          {[
            { label: "均温", value: `${avgTemp}°C`, color: tempColor(avgTemp), bg: tempBg(avgTemp) },
            { label: "最低层", value: `${minTemp}°C`, color: "#1D4ED8", bg: "#DBEAFE" },
            { label: "最高层", value: `${maxTemp}°C`, color: "#DC2626", bg: "#FEE2E2" },
            { label: "风险层", value: `${riskFloors.length}层`, color: riskFloors.length > 0 ? "#DC2626" : "#059669", bg: riskFloors.length > 0 ? "#FEE2E2" : "#D1FAE5" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ borderRadius: 6, padding: "5px 4px", textAlign: "center", background: bg }}>
              <div style={{ fontSize: 8, color: "#9CA3AF" }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 900, color, fontFamily: "'Share Tech Mono', monospace" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Thermal inertia note */}
        <div style={{
          padding: "5px 10px", borderRadius: 6, fontSize: 10,
          background: "#EFF6FF", border: "1px solid #BFDBFE",
        }}>
          <span style={{ fontWeight: 700, color: "#1A56DB" }}>🏠 热惰性：</span>
          <span style={{ color: "#374151" }}>
            {isUnderfloor ? "地暖" : "散热器"}调节后
            <strong style={{ color: "#1A56DB" }}> {responseDelayStr}</strong> 开始响应，
            <strong style={{ color: "#1A56DB" }}>{settleStr}</strong> 达稳态
          </span>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div style={{ display: "flex", flexShrink: 0, borderBottom: "1px solid #E2E8F0" }}>
        {[
          { key: "floors" as const, label: "楼层室温" },
          { key: "history" as const, label: "24h历史" },
          { key: "forecast" as const, label: "12h预测" },
          { key: "ai" as const, label: "AI建议" },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              flex: 1, padding: "8px 0", fontSize: 11, fontWeight: 600,
              color: tab === key ? "#1A56DB" : "#9CA3AF",
              borderBottom: tab === key ? "2px solid #1A56DB" : "2px solid transparent",
              background: tab === key ? "#EFF6FF" : "transparent",
              border: "none", cursor: "pointer", transition: "all 0.15s",
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* ===== CONTENT ===== */}
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "#E2E8F0 transparent" }}>

        {/* FLOORS TAB */}
        {tab === "floors" && (
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 10, color: "#6B7280", marginBottom: 8 }}>
              各楼层室温（AI模型推算）· 点击楼层查看各户详情
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {floors.map(({ floor, temp, hasMeter }, idx) => {
                const tc = tempColor(temp);
                const tb = tempBg(temp);
                const isExpanded = expandedFloor === floor;
                const isRisk = temp < 18;
                const barPct = Math.max(5, Math.min(100, (temp - 14) / (26 - 14) * 100));

                return (
                  <div key={floor}>
                    <button
                      onClick={() => setExpandedFloor(isExpanded ? null : floor)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 8,
                        padding: "6px 10px", borderRadius: 6, cursor: "pointer",
                        background: isExpanded ? tb : "#F8FAFC",
                        border: `1px solid ${isExpanded ? tc + "40" : "#E2E8F0"}`,
                        transition: "all 0.15s",
                      }}>
                      {/* Floor label */}
                      <div style={{
                        width: 30, height: 22, borderRadius: 4,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, fontSize: 9, fontWeight: 700,
                        background: tb, color: tc,
                        fontFamily: "'Share Tech Mono', monospace",
                      }}>
                        {floor}F
                      </div>
                      {/* Bar */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#374151" }}>
                            {floor}层
                            {hasMeter && (
                              <span style={{
                                marginLeft: 5, padding: "0 4px", borderRadius: 3,
                                fontSize: 8, fontWeight: 700,
                                background: "#1A56DB", color: "#FFFFFF",
                              }}>实测</span>
                            )}
                            {isRisk && <span style={{ marginLeft: 4, fontSize: 10 }}>⚠️</span>}
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: tc, fontFamily: "'Share Tech Mono', monospace" }}>
                            {temp}°C
                          </span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: "#E2E8F0", overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 2, width: `${barPct}%`, background: tc, transition: "width 0.4s ease" }} />
                        </div>
                      </div>
                      <span style={{
                        fontSize: 9, color: "#9CA3AF",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        display: "inline-block", transition: "transform 0.2s", flexShrink: 0,
                      }}>▼</span>
                    </button>

                    {/* Expanded: per-unit detail */}
                    {isExpanded && (
                      <div style={{
                        margin: "2px 6px 4px", padding: 8, borderRadius: 6,
                        background: tb, border: `1px solid ${tc}30`,
                      }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: tc, marginBottom: 6 }}>
                          {floor}层各户室温（4户）
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
                          {[1, 2, 3, 4].map((unit) => {
                            const unitTemp = +(temp + ((unit * 3 + floor) % 7 - 3) * 0.14).toFixed(1);
                            const isMeterUnit = hasMeter && unit === (METER_CONFIG[building.id]?.[floor] ?? -1);
                            return (
                              <div key={unit} style={{
                                borderRadius: 5, padding: "5px 4px", textAlign: "center",
                                background: "rgba(255,255,255,0.9)", border: `1px solid ${tc}25`,
                              }}>
                                <div style={{ fontSize: 8, color: "#9CA3AF" }}>{unit}单元</div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: tempColor(unitTemp), fontFamily: "'Share Tech Mono', monospace" }}>
                                  {unitTemp}°C
                                </div>
                                {isMeterUnit && (
                                  <div style={{ fontSize: 8, fontWeight: 700, color: "#1A56DB" }}>📡实测</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {hasMeter && (
                          <div style={{
                            marginTop: 5, fontSize: 8.5, padding: "3px 7px", borderRadius: 4,
                            background: "#EFF6FF", color: "#1A56DB", border: "1px solid #BFDBFE",
                          }}>
                            📡 本层有入户室温计实测数据，其余户由AI模型推算
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Risk summary */}
            {riskFloors.length > 0 && (
              <div style={{
                marginTop: 8, padding: "8px 10px", borderRadius: 6,
                background: "#FEF2F2", border: "1px solid #FECACA",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", marginBottom: 4 }}>
                  ⚠️ 低温风险楼层（{riskFloors.length}层低于18°C）
                </div>
                {riskFloors.map(f => (
                  <div key={f.floor} style={{ fontSize: 10, color: "#991B1B", lineHeight: 1.8 }}>
                    · {f.floor}层：{f.temp}°C，需立即调节
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB — 24h room temperature */}
        {tab === "history" && (
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 10, color: "#6B7280", marginBottom: 8 }}>
              过去24小时室温变化记录（AI模型推算）
            </div>

            {/* Min / Max / Avg summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 10 }}>
              {[
                { label: "24h最低", value: `${Math.min(...historyData.map(d => d.temp)).toFixed(1)}°C`, color: "#3B82F6", bg: "#DBEAFE" },
                { label: "24h均温", value: `${(historyData.reduce((s, d) => s + d.temp, 0) / historyData.length).toFixed(1)}°C`, color: "#10B981", bg: "#D1FAE5" },
                { label: "24h最高", value: `${Math.max(...historyData.map(d => d.temp)).toFixed(1)}°C`, color: "#EF4444", bg: "#FEE2E2" },
              ].map(({ label, value, color, bg }) => (
                <div key={label} style={{ borderRadius: 6, padding: "6px 4px", textAlign: "center", background: bg }}>
                  <div style={{ fontSize: 9, color: "#9CA3AF" }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 900, color, fontFamily: "'Share Tech Mono', monospace" }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A56DB" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#1A56DB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 8, fill: "#9CA3AF", fontFamily: "'Share Tech Mono', monospace" }}
                    tickFormatter={(v, i) => i % 4 === 0 ? v : ""}
                    interval={0}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 8, fill: "#9CA3AF", fontFamily: "'Share Tech Mono', monospace" }}
                    unit="°"
                  />
                  <ReferenceLine y={20.5} stroke="#10B981" strokeDasharray="4 2" strokeWidth={1.5}
                    label={{ value: "目标", position: "right", fontSize: 8, fill: "#10B981" }} />
                  <ReferenceLine y={18} stroke="#EF4444" strokeDasharray="4 2" strokeWidth={1}
                    label={{ value: "警戒", position: "right", fontSize: 8, fill: "#EF4444" }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 10, borderRadius: 6, border: "1px solid #E2E8F0",
                      background: "#FFFFFF", boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    formatter={(v: number) => [`${v}°C`, "室温"]}
                    labelStyle={{ color: "#374151", fontWeight: 700, fontFamily: "'Share Tech Mono', monospace" }}
                  />
                  <Line
                    type="monotone" dataKey="temp"
                    stroke="#1A56DB" strokeWidth={2} dot={false}
                    activeDot={{ r: 3, fill: "#1A56DB" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Annotation */}
            <div style={{
              marginTop: 8, padding: "6px 10px", borderRadius: 6, fontSize: 9,
              background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#6B7280",
              lineHeight: 1.7,
            }}>
              绿色虚线 = 目标室温 20.5°C · 红色虚线 = 低温警戒线 18°C<br />
              夜间（0-5时）室温自然下降，午后（14-17时）因日照略有回升
            </div>
          </div>
        )}

        {/* FORECAST TAB */}
        {tab === "forecast" && (
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 10, color: "#6B7280", marginBottom: 8 }}>
              未来12小时室温预测（含建筑热惰性滞后）
            </div>

            {/* Inertia card */}
            <div style={{
              marginBottom: 10, padding: "8px 10px", borderRadius: 6, fontSize: 10,
              background: "#EFF6FF", border: "1px solid #BFDBFE",
            }}>
              <div style={{ fontWeight: 700, color: "#1A56DB", marginBottom: 4 }}>
                📐 {isUnderfloor ? "地暖" : "散热器"}系统热惰性
              </div>
              <div style={{ color: "#374151", lineHeight: 1.7 }}>
                • 调节指令下发后，<strong style={{ color: "#1A56DB" }}>{responseDelayStr}</strong>内室温几乎不变<br />
                • 之后室温缓慢响应，<strong style={{ color: "#1A56DB" }}>{settleStr}</strong>后趋于新稳态<br />
                • {isUnderfloor ? "地暖蓄热量大，响应慢但保温好" : "散热器响应快，但受建筑外墙蓄热影响仍有滞后"}<br />
                • <span style={{ color: "#1A56DB" }}>蓝色</span>=AI干预预测，<span style={{ color: "#9CA3AF" }}>灰色</span>=无干预对照
              </div>
            </div>

            {/* Chart */}
            <div style={{ height: 190 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecast} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A56DB" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#1A56DB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="h" tick={{ fontSize: 9, fill: "#9CA3AF" }} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 9, fill: "#9CA3AF" }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 11, borderRadius: 6,
                      border: "1px solid #E2E8F0",
                      background: "#FFFFFF",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    formatter={(v: number, name: string) => [
                      `${v}°C`,
                      name === "predicted" ? "AI干预后" : name === "noAI" ? "无干预对照" : "室外温度",
                    ]}
                  />
                  <ReferenceLine y={18} stroke="#EF4444" strokeDasharray="4 3" strokeWidth={1.5}
                    label={{ value: "18°C安全线", position: "right", fontSize: 8, fill: "#EF4444" }} />
                  <ReferenceLine y={22} stroke="#F59E0B" strokeDasharray="4 3" strokeWidth={1}
                    label={{ value: "22°C上限", position: "right", fontSize: 8, fill: "#F59E0B" }} />
                  <Area type="monotone" dataKey="predicted" stroke="#1A56DB" strokeWidth={2.5}
                    fill="url(#fg)" dot={false} name="predicted" />
                  <Line type="monotone" dataKey="noAI" stroke="#D1D5DB" strokeWidth={1.5}
                    strokeDasharray="5 4" dot={false} name="noAI" />
                  <Line type="monotone" dataKey="outdoor" stroke="#93C5FD" strokeWidth={1}
                    strokeDasharray="3 3" dot={false} name="outdoor" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Timeline */}
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
              {[
                { time: isUnderfloor ? "0~5.5h" : "0~2.5h", label: "热惰性缓冲期", desc: "调节指令已下发，室温暂无明显变化", color: "#9CA3AF" },
                { time: isUnderfloor ? "5.5~12h" : "2.5~6h", label: "室温开始响应", desc: "热量逐渐传导，室温缓慢变化", color: "#1A56DB" },
                { time: isUnderfloor ? "12~24h" : "6~8h", label: "趋于新稳态", desc: "室温达目标值，系统稳定运行", color: "#059669" },
              ].map(({ time, label, desc, color }) => (
                <div key={time} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 10 }}>
                  <div style={{ width: 52, flexShrink: 0, fontFamily: "'Share Tech Mono', monospace", fontWeight: 700, color }}>{time}</div>
                  <div>
                    <span style={{ fontWeight: 700, color }}>{label}：</span>
                    <span style={{ color: "#6B7280" }}>{desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Risk list */}
            <div style={{
              marginTop: 10, padding: "8px 10px", borderRadius: 6,
              background: "#EFF6FF", border: "1px solid #BFDBFE",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#1A56DB", marginBottom: 5 }}>
                📋 未来12h风险预警列表
              </div>
              {forecast.filter((_, i) => i > 0 && i % 3 === 0).map(d => {
                const isRisk = d.predicted < 18;
                return (
                  <div key={d.h} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10, padding: "2px 0" }}>
                    <span style={{ color: "#6B7280", fontFamily: "'Share Tech Mono', monospace" }}>{d.h}</span>
                    <span style={{ color: isRisk ? "#DC2626" : "#059669", fontWeight: 600 }}>
                      {isRisk ? `⚠️ ${d.predicted}°C 低温风险` : `✓ ${d.predicted}°C 正常`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI TAB */}
        {tab === "ai" && (
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Status */}
            <div style={{
              padding: "10px 12px", borderRadius: 8,
              background: needsAction ? "#FFFBEB" : "#ECFDF5",
              border: `1px solid ${needsAction ? "#FDE68A" : "#A7F3D0"}`,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: needsAction ? "#92400E" : "#065F46" }}>
                {needsAction ? "⚠️ 需要调节" : "✅ 运行正常"}
              </div>
              <div style={{ fontSize: 10, marginTop: 3, color: needsAction ? "#B45309" : "#047857" }}>
                {needsAction
                  ? `均温 ${avgTemp}°C 低于舒适目标 20~22°C，建议增加供热`
                  : `均温 ${avgTemp}°C 处于舒适区间，维持当前供热策略`}
              </div>
            </div>

            {/* Actions */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#374151", marginBottom: 6 }}>AI具体调节建议</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  {
                    icon: "🔧", title: "调节阀门开度",
                    current: `当前 ${currentValve}%`,
                    target: `目标 ${targetValve}%`,
                    desc: `${needsAction ? "增大" : "维持"}阀门开度，${needsAction ? "增加" : "保持"}二次网流量`,
                    color: "#1A56DB",
                  },
                  {
                    icon: "🌡️", title: "调整供水温度",
                    current: `当前 ${targetSupplyTemp - (needsAction ? 4 : 0)}°C`,
                    target: `目标 ${targetSupplyTemp}°C`,
                    desc: `换热站供水温度${needsAction ? "上调" : "维持"}，确保末端热量充足`,
                    color: "#DC2626",
                  },
                  {
                    icon: "⏱️", title: "热惰性补偿",
                    current: "已考虑",
                    target: `提前 ${isUnderfloor ? "4~6h" : "2~3h"} 调节`,
                    desc: `${isUnderfloor ? "地暖" : "散热器"}热惰性大，AI提前预判并下发指令`,
                    color: "#059669",
                  },
                ].map(({ icon, title, current, target, color, desc }) => (
                  <div key={title} style={{
                    padding: "8px 10px", borderRadius: 6,
                    background: "#F8FAFC", border: "1px solid #E2E8F0",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>
                        {icon} {title}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10 }}>
                        <span style={{ color: "#9CA3AF" }}>{current}</span>
                        <span style={{ color: "#D1D5DB" }}>→</span>
                        <span style={{ fontWeight: 700, color }}>{target}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 9, color: "#9CA3AF" }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Energy */}
            <div style={{
              padding: "8px 10px", borderRadius: 8,
              background: "#EFF6FF", border: "1px solid #BFDBFE",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#1A56DB", marginBottom: 5 }}>📊 能耗管理</div>
              {[
                { label: "单位面积能耗", value: `${(building.area * 0.042 / 1000).toFixed(2)} GJ/m²` },
                { label: "本楼栋今日热量", value: `${(building.area * 0.042).toFixed(0)} kJ` },
                { label: "AI节能效果", value: needsAction ? "优化调节中" : "节能 12~18%" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10, padding: "2px 0" }}>
                  <span style={{ color: "#6B7280" }}>{label}</span>
                  <span style={{ fontWeight: 700, color: "#1A56DB" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
