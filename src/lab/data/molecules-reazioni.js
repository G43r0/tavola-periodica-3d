// Sostanze aggiunte per le reazioni del catalogo (docs/catalogo-reazioni.md): i prodotti e i reagenti delle
// reazioni classiche che prima non si potevano scrivere con la libreria (ioni monoatomici, silice, sali di
// manganese e cromo, idrati, complessi, composti organici di base…).
// Stessi criteri di molecules.js e molecules-more.js: nomi italiani, SMILES in forma di Kekulé con cariche
// esplicite, stato a 25 °C e 1 atm; i composti dei metalli d e f con il modello ionico.
// hf: ΔHf° in kJ/mol a 25 °C (NIST Chemistry WebBook, CRC Handbook), solo se noto con certezza. Per gli ioni
// in soluzione è il valore in acqua (convenzione ΔHf°(H⁺, aq) = 0).
// Complessi: legami di coordinazione scritti come legami singoli, con la carica sul metallo (numero di ossidazione).
// Idrati: l'acqua di cristallizzazione compare come molecole separate.

const SIMPLE_IONIC = 'Composto ionico (modello semplificato: nel solido reale il legame ha anche carattere covalente).';

/** Sale o ossido scritto con il modello ionico. */
const salt = (id, group, name, formula, smiles, extra = {}) => ({ id, group, name, formula, smiles, state: 'solido', desc: SIMPLE_IONIC, ...extra });
/** Ione in soluzione acquosa. */
const ion = (id, name, smiles, extra = {}) => ({ id, group: 'ioni', name, smiles, state: 'soluzione', ...extra });

