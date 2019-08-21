import { Data } from "./fs-data";
import { FileContents, fileContentsToString } from "./fs-reader";
import { parseYmlData } from "./yml-data";

export const matterTokenRegExp: RegExp = /(?<=-{3}\r?\n)[^]*?(?=\r?\n-{3})/;

export const delimitedMatterRegExp: RegExp = /(?<=-{3}\r?\n[^]*\r?\n-{3}\r?\n)[^]*/;

export const hasMatter = (contents: string): boolean =>
	matterTokenRegExp.test(contents);

export const matterToken = (contents: string): string =>
	matterTokenRegExp.exec(contents)[0];

export const parseMatterTokenData = (token: string): Data =>
	parseYmlData(token);

export const mainContents = (contents: string) =>
	contents.replace(delimitedMatterRegExp, "");

export const mainFileContents = (contents: FileContents): string =>
	mainContents(fileContentsToString(contents));

export const parseMatterData = (contents: string): Data =>
	hasMatter(contents) ? parseMatterTokenData(matterToken(contents)) : {};

export const parseFileContentsMatterData = (contents: FileContents): Data =>
	parseMatterData(fileContentsToString(contents));
