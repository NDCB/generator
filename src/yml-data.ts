import { safeLoad } from "js-yaml";
import { FileData, fileData } from "./data.bak";
import { Data } from "./fs-data";
import { FileContents, fileContentsToString } from "./fs-reader";

export const parseYmlData = (token: string): Data => safeLoad(token);

export const parseYmlFileData = (contents: FileContents): FileData =>
	fileData(parseYmlData(fileContentsToString(contents)));
