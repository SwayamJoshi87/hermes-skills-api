// API client — hits the hermes-skills-api endpoints on the same origin
const BASE = '/api';

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getHealth() {
  return fetchJSON(`${BASE}/health`);
}

export async function getAllSkills() {
  return fetchJSON(`${BASE}/skills/all`);
}

export async function getInstalledSkills(source) {
  const qs = source ? `?source=${source}` : '';
  return fetchJSON(`${BASE}/skills${qs}`);
}

export async function getSkill(name) {
  return fetchJSON(`${BASE}/skills/${encodeURIComponent(name)}`);
}

export async function getSkillFiles(name) {
  return fetchJSON(`${BASE}/skills/${encodeURIComponent(name)}/files`);
}

export async function searchSkills(query, source, limit = 10) {
  return fetchJSON(`${BASE}/skills/search`, {
    method: 'POST',
    body: JSON.stringify({ query, source: source || 'all', limit }),
  });
}

export async function installSkill(identifier, category) {
  return fetchJSON(`${BASE}/skills/install`, {
    method: 'POST',
    body: JSON.stringify({ identifier, category }),
  });
}

export async function uninstallSkill(name) {
  return fetchJSON(`${BASE}/skills/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
}

export async function inspectSkill(identifier) {
  return fetchJSON(`${BASE}/skills/inspect`, {
    method: 'POST',
    body: JSON.stringify({ identifier }),
  });
}

export async function getSources() {
  return fetchJSON(`${BASE}/sources`);
}
