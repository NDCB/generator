import consola from "consola";
import ignore from "ignore";

import {
	Directory,
	directoryHasDescendent,
	directoryToString,
	Entry,
	entryBaseName,
	entryRelativePath,
	File,
	fileExists,
	fileInDirectory,
	fileToString,
	matchEntry,
	parentDirectory,
	upwardDirectoriesUntil,
} from "./fs-entry";
import {
	Extension,
	extensionToString,
	fileExtension,
	fileHasAnyExtension,
	fileHasExtension,
} from "./fs-extension";
import { FileContents, fileContentsToString } from "./fs-reader";

export const logger = consola.withTag("fs-ignore");

export const logFileIgnoredForHavingExtension = (file: File): void =>
	logger.info(
		`File "${fileToString(file)}" ignored for having extension ` +
			`"${extensionToString(fileExtension(file))}"`,
	);

export const logFileIgnoredForEntryLeadingUnderscoreCause = (cause: Entry) => (
	file: File,
) =>
	logger.info(
		matchEntry<string>({
			file: () =>
				`File "${fileToString(
					file,
				)}" ignored for having a leading underscore in its base name`,
			directory: (cause: Directory) =>
				`File "${fileToString(
					file,
				)}" ignored for being in directory "${directoryToString(
					cause,
				)}" with a leading underscore in its base name`,
		})(cause),
	);

export const logFileIgnoredByGitignore = (gitignoreFile: File) => (
	file: File,
): void =>
	logger.info(
		`File "${fileToString(file)}" ignored by gitignore file "${fileToString(
			gitignoreFile,
		)}"`,
	);

export const ifRuleAppliesToFile = (
	applies: (file: File) => boolean,
	rule: (file: File) => boolean,
) => (file: File): boolean => applies(file) && rule(file);

export const forFirstRuleThatAppliesToFile = (
	...criteria: Array<{
		applies: (file: File) => boolean;
		rule: (file: File) => boolean;
	}>
) => (file: File): boolean => {
	const criterion = criteria.find(({ applies }) => applies(file));
	if (!criterion) {
		return false;
	}
	return criterion.rule(file);
};

export const logIfFileIgnored = (
	logger: (file: File) => void,
	isFileIgnored: (file: File) => boolean,
) => (file: File): boolean => {
	const isIgnored = isFileIgnored(file);
	if (isIgnored) {
		logger(file);
	}
	return isIgnored;
};

export const ignoreExtension: (
	extension: Extension,
) => (file: File) => boolean = fileHasExtension;

export const ignoreExtensionWithLogging = (extension: Extension) =>
	logIfFileIgnored(
		logFileIgnoredForHavingExtension,
		ignoreExtension(extension),
	);

export const ignoreExtensions: (
	extensions: Iterable<Extension>,
) => (file: File) => boolean = fileHasAnyExtension;

export const ignoreExtensionsWithLogging = (extensions: Iterable<Extension>) =>
	logIfFileIgnored(
		logFileIgnoredForHavingExtension,
		ignoreExtensions(extensions),
	);

export const entryHasLeadingUnderscore = (entry: Entry): boolean =>
	entryBaseName(entry).startsWith("_");

export const ignoreLeadingUnderscore = (
	upwardDirectories: (file: File) => Iterable<Directory>,
) => (file: File): boolean =>
	[file, ...upwardDirectories(file)].some(entryHasLeadingUnderscore);

export const ignoreLeadingUnderscoreWithLogging = (
	upwardDirectories: (file: File) => Iterable<Directory>,
) => (file: File): boolean => {
	const cause: Entry = [file, ...upwardDirectories(file)].find(
		entryHasLeadingUnderscore,
	);
	if (cause) {
		logFileIgnoredForEntryLeadingUnderscoreCause(cause)(file);
	}
	return !!cause;
};

export const gitignoreFile = (directory: Directory): File =>
	fileInDirectory(directory)(".gitignore");

/**
 * @postcondition fileExists(gitignoreFile(directory))
 */
export const hasGitignoreFile = (directory: Directory): boolean =>
	fileExists(gitignoreFile(directory));

export const ignoreUsingGitignore = (
	fileReader: (file: File) => FileContents,
) => (gitignoreFile: File) => {
	const rules = ignore().add(fileContentsToString(fileReader(gitignoreFile)));
	const root = parentDirectory(gitignoreFile);
	const pathname: (file: File) => string = entryRelativePath(root);
	return ifRuleAppliesToFile(
		directoryHasDescendent(root),
		(file: File): boolean => rules.ignores(pathname(file)),
	);
};

export const ignoreUsingGitignoreWithLogging = (
	fileReader: (file: File) => FileContents,
) => (gitignoreFile: File) =>
	logIfFileIgnored(
		logFileIgnoredByGitignore(gitignoreFile),
		ignoreUsingGitignore(fileReader)(gitignoreFile),
	);

export const compositeIgnore = (...rules: Array<(file: File) => boolean>) => (
	file: File,
): boolean => rules.some((rule) => rule(file));

export const ignoreLeadingUnderscoreFromRoots = (
	...roots: Directory[]
): ((file: File) => boolean) =>
	forFirstRuleThatAppliesToFile(
		...roots.map((root) => ({
			applies: directoryHasDescendent(root),
			rule: ignoreLeadingUnderscore(upwardDirectoriesUntil(root)),
		})),
	);

export const ignoreLeadingUnderscoreFromRootsWithLogging = (
	...roots: Directory[]
): ((file: File) => boolean) =>
	forFirstRuleThatAppliesToFile(
		...roots.map((root) => ({
			applies: directoryHasDescendent(root),
			rule: ignoreLeadingUnderscoreWithLogging(upwardDirectoriesUntil(root)),
		})),
	);
