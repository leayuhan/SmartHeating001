/**
 * LiveMonitor Page - 实时监控大屏
 * Design: 能源科技暗黑大屏风
 * - 全屏数据大屏布局
 * - 实时滚动数据
 * - 多维度监控指标
 * - 告警信息
 */
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Activity, Thermometer, Droplets, Gauge, Bell, TrendingUp, TrendingDown, Minus } from "lucide-react";

// Generate rolling time series
function generateRollingData(points = 30) {
  const data = [];
  const now = new Date();
  for (let i = points - 1; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 60000);
    data.push({
      time: `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`,
      supplyTemp: +(55 + Math.sin((i / 30) * Math.PI) * 5 + (Math.random() - 0.5) * 1).toFixed(1),
      returnTemp: +(42 + Math.sin((i / 30) * Math.PI) * 3 + (Math.random() - 0.5) * 0.8).toFixed(1),
      flowRate: +(120 + Math.sin((i / 30) * Math.PI * 2) * 15 + (Math.random() - 0.5) * 5).toFixed(1),
      pressure: +(0.45 + Math.sin((i / 30) * Math.PI) * 0.05 + (Math.random() - 0.5) * 0.02).toFixed(3),
    });
  }
  return data;
}

// Building room temperature table data
const buildingMonitorData = [
  { id: "A1", name: "A1栋", floors: 18, avgTemp: 21.2, minTemp: 20.1, maxTemp: 22.8, valve: 45, status: "normal" },
  { id: "A2", name: "A2栋", floors: 15, avgTemp: 21.0, minTemp: 19.8, maxTemp: 22.5, valve: 48, status: "normal" },
  { id: "B1", name: "B1栋", floors: 20, avgTemp: 21.1, minTemp: 20.3, maxTemp: 22.1, valve: 62, status: "normal" },
  { id: "B2", name: "B2栋", floors: 22, avgTemp: 21.0, minTemp: 20.0, maxTemp: 22.3, valve: 65, status: "normal" },
  { id: "B3", name: "B3栋", floors: 18, avgTemp: 20.8, minTemp: 19.5, maxTemp: 21.9, valve: 70, status: "warning" },
  { id: "C1", name: "C1栋", floors: 16, avgTemp: 20.9, minTemp: 19.8, maxTemp: 22.0, valve: 88, status: "normal" },
  { id: "C2", name: "C2栋", floors: 14, avgTemp: 20.7, minTemp: 19.2, maxTemp: 21.8, valve: 92, status: "warning" },
  { id: "C3", name: "C3栋", floors: 12, avgTemp: 21.1, minTemp: 20.2, maxTemp: 22.2, valve: 85, status: "normal" },
];

