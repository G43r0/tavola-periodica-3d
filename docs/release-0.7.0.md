# v0.7.0 — Catalogo delle reazioni e 109 nuove sostanze

La libreria «Esempi» passa da **445 a 554 sostanze** e il progetto ha ora il **catalogo di 1349 reazioni chimiche** tra
le sostanze della libreria e i 118 elementi. Nel laboratorio è disponibile in più la **reazione della polvere nera**.

## Novità

- **Catalogo delle reazioni** ([docs/catalogo-reazioni.md](docs/catalogo-reazioni.md)): 1349 reazioni reali e
  bilanciate (verificate con il bilanciatore del progetto), in 14 sezioni, con condizioni, note ed entalpia di
  reazione dove è calcolabile (315 reazioni). Tutte le 554 sostanze e 85 elementi vi compaiono almeno una volta.
- **109 nuove sostanze** (elenco sotto), 72 con entalpia di formazione (NIST/CRC).
- **Polvere nera** nel gruppo «Altre reazioni» del laboratorio: 2 KNO₃ + S + 3 C → K₂S + N₂ + 3 CO₂, ΔH° ≈ −572 kJ.
  Il nitrato di potassio ha ora ΔHf° = −494,6 kJ/mol. Le reazioni del laboratorio sono 47.
- Un atomo isolato con carica (es. Na⁺ ottenuto con ±e⁻) è riconosciuto come lo ione della libreria.
- Struttura di Lewis: un metallo con carica dentro un complesso (es. Fe³⁺ in [Fe(SCN)]²⁺) tiene solo gli elettroni
  che gli restano come ione. Nessuna voce preesistente cambia.

## Limiti

- Il motore del laboratorio carica ancora solo le 47 reazioni di `src/lab/data/reactions.js`: le altre 1302 sono nel catalogo, non
  ancora eseguibili nell'app.
- Nichel tetracarbonile Ni(CO)₄ non incluso (il laboratorio conta gli elettroni di valenza dei metalli di transizione
  dallo stato di ossidazione massimo). Polimerizzazioni e reazioni nucleari sono escluse.
- Negli idrati l'acqua di cristallizzazione compare sul banco come molecole separate.
- Solo 159 sostanze su 554 hanno l'entalpia di formazione, quindi non per tutte le reazioni si calcola il ΔH°.

## Le 109 nuove sostanze

**Ioni e complessi (20)**: Ione sodio (Na⁺), Ione potassio (K⁺), Ione argento (Ag⁺), Ione calcio (Ca²⁺), Ione bario (Ba²⁺), Ione piombo(II) (Pb²⁺), Ione rame(II) (Cu²⁺), Ione zinco (Zn²⁺), Ione ferro(II) (Fe²⁺), Ione ferro(III) (Fe³⁺), Ione manganese(II) (Mn²⁺), Ione cromo(III) (Cr³⁺), Ione cloruro (Cl⁻), Ione bromuro (Br⁻), Ione ioduro (I⁻), Ione tetrationato (S₄O₆²⁻), Ione tiocianatoferro(III) ([Fe(SCN)]²⁺), Ione tetraamminorame(II) ([Cu(NH₃)₄]²⁺), Ione diamminoargento(I) ([Ag(NH₃)₂]⁺), Ione ditiosolfatoargentato(I) ([Ag(S₂O₃)₂]³⁻)

**Ossidi (7)**: Diossido di silicio (SiO₂), Triossido di diboro (B₂O₃), Esossido di tetrafosforo (P₄O₆), Triossido di arsenico (As₄O₆), Diossido di selenio (SeO₂), Diossido di germanio (GeO₂), Pentossido di diiodio (I₂O₅)

**Altre inorganiche (1)**: Monoclorammina (NH₂Cl)

**Acidi (2)**: Acido disolforico (H₂S₂O₇), Acido perrenico (HReO₄)

**Sali (27)**: Silicato di sodio (Na₂SiO₃), Silicato di calcio (CaSiO₃), Superossido di potassio (KO₂), Solfuro di potassio (K₂S), Solfuro di calcio (CaS), Ossido di bario (BaO), Perossido di bario (BaO₂), Carbonato di bario (BaCO₃), Idrogenosolfato di sodio (NaHSO₄), Nitrito di potassio (KNO₂), Nitrato di calcio (Ca(NO₃)₂), Nitrato di magnesio (Mg(NO₃)₂), Nitrato di bario (Ba(NO₃)₂), Idrogenocarbonato di calcio (Ca(HCO₃)₂), Ipoclorito di calcio (Ca(ClO)₂), Clorato di sodio (NaClO₃), Clorito di sodio (NaClO₂), Diidrogenofosfato di calcio (Ca(H₂PO₄)₂), Diidrogenofosfato di ammonio (NH₄H₂PO₄), Idrossido di rubidio (RbOH), Idrossido di cesio (CsOH), Idrossido di stronzio (Sr(OH)₂), Tetraidrossoalluminato di sodio (Na[Al(OH)₄]), Solfato di piombo(II) (PbSO₄), Cloruro di piombo(II) (PbCl₂), Solfato di calcio diidrato (CaSO₄·2H₂O), Cianato di ammonio (NH₄OCN)

**Composti dei metalli di transizione e di post-transizione (27)**: Solfato di rame(II) pentaidrato (CuSO₄·5H₂O), Cloruro di cobalto(II) esaidrato (CoCl₂·6H₂O), Solfuro di ferro(II) (FeS), Idrossido di ferro(II) (Fe(OH)₂), Idrossido di ferro(III) (Fe(OH)₃), Solfato di ferro(III) (Fe₂(SO₄)₃), Solfato di manganese(II) (MnSO₄), Cloruro di manganese(II) (MnCl₂), Manganato di potassio (K₂MnO₄), Ossido di manganese(III) (Mn₂O₃), Solfato di cromo(III) (Cr₂(SO₄)₃), Cloruro di cromo(III) (CrCl₃), Triossido di cromo (CrO₃), Cromato di piombo(II) (PbCrO₄), Cromato d'argento (Ag₂CrO₄), Cromato di bario (BaCrO₄), Ioduro d'argento (AgI), Ossido d'argento (Ag₂O), Nitrato di rame(II) (Cu(NO₃)₂), Solfuro di rame(II) (CuS), Solfuro di rame(I) (Cu₂S), Carbonato basico di rame(II) (Cu₂(OH)₂CO₃), Ioduro di rame(I) (CuI), Tetraidrossozincato di sodio (Na₂[Zn(OH)₄]), Solfato di mercurio(II) (HgSO₄), Acido tetracloroaurico (HAuCl₄), Acido esacloroplatinico (H₂PtCl₆)

**Lantanidi e attinidi (5)**: Tetrafluoruro di uranio (UF₄), Fluoruro di uranile (UO₂F₂), Ossido di uranio (U₃O₈), Cloruro di lantanio (LaCl₃), Ossido di cerio(III) (Ce₂O₃)

**Idrocarburi (2)**: Etilbenzene (C₆H₅C₂H₅), Cumene (C₆H₅CH(CH₃)₂)

**Composti organici (12)**: 1,2-Dibromoetano (BrCH₂CH₂Br), 1,2-Dicloroetano (ClCH₂CH₂Cl), Bromobenzene (C₆H₅Br), Nitrobenzene (C₆H₅NO₂), Acido tereftalico (C₆H₄(COOH)₂), 3-Metilbutan-1-olo ((CH₃)₂CHCH₂CH₂OH), Acetato di metile (CH₃COOCH₃), Cloruro di acetile (CH₃COCl), Etossido di sodio (C₂H₅ONa), Etanolammina (HOCH₂CH₂NH₂), 4-Amminofenolo (HOC₆H₄NH₂), Stearato di sodio (C₁₇H₃₅COONa)

**Biomolecole (5)**: Tristearina (C₅₇H₁₁₀O₆), Sorbitolo (C₆H₁₄O₆), Acido gluconico (C₆H₁₂O₇), Glicilglicina (C₄H₈N₂O₃), Acido deidroascorbico (C₆H₆O₆)

**Farmaci (1)**: Salicilato di metile (HOC₆H₄COOCH₃)

## Le 1349 reazioni

Formato: numero, equazione bilanciata — condizioni; ΔH° a 25 °C (negativo = esotermica). **già nell'app** = una delle
47 reazioni già presenti nel laboratorio. Note, specie e dettagli completi sono nel
[catalogo](docs/catalogo-reazioni.md).

#### 1. Sintesi dagli elementi (169)

*1.1 Metalli e ossigeno: ossidi (63)*

1. 4 Li + O₂ → 2 Li₂O — Δ; ΔH° −1196 kJ
2. 4 Na + O₂ → 2 Na₂O — ossigeno limitato; ΔH° −828 kJ · **già nell'app**
3. 2 Na + O₂ → Na₂O₂ — Δ, ossigeno in eccesso
4. 4 K + O₂ → 2 K₂O — ossigeno limitato; ΔH° −723 kJ
5. 2 Mg + O₂ → 2 MgO — innesco; ΔH° −1203 kJ · **già nell'app**
6. 2 Ca + O₂ → 2 CaO — aria; ΔH° −1270 kJ · **già nell'app**
7. 4 Al + 3 O₂ → 2 Al₂O₃ — aria; ΔH° −3351 kJ · **già nell'app**
8. 4 Sc + 3 O₂ → 2 Sc₂O₃ — Δ
9. Ti + O₂ → TiO₂ — Δ
10. 4 V + 5 O₂ → 2 V₂O₅ — Δ
11. 4 Cr + 3 O₂ → 2 Cr₂O₃ — Δ
12. 4 Fe + 3 O₂ → 2 Fe₂O₃ — aria umida, lenta; ΔH° −1648 kJ
13. 3 Fe + 2 O₂ → Fe₃O₄ — Δ
14. 2 Fe + O₂ → 2 FeO — Δ > 570 °C, poco ossigeno
15. 2 Ni + O₂ → 2 NiO — Δ
16. 2 Cu + O₂ → 2 CuO — Δ
17. 4 Cu + O₂ → 2 Cu₂O — Δ > 1000 °C
18. 2 Zn + O₂ → 2 ZnO — Δ
19. 4 Ga + 3 O₂ → 2 Ga₂O₃ — Δ
20. 4 Y + 3 O₂ → 2 Y₂O₃ — Δ
21. Zr + O₂ → ZrO₂ — Δ
22. 4 Nb + 5 O₂ → 2 Nb₂O₅ — Δ
23. 2 Mo + 3 O₂ → 2 MoO₃ — Δ
24. Ru + O₂ → RuO₂ — Δ
25. 4 In + 3 O₂ → 2 In₂O₃ — Δ
26. Sn + O₂ → SnO₂ — Δ
27. Hf + O₂ → HfO₂ — Δ
28. 4 Ta + 5 O₂ → 2 Ta₂O₅ — Δ
29. 2 W + 3 O₂ → 2 WO₃ — Δ
30. 4 Re + 7 O₂ → 2 Re₂O₇ — Δ
31. Os + 2 O₂ → OsO₄ — aria (polvere)
32. Ir + O₂ → IrO₂ — Δ
33. 2 Hg + O₂ → 2 HgO — Δ ~350 °C
34. 2 Pb + O₂ → 2 PbO — Δ
35. 4 Bi + 3 O₂ → 2 Bi₂O₃ — Δ
36. Po + O₂ → PoO₂ — Δ
37. 4 La + 3 O₂ → 2 La₂O₃ — aria
38. Ce + O₂ → CeO₂ — aria
39. 4 Pr + 3 O₂ → 2 Pr₂O₃ — Δ
40. 4 Nd + 3 O₂ → 2 Nd₂O₃ — aria
41. 4 Pm + 3 O₂ → 2 Pm₂O₃ — aria
42. 4 Sm + 3 O₂ → 2 Sm₂O₃ — Δ
43. 4 Eu + 3 O₂ → 2 Eu₂O₃ — aria
44. 4 Gd + 3 O₂ → 2 Gd₂O₃ — Δ
45. 4 Dy + 3 O₂ → 2 Dy₂O₃ — Δ
46. 4 Ho + 3 O₂ → 2 Ho₂O₃ — Δ
47. 4 Er + 3 O₂ → 2 Er₂O₃ — Δ
48. 4 Tm + 3 O₂ → 2 Tm₂O₃ — Δ
49. 4 Yb + 3 O₂ → 2 Yb₂O₃ — Δ
50. 4 Lu + 3 O₂ → 2 Lu₂O₃ — Δ
51. 4 Ac + 3 O₂ → 2 Ac₂O₃ — Δ
52. Th + O₂ → ThO₂ — Δ
53. 4 Pa + 5 O₂ → 2 Pa₂O₅ — Δ
54. U + O₂ → UO₂ — Δ
55. Np + O₂ → NpO₂ — Δ
56. Pu + O₂ → PuO₂ — aria
57. Am + O₂ → AmO₂ — Δ
58. 4 Cm + 3 O₂ → 2 Cm₂O₃ — Δ
59. Bk + O₂ → BkO₂ — Δ
60. 4 Cf + 3 O₂ → 2 Cf₂O₃ — Δ
61. 4 Es + 3 O₂ → 2 Es₂O₃ — Δ
62. K + O₂ → KO₂ — ossigeno in eccesso; ΔH° −285 kJ
63. 3 U + 4 O₂ → U₃O₈ — Δ, aria; ΔH° −3575 kJ

*1.2 Metalli e alogeni: alogenuri (39)*

64. 2 Li + Cl₂ → 2 LiCl — ΔH° −817 kJ
65. 2 Li + F₂ → 2 LiF — ΔH° −1232 kJ
66. 2 Na + Cl₂ → 2 NaCl — ΔH° −822 kJ · **già nell'app**
67. 2 Na + F₂ → 2 NaF — ΔH° −1153 kJ
68. 2 Na + Br₂ → 2 NaBr
69. 2 Na + I₂ → 2 NaI — Δ
70. 2 K + Cl₂ → 2 KCl — ΔH° −873 kJ
71. 2 K + F₂ → 2 KF
72. 2 K + Br₂ → 2 KBr — ΔH° −788 kJ
73. 2 K + I₂ → 2 KI — Δ; ΔH° −656 kJ
74. 2 Rb + Cl₂ → 2 RbCl
75. 2 Cs + Cl₂ → 2 CsCl
76. Be + Cl₂ → BeCl₂ — Δ; ΔH° −490 kJ
77. Mg + Cl₂ → MgCl₂ — Δ; ΔH° −641 kJ
78. Ca + Cl₂ → CaCl₂ — Δ; ΔH° −795 kJ
79. Ca + F₂ → CaF₂ — ΔH° −1228 kJ
80. Sr + Cl₂ → SrCl₂ — Δ
81. Ba + Cl₂ → BaCl₂ — Δ
82. Ra + Cl₂ → RaCl₂ — Δ
83. 2 Al + 3 Cl₂ → 2 AlCl₃
84. Ti + 2 Cl₂ → TiCl₄ — Δ
85. 2 Fe + 3 Cl₂ → 2 FeCl₃ — Δ
86. Co + Cl₂ → CoCl₂ — Δ
87. Cu + Cl₂ → CuCl₂ — Δ
88. 2 Cu + Cl₂ → 2 CuCl — Δ, rame in eccesso
89. Zn + Cl₂ → ZnCl₂ — Δ
90. Ge + 2 Cl₂ → GeCl₄ — Δ
91. 2 Rh + 3 Cl₂ → 2 RhCl₃ — Δ ~300 °C
92. Pd + Cl₂ → PdCl₂ — Δ
93. 2 Ag + Cl₂ → 2 AgCl — Δ
94. 2 Ag + Br₂ → 2 AgBr
95. Sn + 2 Cl₂ → SnCl₄
96. 2 Sb + 5 Cl₂ → 2 SbCl₅ — cloro in eccesso
97. 2 Tb + 3 Cl₂ → 2 TbCl₃ — Δ
98. 2 Au + 3 Cl₂ → 2 AuCl₃ — Δ ~200 °C
99. Hg + Cl₂ → HgCl₂ — Δ
100. 2 Hg + Cl₂ → Hg₂Cl₂ — mercurio in eccesso
101. Pb + I₂ → PbI₂ — Δ
102. U + 3 F₂ → UF₆ — Δ

*1.3 Metalli con zolfo, azoto, idrogeno e carbonio (15)*

103. 2 Na + S → Na₂S — Δ
104. Zn + S → ZnS — innesco
105. Fe + 2 S → FeS₂ — Δ, zolfo in eccesso
106. 2 Ag + S → Ag₂S
107. Hg + S → HgS — temperatura ambiente
108. Pb + S → PbS — Δ
109. Cd + S → CdS — Δ
110. Mo + 2 S → MoS₂ — Δ
111. 6 Li + N₂ → 2 Li₃N — temperatura ambiente
112. 3 Mg + N₂ → Mg₃N₂ — Δ
113. 2 Li + H₂ → 2 LiH — Δ ~700 °C
114. 2 Na + H₂ → 2 NaH — Δ ~300 °C
115. Ca + H₂ → CaH₂ — Δ
116. Ca + 2 C → CaC₂ — Δ > 2000 °C
117. Fe + S → FeS — Δ; ΔH° −100 kJ

*1.4 Non metalli e ossigeno (12)*

118. 2 H₂ + O₂ → 2 H₂O — scintilla; ΔH° −572 kJ · **già nell'app**
119. C + O₂ → CO₂ — innesco; ΔH° −394 kJ · **già nell'app**
120. 2 C + O₂ → 2 CO — ossigeno scarso; ΔH° −221 kJ · **già nell'app**
121. S + O₂ → SO₂ — innesco; ΔH° −297 kJ · **già nell'app**
122. S₈ + 8 O₂ → 8 SO₂ — innesco
123. P₄ + 5 O₂ → P₄O₁₀ — spontanea all'aria
124. N₂ + O₂ → 2 NO — Δ > 2000 °C, fulmini; ΔH° 183 kJ · **già nell'app**
125. Si + O₂ → SiO₂ — Δ; ΔH° −911 kJ
126. 4 B + 3 O₂ → 2 B₂O₃ — Δ; ΔH° −2547 kJ
127. P₄ + 3 O₂ → P₄O₆ — ossigeno scarso
128. 4 As + 3 O₂ → As₄O₆ — Δ; ΔH° −1315 kJ
129. Se + O₂ → SeO₂ — Δ; ΔH° −225 kJ

*1.5 Idrogeno e non metalli (9)*

