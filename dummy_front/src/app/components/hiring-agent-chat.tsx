import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  ShieldCheck,
  Sparkles,
  Briefcase,
  X,
  CheckCircle2,
  GraduationCap,
  MessageSquare,
  Plus,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { motion, AnimatePresence } from "motion/react";
import { useMastraAgent } from "@/hooks/use-mastra-agent";

interface HiringAgentChatProps {
  usecaseType: "agent" | "auditor";
  agentId?: string; // Mastra agent ID - defaults to "hiringAgent"
}

export function HiringAgentChat({
  usecaseType,
  agentId = "hiringAgent",
}: HiringAgentChatProps) {
  const [inputValue, setInputValue] = useState("");
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showAuditedModal, setShowAuditedModal] = useState(false);
  const [showTrustScoreModal, setShowTrustScoreModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    isStreaming,
    error,
    threadId,
    sendMessage,
    clearMessages,
    loadThread,
    createNewThread,
    threads,
    refreshThreads,
  } = useMastraAgent({
    agentId,
    resourceId: "demo-user",
    useStreaming: true,
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue;
    setInputValue("");
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-cyan-200/30 to-blue-300/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-purple-200/30 to-pink-300/30 rounded-full blur-3xl" />
      </div>

      {/* Main Window Container */}
      <div className="flex-1 min-h-0 flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5 bg-white transform-gpu transition-transform duration-300 hover:shadow-3xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl border-b p-6 shadow-sm relative z-10 bg-white/80 border-slate-200/60"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/30">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  AI Hiring Assistant
                </h1>
                <p className="text-sm text-slate-500">
                  Powered by Mastra Agent
                  {threadId && (
                    <span className="ml-2 text-xs text-cyan-600">
                      Thread: {threadId.slice(0, 8)}...
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Compliance Badges */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAgentModal(true)}
                className="cursor-pointer"
              >
                <Badge className="bg-indigo-50 text-indigo-700 border-0 hover:bg-indigo-100 transition-colors rounded-full px-3 py-1.5 shadow-sm hover:shadow-md">
                  <Bot className="w-3.5 h-3.5 mr-1.5" />
                  AI System
                </Badge>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAuditedModal(true)}
                className="cursor-pointer"
              >
                <Badge className="bg-emerald-50 text-emerald-700 border-0 hover:bg-emerald-100 transition-colors rounded-full px-3 py-1.5 shadow-sm hover:shadow-md">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                  Audited
                </Badge>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTrustScoreModal(true)}
                className="cursor-pointer"
              >
                <Badge className="bg-purple-50 text-purple-700 border-0 hover:bg-purple-100 transition-colors rounded-full px-3 py-1.5 shadow-sm hover:shadow-md">
                  <GraduationCap className="w-3.5 h-3.5 mr-1.5" />
                  Trust Score: 8/10
                </Badge>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 flex overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
          {/* Thread Sidebar */}
          <div className="w-64 border-r border-slate-200/60 bg-slate-50/50 backdrop-blur-xl flex-shrink-0 flex flex-col">
            <div className="p-4 border-b border-slate-200/60 flex-shrink-0">
              <Button
                onClick={createNewThread}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-3 space-y-2">
                {threads.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No conversations yet
                  </div>
                ) : (
                  threads.map((thread) => (
                    <motion.div
                      key={thread.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => loadThread(thread.id)}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${
                        threadId === thread.id
                          ? "bg-cyan-100 border border-cyan-300"
                          : "bg-white border border-slate-200 hover:border-cyan-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700 truncate">
                          {thread.title || "New Conversation"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(thread.updatedAt).toLocaleDateString()}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
            <div className="p-3 border-t border-slate-200/60 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshThreads}
                className="w-full text-slate-600"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 min-h-0 flex flex-col">
            {/* Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-4 bg-red-50 border-b border-red-200 flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-700 flex-1">{error}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearMessages}
                    className="text-red-600"
                  >
                    Dismiss
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <ScrollArea className="flex-1 min-h-0 px-6 py-8">
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center mx-auto mb-6">
                      <Briefcase className="w-10 h-10 text-cyan-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      Welcome to AI Hiring Assistant
                    </h3>
                    <p className="text-slate-600 max-w-md mx-auto mb-6">
                      I can help you with job applications, interview
                      preparation, resume tips, and career advice.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {[
                        "Help me prepare for an interview",
                        "Review my resume",
                        "What jobs are available?",
                        "Career advice for tech",
                      ].map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setInputValue(suggestion);
                          }}
                          className="rounded-full text-sm"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`flex ${
                          message.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.05 + 0.1 }}
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mr-3 flex-shrink-0 shadow-md"
                          >
                            <Bot className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                        <div
                          className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${
                            message.role === "user"
                              ? "bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-cyan-500/20"
                              : "bg-white border border-slate-200/60"
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                            {isStreaming &&
                              index === messages.length - 1 &&
                              message.role === "assistant" && (
                                <span className="inline-block w-2 h-4 ml-1 bg-cyan-500 animate-pulse" />
                              )}
                          </p>
                          <span
                            className={`text-xs mt-2 block ${
                              message.role === "user"
                                ? "opacity-80"
                                : "text-slate-400"
                            }`}
                          >
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {message.role === "user" && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.05 + 0.1 }}
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center ml-3 flex-shrink-0 shadow-md"
                          >
                            <span className="text-white text-xs font-medium">
                              U
                            </span>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                    {isLoading && !isStreaming && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex justify-start"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mr-3 flex-shrink-0 shadow-md">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="max-w-[75%] rounded-2xl p-4 shadow-sm bg-white border border-slate-200/60">
                          <div className="flex gap-1.5">
                            <motion.div
                              animate={{ y: [0, -8, 0] }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.8,
                                delay: 0,
                              }}
                              className="w-2 h-2 bg-cyan-500 rounded-full"
                            />
                            <motion.div
                              animate={{ y: [0, -8, 0] }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.8,
                                delay: 0.2,
                              }}
                              className="w-2 h-2 bg-cyan-500 rounded-full"
                            />
                            <motion.div
                              animate={{ y: [0, -8, 0] }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.8,
                                delay: 0.4,
                              }}
                              className="w-2 h-2 bg-cyan-500 rounded-full"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-slate-200/60 bg-white/80 backdrop-blur-xl p-6">
              <div className="max-w-3xl mx-auto">
                <div className="flex gap-3 items-end">
                  <div className="flex-1 relative">
                    <Textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about jobs, interview tips, resume help..."
                      className="resize-none rounded-2xl border-slate-200 focus:border-cyan-300 focus:ring-cyan-200 bg-white shadow-sm pr-14 min-h-[56px]"
                      rows={1}
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      size="icon"
                      className="absolute right-2 bottom-2 rounded-xl h-10 w-10 bg-gradient-to-br from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {showAgentModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAgentModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
              <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
                >
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-white relative">
                    <button
                      onClick={() => setShowAgentModal(false)}
                      className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center backdrop-blur-sm"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Bot className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold">
                          Mastra Agent Identity
                        </h2>
                        <p className="text-indigo-100 mt-1">
                          AI System Information
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="space-y-4">
                      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60">
                        <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          Agent Configuration
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Agent ID:</span>
                            <span className="font-mono text-slate-900">
                              {agentId}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">API Endpoint:</span>
                            <span className="font-medium text-slate-900">
                              localhost:4111
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Protocol:</span>
                            <span className="font-medium text-slate-900">
                              Mastra REST API
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60">
                        <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          Capabilities
                        </h3>
                        <ul className="space-y-2 text-sm text-slate-700">
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-600 mt-0.5">•</span>
                            Streaming responses for real-time interaction
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-600 mt-0.5">•</span>
                            Conversation memory with thread management
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-600 mt-0.5">•</span>
                            Observability traces for audit
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-600 mt-0.5">•</span>
                            Tool execution support
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60">
                      <Button
                        onClick={() => setShowAgentModal(false)}
                        className="rounded-2xl px-6 bg-gradient-to-br from-indigo-600 to-purple-500 hover:from-indigo-700 hover:to-purple-600"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAuditedModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAuditedModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
              <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
                >
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-white relative">
                    <button
                      onClick={() => setShowAuditedModal(false)}
                      className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center backdrop-blur-sm"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <ShieldCheck className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold">Audit Status</h2>
                        <p className="text-emerald-100 mt-1">
                          Mastra Observability
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="space-y-4">
                      <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200/60">
                        <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Audit Features
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Tracing:</span>
                            <Badge className="bg-emerald-100 text-emerald-700 border-0">
                              Enabled
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Endpoint:</span>
                            <span className="font-mono text-slate-900 text-xs">
                              /api/observability/traces
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Scoring:</span>
                            <Badge className="bg-emerald-100 text-emerald-700 border-0">
                              Available
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60">
                      <Button
                        onClick={() => setShowAuditedModal(false)}
                        className="rounded-2xl px-6 bg-gradient-to-br from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showTrustScoreModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowTrustScoreModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
              <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
                >
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-8 text-white relative">
                    <button
                      onClick={() => setShowTrustScoreModal(false)}
                      className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center backdrop-blur-sm"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <GraduationCap className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold">
                          Trust Score Breakdown
                        </h2>
                        <p className="text-purple-100 mt-1">
                          Based on Mastra Scoring
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="text-center pb-6 border-b border-slate-200/60">
                      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 mb-4">
                        <span className="text-4xl font-bold text-purple-700">
                          8.0
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        Overall Trust Score
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60">
                        <h3 className="font-semibold text-slate-900 mb-4">
                          Scoring API
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Endpoint:</span>
                            <span className="font-mono text-xs text-slate-900">
                              /api/scores/scorers
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Trace Scoring:</span>
                            <span className="font-mono text-xs text-slate-900">
                              /api/observability/traces/score
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60">
                      <Button
                        onClick={() => setShowTrustScoreModal(false)}
                        className="rounded-2xl px-6 bg-gradient-to-br from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
