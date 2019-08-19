export interface Data {
	[key: string]:
		| null
		| boolean
		| string
		| number
		| Date
		| Data
		| Array<null | boolean | string | number | Date | Data>;
}

export interface FileData {
	readonly _tag: "FileData";
	readonly value: Data;
}

export const fileDataToData = (fileData: FileData): Data => fileData.value;
