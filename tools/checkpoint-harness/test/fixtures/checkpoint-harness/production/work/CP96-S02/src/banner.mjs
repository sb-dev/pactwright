// CP96 Step 2: the banner of PROD §2, the greeting shouted.
import { shout } from "fixture-format";

import { greet } from "./greet.mjs";

export const banner = (name) => shout(greet(name));

if (process.argv[1] === new URL(import.meta.url).pathname) {
  try {
    console.log(banner(process.argv[2]));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
