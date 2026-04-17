"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

interface DataPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  quadrant: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

interface AxisConfig {
  xLabel: string;
  yLabel: string;
  xLeft: string;
  xRight: string;
  yBottom: string;
  yTop: string;
}

interface QuadrantChartProps {
  points: DataPoint[];
  axes: AxisConfig;
  onUpdatePoint: (id: string, x: number, y: number) => void;
  onDeletePoint: (id: string) => void;
}

const GRID_SIZE = 10;
const PADDING = 45;

const QuadrantChart = ({
  points,
  axes,
  onUpdatePoint,
  onDeletePoint,
}: QuadrantChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });
  const [dragging, setDragging] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const size = Math.min(rect.width - 20, 600);
        setDimensions({ width: size, height: size });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const graphSize = dimensions.width - PADDING * 2;
  const cellSize = graphSize / GRID_SIZE;

  const getGridPosition = (x: number, y: number) => {
    return {
      left: PADDING + x * cellSize,
      top: PADDING + (GRID_SIZE - y) * cellSize,
    };
  };

  const getPointFromMouse = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 5, y: 5 };

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const relativeX = mouseX - PADDING;
    const relativeY = mouseY - PADDING;

    const gridX = Math.round(relativeX / cellSize);
    const gridY = GRID_SIZE - Math.round(relativeY / cellSize);

    return {
      x: Math.max(0, Math.min(GRID_SIZE, gridX)),
      y: Math.max(0, Math.min(GRID_SIZE, gridY)),
    };
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;

    const { x, y } = getPointFromMouse(e.clientX, e.clientY);
    onUpdatePoint(dragging, x, y);
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const getQuadrant = (x: number, y: number): string => {
    const isTop = y >= 5;
    const isRight = x >= 5;
    
    if (isTop && !isRight) return "top-left";
    if (isTop && isRight) return "top-right";
    if (!isTop && !isRight) return "bottom-left";
    return "bottom-right";
  };

  const getQuadrantStyles = (quadrant: string) => {
    switch (quadrant) {
      case "top-left":
        return { bg: "bg-rose-200/60", text: "text-rose-700", border: "border-rose-300" };
      case "top-right":
        return { bg: "bg-blue-200/60", text: "text-blue-700", border: "border-blue-300" };
      case "bottom-left":
        return { bg: "bg-green-200/60", text: "text-green-700", border: "border-green-300" };
      case "bottom-right":
        return { bg: "bg-violet-200/60", text: "text-violet-700", border: "border-violet-300" };
      default:
        return { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" };
    }
  };

  return (
    <div className="w-full" ref={containerRef}>
      <div
        className="relative w-full bg-white rounded-xl border-2 border-slate-200 overflow-hidden select-none"
        style={{ height: dimensions.width }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* 10x10 Grid Background */}
        <div 
          className="absolute inset-0 grid"
          style={{ 
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const col = i % GRID_SIZE;
            const row = Math.floor(i / GRID_SIZE);
            const x = col;
            const y = GRID_SIZE - 1 - row;
            const quadrant = getQuadrant(x, y);
            const styles = getQuadrantStyles(quadrant);
            
            return (
              <div
                key={i}
                className={`border border-slate-200/30 ${styles.bg}`}
              />
            );
          })}
        </div>

        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
            <div
              key={`v-${i}`}
              className={`absolute top-0 bottom-0 ${i === 5 ? "bg-slate-400/70 w-0.5" : "bg-slate-300/40 w-px"}`}
              style={{ left: PADDING + i * cellSize }}
            />
          ))}
          {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
            <div
              key={`h-${i}`}
              className={`absolute left-0 right-0 ${i === 5 ? "bg-slate-400/70 h-0.5" : "bg-slate-300/40 h-px"}`}
              style={{ top: PADDING + i * cellSize }}
            />
          ))}
        </div>

        {/* Border frame */}
        <div 
          className="absolute border-2 border-slate-400 pointer-events-none z-10"
          style={{
            top: PADDING,
            left: PADDING,
            width: graphSize,
            height: graphSize,
          }}
        />

        {/* X-axis labels (bottom) */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end px-[45px] pb-1 pointer-events-none z-30">
          <span className="text-xs font-medium text-rose-500 max-w-[80px] text-left truncate" title={axes.xLeft}>
            {axes.xLeft}
          </span>
          <span className="text-xs font-semibold text-slate-600 bg-white/90 px-2 py-0.5 rounded shadow-sm">
            {axes.xLabel}
          </span>
          <span className="text-xs font-medium text-blue-500 max-w-[80px] text-right truncate" title={axes.xRight}>
            {axes.xRight}
          </span>
        </div>

        {/* Y-axis labels (left) */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between items-start pl-1 pointer-events-none z-30">
          <span className="text-xs font-medium text-emerald-500 max-w-[60px] text-left truncate" title={axes.yTop}>
            {axes.yTop}
          </span>
          <span className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-semibold text-slate-600 bg-white/90 px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
            {axes.yLabel}
          </span>
          <span className="text-xs font-medium text-green-500 max-w-[60px] text-left truncate" title={axes.yBottom}>
            {axes.yBottom}
          </span>
        </div>

        {/* Quadrant descriptions (smaller, inside quadrants) */}
        <div className="absolute top-2 left-2 text-[9px] text-rose-600/70 font-medium leading-tight pointer-events-none z-20">
          <div>{axes.yTop}</div>
          <div className="text-rose-500">{axes.xLeft}</div>
        </div>
        <div className="absolute top-2 right-2 text-[9px] text-blue-600/70 font-medium leading-tight text-right pointer-events-none z-20">
          <div>{axes.yTop}</div>
          <div className="text-blue-500">{axes.xRight}</div>
        </div>
        <div className="absolute bottom-10 left-2 text-[9px] text-green-600/70 font-medium leading-tight pointer-events-none z-20">
          <div>{axes.yBottom}</div>
          <div className="text-green-500">{axes.xLeft}</div>
        </div>
        <div className="absolute bottom-10 right-2 text-[9px] text-violet-600/70 font-medium leading-tight text-right pointer-events-none z-20">
          <div>{axes.yBottom}</div>
          <div className="text-violet-500">{axes.xRight}</div>
        </div>

        {/* X-axis numbers */}
        <div 
          className="absolute flex justify-between pointer-events-none z-20"
          style={{ 
            left: PADDING, 
            right: PADDING, 
            bottom: "25px",
          }}
        >
          {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
            <span key={i} className="text-[9px] text-slate-400 font-medium" style={{ marginLeft: i === 0 ? 0 : '-4px' }}>
              {i}
            </span>
          ))}
        </div>

        {/* Y-axis numbers */}
        <div 
          className="absolute top-0 bottom-0 flex flex-col justify-between pointer-events-none z-20"
          style={{ left: "25px", top: PADDING, bottom: PADDING }}
        >
          {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
            <span key={i} className="text-[9px] text-slate-400 font-medium" style={{ marginTop: i === 0 ? '-4px' : i === GRID_SIZE ? '-8px' : '-4px' }}>
              {GRID_SIZE - i}
            </span>
          ))}
        </div>

        {/* Data Points */}
        {points.map((point) => {
          const pos = getGridPosition(point.x, point.y);
          const isHovered = hovered === point.id;
          const isDragging = dragging === point.id;
          
          return (
            <div
              key={point.id}
              className={`absolute transition-all duration-75 ${isDragging ? "z-50" : isHovered ? "z-40" : "z-10"}`}
              style={{
                left: `${pos.left}px`,
                top: `${pos.top}px`,
                transform: `translate(-50%, -50%) ${isDragging ? "scale(1.15)" : isHovered ? "scale(1.08)" : "scale(1)"}`,
              }}
            >
              <div
                className={`${point.color} w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-grab active:cursor-grabbing transition-transform`}
                onMouseDown={(e) => handleMouseDown(e, point.id)}
                onMouseEnter={() => setHovered(point.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <span className="text-xs font-bold text-white drop-shadow-sm">
                  {point.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              
              {/* Tooltip */}
              <div 
                className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 transition-opacity duration-150 pointer-events-none ${isHovered || isDragging ? "opacity-100" : "opacity-0"}`}
              >
                <div className="bg-slate-800 text-white text-xs px-2 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                  <p className="font-semibold">{point.name}</p>
                  <p className="text-slate-300 text-[10px]">x: {point.x}, y: {point.y}</p>
                </div>
                <div className="w-2 h-2 bg-slate-800 rotate-45 mx-auto -mt-1" />
              </div>

              {/* Delete button */}
              <button
                className={`absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md transition-opacity duration-150 hover:bg-red-600 ${isHovered || isDragging ? "opacity-100" : "opacity-0"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePoint(point.id);
                }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-[10px] text-slate-400 mt-2">
        ✨ Arrastra los puntos para posicionarlos
      </p>
    </div>
  );
};

export default QuadrantChart;