130. H₂ + F₂ → 2 HF — anche al buio; ΔH° −547 kJ · **già nell'app**
131. H₂ + Cl₂ → 2 HCl — luce o scintilla; ΔH° −185 kJ · **già nell'app**
132. H₂ + Br₂ → 2 HBr — Δ o luce; ΔH° −73 kJ
133. H₂ + I₂ ⇌ 2 HI — Δ; ΔH° 53 kJ
134. H₂ + S → H₂S — Δ; ΔH° −21 kJ
135. H₂ + Se → H₂Se — Δ > 350 °C
136. N₂ + 3 H₂ → 2 NH₃ — cat. Fe, 450 °C, 200 atm; ΔH° −92 kJ · **già nell'app**
137. C + 2 H₂ → CH₄ — Δ, cat. Ni; ΔH° −75 kJ
138. 2 C + H₂ → C₂H₂ — arco elettrico > 3000 °C; ΔH° 227 kJ

*1.6 Alogeni con non metalli e interalogeni (27)*

139. 2 B + 3 Cl₂ → 2 BCl₃ — Δ
140. 2 B + 3 Br₂ → 2 BBr₃ — Δ
141. 2 B + 3 F₂ → 2 BF₃ — ΔH° −2272 kJ
142. Si + 2 Cl₂ → SiCl₄ — Δ
143. Si + 2 F₂ → SiF₄ — spontanea
144. C + 2 F₂ → CF₄
145. P₄ + 6 Cl₂ → 4 PCl₃ — cloro limitato
146. P₄ + 10 Cl₂ → 4 PCl₅ — cloro in eccesso
147. P₄ + 6 Br₂ → 4 PBr₃
148. P₄ + 10 F₂ → 4 PF₅
149. 2 As + 3 Cl₂ → 2 AsCl₃
150. 2 As + 5 F₂ → 2 AsF₅
151. 2 S + Cl₂ → S₂Cl₂ — zolfo fuso
152. S + Cl₂ → SCl₂ — cloro in eccesso
153. S + 3 F₂ → SF₆ — ΔH° −1220 kJ
154. Se + 3 F₂ → SeF₆
155. Te + 3 F₂ → TeF₆
156. Cl₂ + F₂ → 2 ClF — Δ ~250 °C
157. Cl₂ + 3 F₂ → 2 ClF₃ — Δ, fluoro in eccesso; ΔH° −326 kJ
158. Cl₂ + 5 F₂ → 2 ClF₅ — Δ, pressione
159. Br₂ + 3 F₂ → 2 BrF₃
160. Br₂ + 5 F₂ → 2 BrF₅ — fluoro in eccesso
161. I₂ + 5 F₂ → 2 IF₅
162. I₂ + 7 F₂ → 2 IF₇ — Δ ~250 °C
163. I₂ + Cl₂ → 2 ICl
164. I₂ + Br₂ → 2 IBr
165. Br₂ + Cl₂ ⇌ 2 BrCl

*1.7 Gas nobili (4)*

166. Xe + F₂ → XeF₂ — luce UV o Δ
167. Xe + 2 F₂ → XeF₄ — Δ 400 °C, Xe:F₂ = 1:5
168. Xe + 3 F₂ → XeF₆ — Δ 300 °C, alta pressione di F₂
169. Kr + F₂ → KrF₂ — scarica elettrica a −196 °C

#### 2. Sintesi da composti (addizione) (41)

*2.1 Ossidazioni per addizione di ossigeno (11)*

170. 2 CO + O₂ → 2 CO₂ — cat. (marmitta); ΔH° −566 kJ · **già nell'app**
171. 2 SO₂ + O₂ → 2 SO₃ — cat. V₂O₅, 450 °C; ΔH° −288 kJ · **già nell'app**
172. 2 NO + O₂ → 2 NO₂ — spontanea; ΔH° −116 kJ · **già nell'app**
173. 3 O₂ → 2 O₃ — luce UV o scarica elettrica; ΔH° 285 kJ · **già nell'app**
174. 2 PCl₃ + O₂ → 2 POCl₃
175. 2 Na₂SO₃ + O₂ → 2 Na₂SO₄ — aria, lenta
176. 4 FeO + O₂ → 2 Fe₂O₃ — Δ
177. 4 Fe₃O₄ + O₂ → 6 Fe₂O₃ — Δ
178. 2 Cu₂O + O₂ → 4 CuO — Δ
179. 2 BaO + O₂ → 2 BaO₂ — Δ 500 °C; ΔH° −173 kJ
180. 2 CeO₂ + CO → Ce₂O₃ + CO₂ — cat.

*2.2 Addizione di alogeni (18)*

181. PCl₃ + Cl₂ → PCl₅ — ΔH° −124 kJ · **già nell'app**
182. CO + Cl₂ → COCl₂ — cat. carbone attivo
183. SO₂ + Cl₂ ⇌ SO₂Cl₂ — cat. carbone attivo
184. 2 NO + Cl₂ → 2 NOCl
185. 2 FeCl₂ + Cl₂ → 2 FeCl₃
186. SnCl₂ + Cl₂ → SnCl₄
187. 2 CuCl + Cl₂ → 2 CuCl₂
188. Hg₂Cl₂ + Cl₂ → 2 HgCl₂
189. S₂Cl₂ + Cl₂ → 2 SCl₂ — cat. FeCl₃
190. PF₃ + F₂ → PF₅
191. SF₄ + F₂ → SF₆ — ΔH° −457 kJ
192. XeF₂ + F₂ → XeF₄ — Δ
193. XeF₄ + F₂ → XeF₆ — Δ, pressione
194. ClF + F₂ → ClF₃ — Δ
195. ClF₃ + F₂ → ClF₅ — Δ, pressione
196. BrF₃ + F₂ → BrF₅ — Δ
197. IF₅ + F₂ → IF₇ — Δ
198. UF₄ + F₂ → UF₆ — Δ

*2.3 Comproporzioni e altre addizioni (12)*

199. HgCl₂ + Hg → Hg₂Cl₂ — Δ
200. CuCl₂ + Cu → 2 CuCl — Δ, HCl concentrato
201. SnCl₄ + Sn → 2 SnCl₂
202. 2 FeCl₃ + Fe → 3 FeCl₂ — soluzione
203. CO + S → COS — Δ
204. CO + 2 H₂ → CH₃OH — cat. Cu/ZnO, 250 °C, 50-100 atm; ΔH° −129 kJ · **già nell'app**
205. Na₂SO₃ + S → Na₂S₂O₃ — ebollizione in soluzione
206. KCN + S → KSCN — fusione
207. 2 NO₂ ⇌ N₂O₄ — raffreddamento
208. SO₃ + H₂SO₄ → H₂S₂O₇ — ΔH° −19 kJ
209. CuSO₄ + 5 H₂O → CuSO₄·5H₂O
210. CoCl₂ + 6 H₂O → CoCl₂·6H₂O — umidità

#### 3. Combustioni (138)

*3.1 Combustibili inorganici (12)*

211. 4 NH₃ + 3 O₂ → 2 N₂ + 6 H₂O — innesco, O₂ puro; ΔH° −1531 kJ
212. 4 NH₃ + 5 O₂ → 4 NO + 6 H₂O — cat. Pt/Rh, 900 °C; ΔH° −1166 kJ · **già nell'app**
213. N₂H₄ + O₂ → N₂ + 2 H₂O — innesco; ΔH° −622 kJ
214. 2 H₂S + 3 O₂ → 2 SO₂ + 2 H₂O — innesco; ΔH° −1124 kJ · **già nell'app**
215. 2 H₂S + O₂ → 2 S + 2 H₂O — ossigeno scarso; ΔH° −530 kJ
216. CS₂ + 3 O₂ → CO₂ + 2 SO₂ — Δ ~90 °C
217. 2 COS + 3 O₂ → 2 CO₂ + 2 SO₂ — innesco
218. 4 HCN + 5 O₂ → 4 CO₂ + 2 H₂O + 2 N₂ — innesco; ΔH° −2581 kJ
219. (CN)₂ + 2 O₂ → 2 CO₂ + N₂ — innesco
220. 4 PH₃ + 8 O₂ → P₄O₁₀ + 6 H₂O — spontanea
221. C₃O₂ + 2 O₂ → 3 CO₂ — innesco
222. SiH₄ + 2 O₂ → SiO₂ + 2 H₂O — spontanea; ΔH° −1517 kJ

*3.2 Idrocarburi (36)*

223. CH₄ + 2 O₂ → CO₂ + 2 H₂O — innesco; ΔH° −890 kJ · **già nell'app**
224. 2 C₂H₆ + 7 O₂ → 4 CO₂ + 6 H₂O — innesco; ΔH° −3121 kJ · **già nell'app**
225. C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O — innesco; ΔH° −2219 kJ · **già nell'app**
226. 2 C₄H₁₀ + 13 O₂ → 8 CO₂ + 10 H₂O — innesco; ΔH° −5755 kJ · **già nell'app**
227. 2 CH(CH₃)₃ + 13 O₂ → 8 CO₂ + 10 H₂O — innesco; ΔH° −5738 kJ
228. C₂H₄ + 3 O₂ → 2 CO₂ + 2 H₂O — innesco; ΔH° −1411 kJ · **già nell'app**
229. 2 C₂H₂ + 5 O₂ → 4 CO₂ + 2 H₂O — innesco; ΔH° −2600 kJ · **già nell'app**
230. 2 C₆H₆ + 15 O₂ → 12 CO₂ + 6 H₂O — innesco; ΔH° −6535 kJ · **già nell'app**
231. C₆H₁₂ + 9 O₂ → 6 CO₂ + 6 H₂O — innesco; ΔH° −3920 kJ
232. C₅H₁₂ + 8 O₂ → 5 CO₂ + 6 H₂O — innesco
233. (CH₃)₂CHCH₂CH₃ + 8 O₂ → 5 CO₂ + 6 H₂O — innesco
234. C(CH₃)₄ + 8 O₂ → 5 CO₂ + 6 H₂O — innesco
235. 2 C₆H₁₄ + 19 O₂ → 12 CO₂ + 14 H₂O — innesco
236. C₇H₁₆ + 11 O₂ → 7 CO₂ + 8 H₂O — innesco
237. 2 C₈H₁₈ (ottano) + 25 O₂ → 16 CO₂ + 18 H₂O — innesco
238. 2 C₈H₁₈ (2,2,4-Trimetilpentano) + 25 O₂ → 16 CO₂ + 18 H₂O — innesco
239. C₉H₂₀ + 14 O₂ → 9 CO₂ + 10 H₂O — innesco
240. 2 C₁₀H₂₂ + 31 O₂ → 20 CO₂ + 22 H₂O — innesco
241. 2 C₃H₆ (ciclopropano) + 9 O₂ → 6 CO₂ + 6 H₂O — innesco
242. C₄H₈ (ciclobutano) + 6 O₂ → 4 CO₂ + 4 H₂O — innesco
243. 2 C₅H₁₀ + 15 O₂ → 10 CO₂ + 10 H₂O — innesco
244. 2 C₃H₆ (propene) + 9 O₂ → 6 CO₂ + 6 H₂O — innesco
245. C₄H₈ (but-1-ene) + 6 O₂ → 4 CO₂ + 4 H₂O — innesco
246. C₄H₈ (but-2-ene) + 6 O₂ → 4 CO₂ + 4 H₂O — innesco
247. C₄H₈ (2-Metilpropene) + 6 O₂ → 4 CO₂ + 4 H₂O — innesco
248. 2 C₄H₆ + 11 O₂ → 8 CO₂ + 6 H₂O — innesco
249. C₅H₈ + 7 O₂ → 5 CO₂ + 4 H₂O — innesco
250. 2 C₆H₁₀ + 17 O₂ → 12 CO₂ + 10 H₂O — innesco
251. C₃H₄ + 4 O₂ → 3 CO₂ + 2 H₂O — innesco
252. C₆H₅CH₃ + 9 O₂ → 7 CO₂ + 4 H₂O — innesco
253. 2 C₈H₁₀ (1,2-Dimetilbenzene) + 21 O₂ → 16 CO₂ + 10 H₂O — innesco
254. 2 C₈H₁₀ (1,3-Dimetilbenzene) + 21 O₂ → 16 CO₂ + 10 H₂O — innesco
255. 2 C₈H₁₀ (1,4-Dimetilbenzene) + 21 O₂ → 16 CO₂ + 10 H₂O — innesco
256. C₈H₈ + 10 O₂ → 8 CO₂ + 4 H₂O — innesco
257. C₁₀H₈ + 12 O₂ → 10 CO₂ + 4 H₂O — innesco
258. 2 C₁₄H₁₀ + 33 O₂ → 28 CO₂ + 10 H₂O — innesco

*3.3 Combustioni incomplete (6)*

259. 2 CH₄ + 3 O₂ → 2 CO + 4 H₂O — ossigeno insufficiente; ΔH° −1215 kJ
260. CH₄ + O₂ → C + 2 H₂O — ossigeno molto scarso; ΔH° −497 kJ
261. 2 C₃H₈ + 7 O₂ → 6 CO + 8 H₂O — ossigeno insufficiente; ΔH° −2740 kJ
262. 2 C₈H₁₈ (ottano) + 17 O₂ → 16 CO + 18 H₂O — ossigeno insufficiente
263. 2 C₂H₂ + O₂ → 4 C + 2 H₂O — senz'aria aggiunta; ΔH° −1026 kJ
264. 2 C₆H₆ + 9 O₂ → 12 CO + 6 H₂O — ossigeno insufficiente; ΔH° −3139 kJ

*3.4 Alcoli, eteri, aldeidi, chetoni, acidi ed esteri (30)*

265. 2 CH₃OH + 3 O₂ → 2 CO₂ + 4 H₂O — innesco; ΔH° −1452 kJ · **già nell'app**
266. C₂H₅OH + 3 O₂ → 2 CO₂ + 3 H₂O — innesco; ΔH° −1367 kJ · **già nell'app**
267. 2 CH₃CH₂CH₂OH + 9 O₂ → 6 CO₂ + 8 H₂O — innesco
268. 2 (CH₃)₂CHOH + 9 O₂ → 6 CO₂ + 8 H₂O — innesco
269. C₄H₁₀O + 6 O₂ → 4 CO₂ + 5 H₂O — innesco
270. 2 HOCH₂CH₂OH + 5 O₂ → 4 CO₂ + 6 H₂O — innesco
271. 2 C₃H₈O₃ + 7 O₂ → 6 CO₂ + 8 H₂O — innesco
272. C₆H₅OH + 7 O₂ → 6 CO₂ + 3 H₂O — innesco
273. CH₃OCH₃ + 3 O₂ → 2 CO₂ + 3 H₂O — innesco; ΔH° −1460 kJ
274. C₂H₅OC₂H₅ + 6 O₂ → 4 CO₂ + 5 H₂O — innesco
275. 2 C₄H₈O + 11 O₂ → 8 CO₂ + 8 H₂O — innesco
276. 2 C₂H₄O + 5 O₂ → 4 CO₂ + 4 H₂O — innesco
277. CH₂O + O₂ → CO₂ + H₂O — innesco; ΔH° −571 kJ
278. 2 CH₃CHO + 5 O₂ → 4 CO₂ + 4 H₂O — innesco; ΔH° −2333 kJ
279. CH₃CH₂CHO + 4 O₂ → 3 CO₂ + 3 H₂O — innesco
280. C₆H₅CHO + 8 O₂ → 7 CO₂ + 3 H₂O — innesco
281. CH₃COCH₃ + 4 O₂ → 3 CO₂ + 3 H₂O — innesco; ΔH° −1790 kJ
282. 2 CH₃COCH₂CH₃ + 11 O₂ → 8 CO₂ + 8 H₂O — innesco
283. 2 HCOOH + O₂ → 2 CO₂ + 2 H₂O — innesco; ΔH° −509 kJ
284. CH₃COOH + 2 O₂ → 2 CO₂ + 2 H₂O — innesco; ΔH° −874 kJ
285. 2 CH₃CH₂COOH + 7 O₂ → 6 CO₂ + 6 H₂O — innesco
286. CH₃(CH₂)₂COOH + 5 O₂ → 4 CO₂ + 4 H₂O — innesco
287. CH₃CH(OH)COOH + 3 O₂ → 3 CO₂ + 3 H₂O — innesco
288. 2 C₆H₈O₇ + 9 O₂ → 12 CO₂ + 8 H₂O — innesco
289. 2 C₆H₅COOH + 15 O₂ → 14 CO₂ + 6 H₂O — innesco
290. CH₃(CH₂)₁₆COOH + 26 O₂ → 18 CO₂ + 18 H₂O — innesco
291. 2 C₁₈H₃₄O₂ + 51 O₂ → 36 CO₂ + 34 H₂O — innesco
292. CH₃COOC₂H₅ + 5 O₂ → 4 CO₂ + 4 H₂O — innesco
293. 2 C₇H₁₄O₂ + 19 O₂ → 14 CO₂ + 14 H₂O — innesco
294. (CH₃CO)₂O + 4 O₂ → 4 CO₂ + 3 H₂O — innesco

*3.5 Composti azotati, solforati e alogenati (18)*

295. 4 CH₃NH₂ + 9 O₂ → 4 CO₂ + 10 H₂O + 2 N₂ — innesco; ΔH° −4340 kJ
296. 4 (CH₃)₂NH + 15 O₂ → 8 CO₂ + 14 H₂O + 2 N₂ — innesco
297. 4 (CH₃)₃N + 21 O₂ → 12 CO₂ + 18 H₂O + 2 N₂ — innesco
298. 4 C₂H₅NH₂ + 15 O₂ → 8 CO₂ + 14 H₂O + 2 N₂ — innesco
299. 4 C₆H₅NH₂ + 31 O₂ → 24 CO₂ + 14 H₂O + 2 N₂ — innesco
300. 4 C₅H₅N + 25 O₂ → 20 CO₂ + 10 H₂O + 2 N₂ — innesco
301. 4 HCONH₂ + 5 O₂ → 4 CO₂ + 6 H₂O + 2 N₂ — innesco
302. 4 CH₃CONH₂ + 11 O₂ → 8 CO₂ + 10 H₂O + 2 N₂ — innesco
303. 4 CH₃CN + 11 O₂ → 8 CO₂ + 6 H₂O + 2 N₂ — innesco
304. 4 CH₃NO₂ + 3 O₂ → 4 CO₂ + 6 H₂O + 2 N₂ — innesco
305. CH₃SH + 3 O₂ → CO₂ + 2 H₂O + SO₂ — innesco
306. (CH₃)₂SO + 4 O₂ → 2 CO₂ + 3 H₂O + SO₂ — innesco
307. 2 CH₃Cl + 3 O₂ → 2 CO₂ + 2 H₂O + 2 HCl — innesco; ΔH° −1379 kJ
308. C₂H₅Cl + 3 O₂ → 2 CO₂ + 2 H₂O + HCl — innesco
309. 2 CH₂=CHCl + 5 O₂ → 4 CO₂ + 2 H₂O + 2 HCl — innesco
310. C₆H₅Cl + 7 O₂ → 6 CO₂ + 2 H₂O + HCl — innesco
311. 2 CH₃Br + 3 O₂ → 2 CO₂ + 2 H₂O + 2 HBr — innesco
312. 4 CH₃I + 7 O₂ → 4 CO₂ + 6 H₂O + 2 I₂ — innesco

