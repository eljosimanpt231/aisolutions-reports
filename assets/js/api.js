// API calls to n8n webhooks
async function fetchMetrics(endpoint, params) {
  const url = new URL(`${API_BASE}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined) url.searchParams.set(k, v);
  });

  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`API error (${endpoint}):`, err);
    return null;
  }
}

function getChatbotMetrics(schema, start, end) {
  return fetchMetrics('reports-chatbot', { schema, start, end });
}

function getMessagingMetrics(schema, start, end) {
  return fetchMetrics('reports-messaging', { schema, start, end });
}

function getClickMetrics(domainId, start, end) {
  if (!domainId) return Promise.resolve(null);
  return fetchMetrics('reports-clicks', { domain_id: domainId, start, end });
}
