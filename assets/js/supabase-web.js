/**
 * Strada — Supabase en navegador (auth, perfiles, clubes, email JWT).
 */
(function () {
  const cfg = () => window.STRADA_CONFIG || {};
  let client = null;
  let active = false;
  let currentUser = null;
  let clubs = [];
  let clubInvites = [];
  let clubRequests = [];
  const profileCache = new Map();

  function isConfigured() {
    const c = cfg();
    return Boolean(c.supabaseUrl?.trim() && c.supabaseAnonKey?.trim());
  }

  function getClient() {
    if (!isConfigured()) return null;
    if (!client) {
      if (!window.supabase?.createClient) {
        console.error('[StradaCloud] Carga @supabase/supabase-js antes que supabase-web.js');
        return null;
      }
      client = window.supabase.createClient(cfg().supabaseUrl.trim(), cfg().supabaseAnonKey.trim(), {
        auth: {
          persistSession: true,
          storage: window.localStorage,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    }
    return client;
  }

  function isActive() {
    return active && isConfigured();
  }

  function emptySocials() {
    return { instagram: '', tiktok: '', x: '', youtube: '' };
  }

  function normalizeSocials(s) {
    const base = emptySocials();
    if (!s || typeof s !== 'object') return base;
    return { ...base, ...s };
  }

  function profileRowToUser(row, authUser) {
    if (!row) return null;
    return {
      id: row.id || authUser?.id,
      name: row.name,
      email: row.email,
      avatarUrl: row.avatar_url || null,
      socials: normalizeSocials(row.socials),
      vehicles: Array.isArray(row.vehicles) ? row.vehicles : [],
    };
  }

  function clubFromRow(row) {
    const description = row.description;
    return {
      id: row.id,
      name: row.name,
      description,
      desc: description,
      vehicleMode: row.vehicle_mode || 'mixto',
      creatorEmail: row.creator_email,
      creatorName: row.creator_name,
      memberEmails: row.member_emails || [],
      createdAt: row.created_at,
      latitude: row.latitude ?? undefined,
      longitude: row.longitude ?? undefined,
      locationLabel: row.location_label ?? undefined,
    };
  }

  function clubToRow(club) {
    const description = club.description || club.desc || '';
    return {
      id: club.id,
      name: club.name,
      description,
      vehicle_mode: club.vehicleMode || 'mixto',
      creator_email: club.creatorEmail,
      creator_name: club.creatorName,
      member_emails: club.memberEmails || [],
      latitude: club.latitude ?? null,
      longitude: club.longitude ?? null,
      location_label: club.locationLabel ?? null,
      created_at: club.createdAt,
    };
  }

  function clubRequestFromRow(row) {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      vehicleMode: row.vehicle_mode || 'mixto',
      latitude: row.latitude ?? undefined,
      longitude: row.longitude ?? undefined,
      locationLabel: row.location_label ?? undefined,
      requesterEmail: row.requester_email,
      requesterName: row.requester_name,
      reviewerEmail: row.reviewer_email ?? undefined,
      status: row.status,
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at ?? undefined,
      reviewedByEmail: row.reviewed_by_email ?? undefined,
      createdClubId: row.created_club_id ?? undefined,
      approvalUnread: row.approval_unread,
    };
  }

  function clubRequestToRow(req) {
    return {
      id: req.id,
      name: req.name,
      description: req.description,
      vehicle_mode: req.vehicleMode || 'mixto',
      latitude: req.latitude ?? null,
      longitude: req.longitude ?? null,
      location_label: req.locationLabel ?? null,
      requester_email: req.requesterEmail,
      requester_name: req.requesterName,
      reviewer_email: req.reviewerEmail ?? null,
      status: req.status,
      created_at: req.createdAt,
      reviewed_at: req.reviewedAt ?? null,
      reviewed_by_email: req.reviewedByEmail ?? null,
      created_club_id: req.createdClubId ?? null,
      approval_unread: !!req.approvalUnread,
    };
  }

  function clubInviteFromRow(row) {
    return {
      id: row.id,
      clubId: row.club_id,
      clubName: row.club_name,
      fromEmail: row.from_email,
      fromName: row.from_name,
      toEmail: row.to_email,
      status: row.status,
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at ?? undefined,
    };
  }

  function clubInviteToRow(inv) {
    return {
      id: inv.id,
      club_id: inv.clubId,
      club_name: inv.clubName,
      from_email: inv.fromEmail,
      from_name: inv.fromName,
      to_email: inv.toEmail,
      status: inv.status,
      created_at: inv.createdAt,
      reviewed_at: inv.reviewedAt ?? null,
    };
  }

  async function fetchProfile(userId) {
    const sb = getClient();
    if (!sb) return null;
    const { data, error } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error || !data) return null;
    return profileRowToUser(data);
  }

  async function updateProfile(user) {
    const sb = getClient();
    if (!sb || !user?.id) return false;
    const { error } = await sb.from('profiles').update({
      name: user.name,
      avatar_url: user.avatarUrl || null,
      socials: user.socials || emptySocials(),
      vehicles: user.vehicles || [],
    }).eq('id', user.id);
    return !error;
  }

  async function loadClubsData() {
    const sb = getClient();
    if (!sb) return;
    const [clubsRes, invitesRes, requestsRes] = await Promise.all([
      sb.from('clubs').select('*').order('created_at', { ascending: false }),
      sb.from('club_invitations').select('*').order('created_at', { ascending: false }),
      sb.from('club_creation_requests').select('*').order('created_at', { ascending: false }),
    ]);
    clubs = (clubsRes.data || []).map(clubFromRow);
    clubInvites = (invitesRes.data || []).map(clubInviteFromRow);
    clubRequests = (requestsRes.data || []).map(clubRequestFromRow).filter(
      (r) => r.status === 'pending' || (r.status === 'approved' && r.approvalUnread),
    );
    clubs.forEach((c) => (c.memberEmails || []).forEach((e) => profileCache.set(e.toLowerCase(), { email: e, name: e })));
  }

  async function persistClub(club) {
    const sb = getClient();
    if (!sb) return;
    await sb.from('clubs').upsert(clubToRow(club));
  }

  async function deleteClub(clubId) {
    const sb = getClient();
    if (!sb) return;
    await sb.from('clubs').delete().eq('id', clubId);
    await sb.from('club_invitations').delete().eq('club_id', clubId);
  }

  async function persistClubRequest(req) {
    const sb = getClient();
    if (!sb) return;
    await sb.from('club_creation_requests').upsert(clubRequestToRow(req));
  }

  async function deleteClubRequest(requestId) {
    const sb = getClient();
    if (!sb) return;
    await sb.from('club_creation_requests').delete().eq('id', requestId);
  }

  async function persistClubInvite(inv) {
    const sb = getClient();
    if (!sb) return;
    await sb.from('club_invitations').upsert(clubInviteToRow(inv));
  }

  async function getAccessToken() {
    const sb = getClient();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function postEmail(path, body) {
    const token = await getAccessToken();
    if (!token) return { ok: false, error: 'Sin sesión' };
    const base = (cfg().emailApi || 'http://127.0.0.1:8788').replace(/\/$/, '');
    try {
      const res = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: data.error || res.status };
      return { ok: true };
    } catch {
      return { ok: false, error: 'Servidor de email no disponible' };
    }
  }

  function authErrorMessage(err) {
    const msg = String(err?.message || '').toLowerCase();
    if (msg.includes('invalid') || msg.includes('credentials')) return 'Correo o contraseña incorrectos.';
    if (msg.includes('already')) return 'Ya existe una cuenta con ese correo.';
    return 'No se pudo completar la operación.';
  }

  async function signIn(email, password) {
    const sb = getClient();
    const { data, error } = await sb.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw new Error(authErrorMessage(error));
    const profile = await fetchProfile(data.user.id);
    active = true;
    currentUser = profile || {
      id: data.user.id,
      name: data.user.user_metadata?.name || email.split('@')[0],
      email: data.user.email,
      avatarUrl: null,
      socials: emptySocials(),
      vehicles: [],
    };
    profileCache.set(currentUser.email.toLowerCase(), { email: currentUser.email, name: currentUser.name });
    await loadClubsData();
    return currentUser;
  }

  async function signUp(name, email, password) {
    const sb = getClient();
    const key = email.trim().toLowerCase();
    const { data, error } = await sb.auth.signUp({
      email: key,
      password,
      options: { data: { name: name.trim() } },
    });
    if (error) throw new Error(authErrorMessage(error));
    if (!data.user) throw new Error('No se pudo crear la cuenta.');
    await new Promise((r) => setTimeout(r, 400));
    const profile = await fetchProfile(data.user.id);
    active = true;
    currentUser = profile || {
      id: data.user.id,
      name: name.trim(),
      email: key,
      avatarUrl: null,
      socials: emptySocials(),
      vehicles: [],
    };
    profileCache.set(currentUser.email.toLowerCase(), { email: currentUser.email, name: currentUser.name });
    clubs = [];
    clubInvites = [];
    clubRequests = [];
    return currentUser;
  }

  async function signOut() {
    const sb = getClient();
    if (sb) await sb.auth.signOut();
    active = false;
    currentUser = null;
    clubs = [];
    clubInvites = [];
    clubRequests = [];
    profileCache.clear();
  }

  async function restoreSession() {
    if (!isConfigured()) return null;
    const sb = getClient();
    const { data } = await sb.auth.getSession();
    if (!data.session?.user) return null;
    const profile = await fetchProfile(data.session.user.id);
    if (!profile) return null;
    active = true;
    currentUser = profile;
    profileCache.set(profile.email.toLowerCase(), { email: profile.email, name: profile.name });
    await loadClubsData();
    return currentUser;
  }

  async function lookupProfileForInvite(email) {
    const sb = getClient();
    if (!sb) return null;
    const key = email.trim().toLowerCase();
    const cached = profileCache.get(key);
    if (cached?.name && cached.name !== cached.email) return cached;
    const { data, error } = await sb.rpc('lookup_profile_for_invite', { target_email: key });
    if (error || !data?.length) return null;
    const row = data[0];
    profileCache.set(key, row);
    return row;
  }

  function getUser() {
    return currentUser;
  }

  window.StradaCloud = {
    isConfigured,
    isActive,
    getClient,
    getUser,
    signIn,
    signUp,
    signOut,
    restoreSession,
    updateProfile,
    getClubs: () => clubs,
    setClubs: (c) => { clubs = c; },
    getClubInvites: () => clubInvites,
    setClubInvites: (i) => { clubInvites = i; },
    getClubRequests: () => clubRequests,
    setClubRequests: (r) => { clubRequests = r; },
    persistClub,
    deleteClub,
    deleteClubRequest,
    persistClubRequest,
    persistClubInvite,
    postEmail,
    lookupProfileForInvite,
    loadClubsData,
  };
})();
