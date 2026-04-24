#!/usr/bin/env node

// source/main.ts
import { cwd as getPwd, exit, env as env2, stdout } from "node:process";
import path from "node:path";
import chalk4 from "chalk";
import boxen from "boxen";
import clipboard from "clipboardy";

// package.json
var package_default = {
  name: "serve",
  version: "14.2.4",
  description: "Static file serving and directory listing",
  keywords: [
    "vercel",
    "serve",
    "micro",
    "http-server"
  ],
  repository: "vercel/serve",
  license: "MIT",
  type: "module",
  bin: {
    serve: "./build/main.js"
  },
  files: [
    "build/"
  ],
  engines: {
    node: ">= 14"
  },
  scripts: {
    develop: "tsx watch ./source/main.ts",
    start: "node ./build/main.js",
    compile: "tsup ./source/main.ts",
    "test:tsc": "tsc --project tsconfig.json",
    "test:unit": "vitest run --config config/vitest.ts",
    "test:watch": "vitest watch --config config/vitest.ts",
    test: "pnpm test:tsc && pnpm test:unit",
    "lint:code": "eslint --max-warnings 0 source/**/*.ts",
    "lint:style": "prettier --check --ignore-path .gitignore .",
    lint: "pnpm lint:code && pnpm lint:style",
    format: "prettier --write --ignore-path .gitignore .",
    prepare: "husky install config/husky && pnpm compile"
  },
  dependencies: {
    "@zeit/schemas": "2.36.0",
    ajv: "8.12.0",
    arg: "5.0.2",
    boxen: "7.0.0",
    chalk: "5.0.1",
    "chalk-template": "0.4.0",
    clipboardy: "3.0.0",
    compression: "1.7.4",
    "is-port-reachable": "4.0.0",
    "serve-handler": "6.1.6",
    "update-check": "1.5.4"
  },
  devDependencies: {
    "@types/compression": "1.7.2",
    "@types/serve-handler": "6.1.1",
    "@vercel/style-guide": "3.0.0",
    "@vitest/coverage-v8": "2.1.3",
    eslint: "8.19.0",
    got: "12.1.0",
    husky: "8.0.1",
    "lint-staged": "13.0.3",
    prettier: "2.7.1",
    tsup: "8.3.0",
    tsx: "4.19.1",
    typescript: "5.6.3",
    vitest: "2.1.3"
  },
  tsup: {
    target: "esnext",
    format: [
      "esm"
    ],
    outDir: "./build/"
  },
  prettier: "@vercel/style-guide/prettier",
  eslintConfig: {
    extends: [
      "./node_modules/@vercel/style-guide/eslint/node.js",
      "./node_modules/@vercel/style-guide/eslint/typescript.js"
    ],
    parserOptions: {
      project: "tsconfig.json"
    }
  },
  "lint-staged": {
    "*": [
      "prettier --ignore-unknown --write"
    ],
    "source/**/*.ts": [
      "eslint --max-warnings 0 --fix",
      "vitest related --run"
    ],
    tests: [
      "vitest --run"
    ]
  },
  packageManager: "pnpm@9.12.1+sha512.e5a7e52a4183a02d5931057f7a0dbff9d5e9ce3161e33fa68ae392125b79282a8a8a470a51dfc8a0ed86221442eb2fb57019b0990ed24fab519bf0e1bc5ccfc4"
};

// source/utilities/promise.ts
import { promisify } from "node:util";
var resolve = async (promiseLike) => {
  try {
    const data = await promiseLike;
    return [void 0, data];
  } catch (error2) {
    return [error2, void 0];
  }
};

// source/utilities/server.ts
import http2 from "node:http";
import https from "node:https";
import { readFile } from "node:fs/promises";
import handler from "serve-handler";
import compression from "compression";
import isPortReachable from "is-port-reachable";
import chalk2 from "chalk";

