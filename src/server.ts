import consola from "consola";
import { Seq, Set, ValueObject } from "immutable";

import {
	createServer,
	IncomingMessage,
	RequestListener,
	ServerResponse,
} from "http";
import { Directory, File, fileName } from "./fs-entry";
import { normalizedPathname, Pathname, sourceFile } from "./fs-site";
import { strictEquals } from "./util";

export const logger = consola.withTag("server");

export const server = (
	roots: Set<Directory & ValueObject>,
	hostname: string,
	port: number,
): void => {
	createServer(requestHandler(roots)).listen(port, hostname, () => {
		logger.info(`Server running at http://${hostname}:${port}/`);
		logger.info(`Press CTRL+C to stop the server`);
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

export const pathnameSourceFile = (
	source: (pathname: Pathname) => File | null,
) => (request: IncomingMessage): File | null =>
	source(requestUrlToPathname(request.url || ""));

export const serverSourceFile = (
	possibleSources: (pathname: Pathname) => Iterable<File>,
	possible404s: (pathname: Pathname) => Iterable<File>,
): ((pathname: Pathname) => File | null) =>
	sourceFile((pathname: Pathname) =>
		Seq(possibleSources(pathname)).concat(possible404s(pathname)),
	);

export const is404File = (file: File): boolean =>
	strictEquals(fileName(file), "404");

export const statusCode = (source: File | null): number =>
	!source || is404File(source) ? 404 : 200;
