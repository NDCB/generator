import consola from "consola";

import { hash, Map, OrderedSet, Seq, Set, ValueObject } from "immutable";

import dayjs from "dayjs";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
dayjs.extend(LocalizedFormat);

import isoCountries from "i18n-iso-countries";
import isoLanguages from "iso-639-1";

import { sprintf, vsprintf } from "sprintf-js";

import { Data } from "./fs-data";
import {
	Directory,
	directoryToString,
	Entry,
	entryBaseName,
	entryIsFile,
	File,
	fileEquals,
	fileName,
	fileToValueObject,
} from "./fs-entry";
import { baseName, Path } from "./fs-path";
import { Pathname, pathnameBaseName } from "./fs-site";
import { isNumber, isObject, isString, strictEquals } from "./util";

export const logger = consola.withTag("locale");

export interface CountryCode {
	readonly _tag: "CountryCode";
	readonly value: string;
}

export const isValidCountryCodeToken = (token: string): boolean =>
	/^[A-Z]{2}$/.test(token) && isoCountries.isValid(token);

/**
 * @precondition isValidCountryCodeToken(value)
 */
export const countryCode = (value: string): CountryCode => ({
	_tag: "CountryCode",
	value,
});

export const isCountryCode = (element: any): element is CountryCode =>
	!!element && strictEquals(element._tag, "CountryCode");

export const countryCodeEquals = (c1: CountryCode, c2: CountryCode): boolean =>
	strictEquals(c1.value, c2.value);

export const countryCodeToString = (code: CountryCode): string => code.value;

export const countryCodeToValueObject = (
	code: CountryCode,
): CountryCode & ValueObject => ({
	...code,
	equals: (other) => isCountryCode(other) && countryCodeEquals(other, code),
	hashCode: () => hash(countryCodeToString(code)),
});

export interface LanguageCode {
	readonly _tag: "LanguageCode";
	readonly value: string;
}

export const isValidLanguageCodeToken = (token: string): boolean =>
	/^[a-z]{2}$/.test(token) && isoLanguages.validate(token);

/**
 * @precondition isValidLanguageCodeToken(value)
 */
export const languageCode = (value: string): LanguageCode => ({
	_tag: "LanguageCode",
	value,
});

export const isLanguageCode = (element: any): element is LanguageCode =>
	!!element && strictEquals(element._tag, "LanguageCode");

export const languageCodeEquals = (
	l1: LanguageCode,
	l2: LanguageCode,
): boolean => strictEquals(l1.value, l2.value);

export const languageCodeToString = (code: LanguageCode): string => code.value;

export const languageCodeToValueObject = (
	code: LanguageCode,
): LanguageCode & ValueObject => ({
	...code,
	equals: (other) => isLanguageCode(other) && languageCodeEquals(other, code),
	hashCode: () => hash(languageCodeToString(code)),
});

export interface LocaleCode {
	readonly _tag: "LocaleCode";
	readonly language: LanguageCode;
	readonly country: CountryCode;
}

export const localeCode = (
	language: LanguageCode,
	country: CountryCode,
): LocaleCode => ({ _tag: "LocaleCode", language, country });

export const isValidLocaleCodeToken = (token: string): boolean => {
	if (/^[a-z]{2}-[A-Z]{2}$/.test(token)) {
		const tokens = token.split("-");
		return (
			isValidLanguageCodeToken(tokens[0]) && isValidCountryCodeToken(tokens[1])
		);
	}
	return false;
};

export const localeToken = (
	language: LanguageCode,
	country: CountryCode,
): string =>
	`${languageCodeToString(language)}-${countryCodeToString(country)}`;

/**
 * @precondition isValidLanguageCode(language) && isValidCountryCode(country)
 */
export const parseLanguageAndCountryCodesFromTokens = (
	language: string,
	country: string,
): [LanguageCode, CountryCode] => [
	languageCode(language),
	countryCode(country),
];

