import './demo.css';

/**
 * ProxyCeptor Live Interactive Sandbox v2.5.0
 * 4-Step Interactive Workflow + 10 Live Capabilities with Visual Symmetry
 */

const ORIGINAL_FETCH = window.fetch ? window.fetch.bind(window) : null;
const $ = (id) => document.getElementById(id);

export const CAPABILITIES = [
  // Pillar 1: Request Modify
  {
    pillar: 'Request Modify',
    pillarId: 'req',
    id: 'req-url',
    name: 'URL Modify',
    tag: 'Redirect / Rewrite',
    actionType: 'rewrite',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/todos/1',
    headers: {
      'Accept': 'application/json',
      'X-Client-Platform': 'SmartTV_Tizen',
      'X-App-Version': 'v2.5.0'
    },
    body: null,
    ruleSummary: '*.m3u8 or /todos/1 -> Rewrite to staging-cdn.internal or /todos/2',
    localRule: {
      match: { urlPattern: '*todos/1*' },
      request: { urlRewrite: { find: 'todos/1', replace: 'todos/2' } }
    }
  },
  {
    pillar: 'Request Modify',
    pillarId: 'req',
    id: 'req-payload',
    name: 'Payload Modify',
    tag: 'JSON Deep Merge',
    actionType: 'merge',
    method: 'POST',
    url: 'https://jsonplaceholder.typicode.com/posts',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: {
      title: 'Baseline Video Telemetry',
      session_id: 'sess_9941',
      platform: 'android_tv',
      timestamp: 1726789123
    },
    ruleSummary: 'Request Body Action: Deep Merge QA Flags (qa_test_run, force_ab_variant)',
    localRule: {
      match: { urlPattern: '*posts*' },
      request: {
        body: {
          enabled: true,
          action: 'merge',
          content: JSON.stringify({
            qa_test_run: 'sprint_42_regression',
            force_ab_variant: 'checkout_v2_dark',
            debug_mode_enabled: true
          })
        }
      }
    }
  },
  {
    pillar: 'Request Modify',
    pillarId: 'req',
    id: 'req-header',
    name: 'Header Modify',
    tag: 'Inject Headers',
    actionType: 'headers',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/users/1',
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer sdm_qa_auto_token_9841',
      'X-Tenant-Id': 'tenant_enterprise_beta',
      'X-ProxyCeptor-Intercepted': 'true'
    },
    body: null,
    ruleSummary: 'Request Header Action: Inject Authorization + X-Tenant-Id',
    localRule: {
      match: { urlPattern: '*users/1*' },
      request: {
        headers: [
          { name: 'Authorization', value: 'Bearer sdm_qa_auto_token_9841' },
          { name: 'X-Tenant-Id', value: 'tenant_enterprise_beta' },
          { name: 'X-ProxyCeptor-Intercepted', value: 'true' }
        ]
      }
    }
  },

  // Pillar 2: Response Modify
  {
    pillar: 'Response Modify',
    pillarId: 'res',
    id: 'res-replace',
    name: 'Response Replace',
    tag: 'Full Mock Body',
    actionType: 'mock',
    method: 'POST',
    url: 'https://jsonplaceholder.typicode.com/posts',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      action: 'checkout_pay',
      amount: 1499,
      payment_gateway: 'PulsePay UPI'
    },
    ruleSummary: 'Response Body Action: Replace with Mock JSON (Status 504 Gateway Timeout)',
    localRule: {
      match: { urlPattern: '*posts*' },
      response: {
        statusCode: 504,
        body: {
          enabled: true,
          action: 'replace',
          content: JSON.stringify({
            status: 'failure',
            error_code: 'BANK_SERVER_TIMEOUT',
            message: 'Bank server did not respond within 30000ms. Transaction failed.',
            retryable: true,
            mock_source: 'ProxyCeptor Cloud'
          }, null, 2)
        }
      }
    }
  },
  {
    pillar: 'Response Modify',
    pillarId: 'res',
    id: 'res-append',
    name: 'Response Append',
    tag: 'Deep Merge',
    actionType: 'merge',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/users/2',
    headers: {
      'Accept': 'application/json'
    },
    body: null,
    ruleSummary: 'Response Body Action: Deep Merge Delta JSON (is_vip: true, wallet: 5000)',
    localRule: {
      match: { urlPattern: '*users/2*' },
      response: {
        body: {
          enabled: true,
          action: 'merge',
          content: JSON.stringify({
            is_vip: true,
            wallet_balance: 5000,
            ads_enabled: false,
            subscription_tier: 'Platinum Annual'
          })
        }
      }
    }
  },
  {
    pillar: 'Response Modify',
    pillarId: 'res',
    id: 'res-transform',
    name: 'Response Transform',
    tag: 'Execute JS',
    actionType: 'rewrite',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/albums/1',
    headers: {
      'Accept': 'application/json'
    },
    body: null,
    ruleSummary: 'Execute JS: data.promo = "QA_FREE"; data.title = "[TRANSFORMED] " + data.title;',
    localRule: {
      match: { urlPattern: '*albums/1*' },
      response: {
        body: {
          enabled: true,
          action: 'transform',
          content: 'data.promo = "QA_FREE"; data.title = "[TRANSFORMED] " + data.title; return data;'
        }
      }
    }
  },
  {
    pillar: 'Response Modify',
    pillarId: 'res',
    id: 'res-header',
    name: 'Header Modify',
    tag: 'CORS & Cache',
    actionType: 'headers',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/comments/1',
    headers: {
      'Accept': 'application/json'
    },
    body: null,
    ruleSummary: 'Response Header Action: Set Access-Control-Allow-Origin: * + no-cache',
    localRule: {
      match: { urlPattern: '*comments/1*' },
      response: {
        headers: [
          { name: 'Access-Control-Allow-Origin', value: '*' },
          { name: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { name: 'Cache-Control', value: 'no-store, no-cache' },
          { name: 'X-ProxyCeptor-CORS-Bypass', value: 'active' }
        ]
      }
    }
  },

  // Pillar 3: Performance Modify
  {
    pillar: 'Performance Modify',
    pillarId: 'perf',
    id: 'perf-delay',
    name: 'Network Delay',
    tag: 'Simulate Latency',
    actionType: 'delay',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/photos/1',
    headers: {
      'Accept': 'application/json'
    },
    body: null,
    ruleSummary: 'Traffic Action: Add 2500ms Artificial Latency Before Returning',
    localRule: {
      match: { urlPattern: '*photos/1*' },
      request: { delay: 2500 }
    }
  },
  {
    pillar: 'Performance Modify',
    pillarId: 'perf',
    id: 'perf-block',
    name: 'Block Request',
    tag: 'Drop Traffic',
    actionType: 'block',
    method: 'POST',
    url: 'https://jsonplaceholder.typicode.com/posts',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      tracker: 'ad_impression',
      unit: 'banner_home'
    },
    ruleSummary: 'Traffic Action: Block Request (DNR & Fetch In-Memory Filter)',
    localRule: {
      match: { urlPattern: '*posts*' },
      block: true
    }
  },
  {
    pillar: 'Performance Modify',
    pillarId: 'perf',
    id: 'perf-status',
    name: 'Status Modify',
    tag: 'Flip HTTP Code',
    actionType: 'status',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/todos/2',
    headers: {
      'Accept': 'application/json'
    },
    body: null,
    ruleSummary: 'Response Action: Override Status Code to 401 Unauthorized',
    localRule: {
      match: { urlPattern: '*todos/2*' },
      response: {
        statusCode: 401,
        body: {
          enabled: true,
          action: 'replace',
          content: JSON.stringify({
            authenticated: false,
            error: 'SESSION_EXPIRED',
            redirect_action: 'force_logout_modal'
          }, null, 2)
        }
      }
    }
  }
];

