// ===== ANALISIS FINANCIERO INTELIGENTE v2 =====
async function loadAnalisis() {
  try {
    const [ingresos, gastos, metas, userCuentas] = await Promise.all([
      request(`/ingresos/usuario/${currentUser.id_usuario}`),
      request(`/gastos/usuario/${currentUser.id_usuario}`),
      request(`/metas/usuario/${currentUser.id_usuario}`),
      request(`/cuentas/usuario/${currentUser.id_usuario}`)
    ]);

    const now = new Date();
    const mesActual = now.getMonth();
    const anioActual = now.getFullYear();
    const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
    const anioMesAnterior = mesActual === 0 ? anioActual - 1 : anioActual;

    // Filtrar meses
    const filtraMes = (arr, m, a) => arr.filter(x => { const f = new Date(x.fecha); return f.getMonth() === m && f.getFullYear() === a; });
    const ingAct = filtraMes(ingresos, mesActual, anioActual);
    const ingAnt = filtraMes(ingresos, mesAnterior, anioMesAnterior);
    const gasAct = filtraMes(gastos, mesActual, anioActual);
    const gasAnt = filtraMes(gastos, mesAnterior, anioMesAnterior);

    const tIngAct = ingAct.reduce((s, i) => s + Number(i.monto), 0);
    const tIngAnt = ingAnt.reduce((s, i) => s + Number(i.monto), 0);
    const tGasAct = gasAct.reduce((s, g) => s + Number(g.monto), 0);
    const tGasAnt = gasAnt.reduce((s, g) => s + Number(g.monto), 0);

    const varIng = tIngAnt > 0 ? Math.round(((tIngAct - tIngAnt) / tIngAnt) * 100) : (tIngAct > 0 ? 100 : 0);
    const varGas = tGasAnt > 0 ? Math.round(((tGasAct - tGasAnt) / tGasAnt) * 100) : (tGasAct > 0 ? 100 : 0);

    // Promedios historicos
    const mesesIng = new Set(ingresos.map(i => new Date(i.fecha).getMonth() + '-' + new Date(i.fecha).getFullYear()));
    const mesesGas = new Set(gastos.map(g => new Date(g.fecha).getMonth() + '-' + new Date(g.fecha).getFullYear()));
    const promIng = mesesIng.size > 0 ? ingresos.reduce((s, i) => s + Number(i.monto), 0) / mesesIng.size : 0;
    const promGas = mesesGas.size > 0 ? gastos.reduce((s, g) => s + Number(g.monto), 0) / mesesGas.size : 0;
    const ahorroMes = promIng - promGas;
    const predAnual = ahorroMes * 12;

    // Categorias
    const catAct = {}, catAnt = {};
    gasAct.forEach(g => { catAct[g.categoria_nombre] = (catAct[g.categoria_nombre] || 0) + Number(g.monto); });
    gasAnt.forEach(g => { catAnt[g.categoria_nombre] = (catAnt[g.categoria_nombre] || 0) + Number(g.monto); });

    // ===== MOTOR DE INSIGHTS =====
    const insights = [];
    let salud = 10;

    // 1. Tasa de ahorro (regla 50/30/20)
    const tasaAhorro = tIngAct > 0 ? ((tIngAct - tGasAct) / tIngAct) * 100 : 0;
    if (tasaAhorro >= 20) { insights.push({i:'bi-shield-check',c:'success',t:`Tasa de ahorro: <strong>${Math.round(tasaAhorro)}%</strong> — Cumples la regla del 20%.`}); salud += 25; }
    else if (tasaAhorro >= 10) { insights.push({i:'bi-shield-exclamation',c:'warning',t:`Tasa de ahorro: <strong>${Math.round(tasaAhorro)}%</strong> — Intenta llegar al 20%.`}); salud += 12; }
    else if (tasaAhorro > 0) { insights.push({i:'bi-shield-x',c:'danger',t:`Tasa de ahorro: <strong>${Math.round(tasaAhorro)}%</strong> — Muy baja, revisa gastos.`}); salud += 5; }
    else if (tIngAct > 0) { insights.push({i:'bi-exclamation-octagon',c:'danger',t:`Balance negativo: gastas más de lo que ganas.`}); }

    // 2. Tendencia de gastos (3 meses)
    const mes2Ant = mesAnterior === 0 ? 11 : mesAnterior - 1;
    const anio2Ant = mesAnterior === 0 ? anioMesAnterior - 1 : anioMesAnterior;
    const gas2Ant = filtraMes(gastos, mes2Ant, anio2Ant);
    const tGas2Ant = gas2Ant.reduce((s, g) => s + Number(g.monto), 0);
    if (tGas2Ant > 0 && tGasAnt > 0 && tGasAct > 0) {
      const tendencia = tGasAct > tGasAnt && tGasAnt > tGas2Ant;
      if (tendencia) insights.push({i:'bi-arrow-up-right',c:'danger',t:`Tendencia alcista: tus gastos llevan 3 meses subiendo consecutivamente.`});
      else if (tGasAct < tGasAnt && tGasAnt < tGas2Ant) { insights.push({i:'bi-arrow-down-right',c:'success',t:`Tendencia positiva: llevas 3 meses reduciendo gastos.`}); salud += 10; }
    }

    // 3. Variacion mensual
    if (varGas > 30) insights.push({i:'bi-exclamation-triangle',c:'danger',t:`Gastos subieron <strong>${varGas}%</strong> vs mes anterior — Alerta.`});
    else if (varGas > 10) insights.push({i:'bi-arrow-up',c:'warning',t:`Gastos subieron <strong>${varGas}%</strong> — Moderado.`});
    else if (varGas < -15) { insights.push({i:'bi-check2-circle',c:'success',t:`Redujiste gastos <strong>${Math.abs(varGas)}%</strong> — Excelente.`}); salud += 10; }

    if (varIng > 15) { insights.push({i:'bi-graph-up-arrow',c:'success',t:`Ingresos crecieron <strong>${varIng}%</strong>.`}); salud += 8; }
    else if (varIng < -15) insights.push({i:'bi-graph-down-arrow',c:'danger',t:`Ingresos cayeron <strong>${Math.abs(varIng)}%</strong>.`});

    // 4. Concentracion de gastos (diversificacion)
    const topCat = Object.entries(catAct).sort((a, b) => b[1] - a[1])[0];
    const numCatsUsadas = Object.keys(catAct).length;
    if (topCat) {
      const pctTop = tGasAct > 0 ? Math.round((topCat[1] / tGasAct) * 100) : 0;
      if (pctTop > 60) insights.push({i:'bi-pie-chart',c:'danger',t:`<strong>${topCat[0]}</strong> concentra ${pctTop}% de gastos — Poca diversificación.`});
      else if (pctTop > 40) insights.push({i:'bi-pie-chart',c:'warning',t:`Mayor gasto: <strong>${topCat[0]}</strong> (${pctTop}%).`});
      else { insights.push({i:'bi-pie-chart',c:'success',t:`Gastos bien distribuidos en ${numCatsUsadas} categorías.`}); salud += 8; }
    }

    // 5. Patron semanal y gasto impulsivo
    const diasSem = [0,0,0,0,0,0,0];
    const gastoPorDia = {};
    gasAct.forEach(g => { 
      const f = new Date(g.fecha);
      diasSem[f.getDay()] += Number(g.monto);
      const key = f.getDate();
      gastoPorDia[key] = (gastoPorDia[key] || 0) + Number(g.monto);
    });
    const diasNom = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const diaMax = diasSem.indexOf(Math.max(...diasSem));
    if (Math.max(...diasSem) > 0) insights.push({i:'bi-calendar-week',c:'info',t:`Día de mayor gasto: <strong>${diasNom[diaMax]}</strong>.`});

    // Detectar gastos atipicos (outliers)
    const montos = gasAct.map(g => Number(g.monto));
    if (montos.length > 3) {
      const media = montos.reduce((a,b) => a+b, 0) / montos.length;
      const desv = Math.sqrt(montos.reduce((s, m) => s + Math.pow(m - media, 2), 0) / montos.length);
      const atipicos = gasAct.filter(g => Number(g.monto) > media + 2 * desv);
      if (atipicos.length > 0) {
        insights.push({i:'bi-lightning',c:'warning',t:`Detectados <strong>${atipicos.length} gasto(s) atípico(s)</strong> (muy por encima del promedio).`});
      }
    }

    // 6. Frecuencia de gastos
    const diasConGasto = Object.keys(gastoPorDia).length;
    const diasMes = new Date(anioActual, mesActual + 1, 0).getDate();
    const freq = Math.round((diasConGasto / diasMes) * 100);
    if (freq > 75) insights.push({i:'bi-calendar-check',c:'warning',t:`Gastas el ${freq}% de los días — Posible gasto impulsivo.`});
    else salud += 8;

    // 7. Gasto promedio por transaccion
    const gastoPromTx = gasAct.length > 0 ? tGasAct / gasAct.length : 0;
    const ingresoPromTx = ingAct.length > 0 ? tIngAct / ingAct.length : 0;
    if (gastoPromTx > 0) insights.push({i:'bi-receipt',c:'info',t:`Gasto promedio por transacción: <strong>${formatMoney(gastoPromTx)}</strong> (${gasAct.length} transacciones).`});

    // 8. Metas de ahorro
    const metasActivas = metas.filter(m => m.monto_objetivo && Number(m.monto_objetivo) > 0);
    if (metasActivas.length > 0) {
      const prog = metasActivas.reduce((s, m) => s + Number(m.porcentaje_avance || 0), 0) / metasActivas.length;
      insights.push({i:'bi-bullseye',c: prog > 60 ? 'success' : 'info',t:`${metasActivas.length} meta(s) activa(s) — Progreso: <strong>${Math.round(prog)}%</strong>.`});
      if (prog > 50) salud += 8;
    } else {
      insights.push({i:'bi-bullseye',c:'warning',t:`Sin metas de ahorro activas. Crea una para mantener el enfoque.`});
    }

    // 9. Deuda en tarjetas
    const deuda = userCuentas.filter(c => c.tipo === 'credito').reduce((s, c) => s + Math.abs(Number(c.saldo_actual)), 0);
    const patrimonio = userCuentas.filter(c => c.tipo !== 'credito').reduce((s, c) => s + Number(c.saldo_actual), 0);
    if (deuda > 0) {
      const ratio = patrimonio > 0 ? Math.round((deuda / patrimonio) * 100) : 100;
      if (ratio > 80) insights.push({i:'bi-credit-card',c:'danger',t:`Deuda alta: ${formatMoney(deuda)} (${ratio}% del patrimonio).`});
      else if (ratio > 30) insights.push({i:'bi-credit-card',c:'warning',t:`Deuda: ${formatMoney(deuda)} — Ratio ${ratio}%.`});
      else { insights.push({i:'bi-credit-card',c:'info',t:`Deuda controlada: ${formatMoney(deuda)}.`}); salud += 5; }
    } else { salud += 12; insights.push({i:'bi-check-circle',c:'success',t:`Sin deudas en tarjetas de crédito.`}); }

    // 10. Estabilidad de ingresos
    if (mesesIng.size >= 3) {
      const ingMensuales = [];
      mesesIng.forEach(m => {
        const [mes, anio] = m.split('-').map(Number);
        const total = ingresos.filter(i => { const f = new Date(i.fecha); return f.getMonth() === mes && f.getFullYear() === anio; }).reduce((s, i) => s + Number(i.monto), 0);
        ingMensuales.push(total);
      });
      const mediaIng = ingMensuales.reduce((a,b) => a+b, 0) / ingMensuales.length;
      const desvIng = Math.sqrt(ingMensuales.reduce((s, m) => s + Math.pow(m - mediaIng, 2), 0) / ingMensuales.length);
      const coefVar = mediaIng > 0 ? (desvIng / mediaIng) * 100 : 0;
      if (coefVar < 20) { insights.push({i:'bi-bar-chart-steps',c:'success',t:`Ingresos estables (variación: ${Math.round(coefVar)}%).`}); salud += 8; }
      else if (coefVar > 50) insights.push({i:'bi-bar-chart-steps',c:'warning',t:`Ingresos inestables (variación: ${Math.round(coefVar)}%). Considera diversificar.`});
    }

    salud = Math.min(100, Math.max(0, salud));
    const sColor = salud >= 70 ? 'success' : salud >= 40 ? 'warning' : 'danger';
    const sTexto = salud >= 80 ? 'Excelente' : salud >= 60 ? 'Buena' : salud >= 40 ? 'Regular' : 'Necesita atención';

    // ===== RECOMENDACIONES =====
    const recs = [];
    if (tasaAhorro < 20 && tIngAct > 0) { const f = (tIngAct * 0.2) - (tIngAct - tGasAct); if (f > 0) recs.push(`Reduce ${formatMoney(f)} en gastos para alcanzar el 20% de ahorro.`); }
    if (topCat && topCat[1] > tGasAct * 0.4) recs.push(`"${topCat[0]}" consume mucho. Busca alternativas más económicas.`);
    if (deuda > 0 && ahorroMes > 0) recs.push(`Liquida tu deuda en ~${Math.ceil(deuda / ahorroMes)} mes(es) con tu ahorro actual.`);
    if (predAnual > 0) recs.push(`Predicción anual: ${formatMoney(predAnual)} de ahorro.`);
    else recs.push(`Estás en números rojos. Prioriza reducir el gasto más grande.`);
    if (metasActivas.length === 0) recs.push(`Crea una meta de ahorro para visualizar tu progreso.`);
    if (freq > 60) recs.push(`Intenta hacer compras planificadas en vez de diarias.`);
    if (numCatsUsadas <= 2 && gasAct.length > 5) recs.push(`Categoriza mejor tus gastos para entender a dónde va tu dinero.`);
    if (gastoPromTx > promGas * 0.3 && gasAct.length < 5) recs.push(`Pocos gastos pero grandes. Verifica si son necesarios.`);

    // ===== RENDER =====
    const mNom = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

    // Salud financiera
    $('#analisis-resumen').innerHTML = `
      <div class="d-flex align-items-center gap-3 mb-3 flex-wrap">
        <div class="text-center flex-shrink-0">
          <div class="position-relative d-inline-block">
            <svg width="90" height="90"><circle cx="45" cy="45" r="38" fill="none" stroke="var(--border)" stroke-width="7"/><circle cx="45" cy="45" r="38" fill="none" stroke="var(--${sColor})" stroke-width="7" stroke-dasharray="${salud * 2.39} 239" stroke-linecap="round" transform="rotate(-90 45 45)"/></svg>
            <span class="position-absolute top-50 start-50 translate-middle fw-bold fs-5">${salud}</span>
          </div>
          <div class="small fw-bold text-${sColor} mt-1">${sTexto}</div>
        </div>
        <div class="flex-grow-1">
          <h6 class="fw-bold mb-1">Salud Financiera</h6>
          <p class="small text-muted mb-2">Calculado con: ahorro, deuda, diversificación, estabilidad, tendencias y metas.</p>
          <div class="d-flex gap-3 small">
            <span class="text-success"><i class="bi bi-arrow-down-circle me-1"></i>${formatMoney(tIngAct)}</span>
            <span class="text-danger"><i class="bi bi-arrow-up-circle me-1"></i>${formatMoney(tGasAct)}</span>
            <span class="text-primary"><i class="bi bi-wallet2 me-1"></i>${formatMoney(tIngAct - tGasAct)}</span>
          </div>
        </div>
      </div>
      <hr class="my-2">
      <div class="row g-2">
        ${insights.map(x => `<div class="col-12"><div class="d-flex align-items-start gap-2 py-1"><i class="bi ${x.i} text-${x.c} mt-1 flex-shrink-0"></i><span class="small">${x.t}</span></div></div>`).join('')}
      </div>`;

    // Comparacion
    $('#analisis-comparacion').innerHTML = `
      <div class="table-responsive"><table class="table table-sm mb-0 align-middle">
        <thead><tr><th></th><th>${mNom[mesAnterior]}</th><th>${mNom[mesActual]}</th><th>Var</th></tr></thead>
        <tbody>
          <tr><td class="fw-medium"><i class="bi bi-arrow-down-circle text-success me-1"></i>Ingresos</td><td>${formatMoney(tIngAnt)}</td><td>${formatMoney(tIngAct)}</td><td><span class="badge bg-${varIng>=0?'success':'danger'} bg-opacity-10 text-${varIng>=0?'success':'danger'}">${varIng>=0?'+':''}${varIng}%</span></td></tr>
          <tr><td class="fw-medium"><i class="bi bi-arrow-up-circle text-danger me-1"></i>Gastos</td><td>${formatMoney(tGasAnt)}</td><td>${formatMoney(tGasAct)}</td><td><span class="badge bg-${varGas<=0?'success':'danger'} bg-opacity-10 text-${varGas<=0?'success':'danger'}">${varGas>=0?'+':''}${varGas}%</span></td></tr>
          <tr><td class="fw-medium"><i class="bi bi-wallet2 text-primary me-1"></i>Balance</td><td>${formatMoney(tIngAnt-tGasAnt)}</td><td>${formatMoney(tIngAct-tGasAct)}</td><td></td></tr>
        </tbody>
      </table></div>
      <div class="mt-3 small text-muted"><i class="bi bi-info-circle me-1"></i>Gasto promedio/transacción: ${formatMoney(gastoPromTx)} · Transacciones: ${gasAct.length}</div>`;

    // Promedios + Recomendaciones
    $('#analisis-promedios').innerHTML = `
      <div class="d-flex flex-column gap-2 mb-3">
        <div class="d-flex justify-content-between"><span class="small text-muted">Promedio ingresos/mes</span><span class="fw-bold text-success">${formatMoney(promIng)}</span></div>
        <div class="d-flex justify-content-between"><span class="small text-muted">Promedio gastos/mes</span><span class="fw-bold text-danger">${formatMoney(promGas)}</span></div>
        <div class="d-flex justify-content-between"><span class="small text-muted">Capacidad de ahorro</span><span class="fw-bold text-${ahorroMes>=0?'primary':'danger'}">${formatMoney(ahorroMes)}/mes</span></div>
        <div class="d-flex justify-content-between"><span class="small text-muted">Predicción anual</span><span class="fw-bold text-${predAnual>=0?'primary':'danger'}">${formatMoney(predAnual)}</span></div>
      </div>
      <hr class="my-2">
      <h6 class="fw-semibold small mb-2"><i class="bi bi-lightbulb text-warning me-1"></i>Recomendaciones personalizadas</h6>
      <ul class="list-unstyled small mb-0">${recs.map(r => `<li class="mb-2 d-flex gap-2"><i class="bi bi-arrow-right-circle text-primary flex-shrink-0 mt-1"></i><span>${r}</span></li>`).join('')}</ul>`;

    // Categorias
    const allCats = {...catAct}; Object.keys(catAnt).forEach(c => { if (!allCats[c]) allCats[c] = 0; });
    const catRows = Object.keys(allCats).sort((a,b) => (catAct[b]||0) - (catAct[a]||0)).map(cat => {
      const act = catAct[cat]||0, ant = catAnt[cat]||0;
      const v = ant > 0 ? Math.round(((act-ant)/ant)*100) : (act > 0 ? 100 : 0);
      const pct = tGasAct > 0 ? Math.round((act/tGasAct)*100) : 0;
      return `<tr><td class="fw-medium">${cat}</td><td>${formatMoney(ant)}</td><td>${formatMoney(act)}</td><td>${pct}%</td><td><span class="badge bg-${v<=0?'success':'danger'} bg-opacity-10 text-${v<=0?'success':'danger'}">${v>=0?'+':''}${v}%</span></td></tr>`;
    }).join('');
    $('#analisis-categorias').innerHTML = catRows ? `<div class="table-responsive"><table class="table table-sm table-hover mb-0"><thead><tr><th>Categoría</th><th>Anterior</th><th>Actual</th><th>% Total</th><th>Var</th></tr></thead><tbody>${catRows}</tbody></table></div>` : '<p class="text-muted text-center small py-3">Sin datos</p>';

  } catch (err) { console.error('Error cargando análisis:', err); }
}