/**
 * @precondition isValidLocaleCodeToken(token)
 */
export const parseLanguageAndCountryCodesFromLocaleToken = (
	token: string,
): [LanguageCode, CountryCode] => {
	const tokens = token.split("-");
	return parseLanguageAndCountryCodesFromTokens(tokens[0], tokens[1]);
};

export const localeCodeByLanguageAndCountryCodes = ([language, country]: [
	LanguageCode,
	CountryCode,
]): LocaleCode => localeCode(language, country);

/**
 * @precondition isValidLocaleCodeToken(token)
 */
export const localeCodeFromToken = (token: string): LocaleCode =>
	localeCodeByLanguageAndCountryCodes(
		parseLanguageAndCountryCodesFromLocaleToken(token),
	);

export const isLocaleCode = (element: any): element is LocaleCode =>
	!!element && strictEquals(element._tag, "LocaleCode");

export const localeCodeEquals = (l1: LocaleCode, l2: LocaleCode): boolean =>
	languageCodeEquals(l1.language, l2.language) &&
	countryCodeEquals(l1.country, l2.country);

export const localeCodeToString = (code: LocaleCode): string =>
	localeToken(code.language, code.country);

export const localeCodeToValueObject = (
	code: LocaleCode,
): LocaleCode & ValueObject => ({
	...code,
	equals: (other) => isLocaleCode(other) && localeCodeEquals(other, code),
	hashCode: () => hash(localeCodeToString(code)),
});

export const declaredLocaleFilesByLocaleCode = (
	directoryReader: (directory: Directory) => Iterable<Entry>,
) => (localesDirectory: Directory): Map<LocaleCode & ValueObject, File> => {
	const localeFiles = Seq(directoryReader(localesDirectory))
		.filter(entryIsFile)
		.filter((file) => isValidLocaleCodeToken(fileName(file)))
		.map(fileToValueObject)
		.toSet();
	if (localeFiles.count() > localeFiles.map((file) => fileName(file)).count()) {
		const conflictingFiles = localeFiles
			.toSeq()
			.flatMap((f1) => localeFiles.map((f2) => [f1, f2]))
			.filter(([f1, f2]) => !fileEquals(f1, f2))
			.filter(([f1, f2]) => strictEquals(fileName(f1), fileName(f2)))
			.map(([f1, f2]) => `(${entryBaseName(f1)}:${entryBaseName(f2)})`);
		throw new Error(
			`Conflicting locale files by name "${conflictingFiles.join(
				";",
			)}" in directory "${directoryToString(localesDirectory)}"`,
		);
	}
	return localeFiles
		.toMap()
		.mapKeys((file) =>
			localeCodeToValueObject(localeCodeFromToken(fileName(file))),
		);
};

export const isValidMultiplicityToken = (token: string): boolean =>
	/^ *(((-?\d+\.?\d*)\.\.(-?\d+\.?\d*|\*))|(-?\d+\.?\d*)) *$/.test(token);

/**
 * @precondition isValidMultiplicityToken(token)
 */
export const parseMultiplicityToken = (token: string) => {
	const tokens = token.split("..").map((value) => value.trim());
	const minimumIncluded = parseFloat(tokens[0]);
	const maximumExcluded =
		tokens.length > 1
			? strictEquals(tokens[1], "*")
				? Infinity
				: parseFloat(tokens[1])
			: Math.floor(minimumIncluded + 1);
	if (maximumExcluded < minimumIncluded) {
		throw new Error(
			`Multiplicity token "${token}" which parses to ` +
				`[${minimumIncluded},${maximumExcluded}) does not admit any values.`,
		);
	}
	return (value: number): boolean =>
		minimumIncluded <= value && value < maximumExcluded;
};

export const parseSimplePhraseTemplates = (data: Data): Map<string, string> =>
	Map<string, string>().withMutations((map) => {
		Object.keys(data)
			.filter((phrase) => isString(data[phrase]))
			.forEach((phrase) => map.set(phrase, data[phrase] as string));
	});

