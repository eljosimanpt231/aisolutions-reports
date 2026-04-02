// Main dashboard orchestrator
let currentPeriod = '30d';
let currentClient = null;
let customStartDate = null;
let customEndDate = null;

// Animated counter
function animateValue(el, target, duration = 1800) {
  if (!el || isNaN(target)) { if (el) el.textContent = target; return; }
  const isFloat = String(target).includes('.');
  const startTime = performance.now();
  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = target * ease;
    el.textContent = isFloat
      ? current.toLocaleString('pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      : Math.round(current).toLocaleString('pt-PT');
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

async function initDashboard(slug) {
  currentClient = CLIENTS[slug];
  if (!currentClient) return;
  setupPeriodSelector();
  await loadData();
}

function setupPeriodSelector() {
  const customRange = document.getElementById('custom-range');
  const dateStart = document.getElementById('date-start');
  const dateEnd = document.getElementById('date-end');
  const dateApply = document.getElementById('date-apply');
  const today = new Date();
  const thirtyAgo = new Date(today);
  thirtyAgo.setDate(today.getDate() - 30);
  dateEnd.value = formatDate(today);
  dateStart.value = formatDate(thirtyAgo);

  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelector('.period-btn.active')?.classList.remove('active');
      btn.classList.add('active');
      if (btn.dataset.period === 'custom') { customRange.style.display = 'flex'; return; }
      customRange.style.display = 'none';
      currentPeriod = btn.dataset.period;
      customStartDate = null; customEndDate = null;
      await loadData();
    });
  });
  dateApply.addEventListener('click', async () => {
    if (dateStart.value && dateEnd.value) {
      customStartDate = dateStart.value; customEndDate = dateEnd.value;
      currentPeriod = 'custom';
      await loadData();
    }
  });
}

async function loadData() {
  const { start, end } = (currentPeriod === 'custom' && customStartDate && customEndDate)
    ? { start: customStartDate, end: customEndDate }
    : getDateRange(currentPeriod);
  const slug = getClientSlug();
  const client = CLIENTS[slug];
  showLoading();
  _cache = { key: null, data: null }; // clear cache

  const [chatbot, messaging, clicks] = await Promise.all([
    (client.services.includes('chatbot') && client.schema) ? getChatbotMetrics(client.schema, start, end) : null,
    (client.services.includes('messaging') && client.schema) ? getMessagingMetrics(client.schema, start, end) : null,
    getClickMetrics(client.domainId, start, end)
  ]);

  renderDashboard(client, chatbot, messaging, clicks);
}

function showLoading() {
  document.getElementById('dashboard-content').innerHTML = '<div class="loading"><div class="spinner"></div>A carregar dados...</div>';
}

function renderDashboard(client, chatbot, messaging, clicks) {
  const content = document.getElementById('dashboard-content');
  let html = '';
  const slug = getClientSlug();

  if (client.services.includes('chatbot') && chatbot) {
    html += renderChatbotSection(client, chatbot, clicks);
  }
  if (client.services.includes('messaging') && messaging) {
    if (html) html += '<hr class="section-divider">';
    html += renderMessagingSection(client, messaging);
  }

  // Insights
  const insight = typeof INSIGHTS !== 'undefined' ? INSIGHTS[slug] : null;
  if (insight) {
    if (html) html += '<hr class="section-divider">';
    html += renderInsightsSection(insight);
  }

  if (!html) html = '<div class="loading"><p>Sem dados disponíveis para o período selecionado.</p></div>';
  content.innerHTML = html;

  requestAnimationFrame(() => {
    if (chatbot) initChatbotCharts(client, chatbot);
    if (messaging) initMessagingCharts(messaging);
    document.querySelectorAll('[data-count]').forEach(el => {
      const val = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      animateValue(el, val);
      if (suffix) setTimeout(() => { el.textContent += suffix; }, 1900);
    });
  });
}

