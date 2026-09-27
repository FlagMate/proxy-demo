import './demo.css';

/**
 * ProxyCeptor SDK — Live Interactive Demo & Sandbox
 * Modern ES6 Module Implementation.
 */

// Capture pristine fetch BEFORE SDK patches it
const ORIGINAL_FETCH = window.fetch ? window.fetch.bind(window) : null;

const $ = (id) => document.getElementById(id);

function getServerUrl() {
  if (typeof window !== 'undefined' && window.location) {
    const q = new URLSearchParams(window.location.search);
    if (q.get('server') || q.get('backend') || q.get('api')) {
      return (q.get('server') || q.get('backend') || q.get('api')).replace(/\/+$/, '');
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
  }
  const sdm = window.ProxyCeptor || window.SuperDebug;
  if (sdm) {
    if (typeof sdm.getServerUrl === 'function') return sdm.getServerUrl();
    if (sdm.DEFAULT_SERVER_URL) return sdm.DEFAULT_SERVER_URL;
  }
  return 'https://api.proxyceptor.com';
}

const state = {
  connected: false,
  server: getServerUrl(),
  apiKey: '',
  cloudRules: [],
  localDisabled: {},
  master: true,
  pollTimer: null,
  lastSig: '',
  selectedExampleId: '4.1'
};

function computeEffective() {
  if (!state.master) return [];
  return state.cloudRules.filter((r) => {
    if (state.localDisabled[r.id]) return false;
    return r.enabled !== false;
  });
}

function applyToSdk() {
  const sdm = window.ProxyCeptor || window.SuperDebug;
  if (sdm && typeof sdm.setRules === 'function') {
    sdm.setRules(computeEffective());
  }
}

function ruleActions(r) {
  const out = [];
  if (r.block) out.push('block');
  const req = r.request || {};
  const res = r.response || {};
  if (req.redirectUrl) out.push('redirect');
  if (req.urlRewrite && req.urlRewrite.find) out.push('rewrite');
  if ((res.headers && res.headers.length) || (req.headers && req.headers.length)) out.push('headers');
  if (res.body && res.body.enabled) out.push('mock');
  if (req.body && req.body.enabled) out.push('mock');
  if (typeof req.delay === 'number' && req.delay > 0) out.push('delay');
  return out.length ? out : ['headers'];
}

function ruleSummary(r) {
  const m = r.match || {};
  const pattern = m.urlPattern || '*';
  const methods = (m.methods && m.methods.join('/')) || '*';
  return `${methods}  ${pattern}`;
}

function renderRules() {
  const list = $('rules-list');
  if (!list) return;
  list.className = `rules-list${state.master ? '' : ' dimmed'}`;
  if (!state.cloudRules.length) {
    list.innerHTML = '<div class="empty">No rules yet. Create one in the dashboard and hit “Sync now”.</div>';
    return;
  }
  list.innerHTML = '';
  state.cloudRules.forEach((r) => {
    const on = !state.localDisabled[r.id] && r.enabled !== false;
    const row = document.createElement('div');
    row.className = `rule${on ? '' : ' off'}`;

    const tags = ruleActions(r).map((a) => `<span class="tag ${a}">${a}</span>`).join(' ');

    row.innerHTML = `
      <div class="r-main">
        <div class="r-name">${escapeHtml(r.name)} ${tags}${r.enabled === false ? ' <span class="tag" style="color:var(--faint);border-color:var(--border)">disabled in cloud</span>' : ''}</div>
        <div class="r-desc">${escapeHtml(ruleSummary(r))}</div>
      </div>
    `;

    const sw = document.createElement('label');
    sw.className = 'switch';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = on;
    cb.disabled = r.enabled === false;
    cb.addEventListener('change', () => {
      if (cb.checked) delete state.localDisabled[r.id];
      else state.localDisabled[r.id] = true;
      applyToSdk();
      renderRules();
      addLog('info', `${cb.checked ? 'Enabled' : 'Disabled'} rule locally: ${r.name}`, '');
    });
    const slider = document.createElement('span');
    slider.className = 'slider';
    sw.appendChild(cb);
    sw.appendChild(slider);
    row.appendChild(sw);
    list.appendChild(row);
  });
}

async function syncRules(showToast = true) {
  const base = state.server.replace(/\/+$/, '');
  const fetcher = ORIGINAL_FETCH || window.fetch.bind(window);
  try {
    const res = await fetcher(`${base}/public/rules?includeDisabled=1`, {
      headers: { 'X-API-Key': state.apiKey },
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const rules = (json && json.data && json.data.rules) || [];
    const sig = JSON.stringify(rules.map((x) => [x.id, x.name, x.enabled, x.updatedAt]));
    const changed = sig !== state.lastSig;
    state.lastSig = sig;
    state.cloudRules = rules;
    applyToSdk();
    renderRules();
    if (changed && state.connected) {
      setStep('step-rules', 'done');
      if (showToast) addLog('sync', `Synced ${rules.length} rule(s) from cloud`, 'applied');
    }
    return rules;
  } catch (e) {
    addLog('sync', `Sync failed: ${e.message}`, 'blocked');
    throw e;
  }
}

async function connect() {
  const keyInput = $('apikey');
  let apiKey = keyInput ? keyInput.value.trim() : '';
  const msg = $('connect-msg');
  if (!apiKey) {
    if (msg) {
      msg.hidden = false;
      msg.className = 'msg err';
      msg.textContent = 'Enter your API key to start.';
    }
    return;
  }

  // Guard against masked bullets
  if (/[\u2022\u25cf\u22c5]/.test(apiKey)) {
    if (msg) {
      msg.hidden = false;
      msg.className = 'msg err';
      msg.textContent = 'API key contains masked bullets (•••). Please reveal and copy the full key from Workspace Settings → API Keys.';
    }
    return;
  }
  apiKey = apiKey.replace(/[^\x20-\x7E]/g, '');

  const server = state.server || getServerUrl();
  state.apiKey = apiKey;
  state.server = server;

  const btn = $('connect-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Connecting…';
  }

  const fetcher = ORIGINAL_FETCH || window.fetch.bind(window);
  try {
    const res = await fetcher(`${server.replace(/\/+$/, '')}/public/verify`, {
      headers: { 'X-API-Key': apiKey },
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(res.status === 401 ? 'Invalid or revoked API key' : `HTTP ${res.status}`);
    const json = await res.json();
    const ws = json && json.data && json.data.workspace;

    const sdm = window.ProxyCeptor || window.SuperDebug;
    if (sdm && typeof sdm.init === 'function') {
      sdm.init({ apiKey, refreshInterval: 0, debug: true });
    }

    state.connected = true;
    setConn(true, ws ? ws.name : 'connected');
    if (msg) {
      msg.hidden = false;
      msg.className = 'msg ok';
      msg.textContent = `Connected to “${ws ? ws.name : 'workspace'}”. Rules are now syncing live.`;
    }
    setStep('step-connect', 'done');
    setStep('step-rules', 'active');
    const wf = $('workflow');
    if (wf) wf.hidden = false;

    await syncRules(false);

    if (state.pollTimer) clearInterval(state.pollTimer);
    state.pollTimer = setInterval(() => {
      syncRules(true).catch(() => {});
    }, 300000);
  } catch (e) {
    if (msg) {
      msg.hidden = false;
      msg.className = 'msg err';
      msg.textContent = `Could not connect: ${e.message}`;
    }
    setConn(false);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Connect & start';
    }
  }
}

// 10 Preset Examples (4.1 to 4.10)
export const EXAMPLES = [
  {
    id: '4.1',
    title: 'GET Basic Request',
    method: 'GET',
    desc: 'Simple baseline GET request without custom headers or payload',
    url: 'https://jsonplaceholder.typicode.com/todos/1',
    headers: null,
    body: null,
    chips: ['GET', 'No Headers', 'No Payload']
  },
  {
    id: '4.2',
    title: 'GET with Custom Headers',
    method: 'GET',
    desc: 'GET request with Authorization Bearer and custom diagnostic headers',
    url: 'https://jsonplaceholder.typicode.com/users/1',
    headers: {
      'Authorization': 'Bearer sdm_live_sample_token_xyz',
      'X-Client-Version': '2.5.0',
      'Accept': 'application/json'
    },
    body: null,
    chips: ['GET', '+Headers', 'No Payload']
  },
  {
    id: '4.3',
    title: 'POST with JSON Payload',
    method: 'POST',
    desc: 'POST sending JSON body with default Content-Type header',
    url: 'https://jsonplaceholder.typicode.com/posts',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'ProxyCeptor Test Post',
      body: 'Testing proxy interception with JSON payload',
      userId: 1
    }, null, 2),
    chips: ['POST', '+JSON Payload']
  },
  {
    id: '4.4',
    title: 'POST with Payload & Headers',
    method: 'POST',
    desc: 'POST combining JSON body with custom auth and trace headers',
    url: 'https://jsonplaceholder.typicode.com/comments',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sdm_live_auth_sample_token',
      'X-Request-Source': 'ProxyCeptor-SDK',
      'X-Trace-Id': 'trace-88219'
    },
    body: JSON.stringify({
      postId: 1,
      name: 'QA Automation Bot',
      email: 'qa@proxyceptor.com',
      body: 'Verifying payload interception and custom headers simultaneously.'
    }, null, 2),
    chips: ['POST', '+Headers', '+Payload']
  },
  {
    id: '4.5',
    title: 'GET with Query & Cache Headers',
    method: 'GET',
    desc: 'GET query filter with explicit Cache-Control and Pragma headers',
    url: 'https://jsonplaceholder.typicode.com/comments?postId=1&limit=5',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    },
    body: null,
    chips: ['GET', '+Query', '+Headers']
  },
  {
    id: '4.6',
    title: 'POST with Form URL-Encoded',
    method: 'POST',
    desc: 'POST with application/x-www-form-urlencoded form string payload',
    url: 'https://jsonplaceholder.typicode.com/posts',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'title=Form+Encoded+Article&body=Testing+form+urlencoded+body+format&userId=42',
    chips: ['POST', '+Form Body', '+Headers']
  },
  {
    id: '4.7',
    title: 'POST with Entity Update Payload',
    method: 'POST',
    desc: 'POST entity update payload with conditional headers and API version tag',
    url: 'https://jsonplaceholder.typicode.com/posts',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Version': 'v2.5',
      'If-Match': '"e0384a2f"'
    },
    body: JSON.stringify({
      id: 101,
      title: 'Updated Post via POST',
      body: 'Overwriting existing entity payload with modified fields',
      userId: 1
    }, null, 2),
    chips: ['POST', '+Version Header', '+Payload']
  },
  {
    id: '4.8',
    title: 'POST with Nested JSON & Trace',
    method: 'POST',
    desc: 'POST with multi-level nested JSON object and correlation ID header',
    url: 'https://jsonplaceholder.typicode.com/posts',
    headers: {
      'Content-Type': 'application/json',
      'X-Correlation-ID': 'corr-uuid-9482'
    },
    body: JSON.stringify({
      session: {
        id: 'sess_live_99',
        user: {
          id: 101,
          roles: ['developer', 'admin'],
          preferences: { theme: 'dark', debug: true }
        }
      },
      action: 'deep_merge_verify'
    }, null, 2),
    chips: ['POST', '+Nested JSON', '+Trace ID']
  },
  {
    id: '4.9',
    title: 'GET with Accept Headers',
    method: 'GET',
    desc: 'GET content negotiation testing Accept and Accept-Language headers',
    url: 'https://jsonplaceholder.typicode.com/albums/1',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'X-App-Env': 'staging'
    },
    body: null,
    chips: ['GET', '+Accept Headers']
  },
  {
    id: '4.10',
    title: 'POST Batch Telemetry & Device Headers',
    method: 'POST',
    desc: 'POST array of telemetry events with device platform headers',
    url: 'https://jsonplaceholder.typicode.com/posts',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Platform': 'SmartTV_Tizen',
      'X-SDK-Version': '2.5.0'
    },
    body: JSON.stringify({
      events: [
        { type: 'player_init', ts: 1726912340 },
        { type: 'vst_start', vst_ms: 420 },
        { type: 'first_frame_rendered', bitrate_kbps: 4500 }
      ]
    }, null, 2),
    chips: ['POST', '+Batch Array', '+Device Headers']
  }
];

