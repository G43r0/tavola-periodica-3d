// Piccole sorprese nascoste nell'app. Se vuoi trovarle da solo, smetti di leggere qui.
import '../styles/sparks.css';
import { getLang } from '../i18n/index.js';
import { clean, sig } from './spark-sig.js';

const STORE = 'tp3d.secrets';
const DATA = [
  'eyJpZHMiOlsidXVlIiwia29uYW1pIiwibWVuZGVsZWV2Iiwic3BlbGwiLCJtb2xlIiwiYmlydGhkYXkiLCJjYWZmZWluZSIsImFsY2hlbXkiLC',
  'JoZWlzZW5iZXJnIiwiYW5zd2VyIiwia2VlcGVyIl0sIml0Ijp7ImZvb3QiOiJTZWdyZXRvIHRyb3ZhdG8gwrcge2t9IGRpIHtOfSIsImFnYWlu',
  'IjoiR2nDoCBzY29wZXJ0byDCtyB7a30gZGkge059IiwiYWxsIjoiTGkgaGFpIHRyb3ZhdGkgdHV0dGk6IGNvbXBsaW1lbnRpLCBzZWkgdW5hIG',
  '1lbnRlIGRhdnZlcm8gY3VyaW9zYSEiLCJ1dWUiOnsidCI6IkVsZW1lbnRvIDExOTogdW51bmVubmlvIiwiZCI6WyJIYWkgYnVzc2F0byBzZXR0',
  'ZSB2b2x0ZSBlIHNpIMOoIGFwZXJ0YSBsJ290dGF2YSByaWdhLiBMJ3VudW5lbm5pbyAoVXVlLCBaID0gMTE5KSDDqCBsJ2VsZW1lbnRvIHBpw7',
  'kgbGVnZ2VybyBjaGUgbmVzc3VubyDDqCBhbmNvcmEgcml1c2NpdG8gYSBwcm9kdXJyZTogc2FyZWJiZSB1biBtZXRhbGxvIGFsY2FsaW5vLCBz',
  'b3R0byBpbCBmcmFuY2lvLCBlIGluYXVndXJlcmViYmUgbCdvdHRhdm8gcGVyaW9kbyBkZWxsYSB0YXZvbGEuIiwiRGl2ZXJzaSBsYWJvcmF0b3',
  'JpIG5lbCBtb25kbyBwcm92YW5vIGEgY3JlYXJsbyBmYWNlbmRvIHNjb250cmFyZSBudWNsZWkgcGVzYW50aSwgcGVyIGVzZW1waW8gdmFuYWRp',
  'by01MSBjb250cm8gY3VyaW8tMjQ4OiBzZXJ2b25vIG1lc2kgZGkgZmFzY2lvIHBlciBzcGVyYXJlIGluIHVuIHNvbG8gYXRvbW8sIGNoZSB2aX',
  'ZyZWJiZSB1bmEgZnJhemlvbmUgZGkgc2Vjb25kby4iLCJJbCBub21lIHByb3Z2aXNvcmlvIHZ1b2wgZGlyZSBzZW1wbGljZW1lbnRlIMKrdW5v',
  'LXVuby1ub3ZlwrsgaW4gbGF0aW5vOiBxdWVsbG8gdmVybyBsbyBzY2VnbGllcsOgIGNoaSBsbyBzY29wcmlyw6AuIl19LCJrb25hbWkiOnsidC',
  'I6Ik9uZGEgcGVyaW9kaWNhIiwiZCI6WyLihpEg4oaRIOKGkyDihpMg4oaQIOKGkiDihpAg4oaSIEIgQTogaWwgY29kaWNlIHNlZ3JldG8gcGnD',
  'uSBmYW1vc28gZGVpIHZpZGVvZ2lvY2hpLiBMYSB0YXZvbGEgaGEgcmlzcG9zdG8gY29uIHVuJ29uZGEgY2hlIGxhIGF0dHJhdmVyc2EgaW4gb3',
  'JkaW5lIGRpIG51bWVybyBhdG9taWNvLiIsIlNlZ3VpIGlsIHJpdG1vOiBsZSBwcm9wcmlldMOgIGRlZ2xpIGVsZW1lbnRpIHNpIHJpcGV0b25v',
  'IGRvcG8gMiwgOCwgOCwgMTgsIDE4LCAzMiBlIDMyIGVsZW1lbnRpLiDDiCBwcm9wcmlvIHF1ZXN0YSByaXBldGl6aW9uZSwgbGEgcGVyaW9kaW',
  'NpdMOgLCBhIGRhcmUgaWwgbm9tZSBhbGxhIHRhdm9sYS4iXX0sIm1lbmRlbGVldiI6eyJ0IjoiTGUgcHJldmlzaW9uaSBkaSBNZW5kZWxlZXYi',
  'LCJkIjpbIk5lbCAxODcxIERtaXRyaWogTWVuZGVsZWV2IGxhc2Npw7IgbmVsbGEgc3VhIHRhdm9sYSBhbGN1bmUgY2FzZWxsZSB2dW90ZSBlIG',
  'Rlc2NyaXNzZSBnbGkgZWxlbWVudGkgY2hlIGxlIGF2cmViYmVybyByaWVtcGl0ZTogZWthLWJvcm8sIGVrYS1hbGx1bWluaW8sIGVrYS1zaWxp',
  'Y2lvLCBla2EtbWFuZ2FuZXNlLiBPcmEgc29ubyBhY2Nlc2k6IHNjYW5kaW8sIGdhbGxpbywgZ2VybWFuaW8gZSB0ZWNuZXppby4iLCJQZXIgbC',
  'dla2EtYWxsdW1pbmlvIHByZXZpZGUgdW5hIG1hc3NhIGF0b21pY2EgZGkgY2lyY2EgNjggZSB1bmEgZGVuc2l0w6AgZGkgNSw5IGcvY23Csy4g',
  'SWwgZ2FsbGlvLCBzY29wZXJ0byBuZWwgMTg3NSwgaGEgNjksNyBlIDUsOS4gSWwgc3VvIHNjb3ByaXRvcmUgYWxsJ2luaXppbyBtaXN1csOyID',
  'QsNzogTWVuZGVsZWV2IGdsaSBzY3Jpc3NlIGNoZSBkb3ZldmEgYXZlciBzYmFnbGlhdG8sIGUgYXZldmEgcmFnaW9uZSBsdWkuIiwiSWwgdGVj',
  'bmV6aW8gZG92ZXR0ZSBhc3BldHRhcmUgaWwgMTkzNzogZnUgaWwgcHJpbW8gZWxlbWVudG8gcHJvZG90dG8gYXJ0aWZpY2lhbG1lbnRlLCBlIG',
  'lsIHN1byBub21lIHZpZW5lIHByb3ByaW8gZGFsIGdyZWNvIMKrYXJ0aWZpY2lhbGXCuy4iXX0sInNwZWxsIjp7InQiOiJTY3JpdHRvIGNvbiBn',
  'bGkgZWxlbWVudGkiLCJkIjpbIsKre3dvcmR9wrsgc2kgcHXDsiBzY3JpdmVyZSBjb24gaSBzaW1ib2xpIGRlbGxhIHRhdm9sYToge3N5bWJvbH',
  'N9LiIsIsOIIHVuIHZlY2NoaW8gZ2lvY28gZGVpIGNoaW1pY2k6IHByb3ZhIGNvbiBpbCB0dW8gbm9tZSAoTWFpdXNjICsgSW52aW8gbmVsbGEg',
  'cmljZXJjYSkuIl0sIm5vIjpbIsKre3dvcmR9wrsgbm9uIHNpIHB1w7Igc2NyaXZlcmUgY29uIGkgc2ltYm9saSBkZWdsaSBlbGVtZW50aS4iLC',
  'JOb24gdHV0dGUgbGUgbGV0dGVyZSBlc2lzdG9ubyBkYSBzb2xlOiBBLCBELCBFLCBHLCBMLCBNLCBSLCBULCBYIGUgWiBzb25vIHNvbG8gcGV6',
  'emkgZGkgc2ltYm9saSBwacO5IGx1bmdoaSwgZSBsYSBKIGUgbGEgUSBub24gY29tcGFpb25vIGluIG5lc3N1biBzaW1ib2xvLiBQcm92YSBjb2',
  '4gdW4nYWx0cmEgcGFyb2xhIChNYWl1c2MgKyBJbnZpbyBuZWxsYSByaWNlcmNhKS4iXX0sIm1vbGUiOnsidCI6IkJ1b24gTW9sZSBEYXkhIiwi',
  'ZCI6WyJPZ2dpIMOoIGlsIDIzIG90dG9icmUgZSBzb25vIHBhc3NhdGUgbGUgNjowMjogYWxsJ2FtZXJpY2FuYSBzaSBzY3JpdmUgMTAvMjMsIG',
  'NvbWUgNiwwMiDDlyAxMMKywrMsIGlsIG51bWVybyBkaSBBdm9nYWRyby4gQ2hpbWljaSBkaSB0dXR0byBpbCBtb25kbyBmZXN0ZWdnaWFubyBs',
  'YSBtb2xlIGRhbGxlIDY6MDIgYWxsZSAxODowMi4iLCJVbmEgbW9sZSBkaSBncmFuZWxsaSBkaSBzYWJiaWEgY29wcmlyZWJiZSB0dXR0YSBsJ0',
  'l0YWxpYSBjb24gdW5vIHN0cmF0byBhbHRvIHVuIHBhaW8gZGkgY2hpbG9tZXRyaTsgdW5hIG1vbGUgZGkgbW9sZWNvbGUgZCdhY3F1YSBzdGEg',
  'aW4gcG9jbyBwacO5IGRpIHVuIGN1Y2NoaWFpby4iXX0sImJpcnRoZGF5Ijp7InQiOiJCdW9uIGNvbXBsZWFubm8hIiwiZmViIjpbIkwnOCBmZW',
  'JicmFpbyAxODM0IG5hc2NldmEgYSBUb2JvbCdzaywgaW4gU2liZXJpYSwgRG1pdHJpaiBJdmFub3ZpxI0gTWVuZGVsZWV2LCBpbCBjaGltaWNv',
  'IGNoZSBtaXNlIGluIG9yZGluZSBnbGkgZWxlbWVudGkgaW4gcXVlc3RhIHRhdm9sYS4gT2dnaSBjb21waXJlYmJlIHtufSBhbm5pLiIsIkVyYS',
  'BpbCBwacO5IHBpY2NvbG8gZGkgbW9sdGlzc2ltaSBmcmF0ZWxsaSBlLCBzaSByYWNjb250YSwgbGEgZGlzcG9zaXppb25lIGdpdXN0YSBkZWds',
  'aSBlbGVtZW50aSBnbGkgYXBwYXJ2ZSBpbiBzb2dubyBkb3BvIGdpb3JuaSBwYXNzYXRpIGEgc3Bvc3RhcmUgY2FydG9uY2luaS4iXSwibWFyIj',
  'pbIklsIDHCsCBtYXJ6byAxODY5ICgxNyBmZWJicmFpbyBuZWwgY2FsZW5kYXJpbyBydXNzbyBkZWxsJ2Vwb2NhKSBNZW5kZWxlZXYgY29tcGxl',
  'dMOyIGxhIHByaW1hIHZlcnNpb25lIGRlbGxhIHRhdm9sYSBwZXJpb2RpY2EgZSBsYSBtYW5kw7IgYWkgY29sbGVnaGkuIE9nZ2kgbGEgdGF2b2',
  'xhIGNvbXBpZSB7bn0gYW5uaS4iLCJBbGwnZXBvY2Egc2kgY29ub3NjZXZhbm8gNjMgZWxlbWVudGk7IG9nZ2kgbGUgY2FzZWxsZSBwaWVuZSBz',
  'b25vIDExOC4iXX0sImNhZmZlaW5lIjp7InQiOiJQYXVzYSBjYWZmw6giLCJkIjpbIkhhaSBjb3N0cnVpdG8gbGEgY2FmZmVpbmEsIEPigohI4o',
  'KB4oKATuKChE/igoI6IGxhIG1vbGVjb2xhIGNoZSB0aWVuZSBzdmVnbGkgc3R1ZGVudGkgZSBjaGltaWNpIGRpIHR1dHRvIGlsIG1vbmRvLiBG',
  'dW56aW9uYSBvY2N1cGFuZG8gbmVsIGNlcnZlbGxvIGkgcmVjZXR0b3JpIGRlbGwnYWRlbm9zaW5hLCBsYSBtb2xlY29sYSBjaGUgc2VnbmFsYS',
  'BsYSBzdGFuY2hlenphLiIsIlVuYSB0YXp6aW5hIGRpIGVzcHJlc3NvIG5lIGNvbnRpZW5lIGNpcmNhIDYw4oCTMTAwIG1nLiBMZSBwaWFudGUg',
  'bGEgcHJvZHVjb25vIGNvbWUgaW5zZXR0aWNpZGEgbmF0dXJhbGUuIl19LCJhbGNoZW15Ijp7InQiOiJMYSBwaWV0cmEgZmlsb3NvZmFsZSIsIm',
  'QiOlsie259IGdyYW5lbGxpIGRpIHBpb21ibyBzb25vIGRpdmVudGF0aSBvcm8uIEdsaSBhbGNoaW1pc3RpIGwnaGFubm8gY2VyY2F0YSBwZXIg',
  'c2Vjb2xpOyB0dSBsJ2hhaSB0cm92YXRhIG5lbGxhIGNhc2VsbGEgZGkgcmljZXJjYS4iLCJOZWxsYSByZWFsdMOgIMOoIHBvc3NpYmlsZSwgbW',
  'Egc29sbyB0b2dsaWVuZG8gdHJlIHByb3RvbmkgYSBvZ25pIG51Y2xlbzogbmVsIDE5ODAgR2xlbm4gU2VhYm9yZyBvdHRlbm5lIHF1YWxjaGUg',
  'bWlnbGlhaW8gZGkgYXRvbWkgZCdvcm8gZGFsIGJpc211dG8gY29uIHVuIGFjY2VsZXJhdG9yZSwgZSBuZWwgMjAyNSBsJ2VzcGVyaW1lbnRvIE',
  'FMSUNFIGRlbCBDRVJOIGhhIG1pc3VyYXRvIGwnb3JvIGNoZSBzaSBmb3JtYSBwZXIgdW4gaXN0YW50ZSBxdWFuZG8gZHVlIG51Y2xlaSBkaSBw',
  'aW9tYm8gc2kgc2Zpb3Jhbm8uIENvc3RhIGVub3JtZW1lbnRlIHBpw7kgZGVsbCdvcm8gc3Rlc3NvLiJdLCJub25lIjpbIkxlIHBhcm9sZSBzb2',
  '5vIHF1ZWxsZSBnaXVzdGUsIG1hIG5lbGxhIHNhbmRib3ggbm9uIGMnw6ggcGlvbWJvIGRhIHRyYXNmb3JtYXJlLiIsIkRpc2VnbmFuZSB1biBw',
  'bycgKFBiKSBlIHByb251bmNpYSBkaSBudW92byBsYSBmb3JtdWxhLiJdfSwiaGVpc2VuYmVyZyI6eyJ0IjoiUHJpbmNpcGlvIGRpIGluZGV0ZX',
  'JtaW5hemlvbmUiLCJkIjpbIlN0YWkgY2VyY2FuZG8gZGkgYWNjaGlhcHBhcmUgbCdlbGV0dHJvbmU/IFdlcm5lciBIZWlzZW5iZXJnIHNwaWVn',
  'w7IgbmVsIDE5MjcgY2hlIG5vbiBzaSBwdcOyIGZhcmUgZmlubyBpbiBmb25kbzogcGnDuSBwcmVjaXNhbWVudGUgc2FpIGRvdmUgc2kgdHJvdm',
  'EgdW5hIHBhcnRpY2VsbGEsIG1lbm8gcHVvaSBzYXBlcmUgcXVhbnRvIHZlbG9jZSB2YSwgZSB2aWNldmVyc2EuIiwiTm9uIMOoIHVuIGRpZmV0',
  'dG8gZGVnbGkgc3RydW1lbnRpIG1hIHVuYSBsZWdnZSBkZWxsYSBuYXR1cmE6IHBlciBxdWVzdG8gaWwgbW9kZWxsbyBxdWFudGlzdGljbyBkaX',
  'NlZ25hIG51dm9sZSBkaSBwcm9iYWJpbGl0w6AgaW52ZWNlIGRpIG9yYml0ZS4iXX0sImFuc3dlciI6eyJ0IjoiTGEgcmlzcG9zdGEiLCJkIjpb',
  'IjQyOiBsYSByaXNwb3N0YSBhbGxhIGRvbWFuZGEgZm9uZGFtZW50YWxlIHN1bGxhIHZpdGEsIGwndW5pdmVyc28gZSB0dXR0byBxdWFudG8sIH',
  'NlY29uZG8gbGEgwqtHdWlkYSBnYWxhdHRpY2EgcGVyIGF1dG9zdG9wcGlzdGnCuy4iLCJMJ2VsZW1lbnRvIDQyIMOoIGlsIG1vbGliZGVubywg',
  'ZSBpbiBlZmZldHRpIGMnZW50cmEgY29uIGxhIHZpdGE6IMOoIG5lbCBjdW9yZSBkZWxsYSBuaXRyb2dlbmFzaSwgbCdlbnppbWEgY29uIGN1aS',
  'Btb2x0aSBiYXR0ZXJpIHRyYXNmb3JtYW5vIGwnYXpvdG8gZGVsbCdhcmlhIGluIGNvbXBvc3RpIGNoZSBsZSBwaWFudGUgcG9zc29ubyB1c2Fy',
  'ZS4iXX0sImtlZXBlciI6eyJ0IjoiSWwgY3VzdG9kZSBkZWkgc2VncmV0aSIsImQiOlsiSW4gcXVlc3QnYXBwIHNvbm8gbmFzY29zdGkge059IH',
  'NlZ3JldGkuIE5lIGhhaSB0cm92YXRpIHtrfS4iXSwiaGludCI6IlVuIGluZGl6aW86IHtofSJ9LCJoaW50cyI6eyJ1dWUiOiJjaGkgYnVzc2Eg',
  'c2V0dGUgdm9sdGUgc3VsIGxvZ28gdHJvdmEgdW5hIHBvcnRhIGNoZSBub24gYyfDqC4iLCJrb25hbWkiOiJzdSwgc3UsIGdpw7ksIGdpw7ksIH',
  'NpbmlzdHJhLCBkZXN0cmEsIHNpbmlzdHJhLCBkZXN0cmHigKYgZSBwb2k/IiwibWVuZGVsZWV2IjoiY2VyY2EgbCd1b21vIGNoZSBsYXNjacOy',
  'IGxlIGNhc2VsbGUgdnVvdGUuIiwic3BlbGwiOiJuZWxsYSByaWNlcmNhLCBjaGkgdGllbmUgcHJlbXV0byBNYWl1c2MgbWVudHJlIHByZW1lIE',
  'ludmlvIHNjcml2ZSBjb24gZ2xpIGVsZW1lbnRpLiIsIm1vbGUiOiJ0b3JuYSBpbCAyMyBvdHRvYnJlLCBkb3BvIGxlIDY6MDIuIiwiYmlydGhk',
  'YXkiOiJsJzggZmViYnJhaW8gZSBpbCAxwrAgbWFyem8gc29ubyBnaW9ybmkgZGkgZmVzdGEuIiwiY2FmZmVpbmUiOiJuZWwgbGFib3JhdG9yaW',
  '8sIHByZXBhcmEgbGEgbW9sZWNvbGEgY2hlIHNpIGJldmUgYWwgYmFyLiIsImFsY2hlbXkiOiJuZWxsYSBzYW5kYm94LCBjZXJjYSBuZWxsYSBs',
  'aWJyZXJpYSBxdWVsbG8gY2hlIGNlcmNhdmFubyBnbGkgYWxjaGltaXN0aS4iLCJoZWlzZW5iZXJnIjoibmVsIG1vZGVsbG8gM0QsIHByb3ZhIG',
  'FkIGFjY2hpYXBwYXJlIHVuIGVsZXR0cm9uZS4gVGFudGUgdm9sdGUuIiwiYW5zd2VyIjoicXVhbCDDqCBsYSByaXNwb3N0YT8gQ2hpZWRpbGEg',
  'YWxsYSByaWNlcmNhLiJ9fSwiZW4iOnsiZm9vdCI6IlNlY3JldCBmb3VuZCDCtyB7a30gb2Yge059IiwiYWdhaW4iOiJBbHJlYWR5IGRpc2Nvdm',
  'VyZWQgwrcge2t9IG9mIHtOfSIsImFsbCI6IllvdSBmb3VuZCB0aGVtIGFsbDogY29uZ3JhdHVsYXRpb25zLCB5b3UgaGF2ZSBhIHRydWx5IGN1',
  'cmlvdXMgbWluZCEiLCJ1dWUiOnsidCI6IkVsZW1lbnQgMTE5OiB1bnVuZW5uaXVtIiwiZCI6WyJZb3Uga25vY2tlZCBzZXZlbiB0aW1lcyBhbm',
  'QgdGhlIGVpZ2h0aCByb3cgb3BlbmVkLiBVbnVuZW5uaXVtIChVdWUsIFogPSAxMTkpIGlzIHRoZSBsaWdodGVzdCBlbGVtZW50IG5vYm9keSBo',
  'YXMgbWFuYWdlZCB0byBtYWtlIHlldDogaXQgd291bGQgYmUgYW4gYWxrYWxpIG1ldGFsLCBiZWxvdyBmcmFuY2l1bSwgYW5kIHdvdWxkIHN0YX',
  'J0IHRoZSBlaWdodGggcGVyaW9kIG9mIHRoZSB0YWJsZS4iLCJTZXZlcmFsIGxhYm9yYXRvcmllcyBhcm91bmQgdGhlIHdvcmxkIGFyZSB0cnlp',
  'bmcgdG8gY3JlYXRlIGl0IGJ5IHNtYXNoaW5nIGhlYXZ5IG51Y2xlaSB0b2dldGhlciwgZm9yIGV4YW1wbGUgdmFuYWRpdW0tNTEgYWdhaW5zdC',
  'BjdXJpdW0tMjQ4OiBpdCB0YWtlcyBtb250aHMgb2YgYmVhbSB0aW1lIHRvIGhvcGUgZm9yIGEgc2luZ2xlIGF0b20sIHdoaWNoIHdvdWxkIGxp',
  'dmUgZm9yIGEgZnJhY3Rpb24gb2YgYSBzZWNvbmQuIiwiSXRzIHRlbXBvcmFyeSBuYW1lIHNpbXBseSBtZWFucyDigJxvbmUtb25lLW5pbmXigJ',
  '0gaW4gTGF0aW46IHRoZSByZWFsIG9uZSB3aWxsIGJlIGNob3NlbiBieSB3aG9ldmVyIGRpc2NvdmVycyBpdC4iXX0sImtvbmFtaSI6eyJ0Ijoi',
  'UGVyaW9kaWMgd2F2ZSIsImQiOlsi4oaRIOKGkSDihpMg4oaTIOKGkCDihpIg4oaQIOKGkiBCIEE6IHRoZSBtb3N0IGZhbW91cyBzZWNyZXQgY2',
  '9kZSBpbiB2aWRlbyBnYW1lcy4gVGhlIHRhYmxlIGFuc3dlcmVkIHdpdGggYSB3YXZlIHRoYXQgcnVucyB0aHJvdWdoIGl0IGluIG9yZGVyIG9m',
  'IGF0b21pYyBudW1iZXIuIiwiRm9sbG93IHRoZSByaHl0aG06IHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBlbGVtZW50cyByZXBlYXQgYWZ0ZXIgMi',
  'wgOCwgOCwgMTgsIDE4LCAzMiBhbmQgMzIgZWxlbWVudHMuIFRoaXMgdmVyeSByZXBldGl0aW9uLCBwZXJpb2RpY2l0eSwgaXMgd2hhdCBnaXZl',
  'cyB0aGUgdGFibGUgaXRzIG5hbWUuIl19LCJtZW5kZWxlZXYiOnsidCI6Ik1lbmRlbGVlduKAmXMgcHJlZGljdGlvbnMiLCJkIjpbIkluIDE4Nz',
  'EgRG1pdHJpIE1lbmRlbGVldiBsZWZ0IHNvbWUgZW1wdHkgYm94ZXMgaW4gaGlzIHRhYmxlIGFuZCBkZXNjcmliZWQgdGhlIGVsZW1lbnRzIHRo',
  'YXQgd291bGQgZmlsbCB0aGVtOiBla2EtYm9yb24sIGVrYS1hbHVtaW5pdW0sIGVrYS1zaWxpY29uLCBla2EtbWFuZ2FuZXNlLiBOb3cgdGhleS',
  'BhcmUgbGl0IHVwOiBzY2FuZGl1bSwgZ2FsbGl1bSwgZ2VybWFuaXVtIGFuZCB0ZWNobmV0aXVtLiIsIkZvciBla2EtYWx1bWluaXVtIGhlIHBy',
  'ZWRpY3RlZCBhbiBhdG9taWMgbWFzcyBvZiBhYm91dCA2OCBhbmQgYSBkZW5zaXR5IG9mIDUuOSBnL2NtwrMuIEdhbGxpdW0sIGRpc2NvdmVyZW',
  'QgaW4gMTg3NSwgaGFzIDY5LjcgYW5kIDUuOS4gSXRzIGRpc2NvdmVyZXIgZmlyc3QgbWVhc3VyZWQgNC43OiBNZW5kZWxlZXYgd3JvdGUgdG8g',
  'dGVsbCBoaW0gaGUgbXVzdCBoYXZlIG1hZGUgYSBtaXN0YWtlLCBhbmQgaGUgd2FzIHJpZ2h0LiIsIlRlY2huZXRpdW0gaGFkIHRvIHdhaXQgdW',
  '50aWwgMTkzNzogaXQgd2FzIHRoZSBmaXJzdCBhcnRpZmljaWFsbHkgbWFkZSBlbGVtZW50LCBhbmQgaXRzIG5hbWUgY29tZXMgZnJvbSB0aGUg',
  'R3JlZWsgZm9yIOKAnGFydGlmaWNpYWzigJ0uIl19LCJzcGVsbCI6eyJ0IjoiU3BlbGxlZCB3aXRoIGVsZW1lbnRzIiwiZCI6WyLigJx7d29yZH',
  '3igJ0gY2FuIGJlIHdyaXR0ZW4gd2l0aCB0aGUgc3ltYm9scyBvZiB0aGUgdGFibGU6IHtzeW1ib2xzfS4iLCJJdCBpcyBhbiBvbGQgY2hlbWlz',
  'dHPigJkgZ2FtZTogdHJ5IHlvdXIgb3duIG5hbWUgKFNoaWZ0ICsgRW50ZXIgaW4gdGhlIHNlYXJjaCBib3gpLiJdLCJubyI6WyLigJx7d29yZH',
  '3igJ0gY2Fubm90IGJlIHdyaXR0ZW4gd2l0aCBlbGVtZW50IHN5bWJvbHMuIiwiTm90IGV2ZXJ5IGxldHRlciBleGlzdHMgb24gaXRzIG93bjog',
  'QSwgRCwgRSwgRywgTCwgTSwgUiwgVCwgWCBhbmQgWiBhcmUgb25seSBwYXJ0cyBvZiBsb25nZXIgc3ltYm9scywgYW5kIEogYW5kIFEgYXBwZW',
  'FyIGluIG5vIHN5bWJvbCBhdCBhbGwuIFRyeSBhbm90aGVyIHdvcmQgKFNoaWZ0ICsgRW50ZXIgaW4gdGhlIHNlYXJjaCBib3gpLiJdfSwibW9s',
  'ZSI6eyJ0IjoiSGFwcHkgTW9sZSBEYXkhIiwiZCI6WyJUb2RheSBpcyAyMyBPY3RvYmVyIGFuZCBpdCBpcyBwYXN0IDY6MDI6IGluIHRoZSBBbW',
  'VyaWNhbiBzdHlsZSB0aGF0IGlzIDEwLzIzLCBsaWtlIDYuMDIgw5cgMTDCssKzLCBBdm9nYWRyb+KAmXMgbnVtYmVyLiBDaGVtaXN0cyBhbGwg',
  'b3ZlciB0aGUgd29ybGQgY2VsZWJyYXRlIHRoZSBtb2xlIGZyb20gNjowMiBhLm0uIHRvIDY6MDIgcC5tLiIsIkEgbW9sZSBvZiBncmFpbnMgb2',
  'Ygc2FuZCB3b3VsZCBjb3ZlciB0aGUgd2hvbGUgb2YgR3JlYXQgQnJpdGFpbiBpbiBhIGxheWVyIGEgZmV3IGtpbG9tZXRyZXMgdGhpY2s7IGEg',
  'bW9sZSBvZiB3YXRlciBtb2xlY3VsZXMgZml0cyBpbiBhIGxpdHRsZSBtb3JlIHRoYW4gYSB0YWJsZXNwb29uLiJdfSwiYmlydGhkYXkiOnsidC',
  'I6IkhhcHB5IGJpcnRoZGF5ISIsImZlYiI6WyJPbiA4IEZlYnJ1YXJ5IDE4MzQgRG1pdHJpIEl2YW5vdmljaCBNZW5kZWxlZXYsIHRoZSBjaGVt',
  'aXN0IHdobyBwdXQgdGhlIGVsZW1lbnRzIGluIG9yZGVyIGluIHRoaXMgdGFibGUsIHdhcyBib3JuIGluIFRvYm9sc2ssIFNpYmVyaWEuIFRvZG',
  'F5IGhlIHdvdWxkIGJlIHtufS4iLCJIZSB3YXMgdGhlIHlvdW5nZXN0IG9mIGEgZ3JlYXQgbWFueSBzaWJsaW5ncyBhbmQsIHRoZSBzdG9yeSBn',
  'b2VzLCB0aGUgcmlnaHQgYXJyYW5nZW1lbnQgb2YgdGhlIGVsZW1lbnRzIGNhbWUgdG8gaGltIGluIGEgZHJlYW0gYWZ0ZXIgZGF5cyBzcGVudC',
  'BzaHVmZmxpbmcgY2FyZHMgYXJvdW5kLiJdLCJtYXIiOlsiT24gMSBNYXJjaCAxODY5ICgxNyBGZWJydWFyeSBpbiB0aGUgUnVzc2lhbiBjYWxl',
  'bmRhciBvZiB0aGUgdGltZSkgTWVuZGVsZWV2IGNvbXBsZXRlZCB0aGUgZmlyc3QgdmVyc2lvbiBvZiB0aGUgcGVyaW9kaWMgdGFibGUgYW5kIH',
  'NlbnQgaXQgdG8gaGlzIGNvbGxlYWd1ZXMuIFRvZGF5IHRoZSB0YWJsZSB0dXJucyB7bn0uIiwiQmFjayB0aGVuIDYzIGVsZW1lbnRzIHdlcmUg',
  'a25vd247IHRvZGF5IDExOCBib3hlcyBhcmUgZmlsbGVkLiJdfSwiY2FmZmVpbmUiOnsidCI6IkNvZmZlZSBicmVhayIsImQiOlsiWW91IGJ1aW',
  'x0IGNhZmZlaW5lLCBD4oKISOKCgeKCgE7igoRP4oKCOiB0aGUgbW9sZWN1bGUgdGhhdCBrZWVwcyBzdHVkZW50cyBhbmQgY2hlbWlzdHMgYWxs',
  'IG92ZXIgdGhlIHdvcmxkIGF3YWtlLiBJdCB3b3JrcyBieSBvY2N1cHlpbmcgdGhlIGJyYWlu4oCZcyBhZGVub3NpbmUgcmVjZXB0b3JzLCBhZG',
  'Vub3NpbmUgYmVpbmcgdGhlIG1vbGVjdWxlIHRoYXQgc2lnbmFscyB0aXJlZG5lc3MuIiwiQSBjdXAgb2YgZXNwcmVzc28gY29udGFpbnMgYWJv',
  'dXQgNjDigJMxMDAgbWcgb2YgaXQuIFBsYW50cyBtYWtlIGl0IGFzIGEgbmF0dXJhbCBpbnNlY3RpY2lkZS4iXX0sImFsY2hlbXkiOnsidCI6Il',
  'RoZSBwaGlsb3NvcGhlcuKAmXMgc3RvbmUiLCJkIjpbIntufSBncmFpbnMgb2YgbGVhZCBoYXZlIHR1cm5lZCBpbnRvIGdvbGQuIEFsY2hlbWlz',
  'dHMgc2VhcmNoZWQgZm9yIGl0IGZvciBjZW50dXJpZXM7IHlvdSBmb3VuZCBpdCBpbiB0aGUgc2VhcmNoIGJveC4iLCJJbiByZWFsaXR5IGl0IG',
  'lzIHBvc3NpYmxlLCBidXQgb25seSBieSByZW1vdmluZyB0aHJlZSBwcm90b25zIGZyb20gZXZlcnkgbnVjbGV1czogaW4gMTk4MCBHbGVubiBT',
  'ZWFib3JnIG1hZGUgYSBmZXcgdGhvdXNhbmQgYXRvbXMgb2YgZ29sZCBmcm9tIGJpc211dGggd2l0aCBhbiBhY2NlbGVyYXRvciwgYW5kIGluID',
  'IwMjUgdGhlIEFMSUNFIGV4cGVyaW1lbnQgYXQgQ0VSTiBtZWFzdXJlZCB0aGUgZ29sZCB0aGF0IGZvcm1zIGZvciBhbiBpbnN0YW50IHdoZW4g',
  'dHdvIGxlYWQgbnVjbGVpIGJydXNoIHBhc3QgZWFjaCBvdGhlci4gSXQgY29zdHMgZW5vcm1vdXNseSBtb3JlIHRoYW4gdGhlIGdvbGQgaXRzZW',
  'xmLiJdLCJub25lIjpbIlRoZSB3b3JkcyBhcmUgcmlnaHQsIGJ1dCB0aGVyZSBpcyBubyBsZWFkIGluIHRoZSBzYW5kYm94IHRvIHRyYW5zZm9y',
  'bS4iLCJEcmF3IHNvbWUgKFBiKSBhbmQgc2F5IHRoZSBmb3JtdWxhIGFnYWluLiJdfSwiaGVpc2VuYmVyZyI6eyJ0IjoiVW5jZXJ0YWludHkgcH',
  'JpbmNpcGxlIiwiZCI6WyJUcnlpbmcgdG8gY2F0Y2ggdGhlIGVsZWN0cm9uPyBXZXJuZXIgSGVpc2VuYmVyZyBleHBsYWluZWQgaW4gMTkyNyB0',
  'aGF0IGl0IGNhbm5vdCBiZSBkb25lIGNvbXBsZXRlbHk6IHRoZSBtb3JlIHByZWNpc2VseSB5b3Uga25vdyB3aGVyZSBhIHBhcnRpY2xlIGlzLC',
  'B0aGUgbGVzcyB5b3UgY2FuIGtub3cgaG93IGZhc3QgaXQgaXMgZ29pbmcsIGFuZCB2aWNlIHZlcnNhLiIsIkl0IGlzIG5vdCBhIGZsYXcgaW4g',
  'dGhlIGluc3RydW1lbnRzIGJ1dCBhIGxhdyBvZiBuYXR1cmU6IHRoYXQgaXMgd2h5IHRoZSBxdWFudHVtIG1vZGVsIGRyYXdzIGNsb3VkcyBvZi',
  'Bwcm9iYWJpbGl0eSBpbnN0ZWFkIG9mIG9yYml0cy4iXX0sImFuc3dlciI6eyJ0IjoiVGhlIGFuc3dlciIsImQiOlsiNDI6IHRoZSBhbnN3ZXIg',
  'dG8gdGhlIHVsdGltYXRlIHF1ZXN0aW9uIG9mIGxpZmUsIHRoZSB1bml2ZXJzZSBhbmQgZXZlcnl0aGluZywgYWNjb3JkaW5nIHRvIOKAnFRoZS',
  'BIaXRjaGhpa2Vy4oCZcyBHdWlkZSB0byB0aGUgR2FsYXh54oCdLiIsIkVsZW1lbnQgNDIgaXMgbW9seWJkZW51bSwgYW5kIGl0IHJlYWxseSBk',
  'b2VzIGhhdmUgdG8gZG8gd2l0aCBsaWZlOiBpdCBzaXRzIGF0IHRoZSBoZWFydCBvZiBuaXRyb2dlbmFzZSwgdGhlIGVuenltZSB3aXRoIHdoaW',
  'NoIG1hbnkgYmFjdGVyaWEgdHVybiBuaXRyb2dlbiBmcm9tIHRoZSBhaXIgaW50byBjb21wb3VuZHMgdGhhdCBwbGFudHMgY2FuIHVzZS4iXX0s',
  'ImtlZXBlciI6eyJ0IjoiVGhlIGtlZXBlciBvZiBzZWNyZXRzIiwiZCI6WyJUaGVyZSBhcmUge059IHNlY3JldHMgaGlkZGVuIGluIHRoaXMgYX',
  'BwLiBZb3UgaGF2ZSBmb3VuZCB7a30uIl0sImhpbnQiOiJBIGNsdWU6IHtofSJ9LCJoaW50cyI6eyJ1dWUiOiJrbm9jayBzZXZlbiB0aW1lcyBv',
  'biB0aGUgbG9nbyBhbmQgYSBkb29yIHRoYXQgZG9lcyBub3QgZXhpc3Qgd2lsbCBvcGVuLiIsImtvbmFtaSI6InVwLCB1cCwgZG93biwgZG93bi',
  'wgbGVmdCwgcmlnaHQsIGxlZnQsIHJpZ2h04oCmIGFuZCB0aGVuPyIsIm1lbmRlbGVldiI6InNlYXJjaCBmb3IgdGhlIG1hbiB3aG8gbGVmdCB0',
  'aGUgZW1wdHkgYm94ZXMuIiwic3BlbGwiOiJpbiB0aGUgc2VhcmNoIGJveCwgaG9sZCBTaGlmdCB3aGlsZSBwcmVzc2luZyBFbnRlciB0byB3cm',
  'l0ZSB3aXRoIGVsZW1lbnRzLiIsIm1vbGUiOiJjb21lIGJhY2sgb24gMjMgT2N0b2JlciwgYWZ0ZXIgNjowMi4iLCJiaXJ0aGRheSI6IjggRmVi',
  'cnVhcnkgYW5kIDEgTWFyY2ggYXJlIGRheXMgdG8gY2VsZWJyYXRlLiIsImNhZmZlaW5lIjoiaW4gdGhlIGxhYiwgbWFrZSB0aGUgbW9sZWN1bG',
  'UgcGVvcGxlIGRyaW5rIGF0IHRoZSBjYWbDqS4iLCJhbGNoZW15IjoiaW4gdGhlIHNhbmRib3gsIHNlYXJjaCB0aGUgbGlicmFyeSBmb3Igd2hh',
  'dCB0aGUgYWxjaGVtaXN0cyB3ZXJlIGxvb2tpbmcgZm9yLiIsImhlaXNlbmJlcmciOiJpbiB0aGUgM0QgbW9kZWwsIHRyeSB0byBjYXRjaCBhbi',
  'BlbGVjdHJvbi4gTWFueSB0aW1lcy4iLCJhbnN3ZXIiOiJ3aGF0IGlzIHRoZSBhbnN3ZXI/IEFzayB0aGUgc2VhcmNoIGJveC4ifX19',
].join('');

