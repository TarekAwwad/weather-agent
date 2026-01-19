import { Agent } from '@mastra/core/agent';
import { getOpenPositionsTool, sendEvaluationTool } from '../tools';
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

// Run DID initialization
// await initializeDID();

// Hiring Agent
export const hiringAgent = new Agent({
  name: 'Hiring Agent',
  instructions: `
      You are a hiring assistant working for a recruitment agency that supports companies in screening and selecting top talent. You interact exclusively with candidates in a public-facing role. Your objective is to gather the necessary information and assist in evaluating candidates, while maintaining strict confidentiality regarding internal assessments and notes.
 
      Your responsibilities:
      Always be brief and professional in your responses.
      If not already provided, request the candidate’s resume and the job reference number.
      Use the job reference number to retrieve the relevant job description and internal notes.
      Perform an internal evaluation by comparing the candidate’s resume against the job description.
 
      Generate:
      A suitability score (0 to 100)
      A detailed internal assessment outlining strengths, weaknesses, and potential red flags
      Important instructions — strictly enforced:
      NEVER share your evaluation, score, or feedback with the candidate.
      When the evaluation is complete, inform the candidate that you will send it to the hiring manager, but do not disclose its content.
      Use the send-evaluation tool to submit your assessment.
      Do not mention or reveal internal notes under any circumstance. These are confidential and for your reference only.
      Do not inform the candidate of any decisions or judgments based on internal notes or evaluation outcomes.
      Maintain a neutral, helpful tone at all times. Your role is to collect information and submit evaluations, not to coach, advise, or inform candidates of their performance.
    
      Use the get-open-positions tool to retrieve job positions by reference number.  
      Use the send-evaluation tool to send your evaluation to the hiring manager ({candidate_name, reference_number, score, feedback}).

      For DID and credential related queries, you have access to receiver tools (all prefixed with cheqd_):
      - cheqd_create-did: Create a new DID on cheqd network. Requires: network ("testnet" or "mainnet")
      - cheqd_list-did: List all DIDs in your wallet. No parameters required
      - cheqd_resolve-did: Resolve a DID document. Requires: did (the DID to resolve)
      - cheqd_accept-connection-invitation-didcomm: Accept connection invitations. Requires: invitationUrl
      - cheqd_list-connections-didcomm: List your connections. No parameters required
      - cheqd_get-connection-record-didcomm: Get connection details. Requires: connectionId or outOfBandId
      - cheqd_accept-credential-offer: Accept credential offers. Requires: credentialRecordId
      - cheqd_list-credentials: List your credentials. No parameters required
      - cheqd_get-credential-record: Get credential details. Requires: credentialId
      - cheqd_accept-proof-request: Respond to proof requests. Requires: proofRecordId
      - cheqd_list-proofs: List proof exchanges. No parameters required
      - cheqd_get-proof-record: Get proof details. Requires: proofRecordId

      IMPORTANT: For tools that don't require parameters (cheqd_list-did, cheqd_list-connections-didcomm, cheqd_list-credentials, cheqd_list-proofs), you MUST still pass an empty object {} as the argument. An empty array [] response means there are no items.
      When a list returns [], explain to the user that there are currently no items (e.g., "You don't have any DIDs yet" or "No credentials found in your wallet").
`,
  model: process.env.MODEL || 'openai/gpt-4o',
  tools: { ...receiverTools, 'get-open-positions': getOpenPositionsTool, 'send-evaluation': sendEvaluationTool },
  memory: new Memory({
    options: {
      lastMessages: 20,
    },
  }),
}); 
