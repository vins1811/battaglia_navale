import redis
import json
import uuid
from fastapi import FastAPI, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from models.model import Board
from typing import Dict

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis connection (Docker Compose: host="redis")
r = redis.Redis(host="redis", port=6379, decode_responses=True)

# WebSocket connections (in-memory)
connections: Dict[str, Dict[int, WebSocket]] = {}

@app.post("/create_game", status_code=status.HTTP_201_CREATED)
async def create_game():
    game_id = str(uuid.uuid4())[:8]
    game_data = {
        "player1": None,
        "player2": None,
        "turn": 1,
        "boards": {"1": None, "2": None},
        "hits": {"1": 0, "2": 0}
    }
    r.set(f"game:{game_id}", json.dumps(game_data))
    return {"game_id": game_id}

@app.put("/clear_games", status_code=status.HTTP_200_OK)
async def clear_games():
    keys = r.keys("game:*")
    if keys:
        r.delete(*keys)
    return {"message": "All games cleared"}

@app.get("/get_games", status_code=status.HTTP_202_ACCEPTED)
def get_games():
    data = {}
    keys = r.keys("game:*")
    for idx, key in enumerate(keys, 1):
        game_id = key.split("game:")[1]
        data[f"game_id_{idx}"] = game_id
    return {"data": data}

@app.post("/join_and_set_board/{game_id}", status_code=status.HTTP_200_OK)
async def join_and_set_board(game_id: str, board: Board):
    game_json = r.get(f"game:{game_id}")
    if not game_json:
        return {"error": "Game not found"}
    game = json.loads(game_json)

    # Assegna player
    if game["player1"] is None:
        player = 1
        game["player1"] = True
    elif game["player2"] is None:
        player = 2
        game["player2"] = True
    else:
        return {"error": "Game is full"}

    game["boards"][str(player)] = board.grid
    r.set(f"game:{game_id}", json.dumps(game))

    # Notifica il player 1 che può iniziare se entrambi hanno la board
    if game["boards"]["1"] is not None and game["boards"]["2"] is not None:
        if game_id in connections and 1 in connections[game_id]:
            await connections[game_id][1].send_json({"type": "YOUR_TURN"})

    return {
        "message": f"Joined as Player {player} and board set",
        "player": player,
        "game_id": game_id
    }

@app.get("/check/{game_id}")
async def check(game_id: str, col: int, row: int, player: int):
    game_json = r.get(f"game:{game_id}")
    if not game_json:
        return {"error": "Game not found"}
    game = json.loads(game_json)
    opponent = "1" if player == 2 else "2"
    board = game["boards"].get(opponent)
    if board and board[row][col]:
        return {"message": "Colpito"}
    return {"message": "non Colpito"}

@app.websocket("/ws/{game_id}/{player}")
async def websocket_endpoint(websocket: WebSocket, game_id: str, player: int):
    await websocket.accept()
    if game_id not in connections:
        connections[game_id] = {}
    connections[game_id][player] = websocket

    try:
        while True:
            data = await websocket.receive_json()
            col, row = data["col"], data["row"]
            game_json = r.get(f"game:{game_id}")
            if not game_json:
                await websocket.send_json({"type": "ERROR", "message": "Game not found"})
                continue
            game = json.loads(game_json)
            opponent = "1" if player == 2 else "2"

            # Board pronta?
            if not game["boards"].get(opponent):
                await websocket.send_json({"type": "ERROR", "message": "La board dell'avversario non è pronta."})
                continue

            hit = game["boards"][opponent][row][col] is True
            message = "Colpito" if hit else "Mancato"
            if hit:
                game["hits"][str(player)] += 1

            # Aggiorna stato su Redis
            r.set(f"game:{game_id}", json.dumps(game))

            # Controlla vittoria
            won = game["hits"][str(player)] >= 5

            await websocket.send_json({
                "type": "SHOT_RESULT",
                "hit": hit,
                "col": col,
                "row": row,
                "message": "Hai vinto" if won else message
            })

            # Notifica l'avversario
            opponent_int = int(opponent)
            if opponent_int in connections[game_id]:
                await connections[game_id][opponent_int].send_json({
                    "type": "OPPONENT_SHOT",
                    "hit": hit,
                    "col": col,
                    "row": row,
                    "message": "Hai perso" if won else message
                })

            if won:
                r.delete(f"game:{game_id}")
                break

    except WebSocketDisconnect:
        del connections[game_id][player]
        if not connections[game_id]:
            del connections[game_id]