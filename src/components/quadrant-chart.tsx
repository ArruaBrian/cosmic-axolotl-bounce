"use client";

import { useState, useRef } from "react";
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

const QuadrantChart = ({
  points,
  axes,
  onUpdatePoint,
  onDeletePoint,
}: QuadrantChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const getPointPosition = (x: number, y: number) => {
    const chartWidth = chartRef.current?.clientWidth || 400;
    const chartHeight = chartRef.current?.clientHeight || 400;
    const padding = 40;
    const graphWidth = chartWidth - padding * 2;
    const graphHeight = chartHeight - padding * 2;

    return {
      left: padding + (x / 10) * graphWidth,
      top: padding + ((10 - y) / 10) * graphHeight,
    };
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setDragging(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !chartRef.current) return;

    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padding = 40;
    const graphWidth = rect.width - padding * 2;
    const graphHeight = rect.height - padding * 2;

    const newX = Math.round(Math.min(10, Math.max(0, ((x - padding) / graphWidth) * 10)));
    const newY = Math.round(Math.min(10, Math.max(0, 10 - ((y - padding) / graphHeight) * 10)));

    onUpdatePoint(dragging, newX, newY);
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleDoubleClick = (point: DataPoint) => {
    setEditing(point.id);
    setEditName(point.name);
  };

  const handleNameSubmit = (id: string) => {
    if (editName.trim()) {
      onUpdatePoint(id, points.find(p => p.id === id)!.x, points.find(p => p.id === id)!.y);
    }
    setEditing(null);
    setEditName("");
  };

  const getQuadrantColor = (quadrant: string) => {
    switch (quadrant) {
      case "top-left":
        return "bg-rose-100/80";
      case "top-right":
        return "bg-blue-100/80";
      case "bottom-left":
        return "bg-green-100/80";
      case "bottom-right":
        return "bg-violet-100/80";
      default:
        return "bg-slate-100/80";
    }
  };

  return (
    <div className="relative">
      <div
        ref={chartRef}
        className="relative w-full aspect-square bg-white rounded-xl border border-slate-200 select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid Background */}
        <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
          {Array.from({ length: 100 }).map((_, i) => {
            const col = i % 10;
            const row = Math.floor(i / 10);
            let quadrant = "";
            if (col < 5 && row < 5) quadrant = "bottom-left";
            else if (col >= 5 && row < 5) quadrant = "bottom-right";
            else if (col < 5 && row >= 5) quadrant = "top-left";
            else quadrant = "top-right";

            return (
              <div
                key={i}
                className={`border border-slate-100 ${getQuadrantColor(quadrant)}`}
              />
            );
          })}
        </div>

        {/* Axes */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-medium text-slate-500">
          {axes.xLabel}
        </div>
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs font-medium text-slate-500">
          {axes.yLabel}
        </div>

        {/* Center lines */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-400 opacity-50" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-400 opacity-50" />

        {/* Axis Labels */}
        <div className="absolute top-1/2 left-1 -transform -translate-y-1/2 text-xs text-rose-500 font-medium">
          {axes.xLeft}
        </div>
        <div className="absolute top-1/2 right-1 -translate-y-1/2 text-xs text-blue-500 font-medium">
          {axes.xRight}
        </div>
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-green-500 font-medium">
          {axes.yBottom}
        </div>
        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-xs text-emerald-500 font-medium">
          {axes.yTop}
        </div>

        {/* Quadrant Labels */}
        <div className="absolute top-8 left-8 text-xs text-rose-600 font-semibold opacity-60">
          {axes.yTop} +<br />{axes.xLeft}
        </div>
        <div className="absolute top-8 right-8 text-xs text-blue-600 font-semibold opacity-60 text-right">
          {axes.yTop} +<br />{axes.xRight}
        </div>
        <div className="absolute bottom-8 left-8 text-xs text-green-600 font-semibold opacity-60">
          {axes.yBottom} +<br />{axes.xLeft}
        </div>
        <div className="absolute bottom-8 right-8 text-xs text-violet-600 font-semibold opacity-60 text-right">
          {axes.yBottom} +<br />{axes.xRight}
        </div>

        {/* Data Points */}
        {points.map((point) => {
          const pos = getPointPosition(point.x, point.y);
          return (
            <div
              key={point.id}
              className={`absolute cursor-grab active:cursor-grabbing transition-opacity ${
                dragging === point.id ? "opacity-80 z-50" : "hover:z-40"
              }`}
              style={{
                left: `${pos.left}px`,
                top: `${pos.top}px`,
                transform: "translate(-50%, -50%)",
              }}
              onMouseDown={(e) => handleMouseDown(e, point.id)}
              onDoubleClick={() => handleDoubleClick(point)}
            >
              <div
                className={`${point.color} w-10 h-10 rounded-full flex items-center justify-center shadow-md border-2 border-white hover:scale-110 transition-transform group`}
              >
                <GripVertical className="w-4 h-4 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity" />
                {editing !== point.id && (
                  <span className="text-xs font-semibold text-white px-1 truncate max-w-[32px]">
                    {point.name.substring(0, 2)}
                  </span>
                )}
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  <p className="font-medium">{point.name}</p>
                  <p className="text-slate-300">({point.x}, {point.y})</p>
                </div>
              </div>

              {/* Delete Button */}
              <button
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
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

        {/* Scale markers */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-[40px]">
          {Array.from({ length: 11 }).map((_, i) => (
            <span key={i} className="text-[10px] text-slate-400">
              {i}
            </span>
          ))}
        </div>
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-[40px]">
          {[10, 5, 0].map((i) => (
            <span key={i} className="text-[10px] text-slate-400 absolute left-0" style={{ top: `${(10 - i) * 10}%` }}>
              {i}
            </span>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 mt-2">
        Haz clic y arrastra los puntos para moverlos • Doble clic para editar
      </p>
    </div>
  );
};

export default QuadrantChart;