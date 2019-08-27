import { assert } from "chai";
import { Map } from "immutable";

import {
	directory,
	file,
	fileToString,
	fileToValueObject,
} from "../src/fs-entry";
import { path } from "../src/fs-path";
import {
	declaredLocaleFilesByLocaleCode,
	localeCodeFromToken,
	localeCodeToString,
	localeCodeToValueObject,
} from "../src/locale";

describe("declaredLocaleFilesByLocaleCode", () => {
	const anyDirectory = directory(path("directory"));
	const testCases = [
		{
			files: ["fr-CA.yml", "en-CA.yml"],
			expected: [["fr-CA", "fr-CA.yml"], ["en-CA", "en-CA.yml"]],
		},
		{
			files: ["fr-CA.yml", "en-CA.yml", "not-a-locale.json"],
			expected: [["fr-CA", "fr-CA.yml"], ["en-CA", "en-CA.yml"]],
		},
	].map(({ files, expected }) => ({
		directoryReader: () =>
			files
				.map(path)
				.map(file)
				.map(fileToValueObject),
		expected: Map(
			expected.map(([name, baseName]) => [
				localeCodeToValueObject(localeCodeFromToken(name)),
				fileToValueObject(file(path(baseName))),
			]),
		),
	}));
	const throwingTestCases = [
		{
			files: ["fr-CA.yml", "fr-CA.json"],
		},
		{
			files: ["fr-CA.yml", "en-CA.yml", "en-CA.json"],
		},
		{
			files: ["fr-CA.yml", "not-a-locale.json", "en-CA.yml", "en-CA.json"],
		},
	].map(({ files }) => ({
		directoryReader: () => files.map(path).map(file),
	}));
	for (const { directoryReader, expected } of testCases) {
		it(`yields "${expected
			.toArray()
			.map(
				([localeCode, file]) =>
					`${localeCodeToString(localeCode)}->${fileToString(file)}`,
			)
			.join(";")}" for files "${directoryReader()
			.map(fileToString)
			.join(";")}"`, () => {
			assert.isTrue(
				declaredLocaleFilesByLocaleCode(directoryReader)(anyDirectory).equals(
					expected,
				),
			);
		});
	}
	for (const { directoryReader } of throwingTestCases) {
		it(`throws for files "${directoryReader()
			.map(fileToString)
			.join(";")}"`, () => {
			assert.throws(() =>
				declaredLocaleFilesByLocaleCode(directoryReader)(anyDirectory),
			);
		});
	}
});
