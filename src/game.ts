export type DieCount = 1 | 2 | 3;

export type Player = {
  id: string;
  name: string;
  score: number;
};

export type SavedGame = {
  diceCount: DieCount;
  faces: number[];
  rolled: boolean;
  players: Player[];
  current: number;
};

export const STARTER: Player[] = [
  { id: "red", name: "Red", score: 0 },
  { id: "blue", name: "Blue", score: 0 },
  { id: "green", name: "Green", score: 0 },
  { id: "gold", name: "Gold", score: 0 },
];

export const EMPTY_GAME: SavedGame = {
  diceCount: 1,
  faces: [],
  rolled: false,
  players: STARTER,
  current: 0,
};

export function turnTotal(faces: number[]): number {
  return faces.reduce((sum, face) => sum + face, 0);
}

export function rollFaces(count: DieCount, random: () => number = Math.random): number[] {
  return Array.from({ length: count }, () => 1 + Math.floor(random() * 6));
}

export function parseGame(raw: string | null): SavedGame {
  if (!raw) return EMPTY_GAME;
  try {
    const data = JSON.parse(raw) as Partial<SavedGame>;
    const diceCount: DieCount = data.diceCount === 2 || data.diceCount === 3 ? data.diceCount : 1;
    const faces = Array.isArray(data.faces)
      ? data.faces.filter((face) => typeof face === "number" && face >= 1 && face <= 6)
      : [];
    const players = Array.isArray(data.players)
      ? data.players.filter(
          (player): player is Player =>
            !!player &&
            typeof player.id === "string" &&
            typeof player.name === "string" &&
            typeof player.score === "number",
        )
      : [];
    const safePlayers = players.length === 4 ? players : STARTER;
    const current =
      typeof data.current === "number" && data.current >= 0 && data.current < safePlayers.length
        ? data.current
        : 0;
    return {
      diceCount,
      faces: faces.slice(0, diceCount),
      rolled: data.rolled === true && faces.length === diceCount,
      players: safePlayers,
      current,
    };
  } catch {
    return EMPTY_GAME;
  }
}

export function renamePlayer(
  players: Player[],
  index: number,
  rawName: string,
): { players: Player[]; note: string } {
  const name = rawName.trim().replace(/\s+/g, " ");
  if (!name) return { players, note: "Type a name first." };
  const taken = players.some((player, i) => i !== index && player.name.toLowerCase() === name.toLowerCase());
  if (taken) return { players, note: "Already used." };
  const next = players.map((player, i) => (i === index ? { ...player, name } : player));
  return { players: next, note: "Name saved." };
}

export function addTurn(game: SavedGame): { game: SavedGame; note: string } {
  if (!game.rolled) return { game, note: "Roll first." };
  const total = turnTotal(game.faces);
  const players = game.players.map((player, i) =>
    i === game.current ? { ...player, score: player.score + total } : player,
  );
  const name = players[game.current].name;
  return {
    game: { ...game, players, rolled: false },
    note: `Added ${total} to ${name}.`,
  };
}

export function cleared(game: SavedGame): SavedGame {
  return {
    ...EMPTY_GAME,
    players: game.players.map((player) => ({ ...player, score: 0 })),
  };
}
