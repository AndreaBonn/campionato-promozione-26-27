// Rendering of the team players section: imperative shell over team-stats-rules.js.
// No state here: boxscores, rounds and the FIP team name all come from the caller.
import { esc } from "./page-rules.js";
import { ROLE_LABELS, mergeRoster } from "./roster-rules.js";
import { teamPlayerStats } from "./team-stats-rules.js";
import { displayTeamName } from "./view-rules.js";

const AVG_PLACEHOLDER = "-";
const COLUMNS = 8;

const fmtAvg = (avg) =>
  avg === null ? AVG_PLACEHOLDER : avg.toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtShare = (share) => (share === null ? AVG_PLACEHOLDER : Math.round(share * 100) + "%");
const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });

// The name is a button that opens the player's detail row right below (wired in index.html);
// "opt" columns are hidden on phones (styles.css).
function summaryRow(p, i, withBoxscore) {
  const meta = p.rosterRole ? ROLE_LABELS[p.rosterRole] : [p.role, p.age].filter(Boolean).join(", ");
  // a roster player never listed in a box score has nothing to expand
  const label = p.listed ? `<button type="button" class="pl-btn" aria-expanded="false" aria-controls="pl-${i}">${esc(p.name)}</button>` : esc(p.name);
  const name = `${label}${meta ? `<small class="role">${esc(meta)}</small>` : ""}`;
  const known = (value) => (p.listed ? value : AVG_PLACEHOLDER);
  return `<tr><td>${name}</td><td>${known(p.points)}</td><td>${fmtAvg(p.average)}</td><td class="opt">${fmtAvg(p.homeAverage)}</td><td class="opt">${fmtAvg(p.awayAverage)}</td><td>${known(`${p.entered}/${withBoxscore}`)}</td><td class="opt">${known(p.doubleDigit)}</td><td class="opt">${fmtShare(p.teamShare)}</td></tr>`;
}

function last5Item(g) {
  const val = g.pts === "ABS" ? "assente" : g.pts === null ? AVG_PLACEHOLDER : g.pts;
  return `<li>${fmtDate(g.date)} vs ${esc(displayTeamName(g.opponent))}: ${val}</li>`;
}

function detailRow(p, i) {
  if (!p.listed) return "";
  const best = p.best
    ? `${p.best.points} punti contro ${esc(displayTeamName(p.best.opponent))}, ${fmtDate(p.best.date)}`
    : "nessuna partita con punti a referto";
  const last5 = p.last5.map(last5Item).join("");
  return `<tr class="pl-detail" id="pl-${i}" hidden><td colspan="${COLUMNS}"><p>Miglior partita: ${best}.</p><p>Media nelle vittorie: ${fmtAvg(p.winAverage)} · Media nelle sconfitte: ${fmtAvg(p.lossAverage)}.</p><ul class="last5">${last5}</ul></td></tr>`;
}

const TITLE = "<h2>Giocatori dell'Assemini Black</h2>";
const WAITING = "Le statistiche dei giocatori saranno disponibili dopo il primo tabellino dell'Assemini Black.";

// Before the first box score: the squad by role, or only the explanation without a roster.
function renderSquad(roster) {
  if (!roster.length) return `${TITLE}<p>${WAITING}</p>`;
  const rows = roster.map((p) => `<tr><td>${esc(p.name)}</td><td>${ROLE_LABELS[p.role]}</td></tr>`).join("");
  const table = `<div class="scroll"><table class="team-players squad"><thead><tr><th>Giocatore</th><th>Ruolo</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  return `${TITLE}<p>${WAITING}</p>${table}`;
}

// Team players section, rendered after the league scorers table. The caller decides
// when to show the section; here the squad before the team's first box score (the roster is
// the base), or the summary table plus one detail per player, roster players without
// appearances listed last.
export function renderTeamPlayers(boxscores, rounds, fipTeam, roster = []) {
  const stats = teamPlayerStats(boxscores, rounds, fipTeam);
  const { played, withBoxscore, incomplete } = stats.games;
  if (!withBoxscore) return renderSquad(roster);
  const games = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const intro = `Tabellini disponibili per ${games(withBoxscore, "partita", "partite")} su ${games(played, "giocata", "giocate")} dall'Assemini Black${incomplete ? `, di cui ${games(incomplete, "incompleto", "incompleti")}` : ""}.`;
  const head = '<tr><th>Giocatore</th><th>Punti</th><th>Media</th><th class="opt">Casa</th><th class="opt">Trasferta</th><th>Partite</th><th class="opt">Doppia cifra</th><th class="opt">% squadra</th></tr>';
  const rows = mergeRoster(stats.players, roster).map((p, i) => summaryRow(p, i, withBoxscore) + detailRow(p, i)).join("");
  const table = `<div class="scroll"><table class="team-players"><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
  const note = `<details class="howto"><summary>Come leggere la tabella</summary><p>Tocca un nome per la miglior partita e le ultime gare. Le medie contano solo le partite in cui il giocatore è entrato in campo; un trattino indica un giocatore a referto che non è entrato. Sul telefono casa, trasferta, doppia cifra e quota dei punti di squadra si vedono girandolo in orizzontale.</p></details>`;
  return `<h2>Giocatori dell'Assemini Black</h2><p>${intro}</p>${table}${note}`;
}
