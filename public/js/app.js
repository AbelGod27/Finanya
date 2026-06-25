const API = '/api';
let currentUser = null;
let bsModal = null;

// ===== UTILS =====
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

async function request(path, options = {}) {
  const token = localStorage.getItem('finanya-token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { headers, ...options });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

function formatMoney(n) {
  return `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function showError(elementId, msg) {
  const el = $(`#${elementId}`);
  el.textContent = msg;
  el.classList.remove('d-none');
  setTimeout(() => el.classList.add('d-none'), 4000);
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container') || createToastContainer();
  const icons = { success: 'check-circle-fill', danger: 'x-circle-fill', warning: 'exclamation-triangle-fill', info: 'info-circle-fill' };
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-bg-${type} border-0 show`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body"><i class="bi bi-${icons[type] || icons.info} me-2"></i>${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3500);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container position-fixed top-0 end-0 p-3';
  container.style.zIndex = '1090';
  document.body.appendChild(container);
  return container;
}

// ===== CONFIRM DIALOG =====
function showConfirm(message, onConfirm) {
  const modal = document.getElementById('confirmModal') || createConfirmModal();
  const bsConfirm = bootstrap.Modal.getOrCreateInstance(modal);
  modal.querySelector('.confirm-message').textContent = message;
  const btnConfirm = modal.querySelector('.btn-confirm-yes');
  const newBtn = btnConfirm.cloneNode(true);
  btnConfirm.parentNode.replaceChild(newBtn, btnConfirm);
  newBtn.addEventListener('click', () => { bsConfirm.hide(); onConfirm(); });
  bsConfirm.show();
}

function createConfirmModal() {
  const modal = document.createElement('div');
  modal.id = 'confirmModal';
  modal.className = 'modal fade';
  modal.tabIndex = -1;
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered modal-sm">
      <div class="modal-content">
        <div class="modal-body text-center py-4">
          <i class="bi bi-exclamation-triangle text-warning fs-1 mb-3 d-block"></i>
          <p class="confirm-message mb-0"></p>
        </div>
        <div class="modal-footer justify-content-center border-0 pt-0">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="button" class="btn btn-danger btn-confirm-yes">Eliminar</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  return modal;
}

// ===== THEME =====
function initTheme() {
  const saved = localStorage.getItem('finanya-theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
    $('#theme-switch').checked = true;
  } else {
    document.documentElement.setAttribute('data-bs-theme', 'light');
    $('#theme-switch').checked = false;
  }
}

$('#theme-switch').addEventListener('change', (e) => {
  if (e.target.checked) {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
    localStorage.setItem('finanya-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-bs-theme', 'light');
    localStorage.setItem('finanya-theme', 'light');
  }
});

// ===== LANDING PAGE =====
$('#landing-login').addEventListener('click', () => { showAuth('login'); });
$('#landing-registro').addEventListener('click', () => { showAuth('registro'); });
$('#hero-start').addEventListener('click', () => { showAuth('registro'); });

function showAuth(type) {
  $('#landing-container').classList.add('d-none');
  $('#auth-container').classList.remove('d-none');
  if (type === 'registro') {
    $('#login-form').classList.add('d-none');
    $('#registro-form').classList.remove('d-none');
  } else {
    $('#registro-form').classList.add('d-none');
    $('#login-form').classList.remove('d-none');
  }
}

// ===== TOGGLE PASSWORD =====
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.toggle-pass');
  if (!btn) return;
  const input = document.getElementById(btn.dataset.target);
  const icon = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'bi bi-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'bi bi-eye';
  }
});

// ===== AUTH =====
$('#show-registro').addEventListener('click', (e) => {
  e.preventDefault();
  $('#login-form').classList.add('d-none');
  $('#registro-form').classList.remove('d-none');
});

$('#show-login').addEventListener('click', (e) => {
  e.preventDefault();
  $('#registro-form').classList.add('d-none');
  $('#login-form').classList.remove('d-none');
});

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        correo: $('#login-correo').value,
        password: $('#login-password').value
      })
    });
    currentUser = data.usuario;
    localStorage.setItem('finanya-user', JSON.stringify(currentUser));
    localStorage.setItem('finanya-token', data.token);
    showToast('Bienvenido, ' + currentUser.nombre, 'success');
    showApp();
  } catch (err) {
    showError('login-error', err.error || 'Error al iniciar sesión');
  }
});

$('#registro-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await request('/auth/registro', {
      method: 'POST',
      body: JSON.stringify({
        nombre: $('#reg-nombre').value,
        correo: $('#reg-correo').value,
        password: $('#reg-password').value
      })
    });
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        correo: $('#reg-correo').value,
        password: $('#reg-password').value
      })
    });
    currentUser = data.usuario;
    localStorage.setItem('finanya-user', JSON.stringify(currentUser));
    localStorage.setItem('finanya-token', data.token);
    showToast('Cuenta creada exitosamente', 'success');
    showApp();
  } catch (err) {
    showError('registro-error', err.error || err.errores?.join(', ') || 'Error al registrarse');
  }
});

$('#btn-logout').addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem('finanya-user');
  localStorage.removeItem('finanya-token');
  $('#app-container').classList.add('d-none');
  $('#landing-container').classList.remove('d-none');
  showToast('Sesión cerrada', 'info');
});

// ===== NAVIGATION =====
$$('.nav-link[data-section]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = link.dataset.section;
    $$('.nav-link[data-section]').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    $$('.section').forEach(s => s.classList.add('d-none'));
    $(`#section-${section}`).classList.remove('d-none');
    if (section === 'dashboard') loadDashboard();
    if (section === 'ingresos') loadIngresos();
    if (section === 'gastos') loadGastos();
    if (section === 'categorias') loadCategorias();
    if (section === 'metas') loadMetas();
    if (section === 'analisis') loadAnalisis();
    if (section === 'presupuestos') loadPresupuestos();
    if (section === 'perfil') loadPerfil();
    const navCollapse = document.querySelector('.navbar-collapse');
    if (navCollapse.classList.contains('show')) {
      bootstrap.Collapse.getInstance(navCollapse)?.hide();
    }
  });
});

// Stat cards navigation
document.addEventListener('click', (e) => {
  const card = e.target.closest('[data-navigate]');
  if (!card) return;
  const section = card.dataset.navigate;
  navigateToSection(section);
});

function navigateToSection(section) {
  $$('.nav-link[data-section]').forEach(l => l.classList.remove('active'));
  const link = document.querySelector(`.nav-link[data-section="${section}"]`);
  if (link) link.classList.add('active');
  $$('.section').forEach(s => s.classList.add('d-none'));
  $(`#section-${section}`).classList.remove('d-none');
  if (section === 'dashboard') loadDashboard();
  if (section === 'ingresos') loadIngresos();
  if (section === 'gastos') loadGastos();
  if (section === 'categorias') loadCategorias();
  if (section === 'metas') loadMetas();
  if (section === 'analisis') loadAnalisis();
  if (section === 'presupuestos') loadPresupuestos();
  if (section === 'perfil') loadPerfil();
}

