import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Info,
  Circle,
  Shield,
  ShieldOff,
  Settings,
  MessageSquare,
  Briefcase,
  UserCheck,
  Search,
  ArrowDown,
  RotateCcw,
  ChevronDown,
  AlertTriangle,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { motion, AnimatePresence } from "motion/react";
import { getTraces } from "@/lib/mastra-api";

interface TraceEvent {
  id: string;
  timestamp: Date;
  type: "info" | "success" | "warning" | "error";
  message: string;
  details?: string;
  source: "agent" | "auditor"; // Add source to differentiate between agent and auditor logs
  isImportant?: boolean; // Flag for important events
  traceId?: string; // Mastra trace ID for linking
  spanId?: string; // Mastra span ID
}

// Mastra trace response type - matches actual API response
interface MastraSpan {
  traceId: string;
  spanId: string;
  parentSpanId: string | null;
  name: string;
  scope: string | null;
  spanType: string;
  attributes: Record<string, unknown>;
  metadata: {
    runId: string;
    resourceId: string;
    threadId: string;
  };
  input: Array<{ role: string; content: string }>;
  output: { text: string; files: unknown[] } | null;
  error: string | null;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isEvent: number;
}

interface TracesResponse {
  pagination: {
    total: number;
    page: number;
    perPage: number;
    hasMore: boolean;
  };
  spans: MastraSpan[];
}

const eventTypes = [
  "info",
  "success",
  "warning",
  "error",
] as const;
const eventMessages = [
  "User message received",
  "AI model initialized",
  "Context retrieved from vector database",
  "Response generated successfully",
  "Token usage: 450 tokens",
  "Document uploaded and processed",
  "Embeddings created",
  "Compliance check passed",
  "Audit log updated",
  "Cache hit: 95%",
  "Latency: 245ms",
  "Rate limit check passed",
  "User authentication verified",
  "Session context loaded",
  "Response streaming initiated",
];

interface ToolSectionProps {
  usecaseType: "agent" | "auditor";
  setUsecaseType: (type: "agent" | "auditor") => void;
  demoContext: "customer-support" | "hiring-agent";
  setDemoContext: (
    context: "customer-support" | "hiring-agent",
  ) => void;
}

