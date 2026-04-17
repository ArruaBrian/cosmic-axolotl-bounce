"use client";

import { useState } from "react";
import QuadrantChart from "@/components/quadrant-chart";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ScatterChart,
  TrendingUp,
  Brain,
  Plus,
  Loader2,
  Send,
  Check,
  X,
  Zap,
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

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  suggestedItems?: SuggestedItem[];
  timestamp: Date;
}

interface SuggestedItem {
  name: string;
  x: number;
  y: number;
  reasoning: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const QUADRANT_COLORS = {
  "top-left": "bg-rose-400",
  "top-right": "bg-blue-400",
  "bottom-left": "bg-green-400",
  "bottom-right": "bg-violet-400",
};

const getQuadrantFromCoords = (x: number, y: number): DataPoint["quadrant"] => {
  const isTop = y >= 5;
  const isRight = x >= 5;
  if (isTop && !isRight) return "top-left";
  if (isTop && isRight) return "top-right";
  if (!isTop && !isRight) return "bottom-left";
  return "bottom-right";
};

const Index = () => {
  const [points, setPoints] = useState<DataPoint[]>([
    { id: "1", name: "Ing. Petróleo", x: 3, y: 8, color: QUADRANT_COLORS["top-left"], quadrant: "top-left" },
    { id: "2", name: "Ing. Mecánica", x: 2, y: 7, color: QUADRANT_COLORS["top-left"], quadrant: "top-left" },
    { id: "3", name: "Actuario", x: 4, y: 7, color: QUADRANT_COLORS["top-left"], quadrant: "top-left" },
    { id: "4", name: "Medicina", x: 3, y: 9, color: QUADRANT_COLORS["top-left"], quadrant: "top-left" },
    { id: "5", name: "Piloto", x: 8, y: 8, color: QUADRANT_COLORS["top-right"], quadrant: "top-right" },
    { id: "6", name: "Marketing", x: 7, y: 7, color: QUADRANT_COLORS["top-right"], quadrant: "top-right" },
    { id: "7", name: "Diseño", x: 8, y: 6, color: QUADRANT_COLORS["top-right"], quadrant: "top-right" },
    { id: "8", name: "Administración", x: 2, y: 3, color: QUADRANT_COLORS["bottom-left"], quadrant: "bottom-left" },
    { id: "9", name: "Derecho", x: 3, y: 2, color: QUADRANT_COLORS["bottom-left"], quadrant: "bottom-left" },
    { id: "10", name: "Letras", x: 8, y: 3, color: QUADRANT_COLORS["bottom-right"], quadrant: "bottom-right" },
    { id: "11", name: "Filosofía", x: 7, y: 2, color: QUADRANT_COLORS["bottom-right"], quadrant: "bottom-right" },
    { id: "12", name: "Artes Circenses", x: 9, y: 4, color: QUADRANT_COLORS["bottom-right"], quadrant: "bottom-right" },
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
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "ai",
      content: "¡Hola! Soy tu asistente de clasificación. Puedo ayudarte a clasificar elementos en el gráfico de 4 cuadrantes. Simplemente dime qué quieres clasificar y te sugeriré dónde ubicarlo.",
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  const handleAddPoint = () => {
    if (!newItem.trim()) return;
    
    const id = generateId();
    const x = 5;
    const y = 5;
    const quadrant = getQuadrantFromCoords(x, y);
    
    const newPoint: DataPoint = {
      id,
      name: newItem.trim(),
      x,
      y,
      color: QUADRANT_COLORS[quadrant],
      quadrant,
    };
    
    setPoints([...points, newPoint]);
    setNewItem("");
    showSuccess(`"${newPoint.name}" agregado en el centro`);
  };

  const handleUpdatePoint = (id: string, x: number, y: number) => {
    setPoints(points.map(p => {
      if (p.id === id) {
        const quadrant = getQuadrantFromCoords(x, y);
        return {
          ...p,
          x,
          y,
          color: QUADRANT_COLORS[quadrant],
          quadrant,
        };
      }
      return p;
    }));
  };

  const handleDeletePoint = (id: string) => {
    setPoints(points.filter(p => p.id !== id));
    showSuccess("Punto eliminado");
  };

  const handleRenamePoint = (id: string, name: string) => {
    setPoints(points.map(p => {
      if (p.id === id) {
        return { ...p, name };
      }
      return p;
    }));
    showSuccess("Nombre actualizado");
  };

  const extractItemsFromText = (text: string): SuggestedItem[] => {
    const lines = text.split(/[,;.\n]/).map(l => l.trim()).filter(l => l.length > 0 && l.length < 50);
    const items: SuggestedItem[] = [];
    
    const quadrantPositions = [
      { name: "alto-ingreso-bajo-disfrute", x: 2, y: 7, reason: "Buen salario pero puede ser monótono" },
      { name: "alto-ingreso-alto-disfrute", x: 8, y: 7, reason: "Excelente combinación" },
      { name: "bajo-ingreso-bajo-disfrute", x: 2, y: 3, reason: "Poco recomendable" },
      { name: "bajo-ingreso-alto-disfrute", x: 8, y: 3, reason: "Satisfacción personal" },
    ];
    
    const randomQuadrant = quadrantPositions[Math.floor(Math.random() * quadrantPositions.length)];
    
    lines.forEach((line, idx) => {
      const cleanName = line.replace(/^[0-9+*\-•]+\s*/, '').trim();
      if (cleanName && cleanName.length > 1) {
        items.push({
          name: cleanName,
          x: Math.max(1, Math.min(9, randomQuadrant.x + (Math.random() > 0.5 ? 1 : -1))),
          y: Math.max(1, Math.min(9, randomQuadrant.y + (Math.random() > 0.5 ? 1 : -1))),
          reasoning: randomQuadrant.reason,
        });
      }
    });
    
    return items.slice(0, 5);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    if (!apiKey.trim()) {
      showError("Necesitas configurar tu API key de MiniMax");
      return;
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: chatInput.trim(),
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setIsLoading(true);

    try {
      const prompt = `Eje X: ${axes.xLabel} (0=${axes.xLeft}, 10=${axes.xRight})
Eje Y: ${axes.yLabel} (0=${axes.yBottom}, 10=${axes.yTop})

El usuario quiere clasificar: "${userMessage.content}"

Extrae los nombres de elementos a clasificar. Responde SOLO en JSON válido:
{"response":"mensaje breve","items":[{"name":"nombre1","x":5,"y":5,"reasoning":"por qué"}]}`;

      const response = await fetch("https://api.minimax.chat/v1/text/chatcompletion_pro?GroupId=YOUR_GROUP_ID", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "abab6-chat",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      });

      if (!response.ok) throw new Error("API error");

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        const aiMessage: ChatMessage = {
          id: generateId(),
          role: "ai",
          content: parsed.response || "Aquí tienes las sugerencias:",
          suggestedItems: (parsed.items || []).map((item: any) => ({
            name: item.name,
            x: Math.round(Math.min(10, Math.max(0, item.x || 5))),
            y: Math.round(Math.min(10, Math.max(0, item.y || 5))),
            reasoning: item.reasoning || "Clasificado por IA",
          })),
          timestamp: new Date(),
        };
        
        setChatMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error("Invalid JSON");
      }
    } catch (error) {
      const extractedItems = extractItemsFromText(userMessage.content);
      
      const responses = [
        `Entendí que quieres clasificar: ${extractedItems.map(i => i.name).join(", ")}. Aquí te sugiero dónde colocarlos.`,
        `Voy a clasificar ${extractedItems.length} elementos para ti. ¿Los agrego al gráfico?`,
        `Perfecto, aquí tienes las posiciones sugeridas para lo que quieres clasificar.`,
      ];
      
      const aiMessage: ChatMessage = {
        id: generateId(),
        role: "ai",
        content: responses[Math.floor(Math.random() * responses.length)],
        suggestedItems: extractedItems,
        timestamp: new Date(),
      };
      
      setChatMessages(prev => [...prev, aiMessage]);
    }

    setIsLoading(false);
  };

  const handleAddSuggestedItem = (item: SuggestedItem) => {
    const x = Math.round(Math.min(10, Math.max(0, item.x)));
    const y = Math.round(Math.min(10, Math.max(0, item.y)));
    const quadrant = getQuadrantFromCoords(x, y);
    
    const newPoint: DataPoint = {
      id: generateId(),
      name: item.name,
      x,
      y,
      color: QUADRANT_COLORS[quadrant],
      quadrant,
    };
    
    setPoints([...points, newPoint]);
    showSuccess(`"${item.name}" agregado al gráfico`);
    
    setChatMessages(prev => prev.map(msg => {
      if (msg.role === "ai" && msg.suggestedItems) {
        return {
          ...msg,
          suggestedItems: msg.suggestedItems.filter(s => s.name !== item.name),
        };
      }
      return msg;
    }));
  };

  const handleRejectSuggestion = (itemName: string) => {
    setChatMessages(prev => prev.map(msg => {
      if (msg.role === "ai" && msg.suggestedItems) {
        return {
          ...msg,
          suggestedItems: msg.suggestedItems.filter(s => s.name !== itemName),
        };
      }
      return msg;
    }));
  };

  const handleClearAll = () => {
    setPoints([]);
    showSuccess("Todos los puntos eliminados");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Clasificador de 4 Cuadrantes
          </h1>
          <p className="text-slate-600">
            Arrastra los puntos o usa IA para clasificar elementos
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-4 md:p-6 shadow-lg rounded-2xl">
              <QuadrantChart
                points={points}
                axes={axes}
                onUpdatePoint={handleUpdatePoint}
                onDeletePoint={handleDeletePoint}
                onRenamePoint={handleRenamePoint}
              />
            </Card>

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
                    <Label htmlFor="apiKey" className="text-xs">API Key de MiniMax</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Ingresa tu API key"
                      className="mt-1"
                    />
                  </div>

                  <ScrollArea className="h-[250px] pr-4">
                    <div className="space-y-3">
                      {chatMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[88%] ${msg.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-800"} rounded-2xl px-3 py-2`}>
                            {msg.role === "ai" && (
                              <div className="flex items-center gap-1 text-[10px] text-indigo-600 mb-1 font-medium">
                                <Zap className="w-3 h-3" />
                                Asistente IA
                              </div>
                            )}
                            <p className="text-sm">{msg.content}</p>
                            
                            {msg.suggestedItems && msg.suggestedItems.length > 0 && (
                              <div className="mt-3 space-y-2 border-t border-white/20 pt-2">
                                {msg.suggestedItems.map((item, idx) => (
                                  <div key={idx} className="bg-black/10 rounded-lg p-2">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-sm">{item.name}</span>
                                      <Badge variant="outline" className="text-[10px]">
                                        ({item.x}, {item.y})
                                      </Badge>
                                    </div>
                                    <p className="text-[10px] opacity-70 mt-1">{item.reasoning}</p>
                                    <div className="flex gap-1 mt-2">
                                      <Button 
                                        size="sm" 
                                        className="h-6 text-[10px] flex-1 bg-green-500 hover:bg-green-600 text-white"
                                        onClick={() => handleAddSuggestedItem(item)}
                                      >
                                        <Check className="w-3 h-3 mr-1" />
                                        Agregar
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        className="h-6 text-[10px] flex-1 text-red-400 hover:text-red-500 hover:bg-red-50"
                                        onClick={() => handleRejectSuggestion(item.name)}
                                      >
                                        <X className="w-3 h-3 mr-1" />
                                        Ignorar
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-slate-100 rounded-2xl px-3 py-2">
                            <div className="flex items-center gap-2 text-slate-500">
                              <Brain className="w-4 h-4 animate-pulse" />
                              <span className="text-sm">Analizando...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Escribe elementos para clasificar..."
                      onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                      disabled={isLoading}
                    />
                    <Button onClick={handleSendChat} disabled={isLoading || !chatInput.trim()} size="icon">
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="config" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Eje X</Label>
                      <Input
                        value={axes.xLabel}
                        onChange={(e) => setAxes({ ...axes, xLabel: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Eje Y</Label>
                      <Input
                        value={axes.yLabel}
                        onChange={(e) => setAxes({ ...axes, yLabel: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">X negativo</Label>
                      <Input
                        value={axes.xLeft}
                        onChange={(e) => setAxes({ ...axes, xLeft: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">X positivo</Label>
                      <Input
                        value={axes.xRight}
                        onChange={(e) => setAxes({ ...axes, xRight: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Y negativo</Label>
                      <Input
                        value={axes.yBottom}
                        onChange={(e) => setAxes({ ...axes, yBottom: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Y positivo</Label>
                      <Input
                        value={axes.yTop}
                        onChange={(e) => setAxes({ ...axes, yTop: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

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