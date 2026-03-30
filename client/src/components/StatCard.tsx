/**
 * StatCard Component
 * Design: 能源科技暗黑大屏风 - 发光数据卡片，带彩色顶部边框
 */
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: "blue" | "orange" | "green" | "purple";
  trend?: { value: number; label: string };
  animate?: boolean;
}

const variantStyles = {
  blue: {
    border: "oklch(0.65 0.20 220)",
    glow: "oklch(0.65 0.20 220 / 15%)",
    iconBg: "oklch(0.65 0.20 220 / 15%)",
    iconColor: "oklch(0.75 0.20 220)",
    valueColor: "oklch(0.85 0.15 220)",
  },
  orange: {
    border: "oklch(0.72 0.18 55)",
    glow: "oklch(0.72 0.18 55 / 15%)",
    iconBg: "oklch(0.72 0.18 55 / 15%)",
    iconColor: "oklch(0.80 0.18 55)",
    valueColor: "oklch(0.85 0.15 55)",
  },
  green: {
    border: "oklch(0.65 0.18 150)",
    glow: "oklch(0.65 0.18 150 / 15%)",
    iconBg: "oklch(0.65 0.18 150 / 15%)",
    iconColor: "oklch(0.75 0.18 150)",
    valueColor: "oklch(0.80 0.15 150)",
  },
  purple: {
    border: "oklch(0.65 0.20 290)",
    glow: "oklch(0.65 0.20 290 / 15%)",
    iconBg: "oklch(0.65 0.20 290 / 15%)",
    iconColor: "oklch(0.75 0.20 290)",
    valueColor: "oklch(0.80 0.15 290)",
  },
};

function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    const step = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return count;
}

export default function StatCard({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  variant = "blue",
  trend,
  animate = true,
}: StatCardProps) {
  const styles = variantStyles[variant];
  const numericValue = typeof value === "number" ? value : parseFloat(String(value));
  const isNumeric = !isNaN(numericValue) && animate;
  const animatedValue = useCountUp(isNumeric ? numericValue : 0);

  const displayValue = isNumeric
    ? numericValue % 1 === 0
      ? Math.round(animatedValue).toLocaleString()
      : animatedValue.toFixed(1)
    : value;

  return (
    <div
      className="p-5 rounded-xl transition-all duration-300 hover:scale-[1.02]"
      style={{
        background: "oklch(0.14 0.025 235)",
        border: `1px solid ${styles.border}40`,
        borderTop: `2px solid ${styles.border}`,
        boxShadow: `0 0 20px ${styles.glow}`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p
            className="text-xs font-medium uppercase tracking-wider mb-1"
            style={{ color: "oklch(0.55 0.015 220)" }}
          >
            {title}
          </p>
          {subtitle && (
            <p className="text-xs" style={{ color: "oklch(0.45 0.010 220)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className="flex items-center justify-center rounded-lg"
            style={{
              width: 36,
              height: 36,
              background: styles.iconBg,
            }}
          >
            <Icon size={18} style={{ color: styles.iconColor }} />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span
          className="text-3xl font-bold font-mono-data"
          style={{ color: styles.valueColor }}
        >
          {displayValue}
        </span>
        {unit && (
          <span
            className="text-sm"
            style={{ color: "oklch(0.55 0.015 220)" }}
          >
            {unit}
          </span>
        )}
      </div>

      {trend && (
        <div className="mt-2 flex items-center gap-1">
          <span
            className="text-xs font-mono-data"
            style={{
              color: trend.value >= 0 ? "oklch(0.65 0.18 150)" : "oklch(0.65 0.22 25)",
            }}
          >
            {trend.value >= 0 ? "▲" : "▼"} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs" style={{ color: "oklch(0.45 0.010 220)" }}>
            {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}
