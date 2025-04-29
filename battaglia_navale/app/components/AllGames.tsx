'use client'

import axios from 'axios'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface GameData {
    data: {
        [key: string]: string;
    }
}

export default function AllGames() {
    const [games, setGames] = useState<GameData | null>(null)
    const [loading, setLoading] = useState(true)
    const api = String(process.env.NEXT_PUBLIC_API)

    console.log(api)    

    const fetchGames = useCallback(async () => {
        try {
            const response = await axios.get(`${api}/get_games`)
            setGames(response.data)
            setLoading(false)
        } catch (error) {
            console.error('Error fetching games:', error)
            setLoading(false)
        }
    }, [api])

    useEffect(() => {
        fetchGames()
    }, [fetchGames])

    const createNewGame = async () => {
        try {
            await axios.post(`${api}/create_game`)
            fetchGames() // Refresh the games list after creating
        } catch (error) {
            console.error('Error creating new game:', error)
        }
    }

    if (loading) {
        return <div className="text-center p-4">Loading...</div>
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Available Games</h1>
            <button
                onClick={createNewGame}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
            >
                Create New Game
            </button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {games && Object.entries(games.data).map(([key, value]) => (
                    <Link key={key} className="p-4 border rounded" href={`/game?gameID=${value}`}>
                        {`${key}: ${value}`}
                    </Link>
                ))}
            </div>
            
            {(!games || Object.keys(games.data).length === 0) && (
                <p className="text-center text-gray-500">No games available. Create one!</p>
            )}
        </div>
    )
}