/**
 * HeatingSystemMap.tsx — LIGHT TECH HEATING SYSTEM DIAGRAM
 * Design: White/light-gray background, blue supply pipes, indigo return pipes
 * 18 buildings across 3 heat stations (6 per station: A1-A6, B1-B6, C1-C6)
 * Preserves all original building positions (b.x, b.y) and station positions (s.x, s.y)
 */
import { useEffect, useRef, useState } from "react";
import type { Building, HeatStation, WeatherType } from "../pages/Home";

interface Props {
  buildings: Building[];
  stations: HeatStation[];
  weather: WeatherType;
  onSelectBuilding: (b: Building) => void;
  onSelectStation: (s: HeatStation) => void;
  selectedBuildingId?: string;
  selectedStationId?: string;
}

function getTempColor(temp: number) {
  if (temp >= 22) return { fill: "#FEE2E2", stroke: "#EF4444", text: "#DC2626", glow: "rgba(239,68,68,0.3)" };
  if (temp >= 21) return { fill: "#FEF3C7", stroke: "#F59E0B", text: "#D97706", glow: "rgba(245,158,11,0.3)" };
  if (temp >= 20) return { fill: "#D1FAE5", stroke: "#10B981", text: "#059669", glow: "rgba(16,185,129,0.3)" };
  if (temp >= 19) return { fill: "#DBEAFE", stroke: "#3B82F6", text: "#1D4ED8", glow: "rgba(59,130,246,0.3)" };
  if (temp >= 18) return { fill: "#EDE9FE", stroke: "#7C3AED", text: "#6D28D9", glow: "rgba(124,58,237,0.3)" };
  return { fill: "#FEE2E2", stroke: "#DC2626", text: "#991B1B", glow: "rgba(220,38,38,0.4)" };
}

