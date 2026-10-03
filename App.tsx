import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Keyboard, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  addTurn,
  cleared,
  renamePlayer,
  rollFaces,
  turnTotal,
  type DieCount,
  type SavedGame,
} from "./src/game";
import { loadGame, saveGame } from "./src/store";

type Tab = "dice" | "table";

export default function App() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("dice");
  const [game, setGame] = useState<SavedGame | null>(null);
  const [note, setNote] = useState("Roll to start.");
  const [draft, setDraft] = useState("");
  const [confirmNew, setConfirmNew] = useState(false);

  useEffect(() => {
    loadGame()
      .then((saved) => {
        setGame(saved);
        setNote(saved.players.some((player) => player.score > 0) ? "Saved game loaded." : "Roll to start.");
      })
      .catch(() => {
        setGame(null);
        setNote("Could not read the saved game.");
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !game) return;
    saveGame(game).catch(() => setNote("Could not save the game."));
  }, [ready, game]);

  if (!ready || !game) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <View style={styles.center}>
          <Text style={styles.loading}>Loading the dice</Text>
        </View>
      </SafeAreaView>
    );
  }

  const player = game.players[game.current];
  const total = turnTotal(game.faces);

  function onRoll() {
    const faces = rollFaces(game!.diceCount);
    setGame({ ...game!, faces, rolled: true });
    setNote(`Rolled ${turnTotal(faces)}.`);
    setConfirmNew(false);
  }

  function onCount(count: DieCount) {
    setGame({ ...game!, diceCount: count, faces: [], rolled: false });
    setNote(count === 1 ? "One die." : `${count} dice.`);
  }

  function onAdd() {
    const result = addTurn(game!);
    setGame(result.game);
    setNote(result.note);
  }

  function onRename() {
    Keyboard.dismiss();
    const result = renamePlayer(game!.players, game!.current, draft);
    setGame({ ...game!, players: result.players });
    setNote(result.note);
    if (result.note === "Name saved.") setDraft("");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.body}>
        <Text style={styles.title}>Big Dice</Text>
        <Text style={styles.note}>{note}</Text>
        {tab === "dice" ? (
          <View style={styles.panel}>
            <View style={styles.faces}>
              {game.faces.length === 0 ? (
                <Text style={styles.face}>?</Text>
              ) : (
                game.faces.map((face, index) => (
                  <Text key={`${index}-${face}`} style={styles.face} accessibilityLabel={`Die ${index + 1} showing ${face}`}>
                    {face}
                  </Text>
                ))
              )}
            </View>
            <Text style={styles.total}>{game.rolled ? `Total ${total}` : "No roll yet"}</Text>
            <BigButton label="Roll" filled onPress={onRoll} />
            <View style={styles.row}>
              <BigButton label="One die" filled={game.diceCount === 1} inRow onPress={() => onCount(1)} />
              <BigButton label="Two dice" filled={game.diceCount === 2} inRow onPress={() => onCount(2)} />
              <BigButton label="Three dice" filled={game.diceCount === 3} inRow onPress={() => onCount(3)} />
            </View>
          </View>
        ) : (
          <View style={styles.panel}>
            <Text style={styles.player}>{player.name}</Text>
            <Text style={styles.total}>{player.name} has {player.score}</Text>
            <Text style={styles.note}>{draft.trim() ? draft.trim() : "Nothing typed yet."}</Text>
            <BigButton label="Save name" filled onPress={onRename} />
            <TextInput
              value={draft}
              onChangeText={setDraft}
              accessibilityLabel="Player name"
              placeholder="Type a name"
              placeholderTextColor="#8A7560"
              autoCorrect={false}
              spellCheck={false}
              autoCapitalize="words"
              style={styles.input}
            />
            <BigButton label={`Add to ${player.name}`} filled onPress={onAdd} />
            <View style={styles.row}>
              {game.players.map((item, index) => (
                <BigButton
                  key={item.id}
                  label={`Select ${item.name}`}
                  inRow
                  filled={index === game.current}
                  onPress={() => {
                    setGame({ ...game, current: index });
                    setNote(`${item.name} is playing.`);
                    setConfirmNew(false);
                  }}
                />
              ))}
            </View>
            <View style={styles.row}>
              <BigButton
                label="Next player"
                inRow
                onPress={() => {
                  const next = (game.current + 1) % game.players.length;
                  setGame({ ...game, current: next });
                  setNote(`${game.players[next].name} is playing.`);
                }}
              />
              {confirmNew ? (
                <>
                  <BigButton
                    label="Confirm new game"
                    inRow
                    filled
                    onPress={() => {
                      setGame(cleared(game));
                      setConfirmNew(false);
                      setNote("Scores cleared.");
                    }}
                  />
                  <BigButton
                    label="Cancel new game"
                    inRow
                    onPress={() => {
                      setConfirmNew(false);
                      setNote("New game canceled.");
                    }}
                  />
                </>
              ) : (
                <BigButton label="New game" inRow onPress={() => setConfirmNew(true)} />
              )}
            </View>
          </View>
        )}
      </View>
      <View style={styles.tabs}>
        <TabButton label="Dice" selected={tab === "dice"} onPress={() => setTab("dice")} />
        <TabButton label="Table" selected={tab === "table"} onPress={() => { setTab("table"); setConfirmNew(false); }} />
      </View>
    </SafeAreaView>
  );
}

function BigButton({
  label,
  onPress,
  filled,
  inRow,
}: {
  label: string;
  onPress: () => void;
  filled?: boolean;
  inRow?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.button, inRow && styles.buttonRow, filled && styles.buttonFilled]}
    >
      <Text style={[styles.buttonText, filled && styles.buttonTextFilled]}>{label}</Text>
    </Pressable>
  );
}

function TabButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.tab, selected && styles.tabOn]}
    >
      <Text style={[styles.tabText, selected && styles.tabTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFF6EA" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loading: { fontSize: 28, fontWeight: "800", color: "#1A1208" },
  body: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 32, fontWeight: "800", color: "#1A1208" },
  note: { fontSize: 18, color: "#5C4634", minHeight: 28, marginTop: 4 },
  panel: { flex: 1, gap: 8, marginTop: 8 },
  faces: { flexDirection: "row", gap: 8, justifyContent: "center" },
  face: {
    width: 96,
    height: 96,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: "#1A1208",
    textAlign: "center",
    lineHeight: 96,
    fontSize: 48,
    fontWeight: "800",
    color: "#1A1208",
    overflow: "hidden",
  },
  total: { fontSize: 28, fontWeight: "800", color: "#1A1208" },
  player: { fontSize: 36, fontWeight: "800", color: "#C2410C" },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E2CDB8",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 20,
    color: "#1A1208",
  },
  row: { flexDirection: "row", gap: 8 },
  button: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#C2410C",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    backgroundColor: "#FFFFFF",
  },
  buttonRow: { flex: 1 },
  buttonFilled: { backgroundColor: "#C2410C" },
  buttonText: { fontSize: 16, fontWeight: "800", color: "#C2410C", textAlign: "center" },
  buttonTextFilled: { color: "#FFFFFF" },
  tabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2CDB8",
  },
  tab: { flex: 1, minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#F3E4D4" },
  tabOn: { backgroundColor: "#1A1208" },
  tabText: { fontSize: 18, fontWeight: "800", color: "#1A1208" },
  tabTextOn: { color: "#FFF6EA" },
});
