# Catalogo delle reazioni chimiche del laboratorio

Elenco delle reazioni che il motore delle reazioni dovrà contenere. È solo l'elenco: nessun codice è stato scritto
o modificato.

## Che cosa sono le «445»

Le 445 voci sono le **sostanze** della libreria «Esempi» del laboratorio (`src/lab/data/molecules.js` +
`molecules-more.js`): molecole, ioni e composti ionici. Gli elementi chimici sono 118. Il catalogo usa quindi
**563 specie**: le 445 sostanze più i 118 elementi nel loro stato standard (`el:Na`, `el:Fe`, `el:C`…), che il
motore supporta già.

## Che cosa vuol dire «tutte le reazioni possibili»

Non si può arrivare all'elenco provando tutte le combinazioni. Con 563 specie ci sono circa 159 000 coppie e
30 milioni di terne di reagenti, e quasi tutte:

- non reagiscono affatto (Cu + HCl, N₂ + Ar, SF₆ + qualunque cosa a temperatura ambiente), oppure
- danno prodotti che non sono nella libreria (Fe + S → FeS, ma FeS non è una voce), oppure
- danno prodotti diversi secondo le condizioni (C + O₂ → CO₂ con molto ossigeno, 2 C + O₂ → 2 CO con poco ossigeno).

Il catalogo elenca quindi tutte le reazioni **reali e documentate** (chimica generale, analitica, industriale,
organica e biochimica) che rispettano due condizioni:

1. **Sono chiuse sulla libreria**: ogni reagente e ogni prodotto è una delle 445 voci o un elemento `el:X`.
   Il motore attuale le può quindi caricare senza aggiungere sostanze.
2. **Sono bilanciate** con i coefficienti interi minimi. Se una specie è uno ione, si conserva anche la carica.

Le reazioni importanti che richiedono sostanze **non** presenti nella libreria (SiO₂, FeS, MnCl₂, PbSO₄,
gli ioni monoatomici come Na⁺ e Cl⁻…) sono nell'[Appendice A](#appendice-a--reazioni-che-richiedono-nuove-sostanze-134),
insieme alle sostanze da aggiungere.

## In numeri

| | |
|---|---:|
| Reazioni nel catalogo | **1215** |
| Sostanze della libreria che compaiono in almeno una reazione | **445 / 445** |
| Elementi usati come `el:X` | 85 |
| Reazioni già presenti in `src/lab/data/reactions.js` (tutte incluse e segnate «già presente») | 45 / 45 |
| Equilibri (⇌) | 42 |
| Reazioni con ΔH° calcolabile oggi dalle entalpie di formazione della libreria | 274 |
| Reazioni con più bilanciamenti possibili, con i coefficienti scritti a mano (vedi sotto) | 18 |
| Reazioni dell'Appendice A (servono nuove sostanze) | 134 |

