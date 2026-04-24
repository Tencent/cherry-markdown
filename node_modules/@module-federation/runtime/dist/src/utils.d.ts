import type { ModuleFederation } from '@module-federation/runtime-core';
export declare function getBuilderId(): string;
export declare function getGlobalFederationInstance(name: string, version: string | undefined): ModuleFederation | undefined;