*3.6 Biomolecole e farmaci (36)*

313. C₆H₁₂O₆ (glucosio) + 6 O₂ → 6 CO₂ + 6 H₂O — enzimi (nelle cellule) o innesco; ΔH° −2803 kJ · **già nell'app**
314. C₆H₁₂O₆ (fruttosio) + 6 O₂ → 6 CO₂ + 6 H₂O — enzimi o innesco
315. C₅H₁₀O₅ + 5 O₂ → 5 CO₂ + 5 H₂O — innesco
316. 2 C₅H₁₀O₄ + 11 O₂ → 10 CO₂ + 10 H₂O — innesco
317. C₁₂H₂₂O₁₁ + 12 O₂ → 12 CO₂ + 11 H₂O — innesco
318. C₆H₈O₆ + 5 O₂ → 6 CO₂ + 4 H₂O — innesco
319. 4 NH₂CH₂COOH + 9 O₂ → 8 CO₂ + 10 H₂O + 2 N₂ — innesco; ΔH° −3894 kJ
320. 4 C₃H₇NO₂ + 15 O₂ → 12 CO₂ + 14 H₂O + 2 N₂ — innesco
321. 4 C₃H₇NO₃ + 13 O₂ → 12 CO₂ + 14 H₂O + 2 N₂ — innesco
322. 4 C₃H₇NO₂S + 19 O₂ → 12 CO₂ + 14 H₂O + 2 N₂ + 4 SO₂ — innesco
323. 4 C₅H₁₁NO₂ + 27 O₂ → 20 CO₂ + 22 H₂O + 2 N₂ — innesco
324. 4 C₆H₁₃NO₂ + 33 O₂ → 24 CO₂ + 26 H₂O + 2 N₂ — innesco
325. 4 C₉H₁₁NO₂ + 43 O₂ → 36 CO₂ + 22 H₂O + 2 N₂ — innesco
326. 4 C₉H₁₁NO₃ + 41 O₂ → 36 CO₂ + 22 H₂O + 2 N₂ — innesco
327. 4 C₅H₉NO₄ + 21 O₂ → 20 CO₂ + 18 H₂O + 2 N₂ — innesco
328. 2 C₆H₁₄N₂O₂ + 17 O₂ → 12 CO₂ + 14 H₂O + 2 N₂ — innesco
329. 4 C₅H₉NO₂ + 25 O₂ → 20 CO₂ + 18 H₂O + 2 N₂ — innesco
330. 4 C₅H₁₁NO₂S + 31 O₂ → 20 CO₂ + 22 H₂O + 2 N₂ + 4 SO₂ — innesco
331. 4 C₅H₅N₅ + 25 O₂ → 20 CO₂ + 10 H₂O + 10 N₂ — innesco
332. 4 C₅H₅N₅O + 23 O₂ → 20 CO₂ + 10 H₂O + 10 N₂ — innesco
333. 4 C₄H₅N₃O + 19 O₂ → 16 CO₂ + 10 H₂O + 6 N₂ — innesco
334. 2 C₅H₆N₂O₂ + 11 O₂ → 10 CO₂ + 6 H₂O + 2 N₂ — innesco
335. C₄H₄N₂O₂ + 4 O₂ → 4 CO₂ + 2 H₂O + N₂ — innesco
336. 4 C₈H₁₁NO₂ + 39 O₂ → 32 CO₂ + 22 H₂O + 2 N₂ — innesco
337. 4 C₉H₁₃NO₃ + 43 O₂ → 36 CO₂ + 26 H₂O + 2 N₂ — innesco
338. 2 C₈H₁₀N₄O₂ + 19 O₂ → 16 CO₂ + 10 H₂O + 4 N₂ — innesco
339. C₇H₈N₄O₂ + 8 O₂ → 7 CO₂ + 4 H₂O + 2 N₂ — innesco
340. C₉H₈O₄ + 9 O₂ → 9 CO₂ + 4 H₂O — innesco
341. C₇H₆O₃ + 7 O₂ → 7 CO₂ + 3 H₂O — innesco
342. 4 C₈H₉NO₂ + 37 O₂ → 32 CO₂ + 18 H₂O + 2 N₂ — innesco
343. 2 C₁₃H₁₈O₂ + 33 O₂ → 26 CO₂ + 18 H₂O — innesco
344. 2 C₁₀H₁₄N₂ + 27 O₂ → 20 CO₂ + 14 H₂O + 2 N₂ — innesco
345. 2 C₁₀H₂₀O + 29 O₂ → 20 CO₂ + 20 H₂O — innesco
346. C₁₀H₁₆ + 14 O₂ → 10 CO₂ + 8 H₂O — innesco
347. 2 C₈H₈O₃ + 17 O₂ → 16 CO₂ + 8 H₂O — innesco
348. 4 C₅H₈NO₄Na + 21 O₂ → 2 Na₂CO₃ + 18 CO₂ + 16 H₂O + 2 N₂ — innesco

#### 4. Decomposizioni (96)

*4.1 Carbonati, idrossidi e sali di ammonio (13)*

349. CaCO₃ → CaO + CO₂ — Δ > 800 °C; ΔH° 179 kJ · **già nell'app**
350. MgCO₃ → MgO + CO₂ — Δ ~350 °C
351. Li₂CO₃ → Li₂O + CO₂ — Δ > 1300 °C
352. 2 NaHCO₃ → Na₂CO₃ + H₂O + CO₂ — Δ; ΔH° 92 kJ · **già nell'app**
353. (NH₄)₂CO₃ → 2 NH₃ + CO₂ + H₂O — Δ ~60 °C
354. Ca(OH)₂ → CaO + H₂O — Δ ~510 °C; ΔH° 64 kJ
355. Mg(OH)₂ → MgO + H₂O — Δ ~330 °C
356. 2 Al(OH)₃ → Al₂O₃ + 3 H₂O — Δ ~200 °C
357. Cu(OH)₂ → CuO + H₂O — Δ
358. 2 LiOH → Li₂O + H₂O — Δ
359. NH₄Cl ⇌ NH₃ + HCl — Δ; ΔH° 176 kJ
360. CaSO₄·2H₂O → CaSO₄ + 2 H₂O — Δ
361. 2 H₃BO₃ → B₂O₃ + 3 H₂O — Δ

*4.2 Nitrati, clorati, perclorati, solfati (18)*

362. 2 NaNO₃ → 2 NaNO₂ + O₂ — Δ
363. 2 Pb(NO₃)₂ → 2 PbO + 4 NO₂ + O₂ — Δ
364. 2 AgNO₃ → 2 Ag + 2 NO₂ + O₂ — Δ
365. NH₄NO₃ → N₂O + 2 H₂O — Δ 200-250 °C
366. 2 NH₄NO₃ → 2 N₂ + O₂ + 4 H₂O — detonazione
367. 2 KClO₃ → 2 KCl + 3 O₂ — Δ, cat. MnO₂
368. 4 KClO₃ → 3 KClO₄ + KCl — Δ senza catalizzatore
369. KClO₄ → KCl + 2 O₂ — Δ > 500 °C
370. 2 NH₄ClO₄ → N₂ + Cl₂ + 2 O₂ + 4 H₂O — Δ > 300 °C, esplosiva
371. 2 CaSO₄ → 2 CaO + 2 SO₂ + O₂ — Δ > 1200 °C
372. 2 FeSO₄ → Fe₂O₃ + SO₂ + SO₃ — Δ
373. CuSO₄ → CuO + SO₃ — Δ > 650 °C
374. ZnSO₄ → ZnO + SO₃ — Δ
375. MgSO₄ → MgO + SO₃ — Δ > 1100 °C
376. 4 K₂Cr₂O₇ → 4 K₂CrO₄ + 2 Cr₂O₃ + 3 O₂ — Δ > 500 °C
377. 2 NaClO → 2 NaCl + O₂ — luce, Δ
378. 2 KNO₃ → 2 KNO₂ + O₂ — Δ; ΔH° 250 kJ
379. 2 KMnO₄ → K₂MnO₄ + MnO₂ + O₂ — Δ

*4.3 Ossidi, perossidi e alogenuri (12)*

380. 2 HgO → 2 Hg + O₂ — Δ > 450 °C
381. 2 PbO₂ → 2 PbO + O₂ — Δ
382. 4 CuO → 2 Cu₂O + O₂ — Δ > 1000 °C
383. PtO₂ → Pt + O₂ — Δ
384. 2 H₂O₂ → 2 H₂O + O₂ — cat. MnO₂ o enzima catalasi; ΔH° −196 kJ · **già nell'app**
385. 2 Na₂O₂ → 2 Na₂O + O₂ — Δ > 600 °C
386. 2 O₃ → 3 O₂ — Δ o cat.; ΔH° −285 kJ
387. 2 AuCl₃ → 2 Au + 3 Cl₂ — Δ > 250 °C
388. 2 AgCl → 2 Ag + Cl₂ — luce
389. 2 AgBr → 2 Ag + Br₂ — luce
390. 2 XeO₃ → 2 Xe + 3 O₂ — urto
391. KrF₂ → Kr + F₂ — temperatura ambiente, lenta

*4.4 Ossidi e acidi dei non metalli (23)*

392. 2 N₂O₅ → 4 NO₂ + O₂ — spontanea, lenta
393. 2 N₂O → 2 N₂ + O₂ — Δ > 600 °C; ΔH° −163 kJ
394. 2 NO → N₂ + O₂ — cat.; ΔH° −183 kJ
395. 2 Cl₂O₇ → 2 Cl₂ + 7 O₂ — urto
396. 2 ClO₂ → Cl₂ + 2 O₂ — Δ o luce
397. 2 Cl₂O → 2 Cl₂ + O₂ — Δ
398. 4 HNO₃ → 4 NO₂ + O₂ + 2 H₂O — luce; ΔH° 257 kJ
399. H₂CO₃ → CO₂ + H₂O — spontanea
400. H₂SO₃ → SO₂ + H₂O — spontanea
401. H₂SO₄ → SO₃ + H₂O — Δ > 300 °C; ΔH° 87 kJ
402. 4 H₃PO₄ → P₄O₁₀ + 6 H₂O — Δ
403. 3 HNO₂ → HNO₃ + 2 NO + H₂O — spontanea (disproporzione)
404. 4 H₃PO₃ → 3 H₃PO₄ + PH₃ — Δ (disproporzione)
405. 2 HClO → 2 HCl + O₂ — luce
406. 3 HClO → 2 HCl + HClO₃ — Δ (disproporzione)
407. 5 HClO₂ → 4 ClO₂ + HCl + 2 H₂O — disproporzione
408. 3 HClO₃ → HClO₄ + 2 ClO₂ + H₂O — disproporzione
409. 2 HN₃ → H₂ + 3 N₂ — urto
410. HCOOH → CO + H₂O — H₂SO₄ concentrato; ΔH° 29 kJ
411. HCOOH → CO₂ + H₂ — cat.; ΔH° 31 kJ
412. HOOC–COOH → CO + CO₂ + H₂O — H₂SO₄ concentrato, Δ
413. C₁₂H₂₂O₁₁ → 12 C + 11 H₂O — H₂SO₄ concentrato
414. 2 HIO₃ → I₂O₅ + H₂O — Δ 200 °C

*4.5 Idruri e composti dell'azoto (15)*

415. 2 NH₃ → N₂ + 3 H₂ — Δ, cat.; ΔH° 92 kJ · **già nell'app**
416. CH₄ → C + 2 H₂ — Δ > 1000 °C; ΔH° 75 kJ
417. H₂S → H₂ + S — Δ > 1000 °C; ΔH° 21 kJ
418. H₂Se → H₂ + Se — Δ
419. H₂Te → H₂ + Te — spontanea
420. SiH₄ → Si + 2 H₂ — Δ; ΔH° −34 kJ
421. Si₂H₆ → 2 Si + 3 H₂ — Δ
422. GeH₄ → Ge + 2 H₂ — Δ
423. 2 AsH₃ → 2 As + 3 H₂ — Δ
424. 2 SbH₃ → 2 Sb + 3 H₂ — Δ, anche spontanea
425. 3 N₂H₄ → 4 NH₃ + N₂ — cat. Ir; ΔH° −336 kJ
426. N₂H₄ → N₂ + 2 H₂ — cat.; ΔH° −51 kJ
427. 3 NH₂OH → NH₃ + N₂ + 3 H₂O — Δ
428. 2 NCl₃ → N₂ + 3 Cl₂ — urto
429. 2 NaN₃ → 2 Na + 3 N₂ — innesco elettrico

*4.6 Esplosivi (4)*

430. 4 C₃H₅N₃O₉ → 12 CO₂ + 10 H₂O + 6 N₂ + O₂ — urto
431. 2 C₇H₅N₃O₆ → 3 N₂ + 5 H₂O + 7 CO + 7 C — detonatore
432. 2 CH₃NO₂ → 2 CO + 2 H₂O + N₂ + H₂ — detonatore
433. CF₂=CF₂ → C + CF₄ — Δ o pressione

*4.7 Elettrolisi (in soluzione e ignea) (11)*

434. 2 H₂O → 2 H₂ + O₂ — elettrolisi; ΔH° 572 kJ · **già nell'app**
435. 2 HCl → H₂ + Cl₂ — elettrolisi; ΔH° 185 kJ
436. 2 HF → H₂ + F₂ — elettrolisi (in KF fuso); ΔH° 547 kJ
437. 2 NaCl → 2 Na + Cl₂ — elettrolisi ignea; ΔH° 822 kJ
438. 2 LiCl → 2 Li + Cl₂ — elettrolisi ignea; ΔH° 817 kJ
439. MgCl₂ → Mg + Cl₂ — elettrolisi ignea; ΔH° 641 kJ
440. CaCl₂ → Ca + Cl₂ — elettrolisi ignea; ΔH° 795 kJ
441. 2 Al₂O₃ + 3 C → 4 Al + 3 CO₂ — elettrolisi in criolite fusa, 960 °C; ΔH° 2171 kJ
442. 2 NaCl + 2 H₂O → 2 NaOH + H₂ + Cl₂ — elettrolisi; ΔH° 542 kJ
443. 2 KCl + 2 H₂O → 2 KOH + H₂ + Cl₂ — elettrolisi; ΔH° 595 kJ
444. NaCl + 3 H₂O → NaClO₃ + 3 H₂ — elettrolisi senza diaframma, soluzione calda; ΔH° 903 kJ

#### 5. Reazioni con l'acqua (84)

*5.1 Metalli e acqua (12)*

445. 2 Li + 2 H₂O → 2 LiOH + H₂
446. 2 Na + 2 H₂O → 2 NaOH + H₂ — ΔH° −280 kJ · **già nell'app**
447. 2 K + 2 H₂O → 2 KOH + H₂ — ΔH° −278 kJ
448. Ca + 2 H₂O → Ca(OH)₂ + H₂ — ΔH° −414 kJ
449. Ba + 2 H₂O → Ba(OH)₂ + H₂
450. Mg + 2 H₂O → Mg(OH)₂ + H₂ — acqua calda
451. Mg + H₂O → MgO + H₂ — vapore; ΔH° −316 kJ
452. Zn + H₂O → ZnO + H₂ — vapore, Δ
453. 3 Fe + 4 H₂O → Fe₃O₄ + 4 H₂ — vapore, Δ
454. 2 Rb + 2 H₂O → 2 RbOH + H₂ — ΔH° −265 kJ
455. 2 Cs + 2 H₂O → 2 CsOH + H₂ — ΔH° −261 kJ
456. Sr + 2 H₂O → Sr(OH)₂ + H₂ — ΔH° −387 kJ

*5.2 Vapore e combustibili (gas di sintesi) (4)*

457. C + H₂O → CO + H₂ — Δ > 1000 °C; ΔH° 175 kJ
458. CH₄ + H₂O → CO + 3 H₂ — Δ 800 °C, cat. Ni; ΔH° 250 kJ
459. CH₄ + 2 H₂O → CO₂ + 4 H₂ — Δ, cat. Ni; ΔH° 253 kJ
460. CO + H₂O ⇌ CO₂ + H₂ — cat. Fe/Cr o Cu; ΔH° 3 kJ

*5.3 Ossidi e acqua (20)*

461. Li₂O + H₂O → 2 LiOH
462. Na₂O + H₂O → 2 NaOH — ΔH° −152 kJ
463. K₂O + H₂O → 2 KOH — ΔH° −202 kJ
464. CaO + H₂O → Ca(OH)₂ — ΔH° −64 kJ · **già nell'app**
465. MgO + H₂O → Mg(OH)₂ — lenta
466. 2 Na₂O₂ + 2 H₂O → 4 NaOH + O₂
467. Na₂O₂ + 2 H₂O → 2 NaOH + H₂O₂ — acqua fredda
468. CO₂ + H₂O ⇌ H₂CO₃
469. SO₂ + H₂O → H₂SO₃
470. SO₃ + H₂O → H₂SO₄ — ΔH° −87 kJ
471. N₂O₅ + H₂O → 2 HNO₃
472. 3 NO₂ + H₂O → 2 HNO₃ + NO — ΔH° −70 kJ
473. 2 NO₂ + H₂O → HNO₃ + HNO₂ — freddo
474. N₂O₄ + H₂O → HNO₃ + HNO₂ — freddo
475. 4 NO₂ + O₂ + 2 H₂O → 4 HNO₃ — ΔH° −257 kJ
476. P₄O₁₀ + 6 H₂O → 4 H₃PO₄
477. Cl₂O + H₂O → 2 HClO
478. Cl₂O₇ + H₂O → 2 HClO₄
479. 2 ClO₂ + H₂O → HClO₂ + HClO₃
480. Re₂O₇ + H₂O → 2 HReO₄

*5.4 Alogeni e acqua (2)*

