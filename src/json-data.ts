import { Set, ValueObject } from "immutable";

import { Data, DataParserModule } from "./fs-data";
import { Extension, extensionValueObjectSet } from "./fs-extension";
import { FileContents, fileContentsToString } from "./fs-reader";

export const parseJsonData = (token: string): Data => JSON.parse(token);

export const parseJsonFileData = (contents: FileContents): Data =>
	parseJsonData(fileContentsToString(contents));

export const jsonExtensions: Set<Extension &
	ValueObject> = extensionValueObjectSet([".json"]);

export const jsonFileDataParser: DataParserModule = {
	extensions: jsonExtensions,
	parser: parseJsonFileData,
};
