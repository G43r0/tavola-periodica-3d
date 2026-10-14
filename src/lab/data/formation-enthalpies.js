// Entalpie di formazione standard ΔHf° (kJ/mol, 25 °C, 1 bar) delle sostanze del catalogo delle reazioni che nella
// libreria non le avevano: servono al ΔH° delle reazioni nel laboratorio molecolare, nel simulatore (calore, finestrella,
// quaderno) e nel libro «Come si fa». Ogni valore è nello stato della voce della libreria (solido, liquido, gas); gli
// ioni, gli acidi deboli «in soluzione» e l'ipoclorito di sodio (la candeggina) sono in acqua, con ΔHf°(H⁺, aq) = 0
// (H₃O⁺ = H⁺ + H₂O). Solo valori tabulati, nessuna stima.
// Fonte: The NBS tables of chemical thermodynamic properties (D. D. Wagman et al., J. Phys. Chem. Ref. Data 11,
// suppl. 2, 1982), riprese dal CRC Handbook of Chemistry and Physics («Standard thermodynamic properties of chemical
// substances»); per i composti organici NIST Chemistry WebBook.

export const FORMATION_ENTHALPIES = {
  // solfati, nitrati, carbonati e altri sali
  na2so4: -1387.1, k2so4: -1437.8, cuso4: -771.4, baso4: -1473.2, mgso4: -1284.9, caso4: -1434.1, znso4: -982.8,
  feso4: -928.4, niso4: -872.9, al2so43: -3440.8, nh42so4: -1180.9,
  agno3: -124.4, nano3: -467.9, pbno32: -451.9, nh4no3: -365.6, nano2: -358.7,
  k2co3: -1151.0, mgco3: -1095.8, li2co3: -1215.9, 'acetato-di-sodio': -708.8,
  na2so3: -1100.8, na2s2o3: -1123.0, na3po4: -1917.4, ca3po42: -4120.8, kscn: -200.2,
  kclo3: -397.7, kclo4: -432.8, nh4clo4: -295.3, kmno4: -837.2, k2cr2o7: -2061.5, k2cro4: -1403.7,
  // alogenuri
  zncl2: -415.1, fecl2: -341.8, fecl3: -399.5, cucl2: -220.1, cucl: -137.2, bacl2: -858.6, alcl3: -704.2,
  hgcl2: -224.3, hg2cl2: -265.2, sncl2: -325.1, cocl2: -312.5, srcl2: -828.9, rbcl: -435.4, cscl: -443.0,
  aucl3: -117.6, agcl: -127.1, agbr: -100.4, pbi2: -175.5, nai: -287.8, nabr: -361.1, kf: -567.3,
  sncl4: -511.3, ticl4: -804.2, sicl4: -687.0, gecl4: -531.8, s2cl2: -59.4, scl2: -50.0, so2cl2: -394.1, bcl3: -403.8,
  // ossidi e idrossidi
  cuo: -157.3, cu2o: -168.6, zno: -348.3, mno2: -520.0, fe3o4: -1118.4, feo: -272.0, pbo: -219.0, pbo2: -277.4,
  cr2o3: -1139.7, nio: -239.7, hgo: -90.8, tio2: -944.7, moo3: -745.1, sno2: -580.7, wo3: -842.9, bi2o3: -573.9,
  v2o5: -1550.6, ceo2: -1088.7, zro2: -1100.6, tho2: -1226.4, uo2: -1084.9, na2o2: -510.9, p4o10: -2984.0,
  mgoh2: -924.5, cuoh2: -449.8, lioh: -484.9, baoh2: -944.7,
  // solfuri, nitruri, idruri, carburi, cianuri, azoturi
  na2s: -364.8, zns: -206.0, ag2s: -32.6, pbs: -100.4, hgs: -58.2, cds: -161.9, fes2: -178.2, mos2: -235.1,
  li3n: -164.6, mg3n2: -461.1, lih: -90.5, nah: -56.3, cah2: -186.2, cac2: -59.8, nacn: -87.5, kcn: -113.0, nan3: 21.7,
  // elementi come molecole (zolfo rombico S₈, fosforo bianco P₄: stato standard)
  s8: 0, p4: 0,
  // gas e liquidi inorganici
  clo2: 102.5, cl2o: 80.3, cos: -142.0, h2se: 29.7, h2te: 99.6, ash3: 66.4, sbh3: 145.1, geh4: 90.8, cf4: -925.0,
  sif4: -1614.9, brcl: 14.6, sef6: -1117.0, tef6: -1318.0, cs2: 89.7, hclo4: -40.6,
  // in acqua
  h3o: -285.8, oh: -230.0, nh4: -132.5, so4: -909.3, idrogenosolfato: -887.3, co3: -677.1, hco3: -692.0,
  ipoclorito: -107.1, cn: 150.6, po4: -1277.4, idrogenofosfato: -1292.1, diidrogenofosfato: -1296.3,
  acetato: -486.0, permanganato: -541.4, no3: -205.0, nitrito: -104.6, perclorato: -129.3, clorato: -104.0,
  clorito: -66.5, solfito: -635.5, tiosolfato: -652.3, iodato: -221.3, idrogenosolfuro: -17.6, formiato: -425.6,
  ossalato: -825.1, dicromato: -1490.3, tiocianato: 76.4, azoturo: 275.1,
  naclo: -347.3, hclo: -120.9, hno2: -119.2, h2co3: -699.7, h2so3: -608.8, hclo2: -51.9,
  // composti organici (NIST Chemistry WebBook)
  saccarosio: -2226.1, fruttosio: -1265.6, glicerolo: -669.6, fenolo: -165.1, 'acetato-di-etile': -479.3,
  cumene: -41.1, isopropanolo: -318.1, 'glicole-etilenico': -460.0, benzaldeide: -87.0, 'acido-butanoico': -533.8,
  toluene: 12.4, 'p-xilene': -24.4, 'o-xilene': -24.4, 'm-xilene': -25.4, pentano: -173.5,
  cloroetano: -112.1, propene: 20.0, isobutene: -16.9, butadiene: 110.0, metantiolo: -22.9, fosgene: -219.1,
};
