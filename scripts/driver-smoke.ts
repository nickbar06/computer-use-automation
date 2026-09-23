import { actionFromLlm } from "../src/agent/actionFromLlm.ts";
import { listenMock } from "../src/proxy/server.ts";
import { loadPolicy, SafetyError } from "../src/safety/policy.ts";
import { PlaywrightDriver } from "../src/surface/playwright/driver.ts";

const mock = await listenMock(0);
const policy = loadPolicy();
const driver = new PlaywrightDriver({
  headless: true,
  policy: { ...policy, allowed_origins: [...policy.allowed_origins, mock.origin] },
});

await driver.start();
try {
  await driver.act({ type: "navigate", location: `${mock.origin}/` });

  const t0 = performance.now();
  const obs = await driver.observe();
  const observeMs = performance.now() - t0;
  const workspace = obs.regions?.find((region) => region.name === "workspace");
  console.log(`observe_ms=${observeMs.toFixed(1)}`);
  console.log(`location=${obs.location}`);
  console.log(`workspace=${workspace?.location ?? "(missing)"}`);
  console.log(`member_id_visible=${obs.visible_text.includes("Member ID")}`);

  await driver.act(
    actionFromLlm({
      action: "fill",
      role: "textbox",
      name: "Member ID",
      text: "12345",
    }),
  );
  await driver.act(
    actionFromLlm({
      action: "click",
      role: "button",
      name: "Find Member",
    }),
  );
  console.log(`after_find=${driver.currentLocation()}`);

  const savings = await driver.extract({
    name: "Savings balance",
    description: "Savings / Balance",
    strategies: [{ kind: "table_cell", row_header: "Savings", column_header: "Balance" }],
  });
  console.log(`savings=${savings}`);

  const beforeEvil = driver.currentLocation();
  let evil: string;
  try {
    await driver.act({ type: "navigate", location: "https://evil.example/" });
    evil = "no-throw";
  } catch (err) {
    evil = err instanceof SafetyError ? `SafetyError ${err.message}` : String(err);
  }
  console.log(`evil=${evil}`);
  console.log(`after_evil=${driver.currentLocation()}`);
  console.log(`stayed_off_evil=${!driver.currentLocation().includes("evil.example")}`);
  console.log(`before_evil=${beforeEvil}`);
} finally {
  await driver.close();
  await mock.close();
}
