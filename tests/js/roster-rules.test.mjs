import assert from "node:assert/strict";
import { test } from "node:test";

import { ROLE_LABELS, mergeRoster, sameName } from "../../docs/roster-rules.js";
import { ROSTER } from "../../docs/roster.js";

const stat = (name, points = 10) => ({ id: name, name, role: "play", age: "'07", points, listed: 1 });

test("sameName: word order, case and accents do not matter", () => {
  assert.equal(sameName("Manca Federico", "FEDERICO MANCA"), true);
  assert.equal(sameName("Orrù Alessio", "Alessio Orru"), true);
});

test("sameName: a middle name or second surname on one side still matches", () => {
  assert.equal(sameName("Fiori Lorenzo Ozieri", "Fiori Lorenzo"), true);
});

test("sameName: players sharing a surname are different people", () => {
  assert.equal(sameName("Loi Nicola", "Loi Matteo"), false);
  assert.equal(sameName("Loi Nicola", "Loi"), false);
});

test("mergeRoster: a roster player with box scores keeps his stats and gains the roster role", () => {
  const merged = mergeRoster([stat("Grosso Salvatore", 22)], [{ name: "Salvatore Grosso", role: 4 }]);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].points, 22);
  assert.equal(merged[0].rosterRole, 4);
});

test("mergeRoster: a roster player never listed in a box score gets an empty row after the others", () => {
  const roster = [{ name: "Manca Federico", role: 1 }, { name: "Grosso Salvatore", role: 4 }];
  const merged = mergeRoster([stat("Grosso Salvatore", 22)], roster);

  assert.deepEqual(merged.map((p) => p.name), ["Grosso Salvatore", "Manca Federico"]);
  assert.deepEqual(
    { listed: merged[1].listed, points: merged[1].points, average: merged[1].average, rosterRole: merged[1].rosterRole },
    { listed: 0, points: 0, average: null, rosterRole: 1 },
  );
});

test("mergeRoster: a player in a box score but not in the roster is kept without a roster role", () => {
  const merged = mergeRoster([stat("Nuovo Arrivo")], [{ name: "Manca Federico", role: 1 }]);

  assert.equal(merged[0].name, "Nuovo Arrivo");
  assert.equal(merged[0].rosterRole, undefined);
  assert.equal(merged.length, 2);
});

test("mergeRoster: one box score player is claimed by a single roster entry", () => {
  const merged = mergeRoster([stat("Loi Matteo")], [{ name: "Loi Nicola", role: 2 }, { name: "Loi Matteo", role: 2 }]);

  assert.equal(merged.find((p) => p.name === "Loi Matteo").listed, 1);
  assert.equal(merged.find((p) => p.name === "Loi Nicola").listed, 0);
});

test("ROSTER: the 18 players of the squad sheet, every role one of the five known ones", () => {
  assert.equal(ROSTER.length, 18);
  assert.equal(new Set(ROSTER.map((p) => p.name)).size, 18);
  assert.ok(ROSTER.every((p) => ROLE_LABELS[p.role]));
  assert.deepEqual(ROSTER.filter((p) => p.role === 5).map((p) => p.name), ["Fiori Lorenzo Ozieri", "Ruvioli Lorenzo", "Bonacci Andrea"]);
});
