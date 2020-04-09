import { File, fileToString, file } from "./../../src/file";
import { Directory, directoryToString, directory } from "./../../src/directory";
import { Entry } from "./../../src/entry";
import { normalizedAbsolutePath } from "../../src/absolutePath";

interface TestCase {
	readonly entry: Entry;
	readonly throws: boolean;
	readonly expected: unknown;
}

interface TestScenario {
	readonly directory: (directory: Directory) => unknown;
	readonly file: (file: File) => unknown;
	readonly cases: TestCase[];
}

module.exports = [
	((): TestScenario => {
		const directoryFunction = (directory: Directory): string =>
			`Directory: ${directoryToString(directory)}`;
		const fileFunction = (file: File): string =>
			`File: ${fileToString(file)}`;
		const cases = [
			{
				path: "/",
				type: "Directory",
				description: "calls the directory function on directories",
			},
			{
				path: "/directory",
				type: "Directory",
				description: "calls the directory function on directories",
			},
			{
				path: "/file.txt",
				type: "File",
				description: "calls the file function on files",
			},
			{
				path: "/directory/data.json",
				type: "File",
				description: "calls the file function on files",
			},
			{
				type: "Error",
				description: "throws on unmatched objects",
			},
		];
		return {
			directory: directoryFunction,
			file: fileFunction,
			cases: cases.map(({ path, type, description }) => ({
				description,
				entry: ((): File | Directory | null => {
					switch (type) {
						case "Error":
							return null;
						case "File":
							return file(normalizedAbsolutePath(path));
						case "Directory":
							return directory(normalizedAbsolutePath(path));
					}
				})(),
				throws: type === "Error",
				expected: ((): unknown => {
					switch (type) {
						case "Error":
							return null;
						case "File":
							return fileFunction(
								file(normalizedAbsolutePath(path)),
							);
						case "Directory":
							return directoryFunction(
								directory(normalizedAbsolutePath(path)),
							);
					}
				})(),
			})),
		};
	})(),
];
