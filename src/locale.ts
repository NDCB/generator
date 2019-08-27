import { hash, ValueObject } from "immutable";

import { strictEquals } from "./util";

export interface CountryCode {
	readonly _tag: "CountryCode";
	readonly value: string;
}

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

export const isValidCountryCodeToken = (token: string): boolean =>
	/^[A-Z]{2}$/.test(token);

export interface LanguageCode {
	readonly _tag: "LanguageCode";
	readonly value: string;
}

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

export const isValidLanguageCodeToken = (token: string): boolean =>
	/^[a-z]{2}$/.test(token);

export interface LocaleCode {
	readonly _tag: "LocaleCode";
	readonly language: LanguageCode;
	readonly country: CountryCode;
}

export const localeCode = (
	language: LanguageCode,
	country: CountryCode,
): LocaleCode => ({ _tag: "LocaleCode", language, country });

export const localeToken = (
	language: LanguageCode,
	country: CountryCode,
): string =>
	`${languageCodeToString(language)}-${countryCodeToString(country)}`;

export const isValidLocaleCodeToken = (token: string): boolean =>
	/^[a-z]{2}-[A-Z]{2}$/.test(token);

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
