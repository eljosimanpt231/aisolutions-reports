// Password gate
function getClientSlug() {
  const path = window.location.pathname.replace(/\/$/, '');
  const parts = path.split('/');
  return parts[parts.length - 1] || parts[parts.length - 2];
}

function isAuthenticated(slug) {
  return sessionStorage.getItem(`auth_${slug}`) === 'true';
}

function authenticate(slug, password) {
  const client = CLIENTS[slug];
  if (!client) return false;
  if (password === client.password) {
    sessionStorage.setItem(`auth_${slug}`, 'true');
    return true;
  }
  return false;
}

function showPasswordGate(slug) {
  const overlay = document.getElementById('password-overlay');
  const dashboard = document.getElementById('dashboard');
  const form = document.getElementById('password-form');
  const input = document.getElementById('password-input');
  const error = document.getElementById('password-error');

  overlay.style.display = 'flex';
  dashboard.style.display = 'none';

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (authenticate(slug, input.value)) {
      overlay.style.display = 'none';
      dashboard.style.display = 'block';
      initDashboard(slug);
    } else {
      error.textContent = 'Password incorreta';
      error.style.display = 'block';
      input.value = '';
      input.focus();
    }
  });

  input.focus();
}

function initAuth() {
  const slug = getClientSlug();
  const client = CLIENTS[slug];

  if (!client) {
    document.body.innerHTML = '<div style="text-align:center;margin-top:100px"><h1>Cliente não encontrado</h1></div>';
    return;
  }

  document.getElementById('client-name').textContent = client.name;
  document.title = `${client.name} — Reports | AI Solutions`;

  if (isAuthenticated(slug)) {
    document.getElementById('password-overlay').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    initDashboard(slug);
  } else {
    showPasswordGate(slug);
  }
}

document.addEventListener('DOMContentLoaded', initAuth);
