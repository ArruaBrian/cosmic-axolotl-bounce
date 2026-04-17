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
  Sparkles,
  RotateCcw,
  Pencil,
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
  planProposal?: PlanProposal;
}

interface PlanProposal {
  type: "full_reset" | "partial_update" | "axis_change" | "bulk_add";
  description: string;
  newPoints?: DataPoint[];
  newAxes?: AxisConfig;
  pointsToRemove?: string[];
}

interface SuggestedItem {
  name: string;
  x: number;
  y: number;
  reasoning: string;
}

type AIMode = "normal" | "plan";

const generateId = () => Math.random().toString(36).substr(2, 9);

const QUADRANT_COLORS = {
  "top-left": "bg-rose-400",
  "top-right": "bg-blue-400",
  "bottom-left": "bg-green-400",
  "bottom-right": "bg-violet-400",
};

const MAX_CONTEXT_MESSAGES = 10;

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
  const [aiMode, setAiMode] = useState<AIMode>("normal");
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "ai",
      content: "¡Hola! Soy tu asistente de clasificación. Puedo ayudarte de dos maneras:\n\n📊 **Modo Normal**: Dime qué elemento quieres agregar y te diré dónde colocarlo en el gráfico.\n\n🗺️ **Modo Plan**: Cuéntame todo tu proyecto (ej: \"quiero comparar carreras por ingresos y satisfacción\") y te propondré un diseño completo del gráfico con todos los elementos. Necesitarás aprobar cada cambio.",
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  const getQuadrant = (x: number, y: number): DataPoint["quadrant"] => {
    const isTop = y >= 5;
    const isRight = x >= 5;
    
    if (isTop && !isRight) return "top-left";
    if (isTop && isRight) return "top-right";
    if (!isTop && !isRight) return "bottom-left";
    return "bottom-right";
  };

  const handleAddPoint = () => {
    if (!newItem.trim()) return;
    
    const id = generateId();
    const x = 5;
    const y = 5;
    const quadrant = getQuadrant(x, y);
    
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
        const quadrant = getQuadrant(x, y);
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

  const buildSystemPrompt = (mode: AIMode) => {
    const quadrantDescriptions = {
      "top-left": `${axes.yTop} pero ${axes.xLeft}`,
      "top-right": `${axes.yTop} y ${axes.xRight}`,
      "bottom-left": `${axes.yBottom} y ${axes.xLeft}`,
      "bottom-right": `${axes.yBottom} pero ${axes.xRight}`,
    };

    const baseContext = `Eres un asistente que ayuda a clasificar elementos en un gráfico de 4 cuadrantes.

El usuario ha configurado su gráfico con los siguientes ejes:
- Eje X: ${axes.xLabel} (0=${axes.xLeft}, 10=${axes.xRight})
- Eje Y: ${axes.yLabel} (0=${axes.yBottom}, 10=${axes.yTop})

El centro del gráfico está en (5,5).

Items existentes en el gráfico: ${points.map(p => `${p.name} (x:${p.x}, y:${p.y})`).join(", ") || "Ninguno"}

Cuadrantes del gráfico:
- Arriba-izquierda (x<5, y>5): ${quadrantDescriptions["top-left"]}
- Arriba-derecha (x>5, y>5): ${quadrantDescriptions["top-right"]}
- Abajo-izquierda (x<5, y<5): ${quadrantDescriptions["bottom-left"]}
- Abajo-derecha (x>5, y<5): ${quadrantDescriptions["bottom-right"]}`;

    if (mode === "normal") {
      return `${baseContext}

MODO NORMAL:
Responde de manera amigable y útil. Si el usuario quiere clasificar algo, sugiere dónde colocarlo basándote en el contexto de sus ejes. Explica tu razonamiento.

Responde SOLO en formato JSON con este esquema:
{
  "response": "tu respuesta en texto plano al usuario",
  "suggestions": [
    {"name": "nombre del item", "x": 0-10, "y": 0-10, "reasoning": "breve explicación"}
  ]
}
Si no hay sugerencias de items, envía un array vacío en "suggestions".
No incluyas ningún otro texto besides el JSON.`;
    } else {
      return `${baseContext}

MODO PLAN (Cambios grandes con aprobación):
El usuario quiere proponer cambios significativos al gráfico. Puedes:
1. Cambiar los nombres de los ejes
2. Agregar muchos elementos de una vez
3. Hacer un reset completo del gráfico
4. Mover/eliminar elementos existentes

Siempre pregunta antes de hacer cambios. Tu respuesta DEBE incluir una propuesta formal.

Responde SOLO en formato JSON con este esquema:
{
  "response": "tu explicación amigable al usuario sobre lo que propones",
  "proposal": {
    "type": "full_reset | partial_update | axis_change | bulk_add",
    "description": "Descripción clara del cambio propuesto",
    "newPoints": [{"name": "nombre", "x": 0-10, "y": 0-10}],
    "newAxes": {"xLabel": "...", "yLabel": "...", "xLeft": "...", "xRight": "...", "yBottom": "...", "yTop": "..."},
    "pointsToRemove": ["nombre1", "nombre2"]
  }
}
Si NO hay propuesta de cambio (el usuario solo pregunta o conversa), pon "proposal": null.
Solo incluye "proposal" si el usuario pide explícitamente crear, cambiar o resetear algo.
No incluyas ningún otro texto besides el JSON.`;
    }
  };

  const getLastMessages = (): ChatMessage[] => {
    const messagesWithoutWelcome = chatMessages.filter(msg => msg.id !== "welcome");
    return messagesWithoutWelcome.slice(-MAX_CONTEXT_MESSAGES);
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
      const lastMessages = getLastMessages();
      
      const conversationHistory = lastMessages.map(msg => ({
        role: msg.role as "user" | "assistant",
        name: msg.role === "user" ? "User" : "MiniMax AI",
        content: msg.content,
      }));

      const response = await fetch("https://api.minimax.io/v1/text/chatcompletion_v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "minimax-m2.7",
          messages: [
            {
              role: "system",
              name: "MiniMax AI",
              content: buildSystemPrompt(aiMode),
            },
            ...conversationHistory,
            {
              role: "user",
              name: "User",
              content: userMessage.content,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MiniMax API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        const aiMessage: ChatMessage = {
          id: generateId(),
          role: "ai",
          content: parsed.response || content,
          suggestedItems: parsed.suggestions || [],
          timestamp: new Date(),
        };

        // If in plan mode and there's a proposal, add it
        if (aiMode === "plan" && parsed.proposal) {
          aiMessage.planProposal = parsed.proposal;
        }
        
        setChatMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("API Error:", error);
      
      const aiMessage: ChatMessage = {
        id: generateId(),
        role: "ai",
        content: `Lo siento, hubo un error al conectar con la API de MiniMax: ${error instanceof Error ? error.message : "Error desconocido"}. Por favor verifica tu API key e intenta de nuevo.`,
        suggestedItems: [],
        timestamp: new Date(),
      };
      
      setChatMessages(prev => [...prev, aiMessage]);
    }

    setIsLoading(false);
  };

  const handleAddSuggestedItem = (item: SuggestedItem) => {
    const x = Math.round(Math.min(10, Math.max(0, item.x)));
    const y = Math.round(Math.min(10, Math.max(0, item.y)));
    const quadrant = getQuadrant(x, y);
    
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

  const handleApproveProposal = (proposal: PlanProposal) => {
    if (proposal.type === "full_reset") {
      // Reset everything
      setPoints([]);
      setAxes({
        xLabel: "Eje X",
        yLabel: "Eje Y",
        xLeft: "Bajo",
        xRight: "Alto",
        yBottom: "Bajo",
        yTop: "Alto",
      });
      showSuccess("Gráfico reseteado");
    }

    if (proposal.newAxes) {
      setAxes(proposal.newAxes);
      showSuccess("Ejes actualizados");
    }

    if (proposal.newPoints && proposal.newPoints.length > 0) {
      const newDataPoints: DataPoint[] = proposal.newPoints.map(p => {
        const x = Math.round(Math.min(10, Math.max(0, p.x)));
        const y = Math.round(Math.min(10, Math.max(0, p.y)));
        return {
          id: generateId(),
          name: p.name,
          x,
          y,
          color: QUADRANT_COLORS[getQuadrant(x, y)],
          quadrant: getQuadrant(x, y),
        };
      });
      setPoints(prev => [...prev, ...newDataPoints]);
      showSuccess(`${newDataPoints.length} elementos agregados`);
    }

    if (proposal.pointsToRemove && proposal.pointsToRemove.length > 0) {
      setPoints(prev => prev.filter(p => !proposal.pointsToRemove!.includes(p.name)));
      showSuccess(`${proposal.pointsToRemove.length} elementos eliminados`);
    }

    // Remove the proposal from the message
    setChatMessages(prev => prev.map(msg => {
      if (msg.role === "ai" && msg.planProposal) {
        return { ...msg, planProposal: undefined };
      }
      return msg;
    }));
  };

  const handleRejectProposal = () => {
    showError("Propuesta rechazada");
    setChatMessages(prev => prev.map(msg => {
      if (msg.role === "ai" && msg.planProposal) {
        return { ...msg, planProposal: undefined };
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
                onRenamePoint={handleRenamePoint}
              />
            </Card>

            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-rose-100 border border-rose-200 rounded-xl p-3 text-center">
                <div className="w-3 h-3 bg-rose-400 rounded-full mx-auto mb-1" />
                <p className="text-xs font-medium text-rose-800">Alto {axes.yLabel}</p>
                <p className="text-xs text-rose-600">Bajo {axes.xLabel}</p>
              </div>
              <div className="bg-blue-100 border border-blue-200 rounded-xl p-3 text-center">
                <div className="w-3 h-3 bg-blue-400 rounded-full mx-auto mb-1" />
                <p className="text-xs font-medium text-blue-800">Alto {axes.yLabel}</p>
                <p className="text-xs text-blue-600">Alto {axes.xLabel}</p>
              </div>
              <div className="bg-green-100 border border-green-200 rounded-xl p-3 text-center">
                <div className="w-3 h-3 bg-green-400 rounded-full mx-auto mb-1" />
                <p className="text-xs font-medium text-green-800">Bajo {axes.yLabel}</p>
                <p className="text-xs text-green-600">Bajo {axes.xLabel}</p>
              </div>
              <div className="bg-violet-100 border border-violet-200 rounded-xl p-3 text-center">
                <div className="w-3 h-3 bg-violet-400 rounded-full mx-auto mb-1" />
                <p className="text-xs font-medium text-violet-800">Bajo {axes.yLabel}</p>
                <p className="text-xs text-violet-600">Alto {axes.xLabel}</p>
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
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Limpiar todo
                  </Button>
                </TabsContent>

                <TabsContent value="ai" className="mt-4">
                  <div className="space-y-4">
                    {/* API Key Input */}
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

                    {/* AI Mode Toggle */}
                    <div className="flex gap-2">
                      <Button
                        variant={aiMode === "normal" ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => setAiMode("normal")}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Normal
                      </Button>
                      <Button
                        variant={aiMode === "plan" ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => setAiMode("plan")}
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        Plan
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">
                      {aiMode === "normal" 
                        ? "Agrega elementos de uno en uno" 
                        : "La IA propone cambios y pide aprobación"}
                    </p>

                    {/* Chat Messages */}
                    <ScrollArea className="h-[200px] pr-4">
                      <div className="space-y-4">
                        {chatMessages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] ${msg.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-800"} rounded-2xl px-4 py-3`}>
                              <div className="flex items-start gap-2">
                                {msg.role === "ai" && (
                                  <Brain className="w-4 h-4 mt-0.5 text-indigo-600 flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                  
                                  {/* Suggested Items (Normal Mode) */}
                                  {msg.suggestedItems && msg.suggestedItems.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                      <p className="text-xs font-medium opacity-75">¿Agregar al gráfico?</p>
                                      {msg.suggestedItems.map((item, idx) => (
                                        <div key={idx} className="bg-white/10 rounded-lg p-2">
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm">{item.name}</span>
                                            <Badge variant="outline" className="text-xs ml-2">
                                              ({item.x}, {item.y})
                                            </Badge>
                                          </div>
                                          <p className="text-xs opacity-75 mt-1">{item.reasoning}</p>
                                          <div className="flex gap-2 mt-2">
                                            <Button 
                                              size="sm" 
                                              variant="ghost" 
                                              className="h-7 text-xs flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-700"
                                              onClick={() => handleAddSuggestedItem(item)}
                                            >
                                              <Check className="w-3 h-3 mr-1" />
                                              Agregar
                                            </Button>
                                            <Button 
                                              size="sm" 
                                              variant="ghost" 
                                              className="h-7 text-xs flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-700"
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

                                  {/* Plan Proposal */}
                                  {msg.planProposal && (
                                    <div className="mt-3 space-y-2">
                                      <div className="bg-indigo-100 border border-indigo-200 rounded-lg p-3">
                                        <p className="text-xs font-semibold text-indigo-700 mb-2">📋 Propuesta de cambio</p>
                                        <p className="text-xs text-indigo-600 mb-2">{msg.planProposal.description}</p>
                                        
                                        {msg.planProposal.newAxes && (
                                          <div className="bg-white/50 rounded p-2 mb-2">
                                            <p className="text-[10px] font-medium">Nuevos ejes:</p>
                                            <p className="text-[10px]">X: {msg.planProposal.newAxes.xLabel}</p>
                                            <p className="text-[10px]">Y: {msg.planProposal.newAxes.yLabel}</p>
                                          </div>
                                        )}
                                        
                                        {msg.planProposal.newPoints && msg.planProposal.newPoints.length > 0 && (
                                          <div className="bg-white/50 rounded p-2 mb-2">
                                            <p className="text-[10px] font-medium">Elementos a agregar ({msg.planProposal.newPoints.length}):</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                              {msg.planProposal.newPoints.slice(0, 5).map((p, idx) => (
                                                <Badge key={idx} variant="outline" className="text-[10px]">
                                                  {p.name} ({p.x},{p.y})
                                                </Badge>
                                              ))}
                                              {msg.planProposal.newPoints.length > 5 && (
                                                <Badge variant="outline" className="text-[10px]">
                                                  +{msg.planProposal.newPoints.length - 5} más
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {msg.planProposal.pointsToRemove && msg.planProposal.pointsToRemove.length > 0 && (
                                          <div className="bg-red-50 rounded p-2 mb-2">
                                            <p className="text-[10px] font-medium text-red-600">Elementos a eliminar:</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                              {msg.planProposal.pointsToRemove.map((name, idx) => (
                                                <Badge key={idx} variant="destructive" className="text-[10px]">
                                                  {name}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        <div className="flex gap-2 mt-3">
                                          <Button 
                                            size="sm" 
                                            className="h-8 text-xs flex-1 bg-green-600 hover:bg-green-700"
                                            onClick={() => handleApproveProposal(msg.planProposal!)}
                                          >
                                            <Check className="w-3 h-3 mr-1" />
                                            Aprobar
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            className="h-8 text-xs flex-1"
                                            onClick={handleRejectProposal}
                                          >
                                            <X className="w-3 h-3 mr-1" />
                                            Rechazar
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="bg-slate-100 rounded-2xl px-4 py-3">
                              <div className="flex items-center gap-2 text-slate-500">
                                <Brain className="w-4 h-4 animate-pulse" />
                                <span className="text-sm">Pensando...</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>

                    {/* Chat Input */}
                    <div className="flex gap-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={aiMode === "normal" ? "Escribe un elemento..." : "Describe tu proyecto..."}
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
                  </div>
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