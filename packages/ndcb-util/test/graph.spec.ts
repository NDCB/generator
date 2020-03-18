import { depthFirstTreeTraversal } from "../src/graph";

describe("depthFirstTreeTraversal", () => {
	for (const {
		root,
		children,
		expected,
		description,
	} of require("./fixtures/depthFirstTreeTraversal")) {
		test(description, () => {
			expect([...depthFirstTreeTraversal(root, children)]).toStrictEqual(
				expected,
			);
		});
	}
});
