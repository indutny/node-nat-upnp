import { RawResponse } from "../index";
import Device from "./device";
import Ssdp from "./ssdp";
export declare class Client implements IClient {
    readonly timeout: number;
    readonly ssdp: Ssdp;
    constructor(options?: {
        timeout?: number;
    });
    createMapping(options: NewPortMappingOpts): Promise<RawResponse>;
    removeMapping(options: DeletePortMappingOpts): Promise<RawResponse>;
    getMappings(options?: GetMappingOpts): Promise<Mapping[]>;
    getPublicIp(): Promise<string>;
    getGateway(): Promise<{
        gateway: Device;
        address: string;
    }>;
    close(): void;
}
export default Client;
export interface Mapping {
    public: {
        host: string;
        port: number;
    };
    private: {
        host: string;
        port: number;
    };
    protocol: string;
    enabled: boolean;
    description: string;
    ttl: number;
    local: boolean;
}
/**
 * Standard options that many options use.
 */
export interface StandardOpts {
    public?: number | {
        port?: number;
        host?: string;
    };
    private?: number | {
        port?: number;
        host?: string;
    };
    protocol?: string;
}
export interface NewPortMappingOpts extends StandardOpts {
    description?: string;
    ttl?: number;
}
export declare type DeletePortMappingOpts = StandardOpts;
export interface GetMappingOpts {
    local?: boolean;
    description?: RegExp | string;
}
/**
 * Main client interface.
 */
export interface IClient {
    /**
     * Create a new port mapping
     * @param options Options for the new port mapping
     */
    createMapping(options: NewPortMappingOpts): Promise<RawResponse>;
    /**
     * Remove a port mapping
     * @param options Specify which port mapping to remove
     */
    removeMapping(options: DeletePortMappingOpts): Promise<RawResponse>;
    /**
     * Get a list of existing mappings
     * @param options Filter mappings based on these options
     */
    getMappings(options?: GetMappingOpts): Promise<Mapping[]>;
    /**
     * Fetch the external/public IP from the gateway
     */
    getPublicIp(): Promise<string>;
    /**
     * Get the gateway device for communication
     */
    getGateway(): Promise<{
        gateway: Device;
        address: string;
    }>;
    /**
     * Close the underlaying sockets and resources
     */
    close(): void;
}
