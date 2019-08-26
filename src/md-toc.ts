import { Stack } from "immutable";

import { Data } from "./fs-data";
import { FileContents } from "./fs-reader";

export interface Heading extends Data {
	readonly level: number;
	readonly heading: string;
	readonly slug: string;
	readonly sections: Heading[];
}

// https://spec.commonmark.org/0.29/#atx-headings
export const atxHeadingRegExp: RegExp = /^[ ]{0,3}(#{1,6})[ \t]+(.*?)([ ]+#*)?$/gm;

export const headings = (slugify: (token: string) => string) => (
	mainContents: string,
): Heading[] => {
	const headings: Heading[] = [];
	let match;
	do {
		match = atxHeadingRegExp.exec(mainContents);
		if (match) {
			headings.push({
				level: match[1].length,
				heading: match[2],
				slug: slugify(match[2]),
				sections: [],
			});
		}
	} while (match);
	return headings;
};

export const normalizedHeadingsFromList = <
	T extends { readonly level: number }
>(
	headings: T[],
): T[] => {
	// Normalize heading levels to be the successor of the parent
	let parentLevel = 0;
	headings.forEach((heading, index) => {
		if (heading.level > parentLevel + 1) {
			headings[index] = { ...heading, level: parentLevel + 1 };
		}
		parentLevel = headings[index].level;
	});
	// Ensure single root
	const otherRoot = headings.findIndex(
		(heading, index) => index >= 1 && heading.level === 1,
	);
	if (otherRoot >= 1) {
		// Increment headings to maximum under other roots
		for (let i = otherRoot; i < headings.length; i++) {
			const heading = headings[i];
			headings[i] = {
				...heading,
				level: heading.level + 1,
			};
		}
	}
	// Clamp headings to maximum
	headings.forEach((heading, index) => {
		if (heading.level > 6) {
			headings[index] = { ...heading, level: 6 };
		}
	});
	return headings;
};

export const tableOfContents = (slugify: (token: string) => string) => (
	mainContents: string,
): Heading => {
	const items: Heading[] = normalizedHeadingsFromList(
		headings(slugify)(mainContents),
	);
	const parents = Stack<Heading>().asMutable();
	for (const heading of items) {
		if (!parents.isEmpty()) {
			while (parents.peek().level !== heading.level - 1) {
				parents.pop();
			}
			parents.peek().sections.push(heading);
		}
		parents.push(heading);
	}
	return parents.last();
};

export const parseTableOfContentsData = (
	mainContents: (contents: FileContents) => string,
) => (slugify: (token: string) => string) => (
	contents: FileContents,
): Data => ({
	tableOfContents: tableOfContents(slugify)(mainContents(contents)),
});