function renderExamplesGrid() {
  const grid = $('examples-grid');
  if (!grid) return;
  grid.innerHTML = '';
  EXAMPLES.forEach((ex) => {
    const card = document.createElement('div');
    const isAct = state.selectedExampleId === ex.id;
    card.className = `ex-card${isAct ? ' active' : ''}`;
    card.dataset.id = ex.id;

    const chipsHtml = (ex.chips || []).map((c) => {
      const isHigh = c.startsWith('+');
      return `<span class="ex-chip${isHigh ? ' highlight' : ''}">${escapeHtml(c)}</span>`;
    }).join('');

    card.innerHTML = `
      <div class="ex-top">
        <span class="ex-badge">${ex.id}</span>
        <span class="ex-method ${ex.method.toLowerCase()}">${ex.method}</span>
      </div>
      <div class="ex-title" title="${escapeHtml(ex.title)}">${escapeHtml(ex.title)}</div>
      <div class="ex-chips">${chipsHtml}</div>
    `;

    card.addEventListener('click', () => {
      selectExample(ex.id);
    });
    grid.appendChild(card);
  });
}

function selectExample(id) {
  state.selectedExampleId = id;
  const ex = EXAMPLES.find((e) => e.id === id) || EXAMPLES[0];
  loadExample(ex);

  const cards = document.querySelectorAll('.ex-card');
  cards.forEach((c) => {
    if (c.dataset.id === id) c.classList.add('active');
    else c.classList.remove('active');
  });
}

