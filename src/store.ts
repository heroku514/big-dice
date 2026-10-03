import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseGame, type SavedGame } from "./game";

const KEY = "big-dice-v1";

export async function loadGame(): Promise<SavedGame> {
  return parseGame(await AsyncStorage.getItem(KEY));
}

export async function saveGame(game: SavedGame): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(game));
}
