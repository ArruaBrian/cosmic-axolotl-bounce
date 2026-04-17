"use client";

import { useState, useRef, useEffect } from "react";
import { X, GripVertical } from "lucide-react";

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
const PADDING = 40;

const QuadrantChart = ({
  points,
  axes,
  onUpdatePoint,
  onDeletePoint,
}: QuadrantChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });
  const [dragging, setDragging] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const size = Math.min(rect.width, 600);
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

  const handleGridClick = (e: React.MouseEvent) => {
    if (dragging) return;
    
    const { x, y } = getPointFromMouse(e.clientX, e.clientY);
    const newPoint = {
      id: `click-${Date.now()}`,
      name: `Punto (${x},${y})`,
      x,
      y,
      color: "bg-amber-400",
      quadrant: getQuadrant(x, y) as DataPoint["quadrant"],
    };
    
    onUpdatePoint(newPoint.id, x, y);
  };

  const getQuadrant = (x: number, y: number): string => {
    const isTop = y >= 5;
    const isRight = x >= 5;
    
    if (isTop && !isRight) return "top-left";
    if (isTop && isRight) return "top-right";
    if (!isTop && !isRight) return "bottom-left";
    return "bottom-right";
  };

  const getQuadrantColors = (quadrant: string) => {
    switch (quadrant) {
      case "top-left":
        return { bg: "bg-rose-200/60", border: "border-rose-300", text: "text-rose-700" };
      case "top-right":
        return { bg: "bg-blue-200/60", border: "border-blue-300", text: "text-blue-700" };
      case "bottom-left":
        return { bg: "bg-green-200/60", border: "border-green-300", text: "text-green-700" };
      case "bottom-right":
        return { bg: "bg-violet-200/60", border: "border-violet-300", text: "text-violet-700" };
      default:
        return { bg: "bg-slate-100", border: "border-slate-200", text: "text-slate-700" };
    }
  };

  const quadrantLabels = [
    { q: "top-left", label: `${axes.yTop}\n${axes.xLeft}` },
    { q: "top-right", label: `${axes.yTop}\n${axes.xRight}`, align: "right" },
    { q: "bottom-left", label: `${axes.yBottom}\n${axes.xLeft}`, bottom: true },
    { q: "bottom-right", label: `${axes.yBottom}\n${axes.xRight}`, align: "right", bottom: true },
  ];

  return (
    <div className="w-full max-w-[600px] mx-auto">
      <div
        ref={containerRef}
        className="relative w-full bg-white rounded-xl border-2 border-slate-200 overflow-hidden select-none cursor-crosshair"
        style={{ height: dimensions.width }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* 10x10 Grid with colored quadrants */}
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
            const colors = getQuadrantColors(quadrant);
            
            return (
              <div
                key={i}
                className={`border border-slate-200/50 ${colors.bg} hover:opacity-80 transition-opacity`}
              />
            );
          })}
        </div>

        {/* Grid lines overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Vertical grid lines */}
          {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute top-0 bottom-0 bg-slate-300/30"
              style={{ left: PADDING + i * cellSize, width: i === 5 ? "2px" : "1px" }}
            />
          ))}
          {/* Horizontal grid lines */}
          {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute left-0 right-0 bg-slate-300/30"
              style={{ top: PADDING + i * cellSize, height: i === 5 ? "2px" : "1px" }}
            />
          ))}
        </div>

        {/* Quadrant Labels */}
        {quadrantLabels.map((ql) => {
          const pos = getGridPosition(
            ql.align === "right" ? GRID_SIZE - 1 : 1,
            ql.bottom ? 1 : GRID_SIZE - 1
          );
          return (
            <div
              key={ql.q}
              className={`absolute text-xs font-semibold ${getQuadrantColors(ql.q).text} opacity-70 pointer-events-none whitespace-pre-line ${
                ql.align === "right" ? "text-right" : "text-left"
              }`}
              style={{
                left: ql.align === "right" ? undefined : pos.left,
                right: ql.align === "right" ? dimensions.width - pos.left : undefined,
                top: ql.bottom ? pos.top : pos.top - 30,
              }}
            >
              {ql.label}
            </div>
          );
        })}

        {/* Axis Labels */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-sm font-semibold text-slate-600 bg-white/80 px-2 py-0.5 rounded">
          {axes.xLabel}
        </div>
        <div 
          className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-semibold text-slate-600 bg-white/80 px-2 py-0.5 rounded"
          style={{ marginLeft: "-30px" }}
        >
          {axes.yLabel}
        </div>

        {/* Edge labels */}
        <div className="absolute bottom-1 left-1 text-xs text-rose-500 font-medium">
          {axes.xLeft}
        </div>
        <div className="absolute bottom-1 right-1 text-xs text-blue-500 font-medium">
          {axes.xRight}
        </div>
        <div className="absolute top-1 left-1 text-xs text-emerald-500 font-medium">
          {axes.yTop}
        </div>
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-green-500 font-medium" style={{ bottom: "20px" }}>
          {axes.yBottom}
        </div>

        {/* X-axis numbers */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-[40px]">
          {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
            <span key={i} className="text-[10px] text-slate-400 relative" style={{ 
              left: `-${cellSize/2}px`
            }}>
              {i}
            </span>
          ))}
        </div>

        {/* Y-axis numbers */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-[40px]">
          {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
            <span 
              key={i} 
              className="text-[10px] text-slate-400 absolute left-[12px]"
              style={{ top: `${PADDING + i * cellSize - 5}px` }}
            >
              {GRID_SIZE - i}
            </span>
          ))}
        </div>

        {/* Data Points - snap to grid intersections */}
        {points.map((point) => {
          const pos = getGridPosition(point.x, point.y);
          const isHovered = hovered === point.id;
          const isDragging = dragging === point.id;
          
          return (
            <div
              key={point.id}
              className={`absolute transition-all duration-75 ${
                isDragging ? "z-50 scale-110" : isHovered ? "z-40 scale-105" : "z-10"
              }`}
              style={{
                left: `${pos.left}px`,
                top: `${pos.top}px`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div
                className={`${point.color} w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-grab active:cursor-grabbing transition-transform ${
                  isDragging ? "shadow-xl ring-4 ring-white/50" : ""
                }`}
                onMouseDown={(e) => handleMouseDown(e, point.id)}
                onMouseEnter={() => setHovered(point.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <span className="text-xs font-bold text-white drop-shadow">
                  {point.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              
              {/* Tooltip */}
              <div 
                className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 transition-opacity duration-150 pointer-events-none ${
                  isHovered || isDragging ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded-lg shadow-lg whitespace-nowrap">
                  <p className="font-semibold">{point.name}</p>
                  <p className="text-slate-300">x: {point.x}, y: {point.y}</p>
                </div>
                <div className="w-2 h-2 bg-slate-800 rotate-45 mx-auto -mt-1" />
              </div>

              {/* Delete button */}
              <button
                className={`absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md transition-opacity duration-150 hover:bg-red-600 ${
                  isHovered || isDragging ? "opacity-100" : "opacity-0"
                }`}
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

        {/* Border frame */}
        <div 
          className="absolute border-2 border-slate-400 pointer-events-none"
          style={{
            top: PADDING,
            left: PADDING,
            width: graphSize,
            height: graphSize,
          }}
        />
      </div>

      <p className="text-center text-xs text-slate-500 mt-3">
        ✨ Arrastra los puntos para posicionarlos • Cada posición es de 0 a 10 en X e Y
      </p>
    </div>
  );
};

export default QuadrantChart;