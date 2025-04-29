from pydantic import BaseModel
from typing import List, Optional

class Board(BaseModel):
    grid: List[List[Optional[bool]]]  # Usa Optional[bool] invece di bool | None

class Move(BaseModel):
    col: int
    row: int
    player: int