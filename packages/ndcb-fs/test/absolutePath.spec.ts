import { isUpwardPath, normalizedAbsolutePath } from "../src/absolutePath";

describe("isUpwardPath", () => {
	for (const { up, down, expected } of require("./fixtures/isUpwardPath")) {
		test(
			expected
				? `asserts that "${up}" is upwards from "${down}"`
				: `asserts that "${up}" is not upwards from "${down}"`,
			() => {
				expect(
					isUpwardPath(
						normalizedAbsolutePath(up),
						normalizedAbsolutePath(down),
					),
				).toBe(expected);
			},
		);
	}
});

describe("isUpwardPath reflexivity", () => {
	for (const path of require("./fixtures/isUpwardPath-reflexivity")) {
		test("is reflexive", () => {
			expect(
				isUpwardPath(
					normalizedAbsolutePath(path),
					normalizedAbsolutePath(path),
				),
			).toBe(true);
		});
	}
});

describe("isUpwardPath transitivity", () => {
	for (const { a, b, c } of require("./fixtures/isUpwardPath-transitivity")) {
		test("is transitive", () => {
			expect(
				isUpwardPath(
					normalizedAbsolutePath(a),
					normalizedAbsolutePath(b),
				),
			).toBe(true);
			expect(
				isUpwardPath(
					normalizedAbsolutePath(b),
					normalizedAbsolutePath(c),
				),
			).toBe(true);
			expect(
				isUpwardPath(
					normalizedAbsolutePath(a),
					normalizedAbsolutePath(c),
				),
			).toBe(true);
		});
	}
});
