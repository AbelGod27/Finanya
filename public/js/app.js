const API = '/api';
let currentUser = null;
let bsModal = null;

// ===== UTILS =====
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
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
    showToast('Cuenta creada exitosamente', 'success');
    showApp();
  } catch (err) {
    showError('registro-error', err.error || err.errores?.join(', ') || 'Error al registrarse');
  }
});

$('#btn-logout').addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem('finanya-user');
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
  // Load avatar
  loadUserAvatar();
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
            <div class="mt-3 d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary" onclick="aportarMeta(${m.id_meta})"><i class="bi bi-plus"></i> Aporte</button>
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
    const res = await fetch(`/api/auth/perfil/${currentUser.id_usuario}/avatar`, {
      method: 'POST',
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

// ===== INIT =====
initTheme();
const saved = localStorage.getItem('finanya-user');
if (saved) {
  currentUser = JSON.parse(saved);
  showApp();
} else {
  // Show landing page by default
  $('#landing-container').classList.remove('d-none');
}
