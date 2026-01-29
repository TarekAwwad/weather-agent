import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

// cheqd Studio API configuration
const STUDIO_API_URL = process.env.STUDIO_API_URL || 'https://studio-api-staging.cheqd.net';
const STUDIO_API_KEY = process.env.STUDIO_API_KEY || '';

// Local DID database file path
const DID_DB_PATH = path.join(process.cwd(), 'did-store.json');

// DID Database types
interface StoredDID {
  did: string;
  network: 'testnet' | 'mainnet';
  didDocument: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface DIDDatabase {
  dids: StoredDID[];
}

// Initialize or load the DID database
function loadDIDDatabase(): DIDDatabase {
  try {
    if (fs.existsSync(DID_DB_PATH)) {
      const data = fs.readFileSync(DID_DB_PATH, 'utf-8');
      return JSON.parse(data) as DIDDatabase;
    }
  } catch (error) {
    console.error('Error loading DID database:', error);
  }
  return { dids: [] };
}

// Save the DID database
function saveDIDDatabase(db: DIDDatabase): void {
  try {
    fs.writeFileSync(DID_DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving DID database:', error);
  }
}

// Get DID by network from database
function getDIDByNetwork(network: 'testnet' | 'mainnet'): StoredDID | undefined {
  const db = loadDIDDatabase();
  return db.dids.find(d => d.network === network);
}

// Store DID in database
function storeDID(did: string, network: 'testnet' | 'mainnet', didDocument: Record<string, unknown>): void {
  const db = loadDIDDatabase();
  const now = new Date().toISOString();

  // Check if DID already exists for this network
  const existingIndex = db.dids.findIndex(d => d.network === network);

  if (existingIndex >= 0) {
    // Update existing
    db.dids[existingIndex] = {
      did,
      network,
      didDocument,
      createdAt: db.dids[existingIndex].createdAt,
      updatedAt: now,
    };
  } else {
    // Add new
    db.dids.push({
      did,
      network,
      didDocument,
      createdAt: now,
      updatedAt: now,
    });
  }

  saveDIDDatabase(db);
}

// Update DID document in database
function updateDIDInDatabase(did: string, didDocument: Record<string, unknown>): void {
  const db = loadDIDDatabase();
  const index = db.dids.findIndex(d => d.did === did);

  if (index >= 0) {
    db.dids[index].didDocument = didDocument;
    db.dids[index].updatedAt = new Date().toISOString();
    saveDIDDatabase(db);
  }
}

// Hiring Agent tools
// get-open-positions tool
export const getOpenPositionsTool = createTool({
  id: 'get-open-positions',
  description: 'Retrieve an open job positions from the company database by reference number',
  inputSchema: z.object({
    referenceNumber: z.string().describe('The reference number of the job position'),
    resume: z.string().describe('The candidate resume text'),
  }),
  outputSchema: z.object({
    jobDescription:
      z.object({
        referenceNumber: z.string().describe('The reference number of the job position'),
        title: z.string().describe('The title of the job position'),
        department: z.string().describe('The department of the job position'),
        location: z.string().describe('The location of the job position'),
        description: z.string().describe('The description of the job position'),
      }),
      resume: z.string().describe('The candidate resume text'),
  }),
  execute: async ({ context }) => {
    return { jobDescription: await getOpenPositions(context.referenceNumber), resume: context.resume  };
  },
});

const getOpenPositions = async (referenceNumber?: string) => {
  const response = await fetch('http://localhost:8000/open-positions/' + (referenceNumber ? referenceNumber : 'REF123'));
  if (!response.ok) {
    throw new Error(`Error fetching open positions: ${response.statusText}`);
  }
  const data = await response.json();
  console.log('Fetched open positions:', data);

  return data;
};

// send evaluation
export const sendEvaluationTool = createTool({
  id: 'send-evaluation',
  description: 'Send the candidate evaluation to the hiring manager',
  inputSchema: z.object({
    referenceNumber: z.string().describe('The job reference number'),
    evaluation: z.object({
      candidateName: z.string().describe('The name of the candidate'),
      score: z.number().describe('Suitability score from 0 to 100'),
      feedback: z.string().describe('Detailed feedback on the candidate\'s fit for the role'),
    }).describe('The candidate evaluation details'),
  }),
  outputSchema: z.object({
    success: z.boolean().describe('Indicates if the evaluation was sent successfully'),
    message: z.string().describe('Additional information about the sending process'),
  }),
  execute: async ({ context }) => {
    return await sendEvaluation(context.referenceNumber, context.evaluation);
  },
});

const sendEvaluation = async (referenceNumber: string, evaluation: { candidateName: string; score: number; feedback: string }) => {
  // POST to api localhost:8000/submit-evaluation
  console.log(`Sending evaluation for reference number ${referenceNumber}:`, evaluation);
  const response = await fetch('http://localhost:8000/submit-evaluation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      candidateName: evaluation.candidateName,
      referenceNumber: referenceNumber,
      score : evaluation.score,
      feedback: evaluation.feedback,
    }),
  });
  if (!response.ok) {
    throw new Error(`Error sending evaluation: ${response.statusText}`);
  }

  return {
    success: true,
    message: `Evaluation for reference number ${referenceNumber} sent successfully.`,
  };
};


