import { Seq } from "immutable";

import { Data } from "./fs-data";
import {
	File,
	fileFromDirectory,
	fileToString,
	fileToValueObject,
	parentDirectory,
} from "./fs-entry";
import { isStringArray } from "./util";

export const articlesKey = "articles";

export const properArticlesData = (fileExists: (file: File) => boolean) => (
	properData: (file: File) => Data,
) => (categoryFile: File, categoryData: Data): Iterable<Data> => {
	const fromCategoryDirectory = fileFromDirectory(
		parentDirectory(categoryFile),
	);
	const articlesRelativePaths = categoryData[articlesKey] || [];
	if (!isStringArray(articlesRelativePaths)) {
		throw new Error(
			`Expected the articles declared in file "${fileToString(
				categoryFile,
			)}" to be an array of strings but got "${articlesRelativePaths}"`,
		);
	}
	const articleFiles = Seq(articlesRelativePaths)
		.map((article) => fromCategoryDirectory(article))
		.map(fileToValueObject)
		.toOrderedSet();
	if (!articleFiles.every(fileExists)) {
		throw new Error(
			`The following articles declared in file "${fileToString(
				categoryFile,
			)}" do not exist: ${articleFiles
				.filterNot(fileExists)
				.map(fileToString)
				.map((name) => `"${name}"`)
				.join()}`,
		);
	}
	return articleFiles.map(properData);
};
