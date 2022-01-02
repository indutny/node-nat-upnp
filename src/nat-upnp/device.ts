import axios from "axios";
import { URL } from "url";
import { XMLParser } from "fast-xml-parser";

import { RawResponse } from "../index";

export class Device implements IDevice {
  readonly description: string;
  readonly services: string[];
  constructor(url: string) {
    this.description = url;
    this.services = [
      "urn:schemas-upnp-org:service:WANIPConnection:1",
      "urn:schemas-upnp-org:service:WANIPConnection:2",
      "urn:schemas-upnp-org:service:WANPPPConnection:1",
    ];
  }
  private async getXML(url: string) {
    return axios
      .get(url)
      .then(({ data }) => new XMLParser().parse(data))
      .catch(() => new Error("Failed to lookup device description"));
  }
  public async getService(types: string[]) {
    return this.getXML(this.description).then(({ root: xml }) => {
      const services = this.parseDescription(xml).services.filter(
        ({ serviceType }) => types.includes(serviceType)
      );

      if (
        services.length === 0 ||
        !services[0].controlURL ||
        !services[0].SCPDURL
      ) {
        throw new Error("Service not found");
      }

      const baseUrl = new URL(xml.baseURL, this.description);
      const prefix = (url: string) =>
        new URL(url, baseUrl.toString()).toString();

      return {
        service: services[0].serviceType,
        SCPDURL: prefix(services[0].SCPDURL),
        controlURL: prefix(services[0].controlURL),
      };
    });
  }
  public async run(
    action: string,
    args: (string | number)[][]
  ): Promise<RawResponse> {
    const info = await this.getService(this.services);

    const body =
      '<?xml version="1.0"?>' +
      "<s:Envelope " +
      'xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" ' +
      's:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">' +
      "<s:Body>" +
      "<u:" +
      action +
      " xmlns:u=" +
      JSON.stringify(info.service) +
      ">" +
      args.reduce(
        (p, [a, b]) => p + `<${a ?? ""}>${b ?? ""}</${a ?? ""}>`,
        ""
      ) +
      "</u:" +
      action +
      ">" +
      "</s:Body>" +
      "</s:Envelope>";

    return axios
      .post(info.controlURL, body, {
        headers: {
          "Content-Type": 'text/xml; charset="utf-8"',
          "Content-Length": "" + Buffer.byteLength(body),
          Connection: "close",
          SOAPAction: JSON.stringify(info.service + "#" + action),
        },
      })
      .then(
        ({ data }) =>
          new XMLParser({ removeNSPrefix: true }).parse(data).Envelope.Body
      );
  }
  public parseDescription(info: { device?: RawDevice }) {
    const services: RawService[] = [];
    const devices: RawDevice[] = [];

    function traverseDevices(device?: RawDevice) {
      if (!device) return;
      const serviceList = device.serviceList?.service ?? [];
      const deviceList = device.deviceList?.device ?? [];
      devices.push(device);

      if (Array.isArray(serviceList)) {
        services.push(...serviceList);
      } else {
        services.push(serviceList);
      }

      if (Array.isArray(deviceList)) {
        deviceList.forEach(traverseDevices);
      } else {
        traverseDevices(deviceList);
      }
    }

    traverseDevices(info.device);

    return {
      services,
      devices,
    };
  }
}

export default Device;

/*
 * ===================
 * ====== Types ======
 * ===================
 */

export interface Service {
  service: string;
  SCPDURL: string;
  controlURL: string;
}

export interface RawService {
  serviceType: string;
  serviceId: string;
  controlURL?: string;
  eventSubURL?: string;
  SCPDURL?: string;
}

export interface RawDevice {
  deviceType: string;
  presentationURL: string;
  friendlyName: string;
  manufacturer: string;
  manufacturerURL: string;
  modelDescription: string;
  modelName: string;
  modelNumber: string;
  modelURL: string;
  serialNumber: string;
  UDN: string;
  UPC: string;
  serviceList?: { service: RawService | RawService[] };
  deviceList?: { device: RawDevice | RawDevice[] };
}

export interface IDevice {
  /**
   * Get the available services on the network device
   * @param types List of service types to look for
   */
  getService(types: string[]): Promise<Service>;
  /**
   * Parse out available services
   * and devices from a root device
   * @param info
   * @returns the available devices and services in array form
   */
  parseDescription(info: { device?: RawDevice }): {
    services: RawService[];
    devices: RawDevice[];
  };
  /**
   * Perform a SSDP/UPNP request
   * @param action the action to perform
   * @param kvpairs arguments of said action
   */
  run(action: string, kvpairs: (string | number)[][]): Promise<RawResponse>;
}
