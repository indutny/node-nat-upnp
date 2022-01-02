import { Device as impDevice } from "./nat-upnp/device";
import { Client as impClient } from "./nat-upnp/client";
import { Ssdp as impSsdp } from "./nat-upnp/ssdp";

namespace natupnp {
  export const Ssdp = impSsdp;
  export const Device = impDevice;
  export const Client = impClient;
}

export { Device } from "./nat-upnp/device";
export type { Service, RawService, RawDevice } from "./nat-upnp/device";

export { Ssdp } from "./nat-upnp/ssdp";
export type { SearchCallback, ISsdp, SsdpEmitter } from "./nat-upnp/ssdp";

export { Client } from "./nat-upnp/client";
export type {
  GetMappingOpts,
  Mapping,
  DeletePortMappingOpts,
  NewPortMappingOpts,
  StandardOpts,
} from "./nat-upnp/client";

export default natupnp;

/*
 * ===================
 * ====== Types ======
 * ===================
 */

/**
 * Raw SSDP/UPNP repsonse
 * Entire SSDP/UPNP schema is beyond the scope of these typings.
 * Please look up the protol documentation if you wanna do
 * lower level communication.
 */
export type RawResponse = Partial<
  Record<
    string,
    {
      "@": { "xmlns:u": string };
      [key: string]: unknown;
    }
  >
>;
