const util = require("util");
const { exec } = require("child_process");
const execPromise = util.promisify(exec);
const path = require("path");
const statusScript = path.join(__dirname, "scripts/status.sh");

const UNKNOWN = "unknown";
const ACTIVE = "active";
const INACTIVE = "inactive";


const UNKNOWN_SERVICE_STATUS = { 
  "pocketnc": UNKNOWN,
  "rockhopper": UNKNOWN
};

async function getStatus() {
  console.log(statusScript);
  const status = await execPromise(statusScript).then((data) => {
    const {
      stdout
    } = data;

    let s = UNKNOWN_SERVICE_STATUS;
    try {
      console.log(stdout);
     s = JSON.parse(stdout);
    } catch(e) {
      console.log("status.sh error: %s", e);
    }

    return s;
  }).catch((err) => {
    return UNKNOWN_SERVICE_STATUS;
  });

  return status;
}

module.exports = {
  getStatus,
  UNKNOWN_SERVICE_STATUS,
  UNKNOWN,
  ACTIVE,
  INACTIVE
};
