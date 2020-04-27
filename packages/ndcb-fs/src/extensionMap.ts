import {
	HashMap,
	hashMap,
	inversedHashMap,
	prepend,
	map as mapIterable,
} from "@ndcb/util";

import {
	Extension,
	hashExtension,
	extensionEquals,
	extension,
} from "./extension";

export interface ExtensionMap {
	readonly source: Extension;
	readonly destination: Extension;
}

export interface ExtensionsMap {
	sourceExtensions: (
		destinationExtension: Extension | null,
	) => Iterable<Extension>;
	destinationExtension: (
		sourceExtension: Extension | null,
	) => Extension | null;
}

export const extensionsMap = (maps: Iterable<ExtensionMap>): ExtensionsMap => {
	const mapsArray: Array<[Extension, Extension]> = [
		...mapIterable<ExtensionMap, [Extension, Extension]>(
			maps,
			({ source, destination }) => [source, destination],
		),
	];
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
	const htmlSingleton = [extension(".html")];
	const sourceExtensions = (
		destinationExtension: Extension | null,
	): Iterable<Extension> => {
		if (!destinationExtension) return htmlSingleton;
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
	): Extension | null =>
		sourceExtension
			? map.get(sourceExtension, () => sourceExtension)
			: null;
	return { sourceExtensions, destinationExtension };
};
