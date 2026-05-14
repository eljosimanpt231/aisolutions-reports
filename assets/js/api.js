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
    total_conversations: parseInt(t.total_conversations) || parseInt(t.unique_users) || 0,
    ai_resolution_rate: parseFloat(t.resolution_rate_pct) || 0,
    messages_ai: parseInt(t.messages_ai) || 0,
    messages_human: parseInt(t.messages_human) || 0,
    conversations_ai_only: parseInt(t.conversations_ai_only) || 0,
    conversations_with_human: parseInt(t.conversations_with_human) || 0,
    channels,
    hourly_distribution: hourly,
    // EcoDrive extras (injected later by getChatbotMetrics)
    platforms: [],
    response_time: null,
    leads_period: 0,
    // Now Fitness specific
    unique_users: parseInt(t.unique_users) || 0,
    total_leads: parseInt(t.total_leads) || 0,
    pilates_leads: parseInt(t.pilates_leads) || 0,
    pt_leads: parseInt(t.pt_leads) || 0,
    conversion_rate: parseFloat(t.conversion_rate) || 0,
    total_comments: parseInt(t.total_comments) || 0,
    dms_initiated: parseInt(t.dms_initiated) || 0,
    total_follow_ups: parseInt(t.total_follow_ups) || 0,
    lead_records: raw.totals?.lead_records || []
  };
}

// ---- Transform messaging data (v2: marketing breakdown per [campaign_type, sequence]) ----
function transformMessaging(raw) {
  if (!raw?.totals?.total_mensagens) return null;

  // Operacionais (transacionais — sem receita atribuída)
  const operacionais = (raw.operacionais || []).map(r => ({
    tipo: r.tipo || r.categoria,
    total: parseInt(r.sends || r.total_mensagens || r.total) || 0
  }));

  // Marketing — pode vir como nova shape (marketing[]) ou legacy (automaticas[])
  const rawMarketing = raw.marketing || raw.automaticas || [];
  const marketing = rawMarketing.map(r => ({
    categoria: r.categoria || r.tipo,
    campaign_type: r.campaign_type || null,
    sequence: r.sequence == null ? null : parseInt(r.sequence),
    sends: parseInt(r.sends || r.total_mensagens || r.total) || 0,
    clicks: parseInt(r.clicks || r.clicked_count) || 0,
    click_rate: parseFloat(r.click_rate) || 0,
    orders: parseInt(r.orders) || 0,
    revenue: parseFloat(r.revenue) || 0,
    revenue_per_msg: parseFloat(r.revenue_per_msg) || 0
  }));

  // Manter "automaticas" legacy (totais por campaign_type agregando sequências)
  const automaticasMap = {};
  for (const m of marketing) {
    const k = m.categoria;
    if (!automaticasMap[k]) automaticasMap[k] = { tipo: k, total: 0 };
    automaticasMap[k].total += m.sends;
  }
  const automaticas = Object.values(automaticasMap);

  const totals = raw.totals || {};

  return {
    operacionais,
    marketing,
    automaticas,
    total_operacionais: parseInt(totals.total_operacionais) || 0,
    total_automaticas: parseInt(totals.total_marketing || totals.total_automaticas) || 0,
    total_marketing: parseInt(totals.total_marketing || totals.total_automaticas) || 0,
    messages_sent: parseInt(totals.total_mensagens) || 0,
    total_clicked: parseInt(totals.total_clicked) || 0,
    click_rate: parseFloat(totals.click_rate) || 0,
    total_orders: parseInt(raw.attributed_orders) || 0,
    total_revenue: parseFloat(raw.attributed_revenue) || 0
  };
}

// Transform EcoDrive extra data
function transformEcoDriveExtras(raw) {
  return {
    platforms: raw?.platforms || [],
    response_time: raw?.response_time || null,
    leads: raw?.leads || null
  };
}

// ---- Public API functions (called by dashboard.js) ----
async function getChatbotMetrics(schema, start, end) {
  const data = await fetchData(getClientSlug(), start, end);
  if (!data) return null;
  const result = transformChatbot(data.chatbot);
  if (!result) return null;
  // Inject top-level extras
  if (data.platforms) result.platforms = data.platforms;
  if (data.response_time) result.response_time = data.response_time;
  if (data.leads) result.leads_period = data.leads.total || parseInt(data.leads.period) || 0;
  if (data.extended) result.extended = data.extended;
  return result;
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