481. 2 F₂ + 2 H₂O → 4 HF + O₂ — ΔH° −522 kJ
482. Cl₂ + H₂O ⇌ HCl + HClO

*5.5 Idruri, nitruri, carburi, ammiduri (8)*

483. LiH + H₂O → LiOH + H₂
484. NaH + H₂O → NaOH + H₂
485. CaH₂ + 2 H₂O → Ca(OH)₂ + 2 H₂
486. Li₃N + 3 H₂O → 3 LiOH + NH₃
487. Mg₃N₂ + 6 H₂O → 3 Mg(OH)₂ + 2 NH₃
488. CaC₂ + 2 H₂O → Ca(OH)₂ + C₂H₂
489. NaNH₂ + H₂O → NaOH + NH₃
490. SiH₄ + 4 H₂O → H₄SiO₄ + 4 H₂ — cat. base

*5.6 Idrolisi degli alogenuri e ossoalogenuri (35)*

491. BCl₃ + 3 H₂O → H₃BO₃ + 3 HCl
492. BBr₃ + 3 H₂O → H₃BO₃ + 3 HBr
493. BF₃ + 3 H₂O → H₃BO₃ + 3 HF
494. AlCl₃ + 3 H₂O → Al(OH)₃ + 3 HCl
495. SiCl₄ + 4 H₂O → H₄SiO₄ + 4 HCl
496. SiF₄ + 4 H₂O → H₄SiO₄ + 4 HF
497. SnCl₄ + 2 H₂O → SnO₂ + 4 HCl
498. TiCl₄ + 2 H₂O → TiO₂ + 4 HCl
499. PCl₃ + 3 H₂O → H₃PO₃ + 3 HCl
500. PBr₃ + 3 H₂O → H₃PO₃ + 3 HBr
501. PF₃ + 3 H₂O → H₃PO₃ + 3 HF — lenta
502. PCl₅ + 4 H₂O → H₃PO₄ + 5 HCl — acqua in eccesso; ΔH° −159 kJ
503. PCl₅ + H₂O → POCl₃ + 2 HCl — poca acqua
504. POCl₃ + 3 H₂O → H₃PO₄ + 3 HCl
505. PF₅ + 4 H₂O → H₃PO₄ + 5 HF
506. SOCl₂ + H₂O → SO₂ + 2 HCl
507. SO₂Cl₂ + 2 H₂O → H₂SO₄ + 2 HCl
508. 2 S₂Cl₂ + 2 H₂O → 3 S + SO₂ + 4 HCl
509. COCl₂ + H₂O → CO₂ + 2 HCl
510. NOCl + H₂O → HNO₂ + HCl
511. NCl₃ + 3 H₂O → NH₃ + 3 HClO
512. SF₄ + 2 H₂O → SO₂ + 4 HF — ΔH° −55 kJ
513. OF₂ + H₂O → O₂ + 2 HF
514. ClF + H₂O → HClO + HF
515. IF₅ + 3 H₂O → HIO₃ + 5 HF
516. IF₇ + 4 H₂O → HIO₄ + 7 HF
517. 2 XeF₂ + 2 H₂O → 2 Xe + O₂ + 4 HF
518. 6 XeF₄ + 12 H₂O → 2 XeO₃ + 4 Xe + 3 O₂ + 24 HF
519. XeF₆ + 3 H₂O → XeO₃ + 6 HF — acqua in eccesso
520. XeF₆ + H₂O → XeOF₄ + 2 HF — poca acqua
521. XeOF₄ + 2 H₂O → XeO₃ + 4 HF
522. 2 KrF₂ + 2 H₂O → 2 Kr + O₂ + 4 HF
523. CCl₄ + H₂O → COCl₂ + 2 HCl — Δ
524. GeCl₄ + 2 H₂O → GeO₂ + 4 HCl
525. UF₆ + 2 H₂O → UO₂F₂ + 4 HF — umidità

*5.7 Idrolisi di altri composti del carbonio (3)*

526. CS₂ + 2 H₂O → CO₂ + 2 H₂S — Δ
527. COS + H₂O → CO₂ + H₂S — lenta
528. HCN + 2 H₂O → HCOOH + NH₃ — acido o base; ΔH° −8 kJ

#### 6. Acidi e basi (158)

*6.1 Acido + idrossido → sale + acqua (39)*

529. HCl + NaOH → NaCl + H₂O — ΔH° −179 kJ · **già nell'app**
530. HCl + KOH → KCl + H₂O — ΔH° −205 kJ
531. HCl + LiOH → LiCl + H₂O
532. 2 HCl + Mg(OH)₂ → MgCl₂ + 2 H₂O
533. 2 HCl + Ca(OH)₂ → CaCl₂ + 2 H₂O — ΔH° −197 kJ
534. 2 HCl + Ba(OH)₂ → BaCl₂ + 2 H₂O
535. 3 HCl + Al(OH)₃ → AlCl₃ + 3 H₂O
536. 2 HCl + Cu(OH)₂ → CuCl₂ + 2 H₂O
537. HF + NaOH → NaF + H₂O — ΔH° −163 kJ
538. HF + KOH → KF + H₂O
539. HF + LiOH → LiF + H₂O
540. 2 HF + Ca(OH)₂ → CaF₂ + 2 H₂O — ΔH° −268 kJ
541. HBr + NaOH → NaBr + H₂O
542. HBr + KOH → KBr + H₂O — ΔH° −219 kJ
543. HI + NaOH → NaI + H₂O
544. HI + KOH → KI + H₂O — ΔH° −216 kJ
545. HNO₃ + NaOH → NaNO₃ + H₂O
546. HNO₃ + KOH → KNO₃ + H₂O — ΔH° −182 kJ
547. H₂SO₄ + 2 NaOH → Na₂SO₄ + 2 H₂O
548. H₂SO₄ + 2 KOH → K₂SO₄ + 2 H₂O
549. H₂SO₄ + Mg(OH)₂ → MgSO₄ + 2 H₂O
550. H₂SO₄ + Ca(OH)₂ → CaSO₄ + 2 H₂O
551. H₂SO₄ + Ba(OH)₂ → BaSO₄ + 2 H₂O
552. 3 H₂SO₄ + 2 Al(OH)₃ → Al₂(SO₄)₃ + 6 H₂O
553. H₂SO₄ + Cu(OH)₂ → CuSO₄ + 2 H₂O
554. H₃PO₄ + 3 NaOH → Na₃PO₄ + 3 H₂O
555. 2 H₃PO₄ + 3 Ca(OH)₂ → Ca₃(PO₄)₂ + 6 H₂O
556. HCN + NaOH → NaCN + H₂O
557. HCN + KOH → KCN + H₂O
558. HClO + NaOH → NaClO + H₂O
559. HNO₂ + NaOH → NaNO₂ + H₂O
560. H₂SO₃ + 2 NaOH → Na₂SO₃ + 2 H₂O
561. HClO₃ + KOH → KClO₃ + H₂O
562. HClO₄ + KOH → KClO₄ + H₂O
563. HN₃ + NaOH → NaN₃ + H₂O
564. H₂S + 2 NaOH → Na₂S + 2 H₂O
565. CH₃COOH + NaOH → CH₃COONa + H₂O
566. C₅H₉NO₄ + NaOH → C₅H₈NO₄Na + H₂O
567. CH₃(CH₂)₁₆COOH + NaOH → C₁₇H₃₅COONa + H₂O — soluzione

*6.2 Ammoniaca + acido → sale di ammonio (6)*

568. NH₃ + HCl → NH₄Cl — ΔH° −176 kJ · **già nell'app**
569. NH₃ + HNO₃ → NH₄NO₃
570. 2 NH₃ + H₂SO₄ → (NH₄)₂SO₄
571. NH₃ + HClO₄ → NH₄ClO₄
572. 2 NH₃ + CO₂ + H₂O → (NH₄)₂CO₃
573. NH₃ + H₃PO₄ → NH₄H₂PO₄ — ΔH° −115 kJ

*6.3 Ossidi acidi + basi o ossidi basici (27)*

574. CO₂ + 2 NaOH → Na₂CO₃ + H₂O — ΔH° −171 kJ
575. CO₂ + NaOH → NaHCO₃ — CO₂ in eccesso; ΔH° −131 kJ
576. CO₂ + 2 KOH → K₂CO₃ + H₂O
577. CO₂ + 2 LiOH → Li₂CO₃ + H₂O
578. CO₂ + Ca(OH)₂ → CaCO₃ + H₂O — ΔH° −115 kJ
579. CO₂ + Mg(OH)₂ → MgCO₃ + H₂O
580. CO₂ + CaO → CaCO₃ — ΔH° −179 kJ
581. CO₂ + MgO → MgCO₃
582. CO₂ + Na₂O → Na₂CO₃ — ΔH° −323 kJ
583. CO₂ + K₂O → K₂CO₃
584. CO₂ + Li₂O → Li₂CO₃
585. 2 Na₂O₂ + 2 CO₂ → 2 Na₂CO₃ + O₂
586. SO₂ + 2 NaOH → Na₂SO₃ + H₂O
587. SO₃ + 2 NaOH → Na₂SO₄ + H₂O
588. SO₃ + CaO → CaSO₄
589. SO₃ + MgO → MgSO₄
590. SO₃ + Na₂O → Na₂SO₄
591. P₄O₁₀ + 12 NaOH → 4 Na₃PO₄ + 6 H₂O
592. P₄O₁₀ + 6 CaO → 2 Ca₃(PO₄)₂
593. 2 NO₂ + 2 NaOH → NaNO₂ + NaNO₃ + H₂O
594. NO + NO₂ + 2 NaOH → 2 NaNO₂ + H₂O
595. Cl₂ + 2 NaOH → NaCl + NaClO + H₂O — freddo
596. 3 Cl₂ + 6 KOH → 5 KCl + KClO₃ + 3 H₂O — caldo
597. 2 F₂ + 2 NaOH → OF₂ + 2 NaF + H₂O — NaOH diluito
598. CO₂ + Ba(OH)₂ → BaCO₃ + H₂O
599. 2 Cl₂ + 2 Ca(OH)₂ → CaCl₂ + Ca(ClO)₂ + 2 H₂O
600. 4 KO₂ + 2 CO₂ → 2 K₂CO₃ + 3 O₂

*6.4 Ossidi basici + acidi (27)*

601. 2 HCl + MgO → MgCl₂ + H₂O — ΔH° −141 kJ
602. 2 HCl + CaO → CaCl₂ + H₂O — ΔH° −262 kJ
603. 2 HCl + Na₂O → 2 NaCl + H₂O — ΔH° −509 kJ
604. 2 HCl + K₂O → 2 KCl + H₂O — ΔH° −613 kJ
605. 2 HCl + Li₂O → 2 LiCl + H₂O — ΔH° −321 kJ
606. 6 HCl + Al₂O₃ → 2 AlCl₃ + 3 H₂O — Δ
607. 6 HCl + Fe₂O₃ → 2 FeCl₃ + 3 H₂O
608. 2 HCl + FeO → FeCl₂ + H₂O
609. 8 HCl + Fe₃O₄ → FeCl₂ + 2 FeCl₃ + 4 H₂O
610. 2 HCl + CuO → CuCl₂ + H₂O
611. 2 HCl + Cu₂O → 2 CuCl + H₂O
612. 2 HCl + ZnO → ZnCl₂ + H₂O
613. 2 HCl + HgO → HgCl₂ + H₂O
614. 4 HCl + SnO₂ → SnCl₄ + 2 H₂O — Δ, HCl concentrato
615. H₂SO₄ + MgO → MgSO₄ + H₂O
616. H₂SO₄ + CaO → CaSO₄ + H₂O
617. H₂SO₄ + Na₂O → Na₂SO₄ + H₂O
618. 3 H₂SO₄ + Al₂O₃ → Al₂(SO₄)₃ + 3 H₂O — Δ
619. H₂SO₄ + FeO → FeSO₄ + H₂O
620. H₂SO₄ + CuO → CuSO₄ + H₂O — Δ
621. H₂SO₄ + ZnO → ZnSO₄ + H₂O
622. H₂SO₄ + NiO → NiSO₄ + H₂O — Δ
623. 2 HNO₃ + PbO → Pb(NO₃)₂ + H₂O
624. 2 H₃PO₄ + 3 CaO → Ca₃(PO₄)₂ + 3 H₂O
625. 6 HCl + La₂O₃ → 2 LaCl₃ + 3 H₂O
626. 4 HF + UO₂ → UF₄ + 2 H₂O — Δ
627. H₂SO₄ + K₂Cr₂O₇ → 2 CrO₃ + K₂SO₄ + H₂O — H₂SO₄ concentrato

*6.5 Acidi + carbonati e bicarbonati (si libera CO₂) (21)*

628. CaCO₃ + 2 HCl → CaCl₂ + H₂O + CO₂ — ΔH° −83 kJ
629. Na₂CO₃ + 2 HCl → 2 NaCl + H₂O + CO₂ — ΔH° −186 kJ
630. NaHCO₃ + HCl → NaCl + H₂O + CO₂ — ΔH° −47 kJ
631. K₂CO₃ + 2 HCl → 2 KCl + H₂O + CO₂
632. MgCO₃ + 2 HCl → MgCl₂ + H₂O + CO₂
633. Li₂CO₃ + 2 HCl → 2 LiCl + H₂O + CO₂
634. (NH₄)₂CO₃ + 2 HCl → 2 NH₄Cl + H₂O + CO₂
635. CaCO₃ + H₂SO₄ → CaSO₄ + H₂O + CO₂
636. Na₂CO₃ + H₂SO₄ → Na₂SO₄ + H₂O + CO₂
637. 2 NaHCO₃ + H₂SO₄ → Na₂SO₄ + 2 H₂O + 2 CO₂
638. K₂CO₃ + H₂SO₄ → K₂SO₄ + H₂O + CO₂
639. MgCO₃ + H₂SO₄ → MgSO₄ + H₂O + CO₂
640. Na₂CO₃ + 2 HNO₃ → 2 NaNO₃ + H₂O + CO₂
641. K₂CO₃ + 2 HNO₃ → 2 KNO₃ + H₂O + CO₂
642. 3 CaCO₃ + 2 H₃PO₄ → Ca₃(PO₄)₂ + 3 H₂O + 3 CO₂
643. NaHCO₃ + CH₃COOH → CH₃COONa + H₂O + CO₂
644. Na₂CO₃ + 2 CH₃COOH → 2 CH₃COONa + H₂O + CO₂
645. NaHCO₃ + NaOH → Na₂CO₃ + H₂O — ΔH° −40 kJ
646. Na₂CO₃ + CO₂ + H₂O → 2 NaHCO₃ — ΔH° −92 kJ
647. CaCO₃ + 2 HNO₃ → Ca(NO₃)₂ + H₂O + CO₂ — ΔH° −62 kJ
648. CaCO₃ + CO₂ + H₂O → Ca(HCO₃)₂

*6.6 Spostamento di acidi volatili o deboli dai loro sali (22)*

649. 2 NaCl + H₂SO₄ → Na₂SO₄ + 2 HCl — Δ
650. CaF₂ + H₂SO₄ → CaSO₄ + 2 HF — Δ
651. 2 NaNO₃ + H₂SO₄ → Na₂SO₄ + 2 HNO₃ — Δ
652. 2 KNO₃ + H₂SO₄ → K₂SO₄ + 2 HNO₃ — Δ
653. Ca₃(PO₄)₂ + 3 H₂SO₄ → 3 CaSO₄ + 2 H₃PO₄
654. Na₂S + 2 HCl → 2 NaCl + H₂S
655. Na₂S + H₂SO₄ → Na₂SO₄ + H₂S
656. ZnS + 2 HCl → ZnCl₂ + H₂S
657. ZnS + H₂SO₄ → ZnSO₄ + H₂S
658. Na₂SO₃ + 2 HCl → 2 NaCl + H₂O + SO₂
659. Na₂SO₃ + H₂SO₄ → Na₂SO₄ + H₂O + SO₂
660. Na₂S₂O₃ + 2 HCl → 2 NaCl + S + SO₂ + H₂O
661. NaCN + HCl → NaCl + HCN
662. KCN + HCl → KCl + HCN
663. 2 NaCN + H₂SO₄ → Na₂SO₄ + 2 HCN
664. NaNO₂ + HCl → NaCl + HNO₂ — freddo
665. CH₃COONa + HCl → NaCl + CH₃COOH
666. NaClO + 2 HCl → NaCl + Cl₂ + H₂O
667. NaClO + CO₂ + H₂O → NaHCO₃ + HClO
668. NaCl + H₂SO₄ → NaHSO₄ + HCl — moderato riscaldamento; ΔH° 7 kJ
669. FeS + 2 HCl → FeCl₂ + H₂S
670. Ca₃(PO₄)₂ + 4 H₃PO₄ → 3 Ca(H₂PO₄)₂

*6.7 Sali di ammonio + basi (si libera ammoniaca) (11)*

671. NH₄Cl + NaOH → NaCl + NH₃ + H₂O — Δ; ΔH° −3 kJ
672. NH₄Cl + KOH → KCl + NH₃ + H₂O — Δ; ΔH° −29 kJ
673. 2 NH₄Cl + Ca(OH)₂ → CaCl₂ + 2 NH₃ + 2 H₂O — Δ; ΔH° 155 kJ
674. 2 NH₄Cl + Ba(OH)₂ → BaCl₂ + 2 NH₃ + 2 H₂O
675. (NH₄)₂SO₄ + 2 NaOH → Na₂SO₄ + 2 NH₃ + 2 H₂O — Δ
676. (NH₄)₂SO₄ + Ca(OH)₂ → CaSO₄ + 2 NH₃ + 2 H₂O — Δ
677. NH₄NO₃ + NaOH → NaNO₃ + NH₃ + H₂O — Δ
678. NH₄NO₃ + KOH → KNO₃ + NH₃ + H₂O — Δ
679. 3 NaClO + NH₃ → NCl₃ + 3 NaOH — candeggina in eccesso
680. NaClO + 2 NH₃ → N₂H₄ + NaCl + H₂O
681. NaClO + NH₃ → NH₂Cl + NaOH

*6.8 Basi forti + sali (scambio) (2)*

682. Li₂CO₃ + Ca(OH)₂ → 2 LiOH + CaCO₃
683. CH₃COONa + NaOH → CH₄ + Na₂CO₃ — Δ, calce sodata

*6.9 Anfoteri: alluminio e zinco nelle basi forti (3)*

