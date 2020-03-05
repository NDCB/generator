import { iterableToString } from "../src/iterable";

describe("iterableToString", () => {
	for (const {
		input,
		stringify,
		delimiter,
		expected,
	} of require("./fixtures/iterableToString")) {
		test(`returns "${expected}" for input "${input}"`, () => {
			expect(iterableToString(input, stringify, delimiter)).toBe(
				expected,
			);
		});
	}
});
