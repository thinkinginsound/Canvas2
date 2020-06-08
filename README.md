SocketCluster Canvas
======

Ten opzichte van de [vorige versie](https://github.com/thinkinginsound/THIS-canvas) is dit systeem opgedeeld in meerdere threads.

Documentatie is te vinden in de folder [docs](https://github.com/thinkinginsound/Canvas2/tree/master/docs/server)

## Threads
### Main thread
De main thread word gestart door ```node server.js``` te draaien. Deze thread zorgt er voor dat alle andere threads worden gestart. Deze thread aangemaakt door de socketcluster library en is **NIET** bedoeld om in te werken.
File van deze thread is `/server.js`

### Worker
In deze thread wordt de communicatie met de client (socket) gedaan. Dit gaat het zelfde als in het oude systeem.
File van deze thread is `/worker.js`

### Broker
Deze thread zorgt voor de communicatie tussen alle processen.
File van deze thread is `/broker.js`

### Timer Process
Timer process is de clock van het systeem. Ieder frame stuurt hij een event naar de broker met de nieuwe clock. Naast de clock beheert deze thread ook de NPCs.
File van deze thread is `/lib/timerProcess.js`

### AI Process
AI process analiseert ieder frame de userdata. Deze krijgt hij binnen via de database. Daarnaast regelt deze thread de groupswitch.
File van deze thread is `/lib/aiProcess.js`. Functies van deze thread staan in `/lib/ai/aiFunctions.js`
