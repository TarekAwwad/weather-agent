from pymerkle import InmemoryTree as MerkleTree
from pymerkle.hasher import MerkleHasher

import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
app = FastAPI()


def spans_to_merkle_root(spans=[b'ASD' for _ in range(10)]):
    tree = MerkleTree(algorithm='sha256').init_from_entries(spans)
    return tree.get_state()

# post Trace ID to be anchored
class TraceIDRequest(BaseModel):
    trace_id: str
class AnchorResponse(BaseModel):
    merkle_root: str
@app.post("/anchor-trace", response_model=AnchorResponse)
async def anchor_trace(request: TraceIDRequest):
    print("Received Trace ID to anchor:", request.trace_id)
    
    # hash the trace ID to create a span : TEMPORARY SIMULATION
    span = request.trace_id.encode('utf-8')
    merkle_state = spans_to_merkle_root([span])
    print("Computed Merkle Root:", merkle_state)
    return AnchorResponse(merkle_root=merkle_state)


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)