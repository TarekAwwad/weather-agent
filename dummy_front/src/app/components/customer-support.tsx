import { useState, useRef, useEffect } from "react";
import {
  Send,
  FileText,
  Bot,
  ShieldCheck,
  Sparkles,
  Paperclip,
  File,
  FileImage,
  FileSpreadsheet,
  GraduationCap,
  X,
  Search,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { Card } from "@/app/components/ui/card";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface UploadedDocument {
  id: string;
  name: string;
  uploadedAt: Date;
  type: "pdf" | "doc" | "image" | "spreadsheet" | "other";
}

export function CustomerSupportContent({ usecaseType }: { usecaseType: "agent" | "auditor" }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your AI customer support assistant. How can I help you today?",
      timestamp: new Date(Date.now() - 120000),
    },
    {
      id: "2",
      role: "user",
      content:
        "I have a question about my recent order #12345. It hasn't arrived yet.",
      timestamp: new Date(Date.now() - 90000),
    },
    {
      id: "3",
      role: "assistant",
      content:
        "I'd be happy to help you track your order #12345. Let me look that up for you right away. Could you please provide your email address associated with the order?",
      timestamp: new Date(Date.now() - 60000),
    },
    {
      id: "4",
      role: "user",
      content: "Sure, it's customer@example.com",
      timestamp: new Date(Date.now() - 30000),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [uploadedDocs, setUploadedDocs] = useState<
    UploadedDocument[]
  >([
    {
      id: "sample1",
      name: "Order_Confirmation_12345.pdf",
      uploadedAt: new Date(Date.now() - 600000),
      type: "pdf",
    },
    {
      id: "sample2",
      name: "Product_Specifications.doc",
      uploadedAt: new Date(Date.now() - 300000),
      type: "doc",
    },
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showAuditedModal, setShowAuditedModal] =
    useState(false);
  const [showTrustScoreModal, setShowTrustScoreModal] =
    useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const getFileIcon = (type: UploadedDocument["type"]) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-5 h-5 text-rose-600" />;
      case "doc":
        return <File className="w-5 h-5 text-blue-600" />;
      case "image":
        return (
          <FileImage className="w-5 h-5 text-purple-600" />
        );
      case "spreadsheet":
        return (
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
        );
      default:
        return <FileText className="w-5 h-5 text-slate-600" />;
    }
  };

  const getFileTypeFromName = (
    name: string,
  ): UploadedDocument["type"] => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "pdf";
    if (ext === "doc" || ext === "docx") return "doc";
    if (
      ext === "jpg" ||
      ext === "jpeg" ||
      ext === "png" ||
      ext === "gif"
    )
      return "image";
    if (ext === "xls" || ext === "xlsx" || ext === "csv")
      return "spreadsheet";
    return "other";
  };

  const truncateFileName = (
    name: string,
    maxLength: number = 12,
  ): string => {
    if (name.length <= maxLength) return name;

    const parts = name.split(".");
    const extension = parts.length > 1 ? parts.pop() : "";
    const nameWithoutExt = parts.join(".");

    if (extension) {
      const availableLength = maxLength - extension.length - 1;
      if (availableLength > 0) {
        return (
          nameWithoutExt.substring(0, availableLength) +
          "...." +
          extension
        );
      }
    }

    return name.substring(0, maxLength);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      const responses = [
        "I understand your concern. Let me help you with that. I've found your order and can see it's currently in transit. It should arrive within 2-3 business days.",
        "Thank you for that information. I've verified your account and can confirm everything is in order. Is there anything else I can assist you with?",
        "Great question! Based on the information you've provided, I recommend checking our knowledge base for detailed instructions. I can also walk you through the process step by step if you'd like.",
        "I've successfully processed your request. You should receive a confirmation email shortly. Let me know if you need anything else!",
      ];
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          responses[
            Math.floor(Math.random() * responses.length)
          ],
        timestamp: new Date(),
      };
      setIsTyping(false);
      setMessages((prev) => [...prev, aiMessage]);
    }, 2000);
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const doc: UploadedDocument = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        uploadedAt: new Date(),
        type: getFileTypeFromName(file.name),
      };
      setUploadedDocs((prev) => [...prev, doc]);
    });
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 relative">
      <div className="h-full flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5 bg-white transform-gpu transition-transform duration-300 hover:shadow-3xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`backdrop-blur-xl border-b p-6 shadow-sm relative z-10 ${
            usecaseType === "agent"
              ? "bg-white/80 border-slate-200/60"
              : "bg-amber-50/80 border-amber-200/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                  usecaseType === "agent"
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20"
                    : "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20"
                }`}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-slate-900">
                  {usecaseType === "agent"
                    ? "Customer Support"
                    : "AI Auditor"}
                </h1>
                <p className="text-xs text-slate-500">
                  {usecaseType === "agent"
                    ? "AI-Powered Assistant"
                    : "Agent Audit System"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {usecaseType === "agent" && (
                <>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAgentModal(true)}
                  >
                    <Badge className="bg-indigo-50 text-indigo-700 border-0 hover:bg-indigo-100 transition-colors rounded-full px-3 py-1 shadow-sm hover:shadow-md cursor-pointer">
                      <Bot className="w-3 h-3 mr-1.5" />
                      AI System
                    </Badge>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAuditedModal(true)}
                  >
                    <Badge className="bg-emerald-50 text-emerald-700 border-0 hover:bg-emerald-100 transition-colors rounded-full px-3 py-1 shadow-sm hover:shadow-md cursor-pointer">
                      <ShieldCheck className="w-3 h-3 mr-1.5" />
                      Audited
                    </Badge>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowTrustScoreModal(true)}
                  >
                    <Badge className="bg-emerald-50 text-emerald-700 border-0 hover:bg-emerald-100 transition-colors rounded-full px-3 py-1 shadow-sm hover:shadow-md cursor-pointer">
                      <GraduationCap className="w-3 h-3 mr-1.5" />
                      Trust Score 8/10
                    </Badge>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {usecaseType === "agent" ? (
          <div className="flex-1 flex overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <div className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 px-6 py-8">
                <div className="max-w-3xl mx-auto space-y-6">
                  <AnimatePresence mode="popLayout">
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{
                          opacity: 0,
                          y: 20,
                          scale: 0.95,
                        }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.1,
                        }}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {message.role === "assistant" && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              delay: index * 0.1 + 0.1,
                            }}
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3 flex-shrink-0 shadow-md"
                          >
                            <Bot className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                        <div
                          className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${
                            message.role === "user"
                              ? "bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-indigo-500/20"
                              : "bg-white border border-slate-200/60"
                          }`}
                        >
                          <p className="text-sm leading-relaxed">
                            {message.content}
                          </p>
                          <span
                            className={`text-xs mt-2 block ${message.role === "user" ? "opacity-80" : "text-slate-400"}`}
                          >
                            {message.timestamp.toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                        {message.role === "user" && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              delay: index * 0.1 + 0.1,
                            }}
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center ml-3 flex-shrink-0 shadow-md"
                          >
                            <span className="text-white text-xs font-medium">
                              U
                            </span>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex justify-start"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3 flex-shrink-0 shadow-md">
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
                              className="w-2 h-2 bg-indigo-500 rounded-full"
                            />
                            <motion.div
                              animate={{ y: [0, -8, 0] }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.8,
                                delay: 0.2,
                              }}
                              className="w-2 h-2 bg-indigo-500 rounded-full"
                            />
                            <motion.div
                              animate={{ y: [0, -8, 0] }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.8,
                                delay: 0.4,
                              }}
                              className="w-2 h-2 bg-indigo-500 rounded-full"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              <div className="border-t border-slate-200/60 bg-white/80 backdrop-blur-xl p-6">
                <div className="max-w-3xl mx-auto">
                  <div className="flex gap-3 items-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className="rounded-2xl h-12 w-12 hover:bg-slate-100 transition-colors"
                    >
                      <Paperclip className="w-5 h-5 text-slate-600" />
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      multiple
                    />
                    <div className="flex-1 relative">
                      <Textarea
                        value={inputValue}
                        onChange={(e) =>
                          setInputValue(e.target.value)
                        }
                        placeholder="Ask me anything..."
                        className="resize-none rounded-2xl border-slate-200 focus:border-indigo-300 focus:ring-indigo-200 bg-white shadow-sm pr-14 min-h-[56px]"
                        rows={1}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            !e.shiftKey
                          ) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSendMessage}
                        size="icon"
                        className="absolute right-2 bottom-2 rounded-xl h-10 w-10 bg-gradient-to-br from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-lg shadow-indigo-500/30 transition-all"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-72 border-l border-slate-200/60 bg-slate-50/50 backdrop-blur-xl flex-shrink-0">
              <div className="p-6 border-b border-slate-200/60">
                <h2 className="font-semibold text-slate-900">
                  Documents
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {uploadedDocs.length} uploaded
                </p>
              </div>
              <ScrollArea className="h-[calc(100%-80px)]">
                <div className="p-4 space-y-3">
                  {uploadedDocs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-sm text-slate-500">
                        No documents yet
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Upload files to get started
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {uploadedDocs.map((doc, index) => (
                        <motion.div
                          key={doc.id}
                          initial={{
                            opacity: 0,
                            x: 20,
                            scale: 0.9,
                          }}
                          animate={{
                            opacity: 1,
                            x: 0,
                            scale: 1,
                          }}
                          exit={{
                            opacity: 0,
                            x: -20,
                            scale: 0.9,
                          }}
                          transition={{
                            duration: 0.3,
                            delay: index * 0.05,
                          }}
                          whileHover={{ scale: 1.02, y: -2 }}
                          className="group p-4 rounded-2xl bg-white border border-slate-200/60 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            <motion.div
                              whileHover={{
                                rotate: 10,
                                scale: 1.1,
                              }}
                              className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors"
                            >
                              {getFileIcon(doc.type)}
                            </motion.div>
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-medium text-slate-900 truncate"
                                title={doc.name}
                              >
                                {truncateFileName(doc.name)}
                              </p>
                              <p className="text-xs text-slate-500 mt-1 truncate">
                                {doc.uploadedAt.toLocaleDateString()}{" "}
                                at{" "}
                                {doc.uploadedAt.toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        ) : (
          <AuditorContent />
        )}
      </div>

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
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
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
                        Agent Identity
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
                        Model Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">
                            Model Name:
                          </span>
                          <span className="font-medium text-slate-900">
                            GPT-4 Turbo
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">
                            Version:
                          </span>
                          <span className="font-medium text-slate-900">
                            1.0.4
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">
                            Provider:
                          </span>
                          <span className="font-medium text-slate-900">
                            OpenAI
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
                          <span className="text-emerald-600 mt-0.5">
                            •
                          </span>
                          Natural language understanding and
                          generation
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-600 mt-0.5">
                            •
                          </span>
                          Context-aware responses
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-600 mt-0.5">
                            •
                          </span>
                          Document analysis and processing
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-600 mt-0.5">
                            •
                          </span>
                          Multi-turn conversation support
                        </li>
                      </ul>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60">
                      <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-purple-600" />
                        Training & Compliance
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">
                            Training Cutoff:
                          </span>
                          <span className="font-medium text-slate-900">
                            April 2024
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">
                            Compliance:
                          </span>
                          <span className="font-medium text-slate-900">
                            GDPR, SOC 2, ISO 27001
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">
                            Audit Status:
                          </span>
                          <Badge className="bg-emerald-50 text-emerald-700 border-0">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        </div>
                      </div>
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
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
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
                      <h2 className="text-2xl font-semibold">
                        Audit Status
                      </h2>
                      <p className="text-emerald-100 mt-1">
                        Compliance & Certification
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200/60">
                      <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Audit Summary
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">
                            Last Audit:
                          </span>
                          <span className="font-medium text-slate-900">
                            January 20, 2026
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">
                            Next Audit:
                          </span>
                          <span className="font-medium text-slate-900">
                            April 20, 2026
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">
                            Auditor:
                          </span>
                          <span className="font-medium text-slate-900">
                            TrustAI Compliance
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">
                            Status:
                          </span>
                          <Badge className="bg-emerald-100 text-emerald-700 border-0">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Certified
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60">
                      <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-purple-600" />
                        Audit History
                      </h3>
                      <div className="space-y-2 text-sm text-slate-700">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">
                            Q4 2025
                          </span>
                          <span className="font-medium text-emerald-700">
                            Passed
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">
                            Q3 2025
                          </span>
                          <span className="font-medium text-emerald-700">
                            Passed
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">
                            Q2 2025
                          </span>
                          <span className="font-medium text-emerald-700">
                            Passed
                          </span>
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
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-8 text-white relative">
                  <button
                    onClick={() =>
                      setShowTrustScoreModal(false)
                    }
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
                        Detailed Performance Metrics
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
                        Performance Metrics
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-600">
                              Accuracy
                            </span>
                            <span className="font-medium text-slate-900">
                              9.2/10
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                              style={{ width: "92%" }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-600">
                              Reliability
                            </span>
                            <span className="font-medium text-slate-900">
                              8.5/10
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                              style={{ width: "85%" }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-600">
                              Fairness
                            </span>
                            <span className="font-medium text-slate-900">
                              7.8/10
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                              style={{ width: "78%" }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-600">
                              Transparency
                            </span>
                            <span className="font-medium text-slate-900">
                              7.2/10
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                              style={{ width: "72%" }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-600">
                              Safety
                            </span>
                            <span className="font-medium text-slate-900">
                              8.8/10
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full"
                              style={{ width: "88%" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60">
                    <Button
                      onClick={() =>
                        setShowTrustScoreModal(false)
                      }
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
  );
}

export function AuditorContent() {
  const [selectedAgent, setSelectedAgent] = useState<{
    id: string;
    name: string;
    agentId: string;
    status: string;
  } | null>({
    id: "1",
    name: "Customer Support Agent",
    agentId: "AGT-7F3E9A1",
    status: "active",
  });
  const [auditGoal, setAuditGoal] = useState("fairness");
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditComplete, setAuditComplete] = useState(false);

  const DUMMY_AGENTS = [
    {
      id: "1",
      name: "Customer Support Agent",
      agentId: "AGT-7F3E9A1",
      status: "active",
    },
    {
      id: "2",
      name: "Sales Assistant",
      agentId: "AGT-2B8C4D5",
      status: "active",
    },
    {
      id: "3",
      name: "Technical Support Bot",
      agentId: "AGT-9E1F6G8",
      status: "active",
    },
    {
      id: "4",
      name: "HR Assistant",
      agentId: "AGT-4H2J7K9",
      status: "active",
    },
    {
      id: "5",
      name: "Billing Support Agent",
      agentId: "AGT-1M3N5P7",
      status: "inactive",
    },
  ];

  const AUDIT_GOALS = [
    { value: "fairness", label: "Fairness Assessment" },
    { value: "compliance-gdpr", label: "Compliance with GDPR" },
    {
      value: "compliance-hipaa",
      label: "Compliance with HIPAA",
    },
    { value: "bias-detection", label: "Bias Detection" },
    { value: "safety", label: "Safety & Ethics" },
    { value: "performance", label: "Performance Review" },
  ];

  const handleAudit = () => {
    if (selectedAgent) {
      setAuditRunning(true);
      setTimeout(() => {
        setAuditRunning(false);
        setAuditComplete(true);
        setTimeout(() => {
          setAuditComplete(false);
        }, 4000);
      }, 3000);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 overflow-auto bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-6xl"
      >
        <AnimatePresence mode="wait">
          {!auditRunning && !auditComplete ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-6"
            >
              <Card className="p-8 rounded-3xl border border-amber-200/60 shadow-xl bg-white/80 backdrop-blur-xl">
                <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-600" />
                  Registered Agents
                </h2>
                <div className="space-y-3">
                  {DUMMY_AGENTS.map((agent, index) => (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedAgent(agent)}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                        selectedAgent?.id === agent.id
                          ? "border-amber-500 bg-amber-50/50 shadow-md"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {agent.name}
                          </p>
                          <p className="text-sm text-slate-500 mt-1 font-mono">
                            {agent.agentId}
                          </p>
                        </div>
                        <Badge
                          className={`${
                            agent.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          } border`}
                        >
                          {agent.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>

              <Card className="p-8 rounded-3xl border border-slate-200/60 shadow-xl bg-white/80 backdrop-blur-xl">
                <h2 className="text-xl font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Search className="w-5 h-5 text-indigo-600" />
                  Audit Configuration
                </h2>
                <p className="text-sm text-slate-500 mb-1">
                  Agent: {selectedAgent?.name}
                </p>

                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">
                      Selected Agent
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">
                          Agent ID:
                        </span>
                        <span className="font-mono text-slate-900">
                          {selectedAgent?.agentId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">
                          Status:
                        </span>
                        <Badge
                          className={`${
                            selectedAgent?.status === "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          } border-0 text-xs`}
                        >
                          {selectedAgent?.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">
                          Last Audited:
                        </span>
                        <span className="text-slate-900">
                          5 days ago
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700 block">
                      Audit Objective
                    </label>
                    <select
                      value={auditGoal}
                      onChange={(e) =>
                        setAuditGoal(e.target.value)
                      }
                      className="w-full h-12 rounded-2xl border-2 border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 bg-white shadow-sm px-4 text-sm font-medium text-slate-900 transition-all"
                    >
                      {AUDIT_GOALS.map((goal) => (
                        <option
                          key={goal.value}
                          value={goal.value}
                        >
                          {goal.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Audit Parameters
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">
                          Sample Size:
                        </span>
                        <span className="font-medium text-slate-900">
                          1,000 interactions
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">
                          Time Period:
                        </span>
                        <span className="font-medium text-slate-900">
                          Last 30 days
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">
                          Confidence Level:
                        </span>
                        <span className="font-medium text-slate-900">
                          95%
                        </span>
                      </div>
                    </div>
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleAudit}
                      disabled={
                        !selectedAgent ||
                        selectedAgent.status === "inactive"
                      }
                      className="w-full h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-base font-medium"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Run Audit
                    </Button>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          ) : auditRunning ? (
            <motion.div
              key="running"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-12 text-center"
            >
              <Card className="p-12 rounded-3xl border border-slate-200/60 shadow-xl bg-white/80 backdrop-blur-xl max-w-md mx-auto">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "linear",
                  }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 mb-6"
                >
                  <Search className="w-10 h-10 text-indigo-600" />
                </motion.div>
                <h3 className="text-2xl font-semibold text-slate-900 mb-2">
                  Audit in Progress
                </h3>
                <p className="text-slate-600">
                  Analyzing {selectedAgent?.name}
                </p>
                <p className="text-sm text-slate-500 mt-4">
                  This may take a few moments...
                </p>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-12 text-center"
            >
              <Card className="p-12 rounded-3xl border border-slate-200/60 shadow-xl bg-white/80 backdrop-blur-xl max-w-md mx-auto">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.2,
                    type: "spring",
                    stiffness: 200,
                  }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6"
                >
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </motion.div>
                <h3 className="text-2xl font-semibold text-slate-900 mb-2">
                  Audit Complete!
                </h3>
                <p className="text-slate-600">
                  {selectedAgent?.name} has been audited
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  Objective:{" "}
                  {
                    AUDIT_GOALS.find(
                      (g) => g.value === auditGoal,
                    )?.label
                  }
                </p>
                <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <p className="text-sm font-medium text-emerald-900">
                    Overall Score: 8.5/10
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Results logged to trace monitor
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