export const REACTION_MOLECULES = [
  // ---------------------------------------------------------------- ioni monoatomici
  ion('ione-sodio', 'Ione sodio', '[Na+]', { hf: -240.1, desc: 'Il sodio che ha ceduto il suo elettrone di valenza: ha la configurazione del neon.', uses: 'In tutte le soluzioni di sali di sodio; regola l\'equilibrio dei liquidi nel corpo.' }),
  ion('ione-potassio', 'Ione potassio', '[K+]', { hf: -252.4, desc: 'Catione con la configurazione dell\'argon.', uses: 'Trasmissione degli impulsi nervosi (pompa sodio-potassio).' }),
  ion('ione-argento', 'Ione argento', '[Ag+]', { hf: 105.6, desc: 'Forma precipitati con cloruri, bromuri e ioduri: è il reagente per riconoscere gli alogenuri.', uses: 'Disinfettante (argento colloidale), fotografia.' }),
  ion('ione-calcio', 'Ione calcio', '[Ca+2]', { hf: -542.8, desc: 'Con il magnesio è responsabile della durezza dell\'acqua.', uses: 'Ossa, denti, contrazione muscolare.' }),
  ion('ione-bario', 'Ione bario', '[Ba+2]', { hf: -537.6, desc: 'Tossico in soluzione; con il solfato forma BaSO₄, insolubile e innocuo.', uses: 'Saggio dei solfati.' }),
  ion('ione-piombo', 'Ione piombo(II)', '[Pb+2]', { hf: -1.7, desc: 'Conserva la coppia di elettroni 6s² («coppia inerte»).', uses: 'Precipitati colorati: PbI₂ giallo, PbS nero, PbCrO₄ giallo.' }),
  ion('ione-rame', 'Ione rame(II)', '[Cu+2]', { hf: 64.8, desc: 'In acqua è azzurro; con l\'ammoniaca forma un complesso blu intenso.', uses: 'Galvanostatica, fungicidi (poltiglia bordolese).' }),
  ion('ione-zinco', 'Ione zinco', '[Zn+2]', { hf: -153.9, desc: 'Incolore: ha gli orbitali 3d completi.', uses: 'Pila Daniell, integratori.' }),
  ion('ione-ferro2', 'Ione ferro(II)', '[Fe+2]', { hf: -89.1, aka: 'ione ferroso', desc: 'Verde pallido in soluzione; all\'aria si ossida lentamente a ferro(III).', uses: 'Emoglobina (il ferro che lega l\'ossigeno è Fe²⁺).' }),
  ion('ione-ferro3', 'Ione ferro(III)', '[Fe+3]', { hf: -48.5, aka: 'ione ferrico', desc: 'Giallo-bruno in soluzione; con il tiocianato dà un colore rosso sangue.', uses: 'Coagulante nella depurazione delle acque.' }),
  ion('ione-manganese', 'Ione manganese(II)', '[Mn+2]', { hf: -220.8, desc: 'Quasi incolore (rosa pallido): è il prodotto della riduzione del permanganato in acido.', uses: 'Permanganometria.' }),
  ion('ione-cromo', 'Ione cromo(III)', '[Cr+3]', { desc: 'Verde in soluzione: è il prodotto della riduzione del dicromato.', uses: 'Concia delle pelli; l\'etilometro chimico vira dall\'arancione al verde.' }),
  ion('cloruro', 'Ione cloruro', '[Cl-]', { hf: -167.2, desc: 'Il cloro che ha acquistato un elettrone: ha la configurazione dell\'argon.', uses: 'Nel sale da cucina e nell\'acqua di mare; acido cloridrico dello stomaco.' }),
  ion('bromuro', 'Ione bromuro', '[Br-]', { hf: -121.6, desc: 'Presente nell\'acqua di mare, da cui si estrae il bromo con il cloro.' }),
  ion('ioduro', 'Ione ioduro', '[I-]', { hf: -55.2, desc: 'Si ossida facilmente a iodio (I₂).', uses: 'Sale iodato, iodometria.' }),

  // ---------------------------------------------------------------- ioni poliatomici e complessi
  ion('tetrationato', 'Ione tetrationato', '[O-]S(=O)(=O)SSS(=O)(=O)[O-]', { formula: 'S₄O₆', desc: 'Catena di quattro atomi di zolfo: si forma quando lo iodio ossida il tiosolfato (iodometria).' }),
  ion('tiocianatoferro', 'Ione tiocianatoferro(III)', '[Fe+3][N-]=C=S', { formula: '[Fe(SCN)]', desc: 'Complesso rosso sangue: il tiocianato si lega al ferro con l\'atomo di azoto.', uses: 'Riconoscimento del ferro(III); esperimenti sull\'equilibrio chimico.' }),
  ion('tetraamminorame', 'Ione tetraamminorame(II)', '[NH3][Cu+2]([NH3])([NH3])[NH3]', { formula: '[Cu(NH₃)₄]', desc: 'Complesso blu intenso: quattro molecole di ammoniaca cedono una coppia di elettroni al rame. Nella realtà è quadrato planare.', uses: 'Riconoscimento del rame(II); reattivo di Schweizer (scioglie la cellulosa).' }),
  ion('esacianoferrato3', 'Ione esacianoferrato(III)', `[Fe+3]${'([C-]#N)'.repeat(5)}[C-]#N`, { formula: '[Fe(CN)₆]', aka: 'ione ferricianuro', desc: 'Sei ioni cianuro legati al ferro(III) con l\'atomo di carbonio, ai vertici di un ottaedro. Il cianuro è legato così forte che lo ione non è velenoso come il cianuro libero.', uses: 'Con il ferro(II) dà il blu di Prussia (blu di Turnbull): riconoscimento del Fe²⁺.' }),
  ion('esacianoferrato2', 'Ione esacianoferrato(II)', `[Fe+2]${'([C-]#N)'.repeat(5)}[C-]#N`, { formula: '[Fe(CN)₆]', aka: 'ione ferrocianuro', desc: 'Sei ioni cianuro legati al ferro(II) ai vertici di un ottaedro; giallo pallido in soluzione.', uses: 'Con il ferro(III) dà il blu di Prussia: riconoscimento del Fe³⁺.' }),
  salt('k3fecn6', 'ionici', 'Esacianoferrato(III) di potassio', 'K₃[Fe(CN)₆]', `[K+].[K+].[K+].[Fe+3]${'([C-]#N)'.repeat(5)}[C-]#N`, { aka: 'ferricianuro di potassio, prussiato rosso', desc: 'Cristalli rossi: tre ioni K⁺ e lo ione complesso [Fe(CN)₆]³⁻, che resta intero anche in acqua.', uses: 'Reattivo per il ferro(II) (blu di Turnbull); cianotipia (stampa «blueprint»).' }),
  salt('k4fecn6', 'ionici', 'Esacianoferrato(II) di potassio', 'K₄[Fe(CN)₆]', `[K+].[K+].[K+].[K+].[Fe+2]${'([C-]#N)'.repeat(5)}[C-]#N`, { aka: 'ferrocianuro di potassio, prussiato giallo', desc: 'Cristalli gialli: quattro ioni K⁺ e lo ione complesso [Fe(CN)₆]⁴⁻.', uses: 'Reattivo per il ferro(III) (blu di Prussia); antiagglomerante del sale da cucina (E536).' }),
  ion('diamminoargento', 'Ione diamminoargento(I)', '[NH3][Ag+][NH3]', { formula: '[Ag(NH₃)₂]', desc: 'Complesso lineare: per questo il cloruro d\'argento si scioglie nell\'ammoniaca.', uses: 'Reattivo di Tollens (specchio d\'argento).' }),
  ion('ditiosolfatoargentato', 'Ione ditiosolfatoargentato(I)', '[O-][S](=O)([O-])S[Ag+]S[S](=O)([O-])[O-]', { formula: '[Ag(S₂O₃)₂]', desc: 'Complesso solubile che si forma quando il tiosolfato scioglie il bromuro d\'argento.', uses: 'Fissaggio delle pellicole fotografiche.' }),

  // ---------------------------------------------------------------- ossidi dei non metalli
  { id: 'sio2', hf: -910.7, group: 'ossidi', name: 'Diossido di silicio', aka: 'silice, quarzo, sabbia', smiles: 'O=[Si]=O', state: 'solido',
    desc: 'Nel solido ogni silicio è legato a quattro ossigeni e ogni ossigeno a due silici: un reticolo covalente tridimensionale. Qui è mostrata una sola unità SiO₂.',
    note: 'A differenza della CO₂ non forma molecole isolate: il silicio non fa doppi legami stabili con l\'ossigeno.', uses: 'Vetro, cemento, sabbia, fibre ottiche, quarzo degli orologi.' },
  { id: 'b2o3', hf: -1273.5, group: 'ossidi', name: 'Triossido di diboro', aka: 'anidride borica', formula: 'B₂O₃', smiles: 'O=BOB=O', state: 'solido',
    desc: 'Nel solido è un reticolo vetroso; qui è mostrata l\'unità B₂O₃.', uses: 'Vetro borosilicato (Pyrex), smalti.' },
  { id: 'p4o6', hf: -1640.1, group: 'ossidi', name: 'Esossido di tetrafosforo', aka: 'anidride fosforosa', formula: 'P₄O₆', smiles: 'P12OP3OP(O1)OP(O2)O3', state: 'solido',
    desc: 'Gabbia come P₄O₁₀ ma senza i quattro ossigeni terminali: si forma quando il fosforo brucia con poco ossigeno.' },
  { id: 'as4o6', hf: -1314.8, group: 'ossidi', name: 'Triossido di arsenico', aka: 'anidride arseniosa, arsenico bianco', formula: 'As₄O₆', smiles: '[As]12O[As]3O[As](O1)O[As](O2)O3', state: 'solido',
    desc: 'Molecole a gabbia As₄O₆ (nella formula semplificata As₂O₃), come P₄O₆.', note: 'Molto tossico: è l\'«arsenico» dei veleni storici.', uses: 'Farmaco contro una forma di leucemia; conservante del legno (in passato).' },
  { id: 'seo2', hf: -225.4, group: 'ossidi', name: 'Diossido di selenio', smiles: 'O=[Se]=O', state: 'solido',
    desc: 'Nel gas è una molecola piegata come SO₂; nel solido forma catene.', uses: 'Ossidante in chimica organica.' },
  { id: 'geo2', hf: -580.0, group: 'ossidi', name: 'Diossido di germanio', smiles: 'O=[Ge]=O', state: 'solido',
    desc: 'Solido con un reticolo simile a quello della silice; qui è mostrata l\'unità GeO₂.', uses: 'Fibre ottiche, lenti per l\'infrarosso.' },
  { id: 'i2o5', hf: -158.1, group: 'ossidi', name: 'Pentossido di diiodio', formula: 'I₂O₅', smiles: 'O=[I](=O)O[I](=O)=O', state: 'solido',
    desc: 'Si ottiene disidratando l\'acido iodico.', uses: 'Dosaggio del monossido di carbonio (lo ossida a CO₂ liberando iodio).' },

  // ---------------------------------------------------------------- molecole inorganiche e acidi
  { id: 'nh2cl', group: 'inorganiche', name: 'Monoclorammina', formula: 'NH₂Cl', smiles: 'NCl', state: 'soluzione',
    desc: 'Piramidale come l\'ammoniaca, con un cloro al posto di un idrogeno; instabile allo stato puro.', note: 'Si forma mescolando candeggina e ammoniaca: i suoi vapori sono tossici.', uses: 'Disinfezione dell\'acqua potabile (clorammine).' },
  { id: 'h2s2o7', hf: -1273.6, group: 'acidi', name: 'Acido disolforico', aka: 'acido pirosolforico, oleum', formula: 'H₂S₂O₇', smiles: 'OS(=O)(=O)OS(=O)(=O)O', state: 'solido',
    desc: 'Due unità di acido solforico unite da un ponte di ossigeno.', uses: 'Nel processo a contatto si assorbe SO₃ in acido solforico formando l\'oleum.' },
  { id: 'hreo4', group: 'acidi', name: 'Acido perrenico', formula: 'HReO₄', smiles: 'O[Re](=O)(=O)=O', state: 'soluzione',
    desc: 'Acido forte del renio(VII), analogo dell\'acido permanganico.', uses: 'Preparazione dei catalizzatori al renio.' },

  // ---------------------------------------------------------------- composti ionici dei gruppi principali
  salt('na2sio3', 'ionici', 'Silicato di sodio', 'Na₂SiO₃', '[Na+].[Na+].[O-][Si](=O)[O-]', { hf: -1554.9, aka: 'vetro solubile', desc: 'Nel solido i tetraedri SiO₄ formano catene; qui è mostrata l\'unità SiO₃²⁻.', uses: 'Adesivi, detersivi, «giardino chimico».' }),
  salt('casio3', 'ionici', 'Silicato di calcio', 'CaSiO₃', '[Ca+2].[O-][Si](=O)[O-]', { hf: -1634.9, aka: 'wollastonite', desc: 'Minerale formato da catene di tetraedri SiO₄ e ioni Ca²⁺.', uses: 'Scorie dell\'altoforno, cemento, ceramiche.' }),
  salt('ko2', 'ionici', 'Superossido di potassio', 'KO₂', '[K+].[O-][O]', { hf: -284.9, desc: 'Contiene lo ione superossido O₂⁻: ha un elettrone spaiato (radicale) ed è giallo.', uses: 'Autorespiratori: assorbe CO₂ e libera ossigeno.' }),
  salt('k2s', 'ionici', 'Solfuro di potassio', 'K₂S', '[K+].[K+].[S-2]', { hf: -380.7, desc: 'Due K⁺ per ogni S²⁻.', uses: 'Si forma nella combustione della polvere nera.' }),
  salt('cas', 'ionici', 'Solfuro di calcio', 'CaS', '[Ca+2].[S-2]', { hf: -482.4, desc: 'Ca²⁺ e S²⁻.', uses: 'Pigmenti fosforescenti; sottoprodotto del processo Leblanc.' }),
  salt('bao', 'ionici', 'Ossido di bario', 'BaO', '[Ba+2].[O-2]', { hf: -548.0, desc: 'Ba²⁺ e O²⁻.', uses: 'Vetri ottici; nell\'Ottocento serviva a ricavare l\'ossigeno dall\'aria (processo Brin).' }),
  salt('bao2', 'ionici', 'Perossido di bario', 'BaO₂', '[Ba+2].[O-][O-]', { hf: -634.3, desc: 'Ba²⁺ e lo ione perossido O₂²⁻.', uses: 'Pirotecnica (fiamme verdi), sbiancante.' }),
  salt('baco3', 'ionici', 'Carbonato di bario', 'BaCO₃', '[Ba+2].[O-]C(=O)[O-]', { hf: -1213.0, desc: 'Precipita facendo gorgogliare CO₂ nell\'acqua di barite.', uses: 'Vetri e ceramiche; topicida (in passato).' }),
  salt('nahso4', 'ionici', 'Idrogenosolfato di sodio', 'NaHSO₄', '[Na+].OS(=O)(=O)[O-]', { hf: -1125.5, aka: 'bisolfato di sodio', desc: 'Sale acido: Na⁺ e lo ione HSO₄⁻.', uses: 'Correttore del pH delle piscine, detergenti per WC.' }),
  salt('kno2', 'ionici', 'Nitrito di potassio', 'KNO₂', '[K+].[O-]N=O', { hf: -369.8, desc: 'K⁺ e lo ione nitrito NO₂⁻.', uses: 'Conservante delle carni (E249).' }),
  salt('cano32', 'ionici', 'Nitrato di calcio', 'Ca(NO₃)₂', '[Ca+2].[O-][N+](=O)[O-].[O-][N+](=O)[O-]', { hf: -938.2, desc: 'Ca²⁺ e due ioni nitrato.', uses: 'Fertilizzante; accelerante del cemento.' }),
  salt('mgno32', 'ionici', 'Nitrato di magnesio', 'Mg(NO₃)₂', '[Mg+2].[O-][N+](=O)[O-].[O-][N+](=O)[O-]', { hf: -790.7, desc: 'Mg²⁺ e due ioni nitrato.', uses: 'Fertilizzante.' }),
  salt('bano32', 'ionici', 'Nitrato di bario', 'Ba(NO₃)₂', '[Ba+2].[O-][N+](=O)[O-].[O-][N+](=O)[O-]', { hf: -988.0, desc: 'Ba²⁺ e due ioni nitrato.', uses: 'Fuochi d\'artificio (fiamma verde).' }),
  salt('cahco32', 'ionici', 'Idrogenocarbonato di calcio', 'Ca(HCO₃)₂', '[Ca+2].OC(=O)[O-].OC(=O)[O-]', { state: 'soluzione', aka: 'bicarbonato di calcio', desc: 'Esiste solo in soluzione: si forma quando l\'acqua ricca di CO₂ scioglie il calcare.', uses: 'Durezza temporanea dell\'acqua; grotte, stalattiti e stalagmiti.' }),
  salt('caclo2', 'ionici', 'Ipoclorito di calcio', 'Ca(ClO)₂', '[Ca+2].[O-]Cl.[O-]Cl', { desc: 'Ca²⁺ e due ioni ipoclorito: solido che libera cloro attivo.', uses: 'Disinfezione delle piscine e dell\'acqua.' }),
  salt('naclo3', 'ionici', 'Clorato di sodio', 'NaClO₃', '[Na+].[O-][Cl](=O)=O', { hf: -365.8, desc: 'Na⁺ e lo ione clorato ClO₃⁻; forte ossidante.', uses: 'Produzione del diossido di cloro; candele a ossigeno degli aerei.' }),
  salt('naclo2', 'ionici', 'Clorito di sodio', 'NaClO₂', '[Na+].[O-][Cl]=O', { hf: -307.0, desc: 'Na⁺ e lo ione clorito ClO₂⁻.', uses: 'Produzione del diossido di cloro per la potabilizzazione.' }),
  salt('cah2po42', 'ionici', 'Diidrogenofosfato di calcio', 'Ca(H₂PO₄)₂', '[Ca+2].OP(=O)(O)[O-].OP(=O)(O)[O-]', { aka: 'superfosfato triplo', desc: 'Ca²⁺ e due ioni H₂PO₄⁻: è solubile, a differenza del fosfato di calcio.', uses: 'Fertilizzante fosfatico; agente lievitante.' }),
  salt('nh4h2po4', 'ionici', 'Diidrogenofosfato di ammonio', 'NH₄H₂PO₄', '[NH4+].OP(=O)(O)[O-]', { hf: -1445.1, aka: 'fosfato monoammonico, MAP', desc: 'Sale senza metalli: NH₄⁺ e H₂PO₄⁻.', uses: 'Fertilizzante; polvere degli estintori ABC.' }),
  salt('rboh', 'ionici', 'Idrossido di rubidio', 'RbOH', '[Rb+].[OH-]', { hf: -418.2, desc: 'Base fortissima.', uses: 'Si forma quando il rubidio reagisce con l\'acqua.' }),
  salt('csoh', 'ionici', 'Idrossido di cesio', 'CsOH', '[Cs+].[OH-]', { hf: -416.2, desc: 'Una delle basi più forti; corrode il vetro.', uses: 'Si forma quando il cesio reagisce con l\'acqua.' }),
  salt('sroh2', 'ionici', 'Idrossido di stronzio', 'Sr(OH)₂', '[Sr+2].[OH-].[OH-]', { hf: -959.0, desc: 'Base forte.', uses: 'Raffinazione dello zucchero di barbabietola (in passato).' }),
  salt('naaloh4', 'ionici', 'Tetraidrossoalluminato di sodio', 'Na[Al(OH)₄]', '[Na+].O[Al-](O)(O)O', { state: 'soluzione', aka: 'alluminato di sodio', desc: 'Si forma quando l\'alluminio o il suo idrossido si sciolgono in una base: l\'alluminio è anfotero.', uses: 'Processo Bayer per l\'allumina; sturalavandini in polvere (con l\'alluminio).' }),
  salt('pbso4', 'ionici', 'Solfato di piombo(II)', 'PbSO₄', '[Pb+2].[O-]S(=O)(=O)[O-]', { hf: -920.0, desc: 'Pb²⁺ e SO₄²⁻: bianco e poco solubile.', uses: 'Si forma sulle due piastre della batteria al piombo quando si scarica.' }),
  salt('pbcl2', 'ionici', 'Cloruro di piombo(II)', 'PbCl₂', '[Cl-].[Pb+2].[Cl-]', { hf: -359.4, desc: 'Poco solubile a freddo, più solubile in acqua calda.', uses: 'Analisi qualitativa dei cationi.' }),
  salt('cuso4-5h2o', 'metalli', 'Solfato di rame(II) pentaidrato', 'CuSO₄·5H₂O', '[Cu+2].[O-]S(=O)(=O)[O-].O.O.O.O.O', { hf: -2279.7, aka: 'vetriolo azzurro', desc: 'Cristalli azzurri: cinque molecole d\'acqua per ogni unità di solfato di rame. Scaldandolo perde l\'acqua e diventa bianco.', note: 'Sul banco l\'acqua di cristallizzazione compare come molecole separate.', uses: 'Fungicida (poltiglia bordolese), rivelatore di umidità.' }),
  salt('cocl2-6h2o', 'metalli', 'Cloruro di cobalto(II) esaidrato', 'CoCl₂·6H₂O', '[Cl-].[Co+2].[Cl-].O.O.O.O.O.O', { hf: -2115.4, desc: 'Cristalli rosa; anidro è blu: il colore indica la presenza d\'acqua.', note: 'Sul banco l\'acqua di cristallizzazione compare come molecole separate.', uses: 'Indicatore di umidità nel gel di silice.' }),
  salt('caso4-2h2o', 'ionici', 'Solfato di calcio diidrato', 'CaSO₄·2H₂O', '[Ca+2].[O-]S(=O)(=O)[O-].O.O', { hf: -2022.6, aka: 'gesso', desc: 'Il gesso naturale: scaldandolo perde acqua (gesso cotto); impastato con acqua la riprende e fa presa.', note: 'Sul banco l\'acqua di cristallizzazione compare come molecole separate.', uses: 'Edilizia, ingessature, lavagne (gessetti di gesso).' }),
  salt('nh4ocn', 'ionici', 'Cianato di ammonio', 'NH₄OCN', '[NH4+].[O-]C#N', { desc: 'NH₄⁺ e lo ione cianato OCN⁻: stessa formula dell\'urea (isomero).', note: 'Wöhler (1828) lo trasformò in urea scaldandolo: la prima sintesi di una sostanza organica da una inorganica.' }),

  // ---------------------------------------------------------------- composti dei metalli di transizione
  salt('fes', 'metalli', 'Solfuro di ferro(II)', 'FeS', '[Fe+2].[S-2]', { hf: -100.0, aka: 'pirrotite', uses: 'Esperimento «miscuglio o composto»; preparazione di H₂S in laboratorio.' }),
  salt('feoh2', 'metalli', 'Idrossido di ferro(II)', 'Fe(OH)₂', '[Fe+2].[OH-].[OH-]', { hf: -569.0, desc: 'Precipitato verde chiaro che all\'aria imbrunisce ossidandosi.' }),
  salt('feoh3', 'metalli', 'Idrossido di ferro(III)', 'Fe(OH)₃', '[Fe+3].[OH-].[OH-].[OH-]', { hf: -823.0, desc: 'Precipitato rosso-bruno; è il principale componente della ruggine (ossido idrato).', uses: 'Coagulante nella depurazione delle acque.' }),
  salt('fe2so43', 'metalli', 'Solfato di ferro(III)', 'Fe₂(SO₄)₃', '[Fe+3].[Fe+3].[O-]S(=O)(=O)[O-].[O-]S(=O)(=O)[O-].[O-]S(=O)(=O)[O-]', { desc: 'Due Fe³⁺ e tre SO₄²⁻.', uses: 'Coagulante per le acque; mordente per tingere i tessuti.' }),
  salt('mnso4', 'metalli', 'Solfato di manganese(II)', 'MnSO₄', '[Mn+2].[O-]S(=O)(=O)[O-]', { hf: -1065.3, uses: 'Fertilizzanti (il manganese è un micronutriente); prodotto delle titolazioni con il permanganato.' }),
  salt('mncl2', 'metalli', 'Cloruro di manganese(II)', 'MnCl₂', '[Cl-].[Mn+2].[Cl-]', { hf: -481.3, uses: 'Si forma quando il diossido di manganese ossida l\'acido cloridrico (Scheele, 1774).' }),
  salt('k2mno4', 'metalli', 'Manganato di potassio', 'K₂MnO₄', '[K+].[K+].[O-][Mn](=O)(=O)[O-]', { desc: 'Due K⁺ e lo ione manganato MnO₄²⁻ (manganese +6), verde.', uses: 'Intermedio della produzione del permanganato.' }),
  salt('mn2o3', 'metalli', 'Ossido di manganese(III)', 'Mn₂O₃', '[Mn+3].[Mn+3].[O-2].[O-2].[O-2]', { hf: -959.0, uses: 'Si forma al catodo delle pile alcaline.' }),
  salt('cr2so43', 'metalli', 'Solfato di cromo(III)', 'Cr₂(SO₄)₃', '[Cr+3].[Cr+3].[O-]S(=O)(=O)[O-].[O-]S(=O)(=O)[O-].[O-]S(=O)(=O)[O-]', { desc: 'Due Cr³⁺ e tre SO₄²⁻; verde in soluzione.', uses: 'Concia delle pelli; è il prodotto verde dell\'etilometro chimico.' }),
  salt('crcl3', 'metalli', 'Cloruro di cromo(III)', 'CrCl₃', '[Cl-].[Cr+3].[Cl-].[Cl-]', { hf: -556.5, uses: 'Cromatura; catalizzatori.' }),
  { id: 'cro3', hf: -589.5, group: 'metalli', name: 'Triossido di cromo', aka: 'anidride cromica', formula: 'CrO₃', smiles: '[Cr](=O)(=O)=O', state: 'solido',
    desc: 'Solido rosso scuro, fortissimo ossidante: il cromo ha numero di ossidazione +6.', uses: 'Cromatura galvanica.' },
  salt('pbcro4', 'metalli', 'Cromato di piombo(II)', 'PbCrO₄', '[Pb+2].[O-][Cr](=O)(=O)[O-]', { desc: 'Pb²⁺ e lo ione cromato: precipitato giallo brillante.', uses: 'Pigmento «giallo cromo» (tossico).' }),
  salt('ag2cro4', 'metalli', 'Cromato d\'argento', 'Ag₂CrO₄', '[Ag+].[Ag+].[O-][Cr](=O)(=O)[O-]', { hf: -731.7, desc: 'Precipitato rosso mattone.', uses: 'Indicatore del metodo di Mohr per titolare i cloruri.' }),
  salt('bacro4', 'metalli', 'Cromato di bario', 'BaCrO₄', '[Ba+2].[O-][Cr](=O)(=O)[O-]', { desc: 'Precipitato giallo.', uses: 'Pigmento; inibitore di corrosione.' }),
  salt('agi', 'metalli', 'Ioduro d\'argento', 'AgI', '[Ag+].[I-]', { hf: -61.8, desc: 'Precipitato giallo, il meno solubile degli alogenuri d\'argento.', uses: 'Inseminazione delle nuvole per provocare la pioggia; fotografia.' }),
  salt('ag2o', 'metalli', 'Ossido d\'argento', 'Ag₂O', '[Ag+].[Ag+].[O-2]', { hf: -31.1, desc: 'Polvere bruno-nera.', uses: 'Pile a bottone all\'ossido d\'argento.' }),
  salt('cuno32', 'metalli', 'Nitrato di rame(II)', 'Cu(NO₃)₂', '[Cu+2].[O-][N+](=O)[O-].[O-][N+](=O)[O-]', { hf: -302.9, desc: 'Cu²⁺ e due ioni nitrato; azzurro in soluzione.', uses: 'Si forma quando il rame si scioglie nell\'acido nitrico.' }),
  salt('cus', 'metalli', 'Solfuro di rame(II)', 'CuS', '[Cu+2].[S-2]', { hf: -53.1, aka: 'covellite', desc: 'Precipitato nero, insolubile anche negli acidi diluiti.' }),
  salt('cu2s', 'metalli', 'Solfuro di rame(I)', 'Cu₂S', '[Cu+].[Cu+].[S-2]', { hf: -79.5, aka: 'calcocite', desc: 'Due Cu⁺ per ogni S²⁻.', uses: 'Minerale da cui si estrae il rame.' }),
  salt('malachite', 'metalli', 'Carbonato basico di rame(II)', 'Cu₂(OH)₂CO₃', '[Cu+2].[Cu+2].[OH-].[O-]C(=O)[O-].[OH-]', { aka: 'malachite, verderame', desc: 'Due Cu²⁺, due OH⁻ e un CO₃²⁻: il verde della malachite e della patina del rame.', uses: 'Pietra ornamentale; pigmento verde.' }),
  salt('cui', 'metalli', 'Ioduro di rame(I)', 'CuI', '[Cu+].[I-]', { hf: -67.8, desc: 'Precipitato bianco che si forma insieme allo iodio quando gli ioduri riducono il rame(II).', uses: 'Integratore di iodio nei mangimi; dosaggio iodometrico del rame.' }),
  salt('na2znoh4', 'metalli', 'Tetraidrossozincato di sodio', 'Na₂[Zn(OH)₄]', '[Na+].[Na+].O[Zn-2](O)(O)O', { state: 'soluzione', aka: 'zincato di sodio', desc: 'Si forma quando lo zinco o il suo idrossido si sciolgono in una base forte: lo zinco è anfotero.' }),
  salt('hgso4', 'metalli', 'Solfato di mercurio(II)', 'HgSO₄', '[Hg+2].[O-]S(=O)(=O)[O-]', { hf: -707.5, uses: 'Catalizzatore dell\'idratazione dell\'acetilene (processo storico).' }),
  salt('haucl4', 'metalli', 'Acido tetracloroaurico', 'HAuCl₄', '[H+].Cl[Au-](Cl)(Cl)Cl', { desc: 'H⁺ e lo ione quadrato planare AuCl₄⁻: è la forma in cui l\'oro si scioglie nell\'acqua regia.', uses: 'Preparazione delle nanoparticelle d\'oro; doratura.' }),
  salt('h2ptcl6', 'metalli', 'Acido esacloroplatinico', 'H₂PtCl₆', '[H+].[H+].Cl[Pt-2](Cl)(Cl)(Cl)(Cl)Cl', { desc: 'Due H⁺ e lo ione ottaedrico PtCl₆²⁻: si forma sciogliendo il platino nell\'acqua regia.', uses: 'Catalizzatori al platino; raffinazione del platino.' }),

  // ---------------------------------------------------------------- lantanidi e attinidi
  salt('uf4', 'lantanidi', 'Tetrafluoruro di uranio', 'UF₄', '[F-].[U+4].[F-].[F-].[F-]', { hf: -1914.2, aka: 'sale verde', desc: 'Solido verde: passaggio intermedio tra il diossido di uranio e l\'esafluoruro.', uses: 'Ciclo del combustibile nucleare.' }),
  { id: 'uo2f2', group: 'lantanidi', name: 'Fluoruro di uranile', formula: 'UO₂F₂', smiles: 'O=[U](=O)(F)F', state: 'solido',
    desc: 'Contiene il gruppo uranile O=U=O lineare (uranio +6); si forma quando l\'UF₆ reagisce con l\'umidità.', uses: 'Indica le perdite di UF₆ negli impianti di arricchimento.' },
  salt('u3o8', 'lantanidi', 'Ossido di uranio', 'U₃O₈', '[U+5].[U+5].[U+6].[O-2].[O-2].[O-2].[O-2].[O-2].[O-2].[O-2].[O-2]', { hf: -3574.8, aka: 'yellowcake calcinato', desc: 'Ossido a valenza mista (due U(V) e un U(VI)): la forma più stabile dell\'uranio all\'aria.', uses: 'Forma in cui si commercia l\'uranio estratto dalle miniere.' }),
  salt('lacl3', 'lantanidi', 'Cloruro di lantanio', 'LaCl₃', '[La+3].[Cl-].[Cl-].[Cl-]', { hf: -1071.1, uses: 'Rimozione dei fosfati dalle acque; scintillatori.' }),
  salt('ce2o3', 'lantanidi', 'Ossido di cerio(III)', 'Ce₂O₃', '[Ce+3].[Ce+3].[O-2].[O-2].[O-2]', { hf: -1796.2, desc: 'Nelle marmitte catalitiche il cerio passa da CeO₂ a Ce₂O₃ e viceversa, «immagazzinando» ossigeno.' }),

  // ---------------------------------------------------------------- idrocarburi
  { id: 'etilbenzene', hf: -12.3, group: 'idrocarburi', name: 'Etilbenzene', formula: 'C₆H₅C₂H₅', smiles: 'CCC1=CC=CC=C1', state: 'liquido',
    desc: 'Benzene con un gruppo etile.', uses: 'Quasi tutto viene trasformato in stirene per il polistirene.' },
  { id: 'cumene', group: 'idrocarburi', name: 'Cumene', aka: 'isopropilbenzene', formula: 'C₆H₅CH(CH₃)₂', smiles: 'CC(C)C1=CC=CC=C1', state: 'liquido',
    desc: 'Benzene con un gruppo isopropile.', uses: 'Processo al cumene: da qui si ottengono insieme fenolo e acetone.' },

  // ---------------------------------------------------------------- molecole organiche
  { id: 'dibromoetano', group: 'organiche', name: '1,2-Dibromoetano', formula: 'BrCH₂CH₂Br', smiles: 'BrCCBr', state: 'liquido',
    desc: 'Si forma quando l\'etilene decolora l\'acqua di bromo: è il test dei doppi legami.', uses: 'Antidetonante insieme al piombo tetraetile (in passato); fumigante.' },
  { id: 'dicloroetano', group: 'organiche', name: '1,2-Dicloroetano', formula: 'ClCH₂CH₂Cl', smiles: 'ClCCCl', state: 'liquido',
    desc: 'Due atomi di cloro su carboni vicini.', uses: 'Intermedio del cloruro di vinile e quindi del PVC.' },
  { id: 'bromobenzene', hf: 60.9, group: 'organiche', name: 'Bromobenzene', formula: 'C₆H₅Br', smiles: 'BrC1=CC=CC=C1', state: 'liquido',
    desc: 'Benzene con un atomo di bromo.', uses: 'Sintesi organica (reattivi di Grignard).' },
  { id: 'nitrobenzene', hf: 12.5, group: 'organiche', name: 'Nitrobenzene', formula: 'C₆H₅NO₂', smiles: '[O-][N+](=O)C1=CC=CC=C1', state: 'liquido',
    desc: 'Benzene con un gruppo nitro; odore di mandorle amare.', uses: 'Produzione dell\'anilina (coloranti, poliuretani).' },
  { id: 'acido-tereftalico', group: 'organiche', name: 'Acido tereftalico', formula: 'C₆H₄(COOH)₂', smiles: 'OC(=O)C1=CC=C(C=C1)C(=O)O', state: 'solido',
    desc: 'Due gruppi carbossilici in posizione para sull\'anello benzenico.', uses: 'Con il glicole etilenico forma il PET delle bottiglie.' },
  { id: 'alcol-isoamilico', group: 'organiche', name: '3-Metilbutan-1-olo', aka: 'alcol isoamilico', formula: '(CH₃)₂CHCH₂CH₂OH', smiles: 'CC(C)CCO', state: 'liquido',
    desc: 'Alcol a cinque atomi di carbonio con una ramificazione.', uses: 'Si forma nella fermentazione; con l\'acido acetico dà l\'aroma di banana.' },
  { id: 'acetato-di-metile', hf: -445.9, group: 'organiche', name: 'Acetato di metile', formula: 'CH₃COOCH₃', smiles: 'COC(C)=O', state: 'liquido',
    desc: 'Estere dell\'acido acetico e del metanolo.', uses: 'Solvente per colle e vernici.' },
  { id: 'cloruro-di-acetile', hf: -272.9, group: 'organiche', name: 'Cloruro di acetile', formula: 'CH₃COCl', smiles: 'CC(Cl)=O', state: 'liquido',
    desc: 'L\'OH dell\'acido acetico è sostituito da un cloro: molto reattivo, fuma all\'aria umida.', uses: 'Introduce il gruppo acetile nelle sintesi organiche.' },
  { id: 'etossido-di-sodio', group: 'organiche', name: 'Etossido di sodio', formula: 'C₂H₅ONa', smiles: '[Na+].CC[O-]', state: 'solido',
    desc: 'Na⁺ e lo ione etossido: si forma quando il sodio reagisce con l\'etanolo.', uses: 'Base forte nelle sintesi organiche.' },
  { id: 'etanolammina', hf: -507.5, group: 'organiche', name: 'Etanolammina', aka: '2-amminoetanolo', formula: 'HOCH₂CH₂NH₂', smiles: 'NCCO', state: 'liquido',
    desc: 'Ha sia un gruppo amminico sia un gruppo alcolico.', uses: 'Cattura della CO₂ dai fumi industriali; detergenti.' },
  { id: 'amminofenolo', group: 'organiche', name: '4-Amminofenolo', formula: 'HOC₆H₄NH₂', smiles: 'NC1=CC=C(O)C=C1', state: 'solido',
    desc: 'Anello benzenico con un gruppo OH e un gruppo NH₂ in posizione para.', uses: 'Con l\'anidride acetica si ottiene il paracetamolo; sviluppatore fotografico.' },
  { id: 'stearato-di-sodio', group: 'organiche', name: 'Stearato di sodio', aka: 'sapone', formula: 'C₁₇H₃₅COONa', smiles: '[Na+].CCCCCCCCCCCCCCCCCC(=O)[O-]', state: 'solido',
    desc: 'Una lunga coda idrocarburica che si scioglie nei grassi e una testa ionica che si scioglie in acqua: così il sapone porta via lo sporco.', uses: 'Saponi solidi.' },

  // ---------------------------------------------------------------- biomolecole
  { id: 'tristearina', group: 'biomolecole', name: 'Tristearina', aka: 'tristearato di glicerile, grasso', formula: 'C₅₇H₁₁₀O₆', state: 'solido',
    smiles: 'CCCCCCCCCCCCCCCCCC(=O)OCC(OC(=O)CCCCCCCCCCCCCCCCC)COC(=O)CCCCCCCCCCCCCCCCC',
    desc: 'Trigliceride: il glicerolo legato con tre legami estere a tre molecole di acido stearico. È un grasso saturo.', uses: 'Grassi animali e burro di cacao; con la soda dà il sapone (saponificazione).' },
  { id: 'sorbitolo', group: 'biomolecole', name: 'Sorbitolo', aka: 'glucitolo, E420', formula: 'C₆H₁₄O₆', smiles: 'OCC(O)C(O)C(O)C(O)CO', state: 'solido',
    desc: 'Si ottiene dal glucosio sostituendo il gruppo aldeidico con un alcol.', uses: 'Dolcificante delle gomme da masticare senza zucchero.' },
  { id: 'acido-gluconico', group: 'biomolecole', name: 'Acido gluconico', formula: 'C₆H₁₂O₇', smiles: 'OCC(O)C(O)C(O)C(O)C(=O)O', state: 'solido',
    desc: 'Si forma quando l\'enzima glucosio ossidasi ossida il glucosio.', uses: 'I glucometri misurano questa reazione; additivo alimentare.' },
  { id: 'glicilglicina', group: 'biomolecole', name: 'Glicilglicina', formula: 'C₄H₈N₂O₃', smiles: 'NCC(=O)NCC(=O)O', state: 'solido',
    desc: 'Il dipeptide più semplice: due glicine unite da un legame peptidico (C(=O)–NH), lo stesso delle proteine.', uses: 'Tampone nei laboratori di biochimica.' },
  { id: 'acido-deidroascorbico', group: 'biomolecole', name: 'Acido deidroascorbico', formula: 'C₆H₆O₆', smiles: 'OCC(O)C1OC(=O)C(=O)C1=O', state: 'solido',
    desc: 'La vitamina C dopo aver ceduto due atomi di idrogeno: è la forma ossidata.', uses: 'Il corpo lo riconverte in vitamina C.' },

  // ---------------------------------------------------------------- farmaci e aromi
  { id: 'salicilato-di-metile', group: 'farmaci', name: 'Salicilato di metile', aka: 'olio di wintergreen', formula: 'HOC₆H₄COOCH₃', smiles: 'COC(=O)C1=CC=CC=C1O', state: 'liquido',
    desc: 'Estere dell\'acido salicilico e del metanolo, dall\'odore di menta.', uses: 'Pomate contro i dolori muscolari; aroma.' },
];
