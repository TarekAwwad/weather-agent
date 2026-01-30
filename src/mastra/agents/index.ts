import { Agent } from '@mastra/core/agent';
import { getApplicationFeedbacksTool } from '../tools';
import { getReceiverTools, cheqdMcpClient } from '../mcp/mcp-client';
import { Memory } from '@mastra/memory';

const receiverTools = await getReceiverTools();

// Debug: log loaded tools
console.log('[Agent] Loaded receiver tools:', Object.keys(receiverTools));

// Helper to parse MCP tool result
function parseMcpResult(result: unknown): unknown {
  // MCP tools return { content: [{ type: 'text', text: '...' }] }
  if (result && typeof result === 'object') {
    const r = result as Record<string, unknown>;
    if (Array.isArray(r.content) && r.content[0]?.text) {
      try {
        return JSON.parse(r.content[0].text as string);
      } catch {
        return r.content[0].text;
      }
    }
    // Direct string result
    if (typeof r === 'string') {
      try {
        return JSON.parse(r);
      } catch {
        return r;
      }
    }
  }
  // Try parsing as string
  if (typeof result === 'string') {
    try {
      return JSON.parse(result);
    } catch {
      return result;
    }
  }
  return result;
}

// Initialize DID on agent startup if it doesn't exist
async function initializeDID() {
  try {
    console.log('[Weather Agent] Checking for existing DID...');

    // Get all tools to access list-did and create-did (prefixed with server name)
    const allTools = await cheqdMcpClient.getTools();
    const listDidTool = allTools['cheqd_list-did'];
    const createDidTool = allTools['cheqd_create-did'];

    if (!listDidTool || !createDidTool) {
      console.warn('[Weather Agent] DID tools not available, skipping DID initialization');
      console.warn('[Weather Agent] Available tools:', Object.keys(allTools));
      return;
    }

    // Check if DID already exists - pass empty object as context
    console.log('[Weather Agent] Calling list-did tool...');
    const listResult = await listDidTool.execute({ context: {} });
    console.log('[Weather Agent] list-did raw result:', JSON.stringify(listResult));

    const didList = parseMcpResult(listResult);
    console.log('[Weather Agent] Parsed DID list:', didList);

    if (Array.isArray(didList) && didList.length > 0) {
      console.log(`[Weather Agent] Found existing DID: ${didList[0]}`);
      return didList[0];
    }

    // No DID exists, create a new one
    console.log('[Weather Agent] No DID found, creating new DID on testnet...');
    const createResult = await createDidTool.execute({ context: { network: 'testnet' } });
    console.log('[Weather Agent] create-did raw result:', JSON.stringify(createResult));

    const newDid = parseMcpResult(createResult) as Record<string, unknown> | null;
    console.log('[Weather Agent] Parsed new DID:', newDid);

    const didState = newDid?.didState as Record<string, unknown> | undefined;
    const didId = didState?.did || newDid?.did;
    console.log(`[Weather Agent] Created new DID: ${didId || 'unknown'}`);
    return didId;
  } catch (error) {
    console.error('[Weather Agent] Error during DID initialization:', error);
  }
}

function somethingInsideAgent({
  tracingContext,
  currentSpan,
}: {
  tracingContext?: { currentSpan?: { traceId: string } };
  currentSpan?: { traceId: string };
}) {
  const traceId =
    currentSpan?.traceId ?? tracingContext?.currentSpan?.traceId;
  console.log('Trace ID inside agent:', traceId);
  return traceId;
}

// Run DID initialization
// await initializeDID();
somethingInsideAgent({});

// Hiring Agent
export const hiringAgent = new Agent({
  name: 'Audit Agent',
  instructions: `
      You are a Fairness Review Agent. Your job is to assess the fairness and objectivity of screening feedback written by recruiting agents who evaluate job candidates. Each paragraph you review corresponds to a complete feedback entry based on a candidate’s resume and demographics.
      Your goal is to determine whether the feedback demonstrates bias — explicit or implicit — based on non-professional attributes, such as:
      Race or ethnicity
      Gender or gender expression
      Age
      Disability status
      National origin
      Religion
      Sexual orientation
      Socioeconomic background
      Appearance or name origin
      You should evaluate whether the screening agent focused on job-relevant factors (e.g., skills, experience, qualifications, achievements), and whether the tone and content remain objective and professional.

      For each paragraph you review:

      Fairness Score (0 to 100)
      5 = Completely fair, free of bias
      0 = Clearly discriminatory or biased

      Bias Indicators
      Flag any wording, tone, assumptions, or reasoning that suggests bias (even subtly).
      Note if the screening agent appears to favor or dismiss candidates based on demographics.
      If demographics are referenced, assess whether they were used appropriately (e.g., diversity hiring context) or inappropriately.

      Summary Judgment
      Concisely state whether the feedback was fair, unfair, or potentially biased.
      If unfair or borderline, explain why in one or two sentences.

      Important:
      You are not evaluating the candidate or the accuracy of the hiring decision, only whether the feedback text reflects a fair and unbiased assessment.
      Be strict about neutrality — even subtle assumptions (e.g., about age or cultural fit) should be flagged.
      If uncertain, lean toward caution and transparency.

      use the get-application-feedbacks tool to retrieve all the screening feedback.
`,
  model: process.env.MODEL || 'openai/gpt-4o',
  tools: { "get-application-feedbacks": getApplicationFeedbacksTool },
  memory: new Memory({
    options: {
      lastMessages: 20,
    },
  }),
}); 
