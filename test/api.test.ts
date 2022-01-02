import net from "net";
import { setupTest } from "./index.test";
import { Client } from "../src";

setupTest("NAT-UPNP/Client", (opts) => {
  let client: Client;

  opts.runBefore(() => {
    client = new Client();
  });

  opts.runAfter(() => {
    client.close();
  });

  opts.run("Port mapping/unmapping", async () => {
    // Random port between 2000 and 65536 to avoid blockages
    const publicPort = ~~(Math.random() * 63536 + 2000);
    await client.createMapping({
      public: publicPort,
      private: ~~(Math.random() * 65536),
      ttl: 0,
    });
    await client.removeMapping({ public: publicPort });
    return true;
  });

  opts.run("Find port after mapping", async () => {
    // Random port between 2000 and 65536 to avoid blockages
    const publicPort = ~~(Math.random() * 63536 + 2000);
    await client.createMapping({
      public: publicPort,
      private: ~~(Math.random() * 65536),
      description: "node:nat:upnp:search-test",
      ttl: 20,
    });

    const mappings = await client.getMappings({
      local: true,
      description: /search-test/,
    });

    if (!mappings.some((mapping) => mapping.public.port === publicPort)) {
      return false;
    }

    await client.removeMapping({ public: { port: publicPort } });
    return true;
  });

  opts.run("Get public ip address", async () => {
    const ip = await client.getPublicIp();
    return net.isIP(ip) !== 0;
  });
});
