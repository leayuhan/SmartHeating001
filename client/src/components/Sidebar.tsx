/**
 * Sidebar Navigation Component
 * Design: 能源科技暗黑大屏风 - 左侧固定导航，图标+文字，发光主色高亮
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Thermometer,
  Network,
  Zap,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Flame,
} from "lucide-react";

const navItems = [
  {
    id: "overview",
    path: "/",
    icon: LayoutDashboard,
    label: "系统总览",
    sublabel: "Overview",
  },
  {
    id: "temp-recognition",
    path: "/temp-recognition",
    icon: Thermometer,
    label: "室温辨识",
    sublabel: "AI Temperature",
  },
  {
    id: "hydraulic",
    path: "/hydraulic",
    icon: Network,
    label: "水力平衡",
    sublabel: "Hydraulic Balance",
  },
  {
    id: "decision",
    path: "/decision",
    icon: Zap,
    label: "供热决策",
    sublabel: "Heat Decision",
  },
  {
    id: "monitor",
    path: "/monitor",
    icon: BarChart3,
    label: "实时监控",
    sublabel: "Live Monitor",
  },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="flex flex-col h-screen sticky top-0 transition-all duration-300 z-50"
      style={{
        width: collapsed ? "72px" : "220px",
        background: "oklch(0.09 0.025 238)",
        borderRight: "1px solid oklch(1 0 0 / 8%)",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-5"
        style={{ borderBottom: "1px solid oklch(1 0 0 / 8%)" }}
      >
        <div
          className="flex items-center justify-center rounded-lg flex-shrink-0"
          style={{
            width: 40,
            height: 40,
            background: "linear-gradient(135deg, oklch(0.65 0.20 220), oklch(0.72 0.18 55))",
            boxShadow: "0 0 16px oklch(0.65 0.20 220 / 50%)",
          }}
        >
          <Flame size={20} color="white" />
        </div>
        {!collapsed && (
          <div>
            <div
              className="font-orbitron font-bold text-sm leading-tight"
              style={{ color: "oklch(0.92 0.008 220)" }}
            >
              智慧供热
            </div>
            <div
              className="text-xs leading-tight mt-0.5"
              style={{ color: "oklch(0.55 0.015 220)" }}
            >
              Smart Heating AI
            </div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          return (
            <Link key={item.id} href={item.path}>
              <div
                className="flex items-center gap-3 mx-2 mb-1 rounded-lg transition-all duration-200 group"
                style={{
                  padding: collapsed ? "10px 14px" : "10px 14px",
                  background: isActive
                    ? "oklch(0.65 0.20 220 / 15%)"
                    : "transparent",
                  borderLeft: isActive
                    ? "3px solid oklch(0.65 0.20 220)"
                    : "3px solid transparent",
                  cursor: "pointer",
                }}
              >
                <Icon
                  size={20}
                  style={{
                    color: isActive
                      ? "oklch(0.75 0.20 220)"
                      : "oklch(0.55 0.015 220)",
                    flexShrink: 0,
                    filter: isActive
                      ? "drop-shadow(0 0 6px oklch(0.65 0.20 220))"
                      : "none",
                    transition: "all 0.2s",
                  }}
                />
                {!collapsed && (
                  <div>
                    <div
                      className="text-sm font-medium leading-tight"
                      style={{
                        color: isActive
                          ? "oklch(0.92 0.008 220)"
                          : "oklch(0.70 0.010 220)",
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      className="text-xs leading-tight mt-0.5"
                      style={{ color: "oklch(0.45 0.010 220)" }}
                    >
                      {item.sublabel}
                    </div>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div
        className="p-3"
        style={{ borderTop: "1px solid oklch(1 0 0 / 8%)" }}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full rounded-lg py-2 transition-all duration-200"
          style={{
            background: "oklch(1 0 0 / 5%)",
            color: "oklch(0.55 0.015 220)",
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && (
            <span className="ml-2 text-xs">收起</span>
          )}
        </button>
      </div>

      {/* System Status */}
      {!collapsed && (
        <div
          className="px-4 py-3"
          style={{ borderTop: "1px solid oklch(1 0 0 / 8%)" }}
        >
          <div className="status-online">
            <span
              className="pulse-dot"
              style={{ background: "oklch(0.65 0.18 150)", color: "oklch(0.65 0.18 150)" }}
            />
            系统运行正常
          </div>
        </div>
      )}
    </aside>
  );
}
