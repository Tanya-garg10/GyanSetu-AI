import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Target, ArrowRight, Sparkles, Compass, Play, RotateCcw, Award, Lightbulb } from "lucide-react";

// Define Node and Link Types compatible with D3
export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  hindiLabel: string;
  level: "Basic" | "Intermediate" | "Advanced";
  description: string;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

interface KnowledgeGraphProps {
  currentTopic: string;
  onTopicChange: (topic: string) => void;
  onStartQuiz: (topic: string) => void;
  onAskAI: (topic: string) => void;
  language: "Hindi" | "Hinglish" | "English";
}

const nodesData: GraphNode[] = [
  {
    id: "Water Cycle (जल चक्र)",
    label: "Water Cycle",
    hindiLabel: "जल चक्र",
    level: "Basic",
    description: "This is a **Basic Concept** in environmental science. It explains how water travels through **Evaporation (वाष्पीकरण)**, **Condensation (संघनन)**, and **Precipitation (वर्षा)**. Understanding this helps you see how nature recycling water sustains life on Earth."
  },
  {
    id: "Fractions (भिन्न)",
    label: "Fractions",
    hindiLabel: "भिन्न",
    level: "Basic",
    description: "This is a fundamental **Basic Concept** in mathematics. It covers how a quantity is split into **Numerator (अंश)** and **Denominator (हर)**. It's the absolute foundation for sharing things and understanding proportions!"
  },
  {
    id: "Photosynthesis",
    label: "Photosynthesis",
    hindiLabel: "प्रकाश संश्लेषण",
    level: "Intermediate",
    description: "This **Intermediate Concept** explains how plants use solar energy, carbon dioxide, and water. Leaf structures like **Chlorophyll (क्लोरोफिल)** capture sunlight to produce glucose and **Oxygen (ऑक्सीजन)**, linking water systems directly to organic life."
  },
  {
    id: "Decimals & Percentages",
    label: "Decimals & Percentages",
    hindiLabel: "दशमलव और प्रतिशत",
    level: "Intermediate",
    description: "An important **Intermediate Concept** that bridges basic fraction knowledge to everyday finances. It translates fractions into **Decimals (दशमलव)** and **Percentages (प्रतिशत)**, which you need for calculations in higher science and trade."
  },
  {
    id: "Force and Motion (बल और गति)",
    label: "Force & Motion",
    hindiLabel: "बल और गति",
    level: "Advanced",
    description: "This **Advanced Concept** in physics introduces how forces govern our universe. It details **Newton's Laws of Motion (न्यूटन के नियम)**, velocity, friction, and **Gravitational Pull (गुरुत्वाकर्षण बल)**, explaining how physical masses interact under energy."
  },
  {
    id: "Swarajya & Chhatrapati Shivaji",
    label: "Swarajya & Chhatrapati Shivaji",
    hindiLabel: "स्वराज्य और शिवाजी महाराज",
    level: "Advanced",
    description: "An **Advanced History & Leadership Concept** studying the establishment of self-rule (**Swarajya - स्वराज्य**). It explores revolutionary **Guerilla Warfare (गनिमी कावा)**, strategic hill forts, and progressive administrative policies that built a sovereign state."
  }
];

const linksData: GraphLink[] = [
  { source: "Water Cycle (जल चक्र)", target: "Photosynthesis" },
  { source: "Fractions (भिन्न)", target: "Decimals & Percentages" },
  { source: "Photosynthesis", target: "Force and Motion (बल और गति)" },
  { source: "Decimals & Percentages", target: "Force and Motion (बल और गति)" },
  { source: "Water Cycle (जल चक्र)", target: "Force and Motion (बल और गति)" },
  { source: "Force and Motion (बल और गति)", target: "Swarajya & Chhatrapati Shivaji" }
];

