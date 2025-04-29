import { useState } from "react";
import axios from "axios";

export default function SetBoard({ gameID }: { gameID: string }) {
    const board = Number(process.env.NEXT_PUBLIC_BOARD_SIZE);
    const [nSquareShips, setNSquareShips] = useState<number>(5);
    const [boardState, setBoardState] = useState<(null | boolean)[][]>(
        Array(board).fill(null).map(() => Array(board).fill(null))
    );
    const api = String(process.env.NEXT_PUBLIC_API);

    const handleCellClick = (row: number, col: number) => {  // Inverti gli indici
        if (nSquareShips <= 0) return;
    
        const newBoard = [...boardState];
        newBoard[row][col] = true;  // Usa row come primo indice
        setBoardState(newBoard);
        setNSquareShips(prev => prev - 1);
        console.table(newBoard);
    };
    

    const handleSendBoard = async () => {
        try {
            const response = await axios.post(api+`/join_and_set_board/${gameID}`, {grid: boardState});

            if (response.data) {
                console.log('Board sent successfully:', response.data);
                sessionStorage.setItem('player', response.data.player);
                alert(sessionStorage.getItem('player'));
                window.location.href = `/game/${response.data.game_id}`;
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Server Error:', error.response?.data);
            } else {
                console.error('Error sending board:', error);
            }
        }
    }

    return (
        <div className="bg-blue-300 min-h-screen p-8 flex items-center justify-center">
            <div className="w-[450px]">
                <h1 className="text-5xl mb-8 text-center text-gray-50 font-bold">Battaglia Navale</h1>
                <p className="text-gray-50">Punti da piazzare {nSquareShips}</p>
                <div className="">
                    <div className="grid grid-cols-10 gap-1 bg-white p-4 rounded-lg">
                        {boardState.map((row, rowIndex) => (
                            row.map((cell, colIndex) => (
                                <button
                                    key={`${rowIndex}-${colIndex}`}
                                    className={`aspect-square border border-blue-400 
                                        ${cell === true ? 'bg-gray-400' : 'bg-blue-100'}`}
                                    onClick={() => handleCellClick(rowIndex, colIndex)}
                                    
                                />
                            ))
                        ))}
                    </div>
                </div>
                {nSquareShips === 0 && (
                    <button className="bg-green-500 text-white p-4 rounded-lg mt-4 w-full"
                        onClick={() => handleSendBoard()}>
                        Start Game
                    </button>
                )}
            </div>
        </div>
    );
}

