const { WebSocketServer } = require('ws');
const { getServiceStatus,
        shutdownServices } = require('./services');
const { getDeployments,
        getLatest,
        deployCommit,
        upgradeToCommit } = require('./ostree');
const { rebootMachine,
	shutdownMachine } = require('./machine');

const commands = {
  getServiceStatus,
  getDeployments,
  getLatest,
  deployCommit,
  upgradeToCommit,
  shutdownServices,
  rebootMachine,
  shutdownMachine
};

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {
  ws.on('message', async function incoming(data) {
    let msg;
    try {
      msg = JSON.parse(data);
      if(Array.isArray(msg)) {
        if(msg.length <= 0 || !commands[msg[0]]) {
          throw "Unknown command.";
        }
      } else {
        throw "Command must be an array.";
      }
    } catch(e) {
      ws.send(JSON.stringify({ error: "" + e }));
      return;
    }
    try {
      const data = await commands[msg[0]].apply(null, msg.slice(1));
      ws.send(JSON.stringify({ [msg[0]]: data }));
    } catch(e) {
      ws.send(JSON.stringify({ [msg[0]]: { error: "" + (e.stderr || e) }}));
    }
  });
});
