import { Directory, directoryHasDescendent, File } from "./fs-entry";

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

export const filesInRoots = (
	downwardFilesReader: (directory: Directory) => Iterable<File>,
) =>
	function*(...roots: Directory[]): Iterable<File> {
		for (const root of roots) {
			yield* downwardFilesReader(root);
		}
	};

export const consideredFiles = (ignore: (file: File) => boolean) =>
	function*(files: Iterable<File>): Iterable<File> {
		for (const file of files) {
			if (!ignore(file)) {
				yield file;
			}
		}
	};