// submit trace tool
export const anchorTraceTool = createTool({
  id: 'anchor-trace',
  description: 'Anchor trace information for the current interaction',
  inputSchema: z.object({}),
  outputSchema: z.object({
    anchored: z.boolean().describe('Indicates if the trace was anchored successfully'),
  }),
  execute: async ({ context, tracingContext }) => {
    console.log("Anchoring trace with context:", context, "and tracingContext:", tracingContext);
    return await anchorTrace(tracingContext?.currentSpan?.traceId || "unknown");
  }
});

const anchorTrace = async (traceId: string) => {
  // POST to api localhost:8000/anchor-trace
  console.log(`Anchoring trace ID ${traceId}`);
  const response = await fetch('http://localhost:8001/anchor-trace', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      trace_id: traceId,
    }),
  });
  if (!response.ok) {
    throw new Error(`Error anchoring trace: ${response.statusText}`);
  }
  return {
    anchored: true,
    merkle_root: (await response.json()).merkle_root
  };
};

// ============================================
// cheqd Studio API Tools
// ============================================

// Service schema for DID updates
const ServiceSchema = z.object({
  id: z.string().describe('Service ID (e.g., did:cheqd:testnet:xxx#service-1)'),
  type: z.string().describe('Service type (e.g., LinkedDomains, DIDCommMessaging)'),
  serviceEndpoint: z.array(z.string()).describe('Service endpoint URLs'),
});

// Create DID tool using cheqd Studio API
export const createDidStudioTool = createTool({
  id: 'create-did-studio',
  description: 'Create a new DID (Decentralized Identifier) on the cheqd network using cheqd Studio API. Checks local database first - if a DID already exists for the network, returns the existing one.',
  inputSchema: z.object({
    network: z.enum(['testnet', 'mainnet']).describe('Network to create the DID on'),
    identifierFormatType: z.enum(['uuid', 'base58btc']).optional().default('uuid').describe('Algorithm for generating the method-specific ID'),
    verificationMethodType: z.enum(['Ed25519VerificationKey2018', 'JsonWebKey2020', 'Ed25519VerificationKey2020']).optional().default('Ed25519VerificationKey2020').describe('Type of verification method for the DID'),
  }),
  outputSchema: z.object({
    did: z.string().describe('The DID'),
    didDocument: z.any().describe('The full DID Document'),
    success: z.boolean().describe('Whether the operation was successful'),
    existedInDb: z.boolean().describe('Whether the DID was retrieved from local database'),
    error: z.string().optional().describe('Error message if creation failed'),
  }),
  execute: async ({ context }) => {
    // Check local database first
    const existingDid = getDIDByNetwork(context.network);
    if (existingDid) {
      console.log(`[create-did-studio] Found existing DID for ${context.network} in local database: ${existingDid.did}`);
      return {
        did: existingDid.did,
        didDocument: existingDid.didDocument,
        success: true,
        existedInDb: true,
      };
    }

    // No existing DID, create a new one via Studio API
    return await createDidViaStudio(context.network, context.identifierFormatType, context.verificationMethodType);
  },
});

