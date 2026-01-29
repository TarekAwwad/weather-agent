# Hiring Agent

A hiring assistant agent built with the Mastra framework that supports candidate screening, evaluation, and decentralized identity (DID) operations via the cheqd Studio API.

## Features

- **Candidate Screening**: Retrieve job positions and evaluate candidates against job descriptions
- **Evaluation Management**: Score candidates and submit evaluations to hiring managers
- **DID Operations**: Create and manage decentralized identifiers on cheqd network via Studio API
- **Trace Anchoring**: Anchor interaction traces for auditability
- **Local DID Storage**: Persistent local database for DID management

## Prerequisites

- Node.js 20+
- pnpm (or npm)
- cheqd Studio API key (get one at [studio.cheqd.io](https://studio.cheqd.io))

## Setup

### 1. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Required: Your OpenAI API key
OPENAI_API_KEY=your-openai-api-key

# Model to use (default: openai/gpt-4o)
MODEL=openai/gpt-4o

# cheqd Studio API configuration
STUDIO_API_URL=https://studio-api-staging.cheqd.net
STUDIO_API_KEY=your-studio-api-key
```

### 3. Run the Agent

```bash
pnpm dev
# or
npm run dev
```

## Available Tools

### Hiring Tools
- `get-open-positions`: Retrieve job positions from the company database by reference number
- `send-evaluation`: Send candidate evaluations to the hiring manager

### DID Tools (cheqd Studio API)
- `create-did-studio`: Create a new DID on the cheqd network (testnet/mainnet). Automatically checks local database first - if a DID already exists for the network, returns the existing one instead of creating a duplicate.
- `update-did-studio`: Update an existing DID Document with new service endpoints
- `list-dids-local`: List all DIDs stored in the local database (filter by network: all/testnet/mainnet)

### Utility Tools
- `anchor-trace`: Anchor trace information for auditability

## DID Management

### Local DID Database

DIDs are stored locally in `did-store.json` at the project root. This prevents duplicate DID creation and allows offline access to your DID information.

**Database format:**
```json
{
  "dids": [
    {
      "did": "did:cheqd:testnet:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "network": "testnet",
      "didDocument": { ... },
      "createdAt": "2026-01-29T12:00:00.000Z",
      "updatedAt": "2026-01-29T12:00:00.000Z"
    }
  ]
}
```

### Creating a DID

When you call `create-did-studio`, the tool will:
1. Check the local database for an existing DID on the specified network
2. If found, return the existing DID (no API call made)
3. If not found, create a new DID via cheqd Studio API and store it locally

### Updating a DID with Services

Use `update-did-studio` to add service endpoints to your DID:

```json
{
  "did": "did:cheqd:testnet:your-did-id",
  "services": [
    {
      "idFragment": "service-1",
      "type": "LinkedDomains",
      "serviceEndpoint": ["https://example.com"]
    },
    {
      "idFragment": "messaging",
      "type": "DIDCommMessaging",
      "serviceEndpoint": ["https://example.com/didcomm"]
    }
  ]
}
```

### Adding an Existing DID Manually

To add an existing DID to the local database, create or edit `did-store.json`:

```json
{
  "dids": [
    {
      "did": "did:cheqd:testnet:your-existing-did",
      "network": "testnet",
      "didDocument": {},
      "createdAt": "2026-01-29T12:00:00.000Z",
      "updatedAt": "2026-01-29T12:00:00.000Z"
    }
  ]
}
```

## Project Structure

```
vai-demo-poc/
├── src/mastra/
│   ├── agents/index.ts    # Hiring agent definition
│   ├── tools/index.ts     # Tool implementations (hiring, DID, trace)
│   ├── workflows/index.ts # Evaluation workflow
│   └── index.ts           # Mastra configuration
├── did-store.json         # Local DID database (auto-created)
├── .env                   # Environment configuration
└── .env.example           # Environment template
```

## Troubleshooting

### DID operations failing
- Ensure `STUDIO_API_KEY` is set correctly in `.env`
- Check that the API key has the necessary permissions
- Verify the `STUDIO_API_URL` is correct (staging vs production)

### "DID already exists" behavior
- This is expected! The `create-did-studio` tool checks the local database first
- To force creation of a new DID, remove the existing entry from `did-store.json`

### Local database issues
- Ensure the application has write permissions to the project directory
- Check `did-store.json` for valid JSON format
- Delete `did-store.json` to reset the local database

## API Reference

### cheqd Studio API

The agent uses the cheqd Studio API for DID operations:
- **Base URL (Staging)**: `https://studio-api-staging.cheqd.net`
- **Base URL (Production)**: `https://studio-api.cheqd.net`
- **Authentication**: API key via `x-api-key` header

For more information, see the [cheqd Studio documentation](https://docs.cheqd.io/product/getting-started/studio).