// ===== MODAL =====
function openModal(title, fields, onSubmit) {
  $('#modal-title').textContent = title;
  const body = $('#modal-body');
  body.innerHTML = '';

  fields.forEach(f => {
    const group = document.createElement('div');
    group.className = 'mb-3';
    if (f.type === 'select') {
      group.innerHTML = `<label class="form-label">${f.label}</label><select class="form-select" name="${f.name}" ${f.required ? 'required' : ''}>${f.options.map(o => `<option value="${o.value}" ${o.selected ? 'selected' : ''}>${o.label}</option>`).join('')}</select>`;
    } else {
      group.innerHTML = `<label class="form-label">${f.label}</label><input type="${f.type || 'text'}" class="form-control" name="${f.name}" value="${f.value || ''}" ${f.required ? 'required' : ''} ${f.step ? `step="${f.step}"` : ''} ${f.min ? `min="${f.min}"` : ''} placeholder="${f.placeholder || ''}">`;
    }
    body.appendChild(group);
  });

  if (!bsModal) {
    bsModal = new bootstrap.Modal($('#appModal'));
  }
  bsModal.show();

  $('#modal-form').onsubmit = (e) => {
    e.preventDefault();
    const formData = new FormData($('#modal-form'));
    const data = Object.fromEntries(formData);
    onSubmit(data);
  };
}

function closeModal() {
  if (bsModal) bsModal.hide();
}

// ===== APP INIT =====
function showApp() {
  $('#landing-container').classList.add('d-none');
  $('#auth-container').classList.add('d-none');
  $('#app-container').classList.remove('d-none');
  $('#user-name').textContent = currentUser.nombre;
  $('#user-avatar').textContent = currentUser.nombre.charAt(0).toUpperCase();
  loadMotivation();
  loadDashboard();
  loadCategorias();
  loadUserAvatar();
  checkAdmin();
}

async function loadUserAvatar() {
  try {
    const perfil = await request(`/auth/perfil/${currentUser.id_usuario}`);
    if (perfil.avatar_url) {
      $('#user-avatar').innerHTML = `<img src="${perfil.avatar_url}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;">`;
    }
  } catch (err) { /* silent */ }
}

// ===== MOTIVATIONAL QUOTES =====
const quotes = [
  "El mejor momento para empezar a ahorrar fue ayer. El segundo mejor momento es ahora.",
  "No se trata de cuánto ganas, sino de cuánto conservas.",
  "Un presupuesto es decirle a tu dinero a dónde ir, en vez de preguntarte a dónde se fue.",
  "La riqueza no se construye en un día, se construye día a día.",
  "Cada peso ahorrado es un paso más hacia tu libertad financiera.",
  "Gastar menos de lo que ganas es el primer paso hacia la abundancia.",
  "Tus hábitos financieros de hoy definen tu tranquilidad de mañana.",
  "Invertir en ti mismo es la mejor decisión financiera que puedes tomar."
];

function loadMotivation() {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  $('#motivation-quote').textContent = quote;
}

// ===== DASHBOARD =====
async function loadDashboard() {
  try {
    const [ingresos, gastos, metas] = await Promise.all([
      request(`/ingresos/usuario/${currentUser.id_usuario}`),
      request(`/gastos/usuario/${currentUser.id_usuario}`),
      request(`/metas/usuario/${currentUser.id_usuario}`)
    ]);

    const now = new Date();
    const mesActual = now.getMonth();
    const anioActual = now.getFullYear();

    const ingresosMes = ingresos.filter(i => {
      const f = new Date(i.fecha);
      return f.getMonth() === mesActual && f.getFullYear() === anioActual;
    });
    const gastosMes = gastos.filter(g => {
      const f = new Date(g.fecha);
      return f.getMonth() === mesActual && f.getFullYear() === anioActual;
    });

    const totalIngresos = ingresosMes.reduce((s, i) => s + Number(i.monto), 0);
    const totalGastos = gastosMes.reduce((s, g) => s + Number(g.monto), 0);
    const totalAhorro = metas.reduce((s, m) => s + Number(m.monto_actual), 0);

    $('#total-ingresos').textContent = formatMoney(totalIngresos);
    $('#total-gastos').textContent = formatMoney(totalGastos);
    $('#balance').textContent = formatMoney(totalIngresos - totalGastos - totalAhorro);
    $('#total-ahorro').textContent = formatMoney(totalAhorro);

    // Stats: top category, average, savings rate
    if (gastosMes.length > 0) {
      const gastosPorCat = {};
      gastosMes.forEach(g => {
        const cat = g.categoria_nombre || 'Otros';
        gastosPorCat[cat] = (gastosPorCat[cat] || 0) + Number(g.monto);
      });
      const topCat = Object.entries(gastosPorCat).sort((a, b) => b[1] - a[1])[0];
      $('#top-category').textContent = `${topCat[0]} (${formatMoney(topCat[1])})`;
    } else {
      $('#top-category').textContent = '-';
    }

    const avgGastos = gastos.length > 0 ? gastos.reduce((s, g) => s + Number(g.monto), 0) / Math.max(1, new Set(gastos.map(g => new Date(g.fecha).getMonth())).size) : 0;
    $('#avg-monthly').textContent = formatMoney(avgGastos);

    const savingsRate = totalIngresos > 0 ? Math.round((totalAhorro / totalIngresos) * 100) : 0;
    $('#savings-rate').textContent = `${savingsRate}%`;

    // ===== CHARTS =====
    renderChartGastos(gastosMes);
    renderChartIngresos(ingresos);

    // Cargar presupuestos en el dashboard
    loadDashboardPresupuestos();

    // Últimos movimientos
    const movimientos = [
      ...ingresos.map(i => ({ ...i, tipo: 'ingreso' })),
      ...gastos.map(g => ({ ...g, tipo: 'gasto' }))
    ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 8);

    const container = $('#ultimos-movimientos');
    if (movimientos.length === 0) {
      container.innerHTML = '<p class="text-muted text-center fst-italic">No hay movimientos registrados</p>';
    } else {
      container.innerHTML = movimientos.map(m => `
        <div class="movimiento-item">
          <div>
            <div class="fw-semibold">${m.descripcion}</div>
            <small class="text-muted">${new Date(m.fecha).toLocaleDateString('es-MX')} · ${m.categoria_nombre || ''}</small>
          </div>
          <span class="${m.tipo === 'ingreso' ? 'mov-ingreso' : 'mov-gasto'}">
            ${m.tipo === 'ingreso' ? '+' : '-'}${formatMoney(m.monto)}
          </span>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Error cargando dashboard:', err);
  }
}

// ===== CHARTS =====
let chartGastos = null;
let chartIngresos = null;

const chartColors = ['#38bdf8', '#a78bfa', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

function getChartTheme() {
  const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
  return {
    textColor: isDark ? '#94a3b8' : '#64748b',
    gridColor: isDark ? '#334155' : '#e2e8f0',
    bgColor: isDark ? '#1e293b' : '#ffffff'
  };
}

function renderChartGastos(gastosMes) {
  const canvas = $('#chart-gastos-categoria');
  const emptyMsg = $('#chart-gastos-empty');

  if (gastosMes.length === 0) {
    canvas.style.display = 'none';
    emptyMsg.classList.remove('d-none');
    if (chartGastos) { chartGastos.destroy(); chartGastos = null; }
    return;
  }

  canvas.style.display = 'block';
  emptyMsg.classList.add('d-none');

  const gastosPorCat = {};
  gastosMes.forEach(g => {
    const cat = g.categoria_nombre || 'Otros';
    gastosPorCat[cat] = (gastosPorCat[cat] || 0) + Number(g.monto);
  });

  const labels = Object.keys(gastosPorCat);
  const data = Object.values(gastosPorCat);
  const theme = getChartTheme();

  if (chartGastos) chartGastos.destroy();

  chartGastos = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: chartColors.slice(0, labels.length),
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: theme.textColor, padding: 12, usePointStyle: true, pointStyle: 'circle', font: { size: 11 } }
        },
        tooltip: {
          backgroundColor: theme.bgColor,
          titleColor: theme.textColor,
          bodyColor: theme.textColor,
          borderColor: theme.gridColor,
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${formatMoney(ctx.raw)}`
          }
        }
      }
    }
  });
}