// ---- Chatbot Section (adapts per client context) ----
function renderChatbotSection(client, data, clicks) {
  const total = data.total_conversations;
  const aiRate = data.ai_resolution_rate;
  const msgsAI = data.messages_ai;
  const msgsHuman = data.messages_human;
  const aiOnly = data.conversations_ai_only;
  const withHuman = data.conversations_with_human;
  const kuttClicks = clicks?.total_clicks || 0;
  const activeChannels = Object.keys(data.channels || {});
  const context = client.context || 'standard';
  const leads = data.leads_total || data.leads_period || 0;

  const periodLabel = { '7d': '7 dias', '15d': '15 dias', '30d': '30 dias', 'this-month': 'este mês', 'last-month': 'mês anterior', 'custom': 'personalizado' }[currentPeriod] || '30 dias';

  // Adapt KPIs based on client context
  let kpiCards = '';

  // Conversas — always shown
  kpiCards += kpiCard('Conversas', total, periodLabel, 2);

  if (context === 'porteiro') {
    // Lojinha Bebé: focus on "handled without human"
    kpiCards += kpiCard('Resolvidas Sem Humano', aiOnly, `de ${total} conversas`, 3, aiRate >= 50 ? 'positive' : '');
    kpiCards += kpiCardPercent('% Sem Intervenção', aiRate, 4, aiRate >= 50 ? 'positive' : 'warning');
  } else if (context === 'leads') {
    // EcoDrive / Now Fitness: focus on leads
    if (leads > 0) kpiCards += kpiCard('Leads Recolhidos', leads, periodLabel, 3, 'positive');
    kpiCards += kpiCardPercent('Taxa Resolução IA', aiRate, leads > 0 ? 4 : 3, aiRate >= 70 ? 'positive' : aiRate >= 50 ? '' : 'warning');
  } else {
    // Standard: RR, HCO, Teclas, OdiSeguros
    kpiCards += kpiCardPercent('Taxa Resolução IA', aiRate, 3, aiRate >= 70 ? 'positive' : aiRate >= 50 ? '' : 'warning');
    kpiCards += kpiCard('Mensagens IA', msgsAI, `${formatNumber(msgsHuman)} humanas`, 4);
  }

  if (kuttClicks > 0) {
    kpiCards += kpiCard('Cliques em Produtos', kuttClicks, 'links partilhados pelo agente', 5);
  }

  // Charts
  let chartsHtml = '';
  if (activeChannels.length > 1) {
    chartsHtml += `<div class="chart-card glass fade-in fade-in-5"><h3>Conversas por Canal</h3><div class="chart-container" id="chart-channels"></div></div>`;
  }
  chartsHtml += `<div class="chart-card glass fade-in fade-in-5"><h3>${context === 'porteiro' ? 'Sem Humano vs Com Humano' : 'Resolução IA'}</h3><div class="chart-container" id="chart-ai-human"></div></div>`;

  const hasHourly = data.hourly_distribution?.some(h => h.count > 0);
  if (hasHourly) {
    chartsHtml += `<div class="chart-card glass fade-in fade-in-6"><h3>Distribuição Horária</h3><div class="chart-container" id="chart-hours"></div></div>`;
  }

  return `
    <div class="section-title fade-in fade-in-1">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7066A8" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      Agente IA
    </div>
    <div class="kpi-grid">${kpiCards}</div>
    <div class="charts-grid">${chartsHtml}</div>
  `;
}

// ---- Messaging Section ----
function renderMessagingSection(client, data) {
  const totalOp = data.total_operacionais;
  const totalAuto = data.total_automaticas;
  const totalMsgs = data.messages_sent;
  const totalOrders = data.total_orders;
  const totalRevenue = data.total_revenue;
  const hasOp = totalOp > 0;
  const hasAuto = totalAuto > 0;

  let tableRows = '';
  data.operacionais.forEach(r => {
    tableRows += `<tr><td>${r.tipo}</td><td><span class="tag tag-op">Operacional</span></td><td class="num">${formatNumber(r.total)}</td></tr>`;
  });
  data.automaticas.forEach(r => {
    tableRows += `<tr><td>${r.tipo}</td><td><span class="tag tag-mk">Marketing</span></td><td class="num">${formatNumber(r.total)}</td></tr>`;
  });

  let kpiCards = kpiCard('Total Mensagens', totalMsgs, '', 2);
  if (hasOp) kpiCards += kpiCard('Operacionais', totalOp, hasOp && hasAuto ? 'morada, MB, MBWay' : '', 3);
  if (hasAuto) kpiCards += kpiCard('Marketing', totalAuto, hasOp && hasAuto ? 'carrinhos, upsell' : '', hasOp ? 4 : 3);
  if (totalOrders > 0) kpiCards += kpiCard('Encomendas', totalOrders, `${formatNumber(totalRevenue)}€ receita`, 5);

  return `
    <div class="section-title fade-in fade-in-1">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7066A8" stroke-width="2"><path d="M22 2L11 13"></path><path d="M22 2L15 22L11 13L2 9L22 2Z"></path></svg>
      Mensagens Automáticas
    </div>
    <div class="kpi-grid">${kpiCards}</div>
    <div class="charts-grid">
      <div class="chart-card glass fade-in fade-in-5"><h3>Distribuição por Tipo</h3><div class="chart-container" id="chart-msg-types"></div></div>
      <div class="chart-card glass fade-in fade-in-6"><h3>Detalhe por Categoria</h3>
        ${tableRows ? `<table class="data-table"><thead><tr><th>Categoria</th><th>Tipo</th><th>Total</th></tr></thead><tbody>${tableRows}</tbody></table>` : '<p class="no-data">Sem dados.</p>'}
      </div>
    </div>
  `;
}

// ---- Insights Section ----
function renderInsightsSection(insight) {
  return `
    <div class="section-title fade-in fade-in-1">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
      Insights
    </div>
    <div class="insights-card glass fade-in fade-in-2">
      <div class="insights-header"><span class="insights-badge">AI Analysis</span></div>
      <div class="insights-content">${insight.text}</div>
      <div class="insights-date">Análise de ${insight.month}</div>
    </div>
  `;
}

// ---- KPI Card Helpers ----
function kpiCard(label, value, sub, fadeN, colorClass) {
  return `
    <div class="kpi-card glass fade-in fade-in-${fadeN}">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value ${colorClass || ''}" data-count="${value}">0</div>
      ${sub ? `<div class="kpi-sub">${sub}</div>` : ''}
    </div>`;
}

function kpiCardPercent(label, value, fadeN, colorClass) {
  return `
    <div class="kpi-card glass fade-in fade-in-${fadeN}">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value ${colorClass || ''}" data-count="${value}" data-suffix="%">0</div>
      <div class="kpi-sub">sem intervenção humana</div>
    </div>`;
}
