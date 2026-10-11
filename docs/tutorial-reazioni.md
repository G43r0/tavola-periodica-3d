# Tutorial delle reazioni del laboratorio molecolare

Guida alle **47 reazioni** che il laboratorio può eseguire oggi (`src/lab/data/reactions.js`): per ognuna trovi
l'equazione bilanciata, che cosa mettere sul banco, l'energia in gioco e che cosa succede.
L'elenco più ampio di 1349 reazioni, ancora non eseguibili nell'app, è nel [catalogo](catalogo-reazioni.md).

## Come si usa

Ci sono due modi per far avvenire una reazione.

### 1. Dal pannello «Reazioni» (reazione guidata)

1. Nella barra del laboratorio premi **Reazioni**.
2. Scegli una reazione dall'elenco, diviso in gruppi (Sintesi, Combustioni, Decomposizioni, Acidi e basi, Altre reazioni).
   In cima compaiono quelle già possibili con le molecole presenti sul banco e quelle «quasi pronte», con l'indicazione di cosa manca.
3. Nella scheda puoi:
   - leggere l'**equazione** oppure passare a **Bilancia tu**: cambi i coefficienti con − e +, la tabella degli atomi ti dice se
     ogni elemento è pari a sinistra e a destra, e **Mostra la soluzione** svela i coefficienti giusti;
   - vedere ΔH°, il diagramma energetico e la stima con le energie di legame;
   - premere **Solo reagenti** per mettere sul banco le molecole di partenza senza farle reagire;
   - premere **Avvia la reazione** (o **Prepara e avvia** se i reagenti non sono ancora sul banco): le molecole si avvicinano,
     i legami dei reagenti si rompono (in rosso) e si formano quelli dei prodotti (in verde).
4. **Ctrl+Z** annulla l'intera reazione.

### 2. Con «Simula reazione» (sperimentazione libera)

1. Metti sul banco alcune molecole: dal menu **Esempi**, da **Formula** (scrivi una formula, un nome o uno SMILES) o dalla tavolozza.
2. Premi **Simula reazione** (tasto **R**). Servono almeno due molecole; se ne selezioni alcune con Ctrl+clic, reagiscono solo quelle.
3. Le molecole si agitano e si urtano. Se esiste una reazione possibile, avviene tante volte quante lo permette il **reagente
   limitante**; le molecole avanzate sono in eccesso. Il resoconto elenca i passi con il loro ΔH. I prodotti di un passo possono
   reagire nel successivo.
4. Se non succede nulla, il resoconto spiega perché: reagenti mancanti (con il pulsante per aggiungerli) oppure energia da fornire.

### Energia e condizioni

- **Esotermica** (ΔH° negativo): i prodotti hanno meno energia dei reagenti, la reazione libera calore.
- **Endotermica** (ΔH° positivo): assorbe energia. Nella simulazione avviene solo dopo aver premuto **Fornisci energia e simula**
  (calore, luce o corrente elettrica).
- Alcune reazioni richiedono un fattore che la simulazione non può fornire da sola (per esempio *i lieviti* per la fermentazione):
  in quel caso usa il pannello «Reazioni».
- Una reazione avviene solo con un **urto efficace**: le molecole devono scontrarsi con abbastanza energia (energia di
  attivazione, Eₐ) e con l'orientamento giusto. Gli atomi non si creano né si distruggono, si riorganizzano.

### Convenzioni

- I coefficienti sono i minimi interi; ΔH° è riferito all'equazione così com'è scritta, in moli, a 25 °C e 1 bar.
- Sul banco i metalli e gli elementi solidi (Na, C, S, Mg, Al, Ca, Fe) sono rappresentati da **singoli atomi**.
- Le sostanze sono considerate pure (per esempio NaOH solido e HCl gassoso, non in soluzione).

## Indice

