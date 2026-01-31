import { useState, useRef } from "react";
import {
  Send,
  FileText,
  Bot,
  ShieldCheck,
  Sparkles,
  Briefcase,
  X,
  CheckCircle2,
  GraduationCap,
  Users,
  MapPin,
  DollarSign,
  Clock,
  Building,
  Search,
  UserCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { Card } from "@/app/components/ui/card";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { motion, AnimatePresence } from "motion/react";

interface JobPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string;
  description: string;
}

interface UploadedDocument {
  id: string;
  name: string;
  uploadedAt: Date;
  type: "pdf" | "doc" | "image" | "spreadsheet" | "other";
}

interface HiringAgentProps {
  usecaseType: "agent" | "auditor";
}

export function HiringAgent({ usecaseType }: HiringAgentProps) {
  const [selectedPosition, setSelectedPosition] =
    useState<JobPosition | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    coverLetter: "",
  });
  const [uploadedCV, setUploadedCV] =
    useState<UploadedDocument | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showAuditedModal, setShowAuditedModal] =
    useState(false);
  const [showTrustScoreModal, setShowTrustScoreModal] =
    useState(false);

  const jobPositions: JobPosition[] = [
    {
      id: "1",
      title: "Senior Software Engineer",
      department: "Engineering",
      location: "San Francisco, CA",
      type: "Full-time",
      salary: "$150k - $200k",
      description:
        "We're looking for an experienced software engineer to join our core platform team.",
    },
    {
      id: "2",
      title: "Product Designer",
      department: "Design",
      location: "Remote",
      type: "Full-time",
      salary: "$120k - $160k",
      description:
        "Join our design team to create beautiful and intuitive user experiences.",
    },
    {
      id: "3",
      title: "Marketing Manager",
      department: "Marketing",
      location: "New York, NY",
      type: "Full-time",
      salary: "$100k - $140k",
      description:
        "Lead our marketing initiatives and help us reach new audiences.",
    },
    {
      id: "4",
      title: "Data Scientist",
      department: "Data",
      location: "Austin, TX",
      type: "Full-time",
      salary: "$130k - $180k",
      description:
        "Analyze complex datasets and drive data-informed decision making.",
    },
    {
      id: "5",
      title: "DevOps Engineer",
      department: "Engineering",
      location: "Seattle, WA",
      type: "Full-time",
      salary: "$140k - $190k",
      description:
        "Build and maintain our cloud infrastructure and deployment pipelines.",
    },
  ];

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileType = file.name.toLowerCase().endsWith(".pdf")
        ? "pdf"
        : file.name.toLowerCase().endsWith(".doc") ||
            file.name.toLowerCase().endsWith(".docx")
          ? "doc"
          : "other";

      const newDoc: UploadedDocument = {
        id: Date.now().toString(),
        name: file.name,
        uploadedAt: new Date(),
        type: fileType,
      };
      setUploadedCV(newDoc);
    }
  };

  const startEvaluationWorkflow = async (
    referenceNumber: string,
    resumeText: string
  ) => {
    const MASTRA_BASE_URL = "http://localhost:4111/api";
    const response = await fetch(
      `${MASTRA_BASE_URL}/workflows/evaluationWorkflow/start-async`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputData: {
            input: {
              referenceNumber,
              resume: resumeText,
            },
          },
          runtimeContext: {},
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to start evaluation workflow: ${response.statusText}`);
    }

    return response.json();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPosition && formData.fullName) {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        // Generate a reference number from the position
        const referenceNumber = `${selectedPosition.department.toUpperCase().slice(0, 3)}-${selectedPosition.id}-${Date.now().toString(36).toUpperCase()}`;

        // Use cover letter as resume text, or generate a default application text
        const resumeText = formData.coverLetter.trim()
          || `Application from ${formData.fullName} for ${selectedPosition.title} position.`;

        // Start the evaluation workflow
        await startEvaluationWorkflow(referenceNumber, resumeText);

        setIsSubmitted(true);
        setTimeout(() => {
          setIsSubmitted(false);
          // Reset form after successful submission
          setFormData({
            fullName: "",
            email: "",
            phone: "",
            coverLetter: "",
          });
          setSelectedPosition(null);
        }, 5000);
      } catch (error) {
        console.error("Failed to submit application:", error);
        setSubmitError(
          error instanceof Error ? error.message : "Failed to submit application"
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-cyan-200/30 to-blue-300/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-purple-200/30 to-pink-300/30 rounded-full blur-3xl" />
      </div>

      {/* Main Window Container */}
      <div className="h-full flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5 bg-white transform-gpu transition-transform duration-300 hover:shadow-3xl relative z-10">
        {/* Header */}
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
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                  usecaseType === "agent"
                    ? "bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/30"
                    : "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30"
                }`}
              >
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  {usecaseType === "agent"
                    ? "AI Hiring Assistant"
                    : "Hiring Agent Audit"}
                </h1>
                <p className="text-sm text-slate-500">
                  {usecaseType === "agent"
                    ? "Find your perfect role and apply seamlessly"
                    : "Agent Audit System"}
                </p>
              </div>
            </div>

            {/* Compliance Badges - Only show in Agent mode */}
            {usecaseType === "agent" && (
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
            )}
          </div>
        </motion.div>

        {/* Main Content */}
        {usecaseType === "agent" ? (
          <div className="flex-1 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <div className="h-full p-6">
              <div className="h-full flex gap-6">
                {/* Left Side - Job Positions */}
                <div className="w-2/5">
                  <Card className="h-full backdrop-blur-xl bg-white/80 border-slate-200/60 shadow-xl rounded-3xl overflow-hidden">
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 border-b border-slate-200/60">
                      <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-600" />
                        Open Positions
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        {jobPositions.length} roles available
                      </p>
                    </div>
                    <ScrollArea className="h-[calc(100%-80px)]">
                      <div className="p-4 space-y-3">
                        {jobPositions.map((position) => (
                          <motion.div
                            key={position.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                              setSelectedPosition(position)
                            }
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                              selectedPosition?.id === position.id
                                ? "bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-300 shadow-lg shadow-cyan-500/10"
                                : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-slate-900 text-sm">
                                {position.title}
                              </h3>
                              {selectedPosition?.id ===
                                position.id && (
                                <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                <Building className="w-3 h-3" />
                                {position.department}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                <MapPin className="w-3 h-3" />
                                {position.location}
                              </div>
                              {/* <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                <DollarSign className="w-3 h-3" />
                                {position.salary}
                              </div> */}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  </Card>
                </div>

                {/* Right Side - Application Form */}
                <div className="flex-1">
                  <Card className="h-full backdrop-blur-xl bg-white/80 border-slate-200/60 shadow-xl rounded-3xl overflow-hidden">
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 border-b border-slate-200/60">
                      <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-600" />
                        Application Form
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        {selectedPosition
                          ? `Applying for ${selectedPosition.title}`
                          : "Select a position to apply"}
                      </p>
                    </div>

                    <ScrollArea className="h-[calc(100%-80px)]">
                      <div className="p-6">
                        {!selectedPosition ? (
                          <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                                <Briefcase className="w-8 h-8 text-slate-400" />
                              </div>
                              <p className="text-sm text-slate-600">
                                Please select a position to start
                                your application
                              </p>
                            </div>
                          </div>
                        ) : (
                          <form
                            onSubmit={handleSubmit}
                            className="space-y-5"
                          >
                            {/* Position Details */}
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200/60">
                              <h3 className="font-semibold text-slate-900 mb-2">
                                {selectedPosition.title}
                              </h3>
                              <p className="text-sm text-slate-600 mb-3">
                                {selectedPosition.description}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Badge className="bg-white/60 text-slate-700 border-0 rounded-lg">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {selectedPosition.type}
                                </Badge>
                                <Badge className="bg-white/60 text-slate-700 border-0 rounded-lg">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {selectedPosition.location}
                                </Badge>
                                <Badge className="bg-white/60 text-slate-700 border-0 rounded-lg">
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  {selectedPosition.salary}
                                </Badge>
                              </div>
                            </div>

                            {/* Personal Information */}
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-slate-700 mb-2 block">
                                  Full Name *
                                </label>
                                <Input
                                  name="fullName"
                                  value={formData.fullName}
                                  onChange={handleInputChange}
                                  placeholder="John Doe"
                                  className="rounded-xl border-slate-300 focus:border-cyan-500 focus:ring-cyan-500"
                                  required
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 mb-2 block">
                                  Cover Letter
                                </label>
                                <Textarea
                                  name="coverLetter"
                                  value={formData.coverLetter}
                                  onChange={handleInputChange}
                                  placeholder="Tell us why you're interested in this position..."
                                  className="rounded-xl border-slate-300 focus:border-cyan-500 focus:ring-cyan-500 min-h-[120px]"
                                />
                              </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                              type="submit"
                              disabled={!formData.fullName || isSubmitting}
                              className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white py-6 font-medium shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4 mr-2" />
                                  Submit Application
                                </>
                              )}
                            </Button>

                            {/* Error Message */}
                            <AnimatePresence>
                              {submitError && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 10 }}
                                  className="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/60"
                                >
                                  <div className="flex items-center gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                    <div>
                                      <p className="text-sm font-medium text-red-900">
                                        Submission Failed
                                      </p>
                                      <p className="text-xs text-red-700 mt-0.5">
                                        {submitError}
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Success Message */}
                            <AnimatePresence>
                              {isSubmitted && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 10 }}
                                  className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/60"
                                >
                                  <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    <div>
                                      <p className="text-sm font-medium text-emerald-900">
                                        Application Submitted!
                                      </p>
                                      <p className="text-xs text-emerald-700 mt-0.5">
                                        AI evaluation workflow started. Check the Trace Monitor for progress.
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </form>
                        )}
                      </div>
                    </ScrollArea>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <HiringAuditorContent />
        )}

        {/* Modals - Same as customer support */}
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
                        onClick={() =>
                          setShowAuditedModal(false)
                        }
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
    </div>
  );
}