// source/utilities/http.ts
import { networkInterfaces as getNetworkInterfaces } from "node:os";
var networkInterfaces = getNetworkInterfaces();
var registerCloseListener = (fn) => {
  let run = false;
  const wrapper = () => {
    if (!run) {
      run = true;
      fn();
    }
  };
  process.on("SIGINT", wrapper);
  process.on("SIGTERM", wrapper);
  process.on("exit", wrapper);
};
var getNetworkAddress = () => {
  for (const interfaceDetails of Object.values(networkInterfaces)) {
    if (!interfaceDetails) continue;
    for (const details of interfaceDetails) {
      const { address, family, internal } = details;
      if (family === "IPv4" && !internal) return address;
    }
  }
};

// source/utilities/logger.ts
import chalk from "chalk";
var http = (...message) => console.info(chalk.bgBlue.bold(" HTTP "), ...message);
var info = (...message) => console.info(chalk.bgMagenta.bold(" INFO "), ...message);
var warn = (...message) => console.error(chalk.bgYellow.bold(" WARN "), ...message);
var error = (...message) => console.error(chalk.bgRed.bold(" ERROR "), ...message);
var log = console.log;
var logger = { http, info, warn, error, log };

// source/utilities/server.ts
var compress = promisify(compression());
var startServer = async (endpoint, config2, args2, previous) => {
  const serverHandler = (request, response) => {
    const run = async () => {
      const requestTime = /* @__PURE__ */ new Date();
      const formattedTime = `${requestTime.toLocaleDateString()} ${requestTime.toLocaleTimeString()}`;
      const ipAddress = request.socket.remoteAddress?.replace("::ffff:", "") ?? "unknown";
      const requestUrl = `${request.method ?? "GET"} ${request.url ?? "/"}`;
      if (!args2["--no-request-logging"])
        logger.http(
          chalk2.dim(formattedTime),
          chalk2.yellow(ipAddress),
          chalk2.cyan(requestUrl)
        );
      if (args2["--cors"]) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Headers", "*");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setHeader("Access-Control-Allow-Private-Network", "true");
      }
      if (!args2["--no-compression"])
        await compress(request, response);
      await handler(request, response, config2);
      const responseTime = Date.now() - requestTime.getTime();
      if (!args2["--no-request-logging"])
        logger.http(
          chalk2.dim(formattedTime),
          chalk2.yellow(ipAddress),
          chalk2[response.statusCode < 400 ? "green" : "red"](
            `Returned ${response.statusCode} in ${responseTime} ms`
          )
        );
    };
    run().catch((error2) => {
      throw error2;
    });
  };
  const sslCert = args2["--ssl-cert"];
  const sslKey = args2["--ssl-key"];
  const sslPass = args2["--ssl-pass"];
  const isPFXFormat = sslCert && /[.](?<extension>pfx|p12)$/.exec(sslCert) !== null;
  const useSsl = sslCert && (sslKey || sslPass || isPFXFormat);
  let serverConfig = {};
  if (useSsl && sslCert && sslKey) {
    serverConfig = {
      key: await readFile(sslKey),
      cert: await readFile(sslCert),
      passphrase: sslPass ? await readFile(sslPass, "utf8") : ""
    };
  } else if (useSsl && sslCert && isPFXFormat) {
    serverConfig = {
      pfx: await readFile(sslCert),
      passphrase: sslPass ? await readFile(sslPass, "utf8") : ""
    };
  }
  const server = useSsl ? https.createServer(serverConfig, serverHandler) : http2.createServer(serverHandler);
  const getServerDetails = () => {
    registerCloseListener(() => server.close());
    const details = server.address();
    let local;
    let network;
    if (typeof details === "string") {
      local = details;
    } else if (typeof details === "object" && details.port) {
      let address;
      if (details.address === "::") address = "localhost";
      else if (details.family === "IPv6") address = `[${details.address}]`;
      else address = details.address;
      const ip = getNetworkAddress();
      const protocol = useSsl ? "https" : "http";
      local = `${protocol}://${address}:${details.port}`;
      network = ip ? `${protocol}://${ip}:${details.port}` : void 0;
    }
    return {
      local,
      network,
      previous
    };
  };
  server.on("error", (error2) => {
    throw new Error(
      `Failed to serve: ${error2.stack?.toString() ?? error2.message}`
    );
  });
  if (typeof endpoint.port === "number" && !isNaN(endpoint.port) && endpoint.port !== 0) {
    const port = endpoint.port;
    const isClosed = await isPortReachable(port, {
      host: endpoint.host ?? "localhost"
    });
    if (isClosed) return startServer({ port: 0 }, config2, args2, port);
  }
  return new Promise((resolve2, _reject) => {
    if (typeof endpoint.port !== "undefined" && typeof endpoint.host === "undefined")
      server.listen(endpoint.port, () => resolve2(getServerDetails()));
    else if (typeof endpoint.port === "undefined" && typeof endpoint.host !== "undefined")
      server.listen(endpoint.host, () => resolve2(getServerDetails()));
    else if (typeof endpoint.port !== "undefined" && typeof endpoint.host !== "undefined")
      server.listen(
        endpoint.port,
        endpoint.host,
        () => resolve2(getServerDetails())
      );
  });
};