684. 2 Al + 2 NaOH + 6 H₂O → 2 Na[Al(OH)₄] + 3 H₂ — soluzione
685. Al(OH)₃ + NaOH → Na[Al(OH)₄] — soluzione
686. Zn + 2 NaOH + 2 H₂O → Na₂[Zn(OH)₄] + H₂ — soluzione

#### 7. Ioni in soluzione acquosa (78)

*7.1 Acqua, ammoniaca e neutralizzazione (7)*

687. H₃O⁺ + OH⁻ → 2 H₂O
688. 2 H₂O ⇌ H₃O⁺ + OH⁻
689. NH₃ + H₂O ⇌ NH₄⁺ + OH⁻
690. NH₄⁺ + H₂O ⇌ NH₃ + H₃O⁺
691. NH₄⁺ + OH⁻ → NH₃ + H₂O
692. NH₃ + H₃O⁺ → NH₄⁺ + H₂O
693. NH₂⁻ + H₂O → NH₃ + OH⁻

*7.2 Dissociazione degli acidi (24)*

694. HNO₃ + H₂O → H₃O⁺ + NO₃⁻
695. H₂SO₄ + H₂O → H₃O⁺ + HSO₄⁻
696. HSO₄⁻ + H₂O ⇌ H₃O⁺ + SO₄²⁻
697. HClO₄ + H₂O → H₃O⁺ + ClO₄⁻
698. HClO₃ + H₂O → H₃O⁺ + ClO₃⁻
699. HClO₂ + H₂O ⇌ H₃O⁺ + ClO₂⁻
700. HClO + H₂O ⇌ H₃O⁺ + ClO⁻
701. HIO₃ + H₂O ⇌ H₃O⁺ + IO₃⁻
702. HNO₂ + H₂O ⇌ H₃O⁺ + NO₂⁻
703. HCN + H₂O ⇌ H₃O⁺ + CN⁻
704. HN₃ + H₂O ⇌ H₃O⁺ + N₃⁻
705. H₂S + H₂O ⇌ H₃O⁺ + HS⁻
706. H₃PO₄ + H₂O ⇌ H₃O⁺ + H₂PO₄⁻
707. H₂PO₄⁻ + H₂O ⇌ H₃O⁺ + HPO₄²⁻
708. HPO₄²⁻ + H₂O ⇌ H₃O⁺ + PO₄³⁻
709. H₂CO₃ + H₂O ⇌ H₃O⁺ + HCO₃⁻
710. HCO₃⁻ + H₂O ⇌ H₃O⁺ + CO₃²⁻
711. CH₃COOH + H₂O ⇌ H₃O⁺ + CH₃COO⁻
712. HCOOH + H₂O ⇌ H₃O⁺ + HCOO⁻
713. HOOC–COOH + 2 H₂O ⇌ 2 H₃O⁺ + C₂O₄²⁻
714. H₂CrO₄ + 2 H₂O → 2 H₃O⁺ + CrO₄²⁻
715. BF₃ + HF + H₂O → H₃O⁺ + BF₄⁻
716. PF₅ + HF + H₂O → H₃O⁺ + PF₆⁻
717. HNO₃ + 2 H₂SO₄ → NO₂⁺ + H₃O⁺ + 2 HSO₄⁻

*7.3 Idrolisi degli anioni (soluzioni basiche) e reazioni con OH⁻ e H₃O⁺ (17)*

718. CO₃²⁻ + H₂O ⇌ HCO₃⁻ + OH⁻
719. PO₄³⁻ + H₂O ⇌ HPO₄²⁻ + OH⁻
720. CN⁻ + H₂O ⇌ HCN + OH⁻
721. ClO⁻ + H₂O ⇌ HClO + OH⁻
722. CH₃COO⁻ + H₂O ⇌ CH₃COOH + OH⁻
723. C₂²⁻ + 2 H₂O → C₂H₂ + 2 OH⁻
724. O₂²⁻ + 2 H₂O → H₂O₂ + 2 OH⁻
725. CO₂ + OH⁻ → HCO₃⁻
726. HCO₃⁻ + OH⁻ → CO₃²⁻ + H₂O
727. HCO₃⁻ + H₃O⁺ → CO₂ + 2 H₂O
728. CO₃²⁻ + 2 H₃O⁺ → CO₂ + 3 H₂O
729. SO₂ + 2 OH⁻ → SO₃²⁻ + H₂O
730. H₂S + OH⁻ → HS⁻ + H₂O
731. CH₃COOH + OH⁻ → CH₃COO⁻ + H₂O
732. O₂²⁻ + 2 H₃O⁺ → H₂O₂ + 2 H₂O
733. 2 CrO₄²⁻ + 2 H₃O⁺ → Cr₂O₇²⁻ + 3 H₂O
734. Cr₂O₇²⁻ + 2 OH⁻ → 2 CrO₄²⁻ + H₂O

*7.4 Ossidoriduzioni tra ioni (8)*

735. 2 MnO₄⁻ + 3 SO₃²⁻ + H₂O → 2 MnO₂ + 3 SO₄²⁻ + 2 OH⁻ — soluzione neutra
736. 2 MnO₄⁻ + 3 H₂O₂ → 2 MnO₂ + 3 O₂ + 2 OH⁻ + 2 H₂O — soluzione neutra o basica
737. 2 NH₄⁺ + Cr₂O₇²⁻ → Cr₂O₃ + N₂ + 4 H₂O — Δ
738. NH₄⁺ + NO₂⁻ → N₂ + 2 H₂O — Δ o batteri anammox
739. SO₃²⁻ + S → S₂O₃²⁻ — ebollizione
740. BrO₃⁻ + 5 HBr + H₃O⁺ → 3 Br₂ + 4 H₂O — soluzione acida
741. 2 Tc + 2 OH⁻ + 7 H₂O₂ → 2 TcO₄⁻ + 8 H₂O — soluzione basica
742. CN⁻ + S₂O₃²⁻ → SCN⁻ + SO₃²⁻ — enzima rodanasi

*7.5 Ioni monoatomici e complessi (22)*

743. Ag⁺ + Cl⁻ → AgCl — soluzione
744. Ba²⁺ + SO₄²⁻ → BaSO₄ — soluzione
745. Pb²⁺ + 2 I⁻ → PbI₂ — soluzione
746. Ca²⁺ + CO₃²⁻ → CaCO₃ — soluzione
747. Cu²⁺ + 2 OH⁻ → Cu(OH)₂ — soluzione
748. NaCl → Na⁺ + Cl⁻ — acqua; ΔH° 4 kJ
749. KCl → K⁺ + Cl⁻ — acqua; ΔH° 17 kJ
750. HCl + H₂O → H₃O⁺ + Cl⁻
751. Zn + Cu²⁺ → Zn²⁺ + Cu — soluzione; ΔH° −219 kJ
752. Cl₂ + 2 Br⁻ → 2 Cl⁻ + Br₂ — soluzione; ΔH° −91 kJ
753. 2 Fe³⁺ + 2 I⁻ → 2 Fe²⁺ + I₂ — soluzione; ΔH° 29 kJ
754. MnO₄⁻ + 5 Fe²⁺ + 8 H₃O⁺ → Mn²⁺ + 5 Fe³⁺ + 12 H₂O — soluzione acida
755. Cr₂O₇²⁻ + 6 Fe²⁺ + 14 H₃O⁺ → 2 Cr³⁺ + 6 Fe³⁺ + 21 H₂O — soluzione acida
756. IO₃⁻ + 5 I⁻ + 6 H₃O⁺ → 3 I₂ + 9 H₂O — soluzione acida
757. 2 S₂O₃²⁻ + I₂ → S₄O₆²⁻ + 2 I⁻ — soluzione
758. 3 ClO⁻ → 2 Cl⁻ + ClO₃⁻ — Δ (disproporzione)
759. 3 Br₂ + 6 OH⁻ → 5 Br⁻ + BrO₃⁻ + 3 H₂O — soluzione basica
760. Fe³⁺ + SCN⁻ → [Fe(SCN)]²⁺ — soluzione
761. Cu²⁺ + 4 NH₃ → [Cu(NH₃)₄]²⁺ — soluzione
762. AgCl + 2 NH₃ → [Ag(NH₃)₂]⁺ + Cl⁻ — soluzione
763. AgBr + 2 S₂O₃²⁻ → [Ag(S₂O₃)₂]³⁻ + Br⁻ — soluzione
764. 2 Cu²⁺ + 4 I⁻ → 2 CuI + I₂ — soluzione; ΔH° −44 kJ

#### 8. Precipitazioni (doppio scambio) (63)

*8.1 Alogenuri e solfuri d'argento (11)*

765. AgNO₃ + NaCl → AgCl + NaNO₃ — soluzione
766. AgNO₃ + KCl → AgCl + KNO₃ — soluzione
767. AgNO₃ + HCl → AgCl + HNO₃ — soluzione
768. AgNO₃ + NH₄Cl → AgCl + NH₄NO₃ — soluzione
769. AgNO₃ + NaBr → AgBr + NaNO₃ — soluzione
770. AgNO₃ + KBr → AgBr + KNO₃ — soluzione
771. 2 AgNO₃ + Na₂S → Ag₂S + 2 NaNO₃ — soluzione
772. 2 AgNO₃ + H₂S → Ag₂S + 2 HNO₃ — soluzione
773. AgNO₃ + KI → AgI + KNO₃ — soluzione
774. 2 AgNO₃ + BaCl₂ → 2 AgCl + Ba(NO₃)₂ — soluzione
775. 2 AgNO₃ + 2 NaOH → Ag₂O + 2 NaNO₃ + H₂O — soluzione

*8.2 Sali di piombo (7)*

776. Pb(NO₃)₂ + 2 KI → PbI₂ + 2 KNO₃ — soluzione
777. Pb(NO₃)₂ + 2 NaI → PbI₂ + 2 NaNO₃ — soluzione
778. Pb(NO₃)₂ + 2 HI → PbI₂ + 2 HNO₃ — soluzione
779. Pb(NO₃)₂ + Na₂S → PbS + 2 NaNO₃ — soluzione
780. Pb(NO₃)₂ + H₂S → PbS + 2 HNO₃ — soluzione
781. Pb(NO₃)₂ + Na₂SO₄ → PbSO₄ + 2 NaNO₃ — soluzione
782. Pb(NO₃)₂ + 2 NaCl → PbCl₂ + 2 NaNO₃ — soluzione

*8.3 Solfato di bario (13)*

783. BaCl₂ + Na₂SO₄ → BaSO₄ + 2 NaCl — soluzione
784. BaCl₂ + K₂SO₄ → BaSO₄ + 2 KCl — soluzione
785. BaCl₂ + H₂SO₄ → BaSO₄ + 2 HCl — soluzione
786. BaCl₂ + MgSO₄ → BaSO₄ + MgCl₂ — soluzione
787. BaCl₂ + CuSO₄ → BaSO₄ + CuCl₂ — soluzione
788. BaCl₂ + ZnSO₄ → BaSO₄ + ZnCl₂ — soluzione
789. BaCl₂ + FeSO₄ → BaSO₄ + FeCl₂ — soluzione
790. BaCl₂ + (NH₄)₂SO₄ → BaSO₄ + 2 NH₄Cl — soluzione
791. 3 BaCl₂ + Al₂(SO₄)₃ → 3 BaSO₄ + 2 AlCl₃ — soluzione
792. Ba(OH)₂ + Na₂SO₄ → BaSO₄ + 2 NaOH — soluzione
793. Ba(OH)₂ + K₂SO₄ → BaSO₄ + 2 KOH — soluzione
794. Ba(OH)₂ + MgSO₄ → BaSO₄ + Mg(OH)₂ — soluzione
795. Ba(OH)₂ + CuSO₄ → BaSO₄ + Cu(OH)₂ — soluzione

*8.4 Carbonati, fosfati, fluoruri e solfati di calcio e magnesio (11)*

796. CaCl₂ + Na₂CO₃ → CaCO₃ + 2 NaCl — soluzione; ΔH° −104 kJ
797. CaCl₂ + K₂CO₃ → CaCO₃ + 2 KCl — soluzione
798. CaCl₂ + (NH₄)₂CO₃ → CaCO₃ + 2 NH₄Cl — soluzione
799. Ca(OH)₂ + Na₂CO₃ → CaCO₃ + 2 NaOH — soluzione; ΔH° 57 kJ
800. CaSO₄ + Na₂CO₃ → CaCO₃ + Na₂SO₄ — soluzione
801. 3 CaCl₂ + 2 Na₃PO₄ → Ca₃(PO₄)₂ + 6 NaCl — soluzione
802. CaCl₂ + 2 NaF → CaF₂ + 2 NaCl — soluzione; ΔH° −102 kJ
803. CaCl₂ + 2 KF → CaF₂ + 2 KCl — soluzione
804. CaCl₂ + Na₂SO₄ → CaSO₄ + 2 NaCl — soluzione concentrata
805. MgCl₂ + Na₂CO₃ → MgCO₃ + 2 NaCl — soluzione
806. MgSO₄ + Na₂CO₃ → MgCO₃ + Na₂SO₄ — soluzione

*8.5 Idrossidi (13)*

807. CuSO₄ + 2 NaOH → Cu(OH)₂ + Na₂SO₄ — soluzione
808. CuSO₄ + 2 KOH → Cu(OH)₂ + K₂SO₄ — soluzione
809. CuCl₂ + 2 NaOH → Cu(OH)₂ + 2 NaCl — soluzione
810. CuSO₄ + 2 NH₃ + 2 H₂O → Cu(OH)₂ + (NH₄)₂SO₄ — poca ammoniaca
811. MgCl₂ + 2 NaOH → Mg(OH)₂ + 2 NaCl — soluzione
812. MgSO₄ + 2 NaOH → Mg(OH)₂ + Na₂SO₄ — soluzione
813. MgCl₂ + Ca(OH)₂ → Mg(OH)₂ + CaCl₂ — soluzione
814. AlCl₃ + 3 NaOH → Al(OH)₃ + 3 NaCl — soluzione
815. Al₂(SO₄)₃ + 6 NaOH → 2 Al(OH)₃ + 3 Na₂SO₄ — soluzione
816. Al₂(SO₄)₃ + 3 Ca(OH)₂ → 2 Al(OH)₃ + 3 CaSO₄ — soluzione
817. Al₂(SO₄)₃ + 6 NH₃ + 6 H₂O → 2 Al(OH)₃ + 3 (NH₄)₂SO₄ — soluzione
818. FeCl₃ + 3 NaOH → Fe(OH)₃ + 3 NaCl — soluzione
819. FeSO₄ + 2 NaOH → Fe(OH)₂ + Na₂SO₄ — soluzione

*8.6 Solfuri (5)*

820. ZnCl₂ + Na₂S → ZnS + 2 NaCl — soluzione
821. ZnSO₄ + Na₂S → ZnS + Na₂SO₄ — soluzione
822. HgCl₂ + H₂S → HgS + 2 HCl — soluzione
823. HgCl₂ + Na₂S → HgS + 2 NaCl — soluzione
824. CuSO₄ + H₂S → CuS + H₂SO₄ — soluzione

*8.7 Cromati (3)*

825. Pb(NO₃)₂ + K₂CrO₄ → PbCrO₄ + 2 KNO₃ — soluzione
826. 2 AgNO₃ + K₂CrO₄ → Ag₂CrO₄ + 2 KNO₃ — soluzione
827. BaCl₂ + K₂CrO₄ → BaCrO₄ + 2 KCl — soluzione

#### 9. Spostamento (scambio semplice) (84)

*9.1 Metallo + acido non ossidante → sale + idrogeno (23)*

828. Zn + 2 HCl → ZnCl₂ + H₂
829. Zn + H₂SO₄ → ZnSO₄ + H₂ — H₂SO₄ diluito
830. Mg + 2 HCl → MgCl₂ + H₂ — ΔH° −457 kJ
831. Mg + H₂SO₄ → MgSO₄ + H₂ — H₂SO₄ diluito
832. Fe + 2 HCl → FeCl₂ + H₂
833. Fe + H₂SO₄ → FeSO₄ + H₂ — H₂SO₄ diluito
834. 2 Al + 6 HCl → 2 AlCl₃ + 3 H₂
835. 2 Al + 3 H₂SO₄ → Al₂(SO₄)₃ + 3 H₂ — H₂SO₄ diluito, Δ
836. Ca + 2 HCl → CaCl₂ + H₂ — ΔH° −611 kJ
837. 2 Na + 2 HCl → 2 NaCl + H₂ — ΔH° −638 kJ
838. 2 K + 2 HCl → 2 KCl + H₂ — ΔH° −688 kJ
839. 2 Li + 2 HCl → 2 LiCl + H₂ — ΔH° −633 kJ
840. 2 Rb + 2 HCl → 2 RbCl + H₂
841. 2 Cs + 2 HCl → 2 CsCl + H₂
842. Be + 2 HCl → BeCl₂ + H₂ — ΔH° −306 kJ
843. Sr + 2 HCl → SrCl₂ + H₂
844. Ba + 2 HCl → BaCl₂ + H₂
845. Ra + 2 HCl → RaCl₂ + H₂
846. Co + 2 HCl → CoCl₂ + H₂ — lenta
847. Ni + H₂SO₄ → NiSO₄ + H₂ — lenta
848. Sn + 2 HCl → SnCl₂ + H₂ — Δ
849. 2 Tl + H₂SO₄ → Tl₂SO₄ + H₂ — H₂SO₄ diluito
850. Mg + 2 HNO₃ → Mg(NO₃)₂ + H₂ — HNO₃ molto diluito; ΔH° −443 kJ

*9.2 Metallo + sale di un metallo meno reattivo (38)*

