declare namespace NodeJS {
  interface ProcessEnv {
    BUILD_VERSION?: string;
  }
}

declare global {
  const BUILD_ENV: string;
  const process: {
    env: NodeJS.ProcessEnv;
  };
}

export {};
