// Pure rules joining the hand-kept squad with the players found in box scores: no DOM, tested with node --test.

export const ROLE_LABELS = { 1: "Playmaker", 2: "Guardia", 3: "Ala piccola", 4: "Ala grande", 5: "Centro" };

const MIN_COMMON_WORDS = 2;
const words = (name) => new Set(
  name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().split(/[^a-z]+/).filter(Boolean),
);

// Same person when every word of the shorter name is in the longer one, whatever the order
// ("Manca Federico" / "Federico Manca") and even with an extra word ("Fiori Lorenzo Ozieri").
// A bare surname never matches: two Loi share it.
export function sameName(a, b) {
  const [short, long] = [words(a), words(b)].sort((x, y) => x.size - y.size);
  return short.size >= MIN_COMMON_WORDS && [...short].every((word) => long.has(word));
}

const emptyStats = (name, rosterRole) => ({
  name, rosterRole, points: 0, listed: 0, entered: 0, average: null, homeAverage: null,
  awayAverage: null, best: null, doubleDigit: 0, teamShare: null, winAverage: null, lossAverage: null, last5: [],
});

// Box score players first (already ranked by the caller), then the roster players none of them
// matched, in roster order. Each roster entry claims at most one box score player.
export function mergeRoster(players, roster) {
  const claimed = new Set();
  const withRole = players.map((player) => ({ ...player }));
  const missing = [];
  for (const { name, role } of roster) {
    const found = withRole.find((player) => !claimed.has(player) && sameName(player.name, name));
    if (found) {
      claimed.add(found);
      found.rosterRole = role;
    } else {
      missing.push(emptyStats(name, role));
    }
  }
  return [...withRole, ...missing];
}
