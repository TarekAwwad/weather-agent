import { useState, useCallback, useRef, useEffect } from "react";
import {
  streamResponse,
  generateResponse,
  getThreads,
  createThread,
  getThreadMessages,
  saveMessages,
  getAgents,
  MastraAgent,
  MastraThread,
  MastraMessage,
} from "@/lib/mastra-api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface UseMastraAgentOptions {
  agentId: string;
  resourceId?: string; // User identifier for thread management
  useStreaming?: boolean;
  enableMemory?: boolean; // Whether to use thread/memory management
}

interface UseMastraAgentReturn {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  threadId: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  loadThread: (threadId: string) => Promise<void>;
  createNewThread: () => Promise<void>;
  agents: MastraAgent[];
  threads: MastraThread[];
  refreshAgents: () => Promise<void>;
  refreshThreads: () => Promise<void>;
  memoryAvailable: boolean;
}

export function useMastraAgent({
  agentId,
  resourceId = "default-user",
  useStreaming = true,
  enableMemory = true,
}: UseMastraAgentOptions): UseMastraAgentReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [agents, setAgents] = useState<MastraAgent[]>([]);
  const [threads, setThreads] = useState<MastraThread[]>([]);
  const [memoryAvailable, setMemoryAvailable] = useState(false);

  const streamingMessageRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load available agents
  const refreshAgents = useCallback(async () => {
    try {
      const agentList = await getAgents();
      setAgents(agentList);
    } catch (err) {
      console.error("Failed to load agents:", err);
    }
  }, []);

  // Load threads for the current user (only if memory is enabled)
  const refreshThreads = useCallback(async () => {
    if (!enableMemory) return;

    try {
      const threadList = await getThreads(agentId, resourceId);
      setThreads(threadList);
      setMemoryAvailable(true);
    } catch (err) {
      console.error("Failed to load threads:", err);
      setMemoryAvailable(false);
      // Memory might not be configured for this agent - that's ok
    }
  }, [agentId, resourceId, enableMemory]);

  // Load agents and threads on mount
  useEffect(() => {
    refreshAgents();
    if (enableMemory) {
      refreshThreads();
    }
  }, [refreshAgents, refreshThreads, enableMemory]);

  // Create a new thread (or just clear messages if memory not available)
  const createNewThread = useCallback(async () => {
    if (!enableMemory || !memoryAvailable) {
      // Just clear messages without creating a thread
      setMessages([]);
      setThreadId(null);
      return;
    }

    try {
      const thread = await createThread(agentId, resourceId, "New Conversation");
      setThreadId(thread.id);
      setMessages([]);
      await refreshThreads();
    } catch (err) {
      // If thread creation fails, just clear messages
      setMessages([]);
      setThreadId(null);
      console.error("Failed to create thread:", err);
    }
  }, [agentId, resourceId, refreshThreads, enableMemory, memoryAvailable]);

  // Load messages from a thread
  const loadThread = useCallback(
    async (loadThreadId: string) => {
      try {
        setIsLoading(true);
        const threadMessages = await getThreadMessages(agentId, loadThreadId);
        setThreadId(loadThreadId);
        setMessages(
          threadMessages.map((msg: MastraMessage) => ({
            id: msg.id || Date.now().toString(),
            role: msg.role as "user" | "assistant",
            content: msg.content,
            timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load thread");
      } finally {
        setIsLoading(false);
      }
    },
    [agentId]
  );

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // Send a message to the agent
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      setError(null);
      setIsLoading(true);

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Prepare messages for API - filter out empty content messages
      const apiMessages = [
        ...messages
          .filter((m) => m.content && m.content.trim()) // Filter out empty messages
          .map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: content.trim() },
      ];

      try {
        // Create thread if not exists (only if memory is available)
        let currentThreadId = threadId;
        if (!currentThreadId && enableMemory && memoryAvailable) {
          try {
            const thread = await createThread(agentId, resourceId, content.slice(0, 50));
            currentThreadId = thread.id;
            setThreadId(currentThreadId);
          } catch (err) {
            // Thread creation failed - continue without thread
            console.warn("Thread creation failed, continuing without memory:", err);
          }
        }

        if (useStreaming) {
          // Streaming response
          setIsStreaming(true);
          streamingMessageRef.current = "";

          // Add placeholder for assistant message
          const assistantMessageId = (Date.now() + 1).toString();
          setMessages((prev) => [
            ...prev,
            {
              id: assistantMessageId,
              role: "assistant",
              content: "",
              timestamp: new Date(),
            },
          ]);

          await streamResponse(
            agentId,
            {
              messages: apiMessages,
              threadId: currentThreadId ?? undefined,
              resourceId,
            },
            // onChunk
            (chunk: string) => {
              streamingMessageRef.current += chunk;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: streamingMessageRef.current }
                    : msg
                )
              );
            },
            // onComplete
            () => {
              setIsStreaming(false);
              setIsLoading(false);

              // If no content was received, remove the empty placeholder message
              if (!streamingMessageRef.current.trim()) {
                setMessages((prev) =>
                  prev.filter((msg) => msg.id !== assistantMessageId)
                );
                return;
              }

              // Save messages to thread (only if memory available and content exists)
              if (currentThreadId && memoryAvailable && streamingMessageRef.current.trim()) {
                saveMessages(agentId, [
                  {
                    content: content.trim(),
                    role: "user",
                    threadId: currentThreadId ?? undefined,
                    resourceId,
                  },
                  {
                    content: streamingMessageRef.current,
                    role: "assistant",
                    threadId: currentThreadId ?? undefined,
                    resourceId,
                  },
                ]).catch(console.error);
              }
            },
            // onError
            (err: Error) => {
              setError(err.message);
              setIsStreaming(false);
              setIsLoading(false);
              // Remove the empty placeholder message on error
              setMessages((prev) =>
                prev.filter((msg) => msg.id !== assistantMessageId)
              );
            }
          );
        } else {
          // Non-streaming response
          const response = await generateResponse(agentId, {
            messages: apiMessages,
            threadId: currentThreadId ?? undefined,
            resourceId,
          });

          // Only add message if there's actual content
          const responseText = response.text || "";
          if (responseText.trim()) {
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: responseText,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);

            // Save messages to thread (only if memory available)
            if (currentThreadId && memoryAvailable) {
              await saveMessages(agentId, [
                {
                  content: content.trim(),
                  role: "user",
                  threadId: currentThreadId ?? undefined,
                  resourceId,
                },
                {
                  content: responseText,
                  role: "assistant",
                  threadId: currentThreadId ?? undefined,
                  resourceId,
                },
              ]);
            }
          }

          setIsLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
        setIsLoading(false);
        setIsStreaming(false);
      }
    },
    [agentId, messages, resourceId, threadId, useStreaming, enableMemory, memoryAvailable]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    messages,
    isLoading,
    isStreaming,
    error,
    threadId,
    sendMessage,
    clearMessages,
    loadThread,
    createNewThread,
    agents,
    threads,
    refreshAgents,
    refreshThreads,
    memoryAvailable,
  };
}