let texts = null;
function T() {
  if (!texts) {
    const bytes = Uint8Array.from(atob(DATA), (c) => c.charCodeAt(0));
    texts = JSON.parse(new TextDecoder().decode(bytes));
  }
  return texts;
}
const L = () => T()[getLang() === 'en' ? 'en' : 'it'];
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => (v[k] ?? m));

const SIG = {
  m: new Set([773133140, 2743789629, 1901496013, 626043772, 504691236, 1226390107, 2323847349, 2171279677]),
  k: new Set([3476472790, 3510028028, 416018962, 1779338931, 1719429393, 3084510534, 2122001984, 2189112460, 1831366366]),
  a: 2279835011,
  c: 1188328550,
};
const WAVE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
const PREDICTED = [21, 31, 32, 43];

function loadFound() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORE) || '[]'));
  } catch {
    return new Set();
  }
}
function saveFound(set) {
  try {
    localStorage.setItem(STORE, JSON.stringify([...set]));
  } catch {
    /* archiviazione non disponibile: i segreti valgono solo per questa sessione */
  }
}

/** Scrive una parola con i simboli degli elementi (se si può): «carbon» → Ca·Rb·O·N. */
function spell(word, symbols) {
  const s = clean(word).replace(/[^a-z]/g, '');
  if (!s) return null;
  const best = new Array(s.length + 1).fill(null);
  best[0] = [];
  for (let i = 0; i < s.length; i++) {
    if (!best[i]) continue;
    for (const n of [2, 1]) {
      const sym = symbols.get(s.slice(i, i + n));
      if (sym && i + n <= s.length && !best[i + n]) best[i + n] = [...best[i], sym];
    }
  }
  return best[s.length];
}

