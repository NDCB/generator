import consola from "consola";

import { File, fileToString } from "./fs-entry";
import {
	Extension,
	extensionToString,
	fileHasAnyExtension,
	fileHasExtension,
} from "./fs-extension";

export const logger = consola.withTag("fs-ignore");

export const ignoreExtension: (
	extension: Extension,
) => (file: File) => boolean = fileHasExtension;

export const logIgnoreExtension = (extension: Extension) => {
	const isFileIgnored = ignoreExtension(extension);
	return (file: File): boolean => {
		const isIgnored = isFileIgnored(file);
		if (isIgnored) {
			logger.info(
				`File ${fileToString(
					file,
				)} ignored for having extension ${extensionToString(extension)}`,
			);
		}
		return isIgnored;
	};
};

export const ignoreExtensions: (
	...extensions: Extension[]
) => (file: File) => boolean = fileHasAnyExtension;

export const logIgnoreExtensions = (...extensions: Extension[]) => {
	const predicates = extensions.map(logIgnoreExtension);
	return (file: File): boolean =>
		predicates.some((predicate) => predicate(file));
};
