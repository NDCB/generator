import { File, file, fileToString } from "./../../src/file";
import { directory, Directory, directoryToString } from "./../../src/directory";
import { Entry } from "./../../src/entry";
import { normalizedAbsolutePath } from "../../src/absolutePath";

interface TestCase<T = unknown> {
	readonly entry: Entry;
	readonly throws: false;
	readonly expected: T;
}

interface TestScenario<T = unknown> {
	readonly directory: (directory: Directory) => T;
	readonly file: (file: File) => T;
	readonly cases: Array<TestCase>;
}

module.exports = [
	((): TestScenario => {
		const directoryFunction = (directory: Directory): string =>
			`Directory: ${directoryToString(directory)}`;
		const fileFunction = (file: File): string =>
			`File: ${fileToString(file)}`;
		const cases: Array<{
			path: string;
			type: "Directory" | "File";
			description: string;
		}> = [
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
		];
		return {
			directory: directoryFunction,
			file: fileFunction,
			cases: cases.map(({ path, type, description }) => ({
				description,
				entry: ((): Entry => {
					switch (type) {
						case "File":
							return file(normalizedAbsolutePath(path));
						case "Directory":
							return directory(normalizedAbsolutePath(path));
					}
					throw new Error();
				})(),
				throws: false,
				expected: ((): unknown => {
					switch (type) {
						case "File":
							return fileFunction(
								file(normalizedAbsolutePath(path)),
							);
						case "Directory":
							return directoryFunction(
								directory(normalizedAbsolutePath(path)),
							);
					}
					throw new Error();
				})(),
			})),
		};
	})(),
	{
		directory: (): null => null,
		file: (): null => null,
		cases: [
			{
				throws: true,
				expected: null,
				description: "throws on unmatched objects",
			},
		],
	},
];
