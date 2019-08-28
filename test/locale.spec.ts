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
	isValidMultiplicityToken,
	localeCodeFromToken,
	localeCodeToString,
	localeCodeToValueObject,
	parseMultiplicityToken,
	parseQuantifiedPhraseTemplates,
	parseSimplePhraseTemplates,
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

describe("isValidMultiplicityToken", () => {
	const testCases = [
		{
			token: "",
			expected: false,
		},
		{
			token: "0",
			expected: true,
		},
		{
			token: "10",
			expected: true,
		},
		{
			token: "0..1",
			expected: true,
		},
		{
			token: "10..20",
			expected: true,
		},
		{
			token: "0..*",
			expected: true,
		},
		{
			token: "-5..*",
			expected: true,
		},
		{
			token: "-50..*",
			expected: true,
		},
		{
			token: "-50..-10",
			expected: true,
		},
		{
			token: "-5..-1",
			expected: true,
		},
		{
			token: "10..*",
			expected: true,
		},
		{
			token: "*..0",
			expected: false,
		},
		{
			token: "0...",
			expected: false,
		},
	];
	for (const { token, expected } of testCases) {
		it(`is ${expected} for token "${token}"`, () => {
			assert.strictEqual(isValidMultiplicityToken(token), expected);
		});
	}
});

describe("parseMultiplicityToken", () => {
	const testCases = [
		{
			token: "0",
			included: [0, 0.1, 0.5, 0.9],
			excluded: [-1, -0.5, -0.1, 1, 1.1, 1.5, 2],
		},
		{
			token: "0.5",
			included: [0.5, 0.6, 0.7, 0.9],
			excluded: [-1, -0.5, -0.1, 1, 1.1, 1.5, 2],
		},
		{
			token: "0.5..1.5",
			included: [0.5, 0.6, 0.7, 0.9, 1, 1.4],
			excluded: [-1, -0.5, -0.1, 1.5, 2],
		},
		{
			token: "0..1",
			included: [0, 0.1, 0.5, 0.9],
			excluded: [-1, -0.5, -0.1, 1, 1.1, 1.5, 2],
		},
		{
			token: "  0..1",
			included: [0, 0.1, 0.5, 0.9],
			excluded: [-1, -0.5, -0.1, 1, 1.1, 1.5, 2],
		},
		{
			token: "-1..1",
			included: [-1, -0.5, -0.1, 0, 0.1, 0.5, 0.9],
			excluded: [-2, -1.5, -1.1, 1, 1.1, 1.5, 2],
		},
		{
			token: "-1..1   ",
			included: [-1, -0.5, -0.1, 0, 0.1, 0.5, 0.9],
			excluded: [-2, -1.5, -1.1, 1, 1.1, 1.5, 2],
		},
		{
			token: "-5..-1",
			included: [-5, -4, -3, -2],
			excluded: [-7, -6, -1],
		},
		{
			token: "0..*",
			included: [0, 1, 10, 100, 1000],
			excluded: [-10, -5, -1],
		},
		{
			token: "    0..*   ",
			included: [0, 1, 10, 100, 1000],
			excluded: [-10, -5, -1],
		},
	];
	const throwingTestCases = [
		{
			token: "1..0",
		},
		{
			token: "10..-1",
		},
		{
			token: "-10..-120",
		},
	];
	for (const { token, included, excluded } of testCases) {
		context(`with multiplicity token "${token}"`, () => {
			const predicate = parseMultiplicityToken(token);
			for (const value of included) {
				it(`includes ${value}`, () => {
					assert.isTrue(predicate(value));
				});
			}
			for (const value of excluded) {
				it(`excludes ${value}`, () => {
					assert.isFalse(predicate(value));
				});
			}
		});
	}
	for (const { token } of throwingTestCases) {
		it(`throws for token "${token}"`, () => {
			assert.throws(() => parseMultiplicityToken(token));
		});
	}
});

describe("parseSimplePhraseTemplates", () => {
	const testCases = [
		{
			data: {
				s1: "rs1",
				q1: { "0": "rq1:0..1", "1": "rq1:1..2" },
				s2: "rs2",
				q2: { "1": "rq2:1..2", "2..*": "rq2:2..*" },
			},
			expected: Map([["s1", "rs1"], ["s2", "rs2"]]),
		},
	];
	for (const { data, expected } of testCases) {
		it(`returns ${expected
			.toArray()
			.map(([template, phrase]) => `("${template}"->"${phrase}")`)
			.join(";")} for ${JSON.stringify(data)}`, () => {
			assert.isTrue(expected.equals(parseSimplePhraseTemplates(data)));
		});
	}
});

describe("parseQuantifiedPhraseTemplates", () => {
	const testCases = [
		{
			data: {
				s1: "rs1",
				q1: { "0": "rq1:0..1", "1": "rq1:1..2" },
				s2: "rs2",
				q2: { "1": "rq2:1..2", "2..*": "rq2:2..*" },
			},
			assertions: [
				{
					phrase: "q1",
					quantity: 0,
					template: "rq1:0..1",
				},
				{
					phrase: "q1",
					quantity: 1,
					template: "rq1:1..2",
				},
				{
					phrase: "q2",
					quantity: 1,
					template: "rq2:1..2",
				},
				{
					phrase: "q2",
					quantity: 2,
					template: "rq2:2..*",
				},
				{
					phrase: "q2",
					quantity: 5,
					template: "rq2:2..*",
				},
			],
		},
	];
	for (const { data, assertions } of testCases) {
		context(`with ${JSON.stringify(data)}`, () => {
			for (const { phrase, quantity, template } of assertions) {
				it(`returns "${template}" for "${phrase}" with quantity ${quantity}`, () => {
					assert.strictEqual(
						parseQuantifiedPhraseTemplates(data).get(phrase)(quantity),
						template,
					);
				});
			}
		});
	}
});
