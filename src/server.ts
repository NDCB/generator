import consola from "consola";
import { Set, ValueObject } from "immutable";

import {
	createServer,
	IncomingMessage,
	RequestListener,
	ServerResponse,
} from "http";
import { Directory, File } from "./fs-entry";
import { normalizedPathname, Pathname } from "./fs-site";

export const logger = consola.withTag("server");

export const server = (
	roots: Set<Directory & ValueObject>,
	hostname: string,
	port: number,
): void => {
	createServer(requestHandler(roots)).listen(port, hostname, () => {
		logger.info(`Server running at http://${hostname}:${port}/`);
	});
};

export const requestHandler = (
	roots: Set<Directory & ValueObject>,
): RequestListener => (
	request: IncomingMessage,
	response: ServerResponse,
): void => {
	throw new Error("Not implemented yet");
};

export const requestUrlPathname: RegExp = /^\/(.*?)(\?(.*)|)$/;

export const requestUrlToPathname = (url: string): Pathname =>
	normalizedPathname(requestUrlPathname.exec(url)[1]);

export const sourceFile = (source: (pathname: Pathname) => File) => (
	request: IncomingMessage,
): File | null => source(requestUrlToPathname(request.url || ""));
