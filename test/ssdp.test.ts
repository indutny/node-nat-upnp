import { Ssdp } from "../src";
import { setupTest } from "./index.test";

setupTest("NAT-UPNP/Ssdp", (opts) => {
  let client: Ssdp;

  opts.runBefore(() => {
    client = new Ssdp();
  });

  opts.runAfter(() => {
    client.close();
  });

  opts.run("Find router device", async () => {
    const p = client.search(
      "urn:schemas-upnp-org:device:InternetGatewayDevice:1"
    );

    return new Promise((s) => {
      p.on("device", (device) => {
        p.emit("end");
        s(typeof device.location === "string");
      });
    });
  });
});
