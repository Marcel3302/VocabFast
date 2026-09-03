(() => {
  'use strict';
  const roots = window.VOCAB_DATA;
  if (!Array.isArray(roots) || roots.some(n => n?.name === 'Allgemeiner Wortschatz A1–C2')) return;
  const source = roots.find(n => n?.name === 'Allgemeines Englisch');
  if (!source) return;
  const collect = (node, out = []) => { out.push(...(node?.words || [])); for (const child of node?.children || []) collect(child, out); return out; };
  const seen = new Map();
  for (const word of collect(source, [])) {
    if (!word?.en) continue;
    const key = `${String(word.en).trim().toLowerCase()}|${String(word.de || '').trim().toLowerCase()}`;
    if (!seen.has(key)) seen.set(key, word);
  }
  const all = [...seen.values()];
  const labels = { A1:'A1 – Grundlagen', A2:'A2 – Grundkenntnisse', B1:'B1 – Mittelstufe', B2:'B2 – Selbstständige Sprachverwendung', C1:'C1 – Fortgeschritten', C2:'C2 – Native / Mastery' };
  roots.unshift({ name:'Allgemeiner Wortschatz A1–C2', words:[], children:['A1','A2','B1','B2','C1','C2'].map(level=>({ name:labels[level], words:all.filter(word=>word.level===level), children:[] })) });
})();
