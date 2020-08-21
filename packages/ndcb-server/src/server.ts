import { fetchConfiguration } from "@ndcb/config";

export const serve = ({
  config,
  encoding,
}: {
  config: string;
  encoding: string;
}): void => {
  console.log(
    JSON.stringify(fetchConfiguration({ config, encoding }), null, "  "),
  );
  // throw new Error("Not implemented yet");
};
