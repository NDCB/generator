import { assert } from "chai";
import { hasMatter } from "../src/md-matter";

describe("hasMatter", () => {
	it("is true for contents containing a front-matter", () => {
		const contents = `---\ntitle: Title\n---\n# Title`;
		assert.isTrue(hasMatter(contents));
	});
	it("is false for contents that does not have a front-matter", () => {
		const contents = `# Title`;
		assert.isFalse(hasMatter(contents));
	});
});