851. Zn + CuSO₄ → ZnSO₄ + Cu — soluzione
852. Fe + CuSO₄ → FeSO₄ + Cu — soluzione
853. Mg + CuSO₄ → MgSO₄ + Cu — soluzione
854. 2 Al + 3 CuSO₄ → Al₂(SO₄)₃ + 3 Cu — soluzione, lenta
855. Ni + CuSO₄ → NiSO₄ + Cu — soluzione
856. Zn + CuCl₂ → ZnCl₂ + Cu — soluzione
857. Fe + CuCl₂ → FeCl₂ + Cu — soluzione
858. Mg + CuCl₂ → MgCl₂ + Cu — soluzione
859. 2 Al + 3 CuCl₂ → 2 AlCl₃ + 3 Cu — soluzione
860. Sn + CuCl₂ → SnCl₂ + Cu — soluzione
861. Mg + ZnSO₄ → MgSO₄ + Zn — soluzione
862. Mg + ZnCl₂ → MgCl₂ + Zn — soluzione
863. 2 Al + 3 ZnCl₂ → 2 AlCl₃ + 3 Zn — soluzione
864. Zn + FeSO₄ → ZnSO₄ + Fe — soluzione
865. Mg + FeSO₄ → MgSO₄ + Fe — soluzione
866. Zn + FeCl₂ → ZnCl₂ + Fe — soluzione
867. Al + FeCl₃ → AlCl₃ + Fe — soluzione
868. Zn + NiSO₄ → ZnSO₄ + Ni — soluzione
869. Fe + NiSO₄ → FeSO₄ + Ni — soluzione
870. Zn + CoCl₂ → ZnCl₂ + Co — soluzione
871. Mg + CoCl₂ → MgCl₂ + Co — soluzione
872. Zn + SnCl₂ → ZnCl₂ + Sn — soluzione
873. Fe + SnCl₂ → FeCl₂ + Sn — soluzione
874. Cu + HgCl₂ → CuCl₂ + Hg — soluzione
875. Zn + HgCl₂ → ZnCl₂ + Hg — soluzione
876. Fe + HgCl₂ → FeCl₂ + Hg — soluzione
877. Zn + PdCl₂ → ZnCl₂ + Pd — soluzione
878. Fe + PdCl₂ → FeCl₂ + Pd — soluzione
879. Cu + PdCl₂ → CuCl₂ + Pd — soluzione
880. 3 Zn + 2 RhCl₃ → 3 ZnCl₂ + 2 Rh — soluzione
881. 3 Zn + 2 AuCl₃ → 3 ZnCl₂ + 2 Au — soluzione
882. 3 Fe + 2 AuCl₃ → 3 FeCl₂ + 2 Au — soluzione
883. 3 Cu + 2 AuCl₃ → 3 CuCl₂ + 2 Au — soluzione
884. Cu + 2 FeCl₃ → CuCl₂ + 2 FeCl₂ — soluzione
885. 2 Mg + TiCl₄ → 2 MgCl₂ + Ti — 800 °C, argon
886. 4 Na + TiCl₄ → 4 NaCl + Ti — Δ, argon
887. Na + KCl → NaCl + K — 850 °C, il potassio distilla; ΔH° 25 kJ
888. Cu + 2 AgNO₃ → Cu(NO₃)₂ + 2 Ag — soluzione

*9.3 Alogeno + alogenuro o idracido (17)*

889. Cl₂ + 2 KBr → 2 KCl + Br₂ — soluzione; ΔH° −85 kJ
890. Cl₂ + 2 NaBr → 2 NaCl + Br₂ — soluzione
891. Cl₂ + 2 KI → 2 KCl + I₂ — soluzione; ΔH° −217 kJ
892. Cl₂ + 2 NaI → 2 NaCl + I₂ — soluzione
893. Br₂ + 2 KI → 2 KBr + I₂ — soluzione; ΔH° −132 kJ
894. Br₂ + 2 NaI → 2 NaBr + I₂ — soluzione
895. F₂ + 2 NaCl → 2 NaF + Cl₂ — ΔH° −331 kJ
896. F₂ + 2 KCl → 2 KF + Cl₂
897. F₂ + 2 KBr → 2 KF + Br₂
898. F₂ + 2 KI → 2 KF + I₂
899. Cl₂ + 2 HBr → 2 HCl + Br₂ — ΔH° −112 kJ
900. Cl₂ + 2 HI → 2 HCl + I₂ — ΔH° −238 kJ
901. Br₂ + 2 HI → 2 HBr + I₂ — ΔH° −126 kJ
902. Cl₂ + H₂S → 2 HCl + S — ΔH° −164 kJ
903. Br₂ + H₂S → 2 HBr + S — ΔH° −52 kJ
904. I₂ + H₂S → 2 HI + S — soluzione; ΔH° 74 kJ
905. Cl₂ + Na₂S → 2 NaCl + S — soluzione

*9.4 Scambio di alogeno nei composti covalenti (6)*

906. 3 SCl₂ + 4 NaF → SF₄ + S₂Cl₂ + 4 NaCl — Δ, acetonitrile
907. PCl₃ + 3 HF → PF₃ + 3 HCl
908. CCl₄ + 2 HF → CCl₂F₂ + 2 HCl — cat. SbCl₅
909. SO₂ + PCl₅ → SOCl₂ + POCl₃
910. SO₃ + SCl₂ → SOCl₂ + SO₂
911. 6 PCl₅ + P₄O₁₀ → 10 POCl₃ — Δ

#### 10. Ossidoriduzioni (125)

*10.1 Acidi ossidanti (HNO₃, H₂SO₄ concentrato, acqua regia) (24)*

912. Cu + 2 H₂SO₄ → CuSO₄ + SO₂ + 2 H₂O — H₂SO₄ concentrato, Δ
913. Ag + 2 HNO₃ → AgNO₃ + NO₂ + H₂O — HNO₃ concentrato
914. 3 Ag + 4 HNO₃ → 3 AgNO₃ + NO + 2 H₂O — HNO₃ diluito
915. 3 Pb + 8 HNO₃ → 3 Pb(NO₃)₂ + 2 NO + 4 H₂O — HNO₃ diluito
916. Au + HNO₃ + 3 HCl → AuCl₃ + NO + 2 H₂O — acqua regia
917. HNO₃ + 3 HCl → NOCl + Cl₂ + 2 H₂O
918. C + 2 H₂SO₄ → CO₂ + 2 SO₂ + 2 H₂O — H₂SO₄ concentrato, Δ; ΔH° 69 kJ
919. C + 4 HNO₃ → CO₂ + 4 NO₂ + 2 H₂O — HNO₃ concentrato, Δ; ΔH° −136 kJ
920. S + 2 H₂SO₄ → 3 SO₂ + 2 H₂O — H₂SO₄ concentrato, Δ; ΔH° 166 kJ
921. S + 6 HNO₃ → H₂SO₄ + 6 NO₂ + 2 H₂O — HNO₃ concentrato, Δ; ΔH° −142 kJ
922. P₄ + 20 HNO₃ → 4 H₃PO₄ + 20 NO₂ + 4 H₂O — HNO₃ concentrato
923. I₂ + 10 HNO₃ → 2 HIO₃ + 10 NO₂ + 4 H₂O — HNO₃ fumante
924. 2 KBr + 2 H₂SO₄ → K₂SO₄ + Br₂ + SO₂ + 2 H₂O — H₂SO₄ concentrato
925. 8 KI + 5 H₂SO₄ → 4 K₂SO₄ + 4 I₂ + H₂S + 4 H₂O — H₂SO₄ concentrato
926. 2 HBr + H₂SO₄ → Br₂ + SO₂ + 2 H₂O — H₂SO₄ concentrato; ΔH° 18 kJ
927. 8 HI + H₂SO₄ → 4 I₂ + H₂S + 4 H₂O — H₂SO₄ concentrato; ΔH° −562 kJ
928. H₂S + H₂SO₄ → S + SO₂ + 2 H₂O — H₂SO₄ concentrato; ΔH° −34 kJ
929. Cu₂O + H₂SO₄ → CuSO₄ + Cu + H₂O — H₂SO₄ diluito
930. Cu + 4 HNO₃ → Cu(NO₃)₂ + 2 NO₂ + 2 H₂O — HNO₃ concentrato; ΔH° −112 kJ
931. 3 Cu + 8 HNO₃ → 3 Cu(NO₃)₂ + 2 NO + 4 H₂O — HNO₃ diluito; ΔH° −477 kJ
932. Au + HNO₃ + 4 HCl → HAuCl₄ + NO + 2 H₂O — acqua regia
933. 3 Pt + 4 HNO₃ + 18 HCl → 3 H₂PtCl₆ + 4 NO + 8 H₂O — acqua regia, Δ
934. Hg + 2 H₂SO₄ → HgSO₄ + SO₂ + 2 H₂O — H₂SO₄ concentrato, Δ; ΔH° 52 kJ
935. MnO₂ + 4 HCl → MnCl₂ + Cl₂ + 2 H₂O — Δ

*10.2 Ossigeno e aria (10)*

936. 4 HCl + O₂ → 2 Cl₂ + 2 H₂O — cat. CuCl₂, 400 °C; ΔH° −202 kJ
937. 4 HBr + O₂ → 2 Br₂ + 2 H₂O — ΔH° −426 kJ
938. 4 HI + O₂ → 2 I₂ + 2 H₂O — ΔH° −678 kJ
939. 4 Ag + 2 H₂S + O₂ → 2 Ag₂S + 2 H₂O — aria
940. TiCl₄ + O₂ → TiO₂ + 2 Cl₂ — 1000 °C
941. 2 CCl₄ + O₂ → 2 COCl₂ + 2 Cl₂ — fiamma
942. 2 CHCl₃ + O₂ → 2 COCl₂ + 2 HCl — luce
943. 4 KMnO₄ + 2 H₂O → 4 MnO₂ + 3 O₂ + 4 KOH — luce, lenta
944. 2 Cu + O₂ + CO₂ + H₂O → Cu₂(OH)₂CO₃ — aria, anni
945. 4 Fe + 3 O₂ + 6 H₂O → 4 Fe(OH)₃ — aria umida; ΔH° −1577 kJ

*10.3 Perossido di idrogeno e perossidi (14)*

946. H₂O₂ + 2 KI + H₂SO₄ → I₂ + K₂SO₄ + 2 H₂O — soluzione
947. H₂O₂ + 2 HI → I₂ + 2 H₂O — soluzione; ΔH° −437 kJ
948. H₂O₂ + H₂S → S + 2 H₂O — soluzione; ΔH° −363 kJ
949. H₂O₂ + SO₂ → H₂SO₄ — ΔH° −329 kJ
950. H₂O₂ + Na₂SO₃ → Na₂SO₄ + H₂O — soluzione
951. H₂O₂ + HNO₂ → HNO₃ + H₂O — soluzione
952. H₂O₂ + NaClO → NaCl + O₂ + H₂O — soluzione
953. H₂O₂ + Cl₂ → 2 HCl + O₂ — soluzione; ΔH° 3 kJ
954. H₂O₂ + O₃ → H₂O + 2 O₂ — ΔH° −241 kJ
955. Na₂O₂ + H₂SO₄ → Na₂SO₄ + H₂O₂ — freddo
956. 2 KMnO₄ + 3 H₂O₂ → 2 MnO₂ + 2 KOH + 3 O₂ + 2 H₂O — soluzione neutra
957. N₂H₄ + 2 H₂O₂ → N₂ + 4 H₂O — cat.; ΔH° −818 kJ
958. PbS + 4 H₂O₂ → PbSO₄ + 4 H₂O
959. 2 KMnO₄ + 5 H₂O₂ + 3 H₂SO₄ → K₂SO₄ + 2 MnSO₄ + 5 O₂ + 8 H₂O — soluzione

*10.4 Ozono (6)*

960. O₃ + 2 KI + H₂O → I₂ + 2 KOH + O₂ — ΔH° −50 kJ
961. O₃ + NO → NO₂ + O₂ — ΔH° −201 kJ
962. O₃ + 2 NO₂ → N₂O₅ + O₂
963. O₃ + 3 SO₂ → 3 SO₃ — ΔH° −575 kJ
964. O₃ + CO → CO₂ + O₂ — ΔH° −426 kJ
965. O₃ + H₂S → SO₂ + H₂O — ΔH° −705 kJ

*10.5 Cloro e ipoclorito (12)*

966. Cl₂ + SO₂ + 2 H₂O → H₂SO₄ + 2 HCl — ΔH° −130 kJ
967. Cl₂ + Na₂SO₃ + H₂O → Na₂SO₄ + 2 HCl
968. 4 Cl₂ + Na₂S₂O₃ + 5 H₂O → Na₂SO₄ + H₂SO₄ + 8 HCl
969. 3 Cl₂ + 2 NH₃ → N₂ + 6 HCl — ΔH° −462 kJ
970. 3 Cl₂ + 8 NH₃ → N₂ + 6 NH₄Cl — ΔH° −1519 kJ
971. 3 Cl₂ + NH₃ → NCl₃ + 3 HCl — cloro in eccesso
972. 2 Cl₂ + HgO → Cl₂O + HgCl₂
973. 3 Cl₂ + CS₂ → CCl₄ + S₂Cl₂ — cat. Fe
974. NaClO + 2 KI + H₂O → NaCl + I₂ + 2 KOH — soluzione
975. NaClO + Na₂SO₃ → NaCl + Na₂SO₄ — soluzione
976. NaClO + PbO → NaCl + PbO₂ — soluzione basica
977. 2 NaClO₂ + Cl₂ → 2 ClO₂ + 2 NaCl

*10.6 Permanganato e dicromato (12)*

978. 2 KMnO₄ + 3 Na₂SO₃ + H₂O → 2 MnO₂ + 3 Na₂SO₄ + 2 KOH — soluzione neutra
979. 2 KMnO₄ + 3 H₂S → 2 MnO₂ + 3 S + 2 KOH + 2 H₂O — soluzione
980. K₂Cr₂O₇ + 2 KOH → 2 K₂CrO₄ + H₂O — soluzione
981. 2 K₂CrO₄ + H₂SO₄ → K₂Cr₂O₇ + K₂SO₄ + H₂O — soluzione
982. K₂Cr₂O₇ + S → Cr₂O₃ + K₂SO₄ — Δ
983. K₂Cr₂O₇ + 2 C → Cr₂O₃ + K₂CO₃ + CO — Δ
984. 2 KMnO₄ + 16 HCl → 2 KCl + 2 MnCl₂ + 5 Cl₂ + 8 H₂O
985. 2 KMnO₄ + 5 HOOC–COOH + 3 H₂SO₄ → K₂SO₄ + 2 MnSO₄ + 10 CO₂ + 8 H₂O — Δ 60 °C
986. 10 FeSO₄ + 2 KMnO₄ + 8 H₂SO₄ → 5 Fe₂(SO₄)₃ + K₂SO₄ + 2 MnSO₄ + 8 H₂O — soluzione
987. 14 KMnO₄ + 4 C₃H₈O₃ → 7 K₂CO₃ + 7 Mn₂O₃ + 5 CO₂ + 16 H₂O — spontanea
988. K₂Cr₂O₇ + 3 C₂H₅OH + 4 H₂SO₄ → Cr₂(SO₄)₃ + K₂SO₄ + 3 CH₃CHO + 7 H₂O — soluzione
989. K₂Cr₂O₇ + 14 HCl → 2 KCl + 2 CrCl₃ + 3 Cl₂ + 7 H₂O — Δ

*10.7 Clorati, perclorati e nitrati: pirotecnica ed esplosivi (16)*

990. KClO₃ + 6 HCl → KCl + 3 Cl₂ + 3 H₂O
991. 2 KClO₃ + 4 HCl → 2 ClO₂ + Cl₂ + 2 KCl + 2 H₂O
992. 2 KClO₃ + HOOC–COOH + H₂SO₄ → K₂SO₄ + 2 ClO₂ + 2 CO₂ + 2 H₂O — Δ blando
993. 2 KClO₃ + 3 S → 2 KCl + 3 SO₂ — innesco
994. 2 KClO₃ + 3 C → 2 KCl + 3 CO₂ — innesco
995. 10 KClO₃ + 3 P₄ → 10 KCl + 3 P₄O₁₀ — sfregamento
996. 8 KClO₃ + C₁₂H₂₂O₁₁ → 8 KCl + 12 CO₂ + 11 H₂O — una goccia di H₂SO₄
997. KClO₄ + 4 Mg → KCl + 4 MgO — innesco
998. 3 KClO₄ + 8 Al → 3 KCl + 4 Al₂O₃ — innesco
999. 6 NH₄ClO₄ + 10 Al → 5 Al₂O₃ + 3 N₂ + 6 HCl + 9 H₂O — innesco
1000. 10 KNO₃ + 3 S + 8 C → 2 K₂CO₃ + 3 K₂SO₄ + 6 CO₂ + 5 N₂ — innesco
1001. 4 KNO₃ + 5 C → 2 K₂CO₃ + 3 CO₂ + 2 N₂ — innesco
1002. 48 KNO₃ + 5 C₁₂H₂₂O₁₁ → 24 K₂CO₃ + 24 N₂ + 36 CO₂ + 55 H₂O — innesco
1003. 10 NaN₃ + 2 KNO₃ → K₂O + 5 Na₂O + 16 N₂ — innesco elettrico
1004. 31 NH₄NO₃ + C₁₀H₂₂ → 10 CO₂ + 31 N₂ + 73 H₂O — detonatore
1005. 2 KNO₃ + S + 3 C → K₂S + N₂ + 3 CO₂ — innesco; ΔH° −572 kJ · **già nell'app**

*10.8 Composti dell'azoto, dello zolfo e altri (28)*

1006. 2 N₂H₄ + N₂O₄ → 3 N₂ + 4 H₂O — ipergolica (si accende al contatto)
1007. NaNO₂ + NH₄Cl → NaCl + N₂ + 2 H₂O — Δ
1008. 2 NaNH₂ + N₂O → NaN₃ + NaOH + NH₃ — 190 °C
1009. 2 Na + 2 NH₃ → 2 NaNH₂ + H₂ — cat. Fe
1010. 2 H₂S + SO₂ → 3 S + 2 H₂O — cat. Al₂O₃; ΔH° −234 kJ
1011. SO₂ + NO₂ → SO₃ + NO — ΔH° −86 kJ
1012. CO + NO₂ → CO₂ + NO — ΔH° −225 kJ
1013. 2 CO + 2 NO → 2 CO₂ + N₂ — cat. Pt/Rh; ΔH° −749 kJ
1014. 2 NO + 2 H₂ → N₂ + 2 H₂O — cat. Pt; ΔH° −754 kJ
1015. N₂O + H₂ → N₂ + H₂O — cat.; ΔH° −367 kJ
1016. N₂O + CO → N₂ + CO₂ — cat.; ΔH° −365 kJ
1017. 4 NH₃ + 6 NO → 5 N₂ + 6 H₂O — cat. V₂O₅/TiO₂; ΔH° −2079 kJ
1018. 4 NH₃ + 4 NO + O₂ → 4 N₂ + 6 H₂O — cat.; ΔH° −1896 kJ
1019. 8 NH₃ + 6 NO₂ → 7 N₂ + 12 H₂O — cat.; ΔH° −3261 kJ
1020. NH₃ + 3 F₂ → NF₃ + 3 HF — cat. Cu; ΔH° −906 kJ
1021. UO₂ + 3 F₂ → UF₆ + O₂ — Δ
1022. U + 3 ClF₃ → UF₆ + 3 ClF — Δ
1023. 2 Tc + 2 NaOH + 7 H₂O₂ → 2 NaTcO₄ + 8 H₂O — soluzione basica
1024. XeF₂ + 2 HCl → Xe + Cl₂ + 2 HF
1025. HIO₃ + 5 HI → 3 I₂ + 3 H₂O — soluzione
1026. 2 FeCl₃ + H₂S → 2 FeCl₂ + S + 2 HCl — soluzione
1027. 2 FeCl₃ + 2 KI → 2 FeCl₂ + I₂ + 2 KCl — soluzione
1028. 2 FeCl₃ + SnCl₂ → 2 FeCl₂ + SnCl₄ — soluzione
1029. 2 HgCl₂ + SnCl₂ → Hg₂Cl₂ + SnCl₄ — soluzione
1030. Hg₂Cl₂ + SnCl₂ → 2 Hg + SnCl₄ — soluzione
1031. PdCl₂ + CO + H₂O → Pd + CO₂ + 2 HCl — soluzione
1032. I₂O₅ + 5 CO → I₂ + 5 CO₂ — 150 °C; ΔH° −1257 kJ
1033. As₄O₆ + 12 Zn + 24 HCl → 4 AsH₃ + 12 ZnCl₂ + 6 H₂O — soluzione

