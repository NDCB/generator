import { writeFileSync } from "fs";

import { absolutePathToString } from "./absolutePath";
import { File, fileToPath } from "./file";
import { FileContents, fileContentsToString } from "./fileContents";

export type FileWriter = (file: File, contents: FileContents) => void;

export const writeFile: FileWriter = (
	file: File,
	contents: FileContents,
): void =>
	writeFileSync(
		absolutePathToString(fileToPath(file)),
		fileContentsToString(contents),
	);