function loadExample(ex) {
  if (!ex) return;
  if ($('req-url')) $('req-url').value = ex.url;
  if ($('req-method')) {
    $('req-method').value = ex.method;
    $('req-method').disabled = true;
  }
  if ($('active-ex-num')) $('active-ex-num').textContent = ex.id;
  if ($('active-ex-title')) $('active-ex-title').textContent = ex.title;
  if ($('active-ex-desc')) $('active-ex-desc').textContent = ex.desc;

  const headPre = $('meta-headers');
  const headBadge = $('meta-headers-count');
  if (headPre && headBadge) {
    if (ex.headers && Object.keys(ex.headers).length > 0) {
      headPre.textContent = JSON.stringify(ex.headers, null, 2);
      headBadge.textContent = `${Object.keys(ex.headers).length} set`;
      headBadge.style.color = 'var(--accent-bright)';
    } else {
      headPre.textContent = '(None)';
      headBadge.textContent = 'None';
      headBadge.style.color = '';
    }
  }

  const bodyPre = $('meta-body');
  const bodyBadge = $('meta-body-badge');
  if (bodyPre && bodyBadge) {
    if (ex.body) {
      bodyPre.textContent = ex.body;
      bodyBadge.textContent = ex.method === 'POST' && ex.body.startsWith('{') ? 'JSON' : 'Form/Text';
      bodyBadge.style.color = 'var(--accent-bright)';
    } else {
      bodyPre.textContent = '(None)';
      bodyBadge.textContent = 'None';
      bodyBadge.style.color = '';
    }
  }
}

