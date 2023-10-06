const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

const OS = 'kinetic';

async function getBranch() {
  const { stdout: deviceRaw } = await execPromise("${POCKETNC_DIRECTORY}/Settings/device.py");
  const device = deviceRaw.trim().toLowerCase();

  if(device === "bbg") {
    // we've seen certain Beaglebone Blacks in the field report being Beaglebone Greens
    // so treat them as a beaglebone black. see SOFT-877
    return "kinetic-control/bbb/prod";
  }

  return `kinetic-control/${device}/prod`;
}

async function getDeployments() {
  const { stdout: adminStatus } = await execPromise("ostree admin status");

  // trim last newline, split on newlines, strip whitespace from each line
  const lines = adminStatus.trim().split('\n').map((str) => str.trim());

  const deployments = [];

  for(let i = 0; i < lines.length; i++) {
    if(lines[i].startsWith(OS) || lines[i].startsWith("* " + OS)) {
      const active = lines[i].startsWith("*");
      const pending = lines[i].indexOf("pending") >= 0;
      const deployment = { active, pending };

      deployment.commit = lines[i].split(" ")[active ? 2 : 1].split(".")[0];

      if(lines[i+1].startsWith('Version')) {
        deployment.version = lines[i+1].split(" ")[1];
        i += 1;
      }

      deployments.push(deployment);
    }
  }

  return { deployments };
}

async function getLatest() {
  const { stdout: remoteSummary } = await execPromise("ostree remote summary " + OS);

  const lines = remoteSummary.trim().split('\n').map((str) => str.trim());

  const summary = {};

  for(let i = 0; i < lines.length; i++) {
    if(lines[i].startsWith('*')) {
      const branch = lines[i].split(" ")[1];
      const commit = lines[i+2];
      summary[branch] = { commit };
      i += 2;
    }
  }

  const branch = await getBranch(); 
  const latest = {
    commit: summary[branch].commit
  };

  const { stdout: pullMetadata } = await execPromise("sudo ostree pull " + OS + " --commit-metadata-only " + latest.commit);

  const { stdout: showData } = await execPromise("ostree show " + latest.commit);

  const showLines = showData.trim().split('\n').map((str) => str.trim());
  latest.version = showLines.find((line) => line.startsWith("Version")).split(" ")[1];

  return { latest };
}

async function pullCommit(commitId) {
  if(commitId.length != 64) {
    throw "commitId must be a 64 character string.";
  }
  const hexValues = new RegExp('^[0-9a-f]*$');
  if(!hexValues.test(commitId)) {
    throw "commitId must only contain lower case hex characters.";
  }

  await execPromise("sudo ostree pull " + OS + " " + commitId);

  return { pulled: commitId };
}

async function deployCommit(commitId) {
  if(commitId.length != 64) {
    throw "commitId must be a 64 character string.";
  }
  const hexValues = new RegExp('^[0-9a-f]*$');
  if(!hexValues.test(commitId)) {
    throw "commitId must only contain lower case hex characters.";
  }

  await execPromise("sudo ostree admin deploy --os=" + OS + " " + commitId);

  return { deployed: commitId };
}

async function upgradeToCommit(commitId) {
  await pullCommit(commitId);
  await deployCommit(commitId);

  return { upgraded: commitId };
}

module.exports = {
  getDeployments,
  getLatest,
  pullCommit,
  deployCommit,
  upgradeToCommit
};
