import dgram, { Socket } from "dgram";
import os from "os";
import EventEmitter from "events";

export class Ssdp implements ISsdp {
  private sourcePort = this.options?.sourcePort || 0;
  private bound = false;
  private boundCount = 0;
  private closed = false;

  private readonly queue: [string, SsdpEmitter][] = [];
  private readonly multicast = "239.255.255.250";
  private readonly port = 1900;
  private readonly sockets;
  private readonly ssdpEmitter: SsdpEmitter = new EventEmitter();

  constructor(private options?: { sourcePort?: number }) {
    // Create sockets on all external interfaces
    const interfaces = os.networkInterfaces();
    this.sockets = Object.keys(interfaces).reduce<Socket[]>(
      (arr, key) =>
        arr.concat(
          interfaces[key]
            ?.filter((item) => !item.internal)
            .map((item) => this.createSocket(item)) ?? []
        ),
      []
    );
  }

  private createSocket(iface: any) {
    const socket = dgram.createSocket(
      iface.family === "IPv4" ? "udp4" : "udp6"
    );

    socket.on("message", (message) => {
      // Ignore messages after closing sockets
      if (this.closed) return;

      // Parse response
      this.parseResponse(message.toString(), socket.address as any as string);
    });

    // Bind in next tick (sockets should be me in this.sockets array)
    process.nextTick(() => {
      // Unqueue this._queue once all sockets are ready
      const onready = () => {
        if (this.boundCount < this.sockets.length) return;

        this.bound = true;
        this.queue.forEach(([device, emitter]) => this.search(device, emitter));
      };

      socket.on("listening", () => {
        this.boundCount += 1;
        onready();
      });

      // On error - remove socket from list and execute items from queue
      socket.once("error", () => {
        socket.close();
        this.sockets.splice(this.sockets.indexOf(socket), 1);
        onready();
      });

      socket.address = iface.address;
      socket.bind(this.sourcePort, iface.address);
    });

    return socket;
  }

  private parseResponse(response: string, addr: string) {
    // Ignore incorrect packets
    if (!/^(HTTP|NOTIFY)/m.test(response)) return;

    const headers = parseMimeHeader(response);

    // We are only interested in messages that can be matched against the original
    // search target
    if (!headers.st) return;

    this.ssdpEmitter.emit("device", headers, addr);
  }

  public search(device: string, emitter?: SsdpEmitter): SsdpEmitter {
    if (!emitter) {
      emitter = new EventEmitter();
      emitter._ended = false;
      emitter.once("end", () => {
        emitter!._ended = true;
      });
    }

    if (!this.bound) {
      this.queue.push([device, emitter]);
      return emitter;
    }

    const query = Buffer.from(
      "M-SEARCH * HTTP/1.1\r\n" +
        "HOST: " +
        this.multicast +
        ":" +
        this.port +
        "\r\n" +
        'MAN: "ssdp:discover"\r\n' +
        "MX: 1\r\n" +
        "ST: " +
        device +
        "\r\n" +
        "\r\n"
    );

    // Send query on each socket
    this.sockets.forEach((socket) =>
      socket.send(query, 0, query.length, this.port, this.multicast)
    );

    const ondevice: SearchCallback = (headers, address) => {
      if (!emitter || emitter._ended || headers.st !== device) return;

      emitter.emit("device", headers, address);
    };
    this.ssdpEmitter.on("device", ondevice);

    // Detach listener after receiving 'end' event
    emitter.once("end", () =>
      this.ssdpEmitter.removeListener("device", ondevice)
    );

    return emitter;
  }

  public close() {
    this.sockets.forEach((socket) => socket.close());
    this.closed = true;
  }
}

function parseMimeHeader(headerStr: string) {
  const lines = headerStr.split(/\r\n/g);

  // Parse headers from lines to hashmap
  return lines.reduce<Record<string, string>>((headers, line) => {
    const [_, key, value] = line.match(/^([^:]*)\s*:\s*(.*)$/) ?? [];
    if (key && value) {
      headers[key.toLowerCase()] = value;
    }
    return headers;
  }, {});
}

export default Ssdp;

/*
 * ===================
 * ====== Types ======
 * ===================
 */

type SearchArgs = [Record<string, string>, string];
export type SearchCallback = (...args: SearchArgs) => void;
type SearchEvent = <E extends Events>(
  ev: E,
  ...args: E extends "device" ? SearchArgs : []
) => boolean;
type Events = "device" | "end";
type Event<E extends Events> = E extends "device" ? SearchCallback : () => void;
type EventListener<T> = <E extends Events>(ev: E, callback: Event<E>) => T;

export interface SsdpEmitter extends EventEmitter {
  removeListener: EventListener<this>;
  addListener: EventListener<this>;
  once: EventListener<this>;
  on: EventListener<this>;

  emit: SearchEvent;

  _ended?: boolean;
}

export interface ISsdp {
  /**
   * Search for a SSDP compatible server on the network
   * @param device Search Type (ST) header, specifying which device to search for
   * @param emitter An existing EventEmitter to emit event on
   * @returns The event emitter provided in Promise, or a newly instantiated one.
   */
  search(device: string, emitter?: SsdpEmitter): SsdpEmitter;
  /**
   * Close all sockets
   */
  close(): void;
}
