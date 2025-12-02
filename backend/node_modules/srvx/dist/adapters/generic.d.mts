import { f as Server, h as ServerOptions } from "../_chunks/types-CpzLEZLT.mjs";

//#region src/adapters/generic.d.ts
declare const FastURL: typeof globalThis.URL;
declare const FastResponse: typeof globalThis.Response;
declare function serve(options: ServerOptions): Server;
//#endregion
export { FastResponse, FastURL, serve };