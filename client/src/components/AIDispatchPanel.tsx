/**
 * AIDispatchPanel.tsx — AI全局调度中心
 * Design: Light tech — white background, blue/indigo accents, clean data layout
 *
 * 核心逻辑：
 * 1. 当前低温预警：哪些楼栋/楼层/用户 NOW < 18°C
 * 2. 未来12小时预判：基于当前室温趋势 + 天气预报 + 热惰性，预测哪些用户会跌破18°C
 * 3. AI具体操作建议：需要提前多久下指令、阀门调到多少、供水温度调整多少
 *
 * 热惰性参考：
 *   散热器：调节后约 2~4h 室温开始明显响应，6~8h 达到新平衡
 *   地暖：调节后约 4~8h 室温开始响应，12~24h 达到新平衡
 */
import { useMemo, useState } from "react";
import type { Building, WeatherType } from "../pages/Home";

interface Props {
  buildings: Building[];
  weather: WeatherType;
  outdoorTemp: number;
  transitionFactor: number;
  onSelectBuilding: (b: Building) => void;
  onShowTechModal: () => void;
  isAutoDemo: boolean;
  onToggleAutoDemo: () => void;
}

// 入户室温计安装用户（全小区只有少数几户）
export const METER_USERS: Record<string, { floor: number; unit: string; realTemp: number }[]> = {
  A2: [
    { floor: 3,  unit: "2单元301", realTemp: 21.5 },
    { floor: 11, unit: "1单元1102", realTemp: 20.3 },
  ],
  B2: [
    { floor: 7,  unit: "3单元702", realTemp: 19.6 },
  ],
  C2: [
    { floor: 5,  unit: "2单元501", realTemp: 17.4 },
    { floor: 15, unit: "1单元1503", realTemp: 16.9 },
  ],
  C6: [
    { floor: 2,  unit: "1单元201", realTemp: 17.8 },
  ],
};

// 热惰性参数
const THERMAL_INERTIA: Record<string, { responseHours: number; balanceHours: number }> = {
  "散热器": { responseHours: 3,  balanceHours: 7  },
  "地暖":   { responseHours: 6,  balanceHours: 18 },
};

// 天气趋势：未来12小时室温变化速率（°C/h，负=降温）
const WEATHER_TREND: Record<WeatherType, number> = {
  sunny:  +0.08,
  cloudy: -0.05,
  rainy:  -0.14,
  snowy:  -0.22,
};

function predict12hTemp(building: Building, weather: WeatherType, transitionFactor: number): number {
  const trend = WEATHER_TREND[weather];
  const inertia = THERMAL_INERTIA[building.heatingType];
  const slowPhaseHours = inertia.responseHours;
  const slowChange = trend * slowPhaseHours * 0.2;
  const fastChange = trend * (12 - slowPhaseHours);
  const totalChange = slowChange + fastChange;
  return +(building.temp + totalChange * (1 - transitionFactor * 0.3)).toFixed(1);
}

function genAIAction(building: Building, predicted12h: number, weather: WeatherType): {
  urgency: "immediate" | "soon" | "monitor";
  action: string;
  detail: string;
  leadTime: string;
} {
  const inertia = THERMAL_INERTIA[building.heatingType];
  const gap = 18 - predicted12h;

  if (building.temp < 18) {
    const valveIncrease = Math.round(gap * 8 + 15);
    const supplyTempIncrease = Math.round(gap * 2.5 + 3);
    return {
      urgency: "immediate",
      action: `立即调节换热站${building.stationId.replace("S", "")}`,
      detail: `阀门开度 +${valveIncrease}%（目标室温18°C），供水温度升高 ${supplyTempIncrease}°C。${building.heatingType === "地暖" ? "地暖热惰性大，需持续供热6~8h才能见效。" : "散热器响应较快，约3~4h室温开始回升。"}`,
      leadTime: `立即执行，${inertia.responseHours}h后见效`,
    };
  } else if (predicted12h < 18) {
    const hoursUntilRisk = Math.round((building.temp - 18) / Math.abs(WEATHER_TREND[weather]) / 0.8);
    const mustActIn = Math.max(1, hoursUntilRisk - inertia.responseHours);
    const valveIncrease = Math.round(gap * 6 + 10);
    return {
      urgency: "soon",
      action: `${mustActIn}h内预调换热站${building.stationId.replace("S", "")}`,
      detail: `预计${hoursUntilRisk}h后室温跌破18°C，${building.heatingType}需提前${inertia.responseHours}h响应。建议阀门开度 +${valveIncrease}%，提前锁定热量储备。`,
      leadTime: `最迟 ${mustActIn}h 内下发`,
    };
  } else if (predicted12h < 19.5) {
    return {
      urgency: "monitor",
      action: `持续监测 ${building.name}`,
      detail: `12h后室温预计 ${predicted12h}°C，处于临界区间。若天气进一步恶化，需及时介入。`,
      leadTime: "持续观察",
    };
  }
  return {
    urgency: "monitor",
    action: `${building.name} 运行正常`,
    detail: `12h后室温预计 ${predicted12h}°C，无需干预。`,
    leadTime: "无需操作",
  };
}

