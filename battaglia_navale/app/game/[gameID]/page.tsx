"use client";

import { use } from "react";
import GameBoard from "@/app/components/GameBoard";

export default function Game({ params }: { params: Promise<{ gameID: string }> }) {
    const { gameID } = use(params);

    return <GameBoard gameID={gameID} />;
}
