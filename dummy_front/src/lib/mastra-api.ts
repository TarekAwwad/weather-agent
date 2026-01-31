// Mastra API Client for Hiring Agent Integration

const MASTRA_BASE_URL = "http://localhost:4111/api";

export interface MastraAgent {
  id: string;
  name: string;
  description?: string;
  model?: {
    provider: string;
    name: string;
  };
}

export interface MastraMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
}

export interface MastraThread {
  id: string;
  title?: string;
  resourceId: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface GenerateRequest {
  messages: Array<{ role: string; content: string }>;
  threadId?: string;
  resourceId?: string;
  runId?: string;
}

export interface StreamRequest {
  messages: Array<{ role: string; content: string }>;
  threadId?: string;
  resourceId?: string;
  runId?: string;
}

// Get all available agents
export async function getAgents(): Promise<MastraAgent[]> {
  const response = await fetch(`${MASTRA_BASE_URL}/agents`);
  if (!response.ok) {
    throw new Error(`Failed to fetch agents: ${response.statusText}`);
  }
  return response.json();
}

// Get a specific agent by ID
export async function getAgent(agentId: string): Promise<MastraAgent> {
  const response = await fetch(`${MASTRA_BASE_URL}/agents/${agentId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch agent: ${response.statusText}`);
  }
  return response.json();
}

// Generate a response from an agent (non-streaming)
export async function generateResponse(
  agentId: string,
  request: GenerateRequest
): Promise<{ text: string; messages: MastraMessage[] }> {
  const response = await fetch(`${MASTRA_BASE_URL}/agents/${agentId}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate response: ${response.statusText}`);
  }

  return response.json();
}

