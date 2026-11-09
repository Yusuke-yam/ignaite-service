import { access, copyFile, cp, rm } from "node:fs/promises";
import { dirname, parse, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIRECTORY = resolve(SCRIPT_DIRECTORY, "..");
const DEFAULT_SOURCE_DIRECTORY = resolve(PROJECT_DIRECTORY, "dist");
const DEFAULT_OUTPUT_DIRECTORY = resolve(PROJECT_DIRECTORY, "deploy");
const PERSONA_LP_FILENAME = "persona-lp.html";
const ROOT_DOCUMENT_FILENAME = "index.html";

function validateDirectories(sourceDirectory, outputDirectory) {
  const source = resolve(sourceDirectory);
  const output = resolve(outputDirectory);
  const filesystemRoot = parse(output).root;

  if (output === filesystemRoot || output === source || source.startsWith(`${output}${sep}`)) {
    throw new Error("安全に生成できない出力先が指定されました。");
  }

  return { source, output };
}

export async function prepareDeployment({
  sourceDirectory = DEFAULT_SOURCE_DIRECTORY,
  outputDirectory = DEFAULT_OUTPUT_DIRECTORY,
} = {}) {
  const { source, output } = validateDirectories(sourceDirectory, outputDirectory);
  const personaLp = resolve(source, PERSONA_LP_FILENAME);

  await access(personaLp);
  // 生成物に削除済みファイルを残さないため、固定した出力先だけを毎回作り直す。
  await rm(output, { recursive: true, force: true });
  await cp(source, output, { recursive: true });
  await copyFile(personaLp, resolve(output, ROOT_DOCUMENT_FILENAME));
}

const invokedFile = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";

if (invokedFile === import.meta.url) {
  prepareDeployment().catch((error) => {
    console.error(`デプロイ出力の生成に失敗しました: ${error.message}`);
    process.exitCode = 1;
  });
}
