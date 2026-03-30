/**
 * LegendBar - 室温颜色图例说明
 */
export default function LegendBar() {
  const items = [
    { color: "#ef4444", fill: "#fecaca", label: "> 23°C", desc: "偏热" },
    { color: "#f97316", fill: "#fed7aa", label: "22~23°C", desc: "略热" },
    { color: "#22c55e", fill: "#bbf7d0", label: "20.5~22°C", desc: "舒适" },
    { color: "#3b82f6", fill: "#bfdbfe", label: "19~20.5°C", desc: "略冷" },
    { color: "#6366f1", fill: "#c7d2fe", label: "< 19°C", desc: "偏冷" },
  ];

  return (
    <div
      className="absolute bottom-4 left-4 flex items-center gap-1 px-4 py-2.5 rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.92)",
        border: "1px solid oklch(0.91 0.012 300)",
        boxShadow: "0 2px 12px oklch(0.58 0.12 295 / 10%)",
        backdropFilter: "blur(8px)",
      }}
    >
      <span className="text-xs font-semibold mr-2" style={{ color: "#374151" }}>室温图例：</span>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5 mr-3">
          <div
            className="w-4 h-4 rounded"
            style={{ background: item.fill, border: `1.5px solid ${item.color}` }}
          />
          <div>
            <span className="text-xs font-semibold" style={{ color: item.color }}>{item.desc}</span>
            <span className="text-xs ml-1" style={{ color: "#9ca3af" }}>{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
