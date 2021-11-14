import { exists, mkdir, readFile, unlink, writeFile } from "fs";
import path from "path";
import { promisify } from "util";
import { to } from "../utils/awaitTo";

const readFileAsync = promisify(readFile);
const existsAsync = promisify(exists);
const mkdirAsync = promisify(mkdir);
const writeFileAsync = promisify(writeFile);
const unlinkAsync = promisify(unlink);

export const createLocalStorage = <Payload>(
  storageKey: string,
  directory = "./temp"
) => {
  const getStorageFilePath = () =>
    path.resolve(directory, `${storageKey}.json`);

  const doesExist = (): Promise<boolean> => existsAsync(getStorageFilePath());

  const read = async (): Promise<Payload[]> => {
    const [error, buffer] = await to<string, NodeJS.ErrnoException>(
      readFileAsync(getStorageFilePath()).then((b) => b.toString())
    );

    // File has not been created yet
    if (error && error.code === "ENOENT") {
      return [];
    }
    if (error) {
      throw error;
    }
    if (!buffer) {
      return [];
    }

    return JSON.parse(buffer) as Payload[];
  };

  const write = async (data: Payload[]): Promise<void> => {
    const dirExists = await existsAsync(directory);
    const path = await getStorageFilePath();

    if (!dirExists) {
      await mkdirAsync(directory);
    }

    await writeFileAsync(path, JSON.stringify(data, null, 2));
  };

  const clear = async (): Promise<void> => {
    const [error] = await to<void, NodeJS.ErrnoException>(
      unlinkAsync(getStorageFilePath())
    );
    if (error && error.code === "ENOENT") {
      return;
    }
    if (error) {
      throw error;
    }
  };

  return {
    doesExist,
    getStorageFilePath,
    write,
    read,
    clear,
  };
};
