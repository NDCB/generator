import { Set, ValueObject } from "immutable";
import { safeLoad } from "js-yaml";

import { Data, DataParserModule } from "./fs-data";
import { Extension, extensionValueObjectSet } from "./fs-extension";
import { FileContents, fileContentsToString } from "./fs-reader";

export const parseYmlData = (token: string): Data => safeLoad(token);

export const parseYmlFileData = (contents: FileContents): Data =>
	parseYmlData(fileContentsToString(contents));

export const ymlExtensions: Set<
	Extension & ValueObject
> = extensionValueObjectSet([".yml", ".yaml"]);

export const ymlFileDataParser: DataParserModule = {
	extensions: ymlExtensions,
	parser: parseYmlFileData,
};
