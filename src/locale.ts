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