async function runRequest() {
  const ex = EXAMPLES.find((e) => e.id === state.selectedExampleId) || EXAMPLES[0];
  const url = ($('req-url')?.value || '').trim() || ex.url;
  const method = ex.method;
  const transport = $('req-transport')?.value || 'fetch';
  const headers = ex.headers;
  const body = ex.body;
  if (!url) return;

  setStep('step-run', 'done');

  if ($('resp-mode')) $('resp-mode').className = 'dot green';
  if ($('resp-label')) $('resp-label').textContent = 'Response';
  if ($('resp-meta')) $('resp-meta').textContent = 'sending…';
  if ($('resp')) $('resp').textContent = '…';

  try {
    let r;
    if (transport === 'xhr') {
      r = await doXhr(url, method, headers, body);
    } else {
      r = await doRequest(window.fetch, url, method, headers, body);
    }
    if ($('resp-meta')) {
      $('resp-meta').textContent = `${r.status} · ${r.bytes} bytes${r.ms != null ? ` · ${r.ms}ms` : ''} [${transport}]`;
    }
    if ($('resp')) $('resp').textContent = pretty(r.body);
    addLog(`${method} [${transport}]`, url, String(r.status));
  } catch (e) {
    if ($('resp-meta')) $('resp-meta').textContent = `error [${transport}]`;
    if ($('resp')) $('resp').textContent = String((e && e.message) || e);
    addLog(`${method} [${transport}]`, url, 'error');
  }
}

