// ===== ANALISIS FINANCIERO INTELIGENTE =====
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

    const ingMesActual = ingresos.filter(i => { const f = new Date(i.fecha); return f.getMonth() === mesActual && f.getFullYear() === anioActual; });
    const ingMesAnterior = ingresos.filter(i => { const f = new Date(i.fecha); return f.getMonth() === mesAnterior && f.getFullYear() === anioMesAnterior; });
    const gasMesActual = gastos.filter(g => { const f = new Date(g.fecha); return f.getMonth() === mesActual && f.getFullYear() === anioActual; });
    const gasMesAnterior = gastos.filter(g => { const f = new Date(g.fecha); return f.getMonth() === mesAnterior && f.getFullYear() === anioMesAnterior; });

    const totalIngActual = ingMesActual.reduce((s, i) => s + Number(i.monto), 0);
    const totalIngAnterior = ingMesAnterior.reduce((s, i) => s + Number(i.monto), 0);
    const totalGasActual = gasMesActual.reduce((s, g) => s + Number(g.monto), 0);
    const totalGasAnterior = gasMesAnterior.reduce((s, g) => s + Number(g.monto), 0);

    const varIngresos = totalIngAnterior > 0 ? Math.round(((totalIngActual - totalIngAnterior) / totalIngAnterior) * 100) : (totalIngActual > 0 ? 100 : 0);
    const varGastos = totalGasAnterior > 0 ? Math.round(((totalGasActual - totalGasAnterior) / totalGasAnterior) * 100) : (totalGasActual > 0 ? 100 : 0);

    const mesesConIng = new Set(ingresos.map(i => `${new Date(i.fecha).getMonth()}-${new Date(i.fecha).getFullYear()}`));
    const mesesConGas = new Set(gastos.map(g => `${new Date(g.fecha).getMonth()}-${new Date(g.fecha).getFullYear()}`));
    const promedioIng = mesesConIng.size > 0 ? ingresos.reduce((s, i) => s + Number(i.monto), 0) / mesesConIng.size : 0;
    const promedioGas = mesesConGas.size > 0 ? gastos.reduce((s, g) => s + Number(g.monto), 0) / mesesConGas.size : 0;
    const ahorroMensual = promedioIng - promedioGas;
    const prediccionAnual = ahorroMensual * 12;

    const gastosPorCatActual = {};
    const gastosPorCatAnterior = {};
    gasMesActual.forEach(g => { gastosPorCatActual[g.categoria_nombre] = (gastosPorCatActual[g.categoria_nombre] || 0) + Number(g.monto); });
    gasMesAnterior.forEach(g => { gastosPorCatAnterior[g.categoria_nombre] = (gastosPorCatAnterior[g.categoria_nombre] || 0) + Number(g.monto); });

    // ===== MOTOR DE INSIGHTS =====
    const insights = [];
    let saludFinanciera = 10; // base

    // Tasa de ahorro
    const tasaAhorro = totalIngActual > 0 ? ((totalIngActual - totalGasActual) / totalIngActual) * 100 : 0;
    if (tasaAhorro >= 20) { insights.push({i:'bi-piggy-bank',c:'text-success',t:`Tasa de ahorro: <strong>${Math.round(tasaAhorro)}%</strong>. Superas el 20% recomendado.`}); saludFinanciera += 25; }
    else if (tasaAhorro >= 10) { insights.push({i:'bi-piggy-bank',c:'text-warning',t:`Tasa de ahorro: <strong>${Math.round(tasaAhorro)}%</strong>. Intenta llegar al 20%.`}); saludFinanciera += 15; }
    else if (tasaAhorro > 0) { insights.push({i:'bi-piggy-bank',c:'text-danger',t:`Tasa de ahorro: solo <strong>${Math.round(tasaAhorro)}%</strong>. Muy por debajo del mínimo.`}); saludFinanciera += 5; }
    else if (totalIngActual > 0) { insights.push({i:'bi-exclamation-octagon',c:'text-danger',t:`Gastas más de lo que ganas este mes.`}); }

    // Variacion gastos
    if (varGastos > 20) { insights.push({i:'bi-exclamation-triangle',c:'text-danger',t:`Gastos subieron <strong>${varGastos}%</strong> vs mes anterior.`}); }
    else if (varGastos < -10) { insights.push({i:'bi-check-circle',c:'text-success',t:`Redujiste gastos un <strong>${Math.abs(varGastos)}%</strong>.`}); saludFinanciera += 15; }

    // Variacion ingresos
    if (varIngresos > 10) { insights.push({i:'bi-graph-up-arrow',c:'text-success',t:`Ingresos crecieron <strong>${varIngresos}%</strong>.`}); saludFinanciera += 10; }
    else if (varIngresos < -10) { insights.push({i:'bi-graph-down-arrow',c:'text-danger',t:`Ingresos bajaron <strong>${Math.abs(varIngresos)}%</strong>.`}); }

    // Categoria top
    const topCat = Object.entries(gastosPorCatActual).sort((a, b) => b[1] - a[1])[0];
    if (topCat) {
      const pctTop = totalGasActual > 0 ? Math.round((topCat[1] / totalGasActual) * 100) : 0;
      if (pctTop > 50) insights.push({i:'bi-pie-chart',c:'text-warning',t:`<strong>${topCat[0]}</strong> concentra el ${pctTop}% de gastos.`});
      else { insights.push({i:'bi-pie-chart',c:'text-info',t:`Mayor gasto: <strong>${topCat[0]}</strong> (${pctTop}%).`}); saludFinanciera += 10; }
    }

    // Patron semanal
    const diasSemana = [0,0,0,0,0,0,0];
    gasMesActual.forEach(g => { diasSemana[new Date(g.fecha).getDay()] += Number(g.monto); });
    const diasNombres = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const diaMax = diasSemana.indexOf(Math.max(...diasSemana));
    if (Math.max(...diasSemana) > 0) insights.push({i:'bi-calendar-week',c:'text-info',t:`Día de mayor gasto: <strong>${diasNombres[diaMax]}</strong>.`});

    // Frecuencia
    const diasConGasto = new Set(gasMesActual.map(g => new Date(g.fecha).getDate())).size;
    const diasDelMes = new Date(anioActual, mesActual + 1, 0).getDate();
    if (diasConGasto / diasDelMes > 0.7) insights.push({i:'bi-calendar-check',c:'text-warning',t:`Gastas el ${Math.round(diasConGasto/diasDelMes*100)}% de los días. Agrupa compras.`});
    else saludFinanciera += 10;

    // Metas
    const metasActivas = metas.filter(m => Number(m.monto_objetivo) > 0);
    if (metasActivas.length > 0) {
      const progProm = metasActivas.reduce((s, m) => s + Number(m.porcentaje_avance || 0), 0) / metasActivas.length;
      insights.push({i:'bi-bullseye',c: progProm > 50 ? 'text-success' : 'text-info',t:`${metasActivas.length} meta(s) con <strong>${Math.round(progProm)}%</strong> promedio.`});
      if (progProm > 50) saludFinanciera += 10;
    }

    // Deuda
    const deudaTotal = userCuentas.filter(c => c.tipo === 'credito').reduce((s, c) => s + Math.abs(Number(c.saldo_actual)), 0);
    const saldoPositivo = userCuentas.filter(c => c.tipo !== 'credito').reduce((s, c) => s + Number(c.saldo_actual), 0);
    if (deudaTotal > 0) {
      const ratio = saldoPositivo > 0 ? Math.round((deudaTotal / saldoPositivo) * 100) : 100;
      if (ratio > 50) insights.push({i:'bi-credit-card',c:'text-danger',t:`Deuda de tarjetas: ${formatMoney(deudaTotal)} (${ratio}% de tu patrimonio).`});
      else { insights.push({i:'bi-credit-card',c:'text-warning',t:`Deuda controlada: ${formatMoney(deudaTotal)}.`}); saludFinanciera += 5; }
    } else { saludFinanciera += 10; }

    saludFinanciera = Math.min(100, Math.max(0, saludFinanciera));
    const saludColor = saludFinanciera >= 70 ? 'success' : saludFinanciera >= 40 ? 'warning' : 'danger';
    const saludTexto = saludFinanciera >= 70 ? 'Excelente' : saludFinanciera >= 40 ? 'Regular' : 'Necesita atención';

    // Recomendaciones
    const recs = [];
    if (tasaAhorro < 20 && totalIngActual > 0) { const f = (totalIngActual * 0.2) - (totalIngActual - totalGasActual); if (f > 0) recs.push(`Reduce ${formatMoney(f)} en gastos para alcanzar el 20% de ahorro.`); }
    if (topCat && topCat[1] > totalGasActual * 0.4) recs.push(`Busca alternativas en "${topCat[0]}" — concentra mucho gasto.`);
    if (deudaTotal > 0 && ahorroMensual > 0) recs.push(`Podrías liquidar tu deuda en ~${Math.ceil(deudaTotal / ahorroMensual)} mes(es).`);
    if (prediccionAnual > 0) recs.push(`Predicción de ahorro anual: ${formatMoney(prediccionAnual)}.`);
    else recs.push(`Revisa tus gastos más grandes — estás en negativo.`);
    if (metasActivas.length === 0) recs.push(`Crea una meta de ahorro para mantenerte motivado.`);

    // ===== RENDER =====
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

    $('#analisis-resumen').innerHTML = `
      <div class="d-flex align-items-center gap-3 mb-3 flex-wrap">
        <div class="text-center">
          <div class="position-relative d-inline-block">
            <svg width="80" height="80"><circle cx="40" cy="40" r="35" fill="none" stroke="var(--border)" stroke-width="6"/><circle cx="40" cy="40" r="35" fill="none" stroke="var(--${saludColor})" stroke-width="6" stroke-dasharray="${saludFinanciera * 2.2} 220" stroke-linecap="round" transform="rotate(-90 40 40)"/></svg>
            <span class="position-absolute top-50 start-50 translate-middle fw-bold">${saludFinanciera}</span>
          </div>
          <div class="small fw-semibold text-${saludColor} mt-1">${saludTexto}</div>
        </div>
        <div class="flex-grow-1">
          <h6 class="fw-bold mb-1">Salud Financiera</h6>
          <p class="small text-muted mb-0">Basado en ahorro, deuda, diversificación, frecuencia y metas.</p>
        </div>
      </div>
      ${insights.map(x => `<div class="d-flex align-items-start gap-2 py-1"><i class="bi ${x.i} ${x.c} mt-1"></i><span class="small">${x.t}</span></div>`).join('')}
    `;

    $('#analisis-comparacion').innerHTML = `
      <div class="table-responsive"><table class="table table-sm mb-0">
        <thead><tr><th></th><th>${meses[mesAnterior]}</th><th>${meses[mesActual]}</th><th>Var</th></tr></thead>
        <tbody>
          <tr><td class="fw-medium">Ingresos</td><td>${formatMoney(totalIngAnterior)}</td><td>${formatMoney(totalIngActual)}</td><td><span class="badge bg-${varIngresos>=0?'success':'danger'} bg-opacity-10 text-${varIngresos>=0?'success':'danger'}">${varIngresos>=0?'+':''}${varIngresos}%</span></td></tr>
          <tr><td class="fw-medium">Gastos</td><td>${formatMoney(totalGasAnterior)}</td><td>${formatMoney(totalGasActual)}</td><td><span class="badge bg-${varGastos<=0?'success':'danger'} bg-opacity-10 text-${varGastos<=0?'success':'danger'}">${varGastos>=0?'+':''}${varGastos}%</span></td></tr>
          <tr><td class="fw-medium">Balance</td><td>${formatMoney(totalIngAnterior-totalGasAnterior)}</td><td>${formatMoney(totalIngActual-totalGasActual)}</td><td></td></tr>
        </tbody>
      </table></div>`;

    $('#analisis-promedios').innerHTML = `
      <div class="d-flex flex-column gap-2 mb-3">
        <div class="d-flex justify-content-between"><span class="small text-muted">Promedio ingresos</span><span class="fw-bold text-success">${formatMoney(promedioIng)}</span></div>
        <div class="d-flex justify-content-between"><span class="small text-muted">Promedio gastos</span><span class="fw-bold text-danger">${formatMoney(promedioGas)}</span></div>
        <div class="d-flex justify-content-between"><span class="small text-muted">Ahorro mensual</span><span class="fw-bold text-${ahorroMensual>=0?'primary':'danger'}">${formatMoney(ahorroMensual)}</span></div>
      </div>
      <hr class="my-2">
      <h6 class="fw-semibold small mb-2"><i class="bi bi-lightbulb text-warning me-1"></i>Recomendaciones</h6>
      <ul class="list-unstyled small mb-0">${recs.map(r => `<li class="mb-2"><i class="bi bi-arrow-right-circle text-primary me-2"></i>${r}</li>`).join('')}</ul>`;

    const allCats = {...gastosPorCatActual};
    Object.keys(gastosPorCatAnterior).forEach(c => { if (!allCats[c]) allCats[c] = 0; });
    const catRows = Object.keys(allCats).sort((a,b) => (gastosPorCatActual[b]||0) - (gastosPorCatActual[a]||0)).map(cat => {
      const act = gastosPorCatActual[cat]||0, ant = gastosPorCatAnterior[cat]||0;
      const v = ant > 0 ? Math.round(((act-ant)/ant)*100) : (act > 0 ? 100 : 0);
      return `<tr><td>${cat}</td><td>${formatMoney(ant)}</td><td>${formatMoney(act)}</td><td><span class="badge bg-${v<=0?'success':'danger'} bg-opacity-10 text-${v<=0?'success':'danger'}">${v>=0?'+':''}${v}%</span></td></tr>`;
    }).join('');
    $('#analisis-categorias').innerHTML = catRows ? `<div class="table-responsive"><table class="table table-sm table-hover mb-0"><thead><tr><th>Categoría</th><th>Anterior</th><th>Actual</th><th>Var</th></tr></thead><tbody>${catRows}</tbody></table></div>` : '<p class="text-muted text-center small">Sin datos</p>';

  } catch (err) { console.error('Error cargando análisis:', err); }
}