const state = {
  activeCapabilityId: 'req-payload',
  connected: false,
  apiKey: '',
  server: resolveServer(),
  masterEnabled: true,
  disabledRuleIds: {},
  cloudRules: [],
  isExecuting: false
};

function resolveServer() {
  if (typeof window !== 'undefined' && window.location) {
    const q = new URLSearchParams(window.location.search);
    if (q.get('server') || q.get('backend') || q.get('api')) {
      return (q.get('server') || q.get('backend') || q.get('api')).replace(/\/+$/, '');
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
  }
  return 'https://api.proxyceptor.com';
}

function getActiveCapability() {
  return CAPABILITIES.find((c) => c.id === state.activeCapabilityId) || CAPABILITIES[0];
}

// ============================================================
// STEP 3: RENDER ACTIVE RULES LIST & MASTER SWITCH
// (Rendered empty until real API Key is connected and synced)
// ============================================================
function renderRulesList() {
  const container = $('rules-list');
  if (!container) return;

  container.innerHTML = '';

  if (!state.connected || state.cloudRules.length === 0) {
    const msgText = !state.connected
      ? 'No cloud rules loaded yet. Enter your API key in <strong>Step 2</strong> above and click <strong>"Connect &amp; Sync"</strong> to load real rules from your workspace.'
      : 'No active cloud rules found in this workspace yet. Create rules in your <a href="https://app.proxyceptor.com" target="_blank" style="color: #00f0ff;">ProxyCeptor Dashboard</a> and click "↻ Sync Rules".';

    container.innerHTML = `
      <div style="padding: 28px 20px; text-align: center; color: #94a3b8; border: 1px dashed #334155; border-radius: 9px; background: rgba(0, 0, 0, 0.2);">
        <div style="font-size: 20px; margin-bottom: 6px;">📋</div>
        <div style="font-weight: 600; color: #cbd5e1; font-size: 13.5px;">No cloud rules loaded</div>
        <div style="font-size: 12.5px; margin-top: 4px; color: #64748b;">${msgText}</div>
      </div>
    `;

    const badge = $('master-status-badge');
    if (badge && !state.connected) {
      badge.textContent = 'Idle (0 Rules)';
      badge.className = 'pill';
    }
    return;
  }

  const badge = $('master-status-badge');
  if (badge) {
    badge.textContent = state.masterEnabled ? `Active (${state.cloudRules.length} Rules)` : 'Disabled';
    badge.className = `pill ${state.masterEnabled ? 'ok' : 'err'}`;
  }

  state.cloudRules.forEach((r) => {
    const ruleId = r.id;
    const isOff = !state.masterEnabled || state.disabledRuleIds[ruleId] === true;
    const actionTag = r.actionType || (r.tag ? r.tag.toLowerCase().split(' ')[0] : 'rule');

    const row = document.createElement('div');
    row.className = `rule-row ${isOff ? 'off' : ''}`;
    row.innerHTML = `
      <div class="rule-main">
        <div class="rule-header">
          <span>${escapeHtml(r.name)}</span>
          <span class="tag ${escapeHtml(actionTag)}">${escapeHtml(r.tag || actionTag)}</span>
          ${r.method ? `<span class="mini-tag">${escapeHtml(r.method)}</span>` : ''}
        </div>
        <div class="rule-desc" title="${escapeHtml(r.ruleSummary || r.name)}">
          ${escapeHtml(r.ruleSummary || r.url || 'Active ProxyCeptor Policy')}
        </div>
      </div>
      <label class="switch">
        <input type="checkbox" data-rule-id="${ruleId}" ${isOff ? '' : 'checked'} ${state.masterEnabled ? '' : 'disabled'} />
        <span class="slider"></span>
      </label>
    `;

    const checkbox = row.querySelector('input');
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          delete state.disabledRuleIds[ruleId];
        } else {
          state.disabledRuleIds[ruleId] = true;
        }
        applyRulesToSdk();
        renderRulesList();
      });
    }

    container.appendChild(row);
  });
}

