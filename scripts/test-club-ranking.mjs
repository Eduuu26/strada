/**
 * Pruebas de lógica del ranking de clubes.
 * node scripts/test-club-ranking.mjs
 */

const results = [];
const pass = (n, d = '') => {
  results.push({ n, ok: true, d });
  console.log(`✓ ${n}${d ? ` — ${d}` : ''}`);
};
const fail = (n, d = '') => {
  results.push({ n, ok: false, d });
  console.error(`✗ ${n}${d ? ` — ${d}` : ''}`);
};
const assert = (cond, name, detail = '') => {
  if (cond) pass(name, detail);
  else fail(name, detail);
};

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function memberSet(club) {
  return new Set(club.memberEmails.map(normalizeEmail));
}

function computeClubStats(club, input) {
  const members = memberSet(club);
  const isMember = (email) => email && members.has(normalizeEmail(email));

  const routeCount = input.routes.filter((r) => isMember(r.creatorEmail)).length;
  const meetupCount = input.meetups.filter((m) => isMember(m.creatorEmail)).length;
  const eventCount = routeCount + meetupCount;

  const chat = input.chats.find((c) => c.clubId === club.id);
  const chatMessages = chat?.messages.filter((m) => m.type === 'user').length ?? 0;

  const acceptedInvites = input.invitations.filter(
    (inv) => inv.clubId === club.id && inv.status === 'accepted',
  ).length;

  const memberSignups = input.signups.filter((s) => members.has(normalizeEmail(s.userEmail))).length;

  const interactionScore =
    chatMessages * 2 + acceptedInvites * 5 + memberSignups * 3 + routeCount * 8 + meetupCount * 10;

  const overallScore = club.memberEmails.length * 10 + eventCount * 18 + interactionScore;

  return {
    clubId: club.id,
    memberCount: club.memberEmails.length,
    routeCount,
    meetupCount,
    eventCount,
    chatMessages,
    acceptedInvites,
    memberSignups,
    interactionScore,
    overallScore,
  };
}

function scoreForMetric(stats, metric) {
  switch (metric) {
    case 'members':
      return stats.memberCount;
    case 'events':
      return stats.eventCount;
    case 'interactions':
      return stats.interactionScore;
    default:
      return stats.overallScore;
  }
}

function buildClubRanking(input, metric) {
  const rows = input.clubs.map((club) => ({ club, ...computeClubStats(club, input) }));
  rows.sort((a, b) => scoreForMetric(b, metric) - scoreForMetric(a, metric));
  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

const madrid = {
  id: 'club_madrid',
  name: 'Madrid Drivers',
  memberEmails: ['carlos@strada.es', 'laura@strada.es', 'ana@strada.es'],
};
const valencia = {
  id: 'club_valencia',
  name: 'Valencia Club',
  memberEmails: ['miguel@strada.es'],
};

const input = {
  clubs: [valencia, madrid],
  routes: [
    { creatorEmail: 'laura@strada.es' },
    { creatorEmail: 'carlos@strada.es' },
    { creatorEmail: 'miguel@strada.es' },
  ],
  meetups: [{ creatorEmail: 'laura@strada.es' }],
  signups: [{ userEmail: 'carlos@strada.es' }, { userEmail: 'carlos@strada.es' }],
  invitations: [
    { clubId: 'club_madrid', status: 'accepted' },
    { clubId: 'club_madrid', status: 'accepted' },
  ],
  chats: [
    {
      clubId: 'club_madrid',
      messages: [{ type: 'user' }, { type: 'user' }, { type: 'system' }],
    },
  ],
};

const madridStats = computeClubStats(madrid, input);
assert(madridStats.routeCount === 2, 'rutas por miembros del club Madrid', String(madridStats.routeCount));
assert(madridStats.meetupCount === 1, 'quedadas por miembros del club Madrid');
assert(madridStats.memberCount === 3, 'conteo de miembros');

const byMembers = buildClubRanking(input, 'members');
assert(byMembers[0].club.id === 'club_madrid', 'ranking miembros: Madrid primero');

const byEvents = buildClubRanking(input, 'events');
assert(byEvents[0].club.id === 'club_madrid', 'ranking eventos: Madrid primero');

const byOverall = buildClubRanking(input, 'overall');
assert(byOverall[0].club.id === 'club_madrid', 'ranking general: Madrid primero');
assert(byOverall[0].rank === 1 && byOverall[1].rank === 2, 'ranks consecutivos');

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} OK`);
if (failed) process.exit(1);
