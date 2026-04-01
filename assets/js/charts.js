// Chart.js initialization helpers
const CHART_COLORS = {
  primary: '#7066A8',
  primaryLight: '#8B82BE',
  secondary: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  whatsapp: '#25D366',
  instagram: '#E1306C',
  facebook: '#1877F2',
  grid: '#f0f0f0',
  text: '#6b7280'
};

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 16,
        usePointStyle: true,
        pointStyleWidth: 8,
        font: { size: 12 }
      }
    }
  }
};

function initChatbotCharts(client, data) {
  // Channels bar chart
  if (client.channels.length > 1 && document.getElementById('chart-channels')) {
    const channelData = data.channels || {};
    new Chart(document.getElementById('chart-channels'), {
      type: 'bar',
      data: {
        labels: client.channels.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
        datasets: [{
          label: 'Conversas',
          data: client.channels.map(c => channelData[c]?.conversations || 0),
          backgroundColor: client.channels.map(c => CHART_COLORS[c] || CHART_COLORS.primary),
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        ...commonOptions,
        plugins: { ...commonOptions.plugins, legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: CHART_COLORS.grid }, ticks: { color: CHART_COLORS.text } },
          x: { grid: { display: false }, ticks: { color: CHART_COLORS.text } }
        }
      }
    });
  }

  // AI vs Human doughnut
  if (document.getElementById('chart-ai-human')) {
    new Chart(document.getElementById('chart-ai-human'), {
      type: 'doughnut',
      data: {
        labels: ['Resolvido pela IA', 'Intervenção Humana'],
        datasets: [{
          data: [data.conversations_ai_only || 0, data.conversations_with_human || 0],
          backgroundColor: [CHART_COLORS.primary, CHART_COLORS.warning],
          borderWidth: 0
        }]
      },
      options: {
        ...commonOptions,
        cutout: '65%'
      }
    });
  }

  // Hourly distribution
  if (document.getElementById('chart-hours') && data.hourly_distribution) {
    new Chart(document.getElementById('chart-hours'), {
      type: 'bar',
      data: {
        labels: data.hourly_distribution.map(h => `${h.hour}h`),
        datasets: [{
          label: 'Mensagens',
          data: data.hourly_distribution.map(h => h.count),
          backgroundColor: CHART_COLORS.primaryLight,
          borderRadius: 3,
          borderSkipped: false
        }]
      },
      options: {
        ...commonOptions,
        plugins: { ...commonOptions.plugins, legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: CHART_COLORS.grid }, ticks: { color: CHART_COLORS.text } },
          x: { grid: { display: false }, ticks: { color: CHART_COLORS.text, font: { size: 10 } } }
        }
      }
    });
  }
}

function initMessagingCharts(data) {
  if (!document.getElementById('chart-msg-types')) return;

  const opTotal = (data.operacionais || []).reduce((s, r) => s + r.total, 0);
  const mkTotal = (data.automaticas || []).reduce((s, r) => s + r.total, 0);

  new Chart(document.getElementById('chart-msg-types'), {
    type: 'doughnut',
    data: {
      labels: ['Operacionais', 'Marketing'],
      datasets: [{
        data: [opTotal, mkTotal],
        backgroundColor: [CHART_COLORS.secondary, CHART_COLORS.primary],
        borderWidth: 0
      }]
    },
    options: {
      ...commonOptions,
      cutout: '65%'
    }
  });
}