// source/utilities/cli.ts
import { parse as parseUrl } from "node:url";
import { env } from "node:process";
import chalk3 from "chalk";
import chalkTemplate from "chalk-template";
import parseArgv from "arg";
import checkForUpdate from "update-check";
var helpText = chalkTemplate`
  {bold.cyan serve} - Static file serving and directory listing

  {bold USAGE}

    {bold $} {cyan serve} --help
    {bold $} {cyan serve} --version
    {bold $} {cyan serve} folder_name
    {bold $} {cyan serve} [-l {underline listen_uri} [-l ...]] [{underline directory}]

    By default, {cyan serve} will listen on {bold 0.0.0.0:3000} and serve the
    current working directory on that address.

    Specifying a single {bold --listen} argument will overwrite the default, not supplement it.

  {bold OPTIONS}

    --help                              Shows this help message

    -v, --version                       Displays the current version of serve

    -l, --listen {underline listen_uri}             Specify a URI endpoint on which to listen (see below) -
                                        more than one may be specified to listen in multiple places

    -p                                  Specify custom port

    -s, --single                        Rewrite all not-found requests to \`index.html\`

    -d, --debug                         Show debugging information

    -c, --config                        Specify custom path to \`serve.json\`

    -L, --no-request-logging            Do not log any request information to the console.

    -C, --cors                          Enable CORS, sets \`Access-Control-Allow-Origin\` to \`*\`

    -n, --no-clipboard                  Do not copy the local address to the clipboard

    -u, --no-compression                Do not compress files

    --no-etag                           Send \`Last-Modified\` header instead of \`ETag\`

    -S, --symlinks                      Resolve symlinks instead of showing 404 errors
    
    --ssl-cert                          Optional path to an SSL/TLS certificate to serve with HTTPS
                                        {grey Supported formats: PEM (default) and PKCS12 (PFX)}
    
    --ssl-key                           Optional path to the SSL/TLS certificate\'s private key
                                        {grey Applicable only for PEM certificates}

    --ssl-pass                          Optional path to the SSL/TLS certificate\'s passphrase

    --no-port-switching                 Do not open a port other than the one specified when it\'s taken.

  {bold ENDPOINTS}

    Listen endpoints (specified by the {bold --listen} or {bold -l} options above) instruct {cyan serve}
    to listen on one or more interfaces/ports, UNIX domain sockets, or Windows named pipes.

    For TCP ports on hostname "localhost":

      {bold $} {cyan serve} -l {underline 1234}

    For TCP (traditional host/port) endpoints:

      {bold $} {cyan serve} -l tcp://{underline hostname}:{underline 1234}

    For UNIX domain socket endpoints:

      {bold $} {cyan serve} -l unix:{underline /path/to/socket.sock}

    For Windows named pipe endpoints:

      {bold $} {cyan serve} -l pipe:\\\\.\\pipe\\{underline PipeName}
`;
var getHelpText = () => helpText;
var parseEndpoint = (uriOrPort) => {
  if (!isNaN(Number(uriOrPort))) return { port: Number(uriOrPort) };
  const endpoint = uriOrPort;
  const url = parseUrl(endpoint);
  switch (url.protocol) {
    case "pipe:": {
      const pipe = endpoint.replace(/^pipe:/, "");
      if (!pipe.startsWith("\\\\.\\"))
        throw new Error(`Invalid Windows named pipe endpoint: ${endpoint}`);
      return { host: pipe };
    }
    case "unix:":
      if (!url.pathname)
        throw new Error(`Invalid UNIX domain socket endpoint: ${endpoint}`);
      return { host: url.pathname };
    case "tcp:":
      url.port = url.port ?? "3000";
      url.hostname = url.hostname ?? "localhost";
      return {
        port: Number(url.port),
        host: url.hostname
      };
    default:
      throw new Error(
        `Unknown --listen endpoint scheme (protocol): ${url.protocol ?? "undefined"}`
      );
  }
};
var options = {
  "--help": Boolean,
  "--version": Boolean,
  "--listen": [parseEndpoint],
  "--single": Boolean,
  "--debug": Boolean,
  "--config": String,
  "--no-clipboard": Boolean,
  "--no-compression": Boolean,
  "--no-etag": Boolean,
  "--symlinks": Boolean,
  "--cors": Boolean,
  "--no-port-switching": Boolean,
  "--ssl-cert": String,
  "--ssl-key": String,
  "--ssl-pass": String,
  "--no-request-logging": Boolean,
  // A list of aliases for the above options.
  "-h": "--help",
  "-v": "--version",
  "-l": "--listen",
  "-s": "--single",
  "-d": "--debug",
  "-c": "--config",
  "-n": "--no-clipboard",
  "-u": "--no-compression",
  "-S": "--symlinks",
  "-C": "--cors",
  "-L": "--no-request-logging",
  // The `-p` option is deprecated and is kept only for backwards-compatibility.
  "-p": "--listen"
};
var parseArguments = () => parseArgv(options);
var checkForUpdates = async (manifest) => {
  if (env.NO_UPDATE_CHECK) return;
  const [error2, update] = await resolve(checkForUpdate(manifest));
  if (error2) throw error2;
  if (!update) return;
  logger.log(
    chalk3.bgRed.white(" UPDATE "),
    `The latest version of \`serve\` is ${update.latest}`
  );
};

