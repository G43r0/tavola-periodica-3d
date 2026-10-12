// Testi della libreria del laboratorio (molecole, gruppi, reazioni) nella lingua attiva.
// I dati originali sono in italiano: in inglese si sostituiscono nome, descrizione, note e usi,
// conservando il nome italiano (nameIt, akaIt) perché la ricerca accetti entrambe le lingue.
import { getLang } from './index.js';
import { MOLECULES_EN, GROUPS_EN } from './data/molecules-en.js';
import { REACTION_GROUPS_EN, SUBGROUPS_EN, BASE_REACTIONS_EN, NOTES_EN, conditionEn } from './data/reactions-en.js';

/** @param {object[]} molecules @param {{key:string,label:string}[]} groups (modificati sul posto) */
export function localizeLibrary(molecules, groups) {
  for (const m of molecules) {
    m.nameIt ??= m.name;
    m.akaIt ??= m.aka;
  }
  if (getLang() !== 'en') return;
  for (const g of groups) g.label = GROUPS_EN[g.key] ?? g.label;
  for (const m of molecules) {
    const e = MOLECULES_EN[m.id];
    if (!e) continue;
    m.name = e.n;
    m.aka = e.a;
    if (e.d) m.desc = e.d;
    m.note = e.o;
    m.uses = e.u;
  }
}

/**
 * Reazioni nella lingua attiva. `cond` e `needs` restano in italiano perché la sandbox li interpreta;
 * il testo da mostrare è in `condText` e `needsText`.
 */
export function localizeReactions(reactions, groups) {
  for (const r of reactions) {
    r.condText = r.cond;
    r.needsText = r.needs;
  }
  if (getLang() !== 'en') return;
  for (const g of groups) g.label = REACTION_GROUPS_EN[g.key] ?? g.label;
  for (const r of reactions) {
    const base = BASE_REACTIONS_EN[r.id];
    const sub = SUBGROUPS_EN[r.sub] ?? r.sub;
    if (base) {
      r.name = base.n;
      r.desc = base.d;
      r.note = base.o;
    } else if (r.catalogo) {
      r.desc = NOTES_EN[r.catalogo] ?? `${sub}.`;
    }
    r.sub = sub;
    r.condText = conditionEn(r.cond);
    r.needsText = base?.needs ?? conditionEn(r.needs);
  }
}