function doRequest(fetchFn, url, method, headers, body) {
  const t0 = performance.now();
  const opts = { method };
  if (headers && Object.keys(headers).length > 0) {
    opts.headers = headers;
  }
  if (body && method !== 'GET' && method !== 'HEAD') {
    opts.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  return fetchFn(url, opts).then((res) => {
    return res.text().then((resBody) => {
      return { status: res.status, bytes: resBody.length, body: resBody, ms: Math.round(performance.now() - t0) };
    });
  });
}

function doXhr(url, method, headers, body) {
  return new Promise((resolve, reject) => {
    const t0 = performance.now();
    const x = new XMLHttpRequest();
    x.open(method, url);
    if (headers) {
      Object.keys(headers).forEach((k) => {
        try { x.setRequestHeader(k, headers[k]); } catch (e) {}
      });
    }
    x.onreadystatechange = () => {
      if (x.readyState === 4) {
        if (x.status === 0) return reject(new Error('Blocked by ProxyCeptor SDK rule'));
        resolve({ status: x.status, bytes: (x.responseText || '').length, body: x.responseText, ms: Math.round(performance.now() - t0) });
      }
    };
    x.onerror = () => { reject(new Error('Blocked by ProxyCeptor SDK rule')); };
    const sendData = (body && method !== 'GET' && method !== 'HEAD')
      ? (typeof body === 'string' ? body : JSON.stringify(body))
      : null;
    x.send(sendData);
  });
}

function setConn(ok, label) {
  const pill = $('conn-pill');
  if (!pill) return;
  pill.className = `pill ${ok ? 'ok' : 'err'}`;
  pill.textContent = ok ? `Connected · ${label}` : 'Connection failed';
}

function setStep(id, cls) {
  const el = $(id);
  if (el) el.className = `step ${cls}`;
}

function addLog(method, url, status) {
  const log = $('log');
  if (!log) return;
  const empty = log.querySelector('.log-empty');
  if (empty) empty.remove();
  const row = document.createElement('div');
  row.className = 'log-row';
  const time = new Date().toLocaleTimeString();
  let statusClass = 'passthrough';
  if (/^2/.test(status) || status === 'applied') statusClass = 'applied';
  else if (/^[45]/.test(status) || status === 'blocked' || status === 'error') statusClass = 'blocked';
  row.innerHTML = `
    <span class="t">${time}</span>
    <span class="m">${escapeHtml(method)}</span>
    <span class="u">${escapeHtml(url)}</span>
    ${status ? `<span class="s ${statusClass}">${escapeHtml(status)}</span>` : ''}
  `;
  log.insertBefore(row, log.firstChild);
}

function pretty(text) {
  try { return JSON.stringify(JSON.parse(text), null, 2); } catch (e) { return text; }
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Initialization on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  $('connect-btn')?.addEventListener('click', connect);
  $('apikey')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') connect(); });
  $('sync-btn')?.addEventListener('click', () => { syncRules(true).catch(() => {}); });
  $('run-btn')?.addEventListener('click', runRequest);
  $('clear-log')?.addEventListener('click', () => {
    const l = $('log');
    if (l) l.innerHTML = '<div class="log-empty muted">Requests you send will be logged here.</div>';
  });

  $('master-toggle')?.addEventListener('change', (e) => {
    state.master = e.target.checked;
    applyToSdk();
    renderRules();
    const note = $('sync-note');
    if (note) note.textContent = state.master ? 'auto-syncing every 5s' : 'ALL RULES DISABLED (master off)';
    addLog('info', state.master ? 'Master switch ON — rules active' : 'Master switch OFF — all rules disabled', state.master ? 'applied' : 'blocked');
  });

  // Query parameter auto-population
  const q = new URLSearchParams(window.location.search);
  if (q.get('server') || q.get('backend') || q.get('api')) {
    state.server = (q.get('server') || q.get('backend') || q.get('api')).replace(/\/+$/, '');
  }
  const queryKey = q.get('key') || q.get('apiKey') || q.get('api_key') || q.get('sdm_key');

  if (queryKey && !/[\u2022\u25cf\u22c5]/.test(queryKey)) {
    const cleanKey = queryKey.trim();
    const input = $('apikey');
    if (input) input.value = cleanKey;
    state.apiKey = cleanKey;

    const snippet = document.querySelector('pre code, .code');
    if (snippet && snippet.textContent) {
      snippet.textContent = snippet.textContent.replace('sdm_live_your_key_here', cleanKey);
    }

    setTimeout(() => {
      const btn = $('connect-btn');
      if (btn) btn.click();
      else connect();
    }, 120);
  }

  renderExamplesGrid();
  loadExample(EXAMPLES[0]);
});
