import { isNumber } from "../src/type";

for (const { input, expected } of require("./fixtures/isNumber.json")) {
	test(`returns "${expected}" for input "${input}"`, () => {
		expect(isNumber(input)).toBe(expected);
	});
}
