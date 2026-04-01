// Main dashboard orchestrator
let currentPeriod = '30d';
let currentClient = null;

async function initDashboard(slug) {
  currentClient = CLIENTS[slug];
  if (!currentClient) return;

  setupPeriodSelector();
  await loadData();
}

function setupPeriodSelector() {
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelector('.period-btn.active')?.classList.remove('active');
      btn.classList.add('active');
      currentPeriod = btn.dataset.period;
      await loadData();
    });
  });
}

async function loadData() {
  const { start, end } = getDateRange(currentPeriod);
  const slug = getClientSlug();
  const client = CLIENTS[slug];

  showLoading();

  const promises = [];

  if (client.services.includes('chatbot') && client.schema) {
    promises.push(getChatbotMetrics(client.schema, start, end));
  } else {
    promises.push(Promise.resolve(null));
  }

  if (client.services.includes('messaging') && client.schema) {
    promises.push(getMessagingMetrics(client.schema, start, end));
  } else {
    promises.push(Promise.resolve(null));
  }

  promises.push(getClickMetrics(client.domainId, start, end));

  const [chatbot, messaging, clicks] = await Promise.all(promises);
  renderDashboard(client, chatbot, messaging, clicks);
}

function showLoading() {
  const content = document.getElementById('dashboard-content');
  content.innerHTML = '<div class="loading"><div class="spinner"></div>A carregar dados...</div>';
}

function renderDashboard(client, chatbot, messaging, clicks) {
  const content = document.getElementById('dashboard-content');
  let html = '';

  if (client.services.includes('chatbot') && chatbot) {
    html += renderChatbotSection(client, chatbot, clicks);
  }

  if (client.services.includes('messaging') && messaging) {
    if (html) html += '<hr class="section-divider">';
    html += renderMessagingSection(client, messaging, clicks);
  }

  if (!html) {
    html = '<div class="loading"><p>Sem dados disponíveis para o período selecionado.</p></div>';
  }

  content.innerHTML = html;

  // Init charts after DOM render
  requestAnimationFrame(() => {
    if (chatbot) initChatbotCharts(client, chatbot);
    if (messaging) initMessagingCharts(messaging);
  });
}

// ---- Chatbot Section ----
function renderChatbotSection(client, data, clicks) {
  const total = data.total_conversations || 0;
  const aiRate = data.ai_resolution_rate || 0;
  const msgsAI = data.messages_ai || 0;
  const msgsHuman = data.messages_human || 0;
  const totalClicks = clicks?.total_clicks || 0;
  const aiRateClass = aiRate >= 70 ? 'positive' : aiRate >= 50 ? '' : 'warning';

  const periodLabel = {
    '7d': '7 dias', '15d': '15 dias', '30d': '30 dias',
    'this-month': 'este mês', 'last-month': 'mês anterior'
  }[currentPeriod] || '30 dias';

  return `
    <div class="section-title">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7066A8" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      Agente IA
    </div>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Conversas</div>
        <div class="kpi-value">${formatNumber(total)}</div>
        <div class="kpi-sub">${periodLabel}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Taxa Resolução IA</div>
        <div class="kpi-value ${aiRateClass}">${formatPercent(aiRate)}</div>
        <div class="kpi-sub">sem intervenção humana</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Mensagens IA</div>
        <div class="kpi-value">${formatNumber(msgsAI)}</div>
        <div class="kpi-sub">${formatNumber(msgsHuman)} humanas</div>
      </div>
      ${totalClicks ? `
      <div class="kpi-card">
        <div class="kpi-label">Cliques em Produtos</div>
        <div class="kpi-value">${formatNumber(totalClicks)}</div>
        <div class="kpi-sub">links partilhados pelo agente</div>
      </div>` : ''}
    </div>
    <div class="charts-grid">
      ${client.channels.length > 1 ? `
      <div class="chart-card">
        <h3>Conversas por Canal</h3>
        <div class="chart-container"><canvas id="chart-channels"></canvas></div>
      </div>` : ''}
      <div class="chart-card">
        <h3>Resolução: IA vs Humano</h3>
        <div class="chart-container"><canvas id="chart-ai-human"></canvas></div>
      </div>
      <div class="chart-card">
        <h3>Distribuição Horária</h3>
        <div class="chart-container"><canvas id="chart-hours"></canvas></div>
      </div>
    </div>
  `;
}

