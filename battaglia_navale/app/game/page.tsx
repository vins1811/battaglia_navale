"use client";

import SetBoard from "../components/SetBoard";
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function GameContent() {
    const searchParams = useSearchParams();
    const gameID = searchParams.get('gameID');

    if (!gameID) {
        return <div>No game ID provided</div>;
    }

    return <SetBoard gameID={gameID} />;
}

export default function Game() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <GameContent />
        </Suspense>
    );
}