function BuildingIcon({
  b, isSelected, isStationHighlighted, onClick, onHover, onLeave,
}: {
  b: Building; isSelected: boolean; isStationHighlighted?: boolean;
  onClick: () => void;
  onHover: (b: Building, x: number, y: number) => void;
  onLeave: () => void;
}) {
  const colors = getTempColor(b.temp);
  const w = 44;
  const h = Math.min(76, 28 + b.floors * 2.5);
  const bx = b.x - w / 2;
  const by = b.y - h;
  const isRisk = b.temp < 18;
  const winRows = Math.min(5, Math.floor(b.floors / 2));

  const stationColors: Record<string, string> = { S1: "#1A56DB", S2: "#059669", S3: "#D97706" };
  const stationColor = stationColors[b.stationId] || "#6B7280";

  return (
    <g className="cursor-pointer" onClick={onClick}
      onMouseEnter={e => onHover(b, e.clientX, e.clientY)}
      onMouseLeave={onLeave}>

      {/* Station highlight glow */}
      {isStationHighlighted && !isSelected && (
        <rect x={bx - 4} y={by - 4} width={w + 8} height={h + 8} rx={7}
          fill={`${stationColor}18`}
          stroke={stationColor} strokeWidth={2} opacity={0.8}
        >
          <animate attributeName="opacity" values="0.8;0.4;0.8" dur="1.8s" repeatCount="indefinite" />
        </rect>
      )}

      {/* Shadow */}
      <rect x={bx + 2} y={by + 3} width={w} height={h} rx={4} fill="rgba(0,0,0,0.07)" />

      {/* Selection ring */}
      {isSelected && (
        <rect x={bx - 5} y={by - 5} width={w + 10} height={h + 10} rx={7}
          fill="none" stroke="#1A56DB" strokeWidth={2} strokeDasharray="8 4" opacity={0.8}>
          <animate attributeName="stroke-dashoffset" values="0;-24" dur="1.2s" repeatCount="indefinite" />
        </rect>
      )}

      {/* Building body */}
      <rect x={bx} y={by} width={w} height={h} rx={4}
        fill={isSelected ? colors.fill : "#FFFFFF"}
        stroke={isSelected ? colors.stroke : "#D1D5DB"}
        strokeWidth={isSelected ? 2 : 1}
        style={{ filter: isSelected ? `drop-shadow(0 2px 8px ${colors.glow})` : "drop-shadow(0 1px 3px rgba(0,0,0,0.08))" }}
      />

      {/* Roof color band */}
      <rect x={bx} y={by} width={w} height={5} rx={4}
        fill={colors.stroke} opacity={0.85}
      />
      <rect x={bx} y={by + 2} width={w} height={3} fill={colors.stroke} opacity={0.85} />

      {/* Floor lines */}
      {Array.from({ length: Math.min(6, Math.floor(h / 10)) }).map((_, i) => (
        <line key={i}
          x1={bx + 2} y1={by + 8 + i * (h - 8) / Math.min(6, Math.floor(h / 10))}
          x2={bx + w - 2} y2={by + 8 + i * (h - 8) / Math.min(6, Math.floor(h / 10))}
          stroke="#F1F5F9" strokeWidth={0.5}
        />
      ))}

      {/* Windows */}
      {Array.from({ length: winRows }).map((_, row) => (
        <g key={row}>
          {[0, 1, 2].map(col => {
            const lit = (b.id.charCodeAt(0) + row * 3 + col * 7) % 5 > 1;
            return (
              <rect key={col}
                x={bx + 5 + col * 12} y={by + 10 + row * 10}
                width={8} height={6} rx={1}
                fill={lit ? colors.fill : "#F8FAFC"}
                stroke={lit ? colors.stroke : "#E2E8F0"}
                strokeWidth={0.5}
                opacity={0.9}
              />
            );
          })}
        </g>
      ))}

      {/* Temp badge at bottom */}
      <rect x={bx} y={by + h - 14} width={w} height={14}
        fill={colors.stroke} opacity={0.9}
        rx={0}
      />
      <rect x={bx} y={by + h - 14} width={w} height={14} fill={colors.stroke} opacity={0.9} />
      <rect x={bx} y={by + h - 4} width={w} height={4} rx={0} fill={colors.stroke} opacity={0.9} />
      <rect x={bx} y={by + h - 4} width={w} height={4} fill={colors.stroke} opacity={0.9} />
      {/* Bottom rounded corners */}
      <rect x={bx} y={by + h - 14} width={w} height={14} rx={4} fill={colors.stroke} opacity={0.9} />
      <rect x={bx} y={by + h - 14} width={w} height={8} fill={colors.stroke} opacity={0.9} />

      <text x={b.x} y={by + h - 4} textAnchor="middle"
        fontSize={9} fontWeight={700} fill="#FFFFFF"
        fontFamily="'Share Tech Mono', monospace">
        {b.temp.toFixed(1)}°C
      </text>

      {/* Building name — inside building, just below roof band */}
      <text x={b.x} y={by + 18} textAnchor="middle"
        fontSize={8.5} fontWeight={800}
        fill={isSelected ? colors.stroke : "#374151"}
        fontFamily="'Noto Sans SC', sans-serif"
        style={{ userSelect: "none" }}>
        {b.name}
      </text>

      {/* Risk indicator */}
      {isRisk && (
        <circle cx={bx + w - 4} cy={by + 4} r={5} fill="#DC2626">
          <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Meter badge */}
      {b.hasMeter && (
        <circle cx={bx + 5} cy={by + 5} r={5} fill="#1A56DB"
          stroke="#BFDBFE" strokeWidth={1}>
          <animate attributeName="opacity" values="1;0.6;1" dur="2.5s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Hit area */}
      <rect x={bx - 4} y={by - 4} width={w + 8} height={h + 20} fill="transparent" />
    </g>
  );
}

function AnimatedPipe({
  x1, y1, x2, y2, color, reverse = false, width = 3, opacity = 1,
}: {
  x1: number; y1: number; x2: number; y2: number;
  color: string;
  reverse?: boolean; width?: number; opacity?: number;
}) {
  const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const dur = `${Math.max(1.5, len / 70).toFixed(1)}s`;
  // reverse=false: flow x1→x2 (dashoffset 20→0, dashes march forward)
  // reverse=true:  flow x2→x1 (dashoffset 0→20, dashes march backward)
  return (
    <g>
      {/* Base pipe */}
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth={width} opacity={opacity * 0.35} strokeLinecap="round" />
      {/* Animated flow */}
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth={width}
        strokeDasharray="12 8" opacity={opacity * 0.85} strokeLinecap="round">
        <animate attributeName="stroke-dashoffset"
          from={reverse ? "0" : "20"} to={reverse ? "20" : "0"}
          dur={dur} repeatCount="indefinite" />
      </line>
    </g>
  );
}

function WeatherCanvas({ weather }: { weather: WeatherType }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth || 900;
    canvas.height = canvas.offsetHeight || 600;
    let animId: number;

    if (weather === "rainy") {
      const drops = Array.from({ length: 80 }, () => ({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        speed: 4 + Math.random() * 4, len: 10 + Math.random() * 8,
      }));
      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "rgba(59,130,246,0.18)";
        ctx.lineWidth = 0.8;
        drops.forEach(d => {
          ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - 1.5, d.y + d.len); ctx.stroke();
          d.y += d.speed; d.x -= 0.8;
          if (d.y > canvas.height) { d.y = -d.len; d.x = Math.random() * canvas.width; }
        });
        animId = requestAnimationFrame(draw);
      };
      draw();
    } else if (weather === "snowy") {
      const flakes = Array.from({ length: 55 }, () => ({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        speed: 0.5 + Math.random() * 1.2, size: 1.5 + Math.random() * 2.5,
        drift: (Math.random() - 0.5) * 0.4,
      }));
      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(147,197,253,0.55)";
        flakes.forEach(f => {
          ctx.beginPath(); ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2); ctx.fill();
          f.y += f.speed; f.x += f.drift;
          if (f.y > canvas.height) { f.y = -5; f.x = Math.random() * canvas.width; }
        });
        animId = requestAnimationFrame(draw);
      };
      draw();
    } else if (weather === "sunny") {
      let angle = 0;
      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cx = canvas.width * 0.85, cy = 55;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
        grad.addColorStop(0, "rgba(251,191,36,0.12)");
        grad.addColorStop(0.5, "rgba(251,191,36,0.04)");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(cx, cy, 80, 0, Math.PI * 2); ctx.fill();
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2 + angle;
          ctx.strokeStyle = "rgba(251,191,36,0.1)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * 28, cy + Math.sin(a) * 28);
          ctx.lineTo(cx + Math.cos(a) * 60, cy + Math.sin(a) * 60);
          ctx.stroke();
        }
        angle += 0.004;
        animId = requestAnimationFrame(draw);
      };
      draw();
    } else {
      // cloudy
      let offset = 0;
      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(148,163,184,0.05)";
        [[offset % (canvas.width + 200) - 100, 30, 140, 35],
         [(offset * 0.7 + 300) % (canvas.width + 200) - 100, 60, 100, 25]].forEach(([x, y, w, h]) => {
          ctx.beginPath();
          ctx.ellipse(x as number, y as number, w as number, h as number, 0, 0, Math.PI * 2);
          ctx.fill();
        });
        offset += 0.2;
        animId = requestAnimationFrame(draw);
      };
      draw();
    }
    return () => cancelAnimationFrame(animId);
  }, [weather]);

  return (
    <canvas ref={ref} style={{
      position: "absolute", inset: 0, width: "100%", height: "100%",
      pointerEvents: "none", zIndex: 3,
    }} />
  );
}

