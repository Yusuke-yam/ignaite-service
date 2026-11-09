import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const PREPARE_DEPLOY_URL = new URL("../scripts/prepare-deploy.mjs", import.meta.url);

test("旧LPを保ったまま確認用LPを公開ルートへ配置する", async (context) => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "ignaite-deploy-"));
  const sourceDirectory = join(temporaryRoot, "dist");
  const outputDirectory = join(temporaryRoot, "deploy");

  context.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  await mkdir(sourceDirectory);
  await Promise.all([
    writeFile(join(sourceDirectory, "index.html"), "legacy LP", "utf8"),
    writeFile(join(sourceDirectory, "persona-lp.html"), "persona LP", "utf8"),
    writeFile(join(sourceDirectory, "style.css"), "body {}", "utf8"),
  ]);

  let prepareDeployment;
  try {
    ({ prepareDeployment } = await import(PREPARE_DEPLOY_URL));
  } catch (error) {
    assert.fail(`デプロイ出力生成処理を読み込めません: ${error.code ?? error.message}`);
  }

  await prepareDeployment({ sourceDirectory, outputDirectory });

  assert.equal(await readFile(join(sourceDirectory, "index.html"), "utf8"), "legacy LP");
  assert.equal(await readFile(join(outputDirectory, "index.html"), "utf8"), "persona LP");
  assert.equal(await readFile(join(outputDirectory, "style.css"), "utf8"), "body {}");
});