function renderChartIngresos(ingresos) {
  const canvas = $('#chart-ingresos-mes');
  const emptyMsg = $('#chart-ingresos-empty');

  if (ingresos.length === 0) {
    canvas.style.display = 'none';
    emptyMsg.classList.remove('d-none');
    if (chartIngresos) { chartIngresos.destroy(); chartIngresos = null; }
    return;
  }

  canvas.style.display = 'block';
  emptyMsg.classList.add('d-none');

  // Group by last 6 months
  const now = new Date();
  const months = [];
  const monthData = [];
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${monthNames[d.getMonth()]} ${d.getFullYear()}`);
    const total = ingresos
      .filter(ing => {
        const f = new Date(ing.fecha);
        return f.getMonth() === d.getMonth() && f.getFullYear() === d.getFullYear();
      })
      .reduce((s, ing) => s + Number(ing.monto), 0);
    monthData.push(total);
  }

  const theme = getChartTheme();

  if (chartIngresos) chartIngresos.destroy();

  chartIngresos = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'Ingresos',
        data: monthData,
        backgroundColor: 'rgba(56, 189, 248, 0.6)',
        borderColor: '#38bdf8',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: theme.gridColor },
          ticks: { color: theme.textColor, font: { size: 11 }, callback: (v) => '$' + v.toLocaleString() }
        },
        x: {
          grid: { display: false },
          ticks: { color: theme.textColor, font: { size: 11 } }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: theme.bgColor,
          titleColor: theme.textColor,
          bodyColor: theme.textColor,
          borderColor: theme.gridColor,
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => ` Ingresos: ${formatMoney(ctx.raw)}`
          }
        }
      }
    }
  });
}

// Re-render charts on theme change
$('#theme-switch').addEventListener('change', () => {
  setTimeout(() => { if (currentUser) loadDashboard(); }, 100);
});

// ===== CATEGORÍAS =====
let categorias = [];

async function loadCategorias() {
  try {
    categorias = await request(`/categorias/usuario/${currentUser.id_usuario}`);
    renderCategorias();
  } catch (err) {
    console.error('Error cargando categorías:', err);
  }
}

function renderCategorias() {
  const container = $('#lista-categorias');
  const filtro = $('#filtro-cat-tipo').value;
  const filtered = filtro ? categorias.filter(c => c.tipo === filtro) : categorias;

  if (filtered.length === 0) {
    container.innerHTML = '<p class="text-muted text-center fst-italic">No hay categorías registradas</p>';
    return;
  }
  container.innerHTML = `<div class="table-responsive"><table class="table table-hover align-middle mb-0">
    <thead><tr><th style="width:50%">Nombre</th><th style="width:25%">Tipo</th><th style="width:25%" class="text-end">Acciones</th></tr></thead>
    <tbody>${filtered.map(c => `
      <tr>
        <td class="fw-medium">${c.nombre}</td>
        <td><span class="badge rounded-pill bg-${c.tipo === 'ingreso' ? 'success' : 'danger'} bg-opacity-10 text-${c.tipo === 'ingreso' ? 'success' : 'danger'} text-uppercase">${c.tipo}</span></td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-secondary rounded-circle me-1" onclick="editCategoria(${c.id_categoria})" title="Editar"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger rounded-circle" onclick="deleteCategoria(${c.id_categoria})" title="Eliminar"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('')}</tbody>
  </table></div>`;
}

$('#filtro-cat-tipo').addEventListener('change', () => renderCategorias());

$('#btn-nueva-categoria').addEventListener('click', () => {
  openModal('Nueva Categoría', [
    { name: 'nombre', label: 'Nombre', required: true, placeholder: 'Ej: Alimentación' },
    { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: [
      { value: 'gasto', label: 'Gasto' },
      { value: 'ingreso', label: 'Ingreso' }
    ]}
  ], async (data) => {
    try {
      await request('/categorias', { method: 'POST', body: JSON.stringify({ ...data, id_usuario: currentUser.id_usuario }) });
      closeModal();
      loadCategorias();
      showToast('Categoría creada', 'success');
    } catch (err) { showToast(err.error || 'Error al crear categoría', 'danger'); }
  });
});

window.editCategoria = (id) => {
  const cat = categorias.find(c => c.id_categoria === id);
  openModal('Editar Categoría', [
    { name: 'nombre', label: 'Nombre', required: true, value: cat.nombre },
    { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: [
      { value: 'gasto', label: 'Gasto', selected: cat.tipo === 'gasto' },
      { value: 'ingreso', label: 'Ingreso', selected: cat.tipo === 'ingreso' }
    ]}
  ], async (data) => {
    try {
      await request(`/categorias/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      closeModal();
      loadCategorias();
      showToast('Categoría actualizada', 'success');
    } catch (err) { showToast(err.error || 'Error al editar categoría', 'danger'); }
  });
};

window.deleteCategoria = async (id) => {
  showConfirm('¿Eliminar esta categoría?', async () => {
    try {
      await request(`/categorias/${id}`, { method: 'DELETE' });
      loadCategorias();
      showToast('Categoría eliminada', 'success');
    } catch (err) { showToast(err.error || 'Error al eliminar categoría', 'danger'); }
  });
};

// ===== INGRESOS =====
$('#btn-nuevo-ingreso').addEventListener('click', () => {
  const catIngresos = categorias.filter(c => c.tipo === 'ingreso');
  if (catIngresos.length === 0) { showToast('Primero crea una categoría de tipo ingreso', 'warning'); return; }
  openModal('Nuevo Ingreso', [
    { name: 'monto', label: 'Monto', type: 'number', required: true, step: '0.01', min: '0.01', placeholder: '0.00' },
    { name: 'descripcion', label: 'Descripción', required: true, placeholder: 'Ej: Salario mensual' },
    { name: 'fecha', label: 'Fecha', type: 'date', required: true, value: new Date().toISOString().split('T')[0] },
    { name: 'id_categoria', label: 'Categoría', type: 'select', required: true, options: catIngresos.map(c => ({ value: c.id_categoria, label: c.nombre })) }
  ], async (data) => {
    try {
      await request('/ingresos', { method: 'POST', body: JSON.stringify({ ...data, id_usuario: currentUser.id_usuario }) });
      closeModal();
      loadIngresos();
      loadDashboard();
      showToast('Ingreso registrado', 'success');
    } catch (err) { showToast(err.error || 'Error al crear ingreso', 'danger'); }
  });
});

async function loadIngresos() {
  try {
    const ingresos = await request(`/ingresos/usuario/${currentUser.id_usuario}`);
    const container = $('#lista-ingresos');
    if (ingresos.length === 0) {
      container.innerHTML = '<p class="text-muted text-center fst-italic">No hay ingresos registrados</p>';
      return;
    }
    container.innerHTML = `<div class="table-responsive"><table class="table table-hover mb-0">
      <thead><tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Monto</th><th>Acciones</th></tr></thead>
      <tbody>${ingresos.map(i => `
        <tr>
          <td>${new Date(i.fecha).toLocaleDateString('es-MX')}</td>
          <td>${i.descripcion}</td>
          <td><span class="badge bg-success">${i.categoria_nombre}</span></td>
          <td class="mov-ingreso fw-bold">${formatMoney(i.monto)}</td>
          <td>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteIngreso(${i.id_ingreso})"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      `).join('')}</tbody>
    </table></div>`;
  } catch (err) { console.error('Error cargando ingresos:', err); }
}

window.deleteIngreso = async (id) => {
  showConfirm('¿Eliminar este ingreso?', async () => {
    try {
      await request(`/ingresos/${id}`, { method: 'DELETE' });
      loadIngresos();
      loadDashboard();
      showToast('Ingreso eliminado', 'success');
    } catch (err) { showToast(err.error || 'Error al eliminar', 'danger'); }
  });
};

// ===== GASTOS =====
$('#btn-nuevo-gasto').addEventListener('click', () => {
  const catGastos = categorias.filter(c => c.tipo === 'gasto');
  if (catGastos.length === 0) { showToast('Primero crea una categoría de tipo gasto', 'warning'); return; }
  openModal('Nuevo Gasto', [
    { name: 'monto', label: 'Monto', type: 'number', required: true, step: '0.01', min: '0.01', placeholder: '0.00' },
    { name: 'descripcion', label: 'Descripción', required: true, placeholder: 'Ej: Supermercado' },
    { name: 'fecha', label: 'Fecha', type: 'date', required: true, value: new Date().toISOString().split('T')[0] },
    { name: 'metodo_pago', label: 'Método de pago', type: 'select', required: true, options: [
      { value: 'Efectivo', label: 'Efectivo', selected: true },
      { value: 'Tarjeta de débito', label: 'Tarjeta de débito' },
      { value: 'Tarjeta de crédito', label: 'Tarjeta de crédito' },
      { value: 'Transferencia', label: 'Transferencia' },
      { value: 'Pago móvil', label: 'Pago móvil' }
    ]},
    { name: 'id_categoria', label: 'Categoría', type: 'select', required: true, options: catGastos.map(c => ({ value: c.id_categoria, label: c.nombre })) }
  ], async (data) => {
    try {
      await request('/gastos', { method: 'POST', body: JSON.stringify({ ...data, id_usuario: currentUser.id_usuario }) });
      closeModal();
      loadGastos();
      loadDashboard();
      showToast('Gasto registrado', 'success');
    } catch (err) { showToast(err.error || 'Error al crear gasto', 'danger'); }
  });
});

async function loadGastos() {
  try {
    const gastos = await request(`/gastos/usuario/${currentUser.id_usuario}`);
    const container = $('#lista-gastos');
    if (gastos.length === 0) {
      container.innerHTML = '<p class="text-muted text-center fst-italic">No hay gastos registrados</p>';
      return;
    }
    container.innerHTML = `<div class="table-responsive"><table class="table table-hover mb-0">
      <thead><tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Método</th><th>Monto</th><th>Acciones</th></tr></thead>
      <tbody>${gastos.map(g => `
        <tr>
          <td>${new Date(g.fecha).toLocaleDateString('es-MX')}</td>
          <td>${g.descripcion}</td>
          <td><span class="badge bg-danger">${g.categoria_nombre}</span></td>
          <td>${g.metodo_pago}</td>
          <td class="mov-gasto fw-bold">${formatMoney(g.monto)}</td>
          <td>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteGasto(${g.id_gasto})"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      `).join('')}</tbody>
    </table></div>`;
  } catch (err) { console.error('Error cargando gastos:', err); }
}

window.deleteGasto = async (id) => {
  showConfirm('¿Eliminar este gasto?', async () => {
    try {
      await request(`/gastos/${id}`, { method: 'DELETE' });
      loadGastos();
      loadDashboard();
      showToast('Gasto eliminado', 'success');
    } catch (err) { showToast(err.error || 'Error al eliminar', 'danger'); }
  });
};

// ===== METAS =====
$('#btn-nueva-meta').addEventListener('click', () => {
  openModal('Nueva Meta de Ahorro', [
    { name: 'nombre', label: 'Nombre de la meta', required: true, placeholder: 'Ej: Vacaciones' },
    { name: 'monto_objetivo', label: 'Monto objetivo', type: 'number', required: true, step: '0.01', min: '0.01', placeholder: '0.00' },
    { name: 'fecha_inicio', label: 'Fecha de inicio', type: 'date', required: true, value: new Date().toISOString().split('T')[0] },
    { name: 'fecha_limite', label: 'Fecha límite', type: 'date', required: true }
  ], async (data) => {
    try {
      await request('/metas', { method: 'POST', body: JSON.stringify({ ...data, id_usuario: currentUser.id_usuario }) });
      closeModal();
      loadMetas();
      loadDashboard();
      showToast('Meta creada', 'success');
    } catch (err) { showToast(err.error || 'Error al crear meta', 'danger'); }
  });
});

async function loadMetas() {
  try {
    const metas = await request(`/metas/usuario/${currentUser.id_usuario}`);
    const container = $('#lista-metas');
    if (metas.length === 0) {
      container.innerHTML = '<p class="text-muted text-center fst-italic col-12">No hay metas registradas</p>';
      return;
    }
    container.innerHTML = metas.map(m => {
      const pct = Math.min(Number(m.porcentaje_avance || 0), 100);
      const barColor = pct >= 100 ? 'bg-success' : pct >= 50 ? 'bg-primary' : 'bg-warning';
      return `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100">
          <div class="card-body">
            <h6 class="card-title"><i class="bi bi-bullseye text-warning"></i> ${m.nombre}</h6>
            <div class="progress mb-2" style="height: 10px;">
              <div class="progress-bar ${barColor}" style="width: ${pct}%"></div>
            </div>
            <div class="d-flex justify-content-between small text-muted">
              <span>${formatMoney(m.monto_actual)} / ${formatMoney(m.monto_objetivo)}</span>
              <span class="fw-bold">${pct}%</span>
            </div>
            <div class="mt-3 d-flex gap-2 flex-wrap">
              <button class="btn btn-sm btn-outline-primary" onclick="aportarMeta(${m.id_meta})"><i class="bi bi-plus"></i> Aporte</button>
              <button class="btn btn-sm btn-outline-secondary" onclick="editarMeta(${m.id_meta}, '${m.nombre.replace(/'/g, "\\'")}', ${m.monto_objetivo}, ${m.monto_actual})"><i class="bi bi-pencil"></i> Editar</button>
              <button class="btn btn-sm btn-outline-danger" onclick="deleteMeta(${m.id_meta})"><i class="bi bi-trash"></i></button>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');
  } catch (err) { console.error('Error cargando metas:', err); }
}

window.aportarMeta = (id) => {
  openModal('Registrar Aporte', [
    { name: 'monto', label: 'Monto del aporte', type: 'number', required: true, step: '0.01', min: '0.01', placeholder: '0.00' },
    { name: 'descripcion', label: 'Descripción (opcional)', placeholder: 'Ej: Aporte quincenal' }
  ], async (data) => {
    try {
      await request(`/metas/${id}/aportes`, { method: 'POST', body: JSON.stringify(data) });
      closeModal();
      loadMetas();
      loadDashboard();
      showToast('Aporte registrado', 'success');
    } catch (err) { showToast(err.error || 'Error al registrar aporte', 'danger'); }
  });
};

window.editarMeta = (id, nombre, montoObjetivo, montoActual) => {
  openModal('Editar Meta de Ahorro', [
    { name: 'nombre', label: 'Nombre', required: true, value: nombre },
    { name: 'monto_objetivo', label: 'Monto objetivo', type: 'number', required: true, step: '0.01', min: '0.01', value: montoObjetivo },
    { name: 'monto_actual', label: 'Monto ahorrado actualmente', type: 'number', required: true, step: '0.01', min: '0', value: montoActual }
  ], async (data) => {
    try {
      await request(`/metas/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      closeModal();
      loadMetas();
      loadDashboard();
      showToast('Meta actualizada', 'success');
    } catch (err) { showToast(err.error || 'Error al editar meta', 'danger'); }
  });
};

window.deleteMeta = async (id) => {
  showConfirm('¿Eliminar esta meta y todos sus aportes?', async () => {
    try {
      await request(`/metas/${id}`, { method: 'DELETE' });
      loadMetas();
      loadDashboard();
      showToast('Meta eliminada', 'success');
    } catch (err) { showToast(err.error || 'Error al eliminar', 'danger'); }
  });
};

// ===== ANALISIS FINANCIERO =====
async function loadAnalisis() {
  try {
    const [ingresos, gastos] = await Promise.all([
      request(`/ingresos/usuario/${currentUser.id_usuario}`),
      request(`/gastos/usuario/${currentUser.id_usuario}`)
    ]);

    const now = new Date();
    const mesActual = now.getMonth();
    const anioActual = now.getFullYear();
    const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
    const anioMesAnterior = mesActual === 0 ? anioActual - 1 : anioActual;

    // Filtrar por mes actual y anterior
    const ingMesActual = ingresos.filter(i => { const f = new Date(i.fecha); return f.getMonth() === mesActual && f.getFullYear() === anioActual; });
    const ingMesAnterior = ingresos.filter(i => { const f = new Date(i.fecha); return f.getMonth() === mesAnterior && f.getFullYear() === anioMesAnterior; });
    const gasMesActual = gastos.filter(g => { const f = new Date(g.fecha); return f.getMonth() === mesActual && f.getFullYear() === anioActual; });
    const gasMesAnterior = gastos.filter(g => { const f = new Date(g.fecha); return f.getMonth() === mesAnterior && f.getFullYear() === anioMesAnterior; });

    const totalIngActual = ingMesActual.reduce((s, i) => s + Number(i.monto), 0);
    const totalIngAnterior = ingMesAnterior.reduce((s, i) => s + Number(i.monto), 0);
    const totalGasActual = gasMesActual.reduce((s, g) => s + Number(g.monto), 0);
    const totalGasAnterior = gasMesAnterior.reduce((s, g) => s + Number(g.monto), 0);

    // Variaciones porcentuales
    const varIngresos = totalIngAnterior > 0 ? Math.round(((totalIngActual - totalIngAnterior) / totalIngAnterior) * 100) : (totalIngActual > 0 ? 100 : 0);
    const varGastos = totalGasAnterior > 0 ? Math.round(((totalGasActual - totalGasAnterior) / totalGasAnterior) * 100) : (totalGasActual > 0 ? 100 : 0);

    // Promedios mensuales (todos los meses con datos)
    const mesesConIngresos = new Set(ingresos.map(i => `${new Date(i.fecha).getMonth()}-${new Date(i.fecha).getFullYear()}`));
    const mesesConGastos = new Set(gastos.map(g => `${new Date(g.fecha).getMonth()}-${new Date(g.fecha).getFullYear()}`));
    const promedioIngresos = mesesConIngresos.size > 0 ? ingresos.reduce((s, i) => s + Number(i.monto), 0) / mesesConIngresos.size : 0;
    const promedioGastos = mesesConGastos.size > 0 ? gastos.reduce((s, g) => s + Number(g.monto), 0) / mesesConGastos.size : 0;

    // Prediccion ahorro anual
    const ahorroMensual = promedioIngresos - promedioGastos;
    const prediccionAnual = ahorroMensual * 12;

    // Categoria con mayor crecimiento de gasto
    const gastosPorCatActual = {};
    const gastosPorCatAnterior = {};
    gasMesActual.forEach(g => { gastosPorCatActual[g.categoria_nombre] = (gastosPorCatActual[g.categoria_nombre] || 0) + Number(g.monto); });
    gasMesAnterior.forEach(g => { gastosPorCatAnterior[g.categoria_nombre] = (gastosPorCatAnterior[g.categoria_nombre] || 0) + Number(g.monto); });

    let mayorCrecimiento = { nombre: '-', variacion: 0 };
    Object.keys(gastosPorCatActual).forEach(cat => {
      const actual = gastosPorCatActual[cat];
      const anterior = gastosPorCatAnterior[cat] || 0;
      const variacion = anterior > 0 ? ((actual - anterior) / anterior) * 100 : (actual > 0 ? 100 : 0);
      if (variacion > mayorCrecimiento.variacion) {
        mayorCrecimiento = { nombre: cat, variacion: Math.round(variacion), actual, anterior };
      }
    });

    // Render resumen textual
    const resumenItems = [];
    if (varGastos > 0) resumenItems.push(`<li class="mb-2"><i class="bi bi-arrow-up-circle text-danger me-2"></i>Gastaste <strong>${varGastos}% más</strong> que el mes anterior.</li>`);
    else if (varGastos < 0) resumenItems.push(`<li class="mb-2"><i class="bi bi-arrow-down-circle text-success me-2"></i>Gastaste <strong>${Math.abs(varGastos)}% menos</strong> que el mes anterior.</li>`);
    else resumenItems.push(`<li class="mb-2"><i class="bi bi-dash-circle text-muted me-2"></i>Tus gastos se mantienen igual que el mes anterior.</li>`);

    if (varIngresos > 0) resumenItems.push(`<li class="mb-2"><i class="bi bi-arrow-up-circle text-success me-2"></i>Tus ingresos aumentaron <strong>${varIngresos}%</strong>.</li>`);
    else if (varIngresos < 0) resumenItems.push(`<li class="mb-2"><i class="bi bi-arrow-down-circle text-danger me-2"></i>Tus ingresos bajaron <strong>${Math.abs(varIngresos)}%</strong>.</li>`);

    if (mayorCrecimiento.nombre !== '-' && mayorCrecimiento.variacion > 0) {
      resumenItems.push(`<li class="mb-2"><i class="bi bi-tag text-warning me-2"></i>La categoría <strong>${mayorCrecimiento.nombre}</strong> es donde más creció tu gasto (+${mayorCrecimiento.variacion}%).</li>`);
    }

    if (ahorroMensual > 0) resumenItems.push(`<li class="mb-2"><i class="bi bi-piggy-bank text-primary me-2"></i>A este ritmo, podrías ahorrar <strong>${formatMoney(prediccionAnual)}</strong> este año.</li>`);
    else resumenItems.push(`<li class="mb-2"><i class="bi bi-exclamation-triangle text-danger me-2"></i>Tu gasto promedio supera tus ingresos. Revisa tu presupuesto.</li>`);

    $('#analisis-resumen').innerHTML = resumenItems.length > 0 ? `<ul class="list-unstyled mb-0">${resumenItems.join('')}</ul>` : '<p class="text-muted text-center">Sin datos suficientes para el análisis</p>';

    // Render comparacion
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    $('#analisis-comparacion').innerHTML = `
      <div class="table-responsive">
        <table class="table table-sm mb-0">
          <thead><tr><th></th><th>${meses[mesAnterior]}</th><th>${meses[mesActual]}</th><th>Variación</th></tr></thead>
          <tbody>
            <tr>
              <td class="fw-medium">Ingresos</td>
              <td>${formatMoney(totalIngAnterior)}</td>
              <td>${formatMoney(totalIngActual)}</td>
              <td><span class="badge rounded-pill ${varIngresos >= 0 ? 'bg-success' : 'bg-danger'} bg-opacity-10 ${varIngresos >= 0 ? 'text-success' : 'text-danger'}">${varIngresos >= 0 ? '+' : ''}${varIngresos}%</span></td>
            </tr>
            <tr>
              <td class="fw-medium">Gastos</td>
              <td>${formatMoney(totalGasAnterior)}</td>
              <td>${formatMoney(totalGasActual)}</td>
              <td><span class="badge rounded-pill ${varGastos <= 0 ? 'bg-success' : 'bg-danger'} bg-opacity-10 ${varGastos <= 0 ? 'text-success' : 'text-danger'}">${varGastos >= 0 ? '+' : ''}${varGastos}%</span></td>
            </tr>
            <tr>
              <td class="fw-medium">Balance</td>
              <td>${formatMoney(totalIngAnterior - totalGasAnterior)}</td>
              <td>${formatMoney(totalIngActual - totalGasActual)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>`;

    // Render promedios
    $('#analisis-promedios').innerHTML = `
      <div class="d-flex flex-column gap-3">
        <div class="d-flex justify-content-between align-items-center">
          <span class="small text-muted">Promedio mensual de ingresos</span>
          <span class="fw-bold text-success">${formatMoney(promedioIngresos)}</span>
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <span class="small text-muted">Promedio mensual de gastos</span>
          <span class="fw-bold text-danger">${formatMoney(promedioGastos)}</span>
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <span class="small text-muted">Ahorro promedio mensual</span>
          <span class="fw-bold ${ahorroMensual >= 0 ? 'text-primary' : 'text-danger'}">${formatMoney(ahorroMensual)}</span>
        </div>
        <hr class="my-1">
        <div class="d-flex justify-content-between align-items-center">
          <span class="small text-muted">Predicción de ahorro anual</span>
          <span class="fw-bold fs-5 ${prediccionAnual >= 0 ? 'text-primary' : 'text-danger'}">${formatMoney(prediccionAnual)}</span>
        </div>
      </div>`;

    // Render detalle categorias
    const allCats = { ...gastosPorCatActual };
    Object.keys(gastosPorCatAnterior).forEach(c => { if (!allCats[c]) allCats[c] = 0; });

    const catRows = Object.keys(allCats).sort((a, b) => (gastosPorCatActual[b] || 0) - (gastosPorCatActual[a] || 0)).map(cat => {
      const actual = gastosPorCatActual[cat] || 0;
      const anterior = gastosPorCatAnterior[cat] || 0;
      const variacion = anterior > 0 ? Math.round(((actual - anterior) / anterior) * 100) : (actual > 0 ? 100 : 0);
      return `<tr>
        <td class="fw-medium">${cat}</td>
        <td>${formatMoney(anterior)}</td>
        <td>${formatMoney(actual)}</td>
        <td><span class="badge rounded-pill ${variacion <= 0 ? 'bg-success' : 'bg-danger'} bg-opacity-10 ${variacion <= 0 ? 'text-success' : 'text-danger'}">${variacion >= 0 ? '+' : ''}${variacion}%</span></td>
      </tr>`;
    }).join('');

    $('#analisis-categorias').innerHTML = Object.keys(allCats).length > 0 ? `
      <div class="table-responsive">
        <table class="table table-sm table-hover mb-0">
          <thead><tr><th>Categoría</th><th>Mes anterior</th><th>Mes actual</th><th>Variación</th></tr></thead>
          <tbody>${catRows}</tbody>
        </table>
      </div>` : '<p class="text-muted text-center fst-italic py-3">Sin datos de gastos para analizar</p>';

  } catch (err) { console.error('Error cargando análisis:', err); }
}

// ===== PRESUPUESTOS =====
$('#btn-nuevo-presupuesto').addEventListener('click', () => {
  const catGastos = categorias.filter(c => c.tipo === 'gasto');
  if (catGastos.length === 0) { showToast('Primero crea una categoría de tipo gasto', 'warning'); return; }
  const now = new Date();
  openModal('Nuevo Presupuesto', [
    { name: 'id_categoria', label: 'Categoría', type: 'select', required: true, options: catGastos.map(c => ({ value: c.id_categoria, label: c.nombre })) },
    { name: 'monto_limite', label: 'Límite mensual', type: 'number', required: true, step: '0.01', min: '0.01', placeholder: '0.00' },
    { name: 'mes', label: 'Mes', type: 'number', required: true, min: '1', value: now.getMonth() + 1, placeholder: '1-12' },
    { name: 'anio', label: 'Año', type: 'number', required: true, value: now.getFullYear(), placeholder: '2024' }
  ], async (data) => {
    try {
      await request('/presupuestos', { method: 'POST', body: JSON.stringify({ ...data, id_usuario: currentUser.id_usuario }) });
      closeModal();
      loadPresupuestos();
      loadDashboard();
      showToast('Presupuesto creado', 'success');
    } catch (err) { showToast(err.error || 'Error al crear presupuesto', 'danger'); }
  });
});

async function loadPresupuestos() {
  try {
    const presupuestos = await request(`/presupuestos/usuario/${currentUser.id_usuario}`);
    const container = $('#lista-presupuestos');
    if (presupuestos.length === 0) {
      container.innerHTML = '<p class="text-muted text-center fst-italic py-4 col-12">No hay presupuestos para este mes</p>';
      return;
    }
    container.innerHTML = presupuestos.map(p => {
      const pct = Math.min(p.porcentaje_uso, 100);
      let barColor = 'bg-success';
      let alertClass = '';
      if (p.porcentaje_uso >= 100) { barColor = 'bg-danger'; alertClass = 'border-danger'; }
      else if (p.porcentaje_uso >= 80) { barColor = 'bg-warning'; alertClass = 'border-warning'; }
      return `
      <div class="col-md-6 col-lg-4">
        <div class="content-card h-100 ${alertClass}" style="${alertClass ? 'border-width: 2px;' : ''}">
          <div class="content-card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h6 class="fw-semibold mb-0">${p.categoria_nombre}</h6>
              <div class="d-flex gap-1">
                <button class="btn btn-sm btn-outline-secondary rounded-circle" onclick="editPresupuesto(${p.id_presupuesto}, ${p.monto_limite})" title="Editar"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger rounded-circle" onclick="deletePresupuesto(${p.id_presupuesto})" title="Eliminar"><i class="bi bi-trash"></i></button>
              </div>
            </div>
            ${p.porcentaje_uso >= 100 ? '<div class="alert alert-danger py-1 px-2 small mb-2"><i class="bi bi-exclamation-triangle-fill me-1"></i>Presupuesto excedido</div>' : ''}
            ${p.porcentaje_uso >= 80 && p.porcentaje_uso < 100 ? '<div class="alert alert-warning py-1 px-2 small mb-2"><i class="bi bi-exclamation-circle-fill me-1"></i>Cerca del límite</div>' : ''}
            <div class="progress mb-2" style="height: 10px;">
              <div class="progress-bar ${barColor}" style="width: ${pct}%"></div>
            </div>
            <div class="d-flex justify-content-between small">
              <span class="text-muted">${formatMoney(p.monto_gastado)} / ${formatMoney(p.monto_limite)}</span>
              <span class="fw-bold ${p.porcentaje_uso >= 100 ? 'text-danger' : p.porcentaje_uso >= 80 ? 'text-warning' : 'text-success'}">${p.porcentaje_uso}%</span>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');
  } catch (err) { console.error('Error cargando presupuestos:', err); }
}

window.editPresupuesto = (id, montoActual) => {
  openModal('Editar Presupuesto', [
    { name: 'monto_limite', label: 'Nuevo límite mensual', type: 'number', required: true, step: '0.01', min: '0.01', value: montoActual }
  ], async (data) => {
    try {
      await request(`/presupuestos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      closeModal();
      loadPresupuestos();
      loadDashboard();
      showToast('Presupuesto actualizado', 'success');
    } catch (err) { showToast(err.error || 'Error al editar presupuesto', 'danger'); }
  });
};

window.deletePresupuesto = async (id) => {
  showConfirm('¿Eliminar este presupuesto?', async () => {
    try {
      await request(`/presupuestos/${id}`, { method: 'DELETE' });
      loadPresupuestos();
      loadDashboard();
      showToast('Presupuesto eliminado', 'success');
    } catch (err) { showToast(err.error || 'Error al eliminar', 'danger'); }
  });
};

// Cargar presupuestos en el dashboard
async function loadDashboardPresupuestos() {
  try {
    const presupuestos = await request(`/presupuestos/usuario/${currentUser.id_usuario}`);
    const card = $('#dashboard-presupuestos-card');
    const container = $('#dashboard-presupuestos');

    if (presupuestos.length === 0) {
      card.style.display = 'none';
      return;
    }

    card.style.display = 'block';
    container.innerHTML = presupuestos.map(p => {
      const pct = Math.min(p.porcentaje_uso, 100);
      let barColor = 'bg-success';
      let textColor = 'text-success';
      if (p.porcentaje_uso >= 100) { barColor = 'bg-danger'; textColor = 'text-danger'; }
      else if (p.porcentaje_uso >= 80) { barColor = 'bg-warning'; textColor = 'text-warning'; }
      return `
      <div class="d-flex align-items-center gap-3 py-2 border-bottom">
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between mb-1">
            <span class="small fw-medium">${p.categoria_nombre}</span>
            <span class="small fw-bold ${textColor}">${p.porcentaje_uso}%</span>
          </div>
          <div class="progress" style="height: 6px;">
            <div class="progress-bar ${barColor}" style="width: ${pct}%"></div>
          </div>
        </div>
        <span class="small text-muted text-nowrap">${formatMoney(p.monto_gastado)} / ${formatMoney(p.monto_limite)}</span>
      </div>`;
    }).join('');
  } catch (err) { console.error('Error cargando presupuestos dashboard:', err); }
}

// ===== PERFIL =====
async function loadPerfil() {
  try {
    const perfil = await request(`/auth/perfil/${currentUser.id_usuario}`);
    $('#profile-name-display').textContent = perfil.nombre;
    $('#profile-email-display').textContent = perfil.correo;
    $('#profile-nombre').value = perfil.nombre;
    $('#profile-date').textContent = new Date(perfil.fecha_registro).toLocaleDateString('es-MX');

    if (perfil.avatar_url) {
      $('#profile-avatar-img').src = perfil.avatar_url;
      $('#profile-avatar-img').classList.remove('d-none');
      $('#profile-avatar-letter').classList.add('d-none');
      // Update navbar avatar
      $('#user-avatar').innerHTML = `<img src="${perfil.avatar_url}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;">`;
    } else {
      $('#profile-avatar-img').classList.add('d-none');
      $('#profile-avatar-letter').classList.remove('d-none');
      $('#profile-avatar-letter').textContent = perfil.nombre.charAt(0).toUpperCase();
    }
  } catch (err) {
    console.error('Error cargando perfil:', err);
  }
}

$('#profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = $('#profile-nombre').value;
  const password_actual = $('#profile-pass-actual').value;
  const password_nueva = $('#profile-pass-nueva').value;

  const body = {};
  if (nombre) body.nombre = nombre;
  if (password_nueva) {
    body.password_actual = password_actual;
    body.password_nueva = password_nueva;
  }

  try {
    await request(`/auth/perfil/${currentUser.id_usuario}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });

    if (nombre) {
      currentUser.nombre = nombre;
      localStorage.setItem('finanya-user', JSON.stringify(currentUser));
      $('#user-name').textContent = nombre;
      $('#profile-name-display').textContent = nombre;
    }

    $('#profile-pass-actual').value = '';
    $('#profile-pass-nueva').value = '';
    showToast('Perfil actualizado', 'success');
  } catch (err) {
    showToast(err.error || 'Error al actualizar perfil', 'danger');
  }
});

$('#avatar-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    showToast('La imagen no debe superar 2MB', 'warning');
    return;
  }

  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const token = localStorage.getItem('finanya-token');
    const res = await fetch(`/api/auth/perfil/${currentUser.id_usuario}/avatar`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw data;

    // Update avatar everywhere
    $('#profile-avatar-img').src = data.avatar_url;
    $('#profile-avatar-img').classList.remove('d-none');
    $('#profile-avatar-letter').classList.add('d-none');
    $('#user-avatar').innerHTML = `<img src="${data.avatar_url}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;">`;
    showToast('Foto de perfil actualizada', 'success');
  } catch (err) {
    showToast(err.error || 'Error al subir imagen', 'danger');
  }
});

// ===== ADMIN PANEL =====
function checkAdmin() {
  if (currentUser && currentUser.rol === 'admin') {
    $('#btn-admin-panel').classList.remove('d-none');
  }
}

$('#btn-admin-panel').addEventListener('click', () => {
  document.querySelector('.app-main').classList.add('d-none');
  $('#admin-panel').classList.remove('d-none');
  loadAdminDashboard();
  loadAdminUsuarios();
});

$('#btn-volver-app').addEventListener('click', () => {
  $('#admin-panel').classList.add('d-none');
  document.querySelector('.app-main').classList.remove('d-none');
});

$('#btn-admin-buscar').addEventListener('click', () => loadAdminUsuarios());
$('#admin-buscar').addEventListener('keyup', (e) => { if (e.key === 'Enter') loadAdminUsuarios(); });

async function loadAdminDashboard() {
  try {
    const data = await request('/admin/dashboard');

    $('#admin-total-usuarios').textContent = data.estadisticas.total_usuarios;
    $('#admin-usuarios-activos').textContent = data.estadisticas.usuarios_activos;
    $('#admin-total-ingresos').textContent = data.estadisticas.total_ingresos;
    $('#admin-total-gastos').textContent = data.estadisticas.total_gastos;
    $('#admin-total-metas').textContent = data.estadisticas.total_metas;

    // Usuarios mas activos
    $('#admin-mas-activos').innerHTML = data.usuarios_mas_activos.length > 0
      ? data.usuarios_mas_activos.map((u, i) => `
        <div class="d-flex justify-content-between align-items-center py-2 ${i < data.usuarios_mas_activos.length - 1 ? 'border-bottom' : ''}">
          <div><span class="fw-medium">${u.nombre}</span><br><small class="text-muted">${u.correo}</small></div>
          <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill">${u.total_movimientos} mov.</span>
        </div>`).join('')
      : '<p class="text-muted text-center small">Sin datos</p>';

    // Actividad reciente
    $('#admin-actividad').innerHTML = data.actividad_reciente.length > 0
      ? data.actividad_reciente.map(a => `
        <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
          <div><small class="fw-medium">${a.nombre}</small><br><small class="text-muted">${a.accion} - ${a.detalle || ''}</small></div>
          <small class="text-muted text-nowrap">${new Date(a.fecha).toLocaleDateString('es-MX')}</small>
        </div>`).join('')
      : '<p class="text-muted text-center small">Sin actividad</p>';
  } catch (err) { console.error('Error cargando admin dashboard:', err); }
}

async function loadAdminUsuarios() {
  try {
    const buscar = $('#admin-buscar').value;
    const url = buscar ? `/admin/usuarios?buscar=${encodeURIComponent(buscar)}` : '/admin/usuarios';
    const usuarios = await request(url);

    $('#admin-lista-usuarios').innerHTML = usuarios.length > 0
      ? `<div class="table-responsive"><table class="table table-hover align-middle mb-0">
          <thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Registros</th><th>Último acceso</th><th>Acciones</th></tr></thead>
          <tbody>${usuarios.map(u => `
            <tr>
              <td class="fw-medium">${u.nombre}</td>
              <td class="small">${u.correo}</td>
              <td><span class="badge rounded-pill ${u.rol === 'admin' ? 'bg-warning text-dark' : 'bg-secondary bg-opacity-10 text-secondary'} text-uppercase">${u.rol}</span></td>
              <td><span class="badge rounded-pill ${u.activo ? 'bg-success' : 'bg-danger'} bg-opacity-10 ${u.activo ? 'text-success' : 'text-danger'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
              <td class="small">${u.num_ingresos}I / ${u.num_gastos}G</td>
              <td class="small">${u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleDateString('es-MX') : '-'}</td>
              <td>
                <div class="d-flex gap-1">
                  <button class="btn btn-sm btn-outline-${u.activo ? 'warning' : 'success'} rounded-circle" onclick="toggleUsuario(${u.id_usuario}, ${!u.activo})" title="${u.activo ? 'Desactivar' : 'Activar'}"><i class="bi bi-${u.activo ? 'pause' : 'play'}"></i></button>
                  <button class="btn btn-sm btn-outline-primary rounded-circle" onclick="cambiarRol(${u.id_usuario}, '${u.rol === 'admin' ? 'usuario' : 'admin'}')" title="Cambiar rol"><i class="bi bi-arrow-repeat"></i></button>
                  <button class="btn btn-sm btn-outline-danger rounded-circle" onclick="eliminarUsuarioAdmin(${u.id_usuario})" title="Eliminar"><i class="bi bi-trash"></i></button>
                </div>
              </td>
            </tr>
          `).join('')}</tbody>
        </table></div>`
      : '<p class="text-muted text-center small">No se encontraron usuarios</p>';
  } catch (err) { console.error('Error cargando usuarios:', err); }
}

window.toggleUsuario = async (id, activo) => {
  try {
    await request(`/admin/usuarios/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ activo }) });
    showToast(activo ? 'Usuario activado' : 'Usuario desactivado', 'success');
    loadAdminUsuarios();
    loadAdminDashboard();
  } catch (err) { showToast(err.error || 'Error', 'danger'); }
};

window.cambiarRol = async (id, rol) => {
  showConfirm(`¿Cambiar rol a "${rol}"?`, async () => {
    try {
      await request(`/admin/usuarios/${id}/rol`, { method: 'PATCH', body: JSON.stringify({ rol }) });
      showToast('Rol actualizado', 'success');
      loadAdminUsuarios();
    } catch (err) { showToast(err.error || 'Error', 'danger'); }
  });
};

window.eliminarUsuarioAdmin = async (id) => {
  showConfirm('¿Eliminar este usuario permanentemente?', async () => {
    try {
      await request(`/admin/usuarios/${id}`, { method: 'DELETE' });
      showToast('Usuario eliminado', 'success');
      loadAdminUsuarios();
      loadAdminDashboard();
    } catch (err) { showToast(err.error || 'Error', 'danger'); }
  });
};

// ===== INIT =====
initTheme();
const saved = localStorage.getItem('finanya-user');
const savedToken = localStorage.getItem('finanya-token');
if (saved && savedToken) {
  currentUser = JSON.parse(saved);
  showApp();
} else {
  // Si hay usuario pero no token, limpiar sesión vieja
  localStorage.removeItem('finanya-user');
  localStorage.removeItem('finanya-token');
  // Show landing page by default
  $('#landing-container').classList.remove('d-none');
}
