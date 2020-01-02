import { Set, ValueObject } from "immutable";

import { Directory } from "./fs-entry";

export const build = (
	roots: Set<Directory & ValueObject>,
	destination: Directory,
): void => {
	throw new Error("Not implemented yet");
};
