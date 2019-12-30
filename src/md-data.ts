import { Set, ValueObject } from "immutable";

import { DataParserModule, mergeParsers, slugify } from "./fs-data";
import { Extension, extensionValueObjectSet } from "./fs-extension";
import { mainFileContents, parseFileContentsMatterData } from "./md-matter";
import { parseTableOfContentsData } from "./md-toc";

export const mdExtensions: Set<Extension &
	ValueObject> = extensionValueObjectSet([".md", ".markdown"]);

export const mdFileDataParser: DataParserModule = {
	extensions: mdExtensions,
	parser: mergeParsers(
		parseFileContentsMatterData,
		parseTableOfContentsData(mainFileContents)(slugify),
	),
};
