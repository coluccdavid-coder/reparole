// =====================================================================
//  GRAPHIQUES LÉGERS (v5) — SVG généré à la main, sans librairie externe,
//  pour rester cohérent avec le reste du projet (zéro dépendance).
// =====================================================================
const Charts = {
  // Courbe de taux de réussite dans le temps, à partir de l'historique
  // des séances ([{score,total,at}, ...]).
  successLine(history, { width=600, height=180 } = {}){
    if(!history || history.length<2){
      // v6.115 : charts.js est inclus sur des pages qui ne chargent pas
      // forcément js/i18n.js (ex. mon-resume.html) — repli défensif sur
      // le français si I18N n'existe pas, plutôt qu'une erreur JS.
      const msg = (typeof I18N!=='undefined') ? I18N.t('chart_not_enough_data') : 'Pas encore assez de séances pour tracer une courbe.';
      return `<p class="hint">${msg}</p>`;
    }
    const pad=28;
    const pts = history.map(h=> h.total? h.score/h.total : 0);
    const n = pts.length;
    const x = i => pad + (i/(n-1))*(width-2*pad);
    const y = v => height-pad - v*(height-2*pad);
    const path = pts.map((v,i)=> (i===0?'M':'L')+x(i).toFixed(1)+','+y(v).toFixed(1)).join(' ');
    const areaPath = path + ` L${x(n-1).toFixed(1)},${(height-pad).toFixed(1)} L${x(0).toFixed(1)},${(height-pad).toFixed(1)} Z`;
    const dots = pts.map((v,i)=>`<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3.5" fill="var(--accent)"></circle>`).join('');
    const gridLines = [0,0.25,0.5,0.75,1].map(g=>`
      <line x1="${pad}" x2="${width-pad}" y1="${y(g).toFixed(1)}" y2="${y(g).toFixed(1)}" stroke="var(--line)" stroke-width="1"/>
      <text x="4" y="${(y(g)+4).toFixed(1)}" font-size="10" fill="var(--ink-soft)">${Math.round(g*100)}%</text>`).join('');
    return `<svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto" role="img" aria-label="Courbe du taux de réussite dans le temps">
      ${gridLines}
      <path d="${areaPath}" fill="var(--accent-soft)" stroke="none"/>
      <path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>
      ${dots}
    </svg>`;
  },

  // Barres horizontales simples (ex : répartition des catégories d'erreurs)
  barRows(items, { colorFor=()=> 'var(--accent)' } = {}){
    if(!items || !items.length) return `<p class="hint">Aucune donnée pour l'instant.</p>`;
    const max = Math.max(1, ...items.map(i=>i.count));
    return `<div style="display:grid;gap:10px">${items.map(i=>`
      <div style="display:grid;grid-template-columns:150px 1fr 34px;align-items:center;gap:10px;font-size:.85rem">
        <div>${i.label}</div>
        <div style="background:var(--line);border-radius:8px;height:14px;overflow:hidden">
          <div style="height:100%;border-radius:8px;width:${Math.round(100*i.count/max)}%;background:${colorFor(i)}"></div>
        </div>
        <div>${i.count}</div>
      </div>`).join('')}</div>`;
  }
};

if(typeof window !== 'undefined') window.Charts = Charts;