function handleMasterToggle(enabled) {
  state.masterEnabled = enabled;
  const badge = $('master-status-badge');
  if (badge) {
    badge.textContent = enabled ? 'Active' : 'Disabled';
    badge.className = `pill ${enabled ? 'ok' : 'err'}`;
  }

  applyRulesToSdk();
  renderRulesList();
}

function applyRulesToSdk() {
  const sdm = window.ProxyCeptor || window.ProxyCeptor;
  if (!sdm || typeof sdm.setRules !== 'function') return;

  if (!state.masterEnabled) {
    sdm.setRules([]);
    return;
  }

  const activeCap = getActiveCapability();
  if (state.disabledRuleIds[activeCap.id]) {
    sdm.setRules([]);
    return;
  }

  if (activeCap.localRule) {
    const armed = {
      id: `rule_${activeCap.id}`,
      name: activeCap.name,
      enabled: true,
      ...activeCap.localRule
    };
    sdm.setRules([armed]);
  }
}

// ============================================================
// STEP 4: RENDER LEFT SIDEBAR (3 PILLARS, 10 CAPABILITIES)
// ============================================================
function renderSidebar() {
  const reqContainer = $('pillar-req-items');
  const resContainer = $('pillar-res-items');
  const perfContainer = $('pillar-perf-items');

  if (!reqContainer || !resContainer || !perfContainer) return;

  reqContainer.innerHTML = '';
  resContainer.innerHTML = '';
  perfContainer.innerHTML = '';

  CAPABILITIES.forEach((c) => {
    const btn = document.createElement('button');
    const isActive = c.id === state.activeCapabilityId;
    btn.className = `ld-feature-btn btn-${c.pillarId} ${isActive ? 'active' : ''}`;
    btn.dataset.id = c.id;
    btn.innerHTML = `
      <span class="ld-feature-btn-name">${escapeHtml(c.name)}</span>
      <span class="ld-feature-btn-tag tag-${c.pillarId}">${escapeHtml(c.tag)}</span>
    `;
    btn.addEventListener('click', () => {
      selectCapability(c.id);
    });

    if (c.pillarId === 'req') reqContainer.appendChild(btn);
    else if (c.pillarId === 'res') resContainer.appendChild(btn);
    else perfContainer.appendChild(btn);
  });
}