export const parseQuantifiedPhraseTemplates = (
	data: Data,
): Map<string, (quantity: number) => string> =>
	Set(Object.keys(data))
		.filter((phrase) => isObject(data[phrase]))
		.toMap()
		.map((phrase) =>
			OrderedSet(Object.keys(data[phrase]))
				.filter((token) => isString(data[phrase][token]))
				.toMap()
				.mapKeys(parseMultiplicityToken)
				.map((token) => data[phrase][token]),
		)
		.map((templateByMultiplicity) => (quantity: number) =>
			templateByMultiplicity.find((_, test) => test(quantity)),
		);

export const parsePhraseTemplates = (
	data: Data,
): {
	simplePhrases: Map<string, string>;
	quantifiedPhrases: Map<string, (quantity: number) => string>;
} => ({
	simplePhrases: parseSimplePhraseTemplates(data),
	quantifiedPhrases: parseQuantifiedPhraseTemplates(data),
});

export const localizeMoment = (code: LocaleCode) => {
	const { language, country } = code;
	const languageCode = languageCodeToString(language);
	const countryCode = countryCodeToString(country);
	let localeToken;
	try {
		localeToken = `${languageCode}-${countryCode.toLowerCase()}`;
		require(`dayjs/locale/${localeToken}`);
	} catch {
		try {
			localeToken = `${languageCode}`;
			require(`dayjs/locale/${localeToken}`);
		} catch {
			throw new Error(
				`Unsupported moment locale with token "${localeCodeToString(code)}".`,
			);
		}
	}
	return (template?: string) => (moment?: string) =>
		dayjs(moment)
			.locale(localeToken)
			.format(template);
};

export const undefinedTemplate = (code: LocaleCode) => (
	template: string,
	quantity?: number,
): string =>
	isNumber(quantity)
		? `Undefined template "${template}" with quantity "${quantity}" ` +
		  `for locale "${localeCodeToString(code)}".`
		: `Undefined template "${template}" for locale "${localeCodeToString(
				code,
		  )}".`;

export const logUndefinedTemplate = (
	warn: (template: string, quantity?: number) => string,
) => (template: string, quantity?: number): string => {
	const warning = warn(template, quantity);
	logger.warn(warning);
	return warning;
};

export const localize = (
	warn: (template: string, quantity?: number) => string,
) => (
	code: LocaleCode,
	data: Data,
): {
	__: (template: string) => (...args) => string;
	__n: (template: string) => (quantity: number, ...args) => string;
	__m: (format?: string) => (moment?: string) => string;
} => {
	const { simplePhrases, quantifiedPhrases } = parsePhraseTemplates(data);
	return {
		__: (template: string) => (...args) =>
			vsprintf(simplePhrases.get(template, warn(template)), args),
		__n: (template: string) => (quantity: number, ...args) => {
			const quantifiedTemplate = quantifiedPhrases.get(template, () =>
				warn(template),
			)(quantity);
			if (!quantifiedTemplate) {
				return warn(template, quantity);
			}
			return sprintf(quantifiedTemplate, quantity, ...args);
		},
		__m: localizeMoment(code),
	};
};

export const localeCodeFromPathname = (
	upwardPathnames: (pathname: Pathname) => Iterable<Pathname>,
) => (pathname: Pathname): LocaleCode | null => {
	const token = Seq(upwardPathnames(pathname))
		.map(pathnameBaseName)
		.find(isValidLocaleCodeToken);
	return token ? localeCodeFromToken(token) : null;
};

export const localeCodeFromPath = (
	upwardPaths: (path: Path) => Iterable<Path>,
) => (path: Path): LocaleCode | null => {
	const token = Seq(upwardPaths(path))
		.map(baseName)
		.find(isValidLocaleCodeToken);
	return token ? localeCodeFromToken(token) : null;
};
