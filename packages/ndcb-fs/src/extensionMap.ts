import {
  extension,
  Extension,
  extensionEquals,
  hashExtension,
} from "@ndcb/fs-util";
import {
  hashMap,
  HashMap,
  inversedHashMap,
  map as mapIterable,
  prepend,
} from "@ndcb/util";

export interface ExtensionMap {
  readonly source: Extension;
  readonly destination: Extension;
}

export interface ExtensionsMap {
  readonly sourceExtensions: (
    destinationExtension: Extension | null,
  ) => Iterable<Extension>;
  readonly destinationExtension: (
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
  ): Iterable<Extension> =>
    !destinationExtension
      ? htmlSingleton
      : prepend(
          inverse.get(destinationExtension, () => []),
          destinationExtension,
        );
  const destinationExtension = (
    sourceExtension: Extension | null,
  ): Extension | null =>
    sourceExtension ? map.get(sourceExtension, () => sourceExtension) : null;
  return { sourceExtensions, destinationExtension };
};