function selectCapability(id) {
  state.activeCapabilityId = id;
  renderSidebar();
  renderCapabilityDetails();
  applyRulesToSdk();
}

function renderCapabilityDetails() {
  const cap = getActiveCapability();

  // Target Bar
  const methodBadge = $('target-method-badge');
  if (methodBadge) {
    methodBadge.textContent = cap.method;
    methodBadge.className = cap.method === 'GET' ? 'ld-badge-method-get' : 'ld-badge-method-post';
  }

  const urlInput = $('target-url-input');
  if (urlInput) {
    urlInput.value = cap.url;
  }

  const pillBadge = $('active-rule-pill');
  if (pillBadge) {
    pillBadge.textContent = `Active: ${cap.pillar} → ${cap.name}`;
  }

  // Left Window: Request Parameters
  // Top: Payload
  const reqPayloadDisplay = $('req-spec-payload');
  const reqPayloadBadge = $('req-payload-badge');
  if (reqPayloadDisplay) {
    if (cap.body) {
      if (reqPayloadBadge) reqPayloadBadge.textContent = 'JSON Payload';
      reqPayloadDisplay.innerHTML = formatJsonHighlight(cap.body);
    } else {
      if (reqPayloadBadge) reqPayloadBadge.textContent = 'No Body (GET)';
      reqPayloadDisplay.innerHTML = '<span class="tok-com">// GET request transmits no request body</span>';
    }
  }

  // Bottom: Headers
  const reqHeadersDisplay = $('req-spec-headers');
  if (reqHeadersDisplay) {
    reqHeadersDisplay.innerHTML = formatHeadersHighlight(cap.headers || { 'Accept': 'application/json' });
  }

  const reqFooter = $('req-footer-text');
  if (reqFooter) {
    reqFooter.textContent = `Target: ${cap.url} · Method: ${cap.method}`;
  }

  // Right Window: Response Parameters Reset to Ready
  const resStatusBadge = $('res-status-badge');
  const resBodyDisplay = $('res-body-display');
  const resHeadersDisplay = $('res-headers-display');
  const resFooter = $('res-footer-text');

  if (resStatusBadge) {
    resStatusBadge.textContent = 'READY TO EXECUTE';
    resStatusBadge.className = 'mac-win-badge badge-gray';
  }

  if (resBodyDisplay) {
    resBodyDisplay.innerHTML = '<span class="tok-com">(Click "Send Live Request" to execute real network request and inspect live response body)</span>';
  }

  if (resHeadersDisplay) {
    resHeadersDisplay.innerHTML = '<span class="tok-com">(Click "Send Live Request" to capture wire response headers)</span>';
  }

  if (resFooter) {
    resFooter.textContent = 'Click "Send Live Request" above to execute through active ProxyCeptor engine';
  }
}