*10.9 Pile e accumulatori (3)*

1034. Pb + PbO₂ + 2 H₂SO₄ → 2 PbSO₄ + 2 H₂O — scarica (l'inverso è la ricarica)
1035. Zn + 2 MnO₂ → ZnO + Mn₂O₃
1036. Zn + Ag₂O → ZnO + 2 Ag

#### 11. Metallurgia (75)

*11.1 Arrostimento dei solfuri (9)*

1037. 4 FeS₂ + 11 O₂ → 2 Fe₂O₃ + 8 SO₂ — Δ
1038. 2 ZnS + 3 O₂ → 2 ZnO + 2 SO₂ — Δ
1039. ZnS + 2 O₂ → ZnSO₄ — Δ moderato
1040. 2 PbS + 3 O₂ → 2 PbO + 2 SO₂ — Δ
1041. HgS + O₂ → Hg + SO₂ — Δ
1042. Ag₂S + O₂ → 2 Ag + SO₂ — Δ
1043. 2 MoS₂ + 7 O₂ → 2 MoO₃ + 4 SO₂ — Δ
1044. PbS + 2 PbO → 3 Pb + SO₂ — Δ
1045. Cu₂S + O₂ → 2 Cu + SO₂ — Δ; ΔH° −217 kJ

*11.2 Riduzione con carbonio e monossido di carbonio (22)*

1046. Fe₂O₃ + 3 CO → 2 Fe + 3 CO₂ — altoforno ~900 °C; ΔH° −25 kJ
1047. 3 Fe₂O₃ + CO → 2 Fe₃O₄ + CO₂ — altoforno ~500 °C
1048. Fe₃O₄ + CO → 3 FeO + CO₂ — altoforno ~700 °C
1049. Fe₃O₄ + 4 CO → 3 Fe + 4 CO₂ — Δ
1050. FeO + CO → Fe + CO₂ — altoforno
1051. 2 Fe₂O₃ + 3 C → 4 Fe + 3 CO₂ — Δ; ΔH° 468 kJ
1052. ZnO + C → Zn + CO — Δ 1200 °C
1053. ZnO + CO → Zn + CO₂ — Δ
1054. 2 CuO + C → 2 Cu + CO₂ — Δ
1055. CuO + CO → Cu + CO₂ — Δ
1056. Cu₂O + C → 2 Cu + CO — Δ
1057. 2 PbO + C → 2 Pb + CO₂ — Δ
1058. PbO + CO → Pb + CO₂ — Δ
1059. SnO₂ + 2 C → Sn + 2 CO — Δ
1060. NiO + C → Ni + CO — Δ
1061. Bi₂O₃ + 3 C → 2 Bi + 3 CO — Δ
1062. MnO₂ + 2 C → Mn + 2 CO — Δ, forno elettrico
1063. CaO + 3 C → CaC₂ + CO — forno elettrico 2000 °C
1064. Na₂SO₄ + 2 C → Na₂S + 2 CO₂ — Δ
1065. Na₂SO₄ + 4 C → Na₂S + 4 CO — Δ, carbone in eccesso
1066. TiO₂ + 2 C + 2 Cl₂ → TiCl₄ + 2 CO — 1000 °C
1067. 2 CO ⇌ C + CO₂ — Δ; ΔH° −172 kJ

*11.3 Riduzione con idrogeno (15)*

1068. Fe₂O₃ + 3 H₂ → 2 Fe + 3 H₂O — Δ; ΔH° −33 kJ
1069. Fe₃O₄ + 4 H₂ → 3 Fe + 4 H₂O — Δ
1070. CuO + H₂ → Cu + H₂O — Δ
1071. Cu₂O + H₂ → 2 Cu + H₂O — Δ
1072. NiO + H₂ → Ni + H₂O — Δ
1073. WO₃ + 3 H₂ → W + 3 H₂O — Δ
1074. MoO₃ + 3 H₂ → Mo + 3 H₂O — Δ
1075. RuO₂ + 2 H₂ → Ru + 2 H₂O — Δ
1076. IrO₂ + 2 H₂ → Ir + 2 H₂O — Δ
1077. PtO₂ + 2 H₂ → Pt + 2 H₂O
1078. OsO₄ + 4 H₂ → Os + 4 H₂O — Δ
1079. SiCl₄ + 2 H₂ → Si + 4 HCl — 1100 °C
1080. 2 BCl₃ + 3 H₂ → 2 B + 6 HCl — Δ
1081. GeCl₄ + 2 H₂ → Ge + 4 HCl — Δ
1082. 3 CuO + 2 NH₃ → 3 Cu + N₂ + 3 H₂O — Δ

*11.4 Riduzione con metalli (termite, alluminotermia, calciotermia) (23)*

1083. Fe₂O₃ + 2 Al → Al₂O₃ + 2 Fe — innesco (nastro di magnesio); ΔH° −851 kJ · **già nell'app**
1084. 3 Fe₃O₄ + 8 Al → 4 Al₂O₃ + 9 Fe — innesco
1085. Cr₂O₃ + 2 Al → Al₂O₃ + 2 Cr — innesco
1086. 3 MnO₂ + 4 Al → 2 Al₂O₃ + 3 Mn — innesco
1087. 3 CuO + 2 Al → Al₂O₃ + 3 Cu — innesco
1088. 3 V₂O₅ + 10 Al → 5 Al₂O₃ + 6 V — innesco
1089. 3 Nb₂O₅ + 10 Al → 5 Al₂O₃ + 6 Nb — innesco
1090. MoO₃ + 2 Al → Al₂O₃ + Mo — innesco
1091. WO₃ + 2 Al → Al₂O₃ + W — innesco
1092. 3 NiO + 2 Al → Al₂O₃ + 3 Ni — innesco
1093. Bi₂O₃ + 2 Al → Al₂O₃ + 2 Bi — innesco
1094. CuO + Mg → MgO + Cu — innesco
1095. CO₂ + 2 Mg → 2 MgO + C — innesco; ΔH° −810 kJ
1096. Zn + HgO → ZnO + Hg
1097. UO₂ + 2 Ca → U + 2 CaO — Δ
1098. ThO₂ + 2 Ca → Th + 2 CaO — Δ
1099. PuO₂ + 2 Ca → Pu + 2 CaO — Δ
1100. Sm₂O₃ + 2 La → La₂O₃ + 2 Sm — Δ, vuoto
1101. Eu₂O₃ + 2 La → La₂O₃ + 2 Eu — Δ, vuoto
1102. Tm₂O₃ + 2 La → La₂O₃ + 2 Tm — Δ, vuoto
1103. Yb₂O₃ + 2 La → La₂O₃ + 2 Yb — Δ, vuoto
1104. 3 Ag₂S + 2 Al + 6 H₂O → 6 Ag + 2 Al(OH)₃ + 3 H₂S — soluzione di bicarbonato, Δ
1105. Na₂S + CaCO₃ → Na₂CO₃ + CaS — Δ

*11.5 Silice, silicati e vetro (6)*

1106. SiO₂ + 4 HF → SiF₄ + 2 H₂O
1107. SiO₂ + 2 C → Si + 2 CO — forno ad arco, 2000 °C; ΔH° 690 kJ
1108. 2 MgO + Si → 2 Mg + SiO₂ — Δ, vuoto; ΔH° 293 kJ
1109. Na₂CO₃ + SiO₂ → Na₂SiO₃ + CO₂ — fusione; ΔH° 93 kJ
1110. CaCO₃ + SiO₂ → CaSiO₃ + CO₂ — fusione; ΔH° 90 kJ
1111. 2 Ca₃(PO₄)₂ + 6 SiO₂ + 10 C → 6 CaSiO₃ + P₄ + 10 CO — forno elettrico 1500 °C

#### 12. Processi industriali e catalisi (gas di sintesi, C1) (31)

*12.1 Idrogeno, CO₂ e gas di sintesi (8)*

1112. CO₂ + 4 H₂ → CH₄ + 2 H₂O — cat. Ni, 300-400 °C; ΔH° −253 kJ
1113. CO₂ + 2 H₂ → C + 2 H₂O — cat. Fe, 650 °C; ΔH° −178 kJ
1114. CO₂ + 3 H₂ → CH₃OH + H₂O — cat. Cu/ZnO; ΔH° −132 kJ
1115. CO + 3 H₂ → CH₄ + H₂O — cat. Ni; ΔH° −250 kJ
1116. CH₄ + CO₂ → 2 CO + 2 H₂ — cat. Ni, 800 °C; ΔH° 247 kJ
1117. 2 CH₄ + O₂ → 2 CO + 4 H₂ — cat.; ΔH° −71 kJ
1118. 2 CH₄ → C₂H₂ + 3 H₂ — 1500 °C, raffreddamento rapido; ΔH° 377 kJ
1119. 2 CH₄ + O₂ → C₂H₄ + 2 H₂O — cat., 800 °C; ΔH° −370 kJ

*12.2 Fischer-Tropsch: carburanti sintetici da CO e H₂ (10)*

1120. 2 CO + 5 H₂ → C₂H₆ + 2 H₂O — cat. Fe o Co, 200-350 °C; ΔH° −435 kJ
1121. 3 CO + 7 H₂ → C₃H₈ + 3 H₂O — cat. Fe o Co; ΔH° −631 kJ
1122. 4 CO + 9 H₂ → C₄H₁₀ + 4 H₂O — cat. Fe o Co; ΔH° −827 kJ
1123. 5 CO + 11 H₂ → C₅H₁₂ + 5 H₂O — cat. Fe o Co
1124. 6 CO + 13 H₂ → C₆H₁₄ + 6 H₂O — cat. Fe o Co
1125. 7 CO + 15 H₂ → C₇H₁₆ + 7 H₂O — cat. Fe o Co
1126. 8 CO + 17 H₂ → C₈H₁₈ (ottano) + 8 H₂O — cat. Fe o Co
1127. 9 CO + 19 H₂ → C₉H₂₀ + 9 H₂O — cat. Fe o Co
1128. 10 CO + 21 H₂ → C₁₀H₂₂ + 10 H₂O — cat. Fe o Co
1129. 2 CO + 4 H₂ → C₂H₄ + 2 H₂O — cat. Fe; ΔH° −298 kJ

*12.3 Chimica del metanolo e dei composti C1 (13)*

1130. CH₃OH → CH₂O + H₂ — cat. Ag, 650 °C; ΔH° 131 kJ
1131. 2 CH₃OH + O₂ → 2 CH₂O + 2 H₂O — cat. Fe/Mo; ΔH° −310 kJ
1132. CH₃OH + CO → CH₃COOH — cat. Rh o Ir; ΔH° −135 kJ
1133. 2 CH₃OH → C₂H₄ + 2 H₂O — cat. zeoliti; ΔH° −41 kJ
1134. 3 CH₃OH → C₃H₆ (propene) + 3 H₂O — cat. zeoliti
1135. CH₃OH + H₂S → CH₃SH + H₂O — cat.
1136. 2 CH₄ + 2 NH₃ + 3 O₂ → 2 HCN + 6 H₂O — cat. Pt, 1100 °C; ΔH° −1256 kJ
1137. CH₄ + NH₃ → HCN + 3 H₂ — cat. Pt, 1200 °C; ΔH° 230 kJ
1138. CH₄ + 4 S → CS₂ + 2 H₂S — 600 °C
1139. C + 2 S → CS₂ — Δ 900 °C
1140. CO₂ + 2 NH₃ → CO(NH₂)₂ + H₂O — 190 °C, 150 atm; ΔH° −134 kJ
1141. NaCl + NH₃ + CO₂ + H₂O → NaHCO₃ + NH₄Cl — soluzione; ΔH° −129 kJ
1142. (CN)₂ + H₂ → 2 HCN — Δ

#### 13. Chimica organica (189)

*13.1 Idrogenazione (addizione di H₂) (28)*

1143. C₂H₂ + H₂ → C₂H₄ — cat. Pd avvelenato (Lindlar); ΔH° −175 kJ
1144. C₂H₂ + 2 H₂ → C₂H₆ — cat. Pt o Ni; ΔH° −311 kJ
1145. C₂H₄ + H₂ → C₂H₆ — cat. Ni, Pt o Pd; ΔH° −136 kJ · **già nell'app**
1146. C₃H₆ (propene) + H₂ → C₃H₈ — cat. Ni
1147. C₃H₄ + H₂ → C₃H₆ (propene) — cat. Lindlar
1148. C₃H₄ + 2 H₂ → C₃H₈ — cat. Pt
1149. C₄H₈ (but-1-ene) + H₂ → C₄H₁₀ — cat. Ni
1150. C₄H₈ (but-2-ene) + H₂ → C₄H₁₀ — cat. Ni
1151. C₄H₈ (2-Metilpropene) + H₂ → CH(CH₃)₃ — cat. Ni
1152. C₄H₆ + 2 H₂ → C₄H₁₀ — cat. Ni
1153. C₄H₆ + H₂ → C₄H₈ (but-1-ene) — cat. Pd, H₂ limitato
1154. C₄H₆ + H₂ → C₄H₈ (but-2-ene) — cat. Pd, H₂ limitato
1155. C₅H₈ + 2 H₂ → (CH₃)₂CHCH₂CH₃ — cat. Ni
1156. C₆H₁₀ + H₂ → C₆H₁₂ — cat. Pt
1157. C₆H₆ + 3 H₂ → C₆H₁₂ — cat. Ni, 200 °C, pressione; ΔH° −205 kJ
1158. C₃H₆ (ciclopropano) + H₂ → C₃H₈ — cat. Ni
1159. C₁₈H₃₄O₂ + H₂ → CH₃(CH₂)₁₆COOH — cat. Ni
1160. 2 C₄H₈ (2-Metilpropene) + H₂ → C₈H₁₈ (2,2,4-Trimetilpentano) — cat. acido, poi Ni
1161. CH₂O + H₂ → CH₃OH — cat.; ΔH° −131 kJ
1162. CH₃CHO + H₂ → C₂H₅OH — cat. Ni; ΔH° −85 kJ
1163. CH₃COCH₃ + H₂ → (CH₃)₂CHOH — cat. Ni
1164. CH₃CH₂CHO + H₂ → CH₃CH₂CH₂OH — cat. Ni
1165. CH₃COOH + 2 H₂ → C₂H₅OH + H₂O — cat. Ru; ΔH° −79 kJ
1166. CH₃COOC₂H₅ + 2 H₂ → 2 C₂H₅OH — cat. Cu
1167. CH₃CN + 2 H₂ → C₂H₅NH₂ — cat. Ni
1168. HCN + 2 H₂ → CH₃NH₂ — cat. Ni; ΔH° −132 kJ
1169. C₆H₅CH₃ + H₂ → C₆H₆ + CH₄ — 600 °C
1170. C₆H₁₂O₆ (glucosio) + H₂ → C₆H₁₄O₆ — cat. Ni

*13.2 Deidrogenazione, cracking e reforming (25)*

1171. C₂H₆ → C₂H₄ + H₂ — 850 °C, vapore; ΔH° 136 kJ
1172. C₃H₈ → C₃H₆ (propene) + H₂ — cat. Pt o Cr₂O₃
1173. CH(CH₃)₃ → C₄H₈ (2-Metilpropene) + H₂ — cat.
1174. C₄H₁₀ → C₄H₈ (but-1-ene) + H₂ — cat.
1175. C₄H₁₀ → C₄H₆ + 2 H₂ — cat.
1176. C₂H₅OH → CH₃CHO + H₂ — cat. Cu, Δ; ΔH° 85 kJ
1177. (CH₃)₂CHOH → CH₃COCH₃ + H₂ — cat. Cu, Δ
1178. C₆H₁₂ → C₆H₆ + 3 H₂ — cat. Pt; ΔH° 205 kJ
1179. C₆H₁₄ → C₆H₁₂ + H₂ — cat. Pt
1180. C₆H₁₄ → C₆H₆ + 4 H₂ — cat. Pt, 500 °C
1181. C₇H₁₆ → C₆H₅CH₃ + 4 H₂ — cat. Pt, 500 °C
1182. C₈H₁₈ (ottano) → C₈H₁₀ (1,2-Dimetilbenzene) + 4 H₂ — cat. Pt, 500 °C
1183. C₈H₁₈ (ottano) → C₈H₁₀ (1,4-Dimetilbenzene) + 4 H₂ — cat. Pt, 500 °C
1184. C₃H₈ → C₂H₄ + CH₄ — cracking termico; ΔH° 82 kJ
1185. C₄H₁₀ → C₂H₄ + C₂H₆ — cracking termico; ΔH° 94 kJ
1186. C₄H₁₀ → C₃H₆ (propene) + CH₄ — cracking termico
1187. C₅H₁₂ → C₃H₈ + C₂H₄ — cracking
1188. C₆H₁₄ → C₄H₁₀ + C₂H₄ — cracking
1189. C₇H₁₆ → C₅H₁₂ + C₂H₄ — cracking
1190. C₈H₁₈ (ottano) → C₆H₁₄ + C₂H₄ — cracking
1191. C₉H₂₀ → C₇H₁₆ + C₂H₄ — cracking
1192. C₁₀H₂₂ → C₈H₁₈ (ottano) + C₂H₄ — cracking catalitico
1193. C₁₀H₂₂ → C₇H₁₆ + C₃H₆ (propene) — cracking catalitico
1194. C₆H₅C₂H₅ → C₈H₈ + H₂ — cat. Fe₂O₃, 600 °C
1195. ClCH₂CH₂Cl → CH₂=CHCl + HCl — 500 °C

*13.3 Isomerizzazione (10)*

1196. C₄H₁₀ ⇌ CH(CH₃)₃ — cat. AlCl₃; ΔH° −9 kJ
1197. C₅H₁₂ ⇌ (CH₃)₂CHCH₂CH₃ — cat. Pt
1198. (CH₃)₂CHCH₂CH₃ ⇌ C(CH₃)₄ — cat.
1199. C₈H₁₈ (ottano) → C₈H₁₈ (2,2,4-Trimetilpentano) — cat. Pt
1200. C₄H₈ (but-1-ene) ⇌ C₄H₈ (but-2-ene) — cat.
1201. C₄H₈ (but-1-ene) ⇌ C₄H₈ (2-Metilpropene) — cat. zeoliti
1202. C₈H₁₀ (1,2-Dimetilbenzene) ⇌ C₈H₁₀ (1,4-Dimetilbenzene) — cat. zeoliti
1203. C₈H₁₀ (1,3-Dimetilbenzene) ⇌ C₈H₁₀ (1,4-Dimetilbenzene) — cat. zeoliti
1204. C₃H₆ (ciclopropano) → C₃H₆ (propene) — Δ 500 °C
1205. C₆H₁₂O₆ (glucosio) ⇌ C₆H₁₂O₆ (fruttosio) — enzima glucosio isomerasi

*13.4 Cicloaddizioni, oligomerizzazioni e loro inverse (10)*

1206. C₄H₆ + C₂H₄ → C₆H₁₀ — Δ, pressione
1207. C₆H₁₀ → C₄H₆ + C₂H₄ — Δ
1208. 2 C₅H₈ → C₁₀H₁₆ — Δ
1209. C₁₀H₁₆ → 2 C₅H₈ — Δ (pirolisi)
1210. 3 C₂H₂ → C₆H₆ — cat., 400 °C; ΔH° −633 kJ
1211. 2 C₂H₄ → C₄H₈ (but-1-ene) — cat. Ni o Ti
1212. C₄H₈ (ciclobutano) → 2 C₂H₄ — Δ
1213. C₄H₈ (2-Metilpropene) + CH(CH₃)₃ → C₈H₁₈ (2,2,4-Trimetilpentano) — cat. HF o H₂SO₄
1214. C₆H₆ + C₂H₄ → C₆H₅C₂H₅ — cat. zeoliti; ΔH° −114 kJ
1215. C₆H₆ + C₃H₆ (propene) → C₆H₅CH(CH₃)₂ — cat. zeoliti

*13.5 Idratazione e disidratazione (13)*

1216. C₂H₄ + H₂O → C₂H₅OH — cat. H₃PO₄, 300 °C; ΔH° −44 kJ · **già nell'app**
1217. C₃H₆ (propene) + H₂O → (CH₃)₂CHOH — cat. acido
1218. C₂H₂ + H₂O → CH₃CHO — cat. HgSO₄; ΔH° −134 kJ
1219. C₃H₄ + H₂O → CH₃COCH₃ — cat. Hg²⁺
1220. C₂H₄O + H₂O → HOCH₂CH₂OH — cat. acido
1221. C₂H₅OH → C₂H₄ + H₂O — H₂SO₄ concentrato, 170 °C; ΔH° 44 kJ
1222. 2 C₂H₅OH → C₂H₅OC₂H₅ + H₂O — H₂SO₄ concentrato, 140 °C
1223. 2 CH₃OH → CH₃OCH₃ + H₂O — cat. acido; ΔH° 8 kJ
1224. (CH₃)₂CHOH → C₃H₆ (propene) + H₂O — cat. acido, Δ
1225. CH₃CH₂CH₂OH → C₃H₆ (propene) + H₂O — cat. acido, Δ
1226. C₄H₁₀O → C₄H₈ (but-1-ene) + H₂O — cat. acido, Δ
1227. 2 CH₃COOH → (CH₃CO)₂O + H₂O — Δ, disidratante
1228. CH₃CONH₂ → CH₃CN + H₂O — P₄O₁₀

*13.6 Alogenazione, sostituzione ed eliminazione (46)*

1229. CH₄ + Cl₂ → CH₃Cl + HCl — luce; ΔH° −99 kJ · **già nell'app**
1230. CH₃Cl + Cl₂ → CH₂Cl₂ + HCl — luce; ΔH° −135 kJ
1231. CH₂Cl₂ + Cl₂ → CHCl₃ + HCl — luce; ΔH° −102 kJ
1232. CHCl₃ + Cl₂ → CCl₄ + HCl — luce; ΔH° −86 kJ
1233. CH₄ + Br₂ → CH₃Br + HBr — luce
1234. C₂H₆ + Cl₂ → C₂H₅Cl + HCl — luce
1235. C₆H₆ + Cl₂ → C₆H₅Cl + HCl — cat. FeCl₃
1236. CH₄ + 4 F₂ → CF₄ + 4 HF
1237. C₂H₄ + HCl → C₂H₅Cl — cat. AlCl₃
1238. C₂H₂ + HCl → CH₂=CHCl — cat. HgCl₂
1239. CH₃OH + HCl → CH₃Cl + H₂O — cat. ZnCl₂; ΔH° −36 kJ
1240. CH₃OH + HBr → CH₃Br + H₂O
1241. CH₃OH + HI → CH₃I + H₂O
1242. C₂H₅OH + HCl → C₂H₅Cl + H₂O — cat. ZnCl₂
1243. CH₃Cl + NaOH → CH₃OH + NaCl — soluzione; ΔH° −143 kJ
1244. C₂H₅Cl + NaOH → C₂H₅OH + NaCl — soluzione
1245. CH₃Br + NaOH → CH₃OH + NaBr — soluzione
1246. CH₃I + NaOH → CH₃OH + NaI — soluzione
1247. CH₃Cl + H₂O → CH₃OH + HCl — lenta; ΔH° 36 kJ
1248. CH₃Br + H₂O → CH₃OH + HBr — lenta
1249. C₂H₅Cl + KOH → C₂H₄ + KCl + H₂O — KOH in etanolo, Δ
1250. CH₃Cl + NaCN → CH₃CN + NaCl
1251. CH₃I + NaCN → CH₃CN + NaI
1252. CH₃Br + KCN → CH₃CN + KBr
1253. CH₃Cl + 2 NH₃ → CH₃NH₂ + NH₄Cl — ΔH° −164 kJ
1254. C₆H₅Cl + NaOH → C₆H₅OH + NaCl — 350 °C, 300 atm
1255. C₆H₅Cl + NH₃ → C₆H₅NH₂ + HCl — cat. Cu, Δ
1256. C₆H₅OH + NH₃ → C₆H₅NH₂ + H₂O — cat., Δ
1257. 2 CH₃Cl + 2 Na → C₂H₆ + 2 NaCl — etere anidro; ΔH° −743 kJ
1258. 2 CH₃I + 2 Na → C₂H₆ + 2 NaI — etere anidro
1259. 2 C₂H₅Cl + 2 Na → C₄H₁₀ + 2 NaCl — etere anidro
1260. CH₃Cl + C₂H₅Cl + 2 Na → C₃H₈ + 2 NaCl — etere anidro
1261. C₆H₅Cl + CH₃Cl + 2 Na → C₆H₅CH₃ + 2 NaCl — etere anidro
1262. C₆H₆ + CH₃Cl → C₆H₅CH₃ + HCl — cat. AlCl₃
1263. C₆H₅CH₃ + CH₃Cl → C₈H₁₀ (1,2-Dimetilbenzene) + HCl — cat. AlCl₃
1264. C₆H₅CH₃ + CH₃Cl → C₈H₁₀ (1,4-Dimetilbenzene) + HCl — cat. AlCl₃
1265. 2 C₆H₅CH₃ → C₆H₆ + C₈H₁₀ (1,4-Dimetilbenzene) — cat. zeoliti
1266. C₇H₈N₄O₂ + CH₃I → C₈H₁₀N₄O₂ + HI — base
1267. COCl₂ + 4 NH₃ → CO(NH₂)₂ + 2 NH₄Cl
1268. C₂H₂ + 2 Cl₂ → ClCH=CCl₂ + HCl — in due passaggi (via tetracloroetano)
1269. ClCH=CCl₂ + 3 HF + Br₂ → CF₃CHBrCl + 2 HCl + HBr — in due passaggi: cat. SbCl₅, poi 450 °C
1270. C₂H₄ + Br₂ → BrCH₂CH₂Br
1271. C₂H₄ + Cl₂ → ClCH₂CH₂Cl — cat. FeCl₃
1272. C₆H₆ + Br₂ → C₆H₅Br + HBr — cat. FeBr₃; ΔH° −24 kJ
1273. CH₃COOH + SOCl₂ → CH₃COCl + SO₂ + HCl
1274. 2 C₂H₅OH + 2 Na → 2 C₂H₅ONa + H₂

*13.7 Esteri, anidridi, ammidi, nitrili e nitroderivati (30)*

1275. CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O — cat. H₂SO₄
1276. CH₃COOC₂H₅ + NaOH → CH₃COONa + C₂H₅OH — soluzione
1277. (CH₃CO)₂O + H₂O → 2 CH₃COOH
1278. (CH₃CO)₂O + C₂H₅OH → CH₃COOC₂H₅ + CH₃COOH
1279. C₇H₆O₃ + (CH₃CO)₂O → C₉H₈O₄ + CH₃COOH — cat. H₂SO₄
1280. C₉H₈O₄ + H₂O → C₇H₆O₃ + CH₃COOH — umidità
1281. CH₃COOH + NH₃ → CH₃CONH₂ + H₂O — Δ
1282. HCOOH + NH₃ → HCONH₂ + H₂O — Δ
1283. (CH₃CO)₂O + NH₃ → CH₃CONH₂ + CH₃COOH
1284. CH₃CONH₂ + H₂O → CH₃COOH + NH₃ — acido o base, Δ
1285. HCONH₂ + H₂O → HCOOH + NH₃ — acido o base
1286. CH₃CN + 2 H₂O → CH₃COOH + NH₃ — acido o base, Δ
1287. CH₃OH + NH₃ → CH₃NH₂ + H₂O — cat., 400 °C; ΔH° −24 kJ
1288. 2 CH₃OH + NH₃ → (CH₃)₂NH + 2 H₂O — cat., 400 °C
1289. 3 CH₃OH + NH₃ → (CH₃)₃N + 3 H₂O — cat., 400 °C
1290. C₂H₅OH + NH₃ → C₂H₅NH₂ + H₂O — cat.
1291. C₃H₈O₃ + 3 HNO₃ → C₃H₅N₃O₉ + 3 H₂O — H₂SO₄ concentrato, freddo
1292. C₆H₅CH₃ + 3 HNO₃ → C₇H₅N₃O₆ + 3 H₂O — H₂SO₄ concentrato
1293. CH₄ + HNO₃ → CH₃NO₂ + H₂O — 400 °C
1294. CO(NH₂)₂ + H₂O → CO₂ + 2 NH₃ — enzima ureasi; ΔH° 134 kJ
1295. C₁₂H₂₂O₁₁ + H₂O → C₆H₁₂O₆ (glucosio) + C₆H₁₂O₆ (fruttosio) — acido o enzima invertasi
1296. CH₃COOH + CH₃OH → CH₃COOCH₃ + H₂O — cat. H₂SO₄; ΔH° −8 kJ
1297. CH₃COOH + (CH₃)₂CHCH₂CH₂OH → C₇H₁₄O₂ + H₂O — cat. H₂SO₄
1298. C₇H₆O₃ + CH₃OH → HOC₆H₄COOCH₃ + H₂O — cat. H₂SO₄
1299. C₅₇H₁₁₀O₆ + 3 NaOH → 3 C₁₇H₃₅COONa + C₃H₈O₃ — Δ
1300. C₆H₆ + HNO₃ → C₆H₅NO₂ + H₂O — H₂SO₄ concentrato; ΔH° −148 kJ
1301. C₆H₅NO₂ + 3 H₂ → C₆H₅NH₂ + 2 H₂O — cat. Ni
1302. HOC₆H₄NH₂ + (CH₃CO)₂O → C₈H₉NO₂ + CH₃COOH
1303. C₂H₄O + NH₃ → HOCH₂CH₂NH₂
1304. NH₄OCN → CO(NH₂)₂ — Δ

*13.8 Ossidazioni parziali (16)*

1305. 2 C₂H₅OH + O₂ → 2 CH₃CHO + 2 H₂O — cat. Ag o Cu; ΔH° −401 kJ
1306. 2 CH₃CHO + O₂ → 2 CH₃COOH — cat. Mn²⁺; ΔH° −584 kJ
1307. 2 (CH₃)₂CHOH + O₂ → 2 CH₃COCH₃ + 2 H₂O — cat.
1308. 2 C₂H₄ + O₂ → 2 CH₃CHO — cat. PdCl₂/CuCl₂; ΔH° −489 kJ
1309. PdCl₂ + C₂H₄ + H₂O → Pd + CH₃CHO + 2 HCl — soluzione
1310. 2 C₂H₄ + O₂ → 2 C₂H₄O — cat. Ag, 250 °C
1311. C₆H₅CH₃ + O₂ → C₆H₅CHO + H₂O — cat.
1312. 2 C₆H₅CH₃ + 3 O₂ → 2 C₆H₅COOH + 2 H₂O — cat. Co
1313. 2 C₆H₅CHO + O₂ → 2 C₆H₅COOH — aria
1314. 2 CH₂O + O₂ → 2 HCOOH — ΔH° −633 kJ
1315. CH₄ + O₂ → CH₂O + H₂O — cat.; ΔH° −320 kJ
1316. 2 C₄H₁₀ + 5 O₂ → 4 CH₃COOH + 2 H₂O — cat. Co; ΔH° −2258 kJ
1317. HOCH₂CH₂OH + 2 O₂ → HOOC–COOH + 2 H₂O — cat.
1318. C₂H₄ + O₃ → CH₂O + HCOOH — ΔH° −729 kJ
1319. C₈H₁₀ (1,4-Dimetilbenzene) + 3 O₂ → C₆H₄(COOH)₂ + 2 H₂O — cat. Co/Mn
1320. C₆H₅CH(CH₃)₂ + O₂ → C₆H₅OH + CH₃COCH₃ — in due passaggi (via idroperossido)

*13.9 Decarbossilazioni e carbossilazioni (6)*

1321. 2 CH₃COOH → CH₃COCH₃ + CO₂ + H₂O — Δ, cat.; ΔH° 41 kJ
1322. C₆H₅COOH → C₆H₆ + CO₂ — Δ, CaO
1323. C₇H₆O₃ → C₆H₅OH + CO₂ — Δ
1324. C₆H₅OH + CO₂ → C₇H₆O₃ — NaOH, 125 °C, 100 atm
1325. NH₂CH₂COOH → CH₃NH₂ + CO₂ — Δ o enzima; ΔH° 112 kJ
1326. C₃H₇NO₂ → C₂H₅NH₂ + CO₂ — Δ o enzima

*13.10 Chimica prebiotica (5)*

1327. CH₃CHO + HCN + H₂O → C₃H₇NO₂ — NH₃
1328. CH₂O + HCN + H₂O → NH₂CH₂COOH — NH₃; ΔH° −243 kJ
1329. 5 HCN → C₅H₅N₅ — NH₃, Δ
1330. 6 CH₂O → C₆H₁₂O₆ (glucosio) — Ca(OH)₂; ΔH° −622 kJ
1331. 5 CH₂O → C₅H₁₀O₅ — Ca(OH)₂, borati

#### 14. Biochimica, fermentazioni e cicli naturali (18)

*14.1 Fotosintesi e respirazione (2)*

1332. 6 CO₂ + 6 H₂O → C₆H₁₂O₆ (glucosio) + 6 O₂ — luce, clorofilla; ΔH° 2803 kJ · **già nell'app**
1333. 6 CO₂ + 12 H₂S → C₆H₁₂O₆ (glucosio) + 6 H₂O + 12 S — luce, batteri sulfurei; ΔH° −380 kJ

*14.2 Fermentazioni (7)*

1334. C₆H₁₂O₆ (glucosio) → 2 C₂H₅OH + 2 CO₂ — lieviti; ΔH° −69 kJ · **già nell'app**
1335. C₆H₁₂O₆ (glucosio) → 2 CH₃CH(OH)COOH — batteri lattici o muscoli sotto sforzo
1336. C₆H₁₂O₆ (glucosio) → 3 CH₃COOH — batteri acetogeni; ΔH° −180 kJ
1337. C₆H₁₂O₆ (glucosio) → CH₃(CH₂)₂COOH + 2 CO₂ + 2 H₂ — batteri (Clostridium)
1338. C₆H₁₂O₆ (glucosio) → 3 CH₄ + 3 CO₂ — batteri e archei (digestione anaerobica); ΔH° −132 kJ
1339. CH₃COOH → CH₄ + CO₂ — archei metanogeni; ΔH° 16 kJ
1340. C₂H₅OH + O₂ → CH₃COOH + H₂O — batteri Acetobacter; ΔH° −493 kJ

*14.3 Ciclo dell'azoto e metabolismo (9)*

1341. 2 NH₃ + 3 O₂ → 2 HNO₂ + 2 H₂O — batteri nitrosanti
1342. 2 HNO₂ + O₂ → 2 HNO₃ — batteri nitrificanti
1343. C₄H₅N₃O + H₂O → C₄H₄N₂O₂ + NH₃ — spontanea, lenta
1344. NH₂CH₂COOH + CH₂O → C₃H₇NO₃ — enzima
1345. C₃H₇NO₃ + H₂S → C₃H₇NO₂S + H₂O — enzima (batteri e piante)
1346. 2 C₉H₁₁NO₂ + O₂ → 2 C₉H₁₁NO₃ — enzima fenilalanina idrossilasi
1347. 2 C₆H₁₂O₆ (glucosio) + O₂ → 2 C₆H₁₂O₇ — enzimi glucosio ossidasi e catalasi
1348. 2 NH₂CH₂COOH → C₄H₈N₂O₃ + H₂O — enzimi (ribosoma)
1349. 2 C₆H₈O₆ + O₂ → 2 C₆H₆O₆ + 2 H₂O — aria