| Gruppo | Reazioni |
|---|---:|
| [Sintesi](#sintesi-19) | 19 |
| [Combustioni](#combustioni-12) | 12 |
| [Decomposizioni](#decomposizioni-5) | 5 |
| [Acidi e basi](#acidi-e-basi-4) | 4 |
| [Altre reazioni](#altre-reazioni-7) | 7 |

## Sintesi (19)

### 1. Sintesi dell'acqua

**2 H₂ + O₂ → 2 H₂O**

- **Sul banco**: aggiungi 2 × Idrogeno (H₂), 1 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −571,7 kJ, esotermica (libera calore).
- **Cosa succede**: Idrogeno e ossigeno reagiscono in modo esplosivo appena una scintilla fornisce l'energia di attivazione.
- **Nota**: Nelle celle a combustibile la stessa reazione avviene in modo controllato e produce elettricità.

### 2. Sintesi dell'ammoniaca (Haber-Bosch)

**N₂ + 3 H₂ → 2 NH₃**

- **Sul banco**: aggiungi 1 × Azoto (N₂), 3 × Idrogeno (H₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −91,9 kJ, esotermica (libera calore).
- **Cosa succede**: Rompere il triplo legame N≡N richiede molta energia: servono un catalizzatore a base di ferro, circa 450 °C e 200 atm.
- **Nota**: Produce l'ammoniaca per i fertilizzanti che nutrono circa metà della popolazione mondiale.

### 3. Sintesi del cloruro di idrogeno

**H₂ + Cl₂ → 2 HCl**

- **Sul banco**: aggiungi 1 × Idrogeno (H₂), 1 × Cloro (Cl₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −184,6 kJ, esotermica (libera calore).
- **Cosa succede**: Alla luce o con una scintilla la reazione è esplosiva (reazione a catena con radicali).

### 4. Sintesi del fluoruro di idrogeno

**H₂ + F₂ → 2 HF**

- **Sul banco**: aggiungi 1 × Idrogeno (H₂), 1 × Fluoro (F₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −546,6 kJ, esotermica (libera calore).
- **Cosa succede**: Avviene violentemente anche al buio e a bassa temperatura: il fluoro è l'elemento più reattivo.

### 5. Sodio e cloro: sale da cucina

**2 Na + Cl₂ → 2 NaCl**

- **Sul banco**: aggiungi 2 × Sodio (Na), 1 × Cloro (Cl₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −822,4 kJ, esotermica (libera calore).
- **Cosa succede**: Ogni atomo di sodio cede un elettrone a un atomo di cloro: si formano gli ioni Na⁺ e Cl⁻ del reticolo cristallino.
- **Nota**: Sul banco il sodio metallico è rappresentato da singoli atomi.

### 6. Combustione del carbonio

**C + O₂ → CO₂**

- **Sul banco**: aggiungi 1 × Carbonio (C), 1 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −393,5 kJ, esotermica (libera calore).
- **Cosa succede**: Il carbonio (grafite, carbone) brucia completamente formando anidride carbonica.
- **Nota**: Sul banco la grafite è rappresentata da un singolo atomo di carbonio.

### 7. Combustione incompleta del carbonio

**2 C + O₂ → 2 CO**

- **Sul banco**: aggiungi 2 × Carbonio (C), 1 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −221,1 kJ, esotermica (libera calore).
- **Cosa succede**: Con poco ossigeno si forma monossido di carbonio, gas tossico: è il pericolo di stufe e caldaie mal ventilate.

### 8. Ossidazione del monossido di carbonio

**2 CO + O₂ → 2 CO₂**

- **Sul banco**: aggiungi 2 × Monossido di carbonio (CO), 1 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −566,0 kJ, esotermica (libera calore).
- **Cosa succede**: Avviene nelle marmitte catalitiche, che trasformano il CO tossico in CO₂.

### 9. Combustione dello zolfo

**S + O₂ → SO₂**

- **Sul banco**: aggiungi 1 × Zolfo (S), 1 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −296,8 kJ, esotermica (libera calore).
- **Cosa succede**: Lo zolfo brucia con fiamma azzurra formando anidride solforosa, dall'odore pungente.
- **Nota**: Sul banco lo zolfo (molecole S₈) è rappresentato da un singolo atomo.

### 10. Ossidazione dell'anidride solforosa

**2 SO₂ + O₂ → 2 SO₃**

- **Sul banco**: aggiungi 2 × Anidride solforosa (SO₂), 1 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −288,4 kJ, esotermica (libera calore).
- **Cosa succede**: Passaggio chiave del processo a contatto per l'acido solforico (catalizzatore: pentossido di vanadio).

### 11. Azoto e ossigeno: monossido di azoto

**N₂ + O₂ → 2 NO**

- **Sul banco**: aggiungi 1 × Azoto (N₂), 1 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = +182,6 kJ, endotermica (serve energia: con «Simula reazione» usa poi «Fornisci energia e simula»).
- **Cosa succede**: Reazione endotermica: avviene solo ad altissima temperatura, nei fulmini e nei motori.

### 12. Ossidazione del monossido di azoto

**2 NO + O₂ → 2 NO₂**

- **Sul banco**: aggiungi 2 × Monossido di azoto (NO), 1 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −116,4 kJ, esotermica (libera calore).
- **Cosa succede**: Il gas bruno-rossastro NO₂ è uno dei responsabili dello smog fotochimico.

### 13. Combustione del magnesio

**2 Mg + O₂ → 2 MgO**

- **Sul banco**: aggiungi 2 × Magnesio (Mg), 1 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −1203,2 kJ, esotermica (libera calore).
- **Cosa succede**: Il magnesio brucia con una luce bianca abbagliante, usata nei fuochi d'artificio e nei vecchi flash fotografici.

### 14. Ossidazione dell'alluminio

**4 Al + 3 O₂ → 2 Al₂O₃**

- **Sul banco**: aggiungi 4 × Alluminio (Al), 3 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −3351,4 kJ, esotermica (libera calore).
- **Cosa succede**: Lo strato sottilissimo di ossido che si forma all'aria protegge l'alluminio dalla corrosione.

### 15. Ossidazione del calcio

**2 Ca + O₂ → 2 CaO**

- **Sul banco**: aggiungi 2 × Calcio (Ca), 1 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −1269,8 kJ, esotermica (libera calore).
- **Cosa succede**: Il calcio metallico si ricopre rapidamente di ossido a contatto con l'aria.

### 16. Ossidazione del sodio

**4 Na + O₂ → 2 Na₂O**

- **Sul banco**: aggiungi 4 × Sodio (Na), 1 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −828,4 kJ, esotermica (libera calore).
- **Cosa succede**: Il sodio si conserva sotto olio perché reagisce subito con l'ossigeno e con l'umidità.

### 17. Sintesi del metanolo

**CO + 2 H₂ → CH₃OH**

- **Sul banco**: aggiungi 1 × Monossido di carbonio (CO), 2 × Idrogeno (H₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −128,7 kJ, esotermica (libera calore).
- **Cosa succede**: Processo industriale con catalizzatore a base di rame e ossido di zinco.

### 18. Sintesi del pentacloruro di fosforo

**PCl₃ + Cl₂ → PCl₅**

- **Sul banco**: aggiungi 1 × Tricloruro di fosforo (PCl₃), 1 × Cloro (Cl₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −123,8 kJ, esotermica (libera calore).
- **Cosa succede**: Il fosforo passa da 3 a 5 legami: ottetto espanso.

### 19. Formazione dell'ozono

**3 O₂ → 2 O₃**

- **Sul banco**: aggiungi 3 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = +285,4 kJ, endotermica (serve energia: con «Simula reazione» usa poi «Fornisci energia e simula»).
- **Cosa succede**: Endotermica: nella stratosfera l'energia viene dai raggi ultravioletti, negli ozonizzatori da scariche elettriche.


## Combustioni (12)

### 20. Combustione del metano

**CH₄ + 2 O₂ → CO₂ + 2 H₂O**

- **Sul banco**: aggiungi 1 × Metano (CH₄), 2 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −890,3 kJ, esotermica (libera calore).
- **Cosa succede**: La reazione dei fornelli e delle caldaie a gas.

### 21. Combustione del propano

**C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O**

- **Sul banco**: aggiungi 1 × Propano (C₃H₈), 5 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −2219,2 kJ, esotermica (libera calore).
- **Cosa succede**: Il propano del GPL libera più energia per molecola del metano perché contiene più legami.

### 22. Combustione del butano

**2 C₄H₁₀ + 13 O₂ → 8 CO₂ + 10 H₂O**

- **Sul banco**: aggiungi 2 × Butano (C₄H₁₀), 13 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −5755,2 kJ, esotermica (libera calore).
- **Cosa succede**: La reazione della fiamma degli accendini.

### 23. Combustione dell'etano

**2 C₂H₆ + 7 O₂ → 4 CO₂ + 6 H₂O**

- **Sul banco**: aggiungi 2 × Etano (C₂H₆), 7 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −3121,0 kJ, esotermica (libera calore).
- **Cosa succede**: Esempio classico da bilanciare: servono 7 molecole di O₂ ogni 2 di etano.

### 24. Combustione dell'etilene

**C₂H₄ + 3 O₂ → 2 CO₂ + 2 H₂O**

- **Sul banco**: aggiungi 1 × Etilene (C₂H₄), 3 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −1411,1 kJ, esotermica (libera calore).
- **Cosa succede**: Combustione completa di un alchene.

### 25. Combustione dell'acetilene

**2 C₂H₂ + 5 O₂ → 4 CO₂ + 2 H₂O**

- **Sul banco**: aggiungi 2 × Acetilene (C₂H₂), 5 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −2600,5 kJ, esotermica (libera calore).
- **Cosa succede**: La fiamma ossiacetilenica supera i 3000 °C: si usa per saldare e tagliare l'acciaio.

### 26. Combustione del benzene

**2 C₆H₆ + 15 O₂ → 12 CO₂ + 6 H₂O**

- **Sul banco**: aggiungi 2 × Benzene (C₆H₆), 15 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −6535,1 kJ, esotermica (libera calore).
- **Cosa succede**: Il benzene brucia con fiamma fuligginosa (combustione spesso incompleta).

### 27. Combustione dell'etanolo

**C₂H₅OH + 3 O₂ → 2 CO₂ + 3 H₂O**

- **Sul banco**: aggiungi 1 × Etanolo (C₂H₅OH), 3 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −1366,9 kJ, esotermica (libera calore).
- **Cosa succede**: Il bioetanolo è usato come carburante, da solo o miscelato alla benzina.

### 28. Combustione del metanolo

**2 CH₃OH + 3 O₂ → 2 CO₂ + 4 H₂O**

- **Sul banco**: aggiungi 2 × Metanolo (CH₃OH), 3 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −1451,9 kJ, esotermica (libera calore).
- **Cosa succede**: Il metanolo brucia con fiamma quasi invisibile.

### 29. Respirazione cellulare

**C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O**

- **Sul banco**: aggiungi 1 × Glucosio (C₆H₁₂O₆), 6 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −2802,7 kJ, esotermica (libera calore).
- **Cosa succede**: Nelle cellule il glucosio viene "bruciato" in molti piccoli passaggi controllati da enzimi: l'energia viene immagazzinata nell'ATP.

### 30. Combustione dell'acido solfidrico

**2 H₂S + 3 O₂ → 2 SO₂ + 2 H₂O**

- **Sul banco**: aggiungi 2 × Acido solfidrico (H₂S), 3 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −1124,1 kJ, esotermica (libera calore).
- **Cosa succede**: Avviene negli impianti che eliminano lo zolfo dal gas naturale.

### 31. Ossidazione dell'ammoniaca (Ostwald)

**4 NH₃ + 5 O₂ → 4 NO + 6 H₂O**

- **Sul banco**: aggiungi 4 × Ammoniaca (NH₃), 5 × Ossigeno (O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −1166,0 kJ, esotermica (libera calore).
- **Cosa succede**: Primo passaggio della produzione dell'acido nitrico (catalizzatore: rete di platino e rodio a circa 900 °C).


## Decomposizioni (5)

### 32. Decomposizione del calcare

**CaCO₃ → CaO + CO₂**

- **Sul banco**: aggiungi 1 × Carbonato di calcio (CaCO₃) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = +179,2 kJ, endotermica (serve energia: con «Simula reazione» usa poi «Fornisci energia e simula»).
- **Cosa succede**: Scaldando il calcare oltre 800 °C nelle fornaci si ottiene la calce viva: reazione endotermica.

### 33. Decomposizione dell'acqua ossigenata

**2 H₂O₂ → 2 H₂O + O₂**

- **Sul banco**: aggiungi 2 × Perossido di idrogeno (H₂O₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −196,1 kJ, esotermica (libera calore).
- **Cosa succede**: Lenta da sola, velocissima con un catalizzatore (diossido di manganese, o l'enzima catalasi del sangue): per questo fa schiuma sulle ferite.

### 34. Elettrolisi dell'acqua

**2 H₂O → 2 H₂ + O₂**

- **Sul banco**: aggiungi 2 × Acqua (H₂O) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = +571,7 kJ, endotermica (serve energia: con «Simula reazione» usa poi «Fornisci energia e simula»).
- **Cosa succede**: Fortemente endotermica: l'energia viene fornita dalla corrente elettrica. Al catodo si forma il doppio del volume di gas rispetto all'anodo.

### 35. Decomposizione del bicarbonato

**2 NaHCO₃ → Na₂CO₃ + H₂O + CO₂**

- **Sul banco**: aggiungi 2 × Bicarbonato di sodio (NaHCO₃) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = +91,6 kJ, endotermica (serve energia: con «Simula reazione» usa poi «Fornisci energia e simula»).
- **Cosa succede**: La CO₂ che si libera con il calore fa lievitare i dolci.

### 36. Decomposizione dell'ammoniaca

**2 NH₃ → N₂ + 3 H₂**

- **Sul banco**: aggiungi 2 × Ammoniaca (NH₃) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = +91,9 kJ, endotermica (serve energia: con «Simula reazione» usa poi «Fornisci energia e simula»).
- **Cosa succede**: Reazione inversa del processo Haber-Bosch: ha ΔH uguale e di segno opposto.


## Acidi e basi (4)

### 37. Ammoniaca e acido cloridrico

**NH₃ + HCl → NH₄Cl**

- **Sul banco**: aggiungi 1 × Ammoniaca (NH₃), 1 × Cloruro di idrogeno (HCl) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −176,1 kJ, esotermica (libera calore).
- **Cosa succede**: I due gas formano un fumo bianco di cristalli di cloruro di ammonio: l'azoto usa la sua coppia solitaria per legare lo ione H⁺.

### 38. Idrossido di sodio e acido cloridrico

**NaOH + HCl → NaCl + H₂O**

- **Sul banco**: aggiungi 1 × Idrossido di sodio (NaOH), 1 × Cloruro di idrogeno (HCl) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −178,9 kJ, esotermica (libera calore).
- **Cosa succede**: Una base e un acido formano un sale e acqua.
- **Nota**: Qui le sostanze sono pure (NaOH solido, HCl gassoso). In soluzione acquosa la neutralizzazione H⁺ + OH⁻ → H₂O libera circa 56 kJ per mole d'acqua.

### 39. Spegnimento della calce

**CaO + H₂O → Ca(OH)₂**

- **Sul banco**: aggiungi 1 × Ossido di calcio (CaO), 1 × Acqua (H₂O) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −64,5 kJ, esotermica (libera calore).
- **Cosa succede**: Aggiungendo acqua alla calce viva si forma la calce spenta, con forte riscaldamento.

### 40. Sodio e acqua

**2 Na + 2 H₂O → 2 NaOH + H₂**

- **Sul banco**: aggiungi 2 × Sodio (Na), 2 × Acqua (H₂O) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −279,9 kJ, esotermica (libera calore).
- **Cosa succede**: Reazione vivace: il sodio galleggia, sfrigola e l'idrogeno che si libera può incendiarsi.


## Altre reazioni (7)

### 41. Fotosintesi

**6 CO₂ + 6 H₂O → C₆H₁₂O₆ + 6 O₂**

- **Sul banco**: aggiungi 6 × Anidride carbonica (CO₂), 6 × Acqua (H₂O) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = +2802,7 kJ, endotermica (serve energia: con «Simula reazione» usa poi «Fornisci energia e simula»).
- **Cosa succede**: Le piante usano l'energia della luce per produrre glucosio: è la respirazione cellulare al contrario, fortemente endotermica.

### 42. Fermentazione alcolica

**C₆H₁₂O₆ → 2 C₂H₅OH + 2 CO₂**

- **Sul banco**: aggiungi 1 × Glucosio (C₆H₁₂O₆) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −68,9 kJ, esotermica (libera calore).
- **Serve**: i lieviti — la simulazione non la esegue da sola; usa «Reazioni → Avvia la reazione».
- **Cosa succede**: I lieviti trasformano gli zuccheri in alcol e anidride carbonica (vino, birra, pane).

### 43. Reazione della termite

**Fe₂O₃ + 2 Al → Al₂O₃ + 2 Fe**

- **Sul banco**: aggiungi 1 × Ossido di ferro(III) (Fe₂O₃), 2 × Alluminio (Al) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −851,5 kJ, esotermica (libera calore).
- **Cosa succede**: L'alluminio strappa l'ossigeno al ferro: si raggiungono circa 2500 °C e il ferro esce fuso. Si usa per saldare i binari.

### 44. Polvere nera

**2 KNO₃ + S + 3 C → K₂S + N₂ + 3 CO₂**

- **Sul banco**: aggiungi 2 × Nitrato di potassio (KNO₃), 1 × Zolfo (S), 3 × Carbonio (C) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −572,0 kJ, esotermica (libera calore).
- **Cosa succede**: Il salnitro (KNO₃) porta con sé l'ossigeno che brucia il carbone, mentre lo zolfo abbassa la temperatura di accensione: per questo la miscela brucia rapidissima anche senza aria. I gas caldi (N₂ e CO₂) occupano centinaia di volte il volume della polvere.
- **Nota**: È l'equazione dei libri di testo. Nella combustione reale si formano anche K₂CO₃, K₂SO₄ e CO, che lasciano il caratteristico fumo bianco. Inventata in Cina nel IX secolo, è il più antico esplosivo conosciuto.

### 45. Clorurazione del metano

**CH₄ + Cl₂ → CH₃Cl + HCl**

- **Sul banco**: aggiungi 1 × Metano (CH₄), 1 × Cloro (Cl₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −99,3 kJ, esotermica (libera calore).
- **Cosa succede**: Sostituzione radicalica: la luce rompe Cl₂ in due radicali, che strappano un idrogeno al metano.

### 46. Idrogenazione dell'etilene

**C₂H₄ + H₂ → C₂H₆**

- **Sul banco**: aggiungi 1 × Etilene (C₂H₄), 1 × Idrogeno (H₂) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −136,4 kJ, esotermica (libera calore).
- **Cosa succede**: Il doppio legame si apre e lega due idrogeni (catalizzatore: nichel, platino o palladio). Così si producono le margarine.

### 47. Idratazione dell'etilene

**C₂H₄ + H₂O → C₂H₅OH**

- **Sul banco**: aggiungi 1 × Etilene (C₂H₄), 1 × Acqua (H₂O) (oppure apri «Reazioni», scegli questa reazione e premi «Solo reagenti»).
- **Energia**: ΔH° = −44,2 kJ, esotermica (libera calore).
- **Cosa succede**: Sintesi industriale dell'etanolo, con acido fosforico come catalizzatore.