function HiringAuditorContent() {
  const [selectedAgent, setSelectedAgent] = useState<{
    id: string;
    name: string;
    agentId: string;
    status: string;
  } | null>({
    id: "1",
    name: "Hiring Assistant Agent",
    agentId: "AGT-HR1E9A1",
    status: "active",
  });
  const [auditGoal, setAuditGoal] = useState("fairness");
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditComplete, setAuditComplete] = useState(false);

  const DUMMY_AGENTS = [
    {
      id: "1",
      name: "Hiring Assistant Agent",
      agentId: "AGT-HR1E9A1",
      status: "active",
    },
    {
      id: "2",
      name: "Resume Screener",
      agentId: "AGT-RS2B4D5",
      status: "active",
    },
    {
      id: "3",
      name: "Interview Scheduler",
      agentId: "AGT-IS3F6G8",
      status: "active",
    },
    {
      id: "4",
      name: "Candidate Evaluator",
      agentId: "AGT-CE4H7K9",
      status: "active",
    },
    {
      id: "5",
      name: "Onboarding Assistant",
      agentId: "AGT-OA5M3P7",
      status: "inactive",
    },
  ];

  const AUDIT_GOALS = [
    { value: "fairness", label: "Fairness Assessment" },
    { value: "bias-detection", label: "Bias Detection" },
    { value: "compliance-eeoc", label: "Compliance with EEOC" },
    { value: "compliance-gdpr", label: "Compliance with GDPR" },
    { value: "diversity", label: "Diversity & Inclusion" },
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
                  Registered Hiring Agents
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
                  <Search className="w-5 h-5 text-cyan-600" />
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
                          3 days ago
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
                      className="w-full h-12 rounded-2xl border-2 border-slate-200 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-200 bg-white shadow-sm px-4 text-sm font-medium text-slate-900 transition-all"
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
                          500 applications
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">
                          Time Period:
                        </span>
                        <span className="font-medium text-slate-900">
                          Last 90 days
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
                      className="w-full h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-base font-medium"
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
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cyan-100 mb-6"
                >
                  <Search className="w-10 h-10 text-cyan-600" />
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
                    Overall Score: 8.2/10
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