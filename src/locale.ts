import { hash, Map, Seq, Set, ValueObject } from "immutable";

import {
	Directory,
	directoryToString,
	Entry,
	entryBaseName,
	entryIsFile,
	File,
	fileEquals,
	fileName,
} from "./fs-entry";
import { strictEquals } from "./util";

export interface CountryCode {
	readonly _tag: "CountryCode";
	readonly value: string;
}

export const isValidCountryCodeToken = (token: string): boolean =>
	/^[A-Z]{2}$/.test(token);

/**
 * @precondition isValidCountryCodeToken(value)
 */
export const countryCode = (value: string): CountryCode => ({
	_tag: "CountryCode",
	value,
});

export const isCountryCode = (element: any): element is CountryCode =>
	!!element && element._tag === "CountryCode";

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
	/^[a-z]{2}$/.test(token);

/**
 * @precondition isValidLanguageCodeToken(value)
 */
export const languageCode = (value: string): LanguageCode => ({
	_tag: "LanguageCode",
	value,
});

export const isLanguageCode = (element: any): element is LanguageCode =>
	!!element && element._tag === "LanguageCode";

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

export const isValidLocaleCodeToken = (token: string): boolean =>
	/^[a-z]{2}-[A-Z]{2}$/.test(token);

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
	!!element && element._tag === "LocaleCode";

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
		.mapKeys((_, file) =>
			localeCodeToValueObject(localeCodeFromToken(fileName(file))),
		);
};