export function ToolSection({
  usecaseType,
  setUsecaseType,
  demoContext,
  setDemoContext,
}: ToolSectionProps) {
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [isCompliant, setIsCompliant] = useState(true);
  const [showScrollButton, setShowScrollButton] =
    useState(false);
  const [showDemoDropdown, setShowDemoDropdown] =
    useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingContext, setPendingContext] = useState<"customer-support" | "hiring-agent" | null>(null);

  // Mastra integration state
  const [useMastraTraces, setUseMastraTraces] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastFetchedTraceIds, setLastFetchedTraceIds] = useState<Set<string>>(new Set());
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Convert Mastra span to TraceEvent
  const convertMastraSpanToEvent = useCallback((span: MastraSpan): TraceEvent => {
    const hasError = span.error !== null;
    const isComplete = span.endedAt !== null;

    let type: TraceEvent["type"] = "info";
    if (hasError) type = "error";
    else if (isComplete && span.output) type = "success";
    else if (!isComplete) type = "warning"; // Still running

    // Create a meaningful message
    let message = span.name || "Agent run";
    if (span.output?.text) {
      // Truncate output text for display
      const outputPreview = span.output.text.slice(0, 100);
      message = `${span.name}: ${outputPreview}${span.output.text.length > 100 ? "..." : ""}`;
    }

    // Format details with input/output info
    const details: string[] = [];
    if (span.metadata?.runId) details.push(`Run: ${span.metadata.runId.slice(0, 8)}...`);
    if (span.spanType) details.push(`Type: ${span.spanType}`);
    if (span.input?.length) details.push(`Input messages: ${span.input.length}`);
    if (span.output?.text) details.push(`Output: ${span.output.text.length} chars`);
    if (span.error) details.push(`Error: ${span.error}`);

    return {
      id: span.spanId,
      timestamp: new Date(span.startedAt),
      type,
      message,
      details: details.length > 0 ? details.join(" | ") : undefined,
      source: span.name?.toLowerCase().includes("audit") ? "auditor" : "agent",
      isImportant: hasError || !isComplete,
      traceId: span.traceId,
      spanId: span.spanId,
    };
  }, []);

  // Fetch traces from Mastra API
  const fetchMastraTraces = useCallback(async () => {
    try {
      const response = await getTraces({ page: 0, perPage: 50 }) as unknown as TracesResponse;
      const spans = response.spans || [];

      setIsConnected(true);
      setConnectionError(null);

      // Convert spans to events, filtering out already seen ones
      const newEvents: TraceEvent[] = [];

      for (const span of spans) {
        // Use spanId as unique identifier since traceId can be reused
        const uniqueKey = `${span.traceId}-${span.spanId}`;
        if (!lastFetchedTraceIds.has(uniqueKey)) {
          newEvents.push(convertMastraSpanToEvent(span));
        }
      }

      if (newEvents.length > 0) {
        // Update seen IDs
        setLastFetchedTraceIds(prev => {
          const updated = new Set(prev);
          spans.forEach(s => updated.add(`${s.traceId}-${s.spanId}`));
          return updated;
        });

        // Add new events
        setEvents(prev => [...prev, ...newEvents].slice(-100)); // Keep last 100 events
      }
    } catch (error) {
      setIsConnected(false);
      setConnectionError(error instanceof Error ? error.message : "Failed to connect to Mastra API");
      console.error("Failed to fetch Mastra traces:", error);
    }
  }, [lastFetchedTraceIds, convertMastraSpanToEvent]);

  // Handle demo context change with confirmation
  const requestDemoContextChange = (
    context: "customer-support" | "hiring-agent",
  ) => {
    if (context !== demoContext) {
      setPendingContext(context);
      setShowConfirmationModal(true);
      setShowDemoDropdown(false);
    }
  };

  const confirmDemoContextChange = () => {
    if (pendingContext && typeof setDemoContext === "function") {
      setDemoContext(pendingContext);
      setShowConfirmationModal(false);
      setPendingContext(null);
    }
  };

  const cancelDemoContextChange = () => {
    setShowConfirmationModal(false);
    setPendingContext(null);
  };

  // Reset demo context function
  const handleResetDemo = () => {
    setEvents([]);
    setLastFetchedTraceIds(new Set());
    setIsAutoScroll(true);
    setShowScrollButton(false);
  };

  // Toggle between Mastra API and simulated traces
  const toggleTraceSource = () => {
    setUseMastraTraces(prev => !prev);
    setEvents([]); // Clear events when switching
    setLastFetchedTraceIds(new Set());
    setConnectionError(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDemoDropdown(false);
      }
    };

    if (showDemoDropdown) {
      document.addEventListener(
        "mousedown",
        handleClickOutside,
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, [showDemoDropdown]);

  // Fetch Mastra traces or simulate event stream
  useEffect(() => {
    if (useMastraTraces) {
      // Poll Mastra API for traces
      fetchMastraTraces(); // Initial fetch

      const interval = setInterval(() => {
        fetchMastraTraces();
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    } else {
      // Fallback to simulated events
      const interval = setInterval(() => {
        const randomType =
          eventTypes[
            Math.floor(Math.random() * eventTypes.length)
          ];
        const randomMessage =
          eventMessages[
            Math.floor(Math.random() * eventMessages.length)
          ];

        const newEvent: TraceEvent = {
          id: Date.now().toString() + Math.random(),
          timestamp: new Date(),
          type: randomType,
          message: randomMessage,
          details:
            Math.random() > 0.7
              ? "Additional context or metadata"
              : undefined,
          source: usecaseType, // Set the source based on the current usecase type
          isImportant:
            randomType === "error" || randomType === "warning", // Mark as important if it's an error or warning
        };

        setEvents((prev) => [...prev, newEvent]);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [usecaseType, useMastraTraces, fetchMastraTraces]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isAutoScroll && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [events, isAutoScroll]);

  // Handle scroll to detect if user is at bottom
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isNearBottom =
      target.scrollHeight -
        target.scrollTop -
        target.clientHeight <
      100;

    setIsAutoScroll(isNearBottom);
    setShowScrollButton(!isNearBottom);
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
      setIsAutoScroll(true);
      setShowScrollButton(false);
    }
  };

  const getEventStyles = (event: TraceEvent) => {
    const { source, isImportant } = event;

    // Agent colors: Cyan for normal, Purple for important
    if (source === "agent") {
      if (isImportant) {
        return "bg-purple-500/10 hover:bg-purple-500/15 border-purple-500/30";
      }
      return "bg-cyan-500/10 hover:bg-cyan-500/15 border-cyan-500/30";
    }

    // Auditor colors: Slate for normal, green for important
    if (source === "auditor") {
      if (isImportant) {
        return "bg-green-500/10 hover:bg-green-500/15 border-green-500/30";
      }
      return "bg-slate-500/10 hover:bg-slate-500/15 border-slate-500/30";
    }

    return "bg-slate-500/10 hover:bg-slate-500/15 border-slate-500/30";
  };

  const getEventDotColor = (event: TraceEvent) => {
    const { source, isImportant } = event;

    // Agent colors: Cyan for normal, Purple for important
    if (source === "agent") {
      if (isImportant) {
        return "text-purple-400";
      }
      return "text-cyan-400";
    }

    // Auditor colors: Slate for normal, Green for important
    if (source === "auditor") {
      if (isImportant) {
        return "text-green-400";
      }
      return "text-slate-400";
    }

    return "text-slate-400";
  };

  const getEventIcon = (event: TraceEvent) => {
    const { source, isImportant } = event;

    // Agent colors
    if (source === "agent") {
      if (isImportant) {
        return (
          <AlertCircle className="w-4 h-4 text-purple-400" />
        );
      }
      return <CheckCircle className="w-4 h-4 text-cyan-400" />;
    }

    // Auditor colors
    if (source === "auditor") {
      if (isImportant) {
        return (
          <AlertCircle className="w-4 h-4 text-green-400" />
        );
      }
      return <CheckCircle className="w-4 h-4 text-slate-400" />;
    }

    return <Info className="w-4 h-4 text-slate-400" />;
  };

  const isImportant = (type: TraceEvent["type"]) => {
    return type === "error" || type === "warning";
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const counts = {
      info: events.filter((e) => e.type === "info").length,
      success: events.filter((e) => e.type === "success")
        .length,
      warning: events.filter((e) => e.type === "warning")
        .length,
      error: events.filter((e) => e.type === "error").length,
    };
    const avgLatency = Math.floor(150 + Math.random() * 100);
    const throughput =
      Math.floor(
        (events.length /
          ((Date.now() -
            (events[0]?.timestamp.getTime() || Date.now())) /
            60000)) *
          10,
      ) / 10 || 0;

    return { counts, avgLatency, throughput };
  }, [events]);

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100">
      {/* Usecase Configuration Section */}
      <div className="border-b border-slate-800/60">
        <div className="bg-slate-900/40 px-6 py-4 border-b border-slate-800/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center">
                <Settings className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-200">
                  Usecase Configuration
                </h2>
                <p className="text-xs text-slate-500">
                  Control{" "}
                  {usecaseType === "agent"
                    ? "agent"
                    : "auditor"}{" "}
                  AI behavior
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleResetDemo}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all border border-slate-700/60 hover:border-slate-600/60"
              title="Reset Demo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </motion.button>
            {/* Demo Context Dropdown */}
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="bg-slate-900/20 px-6 py-4 border-b border-slate-800/60">
          <div className="flex justify-around">
            <div className="flex justify-center">
              <div className="relative inline-flex items-center gap-1 p-1 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setShowDemoDropdown(!showDemoDropdown)
                  }
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    showDemoDropdown
                      ? "bg-slate-700/20 text-slate-300 shadow-sm"
                      : "text-slate-400 hover:text-slate-300"
                  }`}
                >
                  <Briefcase className="w-10 h-3.5" />
                  {demoContext === "customer-support"
                    ? "Customer Support"
                    : "Hiring Agent"}
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.button>
                <AnimatePresence>
                  {showDemoDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 border border-slate-700/60 rounded-xl shadow-lg z-10"
                      ref={dropdownRef}
                    >
                      <div className="p-2 space-y-1">
                        <button
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            demoContext === "customer-support"
                              ? "bg-cyan-500/20 text-cyan-300 shadow-sm"
                              : "text-slate-400 hover:text-slate-300 hover:bg-slate-700/50"
                          }`}
                          onClick={() =>
                            requestDemoContextChange(
                              "customer-support",
                            )
                          }
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Customer Support
                        </button>
                        <button
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            demoContext === "hiring-agent"
                              ? "bg-amber-500/20 text-amber-300 shadow-sm"
                              : "text-slate-400 hover:text-slate-300 hover:bg-slate-700/50"
                          }`}
                          onClick={() =>
                            requestDemoContextChange(
                              "hiring-agent",
                            )
                          }
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                          Hiring Agent
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setUsecaseType("agent")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  usecaseType === "agent"
                    ? "bg-cyan-500/20 text-cyan-300 shadow-sm"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Agent
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setUsecaseType("auditor")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  usecaseType === "auditor"
                    ? "bg-amber-500/20 text-amber-300 shadow-sm"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                Auditor
              </motion.button>
            </div>
            {/* </div>
        </div>

        <div className="bg-slate-900/20 px-6 py-4">
          <div className="flex justify-center"> */}
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCompliant(false)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  !isCompliant
                    ? "bg-rose-500/20 text-rose-300 shadow-sm"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                <ShieldOff className="w-3.5 h-3.5" />
                Non-Compliant
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCompliant(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isCompliant
                    ? "bg-emerald-500/20 text-emerald-300 shadow-sm"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Compliant Mode
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Trace Monitor Section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="backdrop-blur-xl bg-slate-900/60 border-b border-slate-800/60 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                  usecaseType === "agent"
                    ? "bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/20"
                    : "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20"
                }`}
              >
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-white">
                  Trace Monitor
                </h1>
                <p className="text-xs text-slate-400">
                  {useMastraTraces ? "Mastra Observability API" : "Simulated events"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Mastra API Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTraceSource}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  useMastraTraces
                    ? isConnected
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
                      : "bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25"
                    : "bg-slate-700/50 text-slate-400 border-slate-600/50 hover:bg-slate-700/70"
                }`}
                title={useMastraTraces ? "Using Mastra API - Click to use simulated data" : "Using simulated data - Click to use Mastra API"}
              >
                {useMastraTraces ? (
                  isConnected ? (
                    <Wifi className="w-3.5 h-3.5" />
                  ) : (
                    <WifiOff className="w-3.5 h-3.5" />
                  )
                ) : (
                  <Activity className="w-3.5 h-3.5" />
                )}
                <span>{useMastraTraces ? (isConnected ? "Mastra" : "Connecting...") : "Simulated"}</span>
              </motion.button>
              <Badge
                className={`border-0 hover:bg-opacity-80 transition-colors rounded-full px-3 py-1 font-mono text-xs ${
                  usecaseType === "agent"
                    ? "bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/20"
                    : "bg-amber-500/15 text-amber-300 hover:bg-amber-500/20"
                }`}
              >
                {events.length}
              </Badge>
              <Badge
                className={`border-0 transition-colors rounded-full px-3 py-1 text-xs relative overflow-hidden ${
                  isAutoScroll
                    ? usecaseType === "agent"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-emerald-500/15 text-emerald-300"
                    : "bg-slate-700/50 text-slate-400"
                }`}
              >
                {isAutoScroll && (
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "linear",
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  />
                )}
                <Circle
                  className={`w-2 h-2 mr-1.5 relative z-10 ${isAutoScroll ? "fill-emerald-400" : "fill-slate-500"}`}
                />
                <span className="relative z-10">Live</span>
              </Badge>
            </div>
          </div>
          {/* Connection Error Banner */}
          <AnimatePresence>
            {useMastraTraces && connectionError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-300 flex-1">{connectionError}</p>
                <button
                  onClick={toggleTraceSource}
                  className="text-xs text-amber-300 hover:text-amber-200 underline"
                >
                  Use simulated
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Event Stream - Fixed height with scrolling */}
        <div className="flex-1 overflow-hidden relative">
          <div
            className="h-full overflow-auto"
            ref={scrollContainerRef}
            onScroll={handleScroll}
          >
            <div className="p-6 space-y-3">
              {events.length === 0 ? (
                <div className="flex items-center justify-center h-[calc(100vh-400px)]">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900/50 border border-slate-800/60 flex items-center justify-center mx-auto mb-4">
                      {useMastraTraces ? (
                        isConnected ? (
                          <Wifi className="w-8 h-8 text-slate-700" />
                        ) : (
                          <WifiOff className="w-8 h-8 text-slate-700" />
                        )
                      ) : (
                        <Activity className="w-8 h-8 text-slate-700" />
                      )}
                    </div>
                    <p className="text-sm text-slate-400">
                      {useMastraTraces
                        ? isConnected
                          ? "Waiting for Mastra traces..."
                          : "Connecting to Mastra API..."
                        : "Waiting for events..."}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {useMastraTraces
                        ? "Traces from http://localhost:4111/api/observability/traces"
                        : "Events will appear here in real-time"}
                    </p>
                    {useMastraTraces && !isConnected && (
                      <button
                        onClick={toggleTraceSource}
                        className="mt-4 text-xs text-cyan-400 hover:text-cyan-300 underline"
                      >
                        Switch to simulated events
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {events.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{
                        opacity: 0,
                        x: event.source === "agent" ? -20 : 20,
                        scale: 0.95,
                      }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{
                        opacity: 0,
                        x: event.source === "agent" ? -20 : 20,
                        scale: 0.95,
                      }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${event.source === "agent" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`group relative p-4 rounded-xl border transition-all max-w-[70%] ${getEventStyles(event)} ${
                          isImportant(event.type)
                            ? "shadow-lg"
                            : ""
                        }`}
                      >
                        <div className="flex items-start gap-3 relative">
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 200,
                              damping: 15,
                            }}
                            className={`flex-shrink-0 mt-0.5 relative z-10 ${getEventDotColor(event)}`}
                          >
                            {getEventIcon(event)}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="text-sm font-medium text-slate-100">
                                {event.message}
                              </p>
                              {isImportant(event.type) && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{
                                    scale: [1, 1.2, 1],
                                  }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 1.5,
                                  }}
                                ></motion.div>
                              )}
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-xs font-mono text-slate-500">
                                {event.timestamp.toLocaleTimeString()}
                                .
                                {event.timestamp
                                  .getMilliseconds()
                                  .toString()
                                  .padStart(3, "0")}
                              </span>
                              <Badge
                                className={`border-0 text-xs font-mono rounded-md px-2 py-0.5 ${
                                  event.source === "agent"
                                    ? "bg-cyan-500/20 text-cyan-300"
                                    : "bg-slate-500/20 text-slate-300"
                                }`}
                              >
                                {event.source}
                              </Badge>
                              <Badge className="bg-slate-800/50 text-slate-400 border-0 text-xs font-mono rounded-md px-2 py-0.5">
                                {event.type}
                              </Badge>
                              {event.traceId && (
                                <Badge
                                  className="bg-purple-500/20 text-purple-300 border-0 text-xs font-mono rounded-md px-2 py-0.5"
                                  title={`Trace: ${event.traceId}${event.spanId ? ` | Span: ${event.spanId}` : ""}`}
                                >
                                  {event.traceId.slice(0, 8)}...
                                </Badge>
                              )}
                            </div>
                            {event.details && (
                              <motion.p
                                initial={{
                                  opacity: 0,
                                  height: 0,
                                }}
                                animate={{
                                  opacity: 1,
                                  height: "auto",
                                }}
                                transition={{ delay: 0.2 }}
                                className="text-xs text-slate-400 mt-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800/60 font-mono"
                              >
                                {event.details}
                              </motion.p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              <div ref={scrollRef} />
            </div>
          </div>

          {/* Floating Scroll to Bottom Button */}
          <AnimatePresence>
            {showScrollButton && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={scrollToBottom}
                className={`absolute bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-shadow z-10 ${
                  usecaseType === "agent"
                    ? "bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/30 hover:shadow-cyan-500/50"
                    : "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30 hover:shadow-amber-500/50"
                }`}
              >
                <ArrowDown className="w-5 h-5 text-white" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmationModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelDemoContextChange}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-6 border-b border-slate-700/60">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-100">
                        Switch Use Case?
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        This will reset all current data
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                    <p className="text-sm text-slate-300">
                      Switching from <span className="font-semibold text-white">
                        {demoContext === "customer-support"
                          ? "Customer Support"
                          : "Hiring Agent"}
                      </span> to <span className="font-semibold text-white">
                        {pendingContext === "customer-support"
                          ? "Customer Support"
                          : "Hiring Agent"}
                      </span> will:
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>Reset all messages and conversations</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>Clear uploaded documents</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>Reset form data and selections</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>Clear event stream history</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 p-6 border-t border-slate-700/60 bg-slate-900/50">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={cancelDemoContextChange}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all border border-slate-700/60"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={confirmDemoContextChange}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white transition-all shadow-lg shadow-amber-500/20"
                  >
                    Switch Use Case
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}