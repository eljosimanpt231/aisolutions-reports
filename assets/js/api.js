// API calls to n8n webhooks — real data
const API_ENDPOINT = 'https://agentes.aisolutions.pt/webhook/reports-data';

async function fetchReportData(client, start, end) {
  const url = `${API_ENDPOINT}?client=${client}&start=${start}&end=${end}&type=all`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Unknown error');
    return json.data;
  } catch (err) {
    console.error('API error:', err);
    return null;
  }
}

// Transform API response to dashboard format
function transformChatbotData(raw) {
  if (!raw || !raw.totals) return null;
  const t = raw.totals;
  const channels = {};
  for (const [ch, data] of Object.entries(raw.channels || {})) {
    channels[ch] = { conversations: data.total_conversations || 0, messages_ai: data.messages_ai || 0, messages_human: data.messages_human || 0 };
  }

  // Build hourly from all channels
  const hourly = [];
  const hourlyRaw = raw.hourly_distribution || {};
  for (let h = 0; h < 24; h++) {
    let count = 0;
    for (const chData of Object.values(hourlyRaw)) {
      const hourEntry = (Array.isArray(chData) ? chData : []).find(x => parseInt(x.hour) === h);
      if (hourEntry) count += parseInt(hourEntry.count) || 0;
    }
    hourly.push({ hour: h, count });
  }

  return {
    total_conversations: parseInt(t.total_conversations) || 0,
    ai_resolution_rate: parseFloat(t.resolution_rate_pct) || 0,
    messages_ai: parseInt(t.messages_ai) || 0,
    messages_human: parseInt(t.messages_human) || 0,
    conversations_ai_only: parseInt(t.conversations_ai_only) || 0,
    conversations_with_human: (parseInt(t.total_conversations) || 0) - (parseInt(t.conversations_ai_only) || 0),
    channels,
    hourly_distribution: hourly
  };
}

function transformMessagingData(raw) {
  if (!raw || (!raw.messages_sent && !raw.by_type?.length)) return null;

  const operacionais = [];
  const automaticas = [];

  (raw.by_type || []).forEach(item => {
    const tipo = item.tipo || item.categoria || 'Outro';
    const entry = { tipo, total: parseInt(item.total) || 0 };
    // Categorize: operational types vs marketing types
    const opTypes = ['morada', 'mbway', 'multibanco', 'codigo_postal', 'código postal', 'morada_incompleta'];
    if (opTypes.some(t => tipo.toLowerCase().includes(t))) {
      operacionais.push(entry);
    } else {
      automaticas.push(entry);
    }
  });

  return {
    operacionais,
    automaticas,
    messages_sent: parseInt(raw.messages_sent) || 0,
    total_clicks: parseInt(raw.total_clicks) || 0,
    total_orders: parseInt(raw.attributed_orders) || 0,
    total_revenue: parseFloat(raw.attributed_revenue) || 0,
    click_rate: raw.messages_sent > 0 ? ((parseInt(raw.total_clicks) || 0) / parseInt(raw.messages_sent) * 100) : 0
  };
}

function transformClicksData(raw) {
  if (!raw) return null;
  return { total_clicks: parseInt(raw.chatbot_link_clicks) || 0 };
}

// Public API functions used by dashboard.js
async function getChatbotMetrics(schema, start, end) {
  const slug = getClientSlug();
  const data = await fetchReportData(slug, start, end);
  return data ? transformChatbotData(data.chatbot) : null;
}

async function getMessagingMetrics(schema, start, end) {
  const slug = getClientSlug();
  const data = await fetchReportData(slug, start, end);
  return data ? transformMessagingData(data.messaging) : null;
}

async function getClickMetrics(domainId, start, end) {
  if (!domainId) return null;
  const slug = getClientSlug();
  const data = await fetchReportData(slug, start, end);
  return data ? transformClicksData(data.clicks) : null;
}

// Cache to avoid triple-fetching
let _cache = { slug: null, start: null, end: null, data: null };

async function fetchReportDataCached(slug, start, end) {
  if (_cache.slug === slug && _cache.start === start && _cache.end === end && _cache.data) {
    return _cache.data;
  }
  const data = await fetchReportData(slug, start, end);
  _cache = { slug, start, end, data };
  return data;
}

// Override the public functions to use cache
getChatbotMetrics = async function(schema, start, end) {
  const slug = getClientSlug();
  const data = await fetchReportDataCached(slug, start, end);
  return data ? transformChatbotData(data.chatbot) : null;
};

getMessagingMetrics = async function(schema, start, end) {
  const slug = getClientSlug();
  const data = await fetchReportDataCached(slug, start, end);
  return data ? transformMessagingData(data.messaging) : null;
};

getClickMetrics = async function(domainId, start, end) {
  if (!domainId) return null;
  const slug = getClientSlug();
  const data = await fetchReportDataCached(slug, start, end);
  return data ? transformClicksData(data.clicks) : null;
};
