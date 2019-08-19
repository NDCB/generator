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
