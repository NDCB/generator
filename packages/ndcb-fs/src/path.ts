import { normalize } from "path";

/**
 * A relative path between entries in the file system.
 *
 * Must be resolved relative to an absolute path to possibly refer to an
 * existing entry in the file system.
 */
export interface RelativePath {
	readonly value: string;
	readonly _tag: "RelativePath";
}

export const relativePathToString = (path: RelativePath): string => path.value;

/**
 * Constructs a relative path of a given value.
 *
 * @param value The value of the relative path. It is assumed to have been
 * normalized.
 *
 * @return The constructed relative path.
 */
export const relativePath = (value: string): RelativePath => ({
	value,
	_tag: "RelativePath",
});

/**
 * Constructs a relative path of a given value, normalized.
 *
 * @param value The unnormalized value of the relative path.
 *
 * @return The constructed relative path.
 */
export const normalizedRelativePath = (value: string): RelativePath =>
	relativePath(normalize(value));
