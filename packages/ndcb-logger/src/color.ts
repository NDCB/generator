import chalk from "chalk";
const { keyword } = chalk;

export type ColorCode =
  | "black"
  | "red"
  | "green"
  | "yellow"
  | "blue"
  | "magenta"
  | "cyan"
  | "white"
  | "grey";

export const colorize = (code: ColorCode): ((token: string) => string) =>
  keyword(code);