// Stream a response from an agent
export async function streamResponse(
  agentId: string,
  request: StreamRequest,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    const response = await fetch(`${MASTRA_BASE_URL}/agents/${agentId}/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to stream response: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // Process any remaining buffer before completing
        if (buffer.trim()) {
          try {
            const parsed = JSON.parse(buffer.trim());
            const chunk = parsed.textDelta || parsed.text || parsed.content || "";
            if (chunk) onChunk(chunk);
          } catch {
            // Might be plain text
            if (buffer.trim()) onChunk(buffer.trim());
          }
        }
        onComplete();
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Process SSE events - handle both \n and \r\n line endings
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        if (trimmedLine.startsWith("data: ")) {
          const data = trimmedLine.slice(6);
          if (data === "[DONE]") {
            onComplete();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            // Handle various streaming formats
            // AI SDK format: { textDelta: "..." }
            // OpenAI format: { delta: { content: "..." } }
            // Simple format: { text: "..." } or { content: "..." }
            const chunk =
              parsed.textDelta ||
              parsed.text ||
              parsed.content ||
              parsed.delta?.content ||
              parsed.choices?.[0]?.delta?.content ||
              "";
            if (chunk) {
              onChunk(chunk);
            }
          } catch {
            // If it's not JSON, treat it as plain text
            if (data.trim()) {
              onChunk(data);
            }
          }
        } else if (trimmedLine.startsWith("0:")) {
          // Vercel AI SDK format: 0:"text chunk"
          const data = trimmedLine.slice(2);
          try {
            const text = JSON.parse(data);
            if (typeof text === "string" && text) {
              onChunk(text);
            }
          } catch {
            // Not valid JSON, skip
          }
        } else if (trimmedLine.startsWith("d:") || trimmedLine.startsWith("e:") || trimmedLine.startsWith("f:")) {
          // Other Vercel AI SDK event types (done, error, etc.) - skip
          continue;
        } else {
          // Try to parse as raw JSON (some APIs stream JSON objects directly)
          try {
            const parsed = JSON.parse(trimmedLine);
            const chunk =
              parsed.textDelta ||
              parsed.text ||
              parsed.content ||
              parsed.delta?.content ||
              parsed.choices?.[0]?.delta?.content ||
              "";
            if (chunk) {
              onChunk(chunk);
            }
          } catch {
            // Not JSON, could be plain text stream
            // Only treat as content if it looks like actual text (not event markers)
            if (trimmedLine && !trimmedLine.includes(":") && !trimmedLine.startsWith("{")) {
              onChunk(trimmedLine);
            }
          }
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}

// Thread Management

// Get all threads for a resource
export async function getThreads(
  agentId: string,
  resourceId: string
): Promise<MastraThread[]> {
  const params = new URLSearchParams({
    agentId,
    resourceid: resourceId,
  });
  const response = await fetch(`${MASTRA_BASE_URL}/memory/threads?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch threads: ${response.statusText}`);
  }
  return response.json();
}

// Create a new thread
export async function createThread(
  agentId: string,
  resourceId: string,
  title?: string
): Promise<MastraThread> {
  const params = new URLSearchParams({ agentId });
  const response = await fetch(`${MASTRA_BASE_URL}/memory/threads?${params}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      resourceId,
      title,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create thread: ${response.statusText}`);
  }

  return response.json();
}

// Get messages for a thread
export async function getThreadMessages(
  agentId: string,
  threadId: string,
  limit?: number
): Promise<MastraMessage[]> {
  const params = new URLSearchParams({ agentId });
  if (limit) {
    params.append("limit", String(limit));
  }
  const response = await fetch(
    `${MASTRA_BASE_URL}/memory/threads/${threadId}/messages?${params}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.statusText}`);
  }
  return response.json();
}

// Save messages to a thread
export async function saveMessages(
  agentId: string,
  messages: Array<{
    content: string;
    role: "user" | "assistant";
    threadId: string;
    resourceId: string;
  }>
): Promise<void> {
  const params = new URLSearchParams({ agentId });
  const response = await fetch(`${MASTRA_BASE_URL}/memory/save-messages?${params}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: messages.map((m) => ({
        ...m,
        type: "text",
        createdAt: new Date().toISOString(),
      })),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save messages: ${response.statusText}`);
  }
}

// Delete a thread
export async function deleteThread(
  agentId: string,
  threadId: string
): Promise<void> {
  const params = new URLSearchParams({ agentId });
  const response = await fetch(
    `${MASTRA_BASE_URL}/memory/threads/${threadId}?${params}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to delete thread: ${response.statusText}`);
  }
}

// Get agent evaluations (for audit purposes)
export async function getAgentLiveEvals(agentId: string): Promise<unknown[]> {
  const response = await fetch(`${MASTRA_BASE_URL}/agents/${agentId}/evals/live`);
  if (!response.ok) {
    throw new Error(`Failed to fetch evals: ${response.statusText}`);
  }
  return response.json();
}

// Mastra observability span type
export interface MastraObservabilitySpan {
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

export interface TracesResponse {
  pagination: {
    total: number;
    page: number;
    perPage: number;
    hasMore: boolean;
  };
  spans: MastraObservabilitySpan[];
}

// Get observability traces (for audit purposes)
export async function getTraces(options?: {
  page?: number;
  perPage?: number;
  name?: string;
}): Promise<TracesResponse> {
  const params = new URLSearchParams();
  if (options?.page !== undefined) params.append("page", String(options.page));
  if (options?.perPage !== undefined) params.append("perPage", String(options.perPage));
  if (options?.name) params.append("name", options.name);

  const response = await fetch(`${MASTRA_BASE_URL}/observability/traces?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch traces: ${response.statusText}`);
  }
  return response.json();
}

// Get a specific trace
export async function getTrace(traceId: string): Promise<unknown> {
  const response = await fetch(`${MASTRA_BASE_URL}/observability/traces/${traceId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch trace: ${response.statusText}`);
  }
  return response.json();
}

// Get scores for a trace/span (for audit metrics)
export async function getScores(
  traceId: string,
  spanId: string,
  options?: { page?: number; perPage?: number }
): Promise<unknown[]> {
  const params = new URLSearchParams();
  if (options?.page !== undefined) params.append("page", String(options.page));
  if (options?.perPage !== undefined) params.append("perPage", String(options.perPage));

  const response = await fetch(
    `${MASTRA_BASE_URL}/observability/traces/${traceId}/${spanId}/scores?${params}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch scores: ${response.statusText}`);
  }
  return response.json();
}

// Score traces using a scorer (for auditing)
export async function scoreTraces(
  scorerName: string,
  targets: Array<{ traceId: string; spanId?: string }>
): Promise<{ status: string; message: string; traceCount: number }> {
  const response = await fetch(`${MASTRA_BASE_URL}/observability/traces/score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ scorerName, targets }),
  });

  if (!response.ok) {
    throw new Error(`Failed to score traces: ${response.statusText}`);
  }

  return response.json();
}

// Get all scorers (for audit configuration)
export async function getScorers(): Promise<unknown[]> {
  const response = await fetch(`${MASTRA_BASE_URL}/scores/scorers`);
  if (!response.ok) {
    throw new Error(`Failed to fetch scorers: ${response.statusText}`);
  }
  return response.json();
}
