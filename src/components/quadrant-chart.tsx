"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  onRenamePoint: (id: string, name: string) => void;
}

const GRID_SIZE = 10;
const PADDING = 50;

const QUADRANT_COLORS = {
  "top-left": "bg-rose-500",
  "top-right": "bg-blue-500",
  "bottom-left": "bg-green-500",
  "bottom-right": "bg-violet-500",
};

interface PointGroup {
  x: number;
  y: number;
  points: DataPoint[];
}

const QuadrantChart = ({
  points,
  axes,
  onUpdatePoint,
  onDeletePoint,
  onRenamePoint,
}: QuadrantChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(400);
  const [dragging, setDragging] = useState<string | null>(null);
  const [draggedDistance, setDraggedDistance] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<DataPoint | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const graphSize = containerWidth - PADDING * 2;
  const cellSize = graphSize / GRID_SIZE;

  // Group points by position
  const groupedPoints = points.reduce<PointGroup[]>((groups, point) => {
    const existing = groups.find(g => g.x === point.x && g.y === point.y);
    if (existing) {
      existing.points.push(point);
    } else {
      groups.push({ x: point.x, y: point.y, points: [point] });
    }
    return groups;
  }, []);

  const getQuadrant = (x: number, y: number): DataPoint["quadrant"] => {
    const isTop = y >= 5;
    const isRight = x >= 5;
    
    if (isTop && !isRight) return "top-left";
    if (isTop && isRight) return "top-right";
    if (!isTop && !isRight) return "bottom-left";
    return "bottom-right";
  };

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
    setDraggedDistance(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;

    setDraggedDistance(prev => prev + 1);

    const { x, y } = getPointFromMouse(e.clientX, e.clientY);
    onUpdatePoint(dragging, x, y);
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleClick = (e: React.MouseEvent, point: DataPoint) => {
    if (draggedDistance > 5) return;
    
    e.stopPropagation();
    setEditingPoint(point);
    setEditValue(point.name);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingPoint && editValue.trim()) {
      onRenamePoint(editingPoint.id, editValue.trim());
    }
    setEditDialogOpen(false);
    setEditingPoint(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    }
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

  const quadrantLabels = [
    { 
      q: "top-left", 
      label: axes.yTop,
      sublabel: axes.xLeft,
      style: "text-left top-[15px] left-[15px]"
    },
    { 
      q: "top-right", 
      label: axes.yTop,
      sublabel: axes.xRight,
      style: "text-right top-[15px] right-[15px]"
    },
    { 
      q: "bottom-left", 
      label: axes.yBottom,
      sublabel: axes.xLeft,
      style: "text-left bottom-[15px] left-[15px]"
    },
    { 
      q: "bottom-right", 
      label: axes.yBottom,
      sublabel: axes.xRight,
      style: "text-right bottom-[15px] right-[15px]"
    },
  ];

  // Card deck stacking pattern: each card offset significantly so you can see them all
  const CARD_OFFSET_X = 12;
  const CARD_OFFSET_Y = 8;

  return (
    <div className="w-full" ref={containerRef}>
      <div
        className="relative w-full bg-white rounded-xl border-2 border-slate-200 overflow-hidden select-none"
        style={{ height: containerWidth }}
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
                className={`border border-slate-200/30 ${styles.bg} transition-opacity`}
              />
            );
          })}
        </div>

        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
            <div
              key={`v-${i}`}
              className={`absolute top-0 bottom-0 ${i === 5 ? "bg-slate-400/60 w-0.5" : "bg-slate-300/40 w-px"}`}
              style={{ left: PADDING + i * cellSize }}
            />
          ))}
          {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
            <div
              key={`h-${i}`}
              className={`absolute left-0 right-0 ${i === 5 ? "bg-slate-400/60 h-0.5" : "bg-slate-300/40 h-px"}`}
              style={{ top: PADDING + i * cellSize }}
            />
          ))}
        </div>

        {/* Quadrant Labels */}
        {quadrantLabels.map((ql) => {
          const styles = getQuadrantStyles(ql.q);
          return (
            <div
              key={ql.q}
              className={`absolute ${styles.bg} ${styles.text} ${ql.style} text-[10px] font-semibold p-2 rounded-lg border ${styles.border} opacity-90 pointer-events-none z-20 max-w-[45%] leading-tight`}
            >
              <div>{ql.label}</div>
              <div className="opacity-75">{ql.sublabel}</div>
            </div>
          );
        })}

        {/* Y-axis label (left side - shows yTop at top, yBottom at bottom) */}
        <div className="absolute left-1 top-1/2 -translate-y-1/2 -translate-y-4 text-xs font-semibold text-slate-600 bg-white/90 px-3 py-1 rounded-full shadow-sm z-30 whitespace-nowrap">
          {axes.yTop}
        </div>
        <div className="absolute left-1 top-1/2 translate-y-4 text-xs font-semibold text-slate-500 bg-white/90 px-3 py-1 rounded-full shadow-sm z-30 whitespace-nowrap">
          {axes.yBottom}
        </div>

        {/* Y-axis label (right side - shows yTop at top, yBottom at bottom) */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 -translate-y-4 text-xs font-semibold text-slate-600 bg-white/90 px-3 py-1 rounded-full shadow-sm z-30 whitespace-nowrap">
          {axes.yTop}
        </div>
        <div className="absolute right-1 top-1/2 translate-y-4 text-xs font-semibold text-slate-500 bg-white/90 px-3 py-1 rounded-full shadow-sm z-30 whitespace-nowrap">
          {axes.yBottom}
        </div>

        {/* X-axis label (bottom center) */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-semibold text-slate-600 bg-white/90 px-3 py-1 rounded-full shadow-sm z-30">
          {axes.xLabel}
        </div>

        {/* X-axis opposite label (top center) */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-xs font-semibold text-slate-500 bg-white/90 px-3 py-1 rounded-full shadow-sm z-30">
          {axes.xLeft}
        </div>

        {/* X-axis numbers (OUTSIDE - bottom) */}
        <div 
          className="absolute flex justify-between pointer-events-none z-30"
          style={{ 
            left: PADDING, 
            right: PADDING - 20, 
            bottom: "6px",
          }}
        >
          {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
            <span key={i} className="text-[9px] text-slate-400 font-medium text-center" style={{ width: cellSize }}>
              {i}
            </span>
          ))}
        </div>

        {/* Y-axis numbers (OUTSIDE - left side) */}
        <div 
          className="absolute flex flex-col justify-between pointer-events-none z-30"
          style={{ 
            left: "4px", 
            top: PADDING, 
            bottom: PADDING,
            height: graphSize,
          }}
        >
          {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
            <span key={i} className="text-[9px] text-slate-400 font-medium text-right" style={{ height: cellSize, lineHeight: `${cellSize}px` }}>
              {GRID_SIZE - i}
            </span>
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

        {/* Data Points - Card deck stacking with larger offset */}
        {groupedPoints.map((group) => {
          const pos = getGridPosition(group.x, group.y);
          
          return (
            <div
              key={`group-${group.x}-${group.y}`}
              className="absolute z-10"
              style={{
                left: `${pos.left}px`,
                top: `${pos.top}px`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="relative">
                {group.points.map((point, idx) => {
                  const primaryColor = QUADRANT_COLORS[point.quadrant];
                  const isPointHovered = hovered === point.id;
                  
                  // Card deck offset: each card offset to the right and down
                  const offsetX = idx * CARD_OFFSET_X;
                  const offsetY = idx * CARD_OFFSET_Y;
                  
                  return (
                    <div
                      key={point.id}
                      className="absolute"
                      style={{
                        left: `${offsetX}px`,
                        top: `${offsetY}px`,
                        transform: "translate(-50%, -50%)",
                      }}
                      onMouseEnter={() => setHovered(point.id)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <div
                        className={`${primaryColor} min-w-[48px] px-2 py-1.5 rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-grab active:cursor-grabbing transition-all hover:scale-105 ${dragging === point.id ? 'scale-110' : ''}`}
                        style={{
                          zIndex: 100 + idx,
                        }}
                        onMouseDown={(e) => handleMouseDown(e, point.id)}
                        onClick={(e) => handleClick(e, point)}
                        title={point.name}
                      >
                        <span className="text-xs font-semibold text-white drop-shadow-sm whitespace-nowrap">
                          {point.name}
                        </span>
                      </div>
                      
                      {/* Show count badge for stacked cards when hovered */}
                      {idx === group.points.length - 1 && group.points.length > 1 && isPointHovered && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-slate-800 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg z-[200]">
                          {group.points.length}
                        </div>
                      )}
                      
                      {/* Tooltip - only on top card when hovered */}
                      {idx === group.points.length - 1 && (
                        <div 
                          className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 transition-opacity duration-150 pointer-events-none ${isPointHovered ? "opacity-100" : "opacity-0"}`}
                        >
                          <div className="bg-slate-800 text-white text-xs px-2 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                            <p className="font-semibold">{point.name}</p>
                            <p className="text-slate-300 text-[10px]">x: {point.x}, y: {point.y}</p>
                            {group.points.length > 1 && (
                              <p className="text-slate-400 text-[10px] mt-1">+{group.points.length - 1} más</p>
                            )}
                          </div>
                          <div className="w-2 h-2 bg-slate-800 rotate-45 mx-auto -mt-1" />
                        </div>
                      )}

                      {/* Delete button - only on top card */}
                      {idx === group.points.length - 1 && (
                        <button
                          className={`absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md transition-opacity duration-150 hover:bg-red-600 z-[201] ${isPointHovered ? "opacity-100" : "opacity-0"}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePoint(point.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar elemento</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Nombre del elemento</label>
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ingresa el nuevo nombre"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Instructions */}
      <p className="text-center text-[10px] text-slate-400 mt-2">
        ✨ Arrastra los puntos • {groupedPoints.length !== points.length ? `${points.length - groupedPoints.length} elementos apilados` : 'Sin superposición'}
      </p>
    </div>
  );
};

export default QuadrantChart;