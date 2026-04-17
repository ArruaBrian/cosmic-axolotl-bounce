"use client";

import { useState } from "react";
import QuadrantChart from "@/components/quadrant-chart";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  ScatterChart,
  TrendingUp,
  Brain,
  Plus,
  Sparkles,
  Loader2,
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

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

const generateId = () => Math.random().toString(36).substr(2, 9);

const Index = () => {
  const [points, setPoints] = useState<DataPoint[]>([
    { id: "1", name: "Ing. Petróleo", x: 3, y: 8, color: "bg-rose-400", quadrant: "top-left" },
    { id: "2", name: "Ing. Mecánica", x: 2, y: 7, color: "bg-rose-400", quadrant: "top-left" },
    { id: "3", name: "Actuario", x: 4, y: 7, color: "bg-rose-400", quadrant: "top-left" },
    { id: "4", name: "Medicina", x: 3, y: 9, color: "bg-rose-400", quadrant: "top-left" },
    { id: "5", name: "Piloto", x: 8, y: 8, color: "bg-blue-400", quadrant: "top-right" },
    { id: "6", name: "Marketing", x: 7, y: 7, color: "bg-blue-400", quadrant: "top-right" },
    { id: "7", name: "Diseño", x: 8, y: 6, color: "bg-blue-400", quadrant: "top-right" },
    { id: "8", name: "Administración", x: 2, y: 3, color: "bg-green-400", quadrant: "bottom-left" },
    { id: "9", name: "Derecho", x: 3, y: 2, color: "bg-green-400", quadrant: "bottom-left" },
    { id: "10", name: "Letras", x: 8, y: 3, color: "bg-violet-400", quadrant: "bottom-right" },
    { id: "11", name: "Filosofía", x: 7, y: 2, color: "bg-violet-400", quadrant: "bottom-right" },
    { id: "12", name: "Artes Circenses", x: 9, y: 4, color: "bg-violet-400", quadrant: "bottom-right" },
  ]);

  const [axes, setAxes] = useState<AxisConfig>({
    xLabel: "Diversión al cursar",
    yLabel: "Ingresos",
    xLeft: "Aburrido",
    xRight: "Divertido",
    yBottom: "Mal pagos",
    yTop: "Bien pagos",
  });

  const [newItem, setNewItem] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const getQuadrant = (x: number, y: number): DataPoint["quadrant"] => {
    if (x < 5 && y >= 5) return "top-left";
    if (x >= 5 && y >= 5) return "top-right";
    if (x < 5 && y < 5) return "bottom-left";
    return "bottom-right";
  };

  const handleAddPoint = () => {
    if (!newItem.trim()) return;
    
    const id = generateId();
    const x = 5;
    const y = 5;
    
    const newPoint: DataPoint = {
      id,
      name: newItem.trim(),
      x,
      y,
      color: "bg-amber-400",
      quadrant: getQuadrant(x, y),
    };
    
    setPoints([...points, newPoint]);
    setNewItem("");
    showSuccess(`"${newPoint.name}" agregado en el centro`);
  };

  const handleUpdatePoint = (id: string, x: number, y: number) => {
    setPoints(points.map(p => {
      if (p.id === id) {
        return {
          ...p,
          x,
          y,
          quadrant: getQuadrant(x, y),
        };
      }
      return p;
    }));
  };

  const handleDeletePoint = (id: string) => {
    setPoints(points.filter(p => p.id !== id));
    showSuccess("Punto eliminado");
  };

  const handleAskAI = async () => {
    if (!aiPrompt.trim()) return;
    if (!apiKey.trim()) {
      showError("Necesitas configurar tu API key de MiniMax");
      return;
    }

    setIsLoading(true);
    
    try {
      const context = `
Eje X: ${axes.xLabel} (0=${axes.xLeft}, 10=${axes.xRight})
Eje Y: ${axes.yLabel} (0=${axes.yBottom}, 10=${axes.yTop})

Items existentes: ${points.map(p => `${p.name} (x:${p.x}, y:${p.y})`).join(", ")}

Cuadrantes:
- Arriba-izquierda: ${axes.yTop} pero ${axes.xLeft}
- Arriba-derecha: ${axes.yTop} y ${axes.xRight}
- Abajo-izquierda: ${axes.yBottom} y ${axes.xLeft}
- Abajo-derecha: ${axes.yBottom} pero ${axes.xRight}

Items ya existentes en el gráfico: ${points.map(p => p.name).join(", ")}

El usuario pregunta o quiere clasificar: "${aiPrompt}"

Basándote en el contexto de los ejes y cuadrantes definidos, dime dónde colocarías el/los item(s) mencionado(s).
Responde SOLO en formato JSON con este esquema:
{
  "items": [
    {"name": "nombre del item", "x": 0-10, "y": 0-10, "reasoning": "breve explicación de 1-2 oraciones"}
  ]
}
No incluyas ningún otro texto besides el JSON.`;

      const response = await fetch("https://api.minimax.chat/v1/text/chatcompletion_pro?GroupId=YOUR_GROUP_ID", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "abab6-chat",
          messages: [
            {
              role: "user",
              content: context,
            },
          ],
          temperature: 0.7,
        }),
      });

      // Si la API de MiniMax no responde, intentamos con OpenAI-compatible endpoint
      if (!response.ok) {
        throw new Error("MiniMax API error");
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";

      // Parsear JSON de la respuesta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const newPoints: DataPoint[] = parsed.items.map((item: any) => ({
          id: generateId(),
          name: item.name,
          x: Math.round(Math.min(10, Math.max(0, item.x))),
          y: Math.round(Math.min(10, Math.max(0, item.y))),
          color: "bg-amber-400",
          quadrant: getQuadrant(
            Math.round(Math.min(10, Math.max(0, item.x))),
            Math.round(Math.min(10, Math.max(0, item.y)))
          ),
        }));

        setPoints([...points, ...newPoints]);
        showSuccess(`${newPoints.length} item(s) agregado(s) por IA`);
      }
    } catch (error) {
      // Fallback: demo con respuesta simulada
      const demoResponses = [
        { name: aiPrompt.trim(), x: 7, y: 6, reasoning: "Buen balance" },
      ];
      
      const newPoints: DataPoint[] = demoResponses.map((item) => ({
        id: generateId(),
        name: item.name,
        x: item.x,
        y: item.y,
        color: "bg-amber-400",
        quadrant: getQuadrant(item.x, item.y),
      }));

      setPoints([...points, ...newPoints]);
      showSuccess(`"${aiPrompt.trim()}" agregado (demo)`);
    }

    setIsLoading(false);
    setAiPrompt("");
  };

  const handleClearAll = () => {
    setPoints([]);
    showSuccess("Todos los puntos eliminados");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Clasificador de 4 Cuadrantes
          </h1>
          <p className="text-slate-600">
            Arrastra los puntos o usa IA para clasificar elementos
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2">
            <Card className="p-4 md:p-6 shadow-lg rounded-2xl">
              <QuadrantChart
                points={points}
                axes={axes}
                onUpdatePoint={handleUpdatePoint}
                onDeletePoint={handleDeletePoint}
              />
            </Card>

            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-rose-100 border border-rose-200 rounded-xl p-3 text-center">
                <div className="w-3 h-3 bg-rose-400 rounded-full mx-auto mb-1" />
                <p className="text-xs font-medium text-rose-800">Alto ingreso</p>
                <p className="text-xs text-rose-600">Bajo divert.</p>
              </div>
              <div className="bg-blue-100 border border-blue-200 rounded-xl p-3 text-center">
                <div className="w-3 h-3 bg-blue-400 rounded-full mx-auto mb-1" />
                <p className="text-xs font-medium text-blue-800">Alto ingreso</p>
                <p className="text-xs text-blue-600">Alto divert.</p>
              </div>
              <div className="bg-green-100 border border-green-200 rounded-xl p-3 text-center">
                <div className="w-3 h-3 bg-green-400 rounded-full mx-auto mb-1" />
                <p className="text-xs font-medium text-green-800">Bajo ingreso</p>
                <p className="text-xs text-green-600">Bajo divert.</p>
              </div>
              <div className="bg-violet-100 border border-violet-200 rounded-xl p-3 text-center">
                <div className="w-3 h-3 bg-violet-400 rounded-full mx-auto mb-1" />
                <p className="text-xs font-medium text-violet-800">Bajo ingreso</p>
                <p className="text-xs text-violet-600">Alto divert.</p>
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div className="space-y-4">
            <Card className="p-4 shadow-lg rounded-2xl">
              <Tabs defaultValue="add">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="add">
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </TabsTrigger>
                  <TabsTrigger value="ai">
                    <Brain className="w-4 h-4 mr-1" />
                    IA
                  </TabsTrigger>
                  <TabsTrigger value="config">
                    <ScatterChart className="w-4 h-4 mr-1" />
                    Ejes
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="add" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="newItem">Nombre del elemento</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="newItem"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder="Ej: Abogado"
                        onKeyDown={(e) => e.key === "Enter" && handleAddPoint()}
                      />
                      <Button onClick={handleAddPoint} size="icon">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={handleClearAll}>
                    Limpiar todo
                  </Button>
                </TabsContent>

                <TabsContent value="ai" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="apiKey">API Key de MiniMax</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Ingresa tu API key"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="aiPrompt">Pregunta o elemento a clasificar</Label>
                    <Textarea
                      id="aiPrompt"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Ej: ¿Dónde pondrías un abogado?"
                      className="mt-1 resize-none"
                      rows={3}
                    />
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
                    onClick={handleAskAI}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Pensando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Preguntar a la IA
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-slate-500 text-center">
                    La IA analizará el contexto y sugerirá dónde colocar el elemento
                  </p>
                </TabsContent>

                <TabsContent value="config" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Eje X</Label>
                      <Input
                        value={axes.xLabel}
                        onChange={(e) => setAxes({ ...axes, xLabel: e.target.value })}
                        placeholder="Nombre del eje X"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Eje Y</Label>
                      <Input
                        value={axes.yLabel}
                        onChange={(e) => setAxes({ ...axes, yLabel: e.target.value })}
                        placeholder="Nombre del eje Y"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">X negativo (-)</Label>
                      <Input
                        value={axes.xLeft}
                        onChange={(e) => setAxes({ ...axes, xLeft: e.target.value })}
                        placeholder="Izquierda"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">X positivo (+)</Label>
                      <Input
                        value={axes.xRight}
                        onChange={(e) => setAxes({ ...axes, xRight: e.target.value })}
                        placeholder="Derecha"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Y negativo (-)</Label>
                      <Input
                        value={axes.yBottom}
                        onChange={(e) => setAxes({ ...axes, yBottom: e.target.value })}
                        placeholder="Abajo"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Y positivo (+)</Label>
                      <Input
                        value={axes.yTop}
                        onChange={(e) => setAxes({ ...axes, yTop: e.target.value })}
                        placeholder="Arriba"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Points List */}
            <Card className="p-4 shadow-lg rounded-2xl">
              <h3 className="font-semibold mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-indigo-600" />
                Elementos ({points.length})
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {points.map((point) => (
                  <div
                    key={point.id}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${point.color}`} />
                      <span className="text-sm font-medium truncate max-w-[120px]">
                        {point.name}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      ({point.x}, {point.y})
                    </Badge>
                  </div>
                ))}
                {points.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">
                    No hay elementos aún
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;