// source/utilities/config.ts
import {
  resolve as resolvePath,
  relative as resolveRelativePath
} from "node:path";
import { readFile as readFile2 } from "node:fs/promises";
import Ajv from "ajv";
import schema from "@zeit/schemas/deployment/config-static.js";
var loadConfiguration = async (presentDirectory2, directoryToServe2, args2) => {
  const files = ["serve.json", "now.json", "package.json"];
  if (args2["--config"]) files.unshift(args2["--config"]);
  const config2 = {};
  for (const file of files) {
    const location = resolvePath(directoryToServe2, file);
    const [error2, rawContents] = await resolve(
      readFile2(location, "utf8")
    );
    if (error2) {
      if (error2.code === "ENOENT" && file !== args2["--config"]) continue;
      else
        throw new Error(
          `Could not read configuration from file ${location}: ${error2.message}`
        );
    }
    let parsedJson;
    try {
      parsedJson = JSON.parse(rawContents);
      if (typeof parsedJson !== "object")
        throw new Error("configuration is not an object");
    } catch (parserError) {
      throw new Error(
        `Could not parse ${location} as JSON: ${parserError.message}`
      );
    }
    if (file === "now.json") {
      parsedJson = parsedJson;
      parsedJson = parsedJson.now.static;
    } else if (file === "package.json") {
      parsedJson = parsedJson;
      parsedJson = parsedJson.static;
    }
    if (!parsedJson) continue;
    Object.assign(config2, parsedJson);
    if (file === "now.json" || file === "package.json")
      logger.warn(
        "The config files `now.json` and `package.json` are deprecated. Please use `serve.json`."
      );
    break;
  }
  if (directoryToServe2) {
    const staticDirectory = config2.public;
    config2.public = resolveRelativePath(
      presentDirectory2,
      staticDirectory ? resolvePath(directoryToServe2, staticDirectory) : directoryToServe2
    );
  }
  if (Object.keys(config2).length !== 0) {
    const ajv = new Ajv({ allowUnionTypes: true });
    const validate = ajv.compile(schema);
    if (!validate(config2) && validate.errors) {
      const defaultMessage = "The configuration you provided is invalid:";
      const error2 = validate.errors[0];
      throw new Error(
        `${defaultMessage}
${error2.message ?? ""}
${JSON.stringify(
          error2.params
        )}`
      );
    }
  }
  config2.etag = !args2["--no-etag"];
  config2.symlinks = args2["--symlinks"] || config2.symlinks;
  return config2;
};

