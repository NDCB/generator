import * as yup from "yup";
import { normalizedDirectory, Directory, isDirectory } from "@ndcb/fs-util";

export class DirectorySchemaType extends yup.mixed<Directory> {
  constructor() {
    super();
    this.withMutation(() => {
      this.transform(function (value) {
        if (this.isType(value)) return value;
        else if (typeof value === "string") return normalizedDirectory(value);
        else throw new Error(`Could not coerce "${value}" into a directory`);
      });
    });
  }
  isType = isDirectory;
}

const buildConfigurationSchema = yup
  .object()
  .shape<{ output: Directory }>({
    output: new DirectorySchemaType()
      .default(normalizedDirectory("./build"))
      .required(),
  })
  .defined();

export type BuildConfiguration = yup.InferType<typeof buildConfigurationSchema>;

const serverConfigurationSchema = yup
  .object()
  .shape<{ hostname: string; port: number }>({
    hostname: yup.string().default("localhost").required(),
    port: yup.number().integer().min(1).max(65535).default(3000).required(),
  })
  .defined();

export type ServerConfiguration = yup.InferType<
  typeof serverConfigurationSchema
>;

const configurationSchema = yup
  .object()
  .shape<{
    build: BuildConfiguration;
    server: ServerConfiguration;
    sources: Directory[];
  }>({
    build: buildConfigurationSchema.required(),
    server: serverConfigurationSchema.required(),
    sources: yup
      .array<Directory>(new DirectorySchemaType().required())
      .default(["./"].map(normalizedDirectory))
      .required(),
  })
  .defined();

export type Configuration = yup.InferType<typeof configurationSchema>;

export const isConfiguration = (element: unknown): element is Configuration =>
  configurationSchema.isValidSync(element);

export const castConfiguration = (data: unknown): Configuration =>
  configurationSchema.cast(data);
