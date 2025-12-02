import { f as Server, h as ServerOptions, r as DenoFetchHandler } from "../_chunks/types-CpzLEZLT.mjs";
import { t as FastURL } from "../_chunks/_url-C-JHG430.mjs";

//#region src/adapters/deno.d.ts
declare const FastResponse: typeof globalThis.Response;
declare function serve(options: ServerOptions): DenoServer;
declare class DenoServer implements Server<DenoFetchHandler> {
  #private;
  readonly runtime = "deno";
  readonly options: Server["options"];
  readonly deno: Server["deno"];
  readonly serveOptions: Deno.ServeTcpOptions | (Deno.ServeTcpOptions & Deno.TlsCertifiedKeyPem);
  readonly fetch: DenoFetchHandler;
  constructor(options: ServerOptions);
  serve(): Promise<this>;
  get url(): string | undefined;
  ready(): Promise<Server>;
  close(): Promise<void>;
}
//#endregion
export { FastResponse, FastURL, serve };