// Alert messages
const initialAlerts = [
  { id: 1, level: "warning", msg: "B3栋 3楼 预测室温 19.5°C，低于舒适下限", time: "02:34" },
  { id: 2, level: "warning", msg: "C2栋 远端压力偏低，流量不足", time: "02:28" },
  { id: 3, level: "info", msg: "系统已完成第 1247 次水力平衡优化", time: "02:20" },
  { id: 4, level: "success", msg: "今日节能量达标：2,847 kWh", time: "02:00" },
  { id: 5, level: "info", msg: "气象预报接入：明日最低气温 -6°C", time: "01:45" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="p-2 rounded-lg text-xs"
        style={{
          background: "oklch(0.16 0.025 235)",
          border: "1px solid oklch(1 0 0 / 15%)",
        }}
      >
        <p className="font-semibold mb-1" style={{ color: "oklch(0.85 0.008 220)" }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.stroke || p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function TrendIcon({ value }: { value: number }) {
  if (value > 0.1) return <TrendingUp size={12} style={{ color: "oklch(0.65 0.22 25)" }} />;
  if (value < -0.1) return <TrendingDown size={12} style={{ color: "oklch(0.65 0.20 220)" }} />;
  return <Minus size={12} style={{ color: "oklch(0.55 0.012 220)" }} />;
}

export default function LiveMonitor() {
  const [chartData, setChartData] = useState(generateRollingData);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [liveMetrics, setLiveMetrics] = useState({
    supplyTemp: 55.2,
    returnTemp: 42.1,
    flowRate: 124.5,
    pressure: 0.452,
    heatLoad: 87.4,
    avgIndoor: 21.1,
  });
  const [prevMetrics, setPrevMetrics] = useState(liveMetrics);

  useEffect(() => {
    const timer = setInterval(() => {
      setPrevMetrics(liveMetrics);
      setLiveMetrics((prev) => ({
        supplyTemp: +(prev.supplyTemp + (Math.random() - 0.5) * 0.3).toFixed(1),
        returnTemp: +(prev.returnTemp + (Math.random() - 0.5) * 0.2).toFixed(1),
        flowRate: +(prev.flowRate + (Math.random() - 0.5) * 2).toFixed(1),
        pressure: +(prev.pressure + (Math.random() - 0.5) * 0.005).toFixed(3),
        heatLoad: +(prev.heatLoad + (Math.random() - 0.5) * 0.5).toFixed(1),
        avgIndoor: +(prev.avgIndoor + (Math.random() - 0.5) * 0.05).toFixed(2),
      }));

      // Rolling chart update
      setChartData((prev) => {
        const now = new Date();
        const newPoint = {
          time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
          supplyTemp: +(55 + (Math.random() - 0.5) * 3).toFixed(1),
          returnTemp: +(42 + (Math.random() - 0.5) * 2).toFixed(1),
          flowRate: +(124 + (Math.random() - 0.5) * 10).toFixed(1),
          pressure: +(0.452 + (Math.random() - 0.5) * 0.02).toFixed(3),
        };
        return [...prev.slice(1), newPoint];
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [liveMetrics]);

  // Add new alerts periodically
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const newAlerts = [
        { level: "info", msg: `系统巡检完成，所有传感器正常` },
        { level: "success", msg: `水力平衡优化完成，节能率 ${(18 + Math.random() * 2).toFixed(1)}%` },
        { level: "info", msg: `AI模型推理：下一轮预测已就绪` },
      ];
      const randomAlert = newAlerts[Math.floor(Math.random() * newAlerts.length)];
      setAlerts((prev) => [
        {
          id: Date.now(),
          ...randomAlert,
          time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
        },
        ...prev.slice(0, 7),
      ]);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const metrics = [
    { label: "供水温度", value: liveMetrics.supplyTemp, unit: "°C", prev: prevMetrics.supplyTemp, icon: Thermometer, color: "oklch(0.72 0.18 55)" },
    { label: "回水温度", value: liveMetrics.returnTemp, unit: "°C", prev: prevMetrics.returnTemp, icon: Thermometer, color: "oklch(0.65 0.20 220)" },
    { label: "供热流量", value: liveMetrics.flowRate, unit: "m³/h", prev: prevMetrics.flowRate, icon: Droplets, color: "oklch(0.65 0.18 150)" },
    { label: "系统压力", value: liveMetrics.pressure, unit: "MPa", prev: prevMetrics.pressure, icon: Gauge, color: "oklch(0.70 0.20 290)" },
    { label: "当前热负荷", value: liveMetrics.heatLoad, unit: "MW", prev: prevMetrics.heatLoad, icon: Activity, color: "oklch(0.72 0.18 55)" },
    { label: "平均室温", value: liveMetrics.avgIndoor, unit: "°C", prev: prevMetrics.avgIndoor, icon: Thermometer, color: "oklch(0.65 0.18 150)" },
  ];

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center rounded-xl"
          style={{ width: 44, height: 44, background: "oklch(0.65 0.18 150 / 15%)" }}
        >
          <Activity size={22} style={{ color: "oklch(0.75 0.18 150)" }} />
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: "oklch(0.92 0.008 220)" }}>
            实时监控大屏
          </h2>
          <p className="text-xs" style={{ color: "oklch(0.50 0.012 220)" }}>
            供热系统全局实时数据监控 · 每2秒自动刷新
          </p>
        </div>
      </div>

      {/* Live Metrics Row */}
      <div className="grid grid-cols-6 gap-3">
        {metrics.map((m) => {
          const Icon = m.icon;
          const diff = m.value - m.prev;
          return (
            <div
              key={m.label}
              className="p-3 rounded-xl"
              style={{
                background: "oklch(0.14 0.025 235)",
                border: `1px solid ${m.color}25`,
                borderTop: `2px solid ${m.color}`,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: "oklch(0.50 0.012 220)" }}>{m.label}</span>
                <Icon size={13} style={{ color: m.color }} />
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className="font-mono-data font-bold text-xl"
                  style={{ color: m.color }}
                >
                  {m.value}
                </span>
                <span className="text-xs" style={{ color: "oklch(0.50 0.012 220)" }}>{m.unit}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <TrendIcon value={diff} />
                <span className="text-xs font-mono-data" style={{ color: "oklch(0.45 0.010 220)" }}>
                  {diff > 0 ? "+" : ""}{diff.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Supply/Return Temp Chart */}
        <div
          className="p-4 rounded-xl"
          style={{
            background: "oklch(0.14 0.025 235)",
            border: "1px solid oklch(1 0 0 / 8%)",
          }}
        >
          <h3 className="font-semibold text-sm mb-3" style={{ color: "oklch(0.92 0.008 220)" }}>
            供回水温度（实时）
          </h3>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" />
              <XAxis dataKey="time" tick={{ fill: "oklch(0.50 0.012 220)", fontSize: 9 }} tickLine={false} axisLine={false} interval={5} />
              <YAxis domain={[35, 65]} tick={{ fill: "oklch(0.50 0.012 220)", fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="supplyTemp" name="供水温度" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="returnTemp" name="回水温度" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Flow Rate Chart */}
        <div
          className="p-4 rounded-xl"
          style={{
            background: "oklch(0.14 0.025 235)",
            border: "1px solid oklch(1 0 0 / 8%)",
          }}
        >
          <h3 className="font-semibold text-sm mb-3" style={{ color: "oklch(0.92 0.008 220)" }}>
            供热流量（实时）
          </h3>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="gradFlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" />
              <XAxis dataKey="time" tick={{ fill: "oklch(0.50 0.012 220)", fontSize: 9 }} tickLine={false} axisLine={false} interval={5} />
              <YAxis domain={[90, 160]} tick={{ fill: "oklch(0.50 0.012 220)", fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="flowRate" name="流量(m³/h)" stroke="#10b981" fill="url(#gradFlow)" strokeWidth={2} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Building Table + Alerts */}
      <div className="grid grid-cols-3 gap-4">
        {/* Building Monitor Table */}
        <div
          className="col-span-2 p-4 rounded-xl"
          style={{
            background: "oklch(0.14 0.025 235)",
            border: "1px solid oklch(1 0 0 / 8%)",
          }}
        >
          <h3 className="font-semibold text-sm mb-3" style={{ color: "oklch(0.92 0.008 220)" }}>
            楼栋室温监控
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid oklch(1 0 0 / 8%)" }}>
                  {["楼栋", "楼层", "平均室温", "最低", "最高", "阀门开度", "状态"].map((h) => (
                    <th
                      key={h}
                      className="pb-2 text-left font-medium"
                      style={{ color: "oklch(0.50 0.012 220)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {buildingMonitorData.map((b, i) => {
                  const isWarning = b.status === "warning";
                  const tempColor = b.avgTemp >= 20 && b.avgTemp <= 22
                    ? "oklch(0.65 0.18 150)"
                    : b.avgTemp < 20
                    ? "oklch(0.65 0.20 220)"
                    : "oklch(0.65 0.22 25)";
                  return (
                    <tr
                      key={b.id}
                      style={{
                        borderBottom: "1px solid oklch(1 0 0 / 5%)",
                        background: isWarning ? "oklch(0.65 0.22 25 / 5%)" : "transparent",
                      }}
                    >
                      <td className="py-2 font-semibold" style={{ color: "oklch(0.85 0.008 220)" }}>
                        {b.name}
                      </td>
                      <td style={{ color: "oklch(0.60 0.010 220)" }}>{b.floors}层</td>
                      <td>
                        <span className="font-mono-data font-bold" style={{ color: tempColor }}>
                          {b.avgTemp}°C
                        </span>
                      </td>
                      <td className="font-mono-data" style={{ color: "oklch(0.65 0.20 220)" }}>
                        {b.minTemp}°C
                      </td>
                      <td className="font-mono-data" style={{ color: "oklch(0.72 0.18 55)" }}>
                        {b.maxTemp}°C
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-1.5 rounded-full overflow-hidden"
                            style={{ width: 50, background: "oklch(1 0 0 / 8%)" }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${b.valve}%`,
                                background: "oklch(0.65 0.20 220)",
                              }}
                            />
                          </div>
                          <span className="font-mono-data" style={{ color: "oklch(0.65 0.010 220)" }}>
                            {b.valve}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs"
                          style={{
                            background: isWarning ? "oklch(0.65 0.22 25 / 15%)" : "oklch(0.65 0.18 150 / 15%)",
                            color: isWarning ? "oklch(0.75 0.22 25)" : "oklch(0.75 0.18 150)",
                          }}
                        >
                          {isWarning ? "⚠ 偏低" : "✓ 正常"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alert Panel */}
        <div
          className="p-4 rounded-xl flex flex-col"
          style={{
            background: "oklch(0.14 0.025 235)",
            border: "1px solid oklch(1 0 0 / 8%)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm" style={{ color: "oklch(0.92 0.008 220)" }}>
              系统告警
            </h3>
            <Bell size={14} style={{ color: "oklch(0.72 0.18 55)" }} />
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto flex-1">
            {alerts.map((alert) => {
              const colors = {
                info: "oklch(0.65 0.20 220)",
                success: "oklch(0.65 0.18 150)",
                warning: "oklch(0.72 0.18 55)",
                error: "oklch(0.65 0.22 25)",
              };
              const icons = { info: "ℹ", success: "✓", warning: "⚠", error: "✗" };
              const color = colors[alert.level as keyof typeof colors];
              return (
                <div
                  key={alert.id}
                  className="p-2.5 rounded-lg"
                  style={{
                    background: `${color}08`,
                    border: `1px solid ${color}20`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold" style={{ color }}>
                      {icons[alert.level as keyof typeof icons]}{" "}
                      {alert.level === "warning" ? "警告" : alert.level === "error" ? "错误" : alert.level === "success" ? "成功" : "信息"}
                    </span>
                    <span className="text-xs font-mono-data" style={{ color: "oklch(0.45 0.010 220)" }}>
                      {alert.time}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "oklch(0.65 0.010 220)" }}>
                    {alert.msg}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