const URGENCY_CONFIG = {
  immediate: {
    bg: "#FEF2F2",
    border: "#FECACA",
    accent: "#DC2626",
    badge: "#DC2626",
    badgeBg: "#FEE2E2",
    label: "立即处理",
    icon: "🚨",
  },
  soon: {
    bg: "#FFFBEB",
    border: "#FDE68A",
    accent: "#D97706",
    badge: "#D97706",
    badgeBg: "#FEF3C7",
    label: "12h内处理",
    icon: "⚠️",
  },
  monitor: {
    bg: "#EFF6FF",
    border: "#BFDBFE",
    accent: "#1A56DB",
    badge: "#1A56DB",
    badgeBg: "#DBEAFE",
    label: "持续监测",
    icon: "👁",
  },
};

export default function AIDispatchPanel({
  buildings, weather, outdoorTemp, transitionFactor,
  onSelectBuilding, onShowTechModal, isAutoDemo, onToggleAutoDemo,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const weatherLabel = { sunny: "晴天", cloudy: "多云", rainy: "雨天", snowy: "雪天" }[weather] ?? "多云";
  const weatherIcon = { sunny: "☀️", cloudy: "⛅", rainy: "🌧️", snowy: "❄️" }[weather];

  const buildingAnalysis = useMemo(() => {
    return buildings.map(b => {
      const predicted = predict12hTemp(b, weather, transitionFactor);
      const action = genAIAction(b, predicted, weather);
      return { building: b, predicted12h: predicted, action };
    });
  }, [buildings, weather, transitionFactor]);

  const sortedAnalysis = useMemo(() => {
    const order = { immediate: 0, soon: 1, monitor: 2 };
    return [...buildingAnalysis].sort((a, b) => order[a.action.urgency] - order[b.action.urgency]);
  }, [buildingAnalysis]);

  const immediateCount = buildingAnalysis.filter(a => a.action.urgency === "immediate").length;
  const soonCount = buildingAnalysis.filter(a => a.action.urgency === "soon").length;
  const monitorCount = buildingAnalysis.filter(a => a.action.urgency === "monitor").length;

  const allMeterUsers = Object.entries(METER_USERS).flatMap(([bid, users]) =>
    users.map(u => ({ ...u, buildingId: bid, building: buildings.find(b => b.id === bid) }))
  );
  const riskMeterUsers = allMeterUsers.filter(u => u.realTemp < 18);

  const trendSign = WEATHER_TREND[weather] > 0 ? "↑" : "↓";
  const trendAbs = Math.abs(WEATHER_TREND[weather]);
  const trendColor = WEATHER_TREND[weather] > 0 ? "#059669" : "#DC2626";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#FFFFFF" }}>

      {/* ── Panel Header ── */}
      <div style={{
        padding: "12px 14px 10px",
        borderBottom: "1px solid #E2E8F0",
        background: "#FFFFFF",
        flexShrink: 0,
      }}>
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: "linear-gradient(135deg, #1A56DB, #0891B2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, color: "#FFFFFF", fontWeight: 900,
            boxShadow: "0 2px 6px rgba(26,86,219,0.3)",
            flexShrink: 0,
          }}>AI</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", lineHeight: 1.2 }}>AI 调度中心</div>
            <div style={{ fontSize: 8, color: "#9CA3AF", letterSpacing: "0.08em", fontFamily: "'Share Tech Mono', monospace" }}>
              SENSE · PREDICT · DECIDE · ACT
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "2px 7px", borderRadius: 4,
            background: "#ECFDF5", border: "1px solid #A7F3D0",
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#059669", animation: "pulse-dot 2s infinite" }} />
            <span style={{ fontSize: 8, color: "#059669", fontFamily: "'Share Tech Mono', monospace", fontWeight: 700 }}>ONLINE</span>
          </div>
        </div>

        {/* Weather context */}
        <div style={{
          padding: "6px 10px", borderRadius: 6,
          background: "#F8FAFC", border: "1px solid #E2E8F0",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>{weatherIcon}</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>{weatherLabel}</span>
            <span style={{ fontSize: 10, color: "#9CA3AF", marginLeft: 6 }}>室外 {outdoorTemp}°C</span>
          </div>
          <div style={{
            fontSize: 11, fontWeight: 800, color: trendColor,
            fontFamily: "'Share Tech Mono', monospace",
          }}>
            {trendSign}{trendAbs}°/h
          </div>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div style={{
        display: "flex", gap: 6, padding: "8px 12px",
        borderBottom: "1px solid #E2E8F0",
        flexShrink: 0,
      }}>
        {[
          { count: immediateCount, label: "立即处理", bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
          { count: soonCount, label: "12h内", bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
          { count: monitorCount, label: "监测中", bg: "#EFF6FF", color: "#1A56DB", border: "#BFDBFE" },
        ].map(item => (
          <div key={item.label} style={{
            flex: 1, textAlign: "center", padding: "6px 4px", borderRadius: 6,
            background: item.bg, border: `1px solid ${item.border}`,
          }}>
            <div style={{
              fontSize: 20, fontWeight: 900, color: item.color, lineHeight: 1,
              fontFamily: "'Share Tech Mono', monospace",
            }}>{item.count}</div>
            <div style={{ fontSize: 8, color: item.color, marginTop: 2, fontWeight: 600 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px", scrollbarWidth: "thin", scrollbarColor: "#E2E8F0 transparent" }}>

        {/* Real meter users warning */}
        {riskMeterUsers.length > 0 && (
          <div style={{
            marginBottom: 8, padding: "10px 12px", borderRadius: 8,
            background: "#FEF2F2", border: "1.5px solid #FECACA",
          }}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: "#DC2626",
              display: "flex", alignItems: "center", gap: 4, marginBottom: 6,
            }}>
              <span>📡</span> 入户实测低温用户
              <span style={{
                fontSize: 8, padding: "1px 5px", borderRadius: 10,
                background: "#FEE2E2", color: "#DC2626", fontWeight: 700, border: "1px solid #FECACA",
              }}>真实数据</span>
            </div>
            {riskMeterUsers.map((u, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "3px 0",
                borderBottom: i < riskMeterUsers.length - 1 ? "1px solid #FECACA" : "none",
              }}>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#7F1D1D" }}>
                    {u.buildingId}栋
                  </span>
                  <span style={{ fontSize: 9, color: "#9CA3AF", marginLeft: 4 }}>{u.unit}</span>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 900, color: "#DC2626",
                  fontFamily: "'Share Tech Mono', monospace",
                }}>
                  {u.realTemp}°C
                </span>
              </div>
            ))}
            <div style={{ fontSize: 8.5, color: "#9CA3AF", marginTop: 4 }}>
              ⚡ 入户室温计实测数据，优先级最高
            </div>
          </div>
        )}

        {/* Section label */}
        <div style={{
          fontSize: 9, fontWeight: 700, color: "#9CA3AF",
          display: "flex", alignItems: "center", gap: 4,
          marginBottom: 6, letterSpacing: "0.08em",
          fontFamily: "'Share Tech Mono', monospace",
          textTransform: "uppercase",
        }}>
          🤖 AI预判与调度建议
          <div style={{ flex: 1, height: 1, background: "#F1F5F9" }} />
        </div>

        {/* Dispatch cards */}
        {sortedAnalysis.map(({ building, predicted12h, action }) => {
          const cfg = URGENCY_CONFIG[action.urgency];
          const isNormal = action.urgency === "monitor" && building.temp >= 19 && predicted12h >= 19;
          if (isNormal) return null;

          const isExpanded = expandedId === building.id;

          return (
            <button
              key={building.id}
              onClick={() => {
                setExpandedId(isExpanded ? null : building.id);
                onSelectBuilding(building);
              }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                marginBottom: 6, padding: "10px 11px", borderRadius: 8,
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {/* Card header row */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 11 }}>{cfg.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#111827" }}>
                    {building.name}
                  </span>
                  <span style={{
                    fontSize: 8, padding: "1px 5px", borderRadius: 10,
                    background: cfg.badgeBg, color: cfg.badge,
                    fontWeight: 700, border: `1px solid ${cfg.border}`,
                  }}>
                    {cfg.label}
                  </span>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 900, lineHeight: 1,
                    color: building.temp < 18 ? "#DC2626" : "#111827",
                    fontFamily: "'Share Tech Mono', monospace",
                  }}>
                    {building.temp.toFixed(1)}°C
                  </div>
                  <div style={{
                    fontSize: 9, color: predicted12h < 18 ? "#D97706" : "#9CA3AF",
                    fontFamily: "'Share Tech Mono', monospace",
                  }}>
                    12h→{predicted12h}°C
                  </div>
                </div>
              </div>

              {/* Action title */}
              <div style={{ fontSize: 10, fontWeight: 700, color: cfg.accent, marginBottom: 3 }}>
                {action.action}
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{
                  fontSize: 9.5, color: "#374151", lineHeight: 1.6,
                  padding: "6px 8px", borderRadius: 6,
                  background: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  marginBottom: 4,
                }}>
                  {action.detail}
                </div>
              )}

              {/* Tags row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 4 }}>
                {[
                  `⏱ ${action.leadTime}`,
                  building.heatingType,
                  building.position,
                  `${building.floors}层`,
                ].map(tag => (
                  <span key={tag} style={{
                    fontSize: 8, padding: "1px 6px", borderRadius: 10,
                    background: "rgba(0,0,0,0.05)", color: "#6B7280", fontWeight: 600,
                  }}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Expand hint */}
              <div style={{ fontSize: 8, color: "#9CA3AF", marginTop: 3, textAlign: "right" }}>
                {isExpanded ? "▲ 收起" : "▼ 展开详情"}
              </div>
            </button>
          );
        })}

        {/* Normal buildings */}
        <div style={{
          padding: "8px 10px", borderRadius: 8,
          background: "#ECFDF5", border: "1px solid #A7F3D0",
          marginTop: 4,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#065F46", marginBottom: 5 }}>
            ✅ 正常运行楼栋
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {sortedAnalysis
              .filter(a => a.action.urgency === "monitor" && a.building.temp >= 19 && a.predicted12h >= 19)
              .map(a => (
                <button
                  key={a.building.id}
                  onClick={() => onSelectBuilding(a.building)}
                  style={{
                    fontSize: 9, padding: "2px 7px", borderRadius: 10,
                    background: "#D1FAE5", color: "#065F46", fontWeight: 600,
                    border: "1px solid #A7F3D0", cursor: "pointer",
                    fontFamily: "'Share Tech Mono', monospace",
                  }}
                >
                  {a.building.name} {a.building.temp.toFixed(1)}°
                </button>
              ))}
          </div>
        </div>

        {/* Thermal inertia reference */}
        <div style={{
          marginTop: 8, padding: "8px 10px", borderRadius: 8,
          background: "#EEF2FF", border: "1px solid #C7D2FE",
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#4338CA", marginBottom: 6 }}>
            🏠 建筑热惰性参考
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { type: "散热器", resp: "2~4h", bal: "6~8h", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
              { type: "地暖",   resp: "4~8h", bal: "12~24h", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
            ].map(item => (
              <div key={item.type} style={{
                flex: 1, textAlign: "center", padding: "6px 4px",
                borderRadius: 6, background: item.bg,
                border: `1px solid ${item.border}`,
              }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: item.color }}>{item.type}</div>
                <div style={{
                  fontSize: 14, fontWeight: 900, color: "#111827",
                  fontFamily: "'Share Tech Mono', monospace", lineHeight: 1.2, marginTop: 2,
                }}>{item.resp}</div>
                <div style={{ fontSize: 8, color: "#9CA3AF" }}>开始响应</div>
                <div style={{ fontSize: 8, color: "#9CA3AF", marginTop: 1 }}>
                  {item.bal} 达平衡
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 8.5, color: "#4338CA", marginTop: 5, textAlign: "center" }}>
            ⚡ AI已将热惰性纳入提前量计算
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        flexShrink: 0, padding: "10px 12px",
        borderTop: "1px solid #E2E8F0",
        display: "flex", flexDirection: "column", gap: 6,
        background: "#FFFFFF",
      }}>
        <button
          onClick={onToggleAutoDemo}
          style={{
            width: "100%", padding: "8px 0", borderRadius: 8,
            fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer",
            background: isAutoDemo
              ? "linear-gradient(135deg, #059669, #10B981)"
              : "linear-gradient(135deg, #1A56DB, #0891B2)",
            color: "white",
            boxShadow: isAutoDemo
              ? "0 2px 8px rgba(5,150,105,0.3)"
              : "0 2px 8px rgba(26,86,219,0.25)",
            transition: "all 0.2s",
          }}
        >
          {isAutoDemo ? "⏹ 停止自动演示" : "▶ 一键演示（天气自动切换）"}
        </button>
        <button
          onClick={onShowTechModal}
          style={{
            width: "100%", padding: "6px 0", borderRadius: 8,
            fontSize: 10, fontWeight: 600, cursor: "pointer",
            background: "#EFF6FF", color: "#1A56DB",
            border: "1px solid #BFDBFE",
            transition: "all 0.2s",
          }}
        >
          🧠 室温辨识技术原理
        </button>
      </div>
    </div>
  );
}
