import {
  function as fn,
  io,
  readonlyArray,
  taskEither,
  string,
  option,
  readonlyMap,
  readonlySet,
  array,
} from "fp-ts";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import {
  readFile,
  directoryReader,
  normalizedDirectory,
  directoryFilesReader,
  fileNameWithoutExtensions,
  fileExtensions,
  extensionEquals,
  extension,
  File,
  fileToString,
  Extension,
  textFileReader,
  directoryToString,
} from "@ndcb/fs-util";
import { sequence } from "@ndcb/util";

import YAML from "yaml";

import { parseFrontMatter } from "@ndcb/front-matter";

const readFixtureFile = textFileReader(readFile, "utf8");
const fixtures: readonly {
  name: string;
  inputFile: File;
  dataFile: File;
  outputFile: File;
}[] = await (() => {
  const mapFilesByName = readonlyMap.fromFoldable(
    string.Eq,
    {
      concat: (x: File) => x,
    },
    readonlyArray.Foldable,
  );
  const filter = <T>(
    desiredFirstExtension: Extension,
    desiredLastExtension: Extension,
  ) =>
    readonlyArray.filter<
      {
        file: File;
        extensions: readonly Extension[];
      } & T
    >(
      ({ file, extensions }) =>
        extensionEquals(
          desiredFirstExtension,
          fn.pipe(
            extensions,
            sequence.first,
            option.getOrElseW(() => {
              throw new Error(
                `Unexpectedly failed to get first extension for file "${fileToString(
                  file,
                )}"`,
              );
            }),
          ),
        ) &&
        extensionEquals(
          desiredLastExtension,
          fn.pipe(
            extensions,
            sequence.last,
            option.getOrElseW(() => {
              throw new Error(
                `Unexpectedly failed to get last extension for file "${fileToString(
                  file,
                )}"`,
              );
            }),
          ),
        ),
    );
  const filterFilesToMappedByName = (
    desiredFirstExtension: Extension,
    desiredLastExtension: Extension,
  ) =>
    fn.flow(
      filter(desiredFirstExtension, desiredLastExtension),
      readonlyArray.map<{ name: string; file: File }, [string, File]>(
        ({ name, file }) => [name, file],
      ),
      mapFilesByName,
    );
  const fixturesDirectory = fn.pipe(
    import.meta.url,
    fileURLToPath,
    dirname,
    (base) => resolve(base, "./fixtures"),
    normalizedDirectory,
  );
  const readDirectory = fn.pipe("utf8", directoryReader, directoryFilesReader);
  return fn.pipe(
    fixturesDirectory,
    readDirectory,
    io.map(
      fn.flow(
        taskEither.map(
          readonlyArray.map((file) => ({
            file,
            name: fileNameWithoutExtensions(file),
            extensions: fn.pipe(
              file,
              fileExtensions,
              sequence.toArray,
              array.reverse,
            ),
          })),
        ),
        taskEither.map((files) => ({
          inputFiles: fn.pipe(
            files,
            filterFilesToMappedByName(extension(".in"), extension(".md")),
          ),
          outputData: fn.pipe(
            files,
            filterFilesToMappedByName(extension(".out"), extension(".json")),
          ),
          outputContents: fn.pipe(
            files,
            filterFilesToMappedByName(extension(".out"), extension(".md")),
          ),
          testCaseNames: fn.pipe(
            files,
            readonlyArray.map(({ name }) => name),
            readonlySet.fromReadonlyArray(string.Eq),
          ),
        })),
        taskEither.map(
          ({ inputFiles, outputData, outputContents, testCaseNames }) =>
            fn.pipe(
              testCaseNames,
              readonlySet.toReadonlyArray(string.Ord),
              readonlyArray.map((name) => ({
                name,
                inputFile: inputFiles.get(name) as File,
                dataFile: outputData.get(name) as File,
                outputFile: outputContents.get(name) as File,
              })),
            ),
        ),
        taskEither.getOrElse((cause) => {
          throw new Error(
            `Unexpectedly failed to read fixtures directory ${directoryToString(
              fixturesDirectory,
            )}: ${cause}`,
          );
        }),
      ),
    ),
  )()();
})();

describe("parseFrontMatter", () => {
  for (const { name, inputFile, dataFile, outputFile } of fixtures) {
    test(name, async () => {
      const [input, data, contents] = await fn.pipe(
        [inputFile, dataFile, outputFile],
        readonlyArray.map((file) => readFixtureFile(file)()),
        taskEither.sequenceArray,
        taskEither.getOrElse((cause) => {
          throw cause;
        }),
      )();
      expect(
        await fn.pipe(
          input,
          parseFrontMatter((contents) =>
            taskEither.tryCatch(
              async () => YAML.parse(contents) ?? {},
              (error) => error as Error,
            ),
          ),
          taskEither.map(({ contents, data }) => ({
            contents: contents.trim(),
            data,
          })),
          taskEither.getOrElse((cause) => {
            throw new Error(
              `Unexpectedly failed to parse front-matter for file "${fileToString(
                inputFile,
              )}": ${cause}`,
            );
          }),
        )(),
      ).toEqual({
        data: JSON.parse(data),
        contents: contents.trim(),
      });
    });
  }
});
