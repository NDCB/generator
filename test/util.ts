import { assert } from "chai";
import { Seq } from "immutable";

export const iterableToString = <T>(stringify: (t: T) => string) => (
	iterable: Iterable<T>,
): string =>
	Seq(iterable)
		.map(stringify)
		.join(";");

export const assertArrayEquals = <T>(
	equals: (t1: T, t2: T) => boolean,
	stringifyElement: (t: T) => string,
) => (actual: T[], expected: T[]) => {
	const stringifyElements = (elements: T[]): string =>
		`"${elements.map(stringifyElement).join(";")}"`;
	const stringify = (): string =>
		`Actual: ${stringifyElements(actual)}, Expected: ${stringifyElements(
			expected,
		)}`;
	assert.strictEqual(
		actual.length,
		expected.length,
		`Actual and expected elements differ in length:\n${stringify()}`,
	);
	actual.forEach((expectedElement) =>
		assert.isDefined(
			expected.find((actualElement) => equals(actualElement, expectedElement)),
			`"${stringifyElement(expectedElement)}" is missing.\n${stringify()}`,
		),
	);
	expected.forEach((expectedElement, index) =>
		assert.isTrue(
			equals(expectedElement, actual[index]),
			`Element "${stringifyElement(
				expectedElement,
			)}" is out of order.\n${stringify()}`,
		),
	);
};