export function initSparks({ elements, store, table, explain }) {
  const found = loadFound();
  const ids = () => T().ids;
  const symbols = new Map(elements.map((el) => [el.symbol.toLowerCase(), el]));
  const overlayOpen = () => document.querySelector('dialog[open], .sbx:not([hidden]), .lab:not([hidden]), .atom-view:not([hidden])');

  function reveal(id, { vars = {}, variant = 'd', point } = {}) {
    const txt = L();
    const s = txt[id];
    const fresh = !found.has(id);
    found.add(id);
    saveFound(found);
    const k = found.size;
    const N = ids().length;
    const foot = `${fill(fresh ? txt.foot : txt.again, { k, N })}${k >= N ? ` ${txt.all}` : ''}`;
    explain.showCard({ kind: 'secret', title: s.t, body: (s[variant] ?? s.d).map((p) => fill(p, { ...vars, k, N })), foot }, point);
  }

  function glow(zs, ms = 9000) {
    const cells = zs.map((z) => document.querySelector(`.ptable .cell[data-z="${z}"]`)).filter(Boolean);
    cells.forEach((c, i) => {
      c.style.setProperty('--sd', `${i * 160}ms`);
      c.classList.add('spark-glow');
    });
    setTimeout(() => cells.forEach((c) => c.classList.remove('spark-glow')), ms);
  }

  // ---- sette colpi sul logo: l'elemento che non c'è ancora
  let knocks = [];
  document.addEventListener('click', (ev) => {
    if (!(ev.target instanceof Element) || !ev.target.closest('.brand__logo')) return;
    const now = performance.now();
    knocks = [...knocks.filter((t) => now - t < 3500), now];
    if (knocks.length < 7) return;
    knocks = [];
    const fr = document.querySelector('.ptable .cell[data-z="87"]');
    if (fr && !document.querySelector('.spark-ghost')) {
      const r = fr.getBoundingClientRect();
      const ghost = document.createElement('div');
      ghost.className = 'spark-ghost';
      ghost.style.cssText = `left:${r.left}px;top:${r.bottom + 8}px;width:${r.width}px;height:${r.height}px`;
      ghost.innerHTML = '<i>119</i><b>Uue</b><span>Ununennio</span><small>[?]</small>';
      if (getLang() === 'en') ghost.querySelector('span').textContent = 'Ununennium';
      document.body.append(ghost);
      setTimeout(() => ghost.classList.add('is-leaving'), 14000);
      setTimeout(() => ghost.remove(), 15000);
    }
    reveal('uue', { point: fr ? { x: fr.getBoundingClientRect().right + 40, y: fr.getBoundingClientRect().top } : undefined });
  });

  // ---- il codice più famoso dei videogiochi
  let seq = 0;
  window.addEventListener('keydown', (ev) => {
    if (ev.target instanceof HTMLElement && ev.target.matches('input, textarea, select')) return;
    const key = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
    seq = key === WAVE[seq] ? seq + 1 : key === WAVE[0] ? 1 : 0;
    if (seq < WAVE.length) return;
    seq = 0;
    if (overlayOpen()) return;
    document.querySelectorAll('.ptable .cell[data-z]').forEach((c) => {
      c.style.setProperty('--sd', `${Number(c.dataset.z) * 18}ms`);
      c.classList.remove('spark-wave');
      void c.offsetWidth;
      c.classList.add('spark-wave');
    });
    setTimeout(() => document.querySelectorAll('.spark-wave').forEach((c) => c.classList.remove('spark-wave')), 118 * 18 + 1200);
    reveal('konami');
  });

  // ---- il laboratorio: una molecola molto amata
  window.addEventListener('tp3d:molecule', (ev) => {
    if (sig(ev.detail?.id) === SIG.c) setTimeout(() => reveal('caffeine'), 900);
  });
  // ---- la sandbox: piombo in oro (il resto avviene nella sandbox)
  window.addEventListener('tp3d:secret', (ev) => {
    if (ev.detail?.id !== 'alchemy') return;
    const n = ev.detail.n ?? 0;
    reveal('alchemy', { vars: { n: n.toLocaleString(getLang() === 'en' ? 'en-GB' : 'it-IT') }, variant: n ? 'd' : 'none' });
  });
  // ---- il modello 3D: l'elettrone inafferrabile
  let catches = [];
  window.addEventListener('tp3d:particle', (ev) => {
    if (ev.detail?.kind !== 'electron') return;
    const now = performance.now();
    catches = [...catches.filter((t) => now - t < 10000), now];
    if (catches.length >= 7) {
      catches = [];
      reveal('heisenberg');
    }
  });

  // ---- la modalità Spiega conosce chi custodisce i segreti
  explain.addResolver((_n, raw) => {
    if (!SIG.k.has(sig(raw))) return null;
    if (!found.has('keeper')) {
      found.add('keeper');
      saveFound(found);
    }
    const txt = L();
    const missing = ids().filter((id) => !found.has(id) && txt.hints[id]);
    const body = [fill(txt.keeper.d[0], { k: found.size, N: ids().length })];
    if (missing.length) body.push(fill(txt.keeper.hint, { h: txt.hints[missing[Math.floor(Math.random() * missing.length)]] }));
    else body.push(txt.all);
    return { kind: 'secret', title: txt.keeper.t, body };
  });

  // ---- date speciali
  setTimeout(() => {
    const d = new Date();
    const day = `${d.getMonth() + 1}/${d.getDate()}`;
    const minutes = d.getHours() * 60 + d.getMinutes();
    let shown = '';
    try {
      shown = sessionStorage.getItem('tp3d.day') ?? '';
      sessionStorage.setItem('tp3d.day', day);
    } catch {
      /* niente */
    }
    if (shown === day || overlayOpen()) return;
    if (day === '10/23' && minutes >= 6 * 60 + 2 && minutes <= 18 * 60 + 2) reveal('mole');
    else if (day === '2/8') reveal('birthday', { variant: 'feb', vars: { n: d.getFullYear() - 1834 } });
    else if (day === '3/1') reveal('birthday', { variant: 'mar', vars: { n: d.getFullYear() - 1869 } });
  }, 2500);

  return {
    /** Invio nella ricerca della tavola: true se il testo era una parola speciale (e la ricerca non deve aprire nulla). */
    onSearchCommit(text, ev) {
      const s = sig(text);
      if (ev?.shiftKey && clean(text)) {
        const word = text.trim();
        const parts = spell(word, symbols);
        store.set({ query: '' });
        if (parts) {
          glow(parts.map((el) => el.z), 7000);
          reveal('spell', { vars: { word, symbols: parts.map((el) => el.symbol).join(' · ') }, point: { x: 40, y: innerHeight - 330 } });
        } else reveal('spell', { vars: { word }, variant: 'no' });
        return true;
      }
      if (SIG.m.has(s)) {
        store.set({ query: '' });
        glow(PREDICTED, 12000);
        reveal('mendeleev', { point: { x: innerWidth - 430, y: innerHeight * 0.5 } });
        return true;
      }
      if (s === SIG.a) setTimeout(() => reveal('answer', { point: { x: 120, y: innerHeight / 2 } }), 700);
      return false;
    },
  };
}
