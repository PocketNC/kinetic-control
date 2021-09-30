const util = require("util");
const { exec } = require("child_process");
const execPromise = util.promisify(exec);

async function rebootMachine() {
  await execPromise("sudo reboot");
}

async function shutdownMachine() {
  await execPromise("sudo shutdown -h now");
}

module.exports = {
  rebootMachine,
  shutdownMachine
};
