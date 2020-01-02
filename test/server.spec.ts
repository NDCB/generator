import { assert } from "chai";

import { pathname, pathnameEquals, pathnameToString } from "../src/fs-site";
import { requestUrlToPathname } from "../src/server";

describe("requestUrlToPathname", () => {
	const testCases = [
		{
			url: "/",
			expected: "",
		},
		{
			url: "/?ignored=true",
			expected: "",
		},
		{
			url: "/article.html",
			expected: "article.html",
		},
		{
			url: "/article.html?ignored=true",
			expected: "article.html",
		},
		{
			url: "/directory/article.html",
			expected: "directory/article.html",
		},
		{
			url: "/directory/article.html?ignored=true",
			expected: "directory/article.html",
		},
	].map(({ url, expected }) => ({ url, expected: pathname(expected) }));
	for (const { url, expected } of testCases) {
		it(`yields "${pathnameToString(expected)}" for server URL "${url}"`, () => {
			assert.isTrue(pathnameEquals(requestUrlToPathname(url), expected));
		});
	}
});
