import { f as Server, h as ServerOptions, t as BunFetchHandler } from "../_chunks/types-CpzLEZLT.mjs";
import { t as FastURL } from "../_chunks/_url-C-JHG430.mjs";
import * as bun from "bun";

//#region src/adapters/bun.d.ts
declare const FastResponse: typeof globalThis.Response;
declare function serve(options: ServerOptions): BunServer;
declare class BunServer implements Server<BunFetchHandler> {
  #private;
  readonly runtime = "bun";
  readonly options: Server["options"];
  readonly bun: Server["bun"];
  readonly serveOptions: bun.Serve.Options<any>;
  readonly fetch: BunFetchHandler;
  constructor(options: ServerOptions);
  serve(): Promise<this>;
  get url(): string | undefined;
  ready(): Promise<this>;
  close(closeAll?: boolean): Promise<void>;
}
//#endregion
export { FastResponse, FastURL, serve };