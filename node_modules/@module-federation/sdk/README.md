# `@module-federation/sdk` Documentation

- This SDK provides utilities and tools to support the implementation of Module Federation in your projects.
- It contains utility functions for parsing, encoding, and decoding module names, as well as generating filenames for exposed modules and shared packages.
- It also includes a logger for debugging and environment detection utilities.
- Additionally, it provides a function to generate a snapshot from a manifest and environment detection utilities.

## Usage

```javascript
// The SDK can be used to parse entry strings, encode and decode module names, and generate filenames for exposed modules and shared packages.
// It also includes a logger for debugging and environment detection utilities.
// Additionally, it provides a function to generate a snapshot from a manifest and environment detection utilities.
import { parseEntry, encodeName, decodeName, generateExposeFilename, generateShareFilename, createLogger, isBrowserEnv, isDebugMode, getProcessEnv, generateSnapshotFromManifest } from '@module-federation/sdk';

// Parse an entry string into a RemoteEntryInfo object
parseEntry('entryString');

// Encode a module name with a prefix and optional extension
encodeName('moduleName', 'prefix');

// Decode a module name with a prefix and optional extension
decodeName('encodedModuleName', 'prefix');

// Generate a filename for an exposed module
generateExposeFilename('exposeName', true);

// Generate a filename for a shared package
generateShareFilename('packageName', true);

// Create a logger
const logger = createLogger('identifier');

// Check if the current environment is a browser
isBrowserEnv();

// Check if the current environment is in debug mode
isDebugMode();

// Get the process environment
getProcessEnv();

// Generate a snapshot from a manifest
generateSnapshotFromManifest(manifest, options);
```

### parseEntry

- Type: `parseEntry(str: string, devVerOrUrl?: string, separator?: string) `
- Parses a string into a RemoteEntryInfo object.

### encodeName

- Type: `encodeName(name: string, prefix?: string, withExt?: boolean)`
- Encodes a name with a prefix and optional extension.

### decodeName

- Type: `decodeName(name: string, prefix?: string, withExt?: boolean)`
- Decodes a name with a prefix and optional extension.

### generateExposeFilename

- Type: `generateExposeFilename(exposeName: string, withExt: boolean)`
- Generates a filename for an expose.

### generateShareFilename

- Type: `generateShareFilename(pkgName: string, withExt: boolean)`
- Generates a filename for a shared package.

### createLogger

- Type: `createLogger(prefix: string)`
- Creates a logger for debugging.

### isBrowserEnv

- Type: `isBrowserEnv()`
- Checks if the current environment is a browser.

### isDebugMode

- Type: `isDebugMode()`
- Checks if the current environment is in debug mode.

### getProcessEnv

- Type: `getProcessEnv()`
- Gets the process environment.

### generateSnapshotFromManifest

- Type: `generateSnapshotFromManifest(manifest: Manifest, options?: IOptions)`
- Generates a snapshot from a manifest.

## Testing

The SDK uses Jest for testing. The configuration can be found in `jest.config.js`. The tests are located in the **tests** directory.
