import {
  File,
  normalizedFile,
  Directory,
  normalizedDirectory,
  Entry,
} from "@ndcb/fs-util";
import { sequence } from "@ndcb/util";

export enum Expected {
  FILE,
  DIRECTORY,
}

export interface TestCase<D, F> {
  pattern: {
    directory: (directory: Directory) => D;
    file: (file: File) => F;
  };
  cases: sequence.Sequence<{
    entry: Entry | null;
    throws: boolean;
    expected: null | D | F;
    description: string;
  }>;
}

export default [
  {
    pattern: {
      directory: (): Expected => Expected.DIRECTORY,
      file: (): Expected => Expected.FILE,
    },
    cases: [
      {
        entry: normalizedDirectory("/"),
        throws: false,
        expected: Expected.DIRECTORY,
        description: "calls the directory function on directories",
      },
      {
        entry: normalizedDirectory("/directory"),
        throws: false,
        expected: Expected.DIRECTORY,
        description: "calls the directory function on directories",
      },
      {
        entry: normalizedFile("/file.txt"),
        throws: false,
        expected: Expected.FILE,
        description: "calls the file function on files",
      },
      {
        entry: normalizedFile("/directory/data.json"),
        throws: false,
        expected: Expected.FILE,
        description: "calls the file function on files",
      },
    ],
  },
  {
    pattern: {
      directory: (): null => null,
      file: (): null => null,
    },
    cases: [
      {
        entry: null,
        throws: true,
        expected: null,
        description: "throws on unmatched objects",
      },
    ],
  },
] as sequence.Sequence<TestCase<unknown, unknown>>;