export function KnowledgeGraph({ currentTopic, onTopicChange, onStartQuiz, onAskAI, language }: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode>(
    nodesData.find(n => n.id === currentTopic) || nodesData[0]
  );
  const [dimensions, setDimensions] = useState({ width: 500, height: 350 });

  // Helper to get node colors based on level
  const getNodeStyles = (level: "Basic" | "Intermediate" | "Advanced", isSelected: boolean) => {
    switch (level) {
      case "Basic":
        return {
          fill: "#f0fdf4", // emerald-50
          stroke: isSelected ? "#059669" : "#34d399", // emerald-600 / emerald-400
          text: "#065f46", // emerald-800
          borderClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
          accentColor: "bg-emerald-500",
          indicator: "🟢 Basic"
        };
      case "Intermediate":
        return {
          fill: "#fffbeb", // amber-50
          stroke: isSelected ? "#d97706" : "#fbbf24", // amber-600 / amber-400
          text: "#92400e", // amber-800
          borderClass: "border-amber-200 bg-amber-50 text-amber-800",
          accentColor: "bg-amber-500",
          indicator: "🟡 Intermediate"
        };
      case "Advanced":
        return {
          fill: "#f5f3ff", // violet-50
          stroke: isSelected ? "#7c3aed" : "#a78bfa", // violet-600 / violet-400
          text: "#5b21b6", // violet-800
          borderClass: "border-violet-200 bg-violet-50 text-violet-800",
          accentColor: "bg-violet-500",
          indicator: "🔥 Advanced"
        };
    }
  };

  // Resize observer to keep SVG responsive
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      // Clamp width and calculate appropriate height
      setDimensions({
        width: Math.max(300, width),
        height: 350
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Set selected node if currentTopic changes from outside
  useEffect(() => {
    const matched = nodesData.find(n => n.id === currentTopic);
    if (matched) {
      setSelectedNode(matched);
    }
  }, [currentTopic]);

  // Handle D3 Force Simulation
  useEffect(() => {
    if (!svgRef.current) return;

    const width = dimensions.width;
    const height = dimensions.height;

    // Clear previous SVG content
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Create a local deep copy of data to prevent mutation side-effects in React
    const nodes: GraphNode[] = nodesData.map(d => ({ ...d }));
    const links: GraphLink[] = linksData.map(d => ({
      source: d.source,
      target: d.target
    }));

    // Define Arrow Head Marker
    svg.append("defs")
      .append("marker")
      .attr("id", "arrow-marker")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 32) // Distance from target node center
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#cbd5e1");

    // Container Group for zoom/pan (if needed, but force bounds are kept stable)
    const gContainer = svg.append("g");

    // Link Elements
    const linkElements = gContainer.append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", (d: any) => {
        // Dash array if needed, otherwise solid
        return "none";
      })
      .attr("marker-end", "url(#arrow-marker)");

    // Link labels (e.g. "leads to")
    const linkLabels = gContainer.append("g")
      .selectAll("text")
      .data(links)
      .enter()
      .append("text")
      .attr("font-size", "7px")
      .attr("fill", "#94a3b8")
      .attr("text-anchor", "middle")
      .attr("dy", -4)
      .text("leads to");

    // Node Elements Group
    const nodeElements = gContainer.append("g")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node-group")
      .style("cursor", "pointer");

    // Draw Node Circles
    nodeElements.append("circle")
      .attr("r", 24)
      .attr("fill", (d: any) => getNodeStyles(d.level, d.id === selectedNode.id).fill)
      .attr("stroke", (d: any) => getNodeStyles(d.level, d.id === selectedNode.id).stroke)
      .attr("stroke-width", (d: any) => d.id === selectedNode.id ? 4 : 2)
      .attr("class", "transition-all duration-300 shadow-sm")
      .style("filter", (d: any) => d.id === selectedNode.id ? "drop-shadow(0 0 6px rgba(217, 119, 6, 0.4))" : "none");

    // Draw Node Text Labels (English)
    nodeElements.append("text")
      .attr("text-anchor", "middle")
      .attr("y", -3)
      .attr("font-size", "9px")
      .attr("font-weight", "bold")
      .attr("fill", (d: any) => getNodeStyles(d.level, d.id === selectedNode.id).text)
      .text((d: any) => d.label);

    // Draw Node Text Sub-Labels (Hindi or context)
    nodeElements.append("text")
      .attr("text-anchor", "middle")
      .attr("y", 8)
      .attr("font-size", "7px")
      .attr("fill", "#64748b")
      .text((d: any) => `(${d.hindiLabel})`);

    // Draw Small Crown or Star indicator for current active topic
    nodeElements.each(function(d: any) {
      if (d.id === currentTopic) {
        d3.select(this)
          .append("circle")
          .attr("cx", 16)
          .attr("cy", -16)
          .attr("r", 5)
          .attr("fill", "#d97706")
          .attr("stroke", "#fff")
          .attr("stroke-width", 1);

        d3.select(this)
          .append("text")
          .attr("x", 16)
          .attr("y", -14)
          .attr("text-anchor", "middle")
          .attr("font-size", "6px")
          .attr("fill", "#fff")
          .attr("font-weight", "bold")
          .text("★");
      }
    });

    // Create D3 Force Simulation
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(links)
        .id((d: any) => d.id)
        .distance(125)
      )
      .force("charge", d3.forceManyBody().strength(-350))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40));

    // Drag behavior implementation
    const drag = d3.drag<SVGGElement, GraphNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeElements.call(drag as any);

    // Click handler to select node
    nodeElements.on("click", (event, d) => {
      setSelectedNode(d);
      onTopicChange(d.id);
    });

    // Update positions on tick
    simulation.on("tick", () => {
      linkElements
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      linkLabels
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2);

      nodeElements.attr("transform", (d: any) => {
        // Clamp inside bounds
        const r = 24;
        d.x = Math.max(r, Math.min(width - r, d.x));
        d.y = Math.max(r, Math.min(height - r, d.y));
        return `translate(${d.x},${d.y})`;
      });
    });

    // Stop simulation on unmount
    return () => {
      simulation.stop();
    };
  }, [dimensions, selectedNode.id, currentTopic]);

  // Recenter helper trigger
  const handleRecenter = () => {
    // Re-trigger simulation rendering by toggling dimensions or resetting
    setDimensions(prev => ({ ...prev }));
  };

  // Helper to highlight bold parts with custom bold styling
  const renderFormattedText = (text: string) => {
    return text.split(/(\*\*.*?\*\*)/).map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-extrabold text-amber-950 bg-amber-100/60 px-1 py-0.5 rounded border border-amber-200">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const selectedStyles = getNodeStyles(selectedNode.level, true);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col gap-4" id="knowledge-graph-section">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            <span>Interactive Learning Path (ज्ञान का नक्शा - टॉपिक्स का सफर)</span>
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            D3 Visual Knowledge Graph. See how basic concepts lead to advanced subjects! Click any circle to explore.
          </p>
        </div>
        <button
          onClick={handleRecenter}
          className="text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer self-start sm:self-auto shadow-sm"
          title="Reset & Recenter graph layout"
        >
          <RotateCcw className="w-3 h-3" /> Recenter Map
        </button>
      </div>

      {/* Legend Indicators */}
      <div className="flex flex-wrap gap-4 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Emerald: Basic Level</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Amber: Intermediate Level</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span> Violet: Advanced Level</span>
        <span className="ml-auto flex items-center gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
          <span className="text-[10px]">★</span> Active Goal Topic
        </span>
      </div>

      {/* Main Graph area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Graph Canvas Container */}
        <div 
          ref={containerRef} 
          className="lg:col-span-2 bg-gradient-to-br from-slate-50/50 to-amber-50/10 border border-slate-150 rounded-2xl relative overflow-hidden h-[350px] shadow-inner"
        >
          <svg 
            ref={svgRef} 
            width={dimensions.width} 
            height={dimensions.height} 
            className="w-full h-full overflow-visible"
          />
          <div className="absolute bottom-2 left-2 text-[8px] font-mono text-slate-400 select-none">
            💡 Drag circles to rearrange map layout dynamically
          </div>
        </div>

        {/* Selected Topic Details card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${selectedStyles.borderClass}`}>
                {selectedStyles.indicator}
              </span>
              {selectedNode.id === currentTopic && (
                <span className="text-[9px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                  ★ Active Goal
                </span>
              )}
            </div>

            <div>
              <h5 className="text-sm font-black text-slate-800 tracking-tight leading-snug">
                {selectedNode.label}
              </h5>
              <p className="text-xs font-bold text-slate-500 mt-0.5 italic">
                {selectedNode.hindiLabel} (Hindi version)
              </p>
            </div>

            <div className="text-xs leading-relaxed text-slate-600 bg-white border border-slate-150 p-3.5 rounded-xl shadow-sm space-y-1.5 min-h-[140px] max-h-[180px] overflow-y-auto">
              <span className="font-bold text-[10px] uppercase text-slate-400 tracking-widest block flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Topic Insight:
              </span>
              <p className="text-slate-700 font-medium">
                {renderFormattedText(selectedNode.description)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 border-t border-slate-200/60 pt-3">
            <button
              onClick={() => onStartQuiz(selectedNode.id)}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-95 transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Practice Test (क्विज शुरू करें)</span>
            </button>
            <button
              onClick={() => onAskAI(selectedNode.id)}
              className="w-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-95 transition cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-amber-600" />
              <span>Ask AI Chat (AI से चर्चा करें)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