const createDidViaStudio = async (
  network: 'testnet' | 'mainnet',
  identifierFormatType: 'uuid' | 'base58btc' = 'uuid',
  verificationMethodType: 'Ed25519VerificationKey2018' | 'JsonWebKey2020' | 'Ed25519VerificationKey2020' = 'Ed25519VerificationKey2020'
) => {
  if (!STUDIO_API_KEY) {
    return {
      did: '',
      didDocument: null,
      success: false,
      existedInDb: false,
      error: 'STUDIO_API_KEY environment variable is not set',
    };
  }

  console.log(`[create-did-studio] Creating DID on ${network} via cheqd Studio API...`);

  const formData = new URLSearchParams();
  formData.append('network', network);
  formData.append('identifierFormatType', identifierFormatType);
  formData.append('verificationMethodType', verificationMethodType);

  try {
    const response = await fetch(`${STUDIO_API_URL}/did/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-api-key': STUDIO_API_KEY,
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[create-did-studio] Error creating DID: ${response.status} - ${errorText}`);
      return {
        did: '',
        didDocument: null,
        success: false,
        existedInDb: false,
        error: `API error: ${response.status} - ${errorText}`,
      };
    }

    const result = await response.json();
    const did = result.did || result.didDocument?.id || '';
    const didDocument = result.didDocument || result;

    console.log(`[create-did-studio] DID created successfully: ${did}`);

    // Store in local database
    if (did) {
      storeDID(did, network, didDocument);
      console.log(`[create-did-studio] DID stored in local database`);
    }

    return {
      did,
      didDocument,
      success: true,
      existedInDb: false,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[create-did-studio] Error creating DID: ${errorMessage}`);
    return {
      did: '',
      didDocument: null,
      success: false,
      existedInDb: false,
      error: errorMessage,
    };
  }
};

// Update DID tool using cheqd Studio API
export const updateDidStudioTool = createTool({
  id: 'update-did-studio',
  description: 'Update an existing DID Document on the cheqd network with new service endpoints using cheqd Studio API',
  inputSchema: z.object({
    did: z.string().describe('The DID to update (e.g., did:cheqd:testnet:xxx)'),
    services: z.array(z.object({
      idFragment: z.string().describe('Service ID fragment (e.g., "service-1" - will be appended to DID as #service-1)'),
      type: z.string().describe('Service type (e.g., LinkedDomains, DIDCommMessaging)'),
      serviceEndpoint: z.array(z.string()).describe('Service endpoint URLs'),
    })).describe('List of services to add/update on the DID Document'),
  }),
  outputSchema: z.object({
    did: z.string().describe('The updated DID'),
    didDocument: z.any().describe('The updated DID Document'),
    success: z.boolean().describe('Whether the update was successful'),
    error: z.string().optional().describe('Error message if update failed'),
  }),
  execute: async ({ context }) => {
    return await updateDidViaStudio(context.did, context.services);
  },
});

const updateDidViaStudio = async (
  did: string,
  services: Array<{ idFragment: string; type: string; serviceEndpoint: string[] }>
) => {
  if (!STUDIO_API_KEY) {
    return {
      did: '',
      didDocument: null,
      success: false,
      error: 'STUDIO_API_KEY environment variable is not set',
    };
  }

  console.log(`[update-did-studio] Updating DID ${did} via cheqd Studio API...`);

  // Build the full service objects with proper IDs
  const fullServices = services.map(s => ({
    id: `${did}#${s.idFragment}`,
    type: s.type,
    serviceEndpoint: s.serviceEndpoint,
  }));

  try {
    const response = await fetch(`${STUDIO_API_URL}/did/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': STUDIO_API_KEY,
      },
      body: JSON.stringify({
        did,
        service: fullServices,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[update-did-studio] Error updating DID: ${response.status} - ${errorText}`);
      return {
        did,
        didDocument: null,
        success: false,
        error: `API error: ${response.status} - ${errorText}`,
      };
    }

    const result = await response.json();
    const didDocument = result.didDocument || result;

    console.log(`[update-did-studio] DID updated successfully`);

    // Update in local database
    updateDIDInDatabase(did, didDocument);
    console.log(`[update-did-studio] Local database updated`);

    return {
      did,
      didDocument,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[update-did-studio] Error updating DID: ${errorMessage}`);
    return {
      did,
      didDocument: null,
      success: false,
      error: errorMessage,
    };
  }
};

// List DIDs from local database
export const listDidsLocalTool = createTool({
  id: 'list-dids-local',
  description: 'List DIDs stored in the local database, optionally filtered by network',
  inputSchema: z.object({
    network: z.enum(['all', 'testnet', 'mainnet']).default('all').describe('Filter by network: "all", "testnet", or "mainnet"'),
  }),
  outputSchema: z.object({
    dids: z.array(z.object({
      did: z.string(),
      network: z.string(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })),
    count: z.number(),
  }),
  execute: async ({ context }) => {
    const db = loadDIDDatabase();
    const filteredDids = context.network === 'all'
      ? db.dids
      : db.dids.filter(d => d.network === context.network);

    return {
      dids: filteredDids.map(d => ({
        did: d.did,
        network: d.network,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
      count: filteredDids.length,
    };
  },
});
