import { Set, ValueObject } from "immutable";

import { Directory } from "./fs-entry";

export const server = (
	roots: Set<Directory & ValueObject>,
	hostname: string,
	port: number,
): void => {
	throw new Error("Not implemented yet");
};
