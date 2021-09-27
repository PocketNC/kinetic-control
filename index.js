const { WebSocketServer } = require('ws');
const { getStatus } = require('./status');

const wss = new WebSocketServer({ port: 8080 });

// Procedure for updating
// 1. Shutdown Pocket NC and Rockhopper services
// 2. ostree --repo=$REPO pull --depth=-1 --commit-metadata-only kinetic:kinetic-control/bbb/prod
// 3. ostree --repo=$REPO log kinetic-control/bbb/prod
// 4. Either iterate over commits or allow user to select a commit and issue ostree --repo=$REPO ls <commit>
//    to see if we have the full commit locally
// 5. User selects a remote commit to pull down.
// 6. ostree --repo=$REPO pull kinetic kinetic-control/bbb/prod
// 7. User selects a local commit to deploy
// 8. ostree --repo=$REPO admin deploy
// 9. reboot


// Potential commands
// fetchSummary - ostree remote summary
// pullCommit - ostree pull kinetic <commit id>

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(data) {
    try {
      const msg = JSON.parse(data);
      console.log(msg);
      if(msg === "status") {
        console.log("got status message");
        getStatus().then((status) => {
          console.log("got %s as status", JSON.stringify(status));
          ws.send(JSON.stringify(status));
        }).catch(() => {});
      }
    } catch(e) {
      console.log("caught error: %s", e);
    }
  });
});
