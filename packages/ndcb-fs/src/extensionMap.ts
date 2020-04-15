import { HashMap, hashMap, inversedHashMap, prepend } from "@ndcb/util";

import {
	Extension,
	hashExtension,
	extensionEquals,
	extension,
} from "./extension";

export interface ExtensionMap {
	sourceExtensions: (
		destinationExtension: Extension | null,
	) => Iterable<Extension>;
	destinationExtension: (
		sourceExtension: Extension | null,
	) => Extension | null;
}

export const extensionMap = (
	maps: Iterable<[Extension, Extension]>,
): ExtensionMap => {
	const mapsArray: Array<[Extension, Extension]> = [...maps];
	const map: HashMap<Extension, Extension> = hashMap(
		mapsArray,
		hashExtension,
		extensionEquals,
	);
	const inverse: HashMap<Extension, Extension[]> = inversedHashMap(
		mapsArray,
		hashExtension,
		extensionEquals,
	);
	const sourceExtensions = (
		destinationExtension: Extension | null,
	): Iterable<Extension> => {
		if (!destinationExtension) return [extension(".html")];
		else if (!inverse.has(destinationExtension))
			return [destinationExtension];
		else
			return prepend(
				inverse.get(destinationExtension) as Extension[],
				destinationExtension,
			);
	};
	const destinationExtension = (
		sourceExtension: Extension | null,
	): Extension | null => {
		return sourceExtension
			? map.get(sourceExtension, () => sourceExtension)
			: null;
	};
	return { sourceExtensions, destinationExtension };
};
