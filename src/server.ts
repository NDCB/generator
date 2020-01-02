import consola from "consola";
import { Seq, Set, ValueObject } from "immutable";
import { lookup as mimeType } from "mime-types";

import {
	createServer,
	IncomingMessage,
	RequestListener,
	ServerResponse,
} from "http";
import { Directory, File, fileName } from "./fs-entry";
import { defaultEncoding, encodingToString } from "./fs-reader";
import {
	normalizedPathname,
	Pathname,
	pathnameToString,
	sourceFile,
} from "./fs-site";
import { Document, documentContents, documentLocation } from "./processor";
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

export const locationMimeType = (location: Pathname): string =>
	mimeType(pathnameToString(location)) || "text/plain";

export const processorRequestHandler = (
	processor: (source: File) => Document,
	serverSourceFile: (pathname: Pathname) => File | null,
	noSourceHandler: (request: IncomingMessage, response: ServerResponse) => void,
	processorErrorHandler: (
		error: Error,
		request: IncomingMessage,
		response: ServerResponse,
	) => void,
): RequestListener => (
	request: IncomingMessage,
	response: ServerResponse,
): void => {
	const source = serverSourceFile(requestUrlToPathname(request.url));
	if (!source) {
		noSourceHandler(request, response);
	} else {
		try {
			const document = processor(source);
			response.writeHead(statusCode(source), {
				"Content-Type": locationMimeType(documentLocation(document)),
			});
			response.write(
				documentContents(document),
				encodingToString(defaultEncoding),
			);
			response.end();
		} catch (error) {
			processorErrorHandler(error, request, response);
		}
	}
};
