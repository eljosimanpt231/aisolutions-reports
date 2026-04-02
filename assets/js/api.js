// API — fetches real data from n8n webhook
const API_ENDPOINT = 'https://agentes.aisolutions.pt/webhook/reports-data';

// Cache to avoid re-fetching when multiple sections load
let _cache = { key: null, data: null };

async function fetchData(slug, start, end) {
  const key = `${slug}:${start}:${end}`;
  if (_cache.key === key && _cache.data) return _cache.data;

  try {
    const res = await fetch(`${API_ENDPOINT}?client=${slug}&start=${start}&end=${end}&type=all`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'API error');
    _cache = { key, data: json.data };
    return json.data;
  } catch (err) {
    console.error('API error:', err);
    return null;
  }
}

// ---- Transform chatbot data ----
function transformChatbot(raw) {
  if (!raw?.totals) return null;
  // Accept either total_conversations (standard) or unique_users (Now Fitness lead gen)
  if (!raw.totals.total_conversations && !raw.totals.unique_users) return null;

  const t = raw.totals;
  const channels = {};
  for (const [ch, d] of Object.entries(raw.channels || {})) {
    if (d.total_conversations > 0) {
      channels[ch] = {
        conversations: parseInt(d.total_conversations) || 0,
        messages_ai: parseInt(d.messages_ai) || 0,
        messages_human: parseInt(d.messages_human) || 0,
        resolution_rate: parseFloat(d.resolution_rate_pct) || 0
      };
    }
  }

  // Build hourly distribution (merge all channels)
  const hourly = [];
  const hourlyRaw = raw.hourly_distribution || {};
  for (let h = 0; h < 24; h++) {
    let count = 0;
    for (const chData of Object.values(hourlyRaw)) {
      count += parseInt(chData[String(h)]) || 0;
    }
    hourly.push({ hour: h, count });
  }

  return {
    total_conversations: parseInt(t.total_conversations) || 0,
    ai_resolution_rate: parseFloat(t.resolution_rate_pct) || 0,
    messages_ai: parseInt(t.messages_ai) || 0,
    messages_human: parseInt(t.messages_human) || 0,
    conversations_ai_only: parseInt(t.conversations_ai_only) || 0,
    conversations_with_human: parseInt(t.conversations_with_human) || 0,
    channels,
    hourly_distribution: hourly,
    // Extra fields (EcoDrive leads, Now Fitness leads)
    leads_total: parseInt(t.leads_total) || 0,
    leads_period: parseInt(t.leads_period) || 0,
    // Now Fitness specific
    unique_users: parseInt(t.unique_users) || 0,
    total_leads: parseInt(t.total_leads) || 0,
    pilates_leads: parseInt(t.pilates_leads) || 0,
    pt_leads: parseInt(t.pt_leads) || 0,
    conversion_rate: parseFloat(t.conversion_rate) || 0,
    total_comments: parseInt(t.total_comments) || 0,
    dms_initiated: parseInt(t.dms_initiated) || 0,
    total_follow_ups: parseInt(t.total_follow_ups) || 0
  };
}

// ---- Transform messaging data ----
function transformMessaging(raw) {
  if (!raw?.totals?.total_mensagens) return null;

  const operacionais = (raw.operacionais || []).map(r => ({
    tipo: r.categoria || r.tipo,
    total: parseInt(r.total_mensagens || r.total) || 0
  }));

  const automaticas = (raw.automaticas || []).map(r => ({
    tipo: r.categoria || r.tipo,
    total: parseInt(r.total_mensagens || r.total) || 0
  }));

  const totals = raw.totals || {};

  return {
    operacionais,
    automaticas,
    total_operacionais: parseInt(totals.total_operacionais) || 0,
    total_automaticas: parseInt(totals.total_automaticas) || 0,
    messages_sent: parseInt(totals.total_mensagens) || 0,
    total_orders: parseInt(raw.attributed_orders) || 0,
    total_revenue: parseFloat(raw.attributed_revenue) || 0
  };
}

// ---- Public API functions (called by dashboard.js) ----
async function getChatbotMetrics(schema, start, end) {
  const data = await fetchData(getClientSlug(), start, end);
  return data ? transformChatbot(data.chatbot) : null;
}

async function getMessagingMetrics(schema, start, end) {
  const data = await fetchData(getClientSlug(), start, end);
  return data ? transformMessaging(data.messaging) : null;
}

async function getClickMetrics(domainId, start, end) {
  const data = await fetchData(getClientSlug(), start, end);
  if (!data?.clicks) return null;
  const clicks = parseInt(data.clicks.chatbot_link_clicks) || 0;
  return clicks > 0 ? { total_clicks: clicks } : null;
}
