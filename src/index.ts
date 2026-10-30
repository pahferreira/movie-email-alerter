import Fastify from "fastify";
import { Inngest } from "inngest";
import inngestFastify from "inngest/fastify";

const inngest = new Inngest({ id: "movie-email-alerter", isDev: true });

const helloWorld = inngest.createFunction(
  { id: "hello-world", triggers: [{ event: "test/hello.world" }] },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.name ?? "world"}!` };
  },
);

const app = Fastify({ logger: true });

app.register(inngestFastify, { client: inngest, functions: [helloWorld] });

app.get("/hello", async (request) => {
  const { name } = request.query as { name?: string };
  const { ids } = await inngest.send({
    name: "test/hello.world",
    data: { name },
  });
  return { eventIds: ids };
});

await app.listen({ port: 3000 });