export default function HeatingSystemMap({
  buildings, stations, weather,
  onSelectBuilding, onSelectStation,
  selectedBuildingId, selectedStationId,
}: Props) {
  const [tooltip, setTooltip] = useState<{ building: Building; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const VW = 1040, VH = 660;
  // Heat source centered between 3 stations (y=130, y=340, y=550) => center = 340
  const srcX = 75, srcY = 340;
  // Pipe offset: supply line offset -5px perpendicular, return +5px
  // For diagonal lines we use separate y offsets on the primary pipes
  // and separate x offsets on secondary pipes
  const PRI_SUP_OFF = -6;  // primary supply: shift up
  const PRI_RET_OFF = +6;  // primary return: shift down
  const SEC_SUP_OFF = -6;  // secondary supply: shift left of building center
  const SEC_RET_OFF = +6;  // secondary return: shift right of building center

  return (
    <div ref={containerRef} style={{
      position: "relative", width: "100%", height: "100%", overflow: "hidden",
      background: "#EEF2F7",
      backgroundImage: `
        linear-gradient(rgba(26,86,219,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(26,86,219,0.04) 1px, transparent 1px)
      `,
      backgroundSize: "32px 32px",
    }}>
      {/* Weather canvas */}
      <WeatherCanvas weather={weather} />

      {/* SVG */}
      <svg viewBox={`0 0 ${VW} ${VH}`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 4 }}>
        <defs>
          <filter id="card-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.08)" />
          </filter>
        </defs>

        {/*
          PIPE FLOW DIRECTION RULES:
          AnimatedPipe: x1,y1 is the START of the drawn line, x2,y2 is the END.
          reverse=false => dashes march from (x1,y1) toward (x2,y2)  [dashoffset 20→0]
          reverse=true  => dashes march from (x2,y2) toward (x1,y1)  [dashoffset 0→20]

          PRIMARY NETWORK:
            Supply (orange): heat source → station  => draw src→station, reverse=false
            Return (blue):   station → heat source  => draw src→station, reverse=true
              (we draw the line in same direction as supply but animate backward)

          SECONDARY NETWORK:
            Supply (cyan):   station → building     => draw station→building, reverse=false
            Return (indigo): building → station     => draw station→building, reverse=true
              (same line coords, opposite animation direction)
        */}

        {/* ── Primary pipes: supply offset up, return offset down ── */}
        {stations.map(s => {
          // Midpoint of the supply pipe for flow label
          const mx = (srcX + 32 + s.x - 28) / 2;
          const my = (srcY + s.y) / 2 + PRI_SUP_OFF;
          // Flow label: station flow in t/h (1 m³ water ≈ 1 t)
          const flowLabel = `${s.flow} t/h`;
          return (
            <g key={`pp-${s.id}`}>
              {/* Supply (orange): heat source → station. Offset up by PRI_SUP_OFF */}
              <AnimatedPipe
                x1={srcX + 32} y1={srcY + PRI_SUP_OFF}
                x2={s.x - 28}  y2={s.y + PRI_SUP_OFF}
                color="#F97316" width={4} reverse={false}
              />
              {/* Return (blue): station → heat source. Offset down by PRI_RET_OFF */}
              <AnimatedPipe
                x1={srcX + 32} y1={srcY + PRI_RET_OFF}
                x2={s.x - 28}  y2={s.y + PRI_RET_OFF}
                color="#3B82F6" width={4} reverse={true}
              />
              {/* Flow label badge at midpoint of supply pipe */}
              <g transform={`translate(${mx}, ${my - 14})`}>
                <rect x={-22} y={-8} width={44} height={14} rx={4}
                  fill="#FFF7ED" stroke="#FED7AA" strokeWidth={1}
                  style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.1))" }}
                />
                <text x={0} y={3} textAnchor="middle"
                  fontSize={8} fontWeight={700} fill="#C2410C"
                  fontFamily="'Share Tech Mono', monospace">
                  {flowLabel}
                </text>
              </g>
            </g>
          );
        })}

        {/* ── Secondary pipes: supply offset left, return offset right ── */}
        {stations.map(s =>
          buildings.filter(b => b.stationId === s.id).map(b => (
            <g key={`sp-${b.id}`}>
              {/* Supply (cyan): station → building. Offset left (SEC_SUP_OFF) */}
              <AnimatedPipe
                x1={s.x + 28}          y1={s.y + SEC_SUP_OFF}
                x2={b.x + SEC_SUP_OFF} y2={b.y + 5}
                color="#0891B2" width={2.5} opacity={0.9} reverse={false}
              />
              {/* Return (indigo): building → station. Offset right (SEC_RET_OFF) */}
              <AnimatedPipe
                x1={s.x + 28}          y1={s.y + SEC_RET_OFF}
                x2={b.x + SEC_RET_OFF} y2={b.y + 12}
                color="#6366F1" width={2.5} opacity={0.8} reverse={true}
              />
            </g>
          ))
        )}

        {/* ── Heat Source ── */}
        <g>
          {/* Outer ring */}
          <circle cx={srcX} cy={srcY} r={46} fill="none"
            stroke="rgba(249,115,22,0.15)" strokeWidth={1}>
            <animate attributeName="r" values="42;54;42" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" />
          </circle>

          {/* Card */}
          <rect x={srcX - 30} y={srcY - 34} width={60} height={68} rx={8}
            fill="#FFFFFF" stroke="#FED7AA" strokeWidth={1.5}
            filter="url(#card-shadow)"
          />
          {/* Header bar */}
          <rect x={srcX - 30} y={srcY - 34} width={60} height={8} rx={8} fill="#F97316" opacity={0.9} />
          <rect x={srcX - 30} y={srcY - 30} width={60} height={4} fill="#F97316" opacity={0.9} />

          {/* Chimneys */}
          {[-14, 0, 14].map((dx, i) => (
            <g key={i}>
              <rect x={srcX + dx - 4} y={srcY - 50} width={8} height={18} rx={2}
                fill="#FFF7ED" stroke="#FED7AA" strokeWidth={1} />
              <circle cx={srcX + dx} cy={srcY - 54} r={3} fill="rgba(156,163,175,0.4)">
                <animate attributeName="cy" values={`${srcY - 54};${srcY - 66};${srcY - 54}`} dur={`${1.6 + i * 0.4}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur={`${1.6 + i * 0.4}s`} repeatCount="indefinite" />
                <animate attributeName="r" values="3;6;3" dur={`${1.6 + i * 0.4}s`} repeatCount="indefinite" />
              </circle>
            </g>
          ))}

          <text x={srcX} y={srcY + 2} textAnchor="middle" fontSize={20}>🔥</text>
          <text x={srcX} y={srcY + 16} textAnchor="middle" fontSize={9} fontWeight={800}
            fill="#D97706" fontFamily="'Noto Sans SC', sans-serif">
            热源
          </text>
          <text x={srcX} y={srcY + 28} textAnchor="middle" fontSize={7}
            fill="#9CA3AF" fontFamily="'Share Tech Mono', monospace">
            HEAT SOURCE
          </text>

          {/* Flow data */}
          <rect x={srcX - 26} y={srcY - 20} width={52} height={12} rx={3}
            fill="#FFF7ED" stroke="#FDE68A" strokeWidth={1} />
          <text x={srcX} y={srcY - 11} textAnchor="middle" fontSize={7} fill="#D97706"
            fontFamily="'Share Tech Mono', monospace" fontWeight={700}>
            {stations.reduce((s, st) => s + st.flow, 0)} m³/h
          </text>
        </g>

        {/* ── Heat Stations ── */}
        {stations.map(s => {
          const isSel = selectedStationId === s.id;
          const stationColors: Record<string, string> = {
            S1: "#1A56DB", S2: "#059669", S3: "#D97706",
          };
          const sc = stationColors[s.id] || "#6B7280";

          return (
            <g key={s.id} className="cursor-pointer" onClick={() => onSelectStation(s)}>
              {/* Selection ring */}
              {isSel && (
                <circle cx={s.x} cy={s.y} r={36} fill="none"
                  stroke={sc} strokeWidth={2} strokeDasharray="8 4" opacity={0.6}>
                  <animateTransform attributeName="transform" type="rotate"
                    from={`0 ${s.x} ${s.y}`} to={`360 ${s.x} ${s.y}`}
                    dur="8s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Card */}
              <rect x={s.x - 26} y={s.y - 26} width={52} height={52} rx={8}
                fill={isSel ? `${sc}15` : "#FFFFFF"}
                stroke={isSel ? sc : "#E2E8F0"}
                strokeWidth={isSel ? 2 : 1}
                filter="url(#card-shadow)"
                style={{ transition: "all 0.2s" }}
              />
              {/* Top color bar */}
              <rect x={s.x - 26} y={s.y - 26} width={52} height={5} rx={8} fill={sc} opacity={0.9} />
              <rect x={s.x - 26} y={s.y - 23} width={52} height={2} fill={sc} opacity={0.9} />

              {/* Heat exchanger symbol */}
              <line x1={s.x - 12} y1={s.y - 8} x2={s.x + 12} y2={s.y + 8}
                stroke="#F97316" strokeWidth={2.5} strokeLinecap="round" />
              <line x1={s.x - 12} y1={s.y + 8} x2={s.x + 12} y2={s.y - 8}
                stroke="#3B82F6" strokeWidth={2.5} strokeLinecap="round" />

              {/* Station name */}
              <text x={s.x} y={s.y + 22} textAnchor="middle" fontSize={8} fontWeight={800}
                fill={isSel ? sc : "#374151"}
                fontFamily="'Noto Sans SC', sans-serif">
                {s.name}
              </text>

              {/* Heat output */}
              <rect x={s.x - 24} y={s.y - 42} width={48} height={13} rx={3}
                fill="#FFFBEB" stroke="#FDE68A" strokeWidth={1} />
              <text x={s.x} y={s.y - 32} textAnchor="middle" fontSize={8} fontWeight={700}
                fill="#D97706" fontFamily="'Share Tech Mono', monospace">
                {(s.flow * (s.supplyTemp - s.returnTemp) * 4.18 / 1000).toFixed(2)} GJ
              </text>

              {/* Pulse on select */}
              {isSel && (
                <circle cx={s.x} cy={s.y} r={40} fill="none" stroke={sc} strokeWidth={1} opacity={0.15}>
                  <animate attributeName="r" values="34;50;34" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.15;0;0.15" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Hit area */}
              <rect x={s.x - 34} y={s.y - 46} width={68} height={80} fill="transparent" />
            </g>
          );
        })}

        {/* ── Buildings ── */}
        {buildings.map(b => {
          // Determine if this building belongs to the selected station
          const selectedStation = selectedStationId
            ? stations.find(s => s.id === selectedStationId)
            : null;
          const isStationHighlighted = !!(selectedStation && b.stationId === selectedStation.id);
          return (
            <BuildingIcon key={b.id} b={b}
              isSelected={selectedBuildingId === b.id}
              isStationHighlighted={isStationHighlighted}
              onClick={() => onSelectBuilding(b)}
              onHover={(building, x, y) => setTooltip({ building, x, y })}
              onLeave={() => setTooltip(null)}
            />
          );
        })}

        {/* ── Pipe legend ── */}
        <g transform={`translate(${VW - 182}, ${VH - 100})`}>
          <rect x={0} y={0} width={168} height={92} rx={6}
            fill="#FFFFFF" stroke="#E2E8F0" strokeWidth={1}
            filter="url(#card-shadow)"
          />
          <text x={8} y={16} fontSize={9} fontWeight={700} fill="#374151"
            fontFamily="'Share Tech Mono', monospace" letterSpacing={1}>管网图例</text>
          {[
            { color: "#F97316", label: "一次供水 热源→换热站" },
            { color: "#3B82F6", label: "一次回水 换热站→热源" },
            { color: "#0891B2", label: "二次供水 换热站→楼" },
            { color: "#6366F1", label: "二次回水 楼→换热站" },
          ].map((item, i) => (
            <g key={i} transform={`translate(8, ${26 + i * 16})`}>
              <line x1={0} y1={5} x2={24} y2={5} stroke={item.color} strokeWidth={2.5} strokeDasharray="8 4" />
              {/* Arrow head */}
              <polygon points="24,2 30,5 24,8" fill={item.color} opacity={0.8} />
              <text x={35} y={9} fontSize={8} fill="#6B7280"
                fontFamily="'Noto Sans SC', sans-serif">{item.label}</text>
            </g>
          ))}
        </g>

        {/* ── Temp legend ── */}
        <g transform={`translate(${VW - 182}, 16)`}>
          <rect x={0} y={0} width={160} height={100} rx={6}
            fill="#FFFFFF" stroke="#E2E8F0" strokeWidth={1}
            filter="url(#card-shadow)"
          />
          <text x={8} y={16} fontSize={9} fontWeight={700} fill="#374151"
            fontFamily="'Share Tech Mono', monospace" letterSpacing={1}>室温图例</text>
          {[
            { color: "#EF4444", label: "≥22°C 偏热" },
            { color: "#F59E0B", label: "21~22°C 略热" },
            { color: "#10B981", label: "19~21°C 舒适" },
            { color: "#3B82F6", label: "18~19°C 略凉" },
            { color: "#7C3AED", label: "<18°C 风险⚠" },
          ].map((item, i) => (
            <g key={i} transform={`translate(8, ${26 + i * 14})`}>
              <circle cx={5} cy={5} r={4} fill={item.color} />
              <text x={14} y={9} fontSize={8.5} fill="#6B7280"
                fontFamily="'Noto Sans SC', sans-serif">{item.label}</text>
            </g>
          ))}
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip && (() => {
        const b = tooltip.building;
        const colors = getTempColor(b.temp);
        const container = containerRef.current;
        const rect = container?.getBoundingClientRect();
        const tx = rect ? tooltip.x - rect.left + 14 : tooltip.x + 14;
        const ty = rect ? tooltip.y - rect.top : tooltip.y;

        return (
          <div style={{
            position: "absolute", zIndex: 20,
            left: Math.min(tx, (rect?.width ?? 800) - 200),
            top: Math.max(ty - 120, 8),
            background: "#FFFFFF",
            border: `1px solid ${colors.stroke}40`,
            borderRadius: 8,
            padding: "12px 14px",
            minWidth: 180,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            pointerEvents: "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{b.name}</span>
              <div style={{ display: "flex", gap: 4 }}>
                {b.hasMeter && (
                  <span style={{
                    padding: "1px 5px", borderRadius: 3, fontSize: 8, fontWeight: 700,
                    background: "#EFF6FF", color: "#1A56DB", border: "1px solid #BFDBFE",
                  }}>📡实测</span>
                )}
                {b.temp < 18 && (
                  <span style={{
                    padding: "1px 5px", borderRadius: 3, fontSize: 8, fontWeight: 700,
                    background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA",
                  }}>⚠低温</span>
                )}
              </div>
            </div>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 22, fontWeight: 900,
              color: colors.text,
              marginBottom: 8,
            }}>
              {b.temp.toFixed(1)}°C
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
              {[
                { label: "楼层数", value: `${b.floors}层` },
                { label: "朝向", value: b.orientation },
                { label: "供暖方式", value: b.heatingType },
                { label: "管网位置", value: b.position },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: 8, color: "#9CA3AF", letterSpacing: 1, fontFamily: "'Share Tech Mono', monospace" }}>{item.label}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 8, padding: "4px 8px", borderRadius: 4,
              background: "#EFF6FF", border: "1px solid #BFDBFE",
              fontSize: 9, color: "#1A56DB",
              fontFamily: "'Share Tech Mono', monospace",
            }}>
              CLICK TO VIEW FLOOR DETAILS →
            </div>
          </div>
        );
      })()}
    </div>
  );
}
