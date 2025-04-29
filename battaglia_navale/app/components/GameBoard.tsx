"use client";
import { useState, useEffect, useRef } from "react";

export default function GameBoard({ gameID }: { gameID: string }) {
    const [player, setPlayer] = useState<string | null>(null);
    const board = Number(process.env.NEXT_PUBLIC_BOARD_SIZE);
    const [youTourn, setYouTurn] = useState<boolean>(false);
    const [boardState, setBoardState] = useState<(null | boolean)[][]>(
        Array(board).fill(null).map(() => Array(board).fill(null))
    );
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        console.log(sessionStorage.getItem('player'))
        setPlayer(sessionStorage.getItem('player'));
    }, []);

    useEffect(() => {
        if (!player) return;
        ws.current = new WebSocket(
            `ws://${process.env.NEXT_PUBLIC_API?.replace('http://', '')}/ws/${gameID}/${player}`
        );

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log(data);
            
            if (data.type === 'SHOT_RESULT') {
                setYouTurn(false);
                const newBoard = [...boardState];
                newBoard[data.row][data.col] = data.hit;
                setBoardState(newBoard);
            }
            else
                setYouTurn(true);

            if (data.message !== "Colpito" && data.message !== "Mancato")
                alert(data.message);

            if (data.message === "Hai vinto" || data.message === "Hai perso")
                window.location.href = `/`;
        };

        return () => {
            ws.current?.close();
        };
    }, [gameID, player]);

    const handleCellClick = async (col: number, row: number) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                col,
                row
            }));
        }
    };

    return (
        <div className="bg-blue-300 min-h-screen p-8 flex items-center justify-center">
            <div className="w-[500px]">
                <h1 className="text-5xl mb-8 text-center text-white font-bold">
                    Battaglia Navale {player}
                </h1>
                
                {/* Turn indicator */}
                <div className={`text-xl text-center mb-4 font-bold ${youTourn ? 'text-green-500' : 'text-red-500'}`}>
                    {youTourn ? 'È il tuo turno!' : 'Turno dell\'avversario'}
                </div>

                <div className="">
                    <div className="grid grid-cols-10 gap-1 bg-white p-4 rounded-lg">
                        {boardState.map((col, colIndex) => (
                            col.map((cell, rowIndex) => (
                                <button
                                    key={`${rowIndex}-${colIndex}`}
                                    className={`aspect-square border border-blue-400 
                                        ${cell === true ? 'bg-red-800' : cell === false ? 'bg-gray-950' : 'bg-blue-100'}
                                        ${!youTourn ? 'cursor-not-allowed opacity-50' : ''}`}
                                    onClick={() => handleCellClick(rowIndex, colIndex)}
                                    disabled={cell === false || !youTourn}
                                />
                            ))
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

