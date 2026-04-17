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

  const PADDING_LEFT = 70;
  const PADDING_BOTTOM = 50;
  const PADDING_TOP = 30;
  const PADDING_RIGHT = 30;

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

  const gridWidth = dimensions.width - PADDING_LEFT - PADDING_RIGHT;
  const gridHeight = dimensions.height - PADDING_TOP - PADDING_BOTTOM;
  const cellSize = gridWidth / GRID_SIZE;

  const getGridPosition = (x: number, y: number) => {
    return {
      left: PADDING_LEFT + x * cellSize,
      top: PADDING_TOP + (GRID_SIZE - y) * cellSize,
    };
  };

  const getPointFromMouse = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 5, y: 5 };

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const relativeX = mouseX - PADDING_LEFT;
    const relativeY = mouseY - PADDING_TOP;

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
        return { bg: "bg-rose-200/70", text: "text-rose-700", border: "border-rose-300" };
      case "top-right":
        return { bg: "bg-blue-200/70", text: "text-blue-700", border: "border-blue-300" };
      case "bottom-left":
        return { bg: "bg-green-200/70", text: "text-green-700", border: "border-green-300" };
      case "bottom-right":
        return { bg: "bg-violet-200/70", text: "text-violet-700", border: "border-violet-300" };
      default:
        return { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" };
    }
  };

  return (
    <div className="w-full" ref={containerRef}>
      <div
        className="relative w-full bg-white rounded-xl border-2 border-slate-200 overflow-hidden select-none"
        style={{ height: dimensions.height }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid Background - only inside the grid area */}
        <div 
          className="absolute grid"
          style={{ 
            width: gridWidth,
            height: gridHeight,
            left: PADDING_LEFT,
            top: PADDING_TOP,
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
        <div className="absolute pointer-events-none" style={{
          left: PADDING_LEFT,
          top: PADDING_TOP,
          width: gridWidth,
          height: gridHeight,
        }}>
          {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
            <div
              key={`v-${i}`}
              className={`absolute top-0 bottom-0 ${i === 5 ? "bg-slate-500/70 w-0.5" : "bg-slate-300/50 w-px"}`}
              style={{ left: i * cellSize }}
            />
          ))}
          {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
            <div
              key={`h-${i}`}
              className={`absolute left-0 right-0 ${i === 5 ? "bg-slate-500/70 h-0.5" : "bg-slate-300/50 h-px"}`}
              style={{ top: i * cellSize }}
            />
          ))}
          {/* Border */}
          <div className="absolute inset-0 border-2 border-slate-400" />
        </div>

        {/* Y-axis label (left side, outside) */}
        <div 
          className="absolute text-xs font-semibold text-slate-700 bg-white/95 px-2 py-1 rounded shadow-sm z-30 whitespace-nowrap"
          style={{ 
            left: 2,
            top: "50%",
            transform: "translateY(-50%) rotate(-90deg)",
            transformOrigin: "left center",
          }}
        >
          {axes.yLabel}
        </div>

        {/* Y-axis opposite (right side, outside) */}
        <div 
          className="absolute text-xs font-semibold text-slate-500 bg-white/95 px-2 py-1 rounded shadow-sm z-30 whitespace-nowrap"
          style={{ 
            right: 2,
            top: "50%",
            transform: "translateY(-50%) rotate(90deg)",
            transformOrigin: "right center",
          }}
        >
          {axes.yBottom}
        </div>

        {/* X-axis label (bottom, outside) */}
        <div 
          className="absolute text-xs font-semibold text-slate-700 bg-white/95 px-2 py-1 rounded shadow-sm z-30"
          style={{ 
            bottom: 4,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {axes.xLabel}
        </div>

        {/* X-axis opposite (top, outside) */}
        <div 
          className="absolute text-xs font-semibold text-slate-500 bg-white/95 px-2 py-1 rounded shadow-sm z-30"
          style={{ 
            top: 4,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {axes.xLeft}
        </div>

        {/* X-axis numbers (bottom) */}
        <div 
          className="absolute flex justify-between pointer-events-none z-20"
          style={{ 
            left: PADDING_LEFT,
            right: PADDING_RIGHT,
            bottom: 18,
            width: gridWidth,
          }}
        >
          {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
            <span 
              key={i} 
              className="text-[9px] text-slate-400 font-medium text-center"
              style={{ width: cellSize }}
            >
              {i}
            </span>
          ))}
        </div>

        {/* Y-axis numbers (left side) */}
        <div 
          className="absolute flex flex-col justify-between pointer-events-none z-20"
          style={{ 
            top: PADDING_TOP,
            bottom: PADDING_BOTTOM,
            left: 8,
            height: gridHeight,
          }}
        >
          {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
            <span 
              key={i} 
              className="text-[9px] text-slate-400 font-medium"
            >
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