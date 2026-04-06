import { app } from "./server.js";
import { startNightlyPlanner } from "./lib/nightly-planner.js";

const port = Number(process.env.PORT ?? 4000);

app.listen(port, () => {
  console.log(`SchoolBus API listening on port ${port}`);
});

const stopNightlyPlanner = startNightlyPlanner();

function gracefulShutdown() {
  stopNightlyPlanner();
  process.exit(0);
}

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
