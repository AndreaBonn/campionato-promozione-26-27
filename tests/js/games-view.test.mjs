import assert from "node:assert/strict";
import { test } from "node:test";

import { renderCard, renderForm, renderLast, renderList, renderNext } from "../../docs/games-view.js";
import { formSummary } from "../../docs/page-rules.js";

process.env.TZ = "Europe/Rome";

const CUS = "CUS CAGLIARI";
const TODAY = new Date("2026-10-08T00:00:00");
function game(n, date, overrides = {}) {
  return {
    round: "A" + n, n, home: "CUS Cagliari", away: "Avversario " + n, is_home: true, fip_opponent: "AVVERSARIO " + n,
    date, time: "18:00", venue: { name: "PALACUS", address: "Via Is Mirrionis 3 - 9 09123 CAGLIARI (CA)" },
    official: { date, time: "18:00", venue: { name: "PALACUS" } }, changes: [], status: "non-designata",
    status_text: "", referees: [], score: null, ...overrides,
  };
}
const played = (n, date, home, away, overrides = {}) => game(n, date, { score: { home, away }, status: "omologata", ...overrides });
const context = (games, overrides = {}) => ({
  games, rounds: [], standings: [], logos: {}, boxscores: {}, today: TODAY, fipTeam: CUS, breaks: [], ...overrides,
});
const gamesIn = (html) => [...html.matchAll(/Gara n\. (\d+)/g)].map((m) => Number(m[1]));

test("list: «Prossime» leaves out the next game, already in the hero box", () => {
  const ctx = context([played(1, "2026-10-03", 55, 62), game(2, "2026-10-11"), game(3, "2026-10-18")]);

  assert.deepEqual(gamesIn(renderList(ctx, "all", "upcoming")), [3]);
  assert.deepEqual(gamesIn(renderList(ctx, "all", "all")), [1, 2, 3]);
});

test("list: «Giocate» shows played games newest first", () => {
  const ctx = context([played(1, "2026-10-03", 55, 62), played(2, "2026-10-05", 70, 60), game(3, "2026-10-18")]);

  assert.deepEqual(gamesIn(renderList(ctx, "all", "played")), [2, 1]);
});

