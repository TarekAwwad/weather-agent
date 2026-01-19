
# create a dummy api with one endopint 
# /get-open-positions that returns a json with open positions by reference number
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
app = FastAPI()

class Position(BaseModel):
    reference_number: str
    title: str
    department: str
    location: str
    description: str

class PositionsResponse(BaseModel):
    positions: List[Position]   
@app.get("/get-open-positions", response_model=PositionsResponse)
async def get_open_positions():
    return PositionsResponse(positions=[
        Position(
            reference_number="REF123",
            title="Software Engineer",
            department="Engineering",
            location="New York, NY",
            description="Develop and maintain software applications."
        ),
        Position(
            reference_number="REF456",
            title="Product Manager",
            department="Product",
            location="San Francisco, CA",
            description="Oversee product development from conception to launch."
        ),
        Position(
            reference_number="REF789",
            title="Data Scientist",
            department="Data Science",
            location="Remote",
            description="Analyze and interpret complex data to help companies make decisions."
        )
    ])

# get open positions by reference number
@app.get("/get-open-positions/{reference_number}", response_model=Position)
async def get_open_position_by_reference(reference_number: str):
    positions = {
        "REF123": Position(
            reference_number="REF123",
            title="Software Engineer",
            department="Engineering",
            location="New York, NY",
            description="Develop and maintain software applications."
        ),
        "REF456": Position(
            reference_number="REF456",
            title="Product Manager",
            department="Product",
            location="San Francisco, CA",
            description="Oversee product development from conception to launch."
        ),
        "REF789": Position(
            reference_number="REF789",
            title="Data Scientist",
            department="Data Science",
            location="Remote",
            description="Analyze and interpret complex data to help companies make decisions."
        )
    }
    position = positions.get(reference_number)
    if position:
        return position
    else:
        return {"error": "Position not found"}

# To run the app, use the command:
# uvicorn dummy_api.main:app --reload