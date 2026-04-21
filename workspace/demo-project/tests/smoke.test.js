const assert = require("node:assert/strict");

function run() {
  const value = "agent-lab";
  assert.equal(value.includes("agent"), true);
  console.log("Smoke test passed.");
}

run();