test("list: empty states say why, the next game alone points to the hero box", () => {
  const onlyNext = context([game(2, "2026-10-11")]);
  const none = context([game(2, "2026-10-11")]);

  assert.match(renderList(onlyNext, "all", "upcoming"), /L'unica partita da giocare con questo filtro è la prossima, in alto\./);
  assert.match(renderList(none, "all", "played"), /Nessuna partita giocata con questo filtro\./);
});

test("card: a result says «Vinta» or «Persa» in words, not only in colour", () => {
  const ctx = context([]);

  assert.match(renderCard(played(1, "2026-10-03", 70, 60), ctx), /<span class="score win">70-60<\/span><span class="vp win">Vinta<\/span>/);
  assert.match(renderCard(played(2, "2026-10-03", 55, 62), ctx), /<span class="vp loss">Persa<\/span>/);
});

test("card: round on top, game number at the bottom, a moved game tagged «Spostata»", () => {
  const html = renderCard(game(17, "2026-10-18", { round: "A3", changes: ["time"], official: { date: "2026-10-18", time: "17:00", venue: { name: "PALACUS" } } }), context([]));

  assert.match(html, /<div class="rnd">3ª giornata di andata<\/div>/);
  assert.match(html, /<span class="tag chg">Spostata<\/span>/);
  assert.match(html, /<div class="meta">Gara n\. 17, arbitri non ancora designati<\/div>/);
});

test("card: the CUS box score opens inside a played game's card, none before it exists", () => {
  const m = played(6, "2026-10-03", 55, 62);
  const boxscores = { 6: { status: "complete", url: null, home: { players: [{ id: "a", name: "Rossi", pts: 15 }] }, away: { players: [] } } };

  assert.match(renderCard(m, context([], { boxscores })), /<details class="cardbox"><summary>Tabellino<\/summary>.*<td>Rossi<\/td><td>15<\/td>/s);
  assert.doesNotMatch(renderCard(m, context([])), /cardbox/);
});

test("hero: countdown in words, directions and calendar links, a share button", () => {
  const html = renderNext(context([game(2, "2026-10-09")]));

  assert.match(html, /<div class="w"><b>Domani<\/b><small>ore 18:00<\/small><\/div>/);
  assert.match(html, /class="primary" href="https:\/\/www\.google\.com\/maps\/search\/[^"]*"[^>]*>.*Indicazioni<\/a>/);
  assert.match(html, /href="https:\/\/calendar\.google\.com\/[^"]*"[^>]*>.*Calendario<\/a>/);
  assert.match(html, /<button type="button" id="share">.*Condividi<\/button>/);
});

test("last result: the latest played game with its verdict, nothing before the first", () => {
  const html = renderLast(context([played(1, "2026-10-03", 55, 62), played(2, "2026-10-05", 70, 60), game(3, "2026-10-18")]));

  assert.match(html, /^<span class="vp win">Vinta<\/span>.*Ultimo risultato · 2ª giornata di andata.*<div class="res">70-60<\/div>/);
  assert.equal(renderLast(context([game(3, "2026-10-18")])), "");
});

test("form strip: «Ultima» for one game, no zero split for a side not played yet", () => {
  const html = renderForm(formSummary([played(1, "2026-10-03", 62, 55, { is_home: false })]));

  assert.match(html, /<b>0-1<\/b> vinte e perse/);
  assert.match(html, /Ultima: <span class="badge loss"/);
  assert.match(html, /<span class="meta">In trasferta 0-1<\/span>/);
  assert.doesNotMatch(html, /In casa/);
});

test("list: the hero hint only when the next game matches the home/away filter", () => {
  const ctx = context([game(2, "2026-10-11", { is_home: false })]);

  assert.match(renderList(ctx, "home", "upcoming"), /Nessuna partita con questo filtro\./);
  assert.match(renderList(ctx, "away", "upcoming"), /è la prossima, in alto/);
});

// FIP writes 30/06/2027 for a game whose date is not set yet (comunicato DR2 Sud A, games 834, 944)
const TBD = "2027-06-30";

test("hero: a game without a date is never the next game", () => {
  const ctx = context([game(1, TBD), game(2, "2026-10-17")]);

  const html = renderNext(ctx);

  assert.match(html, /Avversario 2/);
  assert.doesNotMatch(html, /Avversario 1/);
  assert.doesNotMatch(html, /giugno/);
});

test("list: games without a date come last, under «Data da definire», without calendar link", () => {
  const ctx = context([game(1, TBD), game(2, "2026-10-17"), game(3, "2026-10-24")]);

  const html = renderList(ctx, "all", "all");

  assert.deepEqual(gamesIn(html), [2, 3, 1]);
  const tbd = html.slice(html.indexOf('<h2 class="tbd">Data da definire</h2>'));
  assert.match(tbd, /Gara n\. 1/);
  assert.match(tbd, /da definire/);
  assert.doesNotMatch(tbd, /giugno/);
  assert.doesNotMatch(tbd, /Calendario/);
  assert.match(html.slice(0, html.indexOf('<h2 class="tbd">Data da definire</h2>')), /Calendario/);
});

test("card: a date set later shows the placeholder as «data da definire»", () => {
  const m = game(1, "2026-11-04", { official: { date: TBD, time: "18:00", venue: { name: "PALACUS" } }, changes: ["date"] });

  const html = renderCard(m, context([m]));

  assert.match(html, /Prima: <del>data da definire<\/del>/);
  assert.doesNotMatch(html, /giugno/);
});

// A league round as fip.it lists it: the opponent's results, the source of its record on the card
const leagueGame = (n, date, home, away, score) => ({ n, date, time: "18:00", home, away, score, status: "omologata" });

test("card: an upcoming game shows the opponent's record and standing", () => {
  const rounds = [{ games: [
    leagueGame(90, "2026-10-03", "AVVERSARIO 2", "X", { home: 70, away: 60 }),
    leagueGame(91, "2026-10-05", "Y", "AVVERSARIO 2", { home: 80, away: 61 }),
  ] }];
  const standings = [{ team: "AVVERSARIO 2", position: 3, played: 2 }];

  const html = renderCard(game(2, "2026-10-11"), context([], { rounds, standings }));

  assert.match(html, /<span class="c">3ª in classifica<\/span><span class="c">1 vinta, 1 persa<\/span><span class="c">65,5 fatti, 70,0 subiti di media<\/span><span class="badge win"[^>]*>V<\/span><span class="badge loss"/);
});

test("card: no standing for the opponent before the standings exist, no record for a played game", () => {
  const rounds = [{ games: [leagueGame(90, "2026-10-03", "AVVERSARIO 2", "X", { home: 70, away: 60 })] }];

  const upcoming = renderCard(game(2, "2026-10-11"), context([], { rounds }));
  const done = renderCard(played(2, "2026-10-11", 70, 60), context([], { rounds }));

  assert.match(upcoming, /<span class="lead">Avversario<\/span><span class="c">1 vinta, 0 perse<\/span>/);
  assert.doesNotMatch(done, /oppchips/);
});

test("card: an away game puts the team second, in bold, with the crests on the right side", () => {
  const logos = { [CUS]: { file: "logos/cus.png" }, "AVVERSARIO 4": { file: "logos/avv.png" } };
  const m = game(4, "2026-10-11", { is_home: false, home: "Avversario 4", away: "CUS Cagliari" });

  const html = renderCard(m, context([], { logos }));

  assert.match(html, /<span class="tag">Trasferta<\/span>/);
  assert.match(html, /<span><img class="crest " src="logos\/avv\.png"[^>]*>Avversario 4<\/span><em>-<\/em><span><strong>CUS Cagliari<\/strong><img class="crest away" src="logos\/cus\.png"/);
});

test("card: Giudice Sportivo sanctions listed on the game, escaped", () => {
  const html = renderCard(played(1, "2026-10-03", 70, 60, { sanctions: ["Ammenda <50 €>"] }), context([]));

  assert.match(html, /<div class="sanc-card"><strong>Provvedimenti del Giudice Sportivo su questa gara<\/strong><ul><li>Ammenda &lt;50 €&gt;<\/li><\/ul><\/div>/);
});

test("card: a result not yet homologated carries its tag, a suspended one as an alert", () => {
  const unofficial = renderCard(played(1, "2026-10-03", 70, 60, { status: "ufficioso" }), context([]));
  const suspended = renderCard(played(2, "2026-10-03", 70, 60, { status: "sospesa" }), context([]));

  assert.match(unofficial, /<span class="tag prov">ufficioso<\/span>/);
  assert.match(suspended, /<span class="tag prov alert">omologazione sospesa<\/span>/);
});

test("card: referees by name, or a note when designated but not published yet", () => {
  const named = renderCard(game(1, "2026-10-11", { status: "designata", referees: ["ROSSI MARIO", "BIANCHI LUCA"] }), context([]));
  const hidden = renderCard(game(2, "2026-10-11", { status: "designata-nonvisibile" }), context([]));

  assert.match(named, /<div class="ref">Arbitri: ROSSI MARIO; BIANCHI LUCA<\/div>/);
  assert.match(hidden, /<div class="ref pend">Arbitri designati; i nomi non sono ancora stati pubblicati\.<\/div>/);
  assert.match(hidden, /<div class="meta">Gara n\. 2<\/div>/);
});

test("card: a return game recalls the first-leg result against the same opponent", () => {
  const first = played(1, "2026-10-03", 70, 60, { away: "Avversario X" });
  const second = game(14, "2027-01-10", { round: "R1", away: "Avversario X" });

  const html = renderCard(second, context([first, second]));

  assert.match(html, /<div class="leg">All'andata: CUS Cagliari - Avversario X 70-60<\/div>/);
});

test("card: a game before today is marked past", () => {
  assert.match(renderCard(played(1, "2026-10-03", 70, 60), context([])), /<article class="g home past played">/);
  assert.match(renderCard(game(2, "2026-10-11"), context([])), /<article class="g home  ">/);
});

test("list: a break between two games appears in its place, under its month", () => {
  const ctx = context([game(2, "2026-10-11"), game(3, "2026-11-08"), game(4, "2026-11-15")], { breaks: [["2026-11-01", "Sosta del campionato"]] });

  const html = renderList(ctx, "all", "all");

  assert.match(html, /Gara n\. 2.*<h2>novembre 2026<\/h2><p class="sosta">Sosta del campionato<\/p>.*Gara n\. 3/s);
});

test("hero: «Stagione regolare conclusa» when no game is left to play", () => {
  assert.equal(renderNext(context([played(1, "2026-10-03", 70, 60)])), "<div class='m'>Stagione regolare conclusa</div>");
});

test("hero: referees and the FIP change against the comunicato", () => {
  const m = game(2, "2026-10-11", { referees: ["ROSSI MARIO"], changes: ["venue"], venue: { name: "PALAZZETTO NUOVO", address: "Via X" } });

  const html = renderNext(context([m]));

  assert.match(html, /<small>Spostata dalla FIP\. Campo prima: <del>PALACUS<\/del><\/small><small>Arbitri: ROSSI MARIO<\/small>/);
  assert.match(html, /<small>tra<\/small><b>3 giorni<\/b>/);
});

test("last result: a provisional result carries its tag", () => {
  const html = renderLast(context([played(1, "2026-10-03", 70, 60, { status: "ufficioso" })]));

  assert.match(html, /<div class="res">70-60<small class="prov">ufficioso<\/small><\/div>/);
});

test("form strip: «Ultime N» counts the games shown, wins as V", () => {
  const html = renderForm(formSummary([played(1, "2026-10-03", 70, 60), played(2, "2026-10-05", 55, 62)]));

  assert.match(html, /Ultime 2: <span class="badge win" title="Vittoria">V<\/span><span class="badge loss"/);
  assert.match(html, /<span class="meta">In casa 1-1<\/span>/);
});