// ============================================================
// ============================================================
// REAL NETWORK EXECUTION & RESPONSE CAPTURE
// ============================================================
async function executeRequest() {
  if (state.isExecuting) return;
  const cap = getActiveCapability();
  const url = ($('target-url-input')?.value || cap.url).trim();
  const transport = $('transport-select')?.value || 'fetch';
  const executeBtn = $('execute-btn');

  state.isExecuting = true;
  if (executeBtn) {
    executeBtn.disabled = true;
    executeBtn.innerHTML = '<span>⚡</span><span>Executing wire call...</span>';
  }

  const resStatusBadge = $('res-status-badge');
  const resBodyDisplay = $('res-body-display');
  const resHeadersDisplay = $('res-headers-display');
  const resFooter = $('res-footer-text');

  // Immediately clear Response JSON and Response Headers while waiting for live wire data
  if (resStatusBadge) {
    resStatusBadge.textContent = 'EXECUTING...';
    resStatusBadge.className = 'mac-win-badge badge-neon';
  }
  if (resBodyDisplay) {
    resBodyDisplay.innerHTML = '<span class="tok-com">// Fetching real wire response...</span>';
  }
  if (resHeadersDisplay) {
    resHeadersDisplay.innerHTML = '<span class="tok-com">// Waiting for live response headers...</span>';
  }
  if (resFooter) {
    resFooter.textContent = 'Transmitting request across network...';
  }

  const t0 = performance.now();

  try {
    let result;
    if (transport === 'xhr') {
      result = await executeXhr(url, cap.method, cap.headers, cap.body);
    } else {
      result = await executeFetch(url, cap.method, cap.headers, cap.body);
    }

    const elapsedMs = Math.round(performance.now() - t0);

    // Update Status Badge with real wire status code
    if (resStatusBadge) {
      resStatusBadge.textContent = `${result.status} ${result.statusText || 'OK'} (${elapsedMs}ms)`;
      resStatusBadge.className = result.status >= 400 ? 'mac-win-badge badge-gray' : 'mac-win-badge badge-neon';
    }

    // Top: Real Wire Response Body (Pure JSON, no fake tags)
    if (resBodyDisplay) {
      resBodyDisplay.innerHTML = formatJsonHighlight(result.data);
    }

    // Bottom: Real Wire Response Headers
    if (resHeadersDisplay) {
      resHeadersDisplay.innerHTML = formatHeadersHighlight(result.headers);
    }

    if (resFooter) {
      resFooter.innerHTML = `✓ Real wire response received via ${transport.toUpperCase()} in ${elapsedMs}ms · Payload size: ${result.byteLength || 0} bytes`;
    }
  } catch (err) {
    const elapsedMs = Math.round(performance.now() - t0);
    if (resStatusBadge) {
      resStatusBadge.textContent = `ERROR (${elapsedMs}ms)`;
      resStatusBadge.className = 'mac-win-badge badge-gray';
    }

    if (resBodyDisplay) {
      resBodyDisplay.textContent = `Network Error: ${err.message || err}`;
    }

    if (resHeadersDisplay) {
      resHeadersDisplay.innerHTML = '<span class="tok-com">(No response headers received due to network failure)</span>';
    }

    if (resFooter) {
      resFooter.innerHTML = `⚠️ Error: ${err.message || 'Network request failed'}`;
    }
  } finally {
    state.isExecuting = false;
    if (executeBtn) {
      executeBtn.disabled = false;
      executeBtn.innerHTML = '<span>▶</span><span>Send Live Request</span>';
    }
  }
}

