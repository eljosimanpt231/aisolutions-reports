// Date and formatting utilities
function getDateRange(period) {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '15d':
      start.setDate(end.getDate() - 15);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case 'this-month':
      start.setDate(1);
      break;
    case 'last-month':
      start.setMonth(end.getMonth() - 1, 1);
      end.setDate(0); // last day of previous month
      break;
    default:
      start.setDate(end.getDate() - 30);
  }

  return {
    start: formatDate(start),
    end: formatDate(end)
  };
}

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

function formatNumber(n) {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat('pt-PT').format(n);
}

function formatPercent(n) {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(n) + '%';
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function getMonthName(monthIndex) {
  return MONTH_NAMES[monthIndex];
}
