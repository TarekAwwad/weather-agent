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

# API to submit spans and get merkle root
class SpansRequest(BaseModel):
    spans: List[bytes]
class MerkleRootResponse(BaseModel):
    merkle_root: str
@app.post("/compute-merkle-root", response_model=MerkleRootResponse)
async def compute_merkle_root(request: SpansRequest):
    merkle_state = spans_to_merkle_root(request.spans)
    return MerkleRootResponse(merkle_root=merkle_state.root)