async function executeFetch(url, method, headers, body) {
  const opts = { method, headers: { ...headers } };
  if (body && method !== 'GET' && method !== 'HEAD') {
    opts.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const res = await window.fetch(url, opts);
  const text = await res.text();

  const headerMap = {};
  if (res.headers && typeof res.headers.forEach === 'function') {
    res.headers.forEach((val, key) => {
      headerMap[key] = val;
    });
  }

  let data = text;
  try {
    data = JSON.parse(text);
  } catch (e) { }

  return {
    status: res.status,
    statusText: res.statusText,
    headers: headerMap,
    data,
    byteLength: text.length
  };
}

function executeXhr(url, method, headers, body) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    if (headers) {
      Object.entries(headers).forEach(([k, v]) => {
        try { xhr.setRequestHeader(k, v); } catch (e) { }
      });
    }

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 0) {
          return reject(new Error('Connection aborted or blocked'));
        }

        const rawHeaders = xhr.getAllResponseHeaders() || '';
        const headerMap = {};
        rawHeaders.split(/\r?\n/).forEach((line) => {
          const parts = line.split(': ');
          if (parts[0]) headerMap[parts[0].toLowerCase()] = parts.slice(1).join(': ');
        });

        const text = xhr.responseText || '';
        let data = text;
        try {
          data = JSON.parse(text);
        } catch (e) { }

        resolve({
          status: xhr.status,
          statusText: xhr.statusText,
          headers: headerMap,
          data,
          byteLength: text.length
        });
      }
    };

    xhr.onerror = () => reject(new Error('XMLHttpRequest failed or blocked'));

    const sendData = (body && method !== 'GET' && method !== 'HEAD')
      ? (typeof body === 'string' ? body : JSON.stringify(body))
      : null;
    xhr.send(sendData);
  });
}

// ============================================================
// FORMATTERS & HIGHLIGHTERS (PURE WIRE SYNTAX, NO FAKE TAGS)
// ============================================================
function formatJsonHighlight(obj) {
  if (obj === null || obj === undefined) return '<span class="tok-null">null</span>';
  if (typeof obj === 'string') {
    try {
      obj = JSON.parse(obj);
    } catch (e) {
      return escapeHtml(obj);
    }
  }

  const jsonStr = JSON.stringify(obj, null, 2);
  const lines = jsonStr.split('\n');

  return lines.map((line) => {
    const formatted = escapeHtml(line)
      .replace(/"([^"]+)":/g, '<span class="tok-key">"$1"</span>:')
      .replace(/:\s*"([^"]*)"/g, ': <span class="tok-str">"$1"</span>')
      .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="tok-num">$1</span>')
      .replace(/:\s*(true|false)/g, ': <span class="tok-bool">$1</span>')
      .replace(/:\s*(null)/g, ': <span class="tok-null">$1</span>');

    return `<div>${formatted}</div>`;
  }).join('');
}

