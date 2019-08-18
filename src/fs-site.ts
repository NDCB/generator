import { Directory, directoryHasDescendent } from "./fs-entry";

export const rootsAreMutuallyExclusive = (...roots: Directory[]): boolean => {
	for (let i = 0; i < roots.length - 1; i++) {
		const predicate = directoryHasDescendent(roots[i]);
		for (let j = i + 1; j < roots.length; j++) {
			if (predicate(roots[j])) {
				return false;
			}
		}
	}
	return true;
};
