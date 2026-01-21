from pymerkle import InmemoryTree as MerkleTree
from pymerkle.hasher import MerkleHasher

import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Any, Dict, List
import requests
import dotenv
import os
import base64

dotenv.load_dotenv()

# laod environment variables
STUDIO_API_KEY = os.getenv("STUDIO_API_KEY")
STUDIO_URL = os.getenv("STUDIO_URL")
AGENT_DID = os.getenv("AGENT_DID")
AUTH_DID = os.getenv("AUTH_DID")

app = FastAPI()


Span = Dict[str, Any]


def _canon(obj: Any) -> bytes:
    """
    Quick & dirty deterministic JSON-ish canonicalization for PoC.

    - Sorts dict keys.
    - Uses JSON-like escaping via repr for strings (good enough for PoC).
    - Preserves types.
    - No float normalization beyond Python's default repr.
    - Encodes as UTF-8 bytes.

    If you want a stronger standard: use RFC8785 JCS via a library.
    """
    if obj is None:
        return b"null"
    if obj is True:
        return b"true"
    if obj is False:
        return b"false"
    if isinstance(obj, (int, float)):
        # PoC: Python repr is deterministic for ints; floats can be tricky but acceptable here.
        return str(obj).encode("utf-8")
    if isinstance(obj, str):
        # PoC: repr includes quotes and escapes; deterministic
        return repr(obj).encode("utf-8")
    if isinstance(obj, bytes):
        # Represent bytes as hex to keep it stable
        return b'"' + obj.hex().encode("utf-8") + b'"'
    if isinstance(obj, list):
        return b"[" + b",".join(_canon(x) for x in obj) + b"]"
    if isinstance(obj, dict):
        # Sort keys lexicographically as strings
        items = []
        for k in sorted(obj.keys(), key=lambda x: str(x)):
            kb = _canon(str(k))
            vb = _canon(obj[k])
            items.append(kb + b":" + vb)
        return b"{" + b",".join(items) + b"}"
    # Fallback: convert to string deterministically
    return repr(obj).encode("utf-8")


def _span_sort_key(span: Span) -> tuple:
    """
    Deterministic ordering for the array -> list commitment.
    """
    return (
        str(span.get("traceId", "")),
        str(span.get("startedAt", "")),
        str(span.get("spanId", "")),
    )


def spans_to_merkle_root(spans=[b"ASD" for _ in range(10)]):
    tree = MerkleTree(algorithm="sha256").init_from_entries(spans)
    return tree.get_state()


# post Trace ID to be anchored
class TraceIDRequest(BaseModel):
    trace_id: str


class AnchorResponse(BaseModel):
    merkle_root: str


@app.post("/anchor-trace", response_model=AnchorResponse)
async def anchor_trace(request: TraceIDRequest):
    print("Received Trace ID to anchor:", request.trace_id)

    spans = fetch_trace_by_id(request.trace_id)

    sorted_spans = sorted(spans, key=_span_sort_key)
    canonical_spans = [canonicalize_span(span) for span in sorted_spans]
    merkle_state = spans_to_merkle_root(canonical_spans)
    print("Computed Merkle Root:", merkle_state)

    root = merkle_state.hex()
    print("Returning Merkle Root:", root)

    post_to_ledger(root, request.trace_id)

    return AnchorResponse(merkle_root=root)


def fetch_trace_by_id(trace_id: str):
    api = f"http://localhost:4111/api/observability/traces/{trace_id}"

    response = requests.get(api)

    if response.status_code == 200:
        spans = response.json().get("spans", [])
        return spans
    else:
        print("Failed to fetch trace data. Status code:", response.status_code)
        return None


def canonicalize_span(span_data):
    # span data is a dict
    # TODO: Canonicalization via RFC 8785
    # This is a placeholder implementation
    spans_canonical = _canon(span_data)

    # Implement canonicalization logic as needed
    return spans_canonical


def post_to_ledger(root: str, trace_id: str):
    # DLR creation endpoint
    url = f"{STUDIO_URL}/resource/create/{AUTH_DID}"
    headers = {
        "x-api-key": STUDIO_API_KEY,   
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "*/*"
    }

    # Prepare and encode data trace information
    data = encode_base64url(str({
        "agentDid": AGENT_DID,
        "runId": "evaluationWorkflow",
        "traceId": trace_id,
        "merkleRoot": root
    }))

    # POST request to create DLR
    payload = {
        "data": f"{data}",
        "encoding": "base64url",
        "name": "AgentTraceProof",
        "type": "TextDocument"
    }
    response = requests.post(url, headers=headers, data=payload)
    if response.status_code == 200:
        print("Successfully posted to ledger.")
    else:
        print("Failed to post to ledger. Status code:", response.status_code, response.text)
    return


def encode_base64url(data: str) -> str:
    """Encode data to base64url without padding."""
    encoded = base64.urlsafe_b64encode(data.encode("utf-8")).decode("utf-8")
    return encoded


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
