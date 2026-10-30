import { Inngest } from "inngest";
import { config } from "../config.js";

export const inngest = new Inngest({
  id: "meadow-movie-alerter",
  isDev: config.INNGEST_DEV,
});
