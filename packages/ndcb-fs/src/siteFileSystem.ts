import { Directory } from "./directory";
import { Entry } from "./entry";
import { File } from "./file";
import { FileContents } from "./fileReader";
import { RelativePath } from "./relativePath";

export interface SiteFileSystem {
	files: () => Iterable<File>;
	readFile: (relativePath: RelativePath) => FileContents | null;
	readDirectory: (relativePath: RelativePath) => Iterable<Entry>;
	sourceFile: (relativePath: RelativePath) => File | null;
	sourceDirectory: (relativePath: RelativePath) => Directory | null;
	inheritedFiles: (
		inheritor: Entry,
		relativePath?: RelativePath,
	) => Iterable<File>;
	destinationFileRelativePath: (source: File) => RelativePath;
}
