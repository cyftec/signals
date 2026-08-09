import type { CompilerOptions } from "typescript";

export type AppMode = "web" | "ext" | "pwa";
export type KarmaResetMode = "soft" | "hard";

type FileNamesMap = Record<string, string>;
export type ProjectFileNames = {
  buildable: {
    appSrcDir: string;
    appViewDir: string;
    pageFile: `${string}.ts`;
    manifestFile: `${string}.ts`;
  } & FileNamesMap;
  static: {
    publishDir: string;
    dsStoreDir: ".DS_Store";
  } & FileNamesMap;
  disposable: {
    stagingDir: string;
    tsConfigFile?: string;
  } & FileNamesMap;
};

export type TsConfig = {
  compilerOptions?: CompilerOptions;
  include?: string[];
  exclude?: string[];
  extends?: string;
  [key: string]: unknown;
};

export type Karma = {
  brahma: {
    build: {
      appSrcDir: string;
      appViewDir: string;
      skipErrorAndBuildNext: boolean;
      /**
       * file or dir name prefixed with below delimiter gets ignored during build
       */
      ignoreDelimiter: string;
      buildablePageFileName: string;
      buildableManifestFileName: string;
      stagingDir: string;
      publishDir: string;
      disposable: string[];
    };
    serve: {
      port: number;
      redirectOnStart: boolean;
      reloadPageOnFocus: boolean;
      /**
       * Path of app source directory which should be watched for any changes
       */
      watchDir: string;
      /**
       * Path of built html app directory, which should be served by local server
       */
      serveDir: string;
    };
  };
  maya: {
    name: string;
    appType: AppMode;
    version?: string;
    description?: string;
    author?: string;
    license?: string;
    type?: "module";
    devDependencies?: {
      [dd in string]: string;
    };
    dependencies: {
      [d in string]: string;
    };
  };
  git: {
    ignore: string[];
  };
  vscode: {
    settings: {
      "deno.enable": boolean;
      "files.exclude": {
        [x in string]: boolean;
      };
    };
  };
  tsconfig?: TsConfig;
};

export type KarmaConfigObject = { karma: Karma };
