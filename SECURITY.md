# Sicurezza

## Versioni supportate

Le correzioni di sicurezza escono solo per l'ultima versione. Oggi è la serie 0.9.x:

| Versione              | Supportata |
| --------------------- | ---------- |
| ultima 0.9.x          | sì         |
| precedenti alla 0.9.x | no         |

Con l'uscita della 1.0.0 questa tabella sarà aggiornata.

## Come segnalare una vulnerabilità

**Non aprire una issue pubblica.** Scrivi in privato dalle GitHub Security Advisories:

1. vai su <https://github.com/G43r0/tavola-periodica-3d/security/advisories/new> (scheda **Security** del repository,
   poi **Report a vulnerability**);
2. descrivi il problema: la versione dell'app, il sistema operativo, i passi per riprodurlo e che cosa si ottiene (per
   esempio, che cosa riesce a fare una pagina o un file malevolo);
3. se puoi, aggiungi come pensi che si possa correggere.

Il progetto è mantenuto da una persona sola: la risposta può richiedere qualche giorno. Se la segnalazione è fondata,
la correzione esce in una nuova versione.

## Che cosa conta

Interessano soprattutto l'app desktop (finestra Electron, permessi, aggiornamenti automatici, apertura di file e
collegamenti) e i file che l'app apre (le scene della sandbox, i salvataggi).

Un dato scientifico sbagliato o un errore di funzionamento non sono vulnerabilità: per quelli usa i moduli delle issue
(vedi [CONTRIBUTING.md](CONTRIBUTING.md)).
