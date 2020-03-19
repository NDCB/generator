import { sequence } from "@ndcb/util";

import { upwardRelativePaths, normalizedRelativePath } from "../src/path";

describe("upwardRelativePaths", () => {
	for (const {
		input,
		expected,
		description,
	} of require("./fixtures/upwardRelativePaths")) {
		test(description, () => {
			expect([
				...upwardRelativePaths(normalizedRelativePath(input)),
			]).toStrictEqual([
				...sequence(expected).map(normalizedRelativePath),
			]);
		});
	}
});
