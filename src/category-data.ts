import { Map, Seq } from "immutable";

import { Data } from "./fs-data";
import {
	directoryFromDirectory,
	File,
	fileFromDirectory,
	fileToString,
	fileToValueObject,
	parentDirectory,
} from "./fs-entry";
import { isArray, isString, isStringArray } from "./util";

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

export const subcategoriesKey = "subcategories";

export const properSubcategoriesData = (sourceFile: (file: File) => File) => (
	properData: (file: File) => Data,
) => (categoryFile: File, categoryData: Data): Iterable<Data> => {
	const fromCategoryDirectory = directoryFromDirectory(
		parentDirectory(categoryFile),
	);
	const subcategoriesRelativePaths = categoryData[subcategoriesKey] || [];
	if (!isStringArray(subcategoriesRelativePaths)) {
		throw new Error(
			`Expected the subcategories declared in file "${fileToString(
				categoryFile,
			)}" to be an array of strings but got "${subcategoriesRelativePaths}"`,
		);
	}
	return Seq(subcategoriesRelativePaths)
		.map((subcategory) => fromCategoryDirectory(subcategory))
		.map(fileFromDirectory)
		.map((toFileFromDirectory) => toFileFromDirectory("index.html"))
		.map(sourceFile)
		.map(fileToValueObject)
		.toOrderedSet()
		.map(properData);
};

export const allArticlesKey = "allArticles";

export const allArticles = (
	properArticles: Iterable<Data>,
	properSubcategories: Iterable<Data>,
): Iterable<Data> =>
	Seq(properArticles).concat(
		Seq(properSubcategories)
			.map((data) => data[allArticlesKey] || [])
			.flatten(),
	);

export const defaultMerger = (key: string) => (
	reduction: Data,
	current: Data,
): unknown => current[key] || reduction[key];

export const stringConcatenationMerger = (
	key: string,
	fallback = defaultMerger(key),
) => (reduction: Data, current: Data): unknown => {
	const reductionValue = reduction[key];
	const currentValue = current[key];
	return isString(reductionValue) && isString(currentValue)
		? reductionValue + currentValue
		: fallback(reduction, current);
};

export const arrayConcatenationMerger = (
	key: string,
	fallback = defaultMerger(key),
) => (reduction: Data, current: Data): unknown => {
	const reductionValue = reduction[key];
	const currentValue = current[key];
	return !isArray(reductionValue)
		? fallback(reduction, current)
		: reductionValue.concat(
				isArray(currentValue) ? currentValue : [currentValue],
		  );
};

export const keyedMerger = (
	mergers: Map<string, (reduction: Data, current: Data) => unknown>,
) => (reduction: Data, current: Data): Data => ({
	...current, // keys not in reduction
	...Map(reduction)
		.map((_, key) => mergers.get(key, defaultMerger(key))(reduction, current))
		.toJS(),
});