function formatHeadersHighlight(headerMap) {
  if (!headerMap || Object.keys(headerMap).length === 0) {
    return '<span class="tok-null">(No headers returned)</span>';
  }

  return Object.entries(headerMap).map(([k, v]) => {
    const line = `<span class="tok-key">${escapeHtml(k)}</span>: <span class="tok-str">${escapeHtml(v)}</span>`;
    return `<div>${line}</div>`;
  }).join('');
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ============================================================
// STEP 2: CONNECT API KEY & CLOUD SYNC
// ============================================================
async function handleConnect() {
  const input = $('apikey');
  const msg = $('connect-msg');
  const btn = $('connect-btn');
  const key = input ? input.value.trim() : '';

  if (!key) {
    if (msg) {
      msg.hidden = false;
      msg.className = 'msg err';
      msg.textContent = 'Please enter an API key to connect your workspace.';
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>Connecting...</span>';
  }

  const statusPill = $('conn-pill');
  if (statusPill) {
    statusPill.textContent = 'Connecting...';
    statusPill.className = 'pill';
  }

  const server = state.server;
  state.apiKey = key;

  try {
    const verifyRes = await ORIGINAL_FETCH(`${server}/public/verify`, {
      headers: { 'X-API-Key': key },
      cache: 'no-store'
    });

    if (!verifyRes.ok) {
      throw new Error(verifyRes.status === 401 ? 'Invalid or revoked API key' : `HTTP ${verifyRes.status}`);
    }

    const verifyJson = await verifyRes.json();
    const wsName = verifyJson?.data?.workspace?.name || 'Workspace Connected';

    // Init ProxyCeptor SDK
    const sdm = window.ProxyCeptor || window.ProxyCeptor;
    if (sdm && typeof sdm.init === 'function') {
      sdm.init({ apiKey: key, refreshInterval: 0, debug: true });
    }

    state.connected = true;
    if (statusPill) {
      statusPill.textContent = `Connected · ${wsName}`;
      statusPill.className = 'pill ok';
    }

    if (msg) {
      msg.hidden = false;
      msg.className = 'msg ok';
      msg.textContent = `✓ Successfully authenticated with workspace "${wsName}". Syncing rules...`;
    }

    // Reveal Step 3 Card & Spacer
    const step3Card = $('step3-card');
    const step3Spacer = $('step3-spacer');
    if (step3Card) step3Card.style.display = 'block';
    if (step3Spacer) step3Spacer.style.display = 'block';

    $('step-nav-2')?.classList.add('done');
    $('step-nav-3')?.classList.add('active', 'done');

    // Sync real cloud rules
    await syncCloudRules();

    if (step3Card) {
      step3Card.scrollIntoView({ behavior: 'smooth' });
    }
  } catch (err) {
    if (msg) {
      msg.hidden = false;
      msg.className = 'msg err';
      msg.textContent = `Connection failed: ${err.message}`;
    }
    if (statusPill) {
      statusPill.textContent = 'Connection Error';
      statusPill.className = 'pill err';
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>Connect &amp; Sync</span>';
    }
  }
}

async function syncCloudRules() {
  const syncNote = $('sync-note');
  if (!state.apiKey) return;

  try {
    const res = await ORIGINAL_FETCH(`${state.server}/public/rules?includeDisabled=1`, {
      headers: { 'X-API-Key': state.apiKey },
      cache: 'no-store'
    });

    if (res.ok) {
      const json = await res.json();
      const rules = json?.data?.rules || [];
      state.cloudRules = rules.map((r) => {
        const actionType = r.ruleType || (r.response?.body?.action === 'replace' ? 'mock' : r.response?.body?.action === 'merge' ? 'merge' : r.request?.delay ? 'delay' : r.block ? 'block' : 'rule');
        return {
          id: r.id || r._id,
          name: r.name || 'Cloud Rule',
          tag: (r.ruleType || actionType).toUpperCase(),
          actionType,
          method: r.method || (r.request && r.request.method) || 'ALL',
          url: r.match?.urlPattern || r.urlPattern || 'All endpoints',
          ruleSummary: `${r.match?.urlPattern || r.urlPattern || '*'} → ${r.name || 'Cloud Policy'}`,
          localRule: r
        };
      });

      if (syncNote) {
        syncNote.textContent = `${rules.length} cloud rule(s) synced from real API`;
      }
    } else {
      if (syncNote) syncNote.textContent = 'Could not sync cloud rules';
    }
  } catch (e) {
    console.warn('Real cloud sync error:', e);
    if (syncNote) syncNote.textContent = 'Sync error: ' + (e.message || 'Network error');
  }

  renderRulesList();
  applyRulesToSdk();
}

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  renderRulesList();
  renderSidebar();
  renderCapabilityDetails();
  applyRulesToSdk();

  // Master switch
  $('master-toggle')?.addEventListener('change', (e) => {
    handleMasterToggle(e.target.checked);
  });

  // Sync button
  $('sync-btn')?.addEventListener('click', () => {
    syncCloudRules();
  });

  // Connect button
  $('connect-btn')?.addEventListener('click', handleConnect);
  $('apikey')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleConnect();
  });

  // Execute request button
  $('execute-btn')?.addEventListener('click', executeRequest);

  // Copy URL button
  $('copy-target-url-btn')?.addEventListener('click', () => {
    const url = $('target-url-input')?.value;
    if (url) {
      navigator.clipboard.writeText(url);
      const btn = $('copy-target-url-btn');
      if (btn) {
        btn.textContent = '✓ Copied';
        setTimeout(() => { btn.textContent = 'Copy URL'; }, 1500);
      }
    }
  });

  // Query parameter auto-population (?key=...&server=...)
  const q = new URLSearchParams(window.location.search);
  const qKey = q.get('key') || q.get('apiKey') || q.get('api_key');
  if (qKey && $('apikey')) {
    $('apikey').value = qKey.trim();
    handleConnect();
  }
});