// ---- Messaging Section ----
function renderMessagingSection(client, data, clicks) {
  const opRows = data.operacionais || [];
  const mkRows = data.automaticas || [];
  const totalOp = opRows.reduce((s, r) => s + (r.total || 0), 0);
  const totalMk = mkRows.reduce((s, r) => s + (r.total || 0), 0);
  const totalMsgs = data.messages_sent || (totalOp + totalMk);
  const totalClicks = data.total_clicks || clicks?.total_clicks || 0;
  const totalOrders = data.total_orders || 0;
  const totalRevenue = data.total_revenue || 0;
  const clickRate = data.click_rate || (totalMsgs > 0 ? ((totalClicks / totalMsgs) * 100) : 0);
  const growth = data.growth || {};

  // Build detail table
  let tableRows = '';
  opRows.forEach(r => {
    tableRows += `<tr><td>${r.tipo || r.categoria}</td><td><span class="tag tag-op">Operacional</span></td><td class="num">${formatNumber(r.total)}</td></tr>`;
  });
  mkRows.forEach(r => {
    tableRows += `<tr><td>${r.tipo || r.categoria}</td><td><span class="tag tag-mk">Marketing</span></td><td class="num">${formatNumber(r.total)}</td></tr>`;
  });

  return `
    <div class="section-title">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7066A8" stroke-width="2"><path d="M22 2L11 13"></path><path d="M22 2L15 22L11 13L2 9L22 2Z"></path></svg>
      Mensagens Automáticas
    </div>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Mensagens Enviadas</div>
        <div class="kpi-value">${formatNumber(totalMsgs)}</div>
        ${growth.messages ? `<div class="kpi-sub growth ${growth.messages >= 0 ? 'up' : 'down'}">${growth.messages >= 0 ? '↑' : '↓'} ${Math.abs(growth.messages).toFixed(1)}% vs período anterior</div>` : ''}
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Cliques</div>
        <div class="kpi-value">${formatNumber(totalClicks)}</div>
        <div class="kpi-sub">taxa: ${formatPercent(clickRate)}</div>
      </div>
      ${totalOrders > 0 ? `
      <div class="kpi-card">
        <div class="kpi-label">Encomendas Atribuídas</div>
        <div class="kpi-value">${formatNumber(totalOrders)}</div>
        ${growth.orders ? `<div class="kpi-sub growth ${growth.orders >= 0 ? 'up' : 'down'}">${growth.orders >= 0 ? '↑' : '↓'} ${Math.abs(growth.orders).toFixed(1)}%</div>` : ''}
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Receita Atribuída</div>
        <div class="kpi-value">${formatNumber(totalRevenue)}€</div>
        ${growth.revenue ? `<div class="kpi-sub growth ${growth.revenue >= 0 ? 'up' : 'down'}">${growth.revenue >= 0 ? '↑' : '↓'} ${Math.abs(growth.revenue).toFixed(1)}%</div>` : ''}
      </div>` : `
      <div class="kpi-card">
        <div class="kpi-label">Operacionais</div>
        <div class="kpi-value">${formatNumber(totalOp)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Marketing</div>
        <div class="kpi-value">${formatNumber(totalMk)}</div>
      </div>`}
    </div>
    <div class="charts-grid">
      <div class="chart-card">
        <h3>Distribuição por Tipo</h3>
        <div class="chart-container"><canvas id="chart-msg-types"></canvas></div>
      </div>
      <div class="chart-card">
        <h3>Detalhe por Categoria</h3>
        ${tableRows ? `
        <table class="data-table">
          <thead><tr><th>Categoria</th><th>Tipo</th><th>Total</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>` : '<p class="no-data">Sem dados para este período.</p>'}
      </div>
    </div>
  `;
}