// source/main.ts
var [parseError, args] = await resolve(parseArguments());
if (parseError || !args) {
  logger.error(parseError.message);
  exit(1);
}
var [updateError] = await resolve(checkForUpdates(package_default));
if (updateError) {
  const suffix = args["--debug"] ? ":" : " (use `--debug` to see full error)";
  logger.warn(`Checking for updates failed${suffix}`);
  if (args["--debug"]) logger.error(updateError.message);
}
if (args["--version"]) {
  logger.log(package_default.version);
  exit(0);
}
if (args["--help"]) {
  logger.log(getHelpText());
  exit(0);
}
if (!args["--listen"])
  args["--listen"] = [{ port: parseInt(env2.PORT ?? "3000", 10) }];
if (args._.length > 1) {
  logger.error("Please provide one path argument at maximum");
  exit(1);
}
var presentDirectory = getPwd();
var directoryToServe = args._[0] ? path.resolve(args._[0]) : presentDirectory;
var [configError, config] = await resolve(
  loadConfiguration(presentDirectory, directoryToServe, args)
);
if (configError || !config) {
  logger.error(configError.message);
  exit(1);
}
if (args["--single"]) {
  const { rewrites } = config;
  const existingRewrites = Array.isArray(rewrites) ? rewrites : [];
  config.rewrites = [
    {
      source: "**",
      destination: "/index.html"
    },
    ...existingRewrites
  ];
}
for (const endpoint of args["--listen"]) {
  const { local, network, previous } = await startServer(
    endpoint,
    config,
    args
  );
  const copyAddress = !args["--no-clipboard"];
  if (!stdout.isTTY || env2.NODE_ENV === "production") {
    const suffix = local ? ` at ${local}` : "";
    logger.info(`Accepting connections${suffix}`);
    continue;
  }
  let message = chalk4.green("Serving!");
  if (local) {
    const prefix = network ? "- " : "";
    const space = network ? "    " : "  ";
    message += `

${chalk4.bold(`${prefix}Local:`)}${space}${local}`;
  }
  if (network) message += `
${chalk4.bold("- Network:")}  ${network}`;
  if (previous)
    message += chalk4.red(
      `

This port was picked because ${chalk4.underline(
        previous.toString()
      )} is in use.`
    );
  if (copyAddress && local) {
    try {
      await clipboard.write(local);
      message += `

${chalk4.grey("Copied local address to clipboard!")}`;
    } catch (error2) {
      logger.error(
        `Cannot copy server address to clipboard: ${error2.message}.`
      );
    }
  }
  logger.log(
    boxen(message, {
      padding: 1,
      borderColor: "green",
      margin: 1
    })
  );
}
registerCloseListener(() => {
  logger.log();
  logger.info("Gracefully shutting down. Please wait...");
  process.on("SIGINT", () => {
    logger.log();
    logger.warn("Force-closing all open sockets...");
    exit(0);
  });
});