| Sezione | Reazioni |
|---|---:|
| [1. Sintesi dagli elementi](#1-sintesi-dagli-elementi-161) | 161 |
| [2. Sintesi da composti (addizione)](#2-sintesi-da-composti-addizione-35) | 35 |
| [3. Combustioni](#3-combustioni-137) | 137 |
| [4. Decomposizioni](#4-decomposizioni-90) | 90 |
| [5. Reazioni con l'acqua](#5-reazioni-con-lacqua-78) | 78 |
| [6. Acidi e basi](#6-acidi-e-basi-141) | 141 |
| [7. Ioni in soluzione acquosa](#7-ioni-in-soluzione-acquosa-56) | 56 |
| [8. Precipitazioni (doppio scambio)](#8-precipitazioni-doppio-scambio-52) | 52 |
| [9. Spostamento (scambio semplice)](#9-spostamento-scambio-semplice-82) | 82 |
| [10. Ossidoriduzioni](#10-ossidoriduzioni-102) | 102 |
| [11. Metallurgia](#11-metallurgia-67) | 67 |
| [12. Processi industriali e catalisi (gas di sintesi, C1)](#12-processi-industriali-e-catalisi-gas-di-sintesi-c1-31) | 31 |
| [13. Chimica organica](#13-chimica-organica-168) | 168 |
| [14. Biochimica, fermentazioni e cicli naturali](#14-biochimica-fermentazioni-e-cicli-naturali-15) | 15 |
| [Appendice A — Reazioni che richiedono nuove sostanze](#appendice-a--reazioni-che-richiedono-nuove-sostanze-134) | 134 |

## Come leggere le tabelle

- **Reazione**: formule con i coefficienti interi minimi. Quando più voci hanno la stessa formula (isomeri),
  il nome è tra parentesi, ad esempio C₄H₈ (but-1-ene) e C₄H₈ (2-metilpropene).
- **→** reazione che procede in un solo verso; **⇌** equilibrio: il motore la può usare nei due versi.
- **Condizioni**: che cosa serve perché la reazione avvenga. Nel motore diventa il campo `needs` oppure la richiesta
  di energia. Δ = riscaldamento; innesco = scintilla o fiamma; luce; elettrolisi; cat. = catalizzatore;
  enzima, batteri, lieviti; soluzione = in acqua; concentrato e diluito si riferiscono all'acido.
- **Note**: uso, storia o curiosità. «**già presente** (`id`)» indica una reazione che è già nella libreria
  delle reazioni.
- **ΔH° (kJ)**: entalpia di reazione a 25 °C per l'equazione così come è scritta (valore negativo = esotermica),
  calcolata con le entalpie di formazione della libreria, come fa già `reactionEnthalpy`. La casella è vuota
  quando almeno una specie non ha ΔHf°: oggi ce l'hanno solo 87 delle 445 voci.
- **Specie (id)**: le chiavi da usare nel file dei dati (`h2o`, `el:Na`, `acido-acetico`…).

## Come è stato verificato

- Ogni riga è stata controllata con il bilanciatore del progetto (`balance` e `balanceTable` in
  `src/lab/chem/reactions.js`). Per ogni equazione si conservano tutti gli elementi e la carica, i coefficienti
  sono i minimi interi, ogni id esiste nella libreria e nessuna reazione compare due volte.
- In 18 reazioni il bilanciamento non è unico: ad esempio H₂O₂ + O₃ → H₂O + 2 O₂ si può combinare con la
  decomposizione dell'ozono. Per queste i coefficienti sono scritti a mano: il catalogo riporta quelli della
  reazione reale, e `balance()` da solo non li saprebbe scegliere.
- Le reazioni dell'Appendice A sono verificate con il lettore di formule del progetto (`parseFormula`).
- Gli script usati per le verifiche erano temporanei e non sono nel repository.

## Limiti

- Le equazioni sono bilanci complessivi. Molte reazioni avvengono in più passaggi (combustioni, fermentazioni,
  nitrazioni), e le condizioni indicate sono quelle tipiche, non le uniche.
- I composti dei metalli d e f seguono il modello ionico della libreria, che è una semplificazione.
- Gli stati fisici non sono ripetuti nel catalogo: il motore li prende dalla libreria.
- Non sono incluse le reazioni nucleari (decadimenti, fissione, fusione), che non sono reazioni chimiche, né le
  polimerizzazioni, perché le macromolecole non sono voci della libreria.

## 1. Sintesi dagli elementi (161)

> Elemento + elemento → composto. Gli elementi gassosi biatomici sono le voci della libreria (`h2`, `o2`, `n2`, `f2`, `cl2`, `br2`, `i2`), il fosforo è `p4`; gli altri elementi sono `el:X` nello stato standard (metalli, `el:C` grafite, `el:S` zolfo, `el:Si`, `el:B`…).

### 1.1 Metalli e ossigeno: ossidi (61)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 1 | 4 Li + O₂ → 2 Li₂O | Δ | Fiamma rossa. | −1196 | `4 el:Li + o2 → 2 li2o` |
| 2 | 4 Na + O₂ → 2 Na₂O | ossigeno limitato | **già presente** (`na2o`) | −828 | `4 el:Na + o2 → 2 na2o` |
| 3 | 2 Na + O₂ → Na₂O₂ | Δ, ossigeno in eccesso | Con ossigeno abbondante il sodio forma soprattutto il perossido. |  | `2 el:Na + o2 → na2o2` |
| 4 | 4 K + O₂ → 2 K₂O | ossigeno limitato | Con ossigeno in eccesso si forma il superossido KO₂ (non in libreria). | −723 | `4 el:K + o2 → 2 k2o` |
| 5 | 2 Mg + O₂ → 2 MgO | innesco | **già presente** (`mgo`) | −1203 | `2 el:Mg + o2 → 2 mgo` |
| 6 | 2 Ca + O₂ → 2 CaO | aria | **già presente** (`cao`) | −1270 | `2 el:Ca + o2 → 2 cao` |
| 7 | 4 Al + 3 O₂ → 2 Al₂O₃ | aria | **già presente** (`al2o3`) | −3351 | `4 el:Al + 3 o2 → 2 al2o3` |
| 8 | 4 Sc + 3 O₂ → 2 Sc₂O₃ | Δ |  |  | `4 el:Sc + 3 o2 → 2 sc2o3` |
| 9 | Ti + O₂ → TiO₂ | Δ | Il titanio in polvere brucia con luce bianca. |  | `el:Ti + o2 → tio2` |
| 10 | 4 V + 5 O₂ → 2 V₂O₅ | Δ |  |  | `4 el:V + 5 o2 → 2 v2o5` |
| 11 | 4 Cr + 3 O₂ → 2 Cr₂O₃ | Δ |  |  | `4 el:Cr + 3 o2 → 2 cr2o3` |
| 12 | 4 Fe + 3 O₂ → 2 Fe₂O₃ | aria umida, lenta | Formazione della ruggine (semplificata: la ruggine reale è un ossido idrato). | −1648 | `4 el:Fe + 3 o2 → 2 fe2o3` |
| 13 | 3 Fe + 2 O₂ → Fe₃O₄ | Δ | La lana d'acciaio brucia con scintille formando magnetite. |  | `3 el:Fe + 2 o2 → fe3o4` |
| 14 | 2 Fe + O₂ → 2 FeO | Δ > 570 °C, poco ossigeno | Sotto 570 °C FeO non è stabile. |  | `2 el:Fe + o2 → 2 feo` |
| 15 | 2 Ni + O₂ → 2 NiO | Δ |  |  | `2 el:Ni + o2 → 2 nio` |
| 16 | 2 Cu + O₂ → 2 CuO | Δ | Il rame scaldato all'aria si ricopre di uno strato nero. |  | `2 el:Cu + o2 → 2 cuo` |
| 17 | 4 Cu + O₂ → 2 Cu₂O | Δ > 1000 °C |  |  | `4 el:Cu + o2 → 2 cu2o` |
| 18 | 2 Zn + O₂ → 2 ZnO | Δ | Fiamma verde-azzurra e fumo bianco ("lana filosofica"). |  | `2 el:Zn + o2 → 2 zno` |
| 19 | 4 Ga + 3 O₂ → 2 Ga₂O₃ | Δ |  |  | `4 el:Ga + 3 o2 → 2 ga2o3` |
| 20 | 4 Y + 3 O₂ → 2 Y₂O₃ | Δ |  |  | `4 el:Y + 3 o2 → 2 y2o3` |
| 21 | Zr + O₂ → ZrO₂ | Δ | Lo zirconio in polvere è piroforico. |  | `el:Zr + o2 → zro2` |
| 22 | 4 Nb + 5 O₂ → 2 Nb₂O₅ | Δ |  |  | `4 el:Nb + 5 o2 → 2 nb2o5` |
| 23 | 2 Mo + 3 O₂ → 2 MoO₃ | Δ |  |  | `2 el:Mo + 3 o2 → 2 moo3` |
| 24 | Ru + O₂ → RuO₂ | Δ |  |  | `el:Ru + o2 → ruo2` |
| 25 | 4 In + 3 O₂ → 2 In₂O₃ | Δ |  |  | `4 el:In + 3 o2 → 2 in2o3` |
| 26 | Sn + O₂ → SnO₂ | Δ |  |  | `el:Sn + o2 → sno2` |
| 27 | Hf + O₂ → HfO₂ | Δ |  |  | `el:Hf + o2 → hfo2` |
| 28 | 4 Ta + 5 O₂ → 2 Ta₂O₅ | Δ |  |  | `4 el:Ta + 5 o2 → 2 ta2o5` |
| 29 | 2 W + 3 O₂ → 2 WO₃ | Δ | Per questo i filamenti delle lampadine lavorano nel vuoto o in gas inerte. |  | `2 el:W + 3 o2 → 2 wo3` |
| 30 | 4 Re + 7 O₂ → 2 Re₂O₇ | Δ |  |  | `4 el:Re + 7 o2 → 2 re2o7` |
| 31 | Os + 2 O₂ → OsO₄ | aria (polvere) | Il nome osmio ("odore") viene dall'odore pungente di OsO₄. |  | `el:Os + 2 o2 → oso4` |
| 32 | Ir + O₂ → IrO₂ | Δ |  |  | `el:Ir + o2 → iro2` |
| 33 | 2 Hg + O₂ → 2 HgO | Δ ~350 °C | Esperimento di Lavoisier (1774); sopra ~450 °C la reazione si inverte. |  | `2 el:Hg + o2 → 2 hgo` |
| 34 | 2 Pb + O₂ → 2 PbO | Δ | Litargirio. |  | `2 el:Pb + o2 → 2 pbo` |
| 35 | 4 Bi + 3 O₂ → 2 Bi₂O₃ | Δ |  |  | `4 el:Bi + 3 o2 → 2 bi2o3` |
| 36 | Po + O₂ → PoO₂ | Δ | Radioattivo. |  | `el:Po + o2 → poo2` |
| 37 | 4 La + 3 O₂ → 2 La₂O₃ | aria | I lantanidi si ossidano rapidamente all'aria. |  | `4 el:La + 3 o2 → 2 la2o3` |
| 38 | Ce + O₂ → CeO₂ | aria | Il cerio è piroforico: è nelle pietrine degli accendini (ferrocerio). |  | `el:Ce + o2 → ceo2` |
| 39 | 4 Pr + 3 O₂ → 2 Pr₂O₃ | Δ | All'aria si forma soprattutto Pr₆O₁₁ (non in libreria). |  | `4 el:Pr + 3 o2 → 2 pr2o3` |
| 40 | 4 Nd + 3 O₂ → 2 Nd₂O₃ | aria |  |  | `4 el:Nd + 3 o2 → 2 nd2o3` |
| 41 | 4 Pm + 3 O₂ → 2 Pm₂O₃ | aria | Radioattivo. |  | `4 el:Pm + 3 o2 → 2 pm2o3` |
| 42 | 4 Sm + 3 O₂ → 2 Sm₂O₃ | Δ |  |  | `4 el:Sm + 3 o2 → 2 sm2o3` |
| 43 | 4 Eu + 3 O₂ → 2 Eu₂O₃ | aria | Il lantanide più reattivo. |  | `4 el:Eu + 3 o2 → 2 eu2o3` |
| 44 | 4 Gd + 3 O₂ → 2 Gd₂O₃ | Δ |  |  | `4 el:Gd + 3 o2 → 2 gd2o3` |
| 45 | 4 Dy + 3 O₂ → 2 Dy₂O₃ | Δ |  |  | `4 el:Dy + 3 o2 → 2 dy2o3` |
| 46 | 4 Ho + 3 O₂ → 2 Ho₂O₃ | Δ |  |  | `4 el:Ho + 3 o2 → 2 ho2o3` |
| 47 | 4 Er + 3 O₂ → 2 Er₂O₃ | Δ |  |  | `4 el:Er + 3 o2 → 2 er2o3` |
| 48 | 4 Tm + 3 O₂ → 2 Tm₂O₃ | Δ |  |  | `4 el:Tm + 3 o2 → 2 tm2o3` |
| 49 | 4 Yb + 3 O₂ → 2 Yb₂O₃ | Δ |  |  | `4 el:Yb + 3 o2 → 2 yb2o3` |
| 50 | 4 Lu + 3 O₂ → 2 Lu₂O₃ | Δ |  |  | `4 el:Lu + 3 o2 → 2 lu2o3` |
| 51 | 4 Ac + 3 O₂ → 2 Ac₂O₃ | Δ | Radioattivo. |  | `4 el:Ac + 3 o2 → 2 ac2o3` |
| 52 | Th + O₂ → ThO₂ | Δ | Il torio in polvere è piroforico. |  | `el:Th + o2 → tho2` |
| 53 | 4 Pa + 5 O₂ → 2 Pa₂O₅ | Δ | Radioattivo. |  | `4 el:Pa + 5 o2 → 2 pa2o5` |
| 54 | U + O₂ → UO₂ | Δ | All'aria si forma anche U₃O₈ (non in libreria). |  | `el:U + o2 → uo2` |
| 55 | Np + O₂ → NpO₂ | Δ | Radioattivo. |  | `el:Np + o2 → npo2` |
| 56 | Pu + O₂ → PuO₂ | aria | Il plutonio si ossida all'aria; in polvere è piroforico. |  | `el:Pu + o2 → puo2` |
| 57 | Am + O₂ → AmO₂ | Δ | Radioattivo. |  | `el:Am + o2 → amo2` |
| 58 | 4 Cm + 3 O₂ → 2 Cm₂O₃ | Δ | Radioattivo; si forma anche CmO₂. |  | `4 el:Cm + 3 o2 → 2 cm2o3` |
| 59 | Bk + O₂ → BkO₂ | Δ | Radioattivo. |  | `el:Bk + o2 → bko2` |
| 60 | 4 Cf + 3 O₂ → 2 Cf₂O₃ | Δ | Radioattivo. |  | `4 el:Cf + 3 o2 → 2 cf2o3` |
| 61 | 4 Es + 3 O₂ → 2 Es₂O₃ | Δ | Radioattivo; ottenuto in quantità di microgrammi. |  | `4 el:Es + 3 o2 → 2 es2o3` |

### 1.2 Metalli e alogeni: alogenuri (39)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 62 | 2 Li + Cl₂ → 2 LiCl |  |  | −817 | `2 el:Li + cl2 → 2 licl` |
| 63 | 2 Li + F₂ → 2 LiF |  |  | −1232 | `2 el:Li + f2 → 2 lif` |
| 64 | 2 Na + Cl₂ → 2 NaCl |  | **già presente** (`nacl`) | −822 | `2 el:Na + cl2 → 2 nacl` |
| 65 | 2 Na + F₂ → 2 NaF |  |  | −1153 | `2 el:Na + f2 → 2 naf` |
| 66 | 2 Na + Br₂ → 2 NaBr |  |  |  | `2 el:Na + br2 → 2 nabr` |
| 67 | 2 Na + I₂ → 2 NaI | Δ |  |  | `2 el:Na + i2 → 2 nai` |
| 68 | 2 K + Cl₂ → 2 KCl |  | Reazione violenta. | −873 | `2 el:K + cl2 → 2 kcl` |
| 69 | 2 K + F₂ → 2 KF |  |  |  | `2 el:K + f2 → 2 kf` |
| 70 | 2 K + Br₂ → 2 KBr |  | Esplosiva con il bromo liquido. | −788 | `2 el:K + br2 → 2 kbr` |
| 71 | 2 K + I₂ → 2 KI | Δ |  | −656 | `2 el:K + i2 → 2 ki` |
| 72 | 2 Rb + Cl₂ → 2 RbCl |  |  |  | `2 el:Rb + cl2 → 2 rbcl` |
| 73 | 2 Cs + Cl₂ → 2 CsCl |  |  |  | `2 el:Cs + cl2 → 2 cscl` |
| 74 | Be + Cl₂ → BeCl₂ | Δ |  | −490 | `el:Be + cl2 → becl2` |
| 75 | Mg + Cl₂ → MgCl₂ | Δ |  | −641 | `el:Mg + cl2 → mgcl2` |
| 76 | Ca + Cl₂ → CaCl₂ | Δ |  | −795 | `el:Ca + cl2 → cacl2` |
| 77 | Ca + F₂ → CaF₂ |  |  | −1228 | `el:Ca + f2 → caf2` |
| 78 | Sr + Cl₂ → SrCl₂ | Δ |  |  | `el:Sr + cl2 → srcl2` |
| 79 | Ba + Cl₂ → BaCl₂ | Δ |  |  | `el:Ba + cl2 → bacl2` |
| 80 | Ra + Cl₂ → RaCl₂ | Δ | Radioattivo. |  | `el:Ra + cl2 → racl2` |
| 81 | 2 Al + 3 Cl₂ → 2 AlCl₃ |  | Il foglio di alluminio si incendia nel cloro. |  | `2 el:Al + 3 cl2 → 2 alcl3` |
| 82 | Ti + 2 Cl₂ → TiCl₄ | Δ |  |  | `el:Ti + 2 cl2 → ticl4` |
| 83 | 2 Fe + 3 Cl₂ → 2 FeCl₃ | Δ | Con il cloro il ferro forma sempre il cloruro di ferro(III). |  | `2 el:Fe + 3 cl2 → 2 fecl3` |
| 84 | Co + Cl₂ → CoCl₂ | Δ |  |  | `el:Co + cl2 → cocl2` |
| 85 | Cu + Cl₂ → CuCl₂ | Δ |  |  | `el:Cu + cl2 → cucl2` |
| 86 | 2 Cu + Cl₂ → 2 CuCl | Δ, rame in eccesso |  |  | `2 el:Cu + cl2 → 2 cucl` |
| 87 | Zn + Cl₂ → ZnCl₂ | Δ |  |  | `el:Zn + cl2 → zncl2` |
| 88 | Ge + 2 Cl₂ → GeCl₄ | Δ |  |  | `el:Ge + 2 cl2 → gecl4` |
| 89 | 2 Rh + 3 Cl₂ → 2 RhCl₃ | Δ ~300 °C |  |  | `2 el:Rh + 3 cl2 → 2 rhcl3` |
| 90 | Pd + Cl₂ → PdCl₂ | Δ |  |  | `el:Pd + cl2 → pdcl2` |
| 91 | 2 Ag + Cl₂ → 2 AgCl | Δ |  |  | `2 el:Ag + cl2 → 2 agcl` |
| 92 | 2 Ag + Br₂ → 2 AgBr |  |  |  | `2 el:Ag + br2 → 2 agbr` |
| 93 | Sn + 2 Cl₂ → SnCl₄ |  |  |  | `el:Sn + 2 cl2 → sncl4` |
| 94 | 2 Sb + 5 Cl₂ → 2 SbCl₅ | cloro in eccesso |  |  | `2 el:Sb + 5 cl2 → 2 sbcl5` |
| 95 | 2 Tb + 3 Cl₂ → 2 TbCl₃ | Δ |  |  | `2 el:Tb + 3 cl2 → 2 tbcl3` |
| 96 | 2 Au + 3 Cl₂ → 2 AuCl₃ | Δ ~200 °C |  |  | `2 el:Au + 3 cl2 → 2 aucl3` |
| 97 | Hg + Cl₂ → HgCl₂ | Δ |  |  | `el:Hg + cl2 → hgcl2` |
| 98 | 2 Hg + Cl₂ → Hg₂Cl₂ | mercurio in eccesso |  |  | `2 el:Hg + cl2 → hg2cl2` |
| 99 | Pb + I₂ → PbI₂ | Δ |  |  | `el:Pb + i2 → pbi2` |
| 100 | U + 3 F₂ → UF₆ | Δ | UF₆ sublima a 56 °C: si usa per arricchire l'uranio. |  | `el:U + 3 f2 → uf6` |

### 1.3 Metalli con zolfo, azoto, idrogeno e carbonio (14)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 101 | 2 Na + S → Na₂S | Δ |  |  | `2 el:Na + el:S → na2s` |
| 102 | Zn + S → ZnS | innesco | La miscela di polveri reagisce in modo violento. |  | `el:Zn + el:S → zns` |
| 103 | Fe + 2 S → FeS₂ | Δ, zolfo in eccesso | Il classico solfuro FeS non è in libreria: con eccesso di zolfo si ottiene la pirite. |  | `el:Fe + 2 el:S → fes2` |
| 104 | 2 Ag + S → Ag₂S |  | Annerimento dell'argento. |  | `2 el:Ag + el:S → ag2s` |
| 105 | Hg + S → HgS | temperatura ambiente | Lo zolfo in polvere si usa per raccogliere il mercurio versato. |  | `el:Hg + el:S → hgs` |
| 106 | Pb + S → PbS | Δ |  |  | `el:Pb + el:S → pbs` |
| 107 | Cd + S → CdS | Δ | Pigmento giallo di cadmio. |  | `el:Cd + el:S → cds` |
| 108 | Mo + 2 S → MoS₂ | Δ |  |  | `el:Mo + 2 el:S → mos2` |
| 109 | 6 Li + N₂ → 2 Li₃N | temperatura ambiente | L'unico metallo alcalino che reagisce con l'azoto a freddo. |  | `6 el:Li + n2 → 2 li3n` |
| 110 | 3 Mg + N₂ → Mg₃N₂ | Δ | Si forma anche quando il magnesio brucia all'aria. |  | `3 el:Mg + n2 → mg3n2` |
| 111 | 2 Li + H₂ → 2 LiH | Δ ~700 °C |  |  | `2 el:Li + h2 → 2 lih` |
| 112 | 2 Na + H₂ → 2 NaH | Δ ~300 °C |  |  | `2 el:Na + h2 → 2 nah` |
| 113 | Ca + H₂ → CaH₂ | Δ |  |  | `el:Ca + h2 → cah2` |
| 114 | Ca + 2 C → CaC₂ | Δ > 2000 °C |  |  | `el:Ca + 2 el:C → cac2` |

### 1.4 Non metalli e ossigeno (7)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 115 | 2 H₂ + O₂ → 2 H₂O | scintilla | **già presente** (`acqua`) | −572 | `2 h2 + o2 → 2 h2o` |
| 116 | C + O₂ → CO₂ | innesco | **già presente** (`co2`) | −394 | `el:C + o2 → co2` |
| 117 | 2 C + O₂ → 2 CO | ossigeno scarso | **già presente** (`co`) | −221 | `2 el:C + o2 → 2 co` |
| 118 | S + O₂ → SO₂ | innesco | **già presente** (`so2`) | −297 | `el:S + o2 → so2` |
| 119 | S₈ + 8 O₂ → 8 SO₂ | innesco | La stessa combustione scritta con la molecola S₈ (zolfo rombico). |  | `s8 + 8 o2 → 8 so2` |
| 120 | P₄ + 5 O₂ → P₄O₁₀ | spontanea all'aria | Il fosforo bianco si incendia da solo; per questo si conserva sott'acqua. |  | `p4 + 5 o2 → p4o10` |
| 121 | N₂ + O₂ → 2 NO | Δ > 2000 °C, fulmini | **già presente** (`no`). Fortemente endotermica. | 183 | `n2 + o2 → 2 no` |

### 1.5 Idrogeno e non metalli (9)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 122 | H₂ + F₂ → 2 HF | anche al buio | **già presente** (`hf`) | −547 | `h2 + f2 → 2 hf` |
| 123 | H₂ + Cl₂ → 2 HCl | luce o scintilla | **già presente** (`hcl`) | −185 | `h2 + cl2 → 2 hcl` |
| 124 | H₂ + Br₂ → 2 HBr | Δ o luce |  | −73 | `h2 + br2 → 2 hbr` |
| 125 | H₂ + I₂ ⇌ 2 HI | Δ | Classico esempio di equilibrio chimico (Bodenstein, 1894). | 53 | `h2 + i2 ⇌ 2 hi` |
| 126 | H₂ + S → H₂S | Δ |  | −21 | `h2 + el:S → h2s` |
| 127 | H₂ + Se → H₂Se | Δ > 350 °C |  |  | `h2 + el:Se → h2se` |
| 128 | N₂ + 3 H₂ → 2 NH₃ | cat. Fe, 450 °C, 200 atm | **già presente** (`haber`) | −92 | `n2 + 3 h2 → 2 nh3` |
| 129 | C + 2 H₂ → CH₄ | Δ, cat. Ni |  | −75 | `el:C + 2 h2 → ch4` |
| 130 | 2 C + H₂ → C₂H₂ | arco elettrico > 3000 °C |  | 227 | `2 el:C + h2 → c2h2` |

### 1.6 Alogeni con non metalli e interalogeni (27)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 131 | 2 B + 3 Cl₂ → 2 BCl₃ | Δ |  |  | `2 el:B + 3 cl2 → 2 bcl3` |
| 132 | 2 B + 3 Br₂ → 2 BBr₃ | Δ |  |  | `2 el:B + 3 br2 → 2 bbr3` |
| 133 | 2 B + 3 F₂ → 2 BF₃ |  |  | −2272 | `2 el:B + 3 f2 → 2 bf3` |
| 134 | Si + 2 Cl₂ → SiCl₄ | Δ |  |  | `el:Si + 2 cl2 → sicl4` |
| 135 | Si + 2 F₂ → SiF₄ | spontanea | Il silicio brucia nel fluoro. |  | `el:Si + 2 f2 → sif4` |
| 136 | C + 2 F₂ → CF₄ |  | Il carbonio brucia nel fluoro. |  | `el:C + 2 f2 → cf4` |
| 137 | P₄ + 6 Cl₂ → 4 PCl₃ | cloro limitato |  |  | `p4 + 6 cl2 → 4 pcl3` |
| 138 | P₄ + 10 Cl₂ → 4 PCl₅ | cloro in eccesso |  |  | `p4 + 10 cl2 → 4 pcl5` |
| 139 | P₄ + 6 Br₂ → 4 PBr₃ |  |  |  | `p4 + 6 br2 → 4 pbr3` |
| 140 | P₄ + 10 F₂ → 4 PF₅ |  |  |  | `p4 + 10 f2 → 4 pf5` |
| 141 | 2 As + 3 Cl₂ → 2 AsCl₃ |  |  |  | `2 el:As + 3 cl2 → 2 ascl3` |
| 142 | 2 As + 5 F₂ → 2 AsF₅ |  |  |  | `2 el:As + 5 f2 → 2 asf5` |
| 143 | 2 S + Cl₂ → S₂Cl₂ | zolfo fuso | Usato per vulcanizzare la gomma. |  | `2 el:S + cl2 → s2cl2` |
| 144 | S + Cl₂ → SCl₂ | cloro in eccesso |  |  | `el:S + cl2 → scl2` |
| 145 | S + 3 F₂ → SF₆ |  | Lo zolfo brucia nel fluoro. | −1220 | `el:S + 3 f2 → sf6` |
| 146 | Se + 3 F₂ → SeF₆ |  |  |  | `el:Se + 3 f2 → sef6` |
| 147 | Te + 3 F₂ → TeF₆ |  |  |  | `el:Te + 3 f2 → tef6` |
| 148 | Cl₂ + F₂ → 2 ClF | Δ ~250 °C |  |  | `cl2 + f2 → 2 clf` |
| 149 | Cl₂ + 3 F₂ → 2 ClF₃ | Δ, fluoro in eccesso | ClF₃ incendia anche il vetro e il cemento. | −326 | `cl2 + 3 f2 → 2 clf3` |
| 150 | Cl₂ + 5 F₂ → 2 ClF₅ | Δ, pressione |  |  | `cl2 + 5 f2 → 2 clf5` |
| 151 | Br₂ + 3 F₂ → 2 BrF₃ |  |  |  | `br2 + 3 f2 → 2 brf3` |
| 152 | Br₂ + 5 F₂ → 2 BrF₅ | fluoro in eccesso |  |  | `br2 + 5 f2 → 2 brf5` |
| 153 | I₂ + 5 F₂ → 2 IF₅ |  |  |  | `i2 + 5 f2 → 2 if5` |
| 154 | I₂ + 7 F₂ → 2 IF₇ | Δ ~250 °C |  |  | `i2 + 7 f2 → 2 if7` |
| 155 | I₂ + Cl₂ → 2 ICl |  |  |  | `i2 + cl2 → 2 icl` |
| 156 | I₂ + Br₂ → 2 IBr |  |  |  | `i2 + br2 → 2 ibr` |
| 157 | Br₂ + Cl₂ ⇌ 2 BrCl |  | Equilibrio: BrCl è in parte dissociato. |  | `br2 + cl2 ⇌ 2 brcl` |

### 1.7 Gas nobili (4)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 158 | Xe + F₂ → XeF₂ | luce UV o Δ | Bartlett (1962): i gas nobili non sono del tutto inerti. |  | `el:Xe + f2 → xef2` |
| 159 | Xe + 2 F₂ → XeF₄ | Δ 400 °C, Xe:F₂ = 1:5 |  |  | `el:Xe + 2 f2 → xef4` |
| 160 | Xe + 3 F₂ → XeF₆ | Δ 300 °C, alta pressione di F₂ |  |  | `el:Xe + 3 f2 → xef6` |
| 161 | Kr + F₂ → KrF₂ | scarica elettrica a −196 °C |  |  | `el:Kr + f2 → krf2` |

## 2. Sintesi da composti (addizione) (35)

> Una sostanza della libreria si combina con un'altra (o con un elemento) per dare un solo prodotto, o cambia stato di ossidazione per addizione.

### 2.1 Ossidazioni per addizione di ossigeno (9)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 162 | 2 CO + O₂ → 2 CO₂ | cat. (marmitta) | **già presente** (`co-co2`) | −566 | `2 co + o2 → 2 co2` |
| 163 | 2 SO₂ + O₂ → 2 SO₃ | cat. V₂O₅, 450 °C | **già presente** (`so3`). Processo a contatto. | −288 | `2 so2 + o2 → 2 so3` |
| 164 | 2 NO + O₂ → 2 NO₂ | spontanea | **già presente** (`no2`) | −116 | `2 no + o2 → 2 no2` |
| 165 | 3 O₂ → 2 O₃ | luce UV o scarica elettrica | **già presente** (`ozono`) | 285 | `3 o2 → 2 o3` |
| 166 | 2 PCl₃ + O₂ → 2 POCl₃ |  | Produzione industriale dell'ossicloruro di fosforo. |  | `2 pcl3 + o2 → 2 pocl3` |
| 167 | 2 Na₂SO₃ + O₂ → 2 Na₂SO₄ | aria, lenta | Il solfito è un antiossidante (E221) perché consuma ossigeno. |  | `2 na2so3 + o2 → 2 na2so4` |
| 168 | 4 FeO + O₂ → 2 Fe₂O₃ | Δ |  |  | `4 feo + o2 → 2 fe2o3` |
| 169 | 4 Fe₃O₄ + O₂ → 6 Fe₂O₃ | Δ |  |  | `4 fe3o4 + o2 → 6 fe2o3` |
| 170 | 2 Cu₂O + O₂ → 4 CuO | Δ |  |  | `2 cu2o + o2 → 4 cuo` |

### 2.2 Addizione di alogeni (17)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 171 | PCl₃ + Cl₂ → PCl₅ |  | **già presente** (`pcl5`) | −124 | `pcl3 + cl2 → pcl5` |
| 172 | CO + Cl₂ → COCl₂ | cat. carbone attivo | Il fosgene è un intermedio per poliuretani e policarbonati (ed è stato un gas di guerra). |  | `co + cl2 → fosgene` |
| 173 | SO₂ + Cl₂ ⇌ SO₂Cl₂ | cat. carbone attivo |  |  | `so2 + cl2 ⇌ so2cl2` |
| 174 | 2 NO + Cl₂ → 2 NOCl |  |  |  | `2 no + cl2 → 2 nocl` |
| 175 | 2 FeCl₂ + Cl₂ → 2 FeCl₃ |  |  |  | `2 fecl2 + cl2 → 2 fecl3` |
| 176 | SnCl₂ + Cl₂ → SnCl₄ |  |  |  | `sncl2 + cl2 → sncl4` |
| 177 | 2 CuCl + Cl₂ → 2 CuCl₂ |  |  |  | `2 cucl + cl2 → 2 cucl2` |
| 178 | Hg₂Cl₂ + Cl₂ → 2 HgCl₂ |  |  |  | `hg2cl2 + cl2 → 2 hgcl2` |
| 179 | S₂Cl₂ + Cl₂ → 2 SCl₂ | cat. FeCl₃ |  |  | `s2cl2 + cl2 → 2 scl2` |
| 180 | PF₃ + F₂ → PF₅ |  |  |  | `pf3 + f2 → pf5` |
| 181 | SF₄ + F₂ → SF₆ |  |  | −457 | `sf4 + f2 → sf6` |
| 182 | XeF₂ + F₂ → XeF₄ | Δ |  |  | `xef2 + f2 → xef4` |
| 183 | XeF₄ + F₂ → XeF₆ | Δ, pressione |  |  | `xef4 + f2 → xef6` |
| 184 | ClF + F₂ → ClF₃ | Δ |  |  | `clf + f2 → clf3` |
| 185 | ClF₃ + F₂ → ClF₅ | Δ, pressione |  |  | `clf3 + f2 → clf5` |
| 186 | BrF₃ + F₂ → BrF₅ | Δ |  |  | `brf3 + f2 → brf5` |
| 187 | IF₅ + F₂ → IF₇ | Δ |  |  | `if5 + f2 → if7` |

### 2.3 Comproporzioni e altre addizioni (9)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 188 | HgCl₂ + Hg → Hg₂Cl₂ | Δ | Preparazione del calomelano. |  | `hgcl2 + el:Hg → hg2cl2` |
| 189 | CuCl₂ + Cu → 2 CuCl | Δ, HCl concentrato |  |  | `cucl2 + el:Cu → 2 cucl` |
| 190 | SnCl₄ + Sn → 2 SnCl₂ |  |  |  | `sncl4 + el:Sn → 2 sncl2` |
| 191 | 2 FeCl₃ + Fe → 3 FeCl₂ | soluzione |  |  | `2 fecl3 + el:Fe → 3 fecl2` |
| 192 | CO + S → COS | Δ |  |  | `co + el:S → cos` |
| 193 | CO + 2 H₂ → CH₃OH | cat. Cu/ZnO, 250 °C, 50-100 atm | **già presente** (`metanolo`) | −129 | `co + 2 h2 → metanolo` |
| 194 | Na₂SO₃ + S → Na₂S₂O₃ | ebollizione in soluzione | Produzione del tiosolfato ("iposolfito" dei fotografi). |  | `na2so3 + el:S → na2s2o3` |
| 195 | KCN + S → KSCN | fusione |  |  | `kcn + el:S → kscn` |
| 196 | 2 NO₂ ⇌ N₂O₄ | raffreddamento | Il gas bruno diventa incolore a freddo. |  | `2 no2 ⇌ n2o4` |

## 3. Combustioni (137)

> Combustione completa in ossigeno: il carbonio diventa CO₂, l'idrogeno H₂O, l'azoto N₂ (con poca formazione di NOx), lo zolfo SO₂, il cloro HCl. Tutte richiedono un innesco (scintilla o fiamma) e sono esotermiche. «Respirazione cellulare» è la combustione del glucosio controllata dagli enzimi.

### 3.1 Combustibili inorganici (11)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 197 | 4 NH₃ + 3 O₂ → 2 N₂ + 6 H₂O | innesco, O₂ puro | L'ammoniaca è studiata come combustibile senza carbonio (navi). | −1531 | `4 nh3 + 3 o2 → 2 n2 + 6 h2o` |
| 198 | 4 NH₃ + 5 O₂ → 4 NO + 6 H₂O | cat. Pt/Rh, 900 °C | **già presente** (`ostwald`). Processo Ostwald, primo passaggio. | −1166 | `4 nh3 + 5 o2 → 4 no + 6 h2o` |
| 199 | N₂H₄ + O₂ → N₂ + 2 H₂O | innesco |  | −622 | `n2h4 + o2 → n2 + 2 h2o` |
| 200 | 2 H₂S + 3 O₂ → 2 SO₂ + 2 H₂O | innesco | **già presente** (`h2s`) | −1124 | `2 h2s + 3 o2 → 2 so2 + 2 h2o` |
| 201 | 2 H₂S + O₂ → 2 S + 2 H₂O | ossigeno scarso | Ossidazione parziale: si deposita zolfo. | −530 | `2 h2s + o2 → 2 el:S + 2 h2o` |
| 202 | CS₂ + 3 O₂ → CO₂ + 2 SO₂ | Δ ~90 °C | Si accende anche a contatto con un tubo di vapore. |  | `cs2 + 3 o2 → co2 + 2 so2` |
| 203 | 2 COS + 3 O₂ → 2 CO₂ + 2 SO₂ | innesco |  |  | `2 cos + 3 o2 → 2 co2 + 2 so2` |
| 204 | 4 HCN + 5 O₂ → 4 CO₂ + 2 H₂O + 2 N₂ | innesco |  | −2581 | `4 hcn + 5 o2 → 4 co2 + 2 h2o + 2 n2` |
| 205 | (CN)₂ + 2 O₂ → 2 CO₂ + N₂ | innesco | Fiamma a circa 4500 °C, tra le più calde conosciute. |  | `cianogeno + 2 o2 → 2 co2 + n2` |
| 206 | 4 PH₃ + 8 O₂ → P₄O₁₀ + 6 H₂O | spontanea | Con la difosfina, all'origine dei "fuochi fatui". |  | `4 ph3 + 8 o2 → p4o10 + 6 h2o` |
| 207 | C₃O₂ + 2 O₂ → 3 CO₂ | innesco |  |  | `c3o2 + 2 o2 → 3 co2` |

### 3.2 Idrocarburi (36)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 208 | CH₄ + 2 O₂ → CO₂ + 2 H₂O | innesco | **già presente** (`metano`). Fornelli e caldaie a gas. | −890 | `ch4 + 2 o2 → co2 + 2 h2o` |
| 209 | 2 C₂H₆ + 7 O₂ → 4 CO₂ + 6 H₂O | innesco | **già presente** (`etano`) | −3121 | `2 c2h6 + 7 o2 → 4 co2 + 6 h2o` |
| 210 | C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O | innesco | **già presente** (`propano`). GPL. | −2219 | `c3h8 + 5 o2 → 3 co2 + 4 h2o` |
| 211 | 2 C₄H₁₀ + 13 O₂ → 8 CO₂ + 10 H₂O | innesco | **già presente** (`butano`). Accendini. | −5755 | `2 butano + 13 o2 → 8 co2 + 10 h2o` |
| 212 | 2 CH(CH₃)₃ + 13 O₂ → 8 CO₂ + 10 H₂O | innesco | Bombolette e frigoriferi (R600a). | −5738 | `2 isobutano + 13 o2 → 8 co2 + 10 h2o` |
| 213 | C₂H₄ + 3 O₂ → 2 CO₂ + 2 H₂O | innesco | **già presente** (`etilene`) | −1411 | `c2h4 + 3 o2 → 2 co2 + 2 h2o` |
| 214 | 2 C₂H₂ + 5 O₂ → 4 CO₂ + 2 H₂O | innesco | **già presente** (`acetilene`). Fiamma ossiacetilenica > 3000 °C. | −2600 | `2 c2h2 + 5 o2 → 4 co2 + 2 h2o` |
| 215 | 2 C₆H₆ + 15 O₂ → 12 CO₂ + 6 H₂O | innesco | **già presente** (`benzene`). Fiamma fuligginosa. | −6535 | `2 benzene + 15 o2 → 12 co2 + 6 h2o` |
| 216 | C₆H₁₂ + 9 O₂ → 6 CO₂ + 6 H₂O | innesco |  | −3920 | `cicloesano + 9 o2 → 6 co2 + 6 h2o` |
| 217 | C₅H₁₂ + 8 O₂ → 5 CO₂ + 6 H₂O | innesco |  |  | `pentano + 8 o2 → 5 co2 + 6 h2o` |
| 218 | (CH₃)₂CHCH₂CH₃ + 8 O₂ → 5 CO₂ + 6 H₂O | innesco |  |  | `isopentano + 8 o2 → 5 co2 + 6 h2o` |
| 219 | C(CH₃)₄ + 8 O₂ → 5 CO₂ + 6 H₂O | innesco |  |  | `neopentano + 8 o2 → 5 co2 + 6 h2o` |
| 220 | 2 C₆H₁₄ + 19 O₂ → 12 CO₂ + 14 H₂O | innesco |  |  | `2 esano + 19 o2 → 12 co2 + 14 h2o` |
| 221 | C₇H₁₆ + 11 O₂ → 7 CO₂ + 8 H₂O | innesco | Riferimento 0 del numero di ottano (detona facilmente). |  | `eptano + 11 o2 → 7 co2 + 8 h2o` |
| 222 | 2 C₈H₁₈ (ottano) + 25 O₂ → 16 CO₂ + 18 H₂O | innesco | Benzina. |  | `2 ottano + 25 o2 → 16 co2 + 18 h2o` |
| 223 | 2 C₈H₁₈ (2,2,4-Trimetilpentano) + 25 O₂ → 16 CO₂ + 18 H₂O | innesco | Riferimento 100 del numero di ottano. |  | `2 isoottano + 25 o2 → 16 co2 + 18 h2o` |
| 224 | C₉H₂₀ + 14 O₂ → 9 CO₂ + 10 H₂O | innesco |  |  | `nonano + 14 o2 → 9 co2 + 10 h2o` |
| 225 | 2 C₁₀H₂₂ + 31 O₂ → 20 CO₂ + 22 H₂O | innesco | Cherosene. |  | `2 decano + 31 o2 → 20 co2 + 22 h2o` |
| 226 | 2 C₃H₆ (ciclopropano) + 9 O₂ → 6 CO₂ + 6 H₂O | innesco | Era usato come anestetico, ma è esplosivo. |  | `2 ciclopropano + 9 o2 → 6 co2 + 6 h2o` |
| 227 | C₄H₈ (ciclobutano) + 6 O₂ → 4 CO₂ + 4 H₂O | innesco |  |  | `ciclobutano + 6 o2 → 4 co2 + 4 h2o` |
| 228 | 2 C₅H₁₀ + 15 O₂ → 10 CO₂ + 10 H₂O | innesco |  |  | `2 ciclopentano + 15 o2 → 10 co2 + 10 h2o` |
| 229 | 2 C₃H₆ (propene) + 9 O₂ → 6 CO₂ + 6 H₂O | innesco |  |  | `2 propene + 9 o2 → 6 co2 + 6 h2o` |
| 230 | C₄H₈ (but-1-ene) + 6 O₂ → 4 CO₂ + 4 H₂O | innesco |  |  | `but-1-ene + 6 o2 → 4 co2 + 4 h2o` |
| 231 | C₄H₈ (but-2-ene) + 6 O₂ → 4 CO₂ + 4 H₂O | innesco |  |  | `but-2-ene + 6 o2 → 4 co2 + 4 h2o` |
| 232 | C₄H₈ (2-Metilpropene) + 6 O₂ → 4 CO₂ + 4 H₂O | innesco |  |  | `isobutene + 6 o2 → 4 co2 + 4 h2o` |
| 233 | 2 C₄H₆ + 11 O₂ → 8 CO₂ + 6 H₂O | innesco |  |  | `2 butadiene + 11 o2 → 8 co2 + 6 h2o` |
| 234 | C₅H₈ + 7 O₂ → 5 CO₂ + 4 H₂O | innesco |  |  | `isoprene + 7 o2 → 5 co2 + 4 h2o` |
| 235 | 2 C₆H₁₀ + 17 O₂ → 12 CO₂ + 10 H₂O | innesco |  |  | `2 cicloesene + 17 o2 → 12 co2 + 10 h2o` |
| 236 | C₃H₄ + 4 O₂ → 3 CO₂ + 2 H₂O | innesco |  |  | `propino + 4 o2 → 3 co2 + 2 h2o` |
| 237 | C₆H₅CH₃ + 9 O₂ → 7 CO₂ + 4 H₂O | innesco |  |  | `toluene + 9 o2 → 7 co2 + 4 h2o` |
| 238 | 2 C₈H₁₀ (1,2-Dimetilbenzene) + 21 O₂ → 16 CO₂ + 10 H₂O | innesco |  |  | `2 o-xilene + 21 o2 → 16 co2 + 10 h2o` |
| 239 | 2 C₈H₁₀ (1,3-Dimetilbenzene) + 21 O₂ → 16 CO₂ + 10 H₂O | innesco |  |  | `2 m-xilene + 21 o2 → 16 co2 + 10 h2o` |
| 240 | 2 C₈H₁₀ (1,4-Dimetilbenzene) + 21 O₂ → 16 CO₂ + 10 H₂O | innesco |  |  | `2 p-xilene + 21 o2 → 16 co2 + 10 h2o` |
| 241 | C₈H₈ + 10 O₂ → 8 CO₂ + 4 H₂O | innesco |  |  | `stirene + 10 o2 → 8 co2 + 4 h2o` |
| 242 | C₁₀H₈ + 12 O₂ → 10 CO₂ + 4 H₂O | innesco | Naftalina. |  | `naftalene + 12 o2 → 10 co2 + 4 h2o` |
| 243 | 2 C₁₄H₁₀ + 33 O₂ → 28 CO₂ + 10 H₂O | innesco |  |  | `2 antracene + 33 o2 → 28 co2 + 10 h2o` |

### 3.3 Combustioni incomplete (6)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 244 | 2 CH₄ + 3 O₂ → 2 CO + 4 H₂O | ossigeno insufficiente | Pericolo di intossicazione da CO con caldaie mal regolate. | −1215 | `2 ch4 + 3 o2 → 2 co + 4 h2o` |
| 245 | CH₄ + O₂ → C + 2 H₂O | ossigeno molto scarso | Nerofumo. | −497 | `ch4 + o2 → el:C + 2 h2o` |
| 246 | 2 C₃H₈ + 7 O₂ → 6 CO + 8 H₂O | ossigeno insufficiente |  | −2740 | `2 c3h8 + 7 o2 → 6 co + 8 h2o` |
| 247 | 2 C₈H₁₈ (ottano) + 17 O₂ → 16 CO + 18 H₂O | ossigeno insufficiente | Monossido di carbonio nei gas di scarico. |  | `2 ottano + 17 o2 → 16 co + 18 h2o` |
| 248 | 2 C₂H₂ + O₂ → 4 C + 2 H₂O | senz'aria aggiunta | Fiamma gialla fuligginosa dell'acetilene. | −1026 | `2 c2h2 + o2 → 4 el:C + 2 h2o` |
| 249 | 2 C₆H₆ + 9 O₂ → 12 CO + 6 H₂O | ossigeno insufficiente |  | −3139 | `2 benzene + 9 o2 → 12 co + 6 h2o` |

### 3.4 Alcoli, eteri, aldeidi, chetoni, acidi ed esteri (30)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 250 | 2 CH₃OH + 3 O₂ → 2 CO₂ + 4 H₂O | innesco | **già presente** (`metanolo-c`). Fiamma quasi invisibile. | −1452 | `2 metanolo + 3 o2 → 2 co2 + 4 h2o` |
| 251 | C₂H₅OH + 3 O₂ → 2 CO₂ + 3 H₂O | innesco | **già presente** (`etanolo`). Bioetanolo. | −1367 | `etanolo + 3 o2 → 2 co2 + 3 h2o` |
| 252 | 2 CH₃CH₂CH₂OH + 9 O₂ → 6 CO₂ + 8 H₂O | innesco |  |  | `2 propan-1-olo + 9 o2 → 6 co2 + 8 h2o` |
| 253 | 2 (CH₃)₂CHOH + 9 O₂ → 6 CO₂ + 8 H₂O | innesco |  |  | `2 isopropanolo + 9 o2 → 6 co2 + 8 h2o` |
| 254 | C₄H₁₀O + 6 O₂ → 4 CO₂ + 5 H₂O | innesco |  |  | `butan-1-olo + 6 o2 → 4 co2 + 5 h2o` |
| 255 | 2 HOCH₂CH₂OH + 5 O₂ → 4 CO₂ + 6 H₂O | innesco |  |  | `2 glicole-etilenico + 5 o2 → 4 co2 + 6 h2o` |
| 256 | 2 C₃H₈O₃ + 7 O₂ → 6 CO₂ + 8 H₂O | innesco |  |  | `2 glicerolo + 7 o2 → 6 co2 + 8 h2o` |
| 257 | C₆H₅OH + 7 O₂ → 6 CO₂ + 3 H₂O | innesco |  |  | `fenolo + 7 o2 → 6 co2 + 3 h2o` |
| 258 | CH₃OCH₃ + 3 O₂ → 2 CO₂ + 3 H₂O | innesco | Combustibile alternativo al gasolio. | −1460 | `dme + 3 o2 → 2 co2 + 3 h2o` |
| 259 | C₂H₅OC₂H₅ + 6 O₂ → 4 CO₂ + 5 H₂O | innesco | Vapori facilmente infiammabili. |  | `etere-dietilico + 6 o2 → 4 co2 + 5 h2o` |
| 260 | 2 C₄H₈O + 11 O₂ → 8 CO₂ + 8 H₂O | innesco |  |  | `2 thf + 11 o2 → 8 co2 + 8 h2o` |
| 261 | 2 C₂H₄O + 5 O₂ → 4 CO₂ + 4 H₂O | innesco |  |  | `2 ossido-di-etilene + 5 o2 → 4 co2 + 4 h2o` |
| 262 | CH₂O + O₂ → CO₂ + H₂O | innesco |  | −571 | `formaldeide + o2 → co2 + h2o` |
| 263 | 2 CH₃CHO + 5 O₂ → 4 CO₂ + 4 H₂O | innesco |  | −2333 | `2 acetaldeide + 5 o2 → 4 co2 + 4 h2o` |
| 264 | CH₃CH₂CHO + 4 O₂ → 3 CO₂ + 3 H₂O | innesco |  |  | `propanale + 4 o2 → 3 co2 + 3 h2o` |
| 265 | C₆H₅CHO + 8 O₂ → 7 CO₂ + 3 H₂O | innesco |  |  | `benzaldeide + 8 o2 → 7 co2 + 3 h2o` |
| 266 | CH₃COCH₃ + 4 O₂ → 3 CO₂ + 3 H₂O | innesco |  | −1790 | `acetone + 4 o2 → 3 co2 + 3 h2o` |
| 267 | 2 CH₃COCH₂CH₃ + 11 O₂ → 8 CO₂ + 8 H₂O | innesco |  |  | `2 butanone + 11 o2 → 8 co2 + 8 h2o` |
| 268 | 2 HCOOH + O₂ → 2 CO₂ + 2 H₂O | innesco |  | −509 | `2 acido-formico + o2 → 2 co2 + 2 h2o` |
| 269 | CH₃COOH + 2 O₂ → 2 CO₂ + 2 H₂O | innesco |  | −874 | `acido-acetico + 2 o2 → 2 co2 + 2 h2o` |
| 270 | 2 CH₃CH₂COOH + 7 O₂ → 6 CO₂ + 6 H₂O | innesco |  |  | `2 acido-propanoico + 7 o2 → 6 co2 + 6 h2o` |
| 271 | CH₃(CH₂)₂COOH + 5 O₂ → 4 CO₂ + 4 H₂O | innesco |  |  | `acido-butanoico + 5 o2 → 4 co2 + 4 h2o` |
| 272 | CH₃CH(OH)COOH + 3 O₂ → 3 CO₂ + 3 H₂O | innesco |  |  | `acido-lattico + 3 o2 → 3 co2 + 3 h2o` |
| 273 | 2 C₆H₈O₇ + 9 O₂ → 12 CO₂ + 8 H₂O | innesco |  |  | `2 acido-citrico + 9 o2 → 12 co2 + 8 h2o` |
| 274 | 2 C₆H₅COOH + 15 O₂ → 14 CO₂ + 6 H₂O | innesco |  |  | `2 acido-benzoico + 15 o2 → 14 co2 + 6 h2o` |
| 275 | CH₃(CH₂)₁₆COOH + 26 O₂ → 18 CO₂ + 18 H₂O | innesco | Candele di stearina. |  | `acido-stearico + 26 o2 → 18 co2 + 18 h2o` |
| 276 | 2 C₁₈H₃₄O₂ + 51 O₂ → 36 CO₂ + 34 H₂O | innesco |  |  | `2 acido-oleico + 51 o2 → 36 co2 + 34 h2o` |
| 277 | CH₃COOC₂H₅ + 5 O₂ → 4 CO₂ + 4 H₂O | innesco |  |  | `acetato-di-etile + 5 o2 → 4 co2 + 4 h2o` |
| 278 | 2 C₇H₁₄O₂ + 19 O₂ → 14 CO₂ + 14 H₂O | innesco |  |  | `2 acetato-di-isoamile + 19 o2 → 14 co2 + 14 h2o` |
| 279 | (CH₃CO)₂O + 4 O₂ → 4 CO₂ + 3 H₂O | innesco |  |  | `anidride-acetica + 4 o2 → 4 co2 + 3 h2o` |

### 3.5 Composti azotati, solforati e alogenati (18)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 280 | 4 CH₃NH₂ + 9 O₂ → 4 CO₂ + 10 H₂O + 2 N₂ | innesco |  | −4340 | `4 metilammina + 9 o2 → 4 co2 + 10 h2o + 2 n2` |
| 281 | 4 (CH₃)₂NH + 15 O₂ → 8 CO₂ + 14 H₂O + 2 N₂ | innesco |  |  | `4 dimetilammina + 15 o2 → 8 co2 + 14 h2o + 2 n2` |
| 282 | 4 (CH₃)₃N + 21 O₂ → 12 CO₂ + 18 H₂O + 2 N₂ | innesco |  |  | `4 trimetilammina + 21 o2 → 12 co2 + 18 h2o + 2 n2` |
| 283 | 4 C₂H₅NH₂ + 15 O₂ → 8 CO₂ + 14 H₂O + 2 N₂ | innesco |  |  | `4 etilammina + 15 o2 → 8 co2 + 14 h2o + 2 n2` |
| 284 | 4 C₆H₅NH₂ + 31 O₂ → 24 CO₂ + 14 H₂O + 2 N₂ | innesco |  |  | `4 anilina + 31 o2 → 24 co2 + 14 h2o + 2 n2` |
| 285 | 4 C₅H₅N + 25 O₂ → 20 CO₂ + 10 H₂O + 2 N₂ | innesco |  |  | `4 piridina + 25 o2 → 20 co2 + 10 h2o + 2 n2` |
| 286 | 4 HCONH₂ + 5 O₂ → 4 CO₂ + 6 H₂O + 2 N₂ | innesco |  |  | `4 formammide + 5 o2 → 4 co2 + 6 h2o + 2 n2` |
| 287 | 4 CH₃CONH₂ + 11 O₂ → 8 CO₂ + 10 H₂O + 2 N₂ | innesco |  |  | `4 acetammide + 11 o2 → 8 co2 + 10 h2o + 2 n2` |
| 288 | 4 CH₃CN + 11 O₂ → 8 CO₂ + 6 H₂O + 2 N₂ | innesco |  |  | `4 acetonitrile + 11 o2 → 8 co2 + 6 h2o + 2 n2` |
| 289 | 4 CH₃NO₂ + 3 O₂ → 4 CO₂ + 6 H₂O + 2 N₂ | innesco | Carburante dei dragster. |  | `4 nitrometano + 3 o2 → 4 co2 + 6 h2o + 2 n2` |
| 290 | CH₃SH + 3 O₂ → CO₂ + 2 H₂O + SO₂ | innesco |  |  | `metantiolo + 3 o2 → co2 + 2 h2o + so2` |
| 291 | (CH₃)₂SO + 4 O₂ → 2 CO₂ + 3 H₂O + SO₂ | innesco |  |  | `dmso + 4 o2 → 2 co2 + 3 h2o + so2` |
| 292 | 2 CH₃Cl + 3 O₂ → 2 CO₂ + 2 H₂O + 2 HCl | innesco |  | −1379 | `2 ch3cl + 3 o2 → 2 co2 + 2 h2o + 2 hcl` |
| 293 | C₂H₅Cl + 3 O₂ → 2 CO₂ + 2 H₂O + HCl | innesco |  |  | `cloroetano + 3 o2 → 2 co2 + 2 h2o + hcl` |
| 294 | 2 CH₂=CHCl + 5 O₂ → 4 CO₂ + 2 H₂O + 2 HCl | innesco | Gli incendi di PVC liberano HCl. |  | `2 cloruro-di-vinile + 5 o2 → 4 co2 + 2 h2o + 2 hcl` |
| 295 | C₆H₅Cl + 7 O₂ → 6 CO₂ + 2 H₂O + HCl | innesco |  |  | `clorobenzene + 7 o2 → 6 co2 + 2 h2o + hcl` |
| 296 | 2 CH₃Br + 3 O₂ → 2 CO₂ + 2 H₂O + 2 HBr | innesco |  |  | `2 bromometano + 3 o2 → 2 co2 + 2 h2o + 2 hbr` |
| 297 | 4 CH₃I + 7 O₂ → 4 CO₂ + 6 H₂O + 2 I₂ | innesco |  |  | `4 iodometano + 7 o2 → 4 co2 + 6 h2o + 2 i2` |

### 3.6 Biomolecole e farmaci (36)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 298 | C₆H₁₂O₆ (glucosio) + 6 O₂ → 6 CO₂ + 6 H₂O | enzimi (nelle cellule) o innesco | **già presente** (`respirazione`). Respirazione cellulare. | −2803 | `glucosio + 6 o2 → 6 co2 + 6 h2o` |
| 299 | C₆H₁₂O₆ (fruttosio) + 6 O₂ → 6 CO₂ + 6 H₂O | enzimi o innesco |  |  | `fruttosio + 6 o2 → 6 co2 + 6 h2o` |
| 300 | C₅H₁₀O₅ + 5 O₂ → 5 CO₂ + 5 H₂O | innesco |  |  | `ribosio + 5 o2 → 5 co2 + 5 h2o` |
| 301 | 2 C₅H₁₀O₄ + 11 O₂ → 10 CO₂ + 10 H₂O | innesco |  |  | `2 desossiribosio + 11 o2 → 10 co2 + 10 h2o` |
| 302 | C₁₂H₂₂O₁₁ + 12 O₂ → 12 CO₂ + 11 H₂O | innesco | Lo zucchero a velo disperso nell'aria può esplodere. |  | `saccarosio + 12 o2 → 12 co2 + 11 h2o` |
| 303 | C₆H₈O₆ + 5 O₂ → 6 CO₂ + 4 H₂O | innesco |  |  | `acido-ascorbico + 5 o2 → 6 co2 + 4 h2o` |
| 304 | 4 NH₂CH₂COOH + 9 O₂ → 8 CO₂ + 10 H₂O + 2 N₂ | innesco |  | −3894 | `4 glicina + 9 o2 → 8 co2 + 10 h2o + 2 n2` |
| 305 | 4 C₃H₇NO₂ + 15 O₂ → 12 CO₂ + 14 H₂O + 2 N₂ | innesco |  |  | `4 alanina + 15 o2 → 12 co2 + 14 h2o + 2 n2` |
| 306 | 4 C₃H₇NO₃ + 13 O₂ → 12 CO₂ + 14 H₂O + 2 N₂ | innesco |  |  | `4 serina + 13 o2 → 12 co2 + 14 h2o + 2 n2` |
| 307 | 4 C₃H₇NO₂S + 19 O₂ → 12 CO₂ + 14 H₂O + 2 N₂ + 4 SO₂ | innesco |  |  | `4 cisteina + 19 o2 → 12 co2 + 14 h2o + 2 n2 + 4 so2` |
| 308 | 4 C₅H₁₁NO₂ + 27 O₂ → 20 CO₂ + 22 H₂O + 2 N₂ | innesco |  |  | `4 valina + 27 o2 → 20 co2 + 22 h2o + 2 n2` |
| 309 | 4 C₆H₁₃NO₂ + 33 O₂ → 24 CO₂ + 26 H₂O + 2 N₂ | innesco |  |  | `4 leucina + 33 o2 → 24 co2 + 26 h2o + 2 n2` |
| 310 | 4 C₉H₁₁NO₂ + 43 O₂ → 36 CO₂ + 22 H₂O + 2 N₂ | innesco |  |  | `4 fenilalanina + 43 o2 → 36 co2 + 22 h2o + 2 n2` |
| 311 | 4 C₉H₁₁NO₃ + 41 O₂ → 36 CO₂ + 22 H₂O + 2 N₂ | innesco |  |  | `4 tirosina + 41 o2 → 36 co2 + 22 h2o + 2 n2` |
| 312 | 4 C₅H₉NO₄ + 21 O₂ → 20 CO₂ + 18 H₂O + 2 N₂ | innesco |  |  | `4 acido-glutammico + 21 o2 → 20 co2 + 18 h2o + 2 n2` |
| 313 | 2 C₆H₁₄N₂O₂ + 17 O₂ → 12 CO₂ + 14 H₂O + 2 N₂ | innesco |  |  | `2 lisina + 17 o2 → 12 co2 + 14 h2o + 2 n2` |
| 314 | 4 C₅H₉NO₂ + 25 O₂ → 20 CO₂ + 18 H₂O + 2 N₂ | innesco |  |  | `4 prolina + 25 o2 → 20 co2 + 18 h2o + 2 n2` |
| 315 | 4 C₅H₁₁NO₂S + 31 O₂ → 20 CO₂ + 22 H₂O + 2 N₂ + 4 SO₂ | innesco |  |  | `4 metionina + 31 o2 → 20 co2 + 22 h2o + 2 n2 + 4 so2` |
| 316 | 4 C₅H₅N₅ + 25 O₂ → 20 CO₂ + 10 H₂O + 10 N₂ | innesco |  |  | `4 adenina + 25 o2 → 20 co2 + 10 h2o + 10 n2` |
| 317 | 4 C₅H₅N₅O + 23 O₂ → 20 CO₂ + 10 H₂O + 10 N₂ | innesco |  |  | `4 guanina + 23 o2 → 20 co2 + 10 h2o + 10 n2` |
| 318 | 4 C₄H₅N₃O + 19 O₂ → 16 CO₂ + 10 H₂O + 6 N₂ | innesco |  |  | `4 citosina + 19 o2 → 16 co2 + 10 h2o + 6 n2` |
| 319 | 2 C₅H₆N₂O₂ + 11 O₂ → 10 CO₂ + 6 H₂O + 2 N₂ | innesco |  |  | `2 timina + 11 o2 → 10 co2 + 6 h2o + 2 n2` |
| 320 | C₄H₄N₂O₂ + 4 O₂ → 4 CO₂ + 2 H₂O + N₂ | innesco |  |  | `uracile + 4 o2 → 4 co2 + 2 h2o + n2` |
| 321 | 4 C₈H₁₁NO₂ + 39 O₂ → 32 CO₂ + 22 H₂O + 2 N₂ | innesco |  |  | `4 dopamina + 39 o2 → 32 co2 + 22 h2o + 2 n2` |
| 322 | 4 C₉H₁₃NO₃ + 43 O₂ → 36 CO₂ + 26 H₂O + 2 N₂ | innesco |  |  | `4 adrenalina + 43 o2 → 36 co2 + 26 h2o + 2 n2` |
| 323 | 2 C₈H₁₀N₄O₂ + 19 O₂ → 16 CO₂ + 10 H₂O + 4 N₂ | innesco |  |  | `2 caffeina + 19 o2 → 16 co2 + 10 h2o + 4 n2` |
| 324 | C₇H₈N₄O₂ + 8 O₂ → 7 CO₂ + 4 H₂O + 2 N₂ | innesco |  |  | `teobromina + 8 o2 → 7 co2 + 4 h2o + 2 n2` |
| 325 | C₉H₈O₄ + 9 O₂ → 9 CO₂ + 4 H₂O | innesco |  |  | `aspirina + 9 o2 → 9 co2 + 4 h2o` |
| 326 | C₇H₆O₃ + 7 O₂ → 7 CO₂ + 3 H₂O | innesco |  |  | `acido-salicilico + 7 o2 → 7 co2 + 3 h2o` |
| 327 | 4 C₈H₉NO₂ + 37 O₂ → 32 CO₂ + 18 H₂O + 2 N₂ | innesco |  |  | `4 paracetamolo + 37 o2 → 32 co2 + 18 h2o + 2 n2` |
| 328 | 2 C₁₃H₁₈O₂ + 33 O₂ → 26 CO₂ + 18 H₂O | innesco |  |  | `2 ibuprofene + 33 o2 → 26 co2 + 18 h2o` |
| 329 | 2 C₁₀H₁₄N₂ + 27 O₂ → 20 CO₂ + 14 H₂O + 2 N₂ | innesco |  |  | `2 nicotina + 27 o2 → 20 co2 + 14 h2o + 2 n2` |
| 330 | 2 C₁₀H₂₀O + 29 O₂ → 20 CO₂ + 20 H₂O | innesco |  |  | `2 mentolo + 29 o2 → 20 co2 + 20 h2o` |
| 331 | C₁₀H₁₆ + 14 O₂ → 10 CO₂ + 8 H₂O | innesco | Spruzzando la buccia d'arancia su una fiamma si vedono scintille. |  | `limonene + 14 o2 → 10 co2 + 8 h2o` |
| 332 | 2 C₈H₈O₃ + 17 O₂ → 16 CO₂ + 8 H₂O | innesco |  |  | `2 vanillina + 17 o2 → 16 co2 + 8 h2o` |
| 333 | 4 C₅H₈NO₄Na + 21 O₂ → 2 Na₂CO₃ + 18 CO₂ + 16 H₂O + 2 N₂ | innesco | Il sodio resta nella cenere come carbonato. |  | `4 glutammato-monosodico + 21 o2 → 2 na2co3 + 18 co2 + 16 h2o + 2 n2` |

## 4. Decomposizioni (90)

> Una sostanza si scompone in più prodotti. Quasi tutte sono endotermiche e richiedono energia: calore (Δ), luce (hν) o corrente elettrica. Fanno eccezione le decomposizioni esplosive (esotermiche, basta un innesco).

### 4.1 Carbonati, idrossidi e sali di ammonio (11)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 334 | CaCO₃ → CaO + CO₂ | Δ > 800 °C | **già presente** (`calcare`). Calcinazione del calcare: calce viva. | 179 | `caco3 → cao + co2` |
| 335 | MgCO₃ → MgO + CO₂ | Δ ~350 °C |  |  | `mgco3 → mgo + co2` |
| 336 | Li₂CO₃ → Li₂O + CO₂ | Δ > 1300 °C |  |  | `li2co3 → li2o + co2` |
| 337 | 2 NaHCO₃ → Na₂CO₃ + H₂O + CO₂ | Δ | **già presente** (`bicarbonato`). Lievito per dolci. | 92 | `2 nahco3 → na2co3 + h2o + co2` |
| 338 | (NH₄)₂CO₃ → 2 NH₃ + CO₂ + H₂O | Δ ~60 °C | Ammoniaca per dolci: lievita senza lasciare residui. |  | `nh42co3 → 2 nh3 + co2 + h2o` |
| 339 | Ca(OH)₂ → CaO + H₂O | Δ ~510 °C |  | 64 | `caoh2 → cao + h2o` |
| 340 | Mg(OH)₂ → MgO + H₂O | Δ ~330 °C | Principio dei ritardanti di fiamma minerali. |  | `mgoh2 → mgo + h2o` |
| 341 | 2 Al(OH)₃ → Al₂O₃ + 3 H₂O | Δ ~200 °C | Ritardante di fiamma: assorbe calore e libera vapore. |  | `2 aloh3 → al2o3 + 3 h2o` |
| 342 | Cu(OH)₂ → CuO + H₂O | Δ | Il precipitato azzurro diventa nero. |  | `cuoh2 → cuo + h2o` |
| 343 | 2 LiOH → Li₂O + H₂O | Δ |  |  | `2 lioh → li2o + h2o` |
| 344 | NH₄Cl ⇌ NH₃ + HCl | Δ | Sembra sublimare: i due gas si ricombinano sulle parti fredde. | 176 | `nh4cl ⇌ nh3 + hcl` |

### 4.2 Nitrati, clorati, perclorati, solfati (16)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 345 | 2 NaNO₃ → 2 NaNO₂ + O₂ | Δ |  |  | `2 nano3 → 2 nano2 + o2` |
| 346 | 2 Pb(NO₃)₂ → 2 PbO + 4 NO₂ + O₂ | Δ | I cristalli crepitano e si libera gas bruno. |  | `2 pbno32 → 2 pbo + 4 no2 + o2` |
| 347 | 2 AgNO₃ → 2 Ag + 2 NO₂ + O₂ | Δ |  |  | `2 agno3 → 2 el:Ag + 2 no2 + o2` |
| 348 | NH₄NO₃ → N₂O + 2 H₂O | Δ 200-250 °C | Preparazione del gas esilarante. |  | `nh4no3 → n2o + 2 h2o` |
| 349 | 2 NH₄NO₃ → 2 N₂ + O₂ + 4 H₂O | detonazione | Esplosione del porto di Beirut (2020). |  | `2 nh4no3 → 2 n2 + o2 + 4 h2o` |
| 350 | 2 KClO₃ → 2 KCl + 3 O₂ | Δ, cat. MnO₂ | Ossigeno in laboratorio; candele a ossigeno degli aerei (con NaClO₃). |  | `2 kclo3 → 2 kcl + 3 o2` |
| 351 | 4 KClO₃ → 3 KClO₄ + KCl | Δ senza catalizzatore | Disproporzione del clorato. |  | `4 kclo3 → 3 kclo4 + kcl` |
| 352 | KClO₄ → KCl + 2 O₂ | Δ > 500 °C |  |  | `kclo4 → kcl + 2 o2` |
| 353 | 2 NH₄ClO₄ → N₂ + Cl₂ + 2 O₂ + 4 H₂O | Δ > 300 °C, esplosiva |  |  | `2 nh4clo4 → n2 + cl2 + 2 o2 + 4 h2o` |
| 354 | 2 CaSO₄ → 2 CaO + 2 SO₂ + O₂ | Δ > 1200 °C |  |  | `2 caso4 → 2 cao + 2 so2 + o2` |
| 355 | 2 FeSO₄ → Fe₂O₃ + SO₂ + SO₃ | Δ | Così gli alchimisti ottenevano l'"olio di vetriolo" (acido solforico). |  | `2 feso4 → fe2o3 + so2 + so3` |
| 356 | CuSO₄ → CuO + SO₃ | Δ > 650 °C |  |  | `cuso4 → cuo + so3` |
| 357 | ZnSO₄ → ZnO + SO₃ | Δ |  |  | `znso4 → zno + so3` |
| 358 | MgSO₄ → MgO + SO₃ | Δ > 1100 °C |  |  | `mgso4 → mgo + so3` |
| 359 | 4 K₂Cr₂O₇ → 4 K₂CrO₄ + 2 Cr₂O₃ + 3 O₂ | Δ > 500 °C |  |  | `4 k2cr2o7 → 4 k2cro4 + 2 cr2o3 + 3 o2` |
| 360 | 2 NaClO → 2 NaCl + O₂ | luce, Δ | La candeggina perde efficacia col tempo. |  | `2 naclo → 2 nacl + o2` |

### 4.3 Ossidi, perossidi e alogenuri (12)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 361 | 2 HgO → 2 Hg + O₂ | Δ > 450 °C | Priestley (1774) scoprì così l'ossigeno. |  | `2 hgo → 2 el:Hg + o2` |
| 362 | 2 PbO₂ → 2 PbO + O₂ | Δ |  |  | `2 pbo2 → 2 pbo + o2` |
| 363 | 4 CuO → 2 Cu₂O + O₂ | Δ > 1000 °C |  |  | `4 cuo → 2 cu2o + o2` |
| 364 | PtO₂ → Pt + O₂ | Δ |  |  | `pto2 → el:Pt + o2` |
| 365 | 2 H₂O₂ → 2 H₂O + O₂ | cat. MnO₂ o enzima catalasi | **già presente** (`perossido`). Schiuma dell'acqua ossigenata sulle ferite. | −196 | `2 h2o2 → 2 h2o + o2` |
| 366 | 2 Na₂O₂ → 2 Na₂O + O₂ | Δ > 600 °C |  |  | `2 na2o2 → 2 na2o + o2` |
| 367 | 2 O₃ → 3 O₂ | Δ o cat. | L'ozono si decompone spontaneamente: si produce sul posto. | −285 | `2 o3 → 3 o2` |
| 368 | 2 AuCl₃ → 2 Au + 3 Cl₂ | Δ > 250 °C |  |  | `2 aucl3 → 2 el:Au + 3 cl2` |
| 369 | 2 AgCl → 2 Ag + Cl₂ | luce | L'argento metallico rende scuro il precipitato bianco. |  | `2 agcl → 2 el:Ag + cl2` |
| 370 | 2 AgBr → 2 Ag + Br₂ | luce | Base della fotografia su pellicola. |  | `2 agbr → 2 el:Ag + br2` |
| 371 | 2 XeO₃ → 2 Xe + 3 O₂ | urto | Esplosivo potente. |  | `2 xeo3 → 2 el:Xe + 3 o2` |
| 372 | KrF₂ → Kr + F₂ | temperatura ambiente, lenta |  |  | `krf2 → el:Kr + f2` |

### 4.4 Ossidi e acidi dei non metalli (22)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 373 | 2 N₂O₅ → 4 NO₂ + O₂ | spontanea, lenta |  |  | `2 n2o5 → 4 no2 + o2` |
| 374 | 2 N₂O → 2 N₂ + O₂ | Δ > 600 °C | Per questo N₂O alimenta la combustione (motori "NOS"). | −163 | `2 n2o → 2 n2 + o2` |
| 375 | 2 NO → N₂ + O₂ | cat. | Favorita ma lentissima senza catalizzatore. | −183 | `2 no → n2 + o2` |
| 376 | 2 Cl₂O₇ → 2 Cl₂ + 7 O₂ | urto |  |  | `2 cl2o7 → 2 cl2 + 7 o2` |
| 377 | 2 ClO₂ → Cl₂ + 2 O₂ | Δ o luce | Esplosivo se concentrato: si produce sul posto. |  | `2 clo2 → cl2 + 2 o2` |
| 378 | 2 Cl₂O → 2 Cl₂ + O₂ | Δ |  |  | `2 cl2o → 2 cl2 + o2` |
| 379 | 4 HNO₃ → 4 NO₂ + O₂ + 2 H₂O | luce | L'acido nitrico concentrato ingiallisce: si conserva in bottiglie scure. | 257 | `4 hno3 → 4 no2 + o2 + 2 h2o` |
| 380 | H₂CO₃ → CO₂ + H₂O | spontanea | Le bibite perdono il gas. |  | `h2co3 → co2 + h2o` |
| 381 | H₂SO₃ → SO₂ + H₂O | spontanea |  |  | `h2so3 → so2 + h2o` |
| 382 | H₂SO₄ → SO₃ + H₂O | Δ > 300 °C |  | 87 | `h2so4 → so3 + h2o` |
| 383 | 4 H₃PO₄ → P₄O₁₀ + 6 H₂O | Δ |  |  | `4 h3po4 → p4o10 + 6 h2o` |
| 384 | 3 HNO₂ → HNO₃ + 2 NO + H₂O | spontanea (disproporzione) |  |  | `3 hno2 → hno3 + 2 no + h2o` |
| 385 | 4 H₃PO₃ → 3 H₃PO₄ + PH₃ | Δ (disproporzione) |  |  | `4 h3po3 → 3 h3po4 + ph3` |
| 386 | 2 HClO → 2 HCl + O₂ | luce |  |  | `2 hclo → 2 hcl + o2` |
| 387 | 3 HClO → 2 HCl + HClO₃ | Δ (disproporzione) |  |  | `3 hclo → 2 hcl + hclo3` |
| 388 | 5 HClO₂ → 4 ClO₂ + HCl + 2 H₂O | disproporzione |  |  | `5 hclo2 → 4 clo2 + hcl + 2 h2o` |
| 389 | 3 HClO₃ → HClO₄ + 2 ClO₂ + H₂O | disproporzione |  |  | `3 hclo3 → hclo4 + 2 clo2 + h2o` |
| 390 | 2 HN₃ → H₂ + 3 N₂ | urto | Esplosivo. |  | `2 hn3 → h2 + 3 n2` |
| 391 | HCOOH → CO + H₂O | H₂SO₄ concentrato | Preparazione del CO in laboratorio. | 29 | `acido-formico → co + h2o` |
| 392 | HCOOH → CO₂ + H₂ | cat. | L'acido formico come "serbatoio" di idrogeno. | 31 | `acido-formico → co2 + h2` |
| 393 | HOOC–COOH → CO + CO₂ + H₂O | H₂SO₄ concentrato, Δ |  |  | `acido-ossalico → co + co2 + h2o` |
| 394 | C₁₂H₂₂O₁₁ → 12 C + 11 H₂O | H₂SO₄ concentrato | Il "serpente nero": l'acido disidrata lo zucchero. |  | `saccarosio → 12 el:C + 11 h2o` |

### 4.5 Idruri e composti dell'azoto (15)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 395 | 2 NH₃ → N₂ + 3 H₂ | Δ, cat. | **già presente** (`ammoniaca-dec`). Inverso del processo Haber-Bosch. | 92 | `2 nh3 → n2 + 3 h2` |
| 396 | CH₄ → C + 2 H₂ | Δ > 1000 °C | Pirolisi del metano: idrogeno senza CO₂. | 75 | `ch4 → el:C + 2 h2` |
| 397 | H₂S → H₂ + S | Δ > 1000 °C |  | 21 | `h2s → h2 + el:S` |
| 398 | H₂Se → H₂ + Se | Δ |  |  | `h2se → h2 + el:Se` |
| 399 | H₂Te → H₂ + Te | spontanea | Instabile a temperatura ambiente. |  | `h2te → h2 + el:Te` |
| 400 | SiH₄ → Si + 2 H₂ | Δ | Deposizione di silicio per celle solari e chip. | −34 | `sih4 → el:Si + 2 h2` |
| 401 | Si₂H₆ → 2 Si + 3 H₂ | Δ |  |  | `si2h6 → 2 el:Si + 3 h2` |
| 402 | GeH₄ → Ge + 2 H₂ | Δ |  |  | `geh4 → el:Ge + 2 h2` |
| 403 | 2 AsH₃ → 2 As + 3 H₂ | Δ | Prova di Marsh (1836): uno specchio di arsenico rivela l'avvelenamento. |  | `2 ash3 → 2 el:As + 3 h2` |
| 404 | 2 SbH₃ → 2 Sb + 3 H₂ | Δ, anche spontanea |  |  | `2 sbh3 → 2 el:Sb + 3 h2` |
| 405 | 3 N₂H₄ → 4 NH₃ + N₂ | cat. Ir | Monopropellente dei satelliti. | −336 | `3 n2h4 → 4 nh3 + n2` |
| 406 | N₂H₄ → N₂ + 2 H₂ | cat. |  | −51 | `n2h4 → n2 + 2 h2` |
| 407 | 3 NH₂OH → NH₃ + N₂ + 3 H₂O | Δ |  |  | `3 idrossilammina → nh3 + n2 + 3 h2o` |
| 408 | 2 NCl₃ → N₂ + 3 Cl₂ | urto | Esplosivo: Dulong ci perse un occhio e due dita (1812). |  | `2 ncl3 → n2 + 3 cl2` |
| 409 | 2 NaN₃ → 2 Na + 3 N₂ | innesco elettrico | Gonfia gli airbag in 30 millisecondi. |  | `2 nan3 → 2 el:Na + 3 n2` |

### 4.6 Esplosivi (4)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 410 | 4 C₃H₅N₃O₉ → 12 CO₂ + 10 H₂O + 6 N₂ + O₂ | urto | Sobrero (1847); stabilizzata da Nobel nella dinamite. |  | `4 nitroglicerina → 12 co2 + 10 h2o + 6 n2 + o2` |
| 411 | 2 C₇H₅N₃O₆ → 3 N₂ + 5 H₂O + 7 CO + 7 C | detonatore | Bilancio ossigeno negativo: fumo nero di carbonio. |  | `2 tnt → 3 n2 + 5 h2o + 7 co + 7 el:C` |
| 412 | 2 CH₃NO₂ → 2 CO + 2 H₂O + N₂ + H₂ | detonatore |  |  | `2 nitrometano → 2 co + 2 h2o + n2 + h2` |
| 413 | CF₂=CF₂ → C + CF₄ | Δ o pressione | Il tetrafluoroetilene può decomporsi in modo esplosivo: si stocca con inibitori. |  | `tetrafluoroetilene → el:C + cf4` |

### 4.7 Elettrolisi (in soluzione e ignea) (10)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 414 | 2 H₂O → 2 H₂ + O₂ | elettrolisi | **già presente** (`elettrolisi`) | 572 | `2 h2o → 2 h2 + o2` |
| 415 | 2 HCl → H₂ + Cl₂ | elettrolisi |  | 185 | `2 hcl → h2 + cl2` |
| 416 | 2 HF → H₂ + F₂ | elettrolisi (in KF fuso) | Moissan isolò così il fluoro (1886, premio Nobel). | 547 | `2 hf → h2 + f2` |
| 417 | 2 NaCl → 2 Na + Cl₂ | elettrolisi ignea | Cella di Downs. | 822 | `2 nacl → 2 el:Na + cl2` |
| 418 | 2 LiCl → 2 Li + Cl₂ | elettrolisi ignea | Litio per le batterie. | 817 | `2 licl → 2 el:Li + cl2` |
| 419 | MgCl₂ → Mg + Cl₂ | elettrolisi ignea | Processo Dow. | 641 | `mgcl2 → el:Mg + cl2` |
| 420 | CaCl₂ → Ca + Cl₂ | elettrolisi ignea |  | 795 | `cacl2 → el:Ca + cl2` |
| 421 | 2 Al₂O₃ + 3 C → 4 Al + 3 CO₂ | elettrolisi in criolite fusa, 960 °C | Processo Hall-Héroult: tutto l'alluminio del mondo (l'anodo di carbonio si consuma). | 2171 | `2 al2o3 + 3 el:C → 4 el:Al + 3 co2` |
| 422 | 2 NaCl + 2 H₂O → 2 NaOH + H₂ + Cl₂ | elettrolisi | Processo cloro-soda: soda caustica e cloro. | 542 | `2 nacl + 2 h2o → 2 naoh + h2 + cl2` |
| 423 | 2 KCl + 2 H₂O → 2 KOH + H₂ + Cl₂ | elettrolisi |  | 595 | `2 kcl + 2 h2o → 2 koh + h2 + cl2` |

## 5. Reazioni con l'acqua (78)

> Metalli, ossidi, idruri, nitruri, carburi e alogenuri dei non metalli che reagiscono con l'acqua (idrolisi), e le reazioni del vapore acqueo ad alta temperatura.

### 5.1 Metalli e acqua (9)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 424 | 2 Li + 2 H₂O → 2 LiOH + H₂ |  | Reazione tranquilla: il litio galleggia. |  | `2 el:Li + 2 h2o → 2 lioh + h2` |
| 425 | 2 Na + 2 H₂O → 2 NaOH + H₂ |  | **già presente** (`sodio-acqua`). Il sodio sfrigola e corre sull'acqua. | −280 | `2 el:Na + 2 h2o → 2 naoh + h2` |
| 426 | 2 K + 2 H₂O → 2 KOH + H₂ |  | L'idrogeno si incendia con fiamma lilla. | −278 | `2 el:K + 2 h2o → 2 koh + h2` |
| 427 | Ca + 2 H₂O → Ca(OH)₂ + H₂ |  |  | −414 | `el:Ca + 2 h2o → caoh2 + h2` |
| 428 | Ba + 2 H₂O → Ba(OH)₂ + H₂ |  |  |  | `el:Ba + 2 h2o → baoh2 + h2` |
| 429 | Mg + 2 H₂O → Mg(OH)₂ + H₂ | acqua calda | Con l'acqua fredda la reazione è lentissima. |  | `el:Mg + 2 h2o → mgoh2 + h2` |
| 430 | Mg + H₂O → MgO + H₂ | vapore | Per questo non si spegne il magnesio con l'acqua. | −316 | `el:Mg + h2o → mgo + h2` |
| 431 | Zn + H₂O → ZnO + H₂ | vapore, Δ |  |  | `el:Zn + h2o → zno + h2` |
| 432 | 3 Fe + 4 H₂O → Fe₃O₄ + 4 H₂ | vapore, Δ | Metodo di Lavoisier per produrre idrogeno. |  | `3 el:Fe + 4 h2o → fe3o4 + 4 h2` |

### 5.2 Vapore e combustibili (gas di sintesi) (4)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 433 | C + H₂O → CO + H₂ | Δ > 1000 °C | Gas d'acqua. | 175 | `el:C + h2o → co + h2` |
| 434 | CH₄ + H₂O → CO + 3 H₂ | Δ 800 °C, cat. Ni | Steam reforming: la principale fonte industriale di idrogeno. | 250 | `ch4 + h2o → co + 3 h2` |
| 435 | CH₄ + 2 H₂O → CO₂ + 4 H₂ | Δ, cat. Ni | Reforming completo (con lo shift). | 253 | `ch4 + 2 h2o → co2 + 4 h2` |
| 436 | CO + H₂O ⇌ CO₂ + H₂ | cat. Fe/Cr o Cu | Water-gas shift. | 3 | `co + h2o ⇌ co2 + h2` |

### 5.3 Ossidi e acqua (19)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 437 | Li₂O + H₂O → 2 LiOH |  |  |  | `li2o + h2o → 2 lioh` |
| 438 | Na₂O + H₂O → 2 NaOH |  |  | −152 | `na2o + h2o → 2 naoh` |
| 439 | K₂O + H₂O → 2 KOH |  |  | −202 | `k2o + h2o → 2 koh` |
| 440 | CaO + H₂O → Ca(OH)₂ |  | **già presente** (`calce`). Spegnimento della calce: forte riscaldamento. | −64 | `cao + h2o → caoh2` |
| 441 | MgO + H₂O → Mg(OH)₂ | lenta |  |  | `mgo + h2o → mgoh2` |
| 442 | 2 Na₂O₂ + 2 H₂O → 4 NaOH + O₂ |  |  |  | `2 na2o2 + 2 h2o → 4 naoh + o2` |
| 443 | Na₂O₂ + 2 H₂O → 2 NaOH + H₂O₂ | acqua fredda |  |  | `na2o2 + 2 h2o → 2 naoh + h2o2` |
| 444 | CO₂ + H₂O ⇌ H₂CO₃ |  | Acqua gassata; piogge naturalmente un po' acide. |  | `co2 + h2o ⇌ h2co3` |
| 445 | SO₂ + H₂O → H₂SO₃ |  | Piogge acide. |  | `so2 + h2o → h2so3` |
| 446 | SO₃ + H₂O → H₂SO₄ |  | Piogge acide; ultimo passaggio del processo a contatto. | −87 | `so3 + h2o → h2so4` |
| 447 | N₂O₅ + H₂O → 2 HNO₃ |  |  |  | `n2o5 + h2o → 2 hno3` |
| 448 | 3 NO₂ + H₂O → 2 HNO₃ + NO |  | Piogge acide; processo Ostwald. | −70 | `3 no2 + h2o → 2 hno3 + no` |
| 449 | 2 NO₂ + H₂O → HNO₃ + HNO₂ | freddo |  |  | `2 no2 + h2o → hno3 + hno2` |
| 450 | N₂O₄ + H₂O → HNO₃ + HNO₂ | freddo |  |  | `n2o4 + h2o → hno3 + hno2` |
| 451 | 4 NO₂ + O₂ + 2 H₂O → 4 HNO₃ |  | Con l'ossigeno tutto il biossido di azoto diventa acido nitrico. | −257 | `4 no2 + o2 + 2 h2o → 4 hno3` |
| 452 | P₄O₁₀ + 6 H₂O → 4 H₃PO₄ |  | P₄O₁₀ è uno dei disidratanti più potenti. |  | `p4o10 + 6 h2o → 4 h3po4` |
| 453 | Cl₂O + H₂O → 2 HClO |  |  |  | `cl2o + h2o → 2 hclo` |
| 454 | Cl₂O₇ + H₂O → 2 HClO₄ |  |  |  | `cl2o7 + h2o → 2 hclo4` |
| 455 | 2 ClO₂ + H₂O → HClO₂ + HClO₃ |  |  |  | `2 clo2 + h2o → hclo2 + hclo3` |

### 5.4 Alogeni e acqua (2)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 456 | 2 F₂ + 2 H₂O → 4 HF + O₂ |  | Il fluoro ossida perfino l'acqua. | −522 | `2 f2 + 2 h2o → 4 hf + o2` |
| 457 | Cl₂ + H₂O ⇌ HCl + HClO |  | Acqua di cloro: HClO disinfetta le piscine. |  | `cl2 + h2o ⇌ hcl + hclo` |

### 5.5 Idruri, nitruri, carburi, ammiduri (8)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 458 | LiH + H₂O → LiOH + H₂ |  |  |  | `lih + h2o → lioh + h2` |
| 459 | NaH + H₂O → NaOH + H₂ |  |  |  | `nah + h2o → naoh + h2` |
| 460 | CaH₂ + 2 H₂O → Ca(OH)₂ + 2 H₂ |  | Idrogeno "da campo" per palloni meteorologici; essiccante per solventi. |  | `cah2 + 2 h2o → caoh2 + 2 h2` |
| 461 | Li₃N + 3 H₂O → 3 LiOH + NH₃ |  |  |  | `li3n + 3 h2o → 3 lioh + nh3` |
| 462 | Mg₃N₂ + 6 H₂O → 3 Mg(OH)₂ + 2 NH₃ |  | Odore di ammoniaca dalla cenere di magnesio bruciato all'aria. |  | `mg3n2 + 6 h2o → 3 mgoh2 + 2 nh3` |
| 463 | CaC₂ + 2 H₂O → Ca(OH)₂ + C₂H₂ |  | Lampade ad acetilene dei minatori e degli speleologi. |  | `cac2 + 2 h2o → caoh2 + c2h2` |
| 464 | NaNH₂ + H₂O → NaOH + NH₃ |  |  |  | `nanh2 + h2o → naoh + nh3` |
| 465 | SiH₄ + 4 H₂O → H₄SiO₄ + 4 H₂ | cat. base |  |  | `sih4 + 4 h2o → h4sio4 + 4 h2` |

### 5.6 Idrolisi degli alogenuri e ossoalogenuri (33)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 466 | BCl₃ + 3 H₂O → H₃BO₃ + 3 HCl |  |  |  | `bcl3 + 3 h2o → h3bo3 + 3 hcl` |
| 467 | BBr₃ + 3 H₂O → H₃BO₃ + 3 HBr |  |  |  | `bbr3 + 3 h2o → h3bo3 + 3 hbr` |
| 468 | BF₃ + 3 H₂O → H₃BO₃ + 3 HF |  | Semplificata: con poca acqua si forma anche HBF₄. |  | `bf3 + 3 h2o → h3bo3 + 3 hf` |
| 469 | AlCl₃ + 3 H₂O → Al(OH)₃ + 3 HCl |  | AlCl₃ anidro fuma all'aria umida. |  | `alcl3 + 3 h2o → aloh3 + 3 hcl` |
| 470 | SiCl₄ + 4 H₂O → H₄SiO₄ + 4 HCl |  |  |  | `sicl4 + 4 h2o → h4sio4 + 4 hcl` |
| 471 | SiF₄ + 4 H₂O → H₄SiO₄ + 4 HF |  | Semplificata: si forma anche H₂SiF₆. |  | `sif4 + 4 h2o → h4sio4 + 4 hf` |
| 472 | SnCl₄ + 2 H₂O → SnO₂ + 4 HCl |  |  |  | `sncl4 + 2 h2o → sno2 + 4 hcl` |
| 473 | TiCl₄ + 2 H₂O → TiO₂ + 4 HCl |  | Cortine fumogene: TiCl₄ all'aria umida forma una nebbia bianca. |  | `ticl4 + 2 h2o → tio2 + 4 hcl` |
| 474 | PCl₃ + 3 H₂O → H₃PO₃ + 3 HCl |  |  |  | `pcl3 + 3 h2o → h3po3 + 3 hcl` |
| 475 | PBr₃ + 3 H₂O → H₃PO₃ + 3 HBr |  |  |  | `pbr3 + 3 h2o → h3po3 + 3 hbr` |
| 476 | PF₃ + 3 H₂O → H₃PO₃ + 3 HF | lenta |  |  | `pf3 + 3 h2o → h3po3 + 3 hf` |
| 477 | PCl₅ + 4 H₂O → H₃PO₄ + 5 HCl | acqua in eccesso |  | −159 | `pcl5 + 4 h2o → h3po4 + 5 hcl` |
| 478 | PCl₅ + H₂O → POCl₃ + 2 HCl | poca acqua |  |  | `pcl5 + h2o → pocl3 + 2 hcl` |
| 479 | POCl₃ + 3 H₂O → H₃PO₄ + 3 HCl |  |  |  | `pocl3 + 3 h2o → h3po4 + 3 hcl` |
| 480 | PF₅ + 4 H₂O → H₃PO₄ + 5 HF |  |  |  | `pf5 + 4 h2o → h3po4 + 5 hf` |
| 481 | SOCl₂ + H₂O → SO₂ + 2 HCl |  | Per questo SOCl₂ si usa per seccare i cristalli idrati. |  | `socl2 + h2o → so2 + 2 hcl` |
| 482 | SO₂Cl₂ + 2 H₂O → H₂SO₄ + 2 HCl |  |  |  | `so2cl2 + 2 h2o → h2so4 + 2 hcl` |
| 483 | 2 S₂Cl₂ + 2 H₂O → 3 S + SO₂ + 4 HCl |  |  |  | `2 s2cl2 + 2 h2o → 3 el:S + so2 + 4 hcl` |
| 484 | COCl₂ + H₂O → CO₂ + 2 HCl |  | Tossicità del fosgene: libera HCl nei polmoni. |  | `fosgene + h2o → co2 + 2 hcl` |
| 485 | NOCl + H₂O → HNO₂ + HCl |  |  |  | `nocl + h2o → hno2 + hcl` |
| 486 | NCl₃ + 3 H₂O → NH₃ + 3 HClO |  |  |  | `ncl3 + 3 h2o → nh3 + 3 hclo` |
| 487 | SF₄ + 2 H₂O → SO₂ + 4 HF |  |  | −55 | `sf4 + 2 h2o → so2 + 4 hf` |
| 488 | OF₂ + H₂O → O₂ + 2 HF |  |  |  | `of2 + h2o → o2 + 2 hf` |
| 489 | ClF + H₂O → HClO + HF |  |  |  | `clf + h2o → hclo + hf` |
| 490 | IF₅ + 3 H₂O → HIO₃ + 5 HF |  |  |  | `if5 + 3 h2o → hio3 + 5 hf` |
| 491 | IF₇ + 4 H₂O → HIO₄ + 7 HF |  | Semplificata: il prodotto è l'acido ortoperiodico H₅IO₆. |  | `if7 + 4 h2o → hio4 + 7 hf` |
| 492 | 2 XeF₂ + 2 H₂O → 2 Xe + O₂ + 4 HF |  |  |  | `2 xef2 + 2 h2o → 2 el:Xe + o2 + 4 hf` |
| 493 | 6 XeF₄ + 12 H₂O → 2 XeO₃ + 4 Xe + 3 O₂ + 24 HF |  | Disproporzione dello xeno(IV). |  | `6 xef4 + 12 h2o → 2 xeo3 + 4 el:Xe + 3 o2 + 24 hf` |
| 494 | XeF₆ + 3 H₂O → XeO₃ + 6 HF | acqua in eccesso |  |  | `xef6 + 3 h2o → xeo3 + 6 hf` |
| 495 | XeF₆ + H₂O → XeOF₄ + 2 HF | poca acqua |  |  | `xef6 + h2o → xeof4 + 2 hf` |
| 496 | XeOF₄ + 2 H₂O → XeO₃ + 4 HF |  |  |  | `xeof4 + 2 h2o → xeo3 + 4 hf` |
| 497 | 2 KrF₂ + 2 H₂O → 2 Kr + O₂ + 4 HF |  |  |  | `2 krf2 + 2 h2o → 2 el:Kr + o2 + 4 hf` |
| 498 | CCl₄ + H₂O → COCl₂ + 2 HCl | Δ |  |  | `ccl4 + h2o → fosgene + 2 hcl` |

### 5.7 Idrolisi di altri composti del carbonio (3)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 499 | CS₂ + 2 H₂O → CO₂ + 2 H₂S | Δ |  |  | `cs2 + 2 h2o → co2 + 2 h2s` |
| 500 | COS + H₂O → CO₂ + H₂S | lenta |  |  | `cos + h2o → co2 + h2s` |
| 501 | HCN + 2 H₂O → HCOOH + NH₃ | acido o base |  | −8 | `hcn + 2 h2o → acido-formico + nh3` |

## 6. Acidi e basi (141)

> Neutralizzazioni (acido + base → sale + acqua), reazioni degli ossidi acidi con le basi e degli ossidi basici con gli acidi, spostamento degli acidi deboli o volatili dai loro sali. Sostanze pure o in soluzione acquosa; le equazioni sono scritte in forma molecolare.

### 6.1 Acido + idrossido → sale + acqua (38)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 502 | HCl + NaOH → NaCl + H₂O |  | **già presente** (`neutralizzazione`) | −179 | `hcl + naoh → nacl + h2o` |
| 503 | HCl + KOH → KCl + H₂O |  |  | −205 | `hcl + koh → kcl + h2o` |
| 504 | HCl + LiOH → LiCl + H₂O |  |  |  | `hcl + lioh → licl + h2o` |
| 505 | 2 HCl + Mg(OH)₂ → MgCl₂ + 2 H₂O |  | Antiacido (latte di magnesia). |  | `2 hcl + mgoh2 → mgcl2 + 2 h2o` |
| 506 | 2 HCl + Ca(OH)₂ → CaCl₂ + 2 H₂O |  |  | −197 | `2 hcl + caoh2 → cacl2 + 2 h2o` |
| 507 | 2 HCl + Ba(OH)₂ → BaCl₂ + 2 H₂O |  |  |  | `2 hcl + baoh2 → bacl2 + 2 h2o` |
| 508 | 3 HCl + Al(OH)₃ → AlCl₃ + 3 H₂O |  | Antiacido. |  | `3 hcl + aloh3 → alcl3 + 3 h2o` |
| 509 | 2 HCl + Cu(OH)₂ → CuCl₂ + 2 H₂O |  |  |  | `2 hcl + cuoh2 → cucl2 + 2 h2o` |
| 510 | HF + NaOH → NaF + H₂O |  | Fluoruro dei dentifrici. | −163 | `hf + naoh → naf + h2o` |
| 511 | HF + KOH → KF + H₂O |  |  |  | `hf + koh → kf + h2o` |
| 512 | HF + LiOH → LiF + H₂O |  |  |  | `hf + lioh → lif + h2o` |
| 513 | 2 HF + Ca(OH)₂ → CaF₂ + 2 H₂O |  |  | −268 | `2 hf + caoh2 → caf2 + 2 h2o` |
| 514 | HBr + NaOH → NaBr + H₂O |  |  |  | `hbr + naoh → nabr + h2o` |
| 515 | HBr + KOH → KBr + H₂O |  |  | −219 | `hbr + koh → kbr + h2o` |
| 516 | HI + NaOH → NaI + H₂O |  |  |  | `hi + naoh → nai + h2o` |
| 517 | HI + KOH → KI + H₂O |  |  | −216 | `hi + koh → ki + h2o` |
| 518 | HNO₃ + NaOH → NaNO₃ + H₂O |  |  |  | `hno3 + naoh → nano3 + h2o` |
| 519 | HNO₃ + KOH → KNO₃ + H₂O |  |  |  | `hno3 + koh → kno3 + h2o` |
| 520 | H₂SO₄ + 2 NaOH → Na₂SO₄ + 2 H₂O |  |  |  | `h2so4 + 2 naoh → na2so4 + 2 h2o` |
| 521 | H₂SO₄ + 2 KOH → K₂SO₄ + 2 H₂O |  |  |  | `h2so4 + 2 koh → k2so4 + 2 h2o` |
| 522 | H₂SO₄ + Mg(OH)₂ → MgSO₄ + 2 H₂O |  |  |  | `h2so4 + mgoh2 → mgso4 + 2 h2o` |
| 523 | H₂SO₄ + Ca(OH)₂ → CaSO₄ + 2 H₂O |  |  |  | `h2so4 + caoh2 → caso4 + 2 h2o` |
| 524 | H₂SO₄ + Ba(OH)₂ → BaSO₄ + 2 H₂O |  | Il sale precipita: al punto di equivalenza la soluzione non conduce più. |  | `h2so4 + baoh2 → baso4 + 2 h2o` |
| 525 | 3 H₂SO₄ + 2 Al(OH)₃ → Al₂(SO₄)₃ + 6 H₂O |  |  |  | `3 h2so4 + 2 aloh3 → al2so43 + 6 h2o` |
| 526 | H₂SO₄ + Cu(OH)₂ → CuSO₄ + 2 H₂O |  |  |  | `h2so4 + cuoh2 → cuso4 + 2 h2o` |
| 527 | H₃PO₄ + 3 NaOH → Na₃PO₄ + 3 H₂O |  |  |  | `h3po4 + 3 naoh → na3po4 + 3 h2o` |
| 528 | 2 H₃PO₄ + 3 Ca(OH)₂ → Ca₃(PO₄)₂ + 6 H₂O |  |  |  | `2 h3po4 + 3 caoh2 → ca3po42 + 6 h2o` |
| 529 | HCN + NaOH → NaCN + H₂O |  |  |  | `hcn + naoh → nacn + h2o` |
| 530 | HCN + KOH → KCN + H₂O |  |  |  | `hcn + koh → kcn + h2o` |
| 531 | HClO + NaOH → NaClO + H₂O |  |  |  | `hclo + naoh → naclo + h2o` |
| 532 | HNO₂ + NaOH → NaNO₂ + H₂O |  |  |  | `hno2 + naoh → nano2 + h2o` |
| 533 | H₂SO₃ + 2 NaOH → Na₂SO₃ + 2 H₂O |  |  |  | `h2so3 + 2 naoh → na2so3 + 2 h2o` |
| 534 | HClO₃ + KOH → KClO₃ + H₂O |  |  |  | `hclo3 + koh → kclo3 + h2o` |
| 535 | HClO₄ + KOH → KClO₄ + H₂O |  |  |  | `hclo4 + koh → kclo4 + h2o` |
| 536 | HN₃ + NaOH → NaN₃ + H₂O |  |  |  | `hn3 + naoh → nan3 + h2o` |
| 537 | H₂S + 2 NaOH → Na₂S + 2 H₂O |  |  |  | `h2s + 2 naoh → na2s + 2 h2o` |
| 538 | CH₃COOH + NaOH → CH₃COONa + H₂O |  |  |  | `acido-acetico + naoh → acetato-di-sodio + h2o` |
| 539 | C₅H₉NO₄ + NaOH → C₅H₈NO₄Na + H₂O |  | Produzione del glutammato (E621). |  | `acido-glutammico + naoh → glutammato-monosodico + h2o` |

### 6.2 Ammoniaca + acido → sale di ammonio (5)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 540 | NH₃ + HCl → NH₄Cl |  | **già presente** (`nh4cl`). Fumo bianco dove i due gas si incontrano. | −176 | `nh3 + hcl → nh4cl` |
| 541 | NH₃ + HNO₃ → NH₄NO₃ |  | Fertilizzante azotato. |  | `nh3 + hno3 → nh4no3` |
| 542 | 2 NH₃ + H₂SO₄ → (NH₄)₂SO₄ |  | Fertilizzante. |  | `2 nh3 + h2so4 → nh42so4` |
| 543 | NH₃ + HClO₄ → NH₄ClO₄ |  | Ossidante dei propellenti solidi. |  | `nh3 + hclo4 → nh4clo4` |
| 544 | 2 NH₃ + CO₂ + H₂O → (NH₄)₂CO₃ |  |  |  | `2 nh3 + co2 + h2o → nh42co3` |

### 6.3 Ossidi acidi + basi o ossidi basici (24)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 545 | CO₂ + 2 NaOH → Na₂CO₃ + H₂O |  |  | −171 | `co2 + 2 naoh → na2co3 + h2o` |
| 546 | CO₂ + NaOH → NaHCO₃ | CO₂ in eccesso |  | −131 | `co2 + naoh → nahco3` |
| 547 | CO₂ + 2 KOH → K₂CO₃ + H₂O |  |  |  | `co2 + 2 koh → k2co3 + h2o` |
| 548 | CO₂ + 2 LiOH → Li₂CO₃ + H₂O |  | Filtri della CO₂ nelle navicelle (Apollo 13) e nei sottomarini. |  | `co2 + 2 lioh → li2co3 + h2o` |
| 549 | CO₂ + Ca(OH)₂ → CaCO₃ + H₂O |  | L'acqua di calce si intorbida: test della CO₂; presa della malta. | −115 | `co2 + caoh2 → caco3 + h2o` |
| 550 | CO₂ + Mg(OH)₂ → MgCO₃ + H₂O |  |  |  | `co2 + mgoh2 → mgco3 + h2o` |
| 551 | CO₂ + CaO → CaCO₃ |  | Cattura della CO₂ (calcium looping). | −179 | `co2 + cao → caco3` |
| 552 | CO₂ + MgO → MgCO₃ |  |  |  | `co2 + mgo → mgco3` |
| 553 | CO₂ + Na₂O → Na₂CO₃ |  |  | −323 | `co2 + na2o → na2co3` |
| 554 | CO₂ + K₂O → K₂CO₃ |  |  |  | `co2 + k2o → k2co3` |
| 555 | CO₂ + Li₂O → Li₂CO₃ |  |  |  | `co2 + li2o → li2co3` |
| 556 | 2 Na₂O₂ + 2 CO₂ → 2 Na₂CO₃ + O₂ |  | Rigenera l'aria nei sottomarini: assorbe CO₂ e libera O₂. |  | `2 na2o2 + 2 co2 → 2 na2co3 + o2` |
| 557 | SO₂ + 2 NaOH → Na₂SO₃ + H₂O |  | Desolforazione dei fumi. |  | `so2 + 2 naoh → na2so3 + h2o` |
| 558 | SO₃ + 2 NaOH → Na₂SO₄ + H₂O |  |  |  | `so3 + 2 naoh → na2so4 + h2o` |
| 559 | SO₃ + CaO → CaSO₄ |  |  |  | `so3 + cao → caso4` |
| 560 | SO₃ + MgO → MgSO₄ |  |  |  | `so3 + mgo → mgso4` |
| 561 | SO₃ + Na₂O → Na₂SO₄ |  |  |  | `so3 + na2o → na2so4` |
| 562 | P₄O₁₀ + 12 NaOH → 4 Na₃PO₄ + 6 H₂O |  |  |  | `p4o10 + 12 naoh → 4 na3po4 + 6 h2o` |
| 563 | P₄O₁₀ + 6 CaO → 2 Ca₃(PO₄)₂ |  |  |  | `p4o10 + 6 cao → 2 ca3po42` |
| 564 | 2 NO₂ + 2 NaOH → NaNO₂ + NaNO₃ + H₂O |  | Abbattimento dei NOx. |  | `2 no2 + 2 naoh → nano2 + nano3 + h2o` |
| 565 | NO + NO₂ + 2 NaOH → 2 NaNO₂ + H₂O |  | Produzione industriale del nitrito di sodio. |  | `no + no2 + 2 naoh → 2 nano2 + h2o` |
| 566 | Cl₂ + 2 NaOH → NaCl + NaClO + H₂O | freddo | Produzione della candeggina. |  | `cl2 + 2 naoh → nacl + naclo + h2o` |
| 567 | 3 Cl₂ + 6 KOH → 5 KCl + KClO₃ + 3 H₂O | caldo | Metodo di Berthollet per il clorato di potassio. |  | `3 cl2 + 6 koh → 5 kcl + kclo3 + 3 h2o` |
| 568 | 2 F₂ + 2 NaOH → OF₂ + 2 NaF + H₂O | NaOH diluito | Preparazione del difluoruro di ossigeno. |  | `2 f2 + 2 naoh → of2 + 2 naf + h2o` |

### 6.4 Ossidi basici + acidi (24)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 569 | 2 HCl + MgO → MgCl₂ + H₂O |  |  | −141 | `2 hcl + mgo → mgcl2 + h2o` |
| 570 | 2 HCl + CaO → CaCl₂ + H₂O |  |  | −262 | `2 hcl + cao → cacl2 + h2o` |
| 571 | 2 HCl + Na₂O → 2 NaCl + H₂O |  |  | −509 | `2 hcl + na2o → 2 nacl + h2o` |
| 572 | 2 HCl + K₂O → 2 KCl + H₂O |  |  | −613 | `2 hcl + k2o → 2 kcl + h2o` |
| 573 | 2 HCl + Li₂O → 2 LiCl + H₂O |  |  | −321 | `2 hcl + li2o → 2 licl + h2o` |
| 574 | 6 HCl + Al₂O₃ → 2 AlCl₃ + 3 H₂O | Δ |  |  | `6 hcl + al2o3 → 2 alcl3 + 3 h2o` |
| 575 | 6 HCl + Fe₂O₃ → 2 FeCl₃ + 3 H₂O |  | Decapaggio: l'acido toglie la ruggine dall'acciaio. |  | `6 hcl + fe2o3 → 2 fecl3 + 3 h2o` |
| 576 | 2 HCl + FeO → FeCl₂ + H₂O |  |  |  | `2 hcl + feo → fecl2 + h2o` |
| 577 | 8 HCl + Fe₃O₄ → FeCl₂ + 2 FeCl₃ + 4 H₂O |  |  |  | `8 hcl + fe3o4 → fecl2 + 2 fecl3 + 4 h2o` |
| 578 | 2 HCl + CuO → CuCl₂ + H₂O |  |  |  | `2 hcl + cuo → cucl2 + h2o` |
| 579 | 2 HCl + Cu₂O → 2 CuCl + H₂O |  |  |  | `2 hcl + cu2o → 2 cucl + h2o` |
| 580 | 2 HCl + ZnO → ZnCl₂ + H₂O |  |  |  | `2 hcl + zno → zncl2 + h2o` |
| 581 | 2 HCl + HgO → HgCl₂ + H₂O |  |  |  | `2 hcl + hgo → hgcl2 + h2o` |
| 582 | 4 HCl + SnO₂ → SnCl₄ + 2 H₂O | Δ, HCl concentrato |  |  | `4 hcl + sno2 → sncl4 + 2 h2o` |
| 583 | H₂SO₄ + MgO → MgSO₄ + H₂O |  |  |  | `h2so4 + mgo → mgso4 + h2o` |
| 584 | H₂SO₄ + CaO → CaSO₄ + H₂O |  |  |  | `h2so4 + cao → caso4 + h2o` |
| 585 | H₂SO₄ + Na₂O → Na₂SO₄ + H₂O |  |  |  | `h2so4 + na2o → na2so4 + h2o` |
| 586 | 3 H₂SO₄ + Al₂O₃ → Al₂(SO₄)₃ + 3 H₂O | Δ | Solfato di alluminio per la depurazione delle acque. |  | `3 h2so4 + al2o3 → al2so43 + 3 h2o` |
| 587 | H₂SO₄ + FeO → FeSO₄ + H₂O |  |  |  | `h2so4 + feo → feso4 + h2o` |
| 588 | H₂SO₄ + CuO → CuSO₄ + H₂O | Δ | La polvere nera si scioglie in una soluzione azzurra. |  | `h2so4 + cuo → cuso4 + h2o` |
| 589 | H₂SO₄ + ZnO → ZnSO₄ + H₂O |  |  |  | `h2so4 + zno → znso4 + h2o` |
| 590 | H₂SO₄ + NiO → NiSO₄ + H₂O | Δ |  |  | `h2so4 + nio → niso4 + h2o` |
| 591 | 2 HNO₃ + PbO → Pb(NO₃)₂ + H₂O |  |  |  | `2 hno3 + pbo → pbno32 + h2o` |
| 592 | 2 H₃PO₄ + 3 CaO → Ca₃(PO₄)₂ + 3 H₂O |  |  |  | `2 h3po4 + 3 cao → ca3po42 + 3 h2o` |

### 6.5 Acidi + carbonati e bicarbonati (si libera CO₂) (19)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 593 | CaCO₃ + 2 HCl → CaCl₂ + H₂O + CO₂ |  | Effervescenza: riconoscimento del calcare; disincrostanti. | −83 | `caco3 + 2 hcl → cacl2 + h2o + co2` |
| 594 | Na₂CO₃ + 2 HCl → 2 NaCl + H₂O + CO₂ |  |  | −186 | `na2co3 + 2 hcl → 2 nacl + h2o + co2` |
| 595 | NaHCO₃ + HCl → NaCl + H₂O + CO₂ |  | Il bicarbonato neutralizza l'acidità di stomaco. | −47 | `nahco3 + hcl → nacl + h2o + co2` |
| 596 | K₂CO₃ + 2 HCl → 2 KCl + H₂O + CO₂ |  |  |  | `k2co3 + 2 hcl → 2 kcl + h2o + co2` |
| 597 | MgCO₃ + 2 HCl → MgCl₂ + H₂O + CO₂ |  |  |  | `mgco3 + 2 hcl → mgcl2 + h2o + co2` |
| 598 | Li₂CO₃ + 2 HCl → 2 LiCl + H₂O + CO₂ |  |  |  | `li2co3 + 2 hcl → 2 licl + h2o + co2` |
| 599 | (NH₄)₂CO₃ + 2 HCl → 2 NH₄Cl + H₂O + CO₂ |  |  |  | `nh42co3 + 2 hcl → 2 nh4cl + h2o + co2` |
| 600 | CaCO₃ + H₂SO₄ → CaSO₄ + H₂O + CO₂ |  | Le piogge acide trasformano il marmo dei monumenti in gesso. |  | `caco3 + h2so4 → caso4 + h2o + co2` |
| 601 | Na₂CO₃ + H₂SO₄ → Na₂SO₄ + H₂O + CO₂ |  |  |  | `na2co3 + h2so4 → na2so4 + h2o + co2` |
| 602 | 2 NaHCO₃ + H₂SO₄ → Na₂SO₄ + 2 H₂O + 2 CO₂ |  | Estintori a soda-acido (storici). |  | `2 nahco3 + h2so4 → na2so4 + 2 h2o + 2 co2` |
| 603 | K₂CO₃ + H₂SO₄ → K₂SO₄ + H₂O + CO₂ |  |  |  | `k2co3 + h2so4 → k2so4 + h2o + co2` |
| 604 | MgCO₃ + H₂SO₄ → MgSO₄ + H₂O + CO₂ |  |  |  | `mgco3 + h2so4 → mgso4 + h2o + co2` |
| 605 | Na₂CO₃ + 2 HNO₃ → 2 NaNO₃ + H₂O + CO₂ |  |  |  | `na2co3 + 2 hno3 → 2 nano3 + h2o + co2` |
| 606 | K₂CO₃ + 2 HNO₃ → 2 KNO₃ + H₂O + CO₂ |  |  |  | `k2co3 + 2 hno3 → 2 kno3 + h2o + co2` |
| 607 | 3 CaCO₃ + 2 H₃PO₄ → Ca₃(PO₄)₂ + 3 H₂O + 3 CO₂ |  |  |  | `3 caco3 + 2 h3po4 → ca3po42 + 3 h2o + 3 co2` |
| 608 | NaHCO₃ + CH₃COOH → CH₃COONa + H₂O + CO₂ |  | Il "vulcano" di bicarbonato e aceto. |  | `nahco3 + acido-acetico → acetato-di-sodio + h2o + co2` |
| 609 | Na₂CO₃ + 2 CH₃COOH → 2 CH₃COONa + H₂O + CO₂ |  |  |  | `na2co3 + 2 acido-acetico → 2 acetato-di-sodio + h2o + co2` |
| 610 | NaHCO₃ + NaOH → Na₂CO₃ + H₂O |  |  | −40 | `nahco3 + naoh → na2co3 + h2o` |
| 611 | Na₂CO₃ + CO₂ + H₂O → 2 NaHCO₃ |  |  | −92 | `na2co3 + co2 + h2o → 2 nahco3` |

### 6.6 Spostamento di acidi volatili o deboli dai loro sali (19)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 612 | 2 NaCl + H₂SO₄ → Na₂SO₄ + 2 HCl | Δ | Metodo di Glauber; primo passaggio del processo Leblanc. |  | `2 nacl + h2so4 → na2so4 + 2 hcl` |
| 613 | CaF₂ + H₂SO₄ → CaSO₄ + 2 HF | Δ | Produzione industriale dell'acido fluoridrico dalla fluorite. |  | `caf2 + h2so4 → caso4 + 2 hf` |
| 614 | 2 NaNO₃ + H₂SO₄ → Na₂SO₄ + 2 HNO₃ | Δ | Acido nitrico dal salnitro del Cile (storico). |  | `2 nano3 + h2so4 → na2so4 + 2 hno3` |
| 615 | 2 KNO₃ + H₂SO₄ → K₂SO₄ + 2 HNO₃ | Δ |  |  | `2 kno3 + h2so4 → k2so4 + 2 hno3` |
| 616 | Ca₃(PO₄)₂ + 3 H₂SO₄ → 3 CaSO₄ + 2 H₃PO₄ |  | Processo a umido: acido fosforico e fertilizzanti. |  | `ca3po42 + 3 h2so4 → 3 caso4 + 2 h3po4` |
| 617 | Na₂S + 2 HCl → 2 NaCl + H₂S |  | Odore di uova marce. |  | `na2s + 2 hcl → 2 nacl + h2s` |
| 618 | Na₂S + H₂SO₄ → Na₂SO₄ + H₂S |  |  |  | `na2s + h2so4 → na2so4 + h2s` |
| 619 | ZnS + 2 HCl → ZnCl₂ + H₂S |  |  |  | `zns + 2 hcl → zncl2 + h2s` |
| 620 | ZnS + H₂SO₄ → ZnSO₄ + H₂S |  |  |  | `zns + h2so4 → znso4 + h2s` |
| 621 | Na₂SO₃ + 2 HCl → 2 NaCl + H₂O + SO₂ |  |  |  | `na2so3 + 2 hcl → 2 nacl + h2o + so2` |
| 622 | Na₂SO₃ + H₂SO₄ → Na₂SO₄ + H₂O + SO₂ |  | Preparazione di SO₂ in laboratorio. |  | `na2so3 + h2so4 → na2so4 + h2o + so2` |
| 623 | Na₂S₂O₃ + 2 HCl → 2 NaCl + S + SO₂ + H₂O |  | Lo zolfo colloidale intorbida la soluzione: esperimento di cinetica ("la croce che scompare"). |  | `na2s2o3 + 2 hcl → 2 nacl + el:S + so2 + h2o` |
| 624 | NaCN + HCl → NaCl + HCN |  | Pericolo: si libera acido cianidrico. |  | `nacn + hcl → nacl + hcn` |
| 625 | KCN + HCl → KCl + HCN |  | Pericolo: si libera acido cianidrico. |  | `kcn + hcl → kcl + hcn` |
| 626 | 2 NaCN + H₂SO₄ → Na₂SO₄ + 2 HCN |  |  |  | `2 nacn + h2so4 → na2so4 + 2 hcn` |
| 627 | NaNO₂ + HCl → NaCl + HNO₂ | freddo |  |  | `nano2 + hcl → nacl + hno2` |
| 628 | CH₃COONa + HCl → NaCl + CH₃COOH |  |  |  | `acetato-di-sodio + hcl → nacl + acido-acetico` |
| 629 | NaClO + 2 HCl → NaCl + Cl₂ + H₂O |  | Pericolo: mai mescolare candeggina e acido muriatico. |  | `naclo + 2 hcl → nacl + cl2 + h2o` |
| 630 | NaClO + CO₂ + H₂O → NaHCO₃ + HClO |  | La candeggina all'aria libera acido ipocloroso. |  | `naclo + co2 + h2o → nahco3 + hclo` |

### 6.7 Sali di ammonio + basi (si libera ammoniaca) (10)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 631 | NH₄Cl + NaOH → NaCl + NH₃ + H₂O | Δ | Riconoscimento dei sali di ammonio. | −3 | `nh4cl + naoh → nacl + nh3 + h2o` |
| 632 | NH₄Cl + KOH → KCl + NH₃ + H₂O | Δ |  | −29 | `nh4cl + koh → kcl + nh3 + h2o` |
| 633 | 2 NH₄Cl + Ca(OH)₂ → CaCl₂ + 2 NH₃ + 2 H₂O | Δ | Ammoniaca in laboratorio; recupero dell'ammoniaca nel processo Solvay. | 155 | `2 nh4cl + caoh2 → cacl2 + 2 nh3 + 2 h2o` |
| 634 | 2 NH₄Cl + Ba(OH)₂ → BaCl₂ + 2 NH₃ + 2 H₂O |  | Reazione fortemente endotermica: la beuta gela sul banco (con Ba(OH)₂·8H₂O). |  | `2 nh4cl + baoh2 → bacl2 + 2 nh3 + 2 h2o` |
| 635 | (NH₄)₂SO₄ + 2 NaOH → Na₂SO₄ + 2 NH₃ + 2 H₂O | Δ |  |  | `nh42so4 + 2 naoh → na2so4 + 2 nh3 + 2 h2o` |
| 636 | (NH₄)₂SO₄ + Ca(OH)₂ → CaSO₄ + 2 NH₃ + 2 H₂O | Δ |  |  | `nh42so4 + caoh2 → caso4 + 2 nh3 + 2 h2o` |
| 637 | NH₄NO₃ + NaOH → NaNO₃ + NH₃ + H₂O | Δ |  |  | `nh4no3 + naoh → nano3 + nh3 + h2o` |
| 638 | NH₄NO₃ + KOH → KNO₃ + NH₃ + H₂O | Δ |  |  | `nh4no3 + koh → kno3 + nh3 + h2o` |
| 639 | 3 NaClO + NH₃ → NCl₃ + 3 NaOH | candeggina in eccesso | Pericolo: mai mescolare candeggina e ammoniaca (si formano clorammine). |  | `3 naclo + nh3 → ncl3 + 3 naoh` |
| 640 | NaClO + 2 NH₃ → N₂H₄ + NaCl + H₂O |  | Processo Raschig per l'idrazina. |  | `naclo + 2 nh3 → n2h4 + nacl + h2o` |

### 6.8 Basi forti + sali (scambio) (2)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 641 | Li₂CO₃ + Ca(OH)₂ → 2 LiOH + CaCO₃ |  | Idrossido di litio per le batterie. |  | `li2co3 + caoh2 → 2 lioh + caco3` |
| 642 | CH₃COONa + NaOH → CH₄ + Na₂CO₃ | Δ, calce sodata | Preparazione del metano in laboratorio (decarbossilazione). |  | `acetato-di-sodio + naoh → ch4 + na2co3` |

## 7. Ioni in soluzione acquosa (56)

> Equilibri di Brønsted e reazioni ioniche nette che usano solo gli ioni poliatomici della libreria (`h3o`, `oh`, `nh4`, `co3`…). Gli ioni monoatomici (Na⁺, Cl⁻, Cu²⁺…) non sono voci della libreria: le reazioni ioniche nette che li richiedono sono nell'appendice A.

### 7.1 Acqua, ammoniaca e neutralizzazione (7)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 643 | H₃O⁺ + OH⁻ → 2 H₂O |  | Neutralizzazione: circa −56 kJ per mole d'acqua. |  | `h3o + oh → 2 h2o` |
| 644 | 2 H₂O ⇌ H₃O⁺ + OH⁻ |  | Autoionizzazione: Kw = 10⁻¹⁴ a 25 °C. |  | `2 h2o ⇌ h3o + oh` |
| 645 | NH₃ + H₂O ⇌ NH₄⁺ + OH⁻ |  | L'ammoniaca è una base debole. |  | `nh3 + h2o ⇌ nh4 + oh` |
| 646 | NH₄⁺ + H₂O ⇌ NH₃ + H₃O⁺ |  | Le soluzioni di NH₄Cl sono acide. |  | `nh4 + h2o ⇌ nh3 + h3o` |
| 647 | NH₄⁺ + OH⁻ → NH₃ + H₂O |  |  |  | `nh4 + oh → nh3 + h2o` |
| 648 | NH₃ + H₃O⁺ → NH₄⁺ + H₂O |  |  |  | `nh3 + h3o → nh4 + h2o` |
| 649 | NH₂⁻ + H₂O → NH₃ + OH⁻ |  | Base fortissima: in acqua non sopravvive. |  | `ammiduro + h2o → nh3 + oh` |

### 7.2 Dissociazione degli acidi (24)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 650 | HNO₃ + H₂O → H₃O⁺ + NO₃⁻ |  | Acido forte. |  | `hno3 + h2o → h3o + no3` |
| 651 | H₂SO₄ + H₂O → H₃O⁺ + HSO₄⁻ |  | Prima dissociazione: completa. |  | `h2so4 + h2o → h3o + idrogenosolfato` |
| 652 | HSO₄⁻ + H₂O ⇌ H₃O⁺ + SO₄²⁻ |  |  |  | `idrogenosolfato + h2o ⇌ h3o + so4` |
| 653 | HClO₄ + H₂O → H₃O⁺ + ClO₄⁻ |  | Tra gli acidi più forti. |  | `hclo4 + h2o → h3o + perclorato` |
| 654 | HClO₃ + H₂O → H₃O⁺ + ClO₃⁻ |  |  |  | `hclo3 + h2o → h3o + clorato` |
| 655 | HClO₂ + H₂O ⇌ H₃O⁺ + ClO₂⁻ |  |  |  | `hclo2 + h2o ⇌ h3o + clorito` |
| 656 | HClO + H₂O ⇌ H₃O⁺ + ClO⁻ |  |  |  | `hclo + h2o ⇌ h3o + ipoclorito` |
| 657 | HIO₃ + H₂O ⇌ H₃O⁺ + IO₃⁻ |  |  |  | `hio3 + h2o ⇌ h3o + iodato` |
| 658 | HNO₂ + H₂O ⇌ H₃O⁺ + NO₂⁻ |  |  |  | `hno2 + h2o ⇌ h3o + nitrito` |
| 659 | HCN + H₂O ⇌ H₃O⁺ + CN⁻ |  | Acido molto debole. |  | `hcn + h2o ⇌ h3o + cn` |
| 660 | HN₃ + H₂O ⇌ H₃O⁺ + N₃⁻ |  |  |  | `hn3 + h2o ⇌ h3o + azoturo` |
| 661 | H₂S + H₂O ⇌ H₃O⁺ + HS⁻ |  |  |  | `h2s + h2o ⇌ h3o + idrogenosolfuro` |
| 662 | H₃PO₄ + H₂O ⇌ H₃O⁺ + H₂PO₄⁻ |  |  |  | `h3po4 + h2o ⇌ h3o + diidrogenofosfato` |
| 663 | H₂PO₄⁻ + H₂O ⇌ H₃O⁺ + HPO₄²⁻ |  | Tampone fosfato delle cellule. |  | `diidrogenofosfato + h2o ⇌ h3o + idrogenofosfato` |
| 664 | HPO₄²⁻ + H₂O ⇌ H₃O⁺ + PO₄³⁻ |  |  |  | `idrogenofosfato + h2o ⇌ h3o + po4` |
| 665 | H₂CO₃ + H₂O ⇌ H₃O⁺ + HCO₃⁻ |  |  |  | `h2co3 + h2o ⇌ h3o + hco3` |
| 666 | HCO₃⁻ + H₂O ⇌ H₃O⁺ + CO₃²⁻ |  |  |  | `hco3 + h2o ⇌ h3o + co3` |
| 667 | CH₃COOH + H₂O ⇌ H₃O⁺ + CH₃COO⁻ |  | L'aceto è un acido debole. |  | `acido-acetico + h2o ⇌ h3o + acetato` |
| 668 | HCOOH + H₂O ⇌ H₃O⁺ + HCOO⁻ |  |  |  | `acido-formico + h2o ⇌ h3o + formiato` |
| 669 | HOOC–COOH + 2 H₂O ⇌ 2 H₃O⁺ + C₂O₄²⁻ |  |  |  | `acido-ossalico + 2 h2o ⇌ 2 h3o + ossalato` |
| 670 | H₂CrO₄ + 2 H₂O → 2 H₃O⁺ + CrO₄²⁻ |  |  |  | `h2cro4 + 2 h2o → 2 h3o + cromato` |
| 671 | BF₃ + HF + H₂O → H₃O⁺ + BF₄⁻ |  | Acido fluoroborico. |  | `bf3 + hf + h2o → h3o + tetrafluoroborato` |
| 672 | PF₅ + HF + H₂O → H₃O⁺ + PF₆⁻ |  | Acido esafluorofosforico. |  | `pf5 + hf + h2o → h3o + esafluorofosfato` |
| 673 | HNO₃ + 2 H₂SO₄ → NO₂⁺ + H₃O⁺ + 2 HSO₄⁻ |  | Miscela nitrante: NO₂⁺ è l'agente delle nitrazioni. |  | `hno3 + 2 h2so4 → nitronio + h3o + 2 idrogenosolfato` |

### 7.3 Idrolisi degli anioni (soluzioni basiche) e reazioni con OH⁻ e H₃O⁺ (17)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 674 | CO₃²⁻ + H₂O ⇌ HCO₃⁻ + OH⁻ |  | La soda (Na₂CO₃) in acqua è basica. |  | `co3 + h2o ⇌ hco3 + oh` |
| 675 | PO₄³⁻ + H₂O ⇌ HPO₄²⁻ + OH⁻ |  | Il fosfato trisodico è fortemente basico (sgrassanti). |  | `po4 + h2o ⇌ idrogenofosfato + oh` |
| 676 | CN⁻ + H₂O ⇌ HCN + OH⁻ |  |  |  | `cn + h2o ⇌ hcn + oh` |
| 677 | ClO⁻ + H₂O ⇌ HClO + OH⁻ |  |  |  | `ipoclorito + h2o ⇌ hclo + oh` |
| 678 | CH₃COO⁻ + H₂O ⇌ CH₃COOH + OH⁻ |  |  |  | `acetato + h2o ⇌ acido-acetico + oh` |
| 679 | C₂²⁻ + 2 H₂O → C₂H₂ + 2 OH⁻ |  |  |  | `acetiluro + 2 h2o → c2h2 + 2 oh` |
| 680 | O₂²⁻ + 2 H₂O → H₂O₂ + 2 OH⁻ |  |  |  | `perossido + 2 h2o → h2o2 + 2 oh` |
| 681 | CO₂ + OH⁻ → HCO₃⁻ |  | Assorbimento della CO₂ nel sangue e negli oceani. |  | `co2 + oh → hco3` |
| 682 | HCO₃⁻ + OH⁻ → CO₃²⁻ + H₂O |  |  |  | `hco3 + oh → co3 + h2o` |
| 683 | HCO₃⁻ + H₃O⁺ → CO₂ + 2 H₂O |  | Tampone bicarbonato del sangue. |  | `hco3 + h3o → co2 + 2 h2o` |
| 684 | CO₃²⁻ + 2 H₃O⁺ → CO₂ + 3 H₂O |  | Effervescenza dei carbonati negli acidi. |  | `co3 + 2 h3o → co2 + 3 h2o` |
| 685 | SO₂ + 2 OH⁻ → SO₃²⁻ + H₂O |  |  |  | `so2 + 2 oh → solfito + h2o` |
| 686 | H₂S + OH⁻ → HS⁻ + H₂O |  |  |  | `h2s + oh → idrogenosolfuro + h2o` |
| 687 | CH₃COOH + OH⁻ → CH₃COO⁻ + H₂O |  |  |  | `acido-acetico + oh → acetato + h2o` |
| 688 | O₂²⁻ + 2 H₃O⁺ → H₂O₂ + 2 H₂O |  |  |  | `perossido + 2 h3o → h2o2 + 2 h2o` |
| 689 | 2 CrO₄²⁻ + 2 H₃O⁺ → Cr₂O₇²⁻ + 3 H₂O |  | Il giallo del cromato diventa arancione in acido. |  | `2 cromato + 2 h3o → dicromato + 3 h2o` |
| 690 | Cr₂O₇²⁻ + 2 OH⁻ → 2 CrO₄²⁻ + H₂O |  | L'arancione torna giallo in base. |  | `dicromato + 2 oh → 2 cromato + h2o` |

### 7.4 Ossidoriduzioni tra ioni (8)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 691 | 2 MnO₄⁻ + 3 SO₃²⁻ + H₂O → 2 MnO₂ + 3 SO₄²⁻ + 2 OH⁻ | soluzione neutra | Il viola sparisce e precipita MnO₂ bruno. |  | `2 permanganato + 3 solfito + h2o → 2 mno2 + 3 so4 + 2 oh` |
| 692 | 2 MnO₄⁻ + 3 H₂O₂ → 2 MnO₂ + 3 O₂ + 2 OH⁻ + 2 H₂O | soluzione neutra o basica |  |  | `2 permanganato + 3 h2o2 → 2 mno2 + 3 o2 + 2 oh + 2 h2o` |
| 693 | 2 NH₄⁺ + Cr₂O₇²⁻ → Cr₂O₃ + N₂ + 4 H₂O | Δ | Il "vulcano" di dicromato d'ammonio (tossico). |  | `2 nh4 + dicromato → cr2o3 + n2 + 4 h2o` |
| 694 | NH₄⁺ + NO₂⁻ → N₂ + 2 H₂O | Δ o batteri anammox | Anammox: metà dell'azoto che torna in atmosfera dagli oceani. |  | `nh4 + nitrito → n2 + 2 h2o` |
| 695 | SO₃²⁻ + S → S₂O₃²⁻ | ebollizione |  |  | `solfito + el:S → tiosolfato` |
| 696 | BrO₃⁻ + 5 HBr + H₃O⁺ → 3 Br₂ + 4 H₂O | soluzione acida | Comproporzione bromato-bromuro: bromo "su misura" nelle titolazioni. |  | `bromato + 5 hbr + h3o → 3 br2 + 4 h2o` |
| 697 | 2 Tc + 2 OH⁻ + 7 H₂O₂ → 2 TcO₄⁻ + 8 H₂O | soluzione basica | Dissoluzione ossidativa del tecnezio. |  | `2 el:Tc + 2 oh + 7 h2o2 → 2 pertecnetato + 8 h2o` |
| 698 | CN⁻ + S₂O₃²⁻ → SCN⁻ + SO₃²⁻ | enzima rodanasi | Detossificazione del cianuro: il tiosolfato è l'antidoto. |  | `cn + tiosolfato → tiocianato + solfito` |

## 8. Precipitazioni (doppio scambio) (52)

> Due sali (o un sale e un acido o una base) in soluzione si scambiano gli ioni e si forma un solido poco solubile. Le soluzioni di partenza sono acquose.

### 8.1 Alogenuri e solfuri d'argento (8)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 699 | AgNO₃ + NaCl → AgCl + NaNO₃ | soluzione | Precipitato bianco: riconoscimento dei cloruri. |  | `agno3 + nacl → agcl + nano3` |
| 700 | AgNO₃ + KCl → AgCl + KNO₃ | soluzione |  |  | `agno3 + kcl → agcl + kno3` |
| 701 | AgNO₃ + HCl → AgCl + HNO₃ | soluzione |  |  | `agno3 + hcl → agcl + hno3` |
| 702 | AgNO₃ + NH₄Cl → AgCl + NH₄NO₃ | soluzione |  |  | `agno3 + nh4cl → agcl + nh4no3` |
| 703 | AgNO₃ + NaBr → AgBr + NaNO₃ | soluzione | Precipitato giallo pallido. |  | `agno3 + nabr → agbr + nano3` |
| 704 | AgNO₃ + KBr → AgBr + KNO₃ | soluzione | Preparazione delle emulsioni fotografiche. |  | `agno3 + kbr → agbr + kno3` |
| 705 | 2 AgNO₃ + Na₂S → Ag₂S + 2 NaNO₃ | soluzione | Precipitato nero. |  | `2 agno3 + na2s → ag2s + 2 nano3` |
| 706 | 2 AgNO₃ + H₂S → Ag₂S + 2 HNO₃ | soluzione |  |  | `2 agno3 + h2s → ag2s + 2 hno3` |

### 8.2 Sali di piombo (5)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 707 | Pb(NO₃)₂ + 2 KI → PbI₂ + 2 KNO₃ | soluzione | "Pioggia d'oro": cristalli gialli brillanti. |  | `pbno32 + 2 ki → pbi2 + 2 kno3` |
| 708 | Pb(NO₃)₂ + 2 NaI → PbI₂ + 2 NaNO₃ | soluzione |  |  | `pbno32 + 2 nai → pbi2 + 2 nano3` |
| 709 | Pb(NO₃)₂ + 2 HI → PbI₂ + 2 HNO₃ | soluzione |  |  | `pbno32 + 2 hi → pbi2 + 2 hno3` |
| 710 | Pb(NO₃)₂ + Na₂S → PbS + 2 NaNO₃ | soluzione | Precipitato nero. |  | `pbno32 + na2s → pbs + 2 nano3` |
| 711 | Pb(NO₃)₂ + H₂S → PbS + 2 HNO₃ | soluzione | Rivelazione di H₂S con la carta ai sali di piombo. |  | `pbno32 + h2s → pbs + 2 hno3` |

### 8.3 Solfato di bario (13)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 712 | BaCl₂ + Na₂SO₄ → BaSO₄ + 2 NaCl | soluzione | Precipitato bianco: riconoscimento dei solfati. |  | `bacl2 + na2so4 → baso4 + 2 nacl` |
| 713 | BaCl₂ + K₂SO₄ → BaSO₄ + 2 KCl | soluzione |  |  | `bacl2 + k2so4 → baso4 + 2 kcl` |
| 714 | BaCl₂ + H₂SO₄ → BaSO₄ + 2 HCl | soluzione |  |  | `bacl2 + h2so4 → baso4 + 2 hcl` |
| 715 | BaCl₂ + MgSO₄ → BaSO₄ + MgCl₂ | soluzione |  |  | `bacl2 + mgso4 → baso4 + mgcl2` |
| 716 | BaCl₂ + CuSO₄ → BaSO₄ + CuCl₂ | soluzione |  |  | `bacl2 + cuso4 → baso4 + cucl2` |
| 717 | BaCl₂ + ZnSO₄ → BaSO₄ + ZnCl₂ | soluzione |  |  | `bacl2 + znso4 → baso4 + zncl2` |
| 718 | BaCl₂ + FeSO₄ → BaSO₄ + FeCl₂ | soluzione |  |  | `bacl2 + feso4 → baso4 + fecl2` |
| 719 | BaCl₂ + (NH₄)₂SO₄ → BaSO₄ + 2 NH₄Cl | soluzione |  |  | `bacl2 + nh42so4 → baso4 + 2 nh4cl` |
| 720 | 3 BaCl₂ + Al₂(SO₄)₃ → 3 BaSO₄ + 2 AlCl₃ | soluzione |  |  | `3 bacl2 + al2so43 → 3 baso4 + 2 alcl3` |
| 721 | Ba(OH)₂ + Na₂SO₄ → BaSO₄ + 2 NaOH | soluzione |  |  | `baoh2 + na2so4 → baso4 + 2 naoh` |
| 722 | Ba(OH)₂ + K₂SO₄ → BaSO₄ + 2 KOH | soluzione |  |  | `baoh2 + k2so4 → baso4 + 2 koh` |
| 723 | Ba(OH)₂ + MgSO₄ → BaSO₄ + Mg(OH)₂ | soluzione | Precipitano due solidi. |  | `baoh2 + mgso4 → baso4 + mgoh2` |
| 724 | Ba(OH)₂ + CuSO₄ → BaSO₄ + Cu(OH)₂ | soluzione | Precipitano due solidi (bianco e azzurro). |  | `baoh2 + cuso4 → baso4 + cuoh2` |

### 8.4 Carbonati, fosfati, fluoruri e solfati di calcio e magnesio (11)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 725 | CaCl₂ + Na₂CO₃ → CaCO₃ + 2 NaCl | soluzione |  | −104 | `cacl2 + na2co3 → caco3 + 2 nacl` |
| 726 | CaCl₂ + K₂CO₃ → CaCO₃ + 2 KCl | soluzione |  |  | `cacl2 + k2co3 → caco3 + 2 kcl` |
| 727 | CaCl₂ + (NH₄)₂CO₃ → CaCO₃ + 2 NH₄Cl | soluzione |  |  | `cacl2 + nh42co3 → caco3 + 2 nh4cl` |
| 728 | Ca(OH)₂ + Na₂CO₃ → CaCO₃ + 2 NaOH | soluzione | Caustificazione: storica produzione della soda caustica. | 57 | `caoh2 + na2co3 → caco3 + 2 naoh` |
| 729 | CaSO₄ + Na₂CO₃ → CaCO₃ + Na₂SO₄ | soluzione | Addolcimento dell'acqua; restauro degli affreschi. |  | `caso4 + na2co3 → caco3 + na2so4` |
| 730 | 3 CaCl₂ + 2 Na₃PO₄ → Ca₃(PO₄)₂ + 6 NaCl | soluzione |  |  | `3 cacl2 + 2 na3po4 → ca3po42 + 6 nacl` |
| 731 | CaCl₂ + 2 NaF → CaF₂ + 2 NaCl | soluzione |  | −102 | `cacl2 + 2 naf → caf2 + 2 nacl` |
| 732 | CaCl₂ + 2 KF → CaF₂ + 2 KCl | soluzione |  |  | `cacl2 + 2 kf → caf2 + 2 kcl` |
| 733 | CaCl₂ + Na₂SO₄ → CaSO₄ + 2 NaCl | soluzione concentrata |  |  | `cacl2 + na2so4 → caso4 + 2 nacl` |
| 734 | MgCl₂ + Na₂CO₃ → MgCO₃ + 2 NaCl | soluzione |  |  | `mgcl2 + na2co3 → mgco3 + 2 nacl` |
| 735 | MgSO₄ + Na₂CO₃ → MgCO₃ + Na₂SO₄ | soluzione |  |  | `mgso4 + na2co3 → mgco3 + na2so4` |

### 8.5 Idrossidi (11)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 736 | CuSO₄ + 2 NaOH → Cu(OH)₂ + Na₂SO₄ | soluzione | Precipitato azzurro gelatinoso. |  | `cuso4 + 2 naoh → cuoh2 + na2so4` |
| 737 | CuSO₄ + 2 KOH → Cu(OH)₂ + K₂SO₄ | soluzione |  |  | `cuso4 + 2 koh → cuoh2 + k2so4` |
| 738 | CuCl₂ + 2 NaOH → Cu(OH)₂ + 2 NaCl | soluzione |  |  | `cucl2 + 2 naoh → cuoh2 + 2 nacl` |
| 739 | CuSO₄ + 2 NH₃ + 2 H₂O → Cu(OH)₂ + (NH₄)₂SO₄ | poca ammoniaca | Con altra ammoniaca il precipitato si scioglie in un complesso blu intenso (non in libreria). |  | `cuso4 + 2 nh3 + 2 h2o → cuoh2 + nh42so4` |
| 740 | MgCl₂ + 2 NaOH → Mg(OH)₂ + 2 NaCl | soluzione |  |  | `mgcl2 + 2 naoh → mgoh2 + 2 nacl` |
| 741 | MgSO₄ + 2 NaOH → Mg(OH)₂ + Na₂SO₄ | soluzione |  |  | `mgso4 + 2 naoh → mgoh2 + na2so4` |
| 742 | MgCl₂ + Ca(OH)₂ → Mg(OH)₂ + CaCl₂ | soluzione | Estrazione del magnesio dall'acqua di mare (processo Dow). |  | `mgcl2 + caoh2 → mgoh2 + cacl2` |
| 743 | AlCl₃ + 3 NaOH → Al(OH)₃ + 3 NaCl | soluzione |  |  | `alcl3 + 3 naoh → aloh3 + 3 nacl` |
| 744 | Al₂(SO₄)₃ + 6 NaOH → 2 Al(OH)₃ + 3 Na₂SO₄ | soluzione |  |  | `al2so43 + 6 naoh → 2 aloh3 + 3 na2so4` |
| 745 | Al₂(SO₄)₃ + 3 Ca(OH)₂ → 2 Al(OH)₃ + 3 CaSO₄ | soluzione | Flocculazione nella potabilizzazione dell'acqua. |  | `al2so43 + 3 caoh2 → 2 aloh3 + 3 caso4` |
| 746 | Al₂(SO₄)₃ + 6 NH₃ + 6 H₂O → 2 Al(OH)₃ + 3 (NH₄)₂SO₄ | soluzione |  |  | `al2so43 + 6 nh3 + 6 h2o → 2 aloh3 + 3 nh42so4` |

### 8.6 Solfuri (4)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 747 | ZnCl₂ + Na₂S → ZnS + 2 NaCl | soluzione | Precipitato bianco. |  | `zncl2 + na2s → zns + 2 nacl` |
| 748 | ZnSO₄ + Na₂S → ZnS + Na₂SO₄ | soluzione |  |  | `znso4 + na2s → zns + na2so4` |
| 749 | HgCl₂ + H₂S → HgS + 2 HCl | soluzione | Precipitato nero. |  | `hgcl2 + h2s → hgs + 2 hcl` |
| 750 | HgCl₂ + Na₂S → HgS + 2 NaCl | soluzione |  |  | `hgcl2 + na2s → hgs + 2 nacl` |

## 9. Spostamento (scambio semplice) (82)

> Un elemento più reattivo prende il posto di un altro in un composto: i metalli seguono la serie dei potenziali standard (K > Na > Ca > Mg > Al > Zn > Fe > Ni > Sn > Pb > H > Cu > Hg > Ag > Pd > Au), gli alogeni l'ordine F₂ > Cl₂ > Br₂ > I₂.

### 9.1 Metallo + acido non ossidante → sale + idrogeno (22)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 751 | Zn + 2 HCl → ZnCl₂ + H₂ |  | Preparazione dell'idrogeno in laboratorio. |  | `el:Zn + 2 hcl → zncl2 + h2` |
| 752 | Zn + H₂SO₄ → ZnSO₄ + H₂ | H₂SO₄ diluito | Apparecchio di Kipp. |  | `el:Zn + h2so4 → znso4 + h2` |
| 753 | Mg + 2 HCl → MgCl₂ + H₂ |  |  | −457 | `el:Mg + 2 hcl → mgcl2 + h2` |
| 754 | Mg + H₂SO₄ → MgSO₄ + H₂ | H₂SO₄ diluito |  |  | `el:Mg + h2so4 → mgso4 + h2` |
| 755 | Fe + 2 HCl → FeCl₂ + H₂ |  | Il ferro passa a Fe²⁺, non a Fe³⁺. |  | `el:Fe + 2 hcl → fecl2 + h2` |
| 756 | Fe + H₂SO₄ → FeSO₄ + H₂ | H₂SO₄ diluito |  |  | `el:Fe + h2so4 → feso4 + h2` |
| 757 | 2 Al + 6 HCl → 2 AlCl₃ + 3 H₂ |  | Lenta all'inizio: va prima sciolto lo strato di ossido. |  | `2 el:Al + 6 hcl → 2 alcl3 + 3 h2` |
| 758 | 2 Al + 3 H₂SO₄ → Al₂(SO₄)₃ + 3 H₂ | H₂SO₄ diluito, Δ |  |  | `2 el:Al + 3 h2so4 → al2so43 + 3 h2` |
| 759 | Ca + 2 HCl → CaCl₂ + H₂ |  |  | −611 | `el:Ca + 2 hcl → cacl2 + h2` |
| 760 | 2 Na + 2 HCl → 2 NaCl + H₂ |  | Violenta. | −638 | `2 el:Na + 2 hcl → 2 nacl + h2` |
| 761 | 2 K + 2 HCl → 2 KCl + H₂ |  | Violentissima. | −688 | `2 el:K + 2 hcl → 2 kcl + h2` |
| 762 | 2 Li + 2 HCl → 2 LiCl + H₂ |  |  | −633 | `2 el:Li + 2 hcl → 2 licl + h2` |
| 763 | 2 Rb + 2 HCl → 2 RbCl + H₂ |  | Esplosiva. |  | `2 el:Rb + 2 hcl → 2 rbcl + h2` |
| 764 | 2 Cs + 2 HCl → 2 CsCl + H₂ |  | Esplosiva. |  | `2 el:Cs + 2 hcl → 2 cscl + h2` |
| 765 | Be + 2 HCl → BeCl₂ + H₂ |  |  | −306 | `el:Be + 2 hcl → becl2 + h2` |
| 766 | Sr + 2 HCl → SrCl₂ + H₂ |  |  |  | `el:Sr + 2 hcl → srcl2 + h2` |
| 767 | Ba + 2 HCl → BaCl₂ + H₂ |  |  |  | `el:Ba + 2 hcl → bacl2 + h2` |
| 768 | Ra + 2 HCl → RaCl₂ + H₂ |  |  |  | `el:Ra + 2 hcl → racl2 + h2` |
| 769 | Co + 2 HCl → CoCl₂ + H₂ | lenta |  |  | `el:Co + 2 hcl → cocl2 + h2` |
| 770 | Ni + H₂SO₄ → NiSO₄ + H₂ | lenta |  |  | `el:Ni + h2so4 → niso4 + h2` |
| 771 | Sn + 2 HCl → SnCl₂ + H₂ | Δ |  |  | `el:Sn + 2 hcl → sncl2 + h2` |
| 772 | 2 Tl + H₂SO₄ → Tl₂SO₄ + H₂ | H₂SO₄ diluito |  |  | `2 el:Tl + h2so4 → tl2so4 + h2` |

### 9.2 Metallo + sale di un metallo meno reattivo (37)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 773 | Zn + CuSO₄ → ZnSO₄ + Cu | soluzione | Pila Daniell: lo zinco si ricopre di rame rosso. |  | `el:Zn + cuso4 → znso4 + el:Cu` |
| 774 | Fe + CuSO₄ → FeSO₄ + Cu | soluzione | Il chiodo di ferro si ramifica (era scambiata per "trasmutazione"). |  | `el:Fe + cuso4 → feso4 + el:Cu` |
| 775 | Mg + CuSO₄ → MgSO₄ + Cu | soluzione |  |  | `el:Mg + cuso4 → mgso4 + el:Cu` |
| 776 | 2 Al + 3 CuSO₄ → Al₂(SO₄)₃ + 3 Cu | soluzione, lenta | Lo strato di ossido rallenta la reazione. |  | `2 el:Al + 3 cuso4 → al2so43 + 3 el:Cu` |
| 777 | Ni + CuSO₄ → NiSO₄ + Cu | soluzione |  |  | `el:Ni + cuso4 → niso4 + el:Cu` |
| 778 | Zn + CuCl₂ → ZnCl₂ + Cu | soluzione |  |  | `el:Zn + cucl2 → zncl2 + el:Cu` |
| 779 | Fe + CuCl₂ → FeCl₂ + Cu | soluzione |  |  | `el:Fe + cucl2 → fecl2 + el:Cu` |
| 780 | Mg + CuCl₂ → MgCl₂ + Cu | soluzione |  |  | `el:Mg + cucl2 → mgcl2 + el:Cu` |
| 781 | 2 Al + 3 CuCl₂ → 2 AlCl₃ + 3 Cu | soluzione | Veloce: gli ioni cloruro attaccano lo strato di ossido. |  | `2 el:Al + 3 cucl2 → 2 alcl3 + 3 el:Cu` |
| 782 | Sn + CuCl₂ → SnCl₂ + Cu | soluzione |  |  | `el:Sn + cucl2 → sncl2 + el:Cu` |
| 783 | Mg + ZnSO₄ → MgSO₄ + Zn | soluzione |  |  | `el:Mg + znso4 → mgso4 + el:Zn` |
| 784 | Mg + ZnCl₂ → MgCl₂ + Zn | soluzione |  |  | `el:Mg + zncl2 → mgcl2 + el:Zn` |
| 785 | 2 Al + 3 ZnCl₂ → 2 AlCl₃ + 3 Zn | soluzione |  |  | `2 el:Al + 3 zncl2 → 2 alcl3 + 3 el:Zn` |
| 786 | Zn + FeSO₄ → ZnSO₄ + Fe | soluzione | Principio della zincatura (protezione catodica). |  | `el:Zn + feso4 → znso4 + el:Fe` |
| 787 | Mg + FeSO₄ → MgSO₄ + Fe | soluzione |  |  | `el:Mg + feso4 → mgso4 + el:Fe` |
| 788 | Zn + FeCl₂ → ZnCl₂ + Fe | soluzione |  |  | `el:Zn + fecl2 → zncl2 + el:Fe` |
| 789 | Al + FeCl₃ → AlCl₃ + Fe | soluzione |  |  | `el:Al + fecl3 → alcl3 + el:Fe` |
| 790 | Zn + NiSO₄ → ZnSO₄ + Ni | soluzione |  |  | `el:Zn + niso4 → znso4 + el:Ni` |
| 791 | Fe + NiSO₄ → FeSO₄ + Ni | soluzione |  |  | `el:Fe + niso4 → feso4 + el:Ni` |
| 792 | Zn + CoCl₂ → ZnCl₂ + Co | soluzione |  |  | `el:Zn + cocl2 → zncl2 + el:Co` |
| 793 | Mg + CoCl₂ → MgCl₂ + Co | soluzione |  |  | `el:Mg + cocl2 → mgcl2 + el:Co` |
| 794 | Zn + SnCl₂ → ZnCl₂ + Sn | soluzione | "Albero di stagno". |  | `el:Zn + sncl2 → zncl2 + el:Sn` |
| 795 | Fe + SnCl₂ → FeCl₂ + Sn | soluzione |  |  | `el:Fe + sncl2 → fecl2 + el:Sn` |
| 796 | Cu + HgCl₂ → CuCl₂ + Hg | soluzione | Il rame si "argenta" di mercurio. |  | `el:Cu + hgcl2 → cucl2 + el:Hg` |
| 797 | Zn + HgCl₂ → ZnCl₂ + Hg | soluzione |  |  | `el:Zn + hgcl2 → zncl2 + el:Hg` |
| 798 | Fe + HgCl₂ → FeCl₂ + Hg | soluzione |  |  | `el:Fe + hgcl2 → fecl2 + el:Hg` |
| 799 | Zn + PdCl₂ → ZnCl₂ + Pd | soluzione |  |  | `el:Zn + pdcl2 → zncl2 + el:Pd` |
| 800 | Fe + PdCl₂ → FeCl₂ + Pd | soluzione |  |  | `el:Fe + pdcl2 → fecl2 + el:Pd` |
| 801 | Cu + PdCl₂ → CuCl₂ + Pd | soluzione |  |  | `el:Cu + pdcl2 → cucl2 + el:Pd` |
| 802 | 3 Zn + 2 RhCl₃ → 3 ZnCl₂ + 2 Rh | soluzione | Recupero del rodio. |  | `3 el:Zn + 2 rhcl3 → 3 zncl2 + 2 el:Rh` |
| 803 | 3 Zn + 2 AuCl₃ → 3 ZnCl₂ + 2 Au | soluzione | Recupero dell'oro dalle soluzioni. |  | `3 el:Zn + 2 aucl3 → 3 zncl2 + 2 el:Au` |
| 804 | 3 Fe + 2 AuCl₃ → 3 FeCl₂ + 2 Au | soluzione |  |  | `3 el:Fe + 2 aucl3 → 3 fecl2 + 2 el:Au` |
| 805 | 3 Cu + 2 AuCl₃ → 3 CuCl₂ + 2 Au | soluzione |  |  | `3 el:Cu + 2 aucl3 → 3 cucl2 + 2 el:Au` |
| 806 | Cu + 2 FeCl₃ → CuCl₂ + 2 FeCl₂ | soluzione | Incisione dei circuiti stampati. |  | `el:Cu + 2 fecl3 → cucl2 + 2 fecl2` |
| 807 | 2 Mg + TiCl₄ → 2 MgCl₂ + Ti | 800 °C, argon | Processo Kroll: produzione del titanio. |  | `2 el:Mg + ticl4 → 2 mgcl2 + el:Ti` |
| 808 | 4 Na + TiCl₄ → 4 NaCl + Ti | Δ, argon | Processo Hunter. |  | `4 el:Na + ticl4 → 4 nacl + el:Ti` |
| 809 | Na + KCl → NaCl + K | 850 °C, il potassio distilla | Produzione industriale del potassio. | 25 | `el:Na + kcl → nacl + el:K` |

### 9.3 Alogeno + alogenuro o idracido (17)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 810 | Cl₂ + 2 KBr → 2 KCl + Br₂ | soluzione | La soluzione diventa arancione. | −85 | `cl2 + 2 kbr → 2 kcl + br2` |
| 811 | Cl₂ + 2 NaBr → 2 NaCl + Br₂ | soluzione | Estrazione del bromo dall'acqua di mare. |  | `cl2 + 2 nabr → 2 nacl + br2` |
| 812 | Cl₂ + 2 KI → 2 KCl + I₂ | soluzione | La soluzione diventa bruna. | −217 | `cl2 + 2 ki → 2 kcl + i2` |
| 813 | Cl₂ + 2 NaI → 2 NaCl + I₂ | soluzione |  |  | `cl2 + 2 nai → 2 nacl + i2` |
| 814 | Br₂ + 2 KI → 2 KBr + I₂ | soluzione |  | −132 | `br2 + 2 ki → 2 kbr + i2` |
| 815 | Br₂ + 2 NaI → 2 NaBr + I₂ | soluzione |  |  | `br2 + 2 nai → 2 nabr + i2` |
| 816 | F₂ + 2 NaCl → 2 NaF + Cl₂ |  |  | −331 | `f2 + 2 nacl → 2 naf + cl2` |
| 817 | F₂ + 2 KCl → 2 KF + Cl₂ |  |  |  | `f2 + 2 kcl → 2 kf + cl2` |
| 818 | F₂ + 2 KBr → 2 KF + Br₂ |  |  |  | `f2 + 2 kbr → 2 kf + br2` |
| 819 | F₂ + 2 KI → 2 KF + I₂ |  |  |  | `f2 + 2 ki → 2 kf + i2` |
| 820 | Cl₂ + 2 HBr → 2 HCl + Br₂ |  |  | −112 | `cl2 + 2 hbr → 2 hcl + br2` |
| 821 | Cl₂ + 2 HI → 2 HCl + I₂ |  |  | −238 | `cl2 + 2 hi → 2 hcl + i2` |
| 822 | Br₂ + 2 HI → 2 HBr + I₂ |  |  | −126 | `br2 + 2 hi → 2 hbr + i2` |
| 823 | Cl₂ + H₂S → 2 HCl + S |  |  | −164 | `cl2 + h2s → 2 hcl + el:S` |
| 824 | Br₂ + H₂S → 2 HBr + S |  |  | −52 | `br2 + h2s → 2 hbr + el:S` |
| 825 | I₂ + H₂S → 2 HI + S | soluzione | Iodometria dei solfuri. | 74 | `i2 + h2s → 2 hi + el:S` |
| 826 | Cl₂ + Na₂S → 2 NaCl + S | soluzione |  |  | `cl2 + na2s → 2 nacl + el:S` |

### 9.4 Scambio di alogeno nei composti covalenti (6)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 827 | 3 SCl₂ + 4 NaF → SF₄ + S₂Cl₂ + 4 NaCl | Δ, acetonitrile | Preparazione del tetrafluoruro di zolfo. |  | `3 scl2 + 4 naf → sf4 + s2cl2 + 4 nacl` |
| 828 | PCl₃ + 3 HF → PF₃ + 3 HCl |  |  |  | `pcl3 + 3 hf → pf3 + 3 hcl` |
| 829 | CCl₄ + 2 HF → CCl₂F₂ + 2 HCl | cat. SbCl₅ | Sintesi del Freon-12 (CFC, oggi vietato: distrugge l'ozono). |  | `ccl4 + 2 hf → cfc-12 + 2 hcl` |
| 830 | SO₂ + PCl₅ → SOCl₂ + POCl₃ |  | Preparazione del cloruro di tionile. |  | `so2 + pcl5 → socl2 + pocl3` |
| 831 | SO₃ + SCl₂ → SOCl₂ + SO₂ |  | Produzione industriale del cloruro di tionile. |  | `so3 + scl2 → socl2 + so2` |
| 832 | 6 PCl₅ + P₄O₁₀ → 10 POCl₃ | Δ | Produzione dell'ossicloruro di fosforo. |  | `6 pcl5 + p4o10 → 10 pocl3` |

## 10. Ossidoriduzioni (102)

> Reazioni con trasferimento di elettroni che non rientrano nelle sezioni precedenti, ordinate per ossidante.

### 10.1 Acidi ossidanti (HNO₃, H₂SO₄ concentrato, acqua regia) (18)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 833 | Cu + 2 H₂SO₄ → CuSO₄ + SO₂ + 2 H₂O | H₂SO₄ concentrato, Δ | Il rame non reagisce con gli acidi diluiti. |  | `el:Cu + 2 h2so4 → cuso4 + so2 + 2 h2o` |
| 834 | Ag + 2 HNO₃ → AgNO₃ + NO₂ + H₂O | HNO₃ concentrato | "Acqua forte": separa l'argento dall'oro. |  | `el:Ag + 2 hno3 → agno3 + no2 + h2o` |
| 835 | 3 Ag + 4 HNO₃ → 3 AgNO₃ + NO + 2 H₂O | HNO₃ diluito |  |  | `3 el:Ag + 4 hno3 → 3 agno3 + no + 2 h2o` |
| 836 | 3 Pb + 8 HNO₃ → 3 Pb(NO₃)₂ + 2 NO + 4 H₂O | HNO₃ diluito |  |  | `3 el:Pb + 8 hno3 → 3 pbno32 + 2 no + 4 h2o` |
| 837 | Au + HNO₃ + 3 HCl → AuCl₃ + NO + 2 H₂O | acqua regia | Solo l'acqua regia scioglie l'oro (in realtà come HAuCl₄). |  | `el:Au + hno3 + 3 hcl → aucl3 + no + 2 h2o` |
| 838 | HNO₃ + 3 HCl → NOCl + Cl₂ + 2 H₂O |  | Le specie attive dell'acqua regia. |  | `hno3 + 3 hcl → nocl + cl2 + 2 h2o` |
| 839 | C + 2 H₂SO₄ → CO₂ + 2 SO₂ + 2 H₂O | H₂SO₄ concentrato, Δ |  | 69 | `el:C + 2 h2so4 → co2 + 2 so2 + 2 h2o` |
| 840 | C + 4 HNO₃ → CO₂ + 4 NO₂ + 2 H₂O | HNO₃ concentrato, Δ |  | −136 | `el:C + 4 hno3 → co2 + 4 no2 + 2 h2o` |
| 841 | S + 2 H₂SO₄ → 3 SO₂ + 2 H₂O | H₂SO₄ concentrato, Δ |  | 166 | `el:S + 2 h2so4 → 3 so2 + 2 h2o` |
| 842 | S + 6 HNO₃ → H₂SO₄ + 6 NO₂ + 2 H₂O | HNO₃ concentrato, Δ |  | −142 | `el:S + 6 hno3 → h2so4 + 6 no2 + 2 h2o` |
| 843 | P₄ + 20 HNO₃ → 4 H₃PO₄ + 20 NO₂ + 4 H₂O | HNO₃ concentrato |  |  | `p4 + 20 hno3 → 4 h3po4 + 20 no2 + 4 h2o` |
| 844 | I₂ + 10 HNO₃ → 2 HIO₃ + 10 NO₂ + 4 H₂O | HNO₃ fumante | Preparazione dell'acido iodico. |  | `i2 + 10 hno3 → 2 hio3 + 10 no2 + 4 h2o` |
| 845 | 2 KBr + 2 H₂SO₄ → K₂SO₄ + Br₂ + SO₂ + 2 H₂O | H₂SO₄ concentrato | Per questo HBr non si prepara con l'acido solforico concentrato. |  | `2 kbr + 2 h2so4 → k2so4 + br2 + so2 + 2 h2o` |
| 846 | 8 KI + 5 H₂SO₄ → 4 K₂SO₄ + 4 I₂ + H₂S + 4 H₂O | H₂SO₄ concentrato |  |  | `8 ki + 5 h2so4 → 4 k2so4 + 4 i2 + h2s + 4 h2o` |
| 847 | 2 HBr + H₂SO₄ → Br₂ + SO₂ + 2 H₂O | H₂SO₄ concentrato |  | 18 | `2 hbr + h2so4 → br2 + so2 + 2 h2o` |
| 848 | 8 HI + H₂SO₄ → 4 I₂ + H₂S + 4 H₂O | H₂SO₄ concentrato |  | −562 | `8 hi + h2so4 → 4 i2 + h2s + 4 h2o` |
| 849 | H₂S + H₂SO₄ → S + SO₂ + 2 H₂O | H₂SO₄ concentrato |  | −34 | `h2s + h2so4 → el:S + so2 + 2 h2o` |
| 850 | Cu₂O + H₂SO₄ → CuSO₄ + Cu + H₂O | H₂SO₄ diluito | Disproporzione del rame(I). |  | `cu2o + h2so4 → cuso4 + el:Cu + h2o` |

### 10.2 Ossigeno e aria (8)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 851 | 4 HCl + O₂ → 2 Cl₂ + 2 H₂O | cat. CuCl₂, 400 °C | Processo Deacon. | −202 | `4 hcl + o2 → 2 cl2 + 2 h2o` |
| 852 | 4 HBr + O₂ → 2 Br₂ + 2 H₂O |  |  | −426 | `4 hbr + o2 → 2 br2 + 2 h2o` |
| 853 | 4 HI + O₂ → 2 I₂ + 2 H₂O |  | Le soluzioni di HI imbruniscono all'aria. | −678 | `4 hi + o2 → 2 i2 + 2 h2o` |
| 854 | 4 Ag + 2 H₂S + O₂ → 2 Ag₂S + 2 H₂O | aria | Annerimento dell'argento. |  | `4 el:Ag + 2 h2s + o2 → 2 ag2s + 2 h2o` |
| 855 | TiCl₄ + O₂ → TiO₂ + 2 Cl₂ | 1000 °C | Processo al cloruro: pigmento bianco TiO₂ e recupero del cloro. |  | `ticl4 + o2 → tio2 + 2 cl2` |
| 856 | 2 CCl₄ + O₂ → 2 COCl₂ + 2 Cl₂ | fiamma | Per questo gli estintori al CCl₄ sono stati vietati. |  | `2 ccl4 + o2 → 2 fosgene + 2 cl2` |
| 857 | 2 CHCl₃ + O₂ → 2 COCl₂ + 2 HCl | luce | Il cloroformio si conserva al buio, con un po' di etanolo. |  | `2 chcl3 + o2 → 2 fosgene + 2 hcl` |
| 858 | 4 KMnO₄ + 2 H₂O → 4 MnO₂ + 3 O₂ + 4 KOH | luce, lenta | Le soluzioni di permanganato si decompongono lentamente. |  | `4 kmno4 + 2 h2o → 4 mno2 + 3 o2 + 4 koh` |

### 10.3 Perossido di idrogeno e perossidi (12)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 859 | H₂O₂ + 2 KI + H₂SO₄ → I₂ + K₂SO₄ + 2 H₂O | soluzione |  |  | `h2o2 + 2 ki + h2so4 → i2 + k2so4 + 2 h2o` |
| 860 | H₂O₂ + 2 HI → I₂ + 2 H₂O | soluzione |  | −437 | `h2o2 + 2 hi → i2 + 2 h2o` |
| 861 | H₂O₂ + H₂S → S + 2 H₂O | soluzione |  | −363 | `h2o2 + h2s → el:S + 2 h2o` |
| 862 | H₂O₂ + SO₂ → H₂SO₄ |  | Determinazione di SO₂ nel vino. | −329 | `h2o2 + so2 → h2so4` |
| 863 | H₂O₂ + Na₂SO₃ → Na₂SO₄ + H₂O | soluzione |  |  | `h2o2 + na2so3 → na2so4 + h2o` |
| 864 | H₂O₂ + HNO₂ → HNO₃ + H₂O | soluzione |  |  | `h2o2 + hno2 → hno3 + h2o` |
| 865 | H₂O₂ + NaClO → NaCl + O₂ + H₂O | soluzione | Si libera ossigeno singoletto (debole luce rossa). |  | `h2o2 + naclo → nacl + o2 + h2o` |
| 866 | H₂O₂ + Cl₂ → 2 HCl + O₂ | soluzione |  | 3 | `h2o2 + cl2 → 2 hcl + o2` |
| 867 | H₂O₂ + O₃ → H₂O + 2 O₂ |  | "Perossone": ossidazione avanzata nel trattamento delle acque. | −241 | `h2o2 + o3 → h2o + 2 o2` |
| 868 | Na₂O₂ + H₂SO₄ → Na₂SO₄ + H₂O₂ | freddo | Preparazione storica dell'acqua ossigenata. |  | `na2o2 + h2so4 → na2so4 + h2o2` |
| 869 | 2 KMnO₄ + 3 H₂O₂ → 2 MnO₂ + 2 KOH + 3 O₂ + 2 H₂O | soluzione neutra |  |  | `2 kmno4 + 3 h2o2 → 2 mno2 + 2 koh + 3 o2 + 2 h2o` |
| 870 | N₂H₄ + 2 H₂O₂ → N₂ + 4 H₂O | cat. | Propellente per razzi. | −818 | `n2h4 + 2 h2o2 → n2 + 4 h2o` |

### 10.4 Ozono (6)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 871 | O₃ + 2 KI + H₂O → I₂ + 2 KOH + O₂ |  | Rivelazione dell'ozono con le cartine allo ioduro. | −50 | `o3 + 2 ki + h2o → i2 + 2 koh + o2` |
| 872 | O₃ + NO → NO₂ + O₂ |  | Smog fotochimico; distruzione dell'ozono stratosferico. | −201 | `o3 + no → no2 + o2` |
| 873 | O₃ + 2 NO₂ → N₂O₅ + O₂ |  |  |  | `o3 + 2 no2 → n2o5 + o2` |
| 874 | O₃ + 3 SO₂ → 3 SO₃ |  |  | −575 | `o3 + 3 so2 → 3 so3` |
| 875 | O₃ + CO → CO₂ + O₂ |  |  | −426 | `o3 + co → co2 + o2` |
| 876 | O₃ + H₂S → SO₂ + H₂O |  | Deodorizzazione con l'ozono. | −705 | `o3 + h2s → so2 + h2o` |

### 10.5 Cloro e ipoclorito (11)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 877 | Cl₂ + SO₂ + 2 H₂O → H₂SO₄ + 2 HCl |  |  | −130 | `cl2 + so2 + 2 h2o → h2so4 + 2 hcl` |
| 878 | Cl₂ + Na₂SO₃ + H₂O → Na₂SO₄ + 2 HCl |  | Il solfito elimina il cloro in eccesso. |  | `cl2 + na2so3 + h2o → na2so4 + 2 hcl` |
| 879 | 4 Cl₂ + Na₂S₂O₃ + 5 H₂O → Na₂SO₄ + H₂SO₄ + 8 HCl |  | "Anticloro" nell'industria tessile e negli acquari. |  | `4 cl2 + na2s2o3 + 5 h2o → na2so4 + h2so4 + 8 hcl` |
| 880 | 3 Cl₂ + 2 NH₃ → N₂ + 6 HCl |  |  | −462 | `3 cl2 + 2 nh3 → n2 + 6 hcl` |
| 881 | 3 Cl₂ + 8 NH₃ → N₂ + 6 NH₄Cl |  | Fumo bianco: le perdite di cloro si cercano con l'ammoniaca. | −1519 | `3 cl2 + 8 nh3 → n2 + 6 nh4cl` |
| 882 | 3 Cl₂ + NH₃ → NCl₃ + 3 HCl | cloro in eccesso |  |  | `3 cl2 + nh3 → ncl3 + 3 hcl` |
| 883 | 2 Cl₂ + HgO → Cl₂O + HgCl₂ |  | Preparazione del monossido di dicloro. |  | `2 cl2 + hgo → cl2o + hgcl2` |
| 884 | 3 Cl₂ + CS₂ → CCl₄ + S₂Cl₂ | cat. Fe | Produzione industriale del tetracloruro di carbonio. |  | `3 cl2 + cs2 → ccl4 + s2cl2` |
| 885 | NaClO + 2 KI + H₂O → NaCl + I₂ + 2 KOH | soluzione |  |  | `naclo + 2 ki + h2o → nacl + i2 + 2 koh` |
| 886 | NaClO + Na₂SO₃ → NaCl + Na₂SO₄ | soluzione |  |  | `naclo + na2so3 → nacl + na2so4` |
| 887 | NaClO + PbO → NaCl + PbO₂ | soluzione basica | Preparazione del biossido di piombo. |  | `naclo + pbo → nacl + pbo2` |

### 10.6 Permanganato e dicromato (6)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 888 | 2 KMnO₄ + 3 Na₂SO₃ + H₂O → 2 MnO₂ + 3 Na₂SO₄ + 2 KOH | soluzione neutra |  |  | `2 kmno4 + 3 na2so3 + h2o → 2 mno2 + 3 na2so4 + 2 koh` |
| 889 | 2 KMnO₄ + 3 H₂S → 2 MnO₂ + 3 S + 2 KOH + 2 H₂O | soluzione |  |  | `2 kmno4 + 3 h2s → 2 mno2 + 3 el:S + 2 koh + 2 h2o` |
| 890 | K₂Cr₂O₇ + 2 KOH → 2 K₂CrO₄ + H₂O | soluzione | Da arancione a giallo. |  | `k2cr2o7 + 2 koh → 2 k2cro4 + h2o` |
| 891 | 2 K₂CrO₄ + H₂SO₄ → K₂Cr₂O₇ + K₂SO₄ + H₂O | soluzione | Da giallo ad arancione. |  | `2 k2cro4 + h2so4 → k2cr2o7 + k2so4 + h2o` |
| 892 | K₂Cr₂O₇ + S → Cr₂O₃ + K₂SO₄ | Δ | Preparazione dell'ossido di cromo (pigmento verde). |  | `k2cr2o7 + el:S → cr2o3 + k2so4` |
| 893 | K₂Cr₂O₇ + 2 C → Cr₂O₃ + K₂CO₃ + CO | Δ |  |  | `k2cr2o7 + 2 el:C → cr2o3 + k2co3 + co` |

### 10.7 Clorati, perclorati e nitrati: pirotecnica ed esplosivi (15)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 894 | KClO₃ + 6 HCl → KCl + 3 Cl₂ + 3 H₂O |  |  |  | `kclo3 + 6 hcl → kcl + 3 cl2 + 3 h2o` |
| 895 | 2 KClO₃ + 4 HCl → 2 ClO₂ + Cl₂ + 2 KCl + 2 H₂O |  | Produzione del diossido di cloro. |  | `2 kclo3 + 4 hcl → 2 clo2 + cl2 + 2 kcl + 2 h2o` |
| 896 | 2 KClO₃ + HOOC–COOH + H₂SO₄ → K₂SO₄ + 2 ClO₂ + 2 CO₂ + 2 H₂O | Δ blando | ClO₂ in laboratorio, diluito dalla CO₂. |  | `2 kclo3 + acido-ossalico + h2so4 → k2so4 + 2 clo2 + 2 co2 + 2 h2o` |
| 897 | 2 KClO₃ + 3 S → 2 KCl + 3 SO₂ | innesco | Miscela sensibile all'urto: vietata nei fuochi d'artificio. |  | `2 kclo3 + 3 el:S → 2 kcl + 3 so2` |
| 898 | 2 KClO₃ + 3 C → 2 KCl + 3 CO₂ | innesco |  |  | `2 kclo3 + 3 el:C → 2 kcl + 3 co2` |
| 899 | 10 KClO₃ + 3 P₄ → 10 KCl + 3 P₄O₁₀ | sfregamento | Fiammiferi (nella realtà si usa fosforo rosso). |  | `10 kclo3 + 3 p4 → 10 kcl + 3 p4o10` |
| 900 | 8 KClO₃ + C₁₂H₂₂O₁₁ → 8 KCl + 12 CO₂ + 11 H₂O | una goccia di H₂SO₄ | Lo zucchero brucia con fiamma viola. |  | `8 kclo3 + saccarosio → 8 kcl + 12 co2 + 11 h2o` |
| 901 | KClO₄ + 4 Mg → KCl + 4 MgO | innesco | Polvere flash. |  | `kclo4 + 4 el:Mg → kcl + 4 mgo` |
| 902 | 3 KClO₄ + 8 Al → 3 KCl + 4 Al₂O₃ | innesco | Polvere flash dei fuochi d'artificio. |  | `3 kclo4 + 8 el:Al → 3 kcl + 4 al2o3` |
| 903 | 6 NH₄ClO₄ + 10 Al → 5 Al₂O₃ + 3 N₂ + 6 HCl + 9 H₂O | innesco | Propellente solido dei booster dello Space Shuttle. |  | `6 nh4clo4 + 10 el:Al → 5 al2o3 + 3 n2 + 6 hcl + 9 h2o` |
| 904 | 10 KNO₃ + 3 S + 8 C → 2 K₂CO₃ + 3 K₂SO₄ + 6 CO₂ + 5 N₂ | innesco | Polvere nera (equazione semplificata: i prodotti reali comprendono K₂S). |  | `10 kno3 + 3 el:S + 8 el:C → 2 k2co3 + 3 k2so4 + 6 co2 + 5 n2` |
| 905 | 4 KNO₃ + 5 C → 2 K₂CO₃ + 3 CO₂ + 2 N₂ | innesco |  |  | `4 kno3 + 5 el:C → 2 k2co3 + 3 co2 + 2 n2` |
| 906 | 48 KNO₃ + 5 C₁₂H₂₂O₁₁ → 24 K₂CO₃ + 24 N₂ + 36 CO₂ + 55 H₂O | innesco | "Rocket candy": propellente dei razzi amatoriali. |  | `48 kno3 + 5 saccarosio → 24 k2co3 + 24 n2 + 36 co2 + 55 h2o` |
| 907 | 10 NaN₃ + 2 KNO₃ → K₂O + 5 Na₂O + 16 N₂ | innesco elettrico | Generatore degli airbag: il nitrato elimina il sodio metallico. |  | `10 nan3 + 2 kno3 → k2o + 5 na2o + 16 n2` |
| 908 | 31 NH₄NO₃ + C₁₀H₂₂ → 10 CO₂ + 31 N₂ + 73 H₂O | detonatore | ANFO (il decano rappresenta il gasolio). |  | `31 nh4no3 + decano → 10 co2 + 31 n2 + 73 h2o` |

### 10.8 Composti dell'azoto, dello zolfo e altri (26)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 909 | 2 N₂H₄ + N₂O₄ → 3 N₂ + 4 H₂O | ipergolica (si accende al contatto) | Propellente dei moduli Apollo e dei satelliti. |  | `2 n2h4 + n2o4 → 3 n2 + 4 h2o` |
| 910 | NaNO₂ + NH₄Cl → NaCl + N₂ + 2 H₂O | Δ | Preparazione dell'azoto in laboratorio. |  | `nano2 + nh4cl → nacl + n2 + 2 h2o` |
| 911 | 2 NaNH₂ + N₂O → NaN₃ + NaOH + NH₃ | 190 °C | Processo Wislicenus: l'azoturo degli airbag. |  | `2 nanh2 + n2o → nan3 + naoh + nh3` |
| 912 | 2 Na + 2 NH₃ → 2 NaNH₂ + H₂ | cat. Fe |  |  | `2 el:Na + 2 nh3 → 2 nanh2 + h2` |
| 913 | 2 H₂S + SO₂ → 3 S + 2 H₂O | cat. Al₂O₃ | Processo Claus: recupero dello zolfo dal gas naturale. | −234 | `2 h2s + so2 → 3 el:S + 2 h2o` |
| 914 | SO₂ + NO₂ → SO₃ + NO |  | Processo delle camere di piombo (storico). | −86 | `so2 + no2 → so3 + no` |
| 915 | CO + NO₂ → CO₂ + NO |  |  | −225 | `co + no2 → co2 + no` |
| 916 | 2 CO + 2 NO → 2 CO₂ + N₂ | cat. Pt/Rh | Marmitta catalitica. | −749 | `2 co + 2 no → 2 co2 + n2` |
| 917 | 2 NO + 2 H₂ → N₂ + 2 H₂O | cat. Pt |  | −754 | `2 no + 2 h2 → n2 + 2 h2o` |
| 918 | N₂O + H₂ → N₂ + H₂O | cat. |  | −367 | `n2o + h2 → n2 + h2o` |
| 919 | N₂O + CO → N₂ + CO₂ | cat. |  | −365 | `n2o + co → n2 + co2` |
| 920 | 4 NH₃ + 6 NO → 5 N₂ + 6 H₂O | cat. V₂O₅/TiO₂ | Riduzione catalitica selettiva (SCR, AdBlue). | −2079 | `4 nh3 + 6 no → 5 n2 + 6 h2o` |
| 921 | 4 NH₃ + 4 NO + O₂ → 4 N₂ + 6 H₂O | cat. | SCR "standard" con l'ossigeno dei fumi. | −1896 | `4 nh3 + 4 no + o2 → 4 n2 + 6 h2o` |
| 922 | 8 NH₃ + 6 NO₂ → 7 N₂ + 12 H₂O | cat. |  | −3261 | `8 nh3 + 6 no2 → 7 n2 + 12 h2o` |
| 923 | NH₃ + 3 F₂ → NF₃ + 3 HF | cat. Cu | Il trifluoruro di azoto pulisce i reattori dei chip. | −906 | `nh3 + 3 f2 → nf3 + 3 hf` |
| 924 | UO₂ + 3 F₂ → UF₆ + O₂ | Δ | Fluorurazione diretta del combustibile nucleare. |  | `uo2 + 3 f2 → uf6 + o2` |
| 925 | U + 3 ClF₃ → UF₆ + 3 ClF | Δ |  |  | `el:U + 3 clf3 → uf6 + 3 clf` |
| 926 | 2 Tc + 2 NaOH + 7 H₂O₂ → 2 NaTcO₄ + 8 H₂O | soluzione basica | Il pertecnetato è la forma del tecnezio-99m usata in medicina nucleare. |  | `2 el:Tc + 2 naoh + 7 h2o2 → 2 natco4 + 8 h2o` |
| 927 | XeF₂ + 2 HCl → Xe + Cl₂ + 2 HF |  | XeF₂ è un ossidante e fluorurante pulito: lascia solo xeno. |  | `xef2 + 2 hcl → el:Xe + cl2 + 2 hf` |
| 928 | HIO₃ + 5 HI → 3 I₂ + 3 H₂O | soluzione | Comproporzione dello iodio (reazione "orologio"). |  | `hio3 + 5 hi → 3 i2 + 3 h2o` |
| 929 | 2 FeCl₃ + H₂S → 2 FeCl₂ + S + 2 HCl | soluzione |  |  | `2 fecl3 + h2s → 2 fecl2 + el:S + 2 hcl` |
| 930 | 2 FeCl₃ + 2 KI → 2 FeCl₂ + I₂ + 2 KCl | soluzione |  |  | `2 fecl3 + 2 ki → 2 fecl2 + i2 + 2 kcl` |
| 931 | 2 FeCl₃ + SnCl₂ → 2 FeCl₂ + SnCl₄ | soluzione |  |  | `2 fecl3 + sncl2 → 2 fecl2 + sncl4` |
| 932 | 2 HgCl₂ + SnCl₂ → Hg₂Cl₂ + SnCl₄ | soluzione | Saggio dello stagno(II): precipitato bianco... |  | `2 hgcl2 + sncl2 → hg2cl2 + sncl4` |
| 933 | Hg₂Cl₂ + SnCl₂ → 2 Hg + SnCl₄ | soluzione | ...che poi diventa grigio-nero (mercurio). |  | `hg2cl2 + sncl2 → 2 el:Hg + sncl4` |
| 934 | PdCl₂ + CO + H₂O → Pd + CO₂ + 2 HCl | soluzione | Rivelatori di CO a cambio di colore. |  | `pdcl2 + co + h2o → el:Pd + co2 + 2 hcl` |

## 11. Metallurgia (67)

> Estrazione dei metalli dai loro minerali: arrostimento dei solfuri, riduzione degli ossidi con carbonio, monossido di carbonio, idrogeno o un metallo più reattivo, elettrolisi ignea.

### 11.1 Arrostimento dei solfuri (8)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 935 | 4 FeS₂ + 11 O₂ → 2 Fe₂O₃ + 8 SO₂ | Δ | Arrostimento della pirite: SO₂ per l'acido solforico. |  | `4 fes2 + 11 o2 → 2 fe2o3 + 8 so2` |
| 936 | 2 ZnS + 3 O₂ → 2 ZnO + 2 SO₂ | Δ | Prima fase della metallurgia dello zinco (blenda). |  | `2 zns + 3 o2 → 2 zno + 2 so2` |
| 937 | ZnS + 2 O₂ → ZnSO₄ | Δ moderato |  |  | `zns + 2 o2 → znso4` |
| 938 | 2 PbS + 3 O₂ → 2 PbO + 2 SO₂ | Δ | Galena. |  | `2 pbs + 3 o2 → 2 pbo + 2 so2` |
| 939 | HgS + O₂ → Hg + SO₂ | Δ | Estrazione del mercurio dal cinabro (miniere di Almadén e del monte Amiata). |  | `hgs + o2 → el:Hg + so2` |
| 940 | Ag₂S + O₂ → 2 Ag + SO₂ | Δ |  |  | `ag2s + o2 → 2 el:Ag + so2` |
| 941 | 2 MoS₂ + 7 O₂ → 2 MoO₃ + 4 SO₂ | Δ | Molibdenite. |  | `2 mos2 + 7 o2 → 2 moo3 + 4 so2` |
| 942 | PbS + 2 PbO → 3 Pb + SO₂ | Δ | Riduzione per reazione nella metallurgia del piombo. |  | `pbs + 2 pbo → 3 el:Pb + so2` |

### 11.2 Riduzione con carbonio e monossido di carbonio (22)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 943 | Fe₂O₃ + 3 CO → 2 Fe + 3 CO₂ | altoforno ~900 °C | Reazione principale dell'altoforno. | −25 | `fe2o3 + 3 co → 2 el:Fe + 3 co2` |
| 944 | 3 Fe₂O₃ + CO → 2 Fe₃O₄ + CO₂ | altoforno ~500 °C | Primo stadio della riduzione. |  | `3 fe2o3 + co → 2 fe3o4 + co2` |
| 945 | Fe₃O₄ + CO → 3 FeO + CO₂ | altoforno ~700 °C |  |  | `fe3o4 + co → 3 feo + co2` |
| 946 | Fe₃O₄ + 4 CO → 3 Fe + 4 CO₂ | Δ |  |  | `fe3o4 + 4 co → 3 el:Fe + 4 co2` |
| 947 | FeO + CO → Fe + CO₂ | altoforno |  |  | `feo + co → el:Fe + co2` |
| 948 | 2 Fe₂O₃ + 3 C → 4 Fe + 3 CO₂ | Δ |  | 468 | `2 fe2o3 + 3 el:C → 4 el:Fe + 3 co2` |
| 949 | ZnO + C → Zn + CO | Δ 1200 °C | Lo zinco esce come vapore. |  | `zno + el:C → el:Zn + co` |
| 950 | ZnO + CO → Zn + CO₂ | Δ |  |  | `zno + co → el:Zn + co2` |
| 951 | 2 CuO + C → 2 Cu + CO₂ | Δ |  |  | `2 cuo + el:C → 2 el:Cu + co2` |
| 952 | CuO + CO → Cu + CO₂ | Δ |  |  | `cuo + co → el:Cu + co2` |
| 953 | Cu₂O + C → 2 Cu + CO | Δ |  |  | `cu2o + el:C → 2 el:Cu + co` |
| 954 | 2 PbO + C → 2 Pb + CO₂ | Δ |  |  | `2 pbo + el:C → 2 el:Pb + co2` |
| 955 | PbO + CO → Pb + CO₂ | Δ |  |  | `pbo + co → el:Pb + co2` |
| 956 | SnO₂ + 2 C → Sn + 2 CO | Δ | Stagno dalla cassiterite (età del bronzo). |  | `sno2 + 2 el:C → el:Sn + 2 co` |
| 957 | NiO + C → Ni + CO | Δ |  |  | `nio + el:C → el:Ni + co` |
| 958 | Bi₂O₃ + 3 C → 2 Bi + 3 CO | Δ |  |  | `bi2o3 + 3 el:C → 2 el:Bi + 3 co` |
| 959 | MnO₂ + 2 C → Mn + 2 CO | Δ, forno elettrico |  |  | `mno2 + 2 el:C → el:Mn + 2 co` |
| 960 | CaO + 3 C → CaC₂ + CO | forno elettrico 2000 °C | Produzione del carburo di calcio. |  | `cao + 3 el:C → cac2 + co` |
| 961 | Na₂SO₄ + 2 C → Na₂S + 2 CO₂ | Δ | Processo Leblanc, seconda fase. |  | `na2so4 + 2 el:C → na2s + 2 co2` |
| 962 | Na₂SO₄ + 4 C → Na₂S + 4 CO | Δ, carbone in eccesso |  |  | `na2so4 + 4 el:C → na2s + 4 co` |
| 963 | TiO₂ + 2 C + 2 Cl₂ → TiCl₄ + 2 CO | 1000 °C | Processo al cloruro (titanio metallico e pigmento). |  | `tio2 + 2 el:C + 2 cl2 → ticl4 + 2 co` |
| 964 | 2 CO ⇌ C + CO₂ | Δ | Equilibrio di Boudouard: decide se l'altoforno produce CO. | −172 | `2 co ⇌ el:C + co2` |

### 11.3 Riduzione con idrogeno (15)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 965 | Fe₂O₃ + 3 H₂ → 2 Fe + 3 H₂O | Δ | Acciaio "verde": riduzione diretta con idrogeno. | −33 | `fe2o3 + 3 h2 → 2 el:Fe + 3 h2o` |
| 966 | Fe₃O₄ + 4 H₂ → 3 Fe + 4 H₂O | Δ |  |  | `fe3o4 + 4 h2 → 3 el:Fe + 4 h2o` |
| 967 | CuO + H₂ → Cu + H₂O | Δ | La polvere nera diventa rosso rame. |  | `cuo + h2 → el:Cu + h2o` |
| 968 | Cu₂O + H₂ → 2 Cu + H₂O | Δ |  |  | `cu2o + h2 → 2 el:Cu + h2o` |
| 969 | NiO + H₂ → Ni + H₂O | Δ | Nichel catalizzatore. |  | `nio + h2 → el:Ni + h2o` |
| 970 | WO₃ + 3 H₂ → W + 3 H₂O | Δ | Polvere di tungsteno per filamenti e utensili. |  | `wo3 + 3 h2 → el:W + 3 h2o` |
| 971 | MoO₃ + 3 H₂ → Mo + 3 H₂O | Δ |  |  | `moo3 + 3 h2 → el:Mo + 3 h2o` |
| 972 | RuO₂ + 2 H₂ → Ru + 2 H₂O | Δ |  |  | `ruo2 + 2 h2 → el:Ru + 2 h2o` |
| 973 | IrO₂ + 2 H₂ → Ir + 2 H₂O | Δ |  |  | `iro2 + 2 h2 → el:Ir + 2 h2o` |
| 974 | PtO₂ + 2 H₂ → Pt + 2 H₂O |  | Attivazione del catalizzatore di Adams. |  | `pto2 + 2 h2 → el:Pt + 2 h2o` |
| 975 | OsO₄ + 4 H₂ → Os + 4 H₂O | Δ |  |  | `oso4 + 4 h2 → el:Os + 4 h2o` |
| 976 | SiCl₄ + 2 H₂ → Si + 4 HCl | 1100 °C | Silicio ultrapuro per l'elettronica. |  | `sicl4 + 2 h2 → el:Si + 4 hcl` |
| 977 | 2 BCl₃ + 3 H₂ → 2 B + 6 HCl | Δ | Boro puro. |  | `2 bcl3 + 3 h2 → 2 el:B + 6 hcl` |
| 978 | GeCl₄ + 2 H₂ → Ge + 4 HCl | Δ |  |  | `gecl4 + 2 h2 → el:Ge + 4 hcl` |
| 979 | 3 CuO + 2 NH₃ → 3 Cu + N₂ + 3 H₂O | Δ |  |  | `3 cuo + 2 nh3 → 3 el:Cu + n2 + 3 h2o` |

### 11.4 Riduzione con metalli (termite, alluminotermia, calciotermia) (22)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 980 | Fe₂O₃ + 2 Al → Al₂O₃ + 2 Fe | innesco (nastro di magnesio) | **già presente** (`termite`). Termite: circa 2500 °C, si usa per saldare i binari. | −851 | `fe2o3 + 2 el:Al → al2o3 + 2 el:Fe` |
| 981 | 3 Fe₃O₄ + 8 Al → 4 Al₂O₃ + 9 Fe | innesco |  |  | `3 fe3o4 + 8 el:Al → 4 al2o3 + 9 el:Fe` |
| 982 | Cr₂O₃ + 2 Al → Al₂O₃ + 2 Cr | innesco | Cromo puro (processo Goldschmidt). |  | `cr2o3 + 2 el:Al → al2o3 + 2 el:Cr` |
| 983 | 3 MnO₂ + 4 Al → 2 Al₂O₃ + 3 Mn | innesco |  |  | `3 mno2 + 4 el:Al → 2 al2o3 + 3 el:Mn` |
| 984 | 3 CuO + 2 Al → Al₂O₃ + 3 Cu | innesco | Termite molto violenta. |  | `3 cuo + 2 el:Al → al2o3 + 3 el:Cu` |
| 985 | 3 V₂O₅ + 10 Al → 5 Al₂O₃ + 6 V | innesco | Ferrovanadio. |  | `3 v2o5 + 10 el:Al → 5 al2o3 + 6 el:V` |
| 986 | 3 Nb₂O₅ + 10 Al → 5 Al₂O₃ + 6 Nb | innesco |  |  | `3 nb2o5 + 10 el:Al → 5 al2o3 + 6 el:Nb` |
| 987 | MoO₃ + 2 Al → Al₂O₃ + Mo | innesco | Ferromolibdeno. |  | `moo3 + 2 el:Al → al2o3 + el:Mo` |
| 988 | WO₃ + 2 Al → Al₂O₃ + W | innesco |  |  | `wo3 + 2 el:Al → al2o3 + el:W` |
| 989 | 3 NiO + 2 Al → Al₂O₃ + 3 Ni | innesco |  |  | `3 nio + 2 el:Al → al2o3 + 3 el:Ni` |
| 990 | Bi₂O₃ + 2 Al → Al₂O₃ + 2 Bi | innesco | Nanotermite. |  | `bi2o3 + 2 el:Al → al2o3 + 2 el:Bi` |
| 991 | CuO + Mg → MgO + Cu | innesco |  |  | `cuo + el:Mg → mgo + el:Cu` |
| 992 | CO₂ + 2 Mg → 2 MgO + C | innesco | Il magnesio brucia anche nella CO₂: gli estintori a CO₂ non lo spengono. | −810 | `co2 + 2 el:Mg → 2 mgo + el:C` |
| 993 | Zn + HgO → ZnO + Hg |  | Pila al mercurio (storica). |  | `el:Zn + hgo → zno + el:Hg` |
| 994 | UO₂ + 2 Ca → U + 2 CaO | Δ | Riduzione calciotermica. |  | `uo2 + 2 el:Ca → el:U + 2 cao` |
| 995 | ThO₂ + 2 Ca → Th + 2 CaO | Δ |  |  | `tho2 + 2 el:Ca → el:Th + 2 cao` |
| 996 | PuO₂ + 2 Ca → Pu + 2 CaO | Δ | Riduzione diretta dell'ossido. |  | `puo2 + 2 el:Ca → el:Pu + 2 cao` |
| 997 | Sm₂O₃ + 2 La → La₂O₃ + 2 Sm | Δ, vuoto | Riduzione lantanotermica: il samario volatile distilla. |  | `sm2o3 + 2 el:La → la2o3 + 2 el:Sm` |
| 998 | Eu₂O₃ + 2 La → La₂O₃ + 2 Eu | Δ, vuoto |  |  | `eu2o3 + 2 el:La → la2o3 + 2 el:Eu` |
| 999 | Tm₂O₃ + 2 La → La₂O₃ + 2 Tm | Δ, vuoto |  |  | `tm2o3 + 2 el:La → la2o3 + 2 el:Tm` |
| 1000 | Yb₂O₃ + 2 La → La₂O₃ + 2 Yb | Δ, vuoto |  |  | `yb2o3 + 2 el:La → la2o3 + 2 el:Yb` |
| 1001 | 3 Ag₂S + 2 Al + 6 H₂O → 6 Ag + 2 Al(OH)₃ + 3 H₂S | soluzione di bicarbonato, Δ | Pulizia dell'argento annerito con il foglio di alluminio. |  | `3 ag2s + 2 el:Al + 6 h2o → 6 el:Ag + 2 aloh3 + 3 h2s` |

## 12. Processi industriali e catalisi (gas di sintesi, C1) (31)

> Reazioni dei grandi processi industriali non già elencate altrove (gli altri processi sono indicati nelle note delle sezioni precedenti).

### 12.1 Idrogeno, CO₂ e gas di sintesi (8)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 1002 | CO₂ + 4 H₂ → CH₄ + 2 H₂O | cat. Ni, 300-400 °C | Reazione di Sabatier: sulla ISS ricava acqua dalla CO₂. | −253 | `co2 + 4 h2 → ch4 + 2 h2o` |
| 1003 | CO₂ + 2 H₂ → C + 2 H₂O | cat. Fe, 650 °C | Reazione di Bosch. | −178 | `co2 + 2 h2 → el:C + 2 h2o` |
| 1004 | CO₂ + 3 H₂ → CH₃OH + H₂O | cat. Cu/ZnO | Metanolo dalla CO₂ catturata. | −132 | `co2 + 3 h2 → metanolo + h2o` |
| 1005 | CO + 3 H₂ → CH₄ + H₂O | cat. Ni | Metanazione. | −250 | `co + 3 h2 → ch4 + h2o` |
| 1006 | CH₄ + CO₂ → 2 CO + 2 H₂ | cat. Ni, 800 °C | Reforming "a secco". | 247 | `ch4 + co2 → 2 co + 2 h2` |
| 1007 | 2 CH₄ + O₂ → 2 CO + 4 H₂ | cat. | Ossidazione parziale del metano. | −71 | `2 ch4 + o2 → 2 co + 4 h2` |
| 1008 | 2 CH₄ → C₂H₂ + 3 H₂ | 1500 °C, raffreddamento rapido | Acetilene dal metano. | 377 | `2 ch4 → c2h2 + 3 h2` |
| 1009 | 2 CH₄ + O₂ → C₂H₄ + 2 H₂O | cat., 800 °C | Accoppiamento ossidativo del metano. | −370 | `2 ch4 + o2 → c2h4 + 2 h2o` |

### 12.2 Fischer-Tropsch: carburanti sintetici da CO e H₂ (10)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 1010 | 2 CO + 5 H₂ → C₂H₆ + 2 H₂O | cat. Fe o Co, 200-350 °C |  | −435 | `2 co + 5 h2 → c2h6 + 2 h2o` |
| 1011 | 3 CO + 7 H₂ → C₃H₈ + 3 H₂O | cat. Fe o Co |  | −631 | `3 co + 7 h2 → c3h8 + 3 h2o` |
| 1012 | 4 CO + 9 H₂ → C₄H₁₀ + 4 H₂O | cat. Fe o Co |  | −827 | `4 co + 9 h2 → butano + 4 h2o` |
| 1013 | 5 CO + 11 H₂ → C₅H₁₂ + 5 H₂O | cat. Fe o Co |  |  | `5 co + 11 h2 → pentano + 5 h2o` |
| 1014 | 6 CO + 13 H₂ → C₆H₁₄ + 6 H₂O | cat. Fe o Co |  |  | `6 co + 13 h2 → esano + 6 h2o` |
| 1015 | 7 CO + 15 H₂ → C₇H₁₆ + 7 H₂O | cat. Fe o Co |  |  | `7 co + 15 h2 → eptano + 7 h2o` |
| 1016 | 8 CO + 17 H₂ → C₈H₁₈ (ottano) + 8 H₂O | cat. Fe o Co | Benzina sintetica. |  | `8 co + 17 h2 → ottano + 8 h2o` |
| 1017 | 9 CO + 19 H₂ → C₉H₂₀ + 9 H₂O | cat. Fe o Co |  |  | `9 co + 19 h2 → nonano + 9 h2o` |
| 1018 | 10 CO + 21 H₂ → C₁₀H₂₂ + 10 H₂O | cat. Fe o Co | Cherosene sintetico (e-fuel per l'aviazione). |  | `10 co + 21 h2 → decano + 10 h2o` |
| 1019 | 2 CO + 4 H₂ → C₂H₄ + 2 H₂O | cat. Fe |  | −298 | `2 co + 4 h2 → c2h4 + 2 h2o` |

### 12.3 Chimica del metanolo e dei composti C1 (13)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 1020 | CH₃OH → CH₂O + H₂ | cat. Ag, 650 °C |  | 131 | `metanolo → formaldeide + h2` |
| 1021 | 2 CH₃OH + O₂ → 2 CH₂O + 2 H₂O | cat. Fe/Mo | Processo Formox. | −310 | `2 metanolo + o2 → 2 formaldeide + 2 h2o` |
| 1022 | CH₃OH + CO → CH₃COOH | cat. Rh o Ir | Processo Monsanto/Cativa. | −135 | `metanolo + co → acido-acetico` |
| 1023 | 2 CH₃OH → C₂H₄ + 2 H₂O | cat. zeoliti | Methanol-to-olefins. | −41 | `2 metanolo → c2h4 + 2 h2o` |
| 1024 | 3 CH₃OH → C₃H₆ (propene) + 3 H₂O | cat. zeoliti |  |  | `3 metanolo → propene + 3 h2o` |
| 1025 | CH₃OH + H₂S → CH₃SH + H₂O | cat. | Metantiolo per la metionina dei mangimi. |  | `metanolo + h2s → metantiolo + h2o` |
| 1026 | 2 CH₄ + 2 NH₃ + 3 O₂ → 2 HCN + 6 H₂O | cat. Pt, 1100 °C | Processo Andrussow. | −1256 | `2 ch4 + 2 nh3 + 3 o2 → 2 hcn + 6 h2o` |
| 1027 | CH₄ + NH₃ → HCN + 3 H₂ | cat. Pt, 1200 °C | Processo BMA (Degussa). | 230 | `ch4 + nh3 → hcn + 3 h2` |
| 1028 | CH₄ + 4 S → CS₂ + 2 H₂S | 600 °C | Produzione del solfuro di carbonio. |  | `ch4 + 4 el:S → cs2 + 2 h2s` |
| 1029 | C + 2 S → CS₂ | Δ 900 °C | Metodo storico. |  | `el:C + 2 el:S → cs2` |
| 1030 | CO₂ + 2 NH₃ → CO(NH₂)₂ + H₂O | 190 °C, 150 atm | Sintesi di Bosch-Meiser: l'urea dei fertilizzanti. | −134 | `co2 + 2 nh3 → urea + h2o` |
| 1031 | NaCl + NH₃ + CO₂ + H₂O → NaHCO₃ + NH₄Cl | soluzione | Processo Solvay: il bicarbonato precipita. | −129 | `nacl + nh3 + co2 + h2o → nahco3 + nh4cl` |
| 1032 | (CN)₂ + H₂ → 2 HCN | Δ |  |  | `cianogeno + h2 → 2 hcn` |

## 13. Chimica organica (168)

> Reazioni tra molecole organiche della libreria (e con reagenti inorganici). Molte richiedono un catalizzatore o condizioni particolari, indicate nella colonna «Condizioni».

### 13.1 Idrogenazione (addizione di H₂) (27)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 1033 | C₂H₂ + H₂ → C₂H₄ | cat. Pd avvelenato (Lindlar) |  | −175 | `c2h2 + h2 → c2h4` |
| 1034 | C₂H₂ + 2 H₂ → C₂H₆ | cat. Pt o Ni |  | −311 | `c2h2 + 2 h2 → c2h6` |
| 1035 | C₂H₄ + H₂ → C₂H₆ | cat. Ni, Pt o Pd | **già presente** (`idrogenazione`) | −136 | `c2h4 + h2 → c2h6` |
| 1036 | C₃H₆ (propene) + H₂ → C₃H₈ | cat. Ni |  |  | `propene + h2 → c3h8` |
| 1037 | C₃H₄ + H₂ → C₃H₆ (propene) | cat. Lindlar |  |  | `propino + h2 → propene` |
| 1038 | C₃H₄ + 2 H₂ → C₃H₈ | cat. Pt |  |  | `propino + 2 h2 → c3h8` |
| 1039 | C₄H₈ (but-1-ene) + H₂ → C₄H₁₀ | cat. Ni |  |  | `but-1-ene + h2 → butano` |
| 1040 | C₄H₈ (but-2-ene) + H₂ → C₄H₁₀ | cat. Ni |  |  | `but-2-ene + h2 → butano` |
| 1041 | C₄H₈ (2-Metilpropene) + H₂ → CH(CH₃)₃ | cat. Ni |  |  | `isobutene + h2 → isobutano` |
| 1042 | C₄H₆ + 2 H₂ → C₄H₁₀ | cat. Ni |  |  | `butadiene + 2 h2 → butano` |
| 1043 | C₄H₆ + H₂ → C₄H₈ (but-1-ene) | cat. Pd, H₂ limitato | Addizione 1,2. |  | `butadiene + h2 → but-1-ene` |
| 1044 | C₄H₆ + H₂ → C₄H₈ (but-2-ene) | cat. Pd, H₂ limitato | Addizione 1,4. |  | `butadiene + h2 → but-2-ene` |
| 1045 | C₅H₈ + 2 H₂ → (CH₃)₂CHCH₂CH₃ | cat. Ni |  |  | `isoprene + 2 h2 → isopentano` |
| 1046 | C₆H₁₀ + H₂ → C₆H₁₂ | cat. Pt |  |  | `cicloesene + h2 → cicloesano` |
| 1047 | C₆H₆ + 3 H₂ → C₆H₁₂ | cat. Ni, 200 °C, pressione | Cicloesano per il nylon. | −205 | `benzene + 3 h2 → cicloesano` |
| 1048 | C₃H₆ (ciclopropano) + H₂ → C₃H₈ | cat. Ni | L'anello teso si apre. |  | `ciclopropano + h2 → c3h8` |
| 1049 | C₁₈H₃₄O₂ + H₂ → CH₃(CH₂)₁₆COOH | cat. Ni | Indurimento degli oli vegetali (margarine). |  | `acido-oleico + h2 → acido-stearico` |
| 1050 | 2 C₄H₈ (2-Metilpropene) + H₂ → C₈H₁₈ (2,2,4-Trimetilpentano) | cat. acido, poi Ni | Dimerizzazione + idrogenazione: benzina ad alto ottano. |  | `2 isobutene + h2 → isoottano` |
| 1051 | CH₂O + H₂ → CH₃OH | cat. |  | −131 | `formaldeide + h2 → metanolo` |
| 1052 | CH₃CHO + H₂ → C₂H₅OH | cat. Ni |  | −85 | `acetaldeide + h2 → etanolo` |
| 1053 | CH₃COCH₃ + H₂ → (CH₃)₂CHOH | cat. Ni |  |  | `acetone + h2 → isopropanolo` |
| 1054 | CH₃CH₂CHO + H₂ → CH₃CH₂CH₂OH | cat. Ni |  |  | `propanale + h2 → propan-1-olo` |
| 1055 | CH₃COOH + 2 H₂ → C₂H₅OH + H₂O | cat. Ru |  | −79 | `acido-acetico + 2 h2 → etanolo + h2o` |
| 1056 | CH₃COOC₂H₅ + 2 H₂ → 2 C₂H₅OH | cat. Cu |  |  | `acetato-di-etile + 2 h2 → 2 etanolo` |
| 1057 | CH₃CN + 2 H₂ → C₂H₅NH₂ | cat. Ni |  |  | `acetonitrile + 2 h2 → etilammina` |
| 1058 | HCN + 2 H₂ → CH₃NH₂ | cat. Ni |  | −132 | `hcn + 2 h2 → metilammina` |
| 1059 | C₆H₅CH₃ + H₂ → C₆H₆ + CH₄ | 600 °C | Idrodealchilazione del toluene. |  | `toluene + h2 → benzene + ch4` |

### 13.2 Deidrogenazione, cracking e reforming (23)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 1060 | C₂H₆ → C₂H₄ + H₂ | 850 °C, vapore | Steam cracking: produzione dell'etilene. | 136 | `c2h6 → c2h4 + h2` |
| 1061 | C₃H₈ → C₃H₆ (propene) + H₂ | cat. Pt o Cr₂O₃ |  |  | `c3h8 → propene + h2` |
| 1062 | CH(CH₃)₃ → C₄H₈ (2-Metilpropene) + H₂ | cat. |  |  | `isobutano → isobutene + h2` |
| 1063 | C₄H₁₀ → C₄H₈ (but-1-ene) + H₂ | cat. |  |  | `butano → but-1-ene + h2` |
| 1064 | C₄H₁₀ → C₄H₆ + 2 H₂ | cat. | Butadiene per la gomma sintetica. |  | `butano → butadiene + 2 h2` |
| 1065 | C₂H₅OH → CH₃CHO + H₂ | cat. Cu, Δ |  | 85 | `etanolo → acetaldeide + h2` |
| 1066 | (CH₃)₂CHOH → CH₃COCH₃ + H₂ | cat. Cu, Δ |  |  | `isopropanolo → acetone + h2` |
| 1067 | C₆H₁₂ → C₆H₆ + 3 H₂ | cat. Pt | Reforming catalitico. | 205 | `cicloesano → benzene + 3 h2` |
| 1068 | C₆H₁₄ → C₆H₁₂ + H₂ | cat. Pt |  |  | `esano → cicloesano + h2` |
| 1069 | C₆H₁₄ → C₆H₆ + 4 H₂ | cat. Pt, 500 °C | Aromatizzazione nel reforming. |  | `esano → benzene + 4 h2` |
| 1070 | C₇H₁₆ → C₆H₅CH₃ + 4 H₂ | cat. Pt, 500 °C |  |  | `eptano → toluene + 4 h2` |
| 1071 | C₈H₁₈ (ottano) → C₈H₁₀ (1,2-Dimetilbenzene) + 4 H₂ | cat. Pt, 500 °C |  |  | `ottano → o-xilene + 4 h2` |
| 1072 | C₈H₁₈ (ottano) → C₈H₁₀ (1,4-Dimetilbenzene) + 4 H₂ | cat. Pt, 500 °C | Paraxilene per il PET. |  | `ottano → p-xilene + 4 h2` |
| 1073 | C₃H₈ → C₂H₄ + CH₄ | cracking termico |  | 82 | `c3h8 → c2h4 + ch4` |
| 1074 | C₄H₁₀ → C₂H₄ + C₂H₆ | cracking termico |  | 94 | `butano → c2h4 + c2h6` |
| 1075 | C₄H₁₀ → C₃H₆ (propene) + CH₄ | cracking termico |  |  | `butano → propene + ch4` |
| 1076 | C₅H₁₂ → C₃H₈ + C₂H₄ | cracking |  |  | `pentano → c3h8 + c2h4` |
| 1077 | C₆H₁₄ → C₄H₁₀ + C₂H₄ | cracking |  |  | `esano → butano + c2h4` |
| 1078 | C₇H₁₆ → C₅H₁₂ + C₂H₄ | cracking |  |  | `eptano → pentano + c2h4` |
| 1079 | C₈H₁₈ (ottano) → C₆H₁₄ + C₂H₄ | cracking |  |  | `ottano → esano + c2h4` |
| 1080 | C₉H₂₀ → C₇H₁₆ + C₂H₄ | cracking |  |  | `nonano → eptano + c2h4` |
| 1081 | C₁₀H₂₂ → C₈H₁₈ (ottano) + C₂H₄ | cracking catalitico | Benzina dai distillati pesanti. |  | `decano → ottano + c2h4` |
| 1082 | C₁₀H₂₂ → C₇H₁₆ + C₃H₆ (propene) | cracking catalitico |  |  | `decano → eptano + propene` |

### 13.3 Isomerizzazione (10)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 1083 | C₄H₁₀ ⇌ CH(CH₃)₃ | cat. AlCl₃ |  | −9 | `butano ⇌ isobutano` |
| 1084 | C₅H₁₂ ⇌ (CH₃)₂CHCH₂CH₃ | cat. Pt |  |  | `pentano ⇌ isopentano` |
| 1085 | (CH₃)₂CHCH₂CH₃ ⇌ C(CH₃)₄ | cat. |  |  | `isopentano ⇌ neopentano` |
| 1086 | C₈H₁₈ (ottano) → C₈H₁₈ (2,2,4-Trimetilpentano) | cat. Pt | Aumenta il numero di ottano. |  | `ottano → isoottano` |
| 1087 | C₄H₈ (but-1-ene) ⇌ C₄H₈ (but-2-ene) | cat. |  |  | `but-1-ene ⇌ but-2-ene` |
| 1088 | C₄H₈ (but-1-ene) ⇌ C₄H₈ (2-Metilpropene) | cat. zeoliti |  |  | `but-1-ene ⇌ isobutene` |
| 1089 | C₈H₁₀ (1,2-Dimetilbenzene) ⇌ C₈H₁₀ (1,4-Dimetilbenzene) | cat. zeoliti |  |  | `o-xilene ⇌ p-xilene` |
| 1090 | C₈H₁₀ (1,3-Dimetilbenzene) ⇌ C₈H₁₀ (1,4-Dimetilbenzene) | cat. zeoliti |  |  | `m-xilene ⇌ p-xilene` |
| 1091 | C₃H₆ (ciclopropano) → C₃H₆ (propene) | Δ 500 °C |  |  | `ciclopropano → propene` |
| 1092 | C₆H₁₂O₆ (glucosio) ⇌ C₆H₁₂O₆ (fruttosio) | enzima glucosio isomerasi | Sciroppo ad alto contenuto di fruttosio. |  | `glucosio ⇌ fruttosio` |

### 13.4 Cicloaddizioni, oligomerizzazioni e loro inverse (8)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 1093 | C₄H₆ + C₂H₄ → C₆H₁₀ | Δ, pressione | Diels-Alder (premio Nobel 1950). |  | `butadiene + c2h4 → cicloesene` |
| 1094 | C₆H₁₀ → C₄H₆ + C₂H₄ | Δ | Retro-Diels-Alder. |  | `cicloesene → butadiene + c2h4` |
| 1095 | 2 C₅H₈ → C₁₀H₁₆ | Δ | Dimerizzazione di Diels-Alder (dipentene). |  | `2 isoprene → limonene` |
| 1096 | C₁₀H₁₆ → 2 C₅H₈ | Δ (pirolisi) |  |  | `limonene → 2 isoprene` |
| 1097 | 3 C₂H₂ → C₆H₆ | cat., 400 °C | Trimerizzazione di Berthelot (1866). | −633 | `3 c2h2 → benzene` |
| 1098 | 2 C₂H₄ → C₄H₈ (but-1-ene) | cat. Ni o Ti | Dimerizzazione dell'etilene. |  | `2 c2h4 → but-1-ene` |
| 1099 | C₄H₈ (ciclobutano) → 2 C₂H₄ | Δ |  |  | `ciclobutano → 2 c2h4` |
| 1100 | C₄H₈ (2-Metilpropene) + CH(CH₃)₃ → C₈H₁₈ (2,2,4-Trimetilpentano) | cat. HF o H₂SO₄ | Alchilazione: benzina ad alto numero di ottano. |  | `isobutene + isobutano → isoottano` |

### 13.5 Idratazione e disidratazione (13)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 1101 | C₂H₄ + H₂O → C₂H₅OH | cat. H₃PO₄, 300 °C | **già presente** (`idratazione`) | −44 | `c2h4 + h2o → etanolo` |
| 1102 | C₃H₆ (propene) + H₂O → (CH₃)₂CHOH | cat. acido | Regola di Markovnikov. |  | `propene + h2o → isopropanolo` |
| 1103 | C₂H₂ + H₂O → CH₃CHO | cat. HgSO₄ | Processo storico (inquinamento da mercurio a Minamata). | −134 | `c2h2 + h2o → acetaldeide` |
| 1104 | C₃H₄ + H₂O → CH₃COCH₃ | cat. Hg²⁺ |  |  | `propino + h2o → acetone` |
| 1105 | C₂H₄O + H₂O → HOCH₂CH₂OH | cat. acido | Antigelo. |  | `ossido-di-etilene + h2o → glicole-etilenico` |
| 1106 | C₂H₅OH → C₂H₄ + H₂O | H₂SO₄ concentrato, 170 °C |  | 44 | `etanolo → c2h4 + h2o` |
| 1107 | 2 C₂H₅OH → C₂H₅OC₂H₅ + H₂O | H₂SO₄ concentrato, 140 °C | L'etere dell'anestesia (1846). |  | `2 etanolo → etere-dietilico + h2o` |
| 1108 | 2 CH₃OH → CH₃OCH₃ + H₂O | cat. acido |  | 8 | `2 metanolo → dme + h2o` |
| 1109 | (CH₃)₂CHOH → C₃H₆ (propene) + H₂O | cat. acido, Δ |  |  | `isopropanolo → propene + h2o` |
| 1110 | CH₃CH₂CH₂OH → C₃H₆ (propene) + H₂O | cat. acido, Δ |  |  | `propan-1-olo → propene + h2o` |
| 1111 | C₄H₁₀O → C₄H₈ (but-1-ene) + H₂O | cat. acido, Δ |  |  | `butan-1-olo → but-1-ene + h2o` |
| 1112 | 2 CH₃COOH → (CH₃CO)₂O + H₂O | Δ, disidratante |  |  | `2 acido-acetico → anidride-acetica + h2o` |
| 1113 | CH₃CONH₂ → CH₃CN + H₂O | P₄O₁₀ |  |  | `acetammide → acetonitrile + h2o` |

### 13.6 Alogenazione, sostituzione ed eliminazione (41)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 1114 | CH₄ + Cl₂ → CH₃Cl + HCl | luce | **già presente** (`clorurazione`). Sostituzione radicalica. | −99 | `ch4 + cl2 → ch3cl + hcl` |
| 1115 | CH₃Cl + Cl₂ → CH₂Cl₂ + HCl | luce |  | −135 | `ch3cl + cl2 → ch2cl2 + hcl` |
| 1116 | CH₂Cl₂ + Cl₂ → CHCl₃ + HCl | luce |  | −102 | `ch2cl2 + cl2 → chcl3 + hcl` |
| 1117 | CHCl₃ + Cl₂ → CCl₄ + HCl | luce |  | −86 | `chcl3 + cl2 → ccl4 + hcl` |
| 1118 | CH₄ + Br₂ → CH₃Br + HBr | luce |  |  | `ch4 + br2 → bromometano + hbr` |
| 1119 | C₂H₆ + Cl₂ → C₂H₅Cl + HCl | luce |  |  | `c2h6 + cl2 → cloroetano + hcl` |
| 1120 | C₆H₆ + Cl₂ → C₆H₅Cl + HCl | cat. FeCl₃ | Sostituzione elettrofila aromatica. |  | `benzene + cl2 → clorobenzene + hcl` |
| 1121 | CH₄ + 4 F₂ → CF₄ + 4 HF |  | Fluorurazione diretta: violentissima. |  | `ch4 + 4 f2 → cf4 + 4 hf` |
| 1122 | C₂H₄ + HCl → C₂H₅Cl | cat. AlCl₃ |  |  | `c2h4 + hcl → cloroetano` |
| 1123 | C₂H₂ + HCl → CH₂=CHCl | cat. HgCl₂ | Via storica al PVC. |  | `c2h2 + hcl → cloruro-di-vinile` |
| 1124 | CH₃OH + HCl → CH₃Cl + H₂O | cat. ZnCl₂ |  | −36 | `metanolo + hcl → ch3cl + h2o` |
| 1125 | CH₃OH + HBr → CH₃Br + H₂O |  |  |  | `metanolo + hbr → bromometano + h2o` |
| 1126 | CH₃OH + HI → CH₃I + H₂O |  |  |  | `metanolo + hi → iodometano + h2o` |
| 1127 | C₂H₅OH + HCl → C₂H₅Cl + H₂O | cat. ZnCl₂ |  |  | `etanolo + hcl → cloroetano + h2o` |
| 1128 | CH₃Cl + NaOH → CH₃OH + NaCl | soluzione | Sostituzione nucleofila (SN2). | −143 | `ch3cl + naoh → metanolo + nacl` |
| 1129 | C₂H₅Cl + NaOH → C₂H₅OH + NaCl | soluzione |  |  | `cloroetano + naoh → etanolo + nacl` |
| 1130 | CH₃Br + NaOH → CH₃OH + NaBr | soluzione |  |  | `bromometano + naoh → metanolo + nabr` |
| 1131 | CH₃I + NaOH → CH₃OH + NaI | soluzione |  |  | `iodometano + naoh → metanolo + nai` |
| 1132 | CH₃Cl + H₂O → CH₃OH + HCl | lenta |  | 36 | `ch3cl + h2o → metanolo + hcl` |
| 1133 | CH₃Br + H₂O → CH₃OH + HBr | lenta |  |  | `bromometano + h2o → metanolo + hbr` |
| 1134 | C₂H₅Cl + KOH → C₂H₄ + KCl + H₂O | KOH in etanolo, Δ | Eliminazione (E2). |  | `cloroetano + koh → c2h4 + kcl + h2o` |
| 1135 | CH₃Cl + NaCN → CH₃CN + NaCl |  | La catena si allunga di un carbonio. |  | `ch3cl + nacn → acetonitrile + nacl` |
| 1136 | CH₃I + NaCN → CH₃CN + NaI |  |  |  | `iodometano + nacn → acetonitrile + nai` |
| 1137 | CH₃Br + KCN → CH₃CN + KBr |  |  |  | `bromometano + kcn → acetonitrile + kbr` |
| 1138 | CH₃Cl + 2 NH₃ → CH₃NH₂ + NH₄Cl |  |  | −164 | `ch3cl + 2 nh3 → metilammina + nh4cl` |
| 1139 | C₆H₅Cl + NaOH → C₆H₅OH + NaCl | 350 °C, 300 atm | Processo Dow per il fenolo. |  | `clorobenzene + naoh → fenolo + nacl` |
| 1140 | C₆H₅Cl + NH₃ → C₆H₅NH₂ + HCl | cat. Cu, Δ |  |  | `clorobenzene + nh3 → anilina + hcl` |
| 1141 | C₆H₅OH + NH₃ → C₆H₅NH₂ + H₂O | cat., Δ | Produzione industriale dell'anilina. |  | `fenolo + nh3 → anilina + h2o` |
| 1142 | 2 CH₃Cl + 2 Na → C₂H₆ + 2 NaCl | etere anidro | Reazione di Wurtz. | −743 | `2 ch3cl + 2 el:Na → c2h6 + 2 nacl` |
| 1143 | 2 CH₃I + 2 Na → C₂H₆ + 2 NaI | etere anidro |  |  | `2 iodometano + 2 el:Na → c2h6 + 2 nai` |
| 1144 | 2 C₂H₅Cl + 2 Na → C₄H₁₀ + 2 NaCl | etere anidro |  |  | `2 cloroetano + 2 el:Na → butano + 2 nacl` |
| 1145 | CH₃Cl + C₂H₅Cl + 2 Na → C₃H₈ + 2 NaCl | etere anidro | Wurtz "incrociata" (si formano anche etano e butano). |  | `ch3cl + cloroetano + 2 el:Na → c3h8 + 2 nacl` |
| 1146 | C₆H₅Cl + CH₃Cl + 2 Na → C₆H₅CH₃ + 2 NaCl | etere anidro | Reazione di Wurtz-Fittig. |  | `clorobenzene + ch3cl + 2 el:Na → toluene + 2 nacl` |
| 1147 | C₆H₆ + CH₃Cl → C₆H₅CH₃ + HCl | cat. AlCl₃ | Alchilazione di Friedel-Crafts. |  | `benzene + ch3cl → toluene + hcl` |
| 1148 | C₆H₅CH₃ + CH₃Cl → C₈H₁₀ (1,2-Dimetilbenzene) + HCl | cat. AlCl₃ |  |  | `toluene + ch3cl → o-xilene + hcl` |
| 1149 | C₆H₅CH₃ + CH₃Cl → C₈H₁₀ (1,4-Dimetilbenzene) + HCl | cat. AlCl₃ |  |  | `toluene + ch3cl → p-xilene + hcl` |
| 1150 | 2 C₆H₅CH₃ → C₆H₆ + C₈H₁₀ (1,4-Dimetilbenzene) | cat. zeoliti | Disproporzionamento del toluene. |  | `2 toluene → benzene + p-xilene` |
| 1151 | C₇H₈N₄O₂ + CH₃I → C₈H₁₀N₄O₂ + HI | base | Metilazione (nelle piante la fa un enzima). |  | `teobromina + iodometano → caffeina + hi` |
| 1152 | COCl₂ + 4 NH₃ → CO(NH₂)₂ + 2 NH₄Cl |  |  |  | `fosgene + 4 nh3 → urea + 2 nh4cl` |
| 1153 | C₂H₂ + 2 Cl₂ → ClCH=CCl₂ + HCl | in due passaggi (via tetracloroetano) | Via storica al tricloroetilene, solvente sgrassante. |  | `c2h2 + 2 cl2 → tricloroetilene + hcl` |
| 1154 | ClCH=CCl₂ + 3 HF + Br₂ → CF₃CHBrCl + 2 HCl + HBr | in due passaggi: cat. SbCl₅, poi 450 °C | Sintesi industriale dell'alotano, anestetico per inalazione. |  | `tricloroetilene + 3 hf + br2 → alotano + 2 hcl + hbr` |

### 13.7 Esteri, anidridi, ammidi, nitrili e nitroderivati (21)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 1155 | CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O | cat. H₂SO₄ | Esterificazione di Fischer. |  | `acido-acetico + etanolo ⇌ acetato-di-etile + h2o` |
| 1156 | CH₃COOC₂H₅ + NaOH → CH₃COONa + C₂H₅OH | soluzione | Saponificazione. |  | `acetato-di-etile + naoh → acetato-di-sodio + etanolo` |
| 1157 | (CH₃CO)₂O + H₂O → 2 CH₃COOH |  |  |  | `anidride-acetica + h2o → 2 acido-acetico` |
| 1158 | (CH₃CO)₂O + C₂H₅OH → CH₃COOC₂H₅ + CH₃COOH |  |  |  | `anidride-acetica + etanolo → acetato-di-etile + acido-acetico` |
| 1159 | C₇H₆O₃ + (CH₃CO)₂O → C₉H₈O₄ + CH₃COOH | cat. H₂SO₄ | Sintesi dell'aspirina (Bayer, 1897). |  | `acido-salicilico + anidride-acetica → aspirina + acido-acetico` |
| 1160 | C₉H₈O₄ + H₂O → C₇H₆O₃ + CH₃COOH | umidità | L'aspirina vecchia sa di aceto. |  | `aspirina + h2o → acido-salicilico + acido-acetico` |
| 1161 | CH₃COOH + NH₃ → CH₃CONH₂ + H₂O | Δ |  |  | `acido-acetico + nh3 → acetammide + h2o` |
| 1162 | HCOOH + NH₃ → HCONH₂ + H₂O | Δ |  |  | `acido-formico + nh3 → formammide + h2o` |
| 1163 | (CH₃CO)₂O + NH₃ → CH₃CONH₂ + CH₃COOH |  |  |  | `anidride-acetica + nh3 → acetammide + acido-acetico` |
| 1164 | CH₃CONH₂ + H₂O → CH₃COOH + NH₃ | acido o base, Δ |  |  | `acetammide + h2o → acido-acetico + nh3` |
| 1165 | HCONH₂ + H₂O → HCOOH + NH₃ | acido o base |  |  | `formammide + h2o → acido-formico + nh3` |
| 1166 | CH₃CN + 2 H₂O → CH₃COOH + NH₃ | acido o base, Δ |  |  | `acetonitrile + 2 h2o → acido-acetico + nh3` |
| 1167 | CH₃OH + NH₃ → CH₃NH₂ + H₂O | cat., 400 °C |  | −24 | `metanolo + nh3 → metilammina + h2o` |
| 1168 | 2 CH₃OH + NH₃ → (CH₃)₂NH + 2 H₂O | cat., 400 °C |  |  | `2 metanolo + nh3 → dimetilammina + 2 h2o` |
| 1169 | 3 CH₃OH + NH₃ → (CH₃)₃N + 3 H₂O | cat., 400 °C | Odore di pesce. |  | `3 metanolo + nh3 → trimetilammina + 3 h2o` |
| 1170 | C₂H₅OH + NH₃ → C₂H₅NH₂ + H₂O | cat. |  |  | `etanolo + nh3 → etilammina + h2o` |
| 1171 | C₃H₈O₃ + 3 HNO₃ → C₃H₅N₃O₉ + 3 H₂O | H₂SO₄ concentrato, freddo | Ascanio Sobrero (Torino, 1847). |  | `glicerolo + 3 hno3 → nitroglicerina + 3 h2o` |
| 1172 | C₆H₅CH₃ + 3 HNO₃ → C₇H₅N₃O₆ + 3 H₂O | H₂SO₄ concentrato | Trinitrazione in tre stadi. |  | `toluene + 3 hno3 → tnt + 3 h2o` |
| 1173 | CH₄ + HNO₃ → CH₃NO₂ + H₂O | 400 °C | Nitrazione in fase vapore. |  | `ch4 + hno3 → nitrometano + h2o` |
| 1174 | CO(NH₂)₂ + H₂O → CO₂ + 2 NH₃ | enzima ureasi | Odore di ammoniaca dell'urina vecchia. | 134 | `urea + h2o → co2 + 2 nh3` |
| 1175 | C₁₂H₂₂O₁₁ + H₂O → C₆H₁₂O₆ (glucosio) + C₆H₁₂O₆ (fruttosio) | acido o enzima invertasi | Zucchero invertito (miele artificiale). |  | `saccarosio + h2o → glucosio + fruttosio` |

### 13.8 Ossidazioni parziali (14)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 1176 | 2 C₂H₅OH + O₂ → 2 CH₃CHO + 2 H₂O | cat. Ag o Cu |  | −401 | `2 etanolo + o2 → 2 acetaldeide + 2 h2o` |
| 1177 | 2 CH₃CHO + O₂ → 2 CH₃COOH | cat. Mn²⁺ |  | −584 | `2 acetaldeide + o2 → 2 acido-acetico` |
| 1178 | 2 (CH₃)₂CHOH + O₂ → 2 CH₃COCH₃ + 2 H₂O | cat. |  |  | `2 isopropanolo + o2 → 2 acetone + 2 h2o` |
| 1179 | 2 C₂H₄ + O₂ → 2 CH₃CHO | cat. PdCl₂/CuCl₂ | Processo Wacker. | −489 | `2 c2h4 + o2 → 2 acetaldeide` |
| 1180 | PdCl₂ + C₂H₄ + H₂O → Pd + CH₃CHO + 2 HCl | soluzione | Passaggio stechiometrico del processo Wacker. |  | `pdcl2 + c2h4 + h2o → el:Pd + acetaldeide + 2 hcl` |
| 1181 | 2 C₂H₄ + O₂ → 2 C₂H₄O | cat. Ag, 250 °C |  |  | `2 c2h4 + o2 → 2 ossido-di-etilene` |
| 1182 | C₆H₅CH₃ + O₂ → C₆H₅CHO + H₂O | cat. |  |  | `toluene + o2 → benzaldeide + h2o` |
| 1183 | 2 C₆H₅CH₃ + 3 O₂ → 2 C₆H₅COOH + 2 H₂O | cat. Co | Acido benzoico (conservante E210). |  | `2 toluene + 3 o2 → 2 acido-benzoico + 2 h2o` |
| 1184 | 2 C₆H₅CHO + O₂ → 2 C₆H₅COOH | aria | La benzaldeide si ossida all'aria. |  | `2 benzaldeide + o2 → 2 acido-benzoico` |
| 1185 | 2 CH₂O + O₂ → 2 HCOOH |  |  | −633 | `2 formaldeide + o2 → 2 acido-formico` |
| 1186 | CH₄ + O₂ → CH₂O + H₂O | cat. |  | −320 | `ch4 + o2 → formaldeide + h2o` |
| 1187 | 2 C₄H₁₀ + 5 O₂ → 4 CH₃COOH + 2 H₂O | cat. Co | Processo storico per l'acido acetico. | −2258 | `2 butano + 5 o2 → 4 acido-acetico + 2 h2o` |
| 1188 | HOCH₂CH₂OH + 2 O₂ → HOOC–COOH + 2 H₂O | cat. |  |  | `glicole-etilenico + 2 o2 → acido-ossalico + 2 h2o` |
| 1189 | C₂H₄ + O₃ → CH₂O + HCOOH |  | Ozonolisi. | −729 | `c2h4 + o3 → formaldeide + acido-formico` |

### 13.9 Decarbossilazioni e carbossilazioni (6)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 1190 | 2 CH₃COOH → CH₃COCH₃ + CO₂ + H₂O | Δ, cat. | Chetonizzazione: storica produzione dell'acetone. | 41 | `2 acido-acetico → acetone + co2 + h2o` |
| 1191 | C₆H₅COOH → C₆H₆ + CO₂ | Δ, CaO |  |  | `acido-benzoico → benzene + co2` |
| 1192 | C₇H₆O₃ → C₆H₅OH + CO₂ | Δ |  |  | `acido-salicilico → fenolo + co2` |
| 1193 | C₆H₅OH + CO₂ → C₇H₆O₃ | NaOH, 125 °C, 100 atm | Reazione di Kolbe-Schmitt. |  | `fenolo + co2 → acido-salicilico` |
| 1194 | NH₂CH₂COOH → CH₃NH₂ + CO₂ | Δ o enzima |  | 112 | `glicina → metilammina + co2` |
| 1195 | C₃H₇NO₂ → C₂H₅NH₂ + CO₂ | Δ o enzima |  |  | `alanina → etilammina + co2` |

### 13.10 Chimica prebiotica (5)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 1196 | CH₃CHO + HCN + H₂O → C₃H₇NO₂ | NH₃ | Sintesi di Strecker (1850). |  | `acetaldeide + hcn + h2o → alanina` |
| 1197 | CH₂O + HCN + H₂O → NH₂CH₂COOH | NH₃ | Sintesi di Strecker. | −243 | `formaldeide + hcn + h2o → glicina` |
| 1198 | 5 HCN → C₅H₅N₅ | NH₃, Δ | Oró (1960): una base del DNA da 5 molecole di HCN. |  | `5 hcn → adenina` |
| 1199 | 6 CH₂O → C₆H₁₂O₆ (glucosio) | Ca(OH)₂ | Reazione del formosio (si forma una miscela di zuccheri). | −622 | `6 formaldeide → glucosio` |
| 1200 | 5 CH₂O → C₅H₁₀O₅ | Ca(OH)₂, borati | Possibile origine del ribosio dell'RNA. |  | `5 formaldeide → ribosio` |

## 14. Biochimica, fermentazioni e cicli naturali (15)

> Reazioni che in natura avvengono grazie a enzimi, microrganismi o alla luce (campo «Condizioni» → `needs` del motore). Le equazioni sono bilanci complessivi di molti passaggi.

### 14.1 Fotosintesi e respirazione (2)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 1201 | 6 CO₂ + 6 H₂O → C₆H₁₂O₆ (glucosio) + 6 O₂ | luce, clorofilla | **già presente** (`fotosintesi`). Fotosintesi. | 2803 | `6 co2 + 6 h2o → glucosio + 6 o2` |
| 1202 | 6 CO₂ + 12 H₂S → C₆H₁₂O₆ (glucosio) + 6 H₂O + 12 S | luce, batteri sulfurei | Fotosintesi anossigenica (senza produzione di ossigeno). | −380 | `6 co2 + 12 h2s → glucosio + 6 h2o + 12 el:S` |

### 14.2 Fermentazioni (7)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 1203 | C₆H₁₂O₆ (glucosio) → 2 C₂H₅OH + 2 CO₂ | lieviti | **già presente** (`fermentazione`). Fermentazione alcolica (vino, birra, pane). | −69 | `glucosio → 2 etanolo + 2 co2` |
| 1204 | C₆H₁₂O₆ (glucosio) → 2 CH₃CH(OH)COOH | batteri lattici o muscoli sotto sforzo | Yogurt, crauti; acido lattico nei muscoli. |  | `glucosio → 2 acido-lattico` |
| 1205 | C₆H₁₂O₆ (glucosio) → 3 CH₃COOH | batteri acetogeni |  | −180 | `glucosio → 3 acido-acetico` |
| 1206 | C₆H₁₂O₆ (glucosio) → CH₃(CH₂)₂COOH + 2 CO₂ + 2 H₂ | batteri (Clostridium) | Odore del burro rancido. |  | `glucosio → acido-butanoico + 2 co2 + 2 h2` |
| 1207 | C₆H₁₂O₆ (glucosio) → 3 CH₄ + 3 CO₂ | batteri e archei (digestione anaerobica) | Biogas. | −132 | `glucosio → 3 ch4 + 3 co2` |
| 1208 | CH₃COOH → CH₄ + CO₂ | archei metanogeni | Circa due terzi del metano naturale. | 16 | `acido-acetico → ch4 + co2` |
| 1209 | C₂H₅OH + O₂ → CH₃COOH + H₂O | batteri Acetobacter | Il vino diventa aceto. | −493 | `etanolo + o2 → acido-acetico + h2o` |

### 14.3 Ciclo dell'azoto e metabolismo (6)

| N. | Reazione | Condizioni | Note | ΔH° (kJ) | Specie (id) |
|---:|---|---|---|---:|---|
| 1210 | 2 NH₃ + 3 O₂ → 2 HNO₂ + 2 H₂O | batteri nitrosanti | Nitrificazione, primo passaggio. |  | `2 nh3 + 3 o2 → 2 hno2 + 2 h2o` |
| 1211 | 2 HNO₂ + O₂ → 2 HNO₃ | batteri nitrificanti | Nitrificazione, secondo passaggio. |  | `2 hno2 + o2 → 2 hno3` |
| 1212 | C₄H₅N₃O + H₂O → C₄H₄N₂O₂ + NH₃ | spontanea, lenta | Deaminazione: uno dei danni più comuni del DNA. |  | `citosina + h2o → uracile + nh3` |
| 1213 | NH₂CH₂COOH + CH₂O → C₃H₇NO₃ | enzima | Serina idrossimetiltransferasi (il formaldeide è portato da un cofattore). |  | `glicina + formaldeide → serina` |
| 1214 | C₃H₇NO₃ + H₂S → C₃H₇NO₂S + H₂O | enzima (batteri e piante) |  |  | `serina + h2s → cisteina + h2o` |
| 1215 | 2 C₉H₁₁NO₂ + O₂ → 2 C₉H₁₁NO₃ | enzima fenilalanina idrossilasi | Bilancio semplificato (l'enzima usa anche un cofattore). Nella fenilchetonuria l'enzima manca. |  | `2 fenilalanina + o2 → 2 tirosina` |

## Appendice A — Reazioni che richiedono nuove sostanze (134)

Reazioni classiche che il motore **non** può rappresentare finché non si aggiungono le sostanze indicate
nella colonna «Specie mancanti». Ecco le aggiunte più utili, in ordine di quante reazioni sbloccano:

1. **Ioni monoatomici** (Na⁺, K⁺, Ag⁺, Ca²⁺, Ba²⁺, Pb²⁺, Cu²⁺, Zn²⁺, Fe²⁺, Fe³⁺, Cl⁻, Br⁻, I⁻): servono per la
   dissoluzione dei sali e per tutte le equazioni ioniche nette. Oggi un sale non si può scindere in ioni separati.
2. **SiO₂**: la silice (sabbia, quarzo, vetro) è il composto più abbondante della crosta terrestre.
3. **Sali di manganese(II) e di cromo(III)** (MnCl₂, MnSO₄, CrCl₃, Cr₂(SO₄)₃): senza questi sali quasi tutte le
   reazioni del permanganato e del dicromato in acido restano escluse.
4. **FeS, Fe(OH)₃, Fe(OH)₂, Fe₂(SO₄)₃; PbSO₄, PbCl₂, PbCrO₄; AgI, Ag₂O, Ag₂CrO₄; Cu(NO₃)₂, CuS, Cu₂S**.
5. **Idrati e complessi** (CuSO₄·5H₂O, CoCl₂·6H₂O, [Cu(NH₃)₄]²⁺, [Fe(SCN)]²⁺, [Ag(NH₃)₂]⁺).
6. **Organici di base**: etilbenzene, cumene, nitrobenzene, 1,2-dicloroetano, sapone (stearato di sodio) e
   tristearina, alcol isoamilico (servirebbe a preparare l'acetato di isoamile già in libreria).

### A.1 Ioni monoatomici e complessi: equazioni ioniche nette

| Reazione | Specie mancanti | Note |
|---|---|---|
| Ag⁺ + Cl⁻ → AgCl | Ag⁺, Cl⁻ | Forma ionica netta di tutte le precipitazioni del cloruro d'argento. |
| Ba²⁺ + SO₄²⁻ → BaSO₄ | Ba²⁺ | Forma ionica netta del saggio dei solfati. |
| Pb²⁺ + 2 I⁻ → PbI₂ | Pb²⁺, I⁻ | "Pioggia d'oro" in forma ionica. |
| Ca²⁺ + CO₃²⁻ → CaCO₃ | Ca²⁺ | Formazione del calcare. |
| Cu²⁺ + 2 OH⁻ → Cu(OH)₂ | Cu²⁺ |  |
| NaCl → Na⁺ + Cl⁻ | Na⁺, Cl⁻ | Dissoluzione dei sali: oggi il motore non può scindere un sale in ioni separati. |
| HCl + H₂O → H₃O⁺ + Cl⁻ | Cl⁻ | Dissociazione dell'acido cloridrico. |
| Zn + Cu²⁺ → Zn²⁺ + Cu | Zn²⁺, Cu²⁺ | Pila Daniell in forma ionica. |
| Cl₂ + 2 Br⁻ → 2 Cl⁻ + Br₂ | Cl⁻, Br⁻ |  |
| 2 Fe³⁺ + 2 I⁻ → 2 Fe²⁺ + I₂ | Fe³⁺, Fe²⁺, I⁻ |  |
| MnO₄⁻ + 5 Fe²⁺ + 8 H₃O⁺ → Mn²⁺ + 5 Fe³⁺ + 12 H₂O | Mn²⁺, Fe²⁺, Fe³⁺ | Permanganometria. |
| Cr₂O₇²⁻ + 6 Fe²⁺ + 14 H₃O⁺ → 2 Cr³⁺ + 6 Fe³⁺ + 21 H₂O | Cr³⁺, Fe²⁺, Fe³⁺ | Dicromatometria. |
| IO₃⁻ + 5 I⁻ + 6 H₃O⁺ → 3 I₂ + 9 H₂O | I⁻ | Iodato e ioduro: iodio "su misura" nelle titolazioni. |
| 2 S₂O₃²⁻ + I₂ → S₄O₆²⁻ + 2 I⁻ | S₄O₆²⁻, I⁻ | Iodometria (la reazione analitica più usata con il tiosolfato). |
| 3 ClO⁻ → 2 Cl⁻ + ClO₃⁻ | Cl⁻ | Disproporzione dell'ipoclorito a caldo. |
| 3 Br₂ + 6 OH⁻ → 5 Br⁻ + BrO₃⁻ + 3 H₂O | Br⁻ | Il bromo in soluzione basica disproporziona in bromuro e bromato. |
| Fe³⁺ + SCN⁻ → FeSCN²⁺ | Fe³⁺, [Fe(SCN)]²⁺ | Colore rosso sangue: riconoscimento del ferro(III). |
| Cu²⁺ + 4 NH₃ → Cu(NH₃)₄²⁺ | Cu²⁺, [Cu(NH₃)₄]²⁺ | Blu intenso. |
| AgCl + 2 NH₃ → Ag(NH₃)₂⁺ + Cl⁻ | [Ag(NH₃)₂]⁺, Cl⁻ | Il cloruro d'argento si scioglie in ammoniaca. |
| AgBr + 2 S₂O₃²⁻ → Ag(S₂O₃)₂³⁻ + Br⁻ | [Ag(S₂O₃)₂]³⁻, Br⁻ | Fissaggio fotografico. |
| 2 Cu²⁺ + 4 I⁻ → 2 CuI + I₂ | Cu²⁺, I⁻, CuI | Dosaggio iodometrico del rame. |

### A.2 Composti inorganici mancanti

| Reazione | Specie mancanti | Note |
|---|---|---|
| Si + O₂ → SiO₂ | SiO₂ | La silice (quarzo, sabbia, vetro) manca dalla libreria: è il composto più abbondante della crosta terrestre. |
| SiH₄ + 2 O₂ → SiO₂ + 2 H₂O | SiO₂ | Il silano si incendia da solo all'aria. |
| SiO₂ + 4 HF → SiF₄ + 2 H₂O | SiO₂ | Incisione del vetro con l'acido fluoridrico. |
| SiO₂ + 2 C → Si + 2 CO | SiO₂ | Silicio metallurgico (forno ad arco). |
| Na₂CO₃ + SiO₂ → Na₂SiO₃ + CO₂ | SiO₂, Na₂SiO₃ | Fusione del vetro. |
| CaCO₃ + SiO₂ → CaSiO₃ + CO₂ | SiO₂, CaSiO₃ | Scorie dell'altoforno; cemento. |
| 2 Ca₃(PO₄)₂ + 6 SiO₂ + 10 C → 6 CaSiO₃ + P₄ + 10 CO | SiO₂, CaSiO₃ | Produzione del fosforo bianco. |
| 2 MgO + Si → 2 Mg + SiO₂ | SiO₂ | Processo Pidgeon per il magnesio. |
| 4 B + 3 O₂ → 2 B₂O₃ | B₂O₃ |  |
| 2 H₃BO₃ → B₂O₃ + 3 H₂O | B₂O₃ | Vetro borosilicato (Pyrex). |
| Fe + S → FeS | FeS | L'esperimento classico "miscuglio o composto?" (il ferro non è più attirato dalla calamita). |
| FeS + 2 HCl → FeCl₂ + H₂S | FeS | Preparazione di H₂S in laboratorio (apparecchio di Kipp). |
| FeCl₃ + 3 NaOH → Fe(OH)₃ + 3 NaCl | Fe(OH)₃ | Precipitato rosso-bruno. |
| 4 Fe + 3 O₂ + 6 H₂O → 4 Fe(OH)₃ | Fe(OH)₃ | Ruggine (ossido idrato). |
| FeSO₄ + 2 NaOH → Fe(OH)₂ + Na₂SO₄ | Fe(OH)₂ | Precipitato verde che imbrunisce all'aria. |
| 10 FeSO₄ + 2 KMnO₄ + 8 H₂SO₄ → 5 Fe₂(SO₄)₃ + K₂SO₄ + 2 MnSO₄ + 8 H₂O | Fe₂(SO₄)₃, MnSO₄ | Permanganometria del ferro. |
| MnO₂ + 4 HCl → MnCl₂ + Cl₂ + 2 H₂O | MnCl₂ | Scheele scoprì così il cloro (1774). |
| 2 KMnO₄ + 16 HCl → 2 KCl + 2 MnCl₂ + 5 Cl₂ + 8 H₂O | MnCl₂ | Cloro in laboratorio. |
| 2 KMnO₄ + 5 H₂O₂ + 3 H₂SO₄ → K₂SO₄ + 2 MnSO₄ + 5 O₂ + 8 H₂O | MnSO₄ | Titolazione dell'acqua ossigenata. |
| 2 KMnO₄ + 5 H₂C₂O₄ + 3 H₂SO₄ → K₂SO₄ + 2 MnSO₄ + 10 CO₂ + 8 H₂O | MnSO₄ | Standardizzazione del permanganato con l'acido ossalico. |
| 2 KMnO₄ → K₂MnO₄ + MnO₂ + O₂ | K₂MnO₄ | Decomposizione termica del permanganato. |
| 14 KMnO₄ + 4 C₃H₈O₃ → 7 K₂CO₃ + 7 Mn₂O₃ + 5 CO₂ + 16 H₂O | Mn₂O₃ | Permanganato e glicerina: si incendiano da soli. |
| Zn + 2 MnO₂ → ZnO + Mn₂O₃ | Mn₂O₃ | Pila alcalina. |
| K₂Cr₂O₇ + 3 C₂H₅OH + 4 H₂SO₄ → Cr₂(SO₄)₃ + K₂SO₄ + 3 CH₃CHO + 7 H₂O | Cr₂(SO₄)₃ | Etilometro chimico: da arancione a verde. |
| K₂Cr₂O₇ + 14 HCl → 2 KCl + 2 CrCl₃ + 3 Cl₂ + 7 H₂O | CrCl₃ |  |
| K₂Cr₂O₇ + H₂SO₄ → 2 CrO₃ + K₂SO₄ + H₂O | CrO₃ | Triossido di cromo (cromatura). |
| Pb + PbO₂ + 2 H₂SO₄ → 2 PbSO₄ + 2 H₂O | PbSO₄ | Batteria al piombo delle automobili. |
| PbS + 4 H₂O₂ → PbSO₄ + 4 H₂O | PbSO₄ | Restauro dei dipinti: la biacca annerita torna bianca. |
| Pb(NO₃)₂ + Na₂SO₄ → PbSO₄ + 2 NaNO₃ | PbSO₄ |  |
| Pb(NO₃)₂ + 2 NaCl → PbCl₂ + 2 NaNO₃ | PbCl₂ |  |
| Pb(NO₃)₂ + K₂CrO₄ → PbCrO₄ + 2 KNO₃ | PbCrO₄ | Giallo cromo (pigmento). |
| 2 AgNO₃ + K₂CrO₄ → Ag₂CrO₄ + 2 KNO₃ | Ag₂CrO₄ | Indicatore del metodo di Mohr. |
| BaCl₂ + K₂CrO₄ → BaCrO₄ + 2 KCl | BaCrO₄ |  |
| AgNO₃ + KI → AgI + KNO₃ | AgI | Lo ioduro d'argento si usa per "inseminare" le nuvole. |
| 2 AgNO₃ + 2 NaOH → Ag₂O + 2 NaNO₃ + H₂O | Ag₂O |  |
| Zn + Ag₂O → ZnO + 2 Ag | Ag₂O | Pile a bottone all'ossido d'argento. |
| Cu + 2 AgNO₃ → Cu(NO₃)₂ + 2 Ag | Cu(NO₃)₂ | "Albero di Diana": cristalli d'argento sul filo di rame. |
| Cu + 4 HNO₃ → Cu(NO₃)₂ + 2 NO₂ + 2 H₂O | Cu(NO₃)₂ | Il rame nell'acido nitrico concentrato: gas bruno. |
| 3 Cu + 8 HNO₃ → 3 Cu(NO₃)₂ + 2 NO + 4 H₂O | Cu(NO₃)₂ |  |
| CaCO₃ + 2 HNO₃ → Ca(NO₃)₂ + H₂O + CO₂ | Ca(NO₃)₂ |  |
| Mg + 2 HNO₃ → Mg(NO₃)₂ + H₂ | Mg(NO₃)₂ | Unico caso in cui l'acido nitrico (molto diluito) libera idrogeno. |
| 2 AgNO₃ + BaCl₂ → 2 AgCl + Ba(NO₃)₂ | Ba(NO₃)₂ |  |
| CuSO₄ + H₂S → CuS + H₂SO₄ | CuS | Precipitato nero, anche in ambiente acido. |
| Cu₂S + O₂ → 2 Cu + SO₂ | Cu₂S | Metallurgia del rame. |
| 2 Cu + O₂ + CO₂ + H₂O → Cu₂(OH)₂CO₃ | Cu₂(OH)₂CO₃ | Patina verde del rame (Statua della Libertà). |
| CaCO₃ + CO₂ + H₂O → Ca(HCO₃)₂ | Ca(HCO₃)₂ | Carsismo: grotte, stalattiti e stalagmiti. |
| 2 Cl₂ + 2 Ca(OH)₂ → CaCl₂ + Ca(ClO)₂ + 2 H₂O | Ca(ClO)₂ | Ipoclorito di calcio per le piscine. |
| NaCl + 3 H₂O → NaClO₃ + 3 H₂ | NaClO₃ | Elettrolisi senza diaframma: clorato di sodio. |
| 2 NaClO₂ + Cl₂ → 2 ClO₂ + 2 NaCl | NaClO₂ | Diossido di cloro per la potabilizzazione. |
| K + O₂ → KO₂ | KO₂ | Il potassio brucia formando il superossido. |
| 4 KO₂ + 2 CO₂ → 2 K₂CO₃ + 3 O₂ | KO₂ | Autorespiratori dei soccorritori e dei minatori. |
| 2 KNO₃ + S + 3 C → K₂S + N₂ + 3 CO₂ | K₂S | Polvere nera nella forma dei libri di testo. |
| Na₂S + CaCO₃ → Na₂CO₃ + CaS | CaS | Processo Leblanc, terza fase. |
| Ba(OH)₂ + CO₂ → BaCO₃ + H₂O | BaCO₃ | Acqua di barite. |
| 2 BaO + O₂ → 2 BaO₂ | BaO, BaO₂ | Processo Brin: ossigeno dall'aria (Ottocento). |
| NaCl + H₂SO₄ → NaHSO₄ + HCl | NaHSO₄ |  |
| 2 KNO₃ → 2 KNO₂ + O₂ | KNO₂ |  |
| Ca₃(PO₄)₂ + 4 H₃PO₄ → 3 Ca(H₂PO₄)₂ | Ca(H₂PO₄)₂ | Superfosfato triplo. |
| NH₃ + H₃PO₄ → NH₄H₂PO₄ | NH₄H₂PO₄ | Fertilizzante MAP e polvere degli estintori ABC. |
| 2 Rb + 2 H₂O → 2 RbOH + H₂ | RbOH | Esplosiva. |
| 2 Cs + 2 H₂O → 2 CsOH + H₂ | CsOH | Esplosiva. |
| Sr + 2 H₂O → Sr(OH)₂ + H₂ | Sr(OH)₂ |  |
| 2 Al + 2 NaOH + 6 H₂O → 2 NaAl(OH)₄ + 3 H₂ | NaAl(OH)₄ | Anfoterismo: lo sturalavandini in polvere. |
| Al(OH)₃ + NaOH → NaAl(OH)₄ | NaAl(OH)₄ | Processo Bayer per l'allumina. |
| Zn + 2 NaOH + 2 H₂O → Na₂Zn(OH)₄ + H₂ | Na₂[Zn(OH)₄] |  |
| Ni + 4 CO → Ni(CO)₄ | Ni(CO)₄ | Processo Mond: nichel purissimo. |
| Au + HNO₃ + 4 HCl → HAuCl₄ + NO + 2 H₂O | HAuCl₄ | Acqua regia, forma esatta. |
| 3 Pt + 4 HNO₃ + 18 HCl → 3 H₂PtCl₆ + 4 NO + 8 H₂O | H₂PtCl₆ |  |
| Hg + 2 H₂SO₄ → HgSO₄ + SO₂ + 2 H₂O | HgSO₄ |  |
| CuSO₄ + 5 H₂O → CuSO₄·5H₂O | idrati | Il solfato di rame anidro bianco diventa azzurro: rivelatore d'acqua. |
| CoCl₂ + 6 H₂O → CoCl₂·6H₂O | idrati | Da blu a rosa: indicatore di umidità. |
| CaSO₄·2H₂O → CaSO₄ + 2 H₂O | idrati | Cottura del gesso. |
| P₄ + 3 O₂ → P₄O₆ | P₄O₆ | Fosforo che brucia con poco ossigeno. |
| 4 As + 3 O₂ → 2 As₂O₃ | As₂O₃ | L'"arsenico" dei veleni storici. |
| As₂O₃ + 6 Zn + 12 HCl → 2 AsH₃ + 6 ZnCl₂ + 3 H₂O | As₂O₃ | Prova di Marsh, prima parte. |
| Se + O₂ → SeO₂ | SeO₂ |  |
| GeCl₄ + 2 H₂O → GeO₂ + 4 HCl | GeO₂ | Fibre ottiche. |
| 2 HIO₃ → I₂O₅ + H₂O | I₂O₅ |  |
| I₂O₅ + 5 CO → I₂ + 5 CO₂ | I₂O₅ | Dosaggio del monossido di carbonio. |
| Re₂O₇ + H₂O → 2 HReO₄ | HReO₄ |  |
| SO₃ + H₂SO₄ → H₂S₂O₇ | H₂S₂O₇ | Oleum: così si assorbe SO₃ nel processo a contatto. |
| NH₄OCN → CO(NH₂)₂ | NH₄OCN | Wöhler (1828): la prima sintesi di una sostanza organica da una inorganica. |
| UO₂ + 4 HF → UF₄ + 2 H₂O | UF₄ | Ciclo del combustibile nucleare. |
| UF₄ + F₂ → UF₆ | UF₄ |  |
| UF₆ + 2 H₂O → UO₂F₂ + 4 HF | UO₂F₂ | Pericolo delle perdite di UF₆. |
| 3 U + 4 O₂ → U₃O₈ | U₃O₈ | "Yellowcake" calcinato. |
| La₂O₃ + 6 HCl → 2 LaCl₃ + 3 H₂O | LaCl₃ | Vale per tutti gli ossidi dei lantanidi (cloruri non in libreria, tranne TbCl₃). |
| 2 CeO₂ + CO → Ce₂O₃ + CO₂ | Ce₂O₃ | Il cerio "accumula ossigeno" nelle marmitte catalitiche. |
| NaClO + NH₃ → NH₂Cl + NaOH | NH₂Cl | Il vero prodotto pericoloso di candeggina + ammoniaca. |

### A.3 Composti organici mancanti

| Reazione | Specie mancanti | Note |
|---|---|---|
| C₂H₄ + Br₂ → C₂H₄Br₂ | C₂H₄Br₂ | Acqua di bromo che si decolora: test dei doppi legami. |
| C₆H₆ + Br₂ → C₆H₅Br + HBr | C₆H₅Br |  |
| C₂H₄ + Cl₂ → C₂H₄Cl₂ | C₂H₄Cl₂ | 1,2-Dicloroetano, primo passo verso il PVC. |
| C₂H₄Cl₂ → C₂H₃Cl + HCl | C₂H₄Cl₂ | Cracking: cloruro di vinile. |
| C₆H₆ + HNO₃ → C₆H₅NO₂ + H₂O | C₆H₅NO₂ | Nitrazione del benzene. |
| C₆H₅NO₂ + 3 H₂ → C₆H₅NH₂ + 2 H₂O | C₆H₅NO₂ | Anilina per coloranti e poliuretani. |
| C₆H₆ + C₂H₄ → C₆H₅C₂H₅ | etilbenzene | Primo passo verso lo stirene. |
| C₆H₅C₂H₅ → C₆H₅CHCH₂ + H₂ | etilbenzene | Deidrogenazione: stirene per il polistirene. |
| C₆H₆ + C₃H₆ → C₉H₁₂ | cumene |  |
| C₉H₁₂ + O₂ → C₆H₅OH + C₃H₆O | cumene | Processo di Hock: fenolo e acetone insieme. |
| C₈H₁₀ + 3 O₂ → C₈H₆O₄ + 2 H₂O | acido tereftalico | Paraxilene → PET. |
| C₅₇H₁₁₀O₆ + 3 NaOH → 3 C₁₇H₃₅COONa + C₃H₈O₃ | tristearina, stearato di sodio | Saponificazione: il sapone. |
| C₁₇H₃₅COOH + NaOH → C₁₇H₃₅COONa + H₂O | stearato di sodio |  |
| C₆H₁₂O₆ + H₂ → C₆H₁₄O₆ | sorbitolo | Dolcificante. |
| 2 C₆H₁₂O₆ + O₂ → 2 C₆H₁₂O₇ | acido gluconico | Ossidazione enzimatica del glucosio (glucometri). |
| C₅H₁₂O + CH₃COOH → C₇H₁₄O₂ + H₂O | alcol isoamilico | Aroma di banana. |
| C₇H₆O₃ + CH₃OH → C₈H₈O₃ + H₂O | salicilato di metile | Olio di wintergreen. |
| CH₃COOH + CH₃OH → CH₃COOCH₃ + H₂O | acetato di metile |  |
| CH₃COOH + SOCl₂ → CH₃COCl + SO₂ + HCl | cloruro di acetile |  |
| 2 C₂H₅OH + 2 Na → 2 C₂H₅ONa + H₂ | etossido di sodio | Il sodio reagisce (più piano) anche con l'alcol. |
| C₂H₄O + NH₃ → C₂H₇NO | etanolammina |  |
| 2 C₂H₅NO₂ → C₄H₈N₂O₃ + H₂O | glicilglicina | Il legame peptidico delle proteine. |
| C₆H₇NO + C₄H₆O₃ → C₈H₉NO₂ + C₂H₄O₂ | 4-amminofenolo | Sintesi del paracetamolo. |
| 2 C₆H₈O₆ + O₂ → 2 C₆H₆O₆ + 2 H₂O | acido deidroascorbico | La vitamina C come antiossidante: consuma ossigeno. |

## Appendice B — Combinazioni che non reagiscono

Esempi di combinazioni che il motore dovrebbe riconoscere come «nessuna reazione», con la spiegazione da mostrare
(come già fa «Simula reazione» quando non trova reazioni).

| Reagenti | Perché non reagiscono |
|---|---|
| Cu, Ag, Au, Pt, Hg + HCl o H₂SO₄ diluito | Metalli sotto l'idrogeno nella serie dei potenziali: non riducono H⁺ |
| Au, Pt + HNO₃ | Servono l'acqua regia e la formazione di complessi cloruro |
| Fe, Al, Cr + HNO₃ concentrato | Passivazione: si forma uno strato di ossido protettivo |
| Cu + FeSO₄, Fe + ZnSO₄, Ag + CuSO₄ | Il metallo è meno riducente di quello del sale |
| Br₂ + KCl, I₂ + KBr, I₂ + NaCl | Un alogeno non sposta un alogeno più reattivo di lui |
| He, Ne, Ar + qualunque specie | Gas nobili leggeri: nessun composto stabile noto |
| SF₆, CF₄, N₂ a temperatura ambiente | Cinetica: legami fortissimi o atomo centrale schermato |
| H₂ + O₂, CH₄ + O₂, glucosio + O₂ senza innesco | Termodinamicamente favorite, ma serve l'energia di attivazione |
| NaCl + KNO₃, KCl + NaNO₃ in soluzione | Tutti i possibili prodotti sono solubili: nessun precipitato, gas o acqua |
| N₂ + H₂ senza catalizzatore | Il triplo legame N≡N rende la reazione lentissima |
| CCl₄ + H₂O a temperatura ambiente | Idrolisi possibile ma lentissima (serve calore) |
| CO₂ + O₂, H₂O + O₂, Al₂O₃ + O₂ | Le specie sono già completamente ossidate |

## Appendice C — Indicazioni per il motore (senza codice)

- **Dati**: ogni riga del catalogo corrisponde a una voce di `src/lab/data/reactions.js`. Servono reagenti e prodotti
  con i coefficienti (la colonna «Specie (id)»), un gruppo (le 14 sezioni oppure i 5 gruppi attuali, con
  sottogruppi) e le condizioni, che vanno nel campo `needs` (catalizzatore, enzimi, elettrolisi, luce…) oppure
  nella richiesta di energia (Δ). Gli equilibri (⇌) vanno segnati come reversibili.
- **Stessi reagenti, prodotti diversi**: alcune reazioni partono dalle stesse sostanze ma danno prodotti diversi,
  secondo le proporzioni o le condizioni. Esempi: C + O₂ → CO oppure CO₂; Na + O₂ → Na₂O oppure Na₂O₂;
  Cl₂ + NaOH a freddo oppure KOH a caldo; P₄ + Cl₂ → PCl₃ oppure PCl₅. La regola attuale di «Simula reazione»
  sceglie la reazione che consuma più molecole e poi la più esotermica. Funziona già con queste coppie, purché
  le condizioni (calore, catalizzatore) siano rispettate.
- **Entalpie**: solo 87 voci della libreria hanno ΔHf°. Aggiungere ΔHf° (NIST/CRC) almeno alle specie inorganiche
  più usate nel catalogo (ossidi, sali, alogenuri) permetterebbe di calcolare ΔH° per la maggior parte delle reazioni.
- **Reazioni inverse**: il catalogo elenca a parte le inverse solo quando sono notevoli (elettrolisi dell'acqua,
  decomposizione dell'ammoniaca, retro-Diels-Alder…). Per le altre basta segnare l'equilibrio (⇌).
- **Coefficienti scritti a mano**: per le 18 reazioni con più bilanciamenti possibili il file dei dati deve
  contenere i coefficienti, perché `balance()` restituisce «più bilanciamenti indipendenti». Lo fanno già i test
  delle reazioni attuali.
