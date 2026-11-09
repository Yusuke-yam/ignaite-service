import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const HTML_URL = new URL("../dist/persona-lp.html", import.meta.url);
const CSS_URL = new URL("../dist/persona-lp.css", import.meta.url);

test("確認用LPの新規ブロックへ専用クラスを付与する", async () => {
  const html = await readFile(HTML_URL, "utf8");

  for (const className of [
    "persona-hero-note",
    "reality-grid",
    "time-grid",
    "independence-flow",
    "model-case",
  ]) {
    assert.match(
      html,
      new RegExp(`\\bclass=["'][^"']*\\b${className}\\b`),
      `.${className}をHTMLで使用すること`,
    );
  }
});

test("新規ブロックへ既存ブランドに沿った専用スタイルを定義する", async () => {
  const css = await readFile(CSS_URL, "utf8");

  for (const selector of [
    ".persona-hero-note",
    ".reality-grid",
    ".time-grid",
    ".independence-flow",
    ".model-case",
  ]) {
    assert.match(css, new RegExp(`\\${selector}\\s*\\{`), `${selector}の規則があること`);
  }
});

test("760px以下で新規グリッドを1列にする", async () => {
  const css = await readFile(CSS_URL, "utf8");
  const mobile = css.match(/@media\s*\(max-width:\s*760px\)\s*\{[\s\S]*\}\s*$/m)?.[0];

  assert.ok(mobile, "760pxのモバイルメディアクエリが存在すること");
  for (const selector of [".reality-grid", ".time-grid", ".model-case-numbers"]) {
    assert.match(
      mobile,
      new RegExp(`\\${selector}\\s*\\{[^}]*grid-template-columns:\\s*1fr`, "s"),
      `${selector}を1列にすること`,
    );
  }
});

test("長い日本語コピーをカード内で安全に折り返す", async () => {
  const css = await readFile(CSS_URL, "utf8");
  const guard = css.match(/\.persona-page\s+:where\([^)]*\)\s*\{[^}]*\}/s)?.[0];

  assert.ok(guard, "長文要素の共通ガードが存在すること");
  assert.match(guard, /min-width:\s*0/);
  assert.match(guard, /overflow-wrap:\s*anywhere/);
});

test("動きを減らす設定で専用アニメーションを無効化する", async () => {
  const css = await readFile(CSS_URL, "utf8");
  const reducedMotion = css.match(
    /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\}/,
  )?.[0];

  assert.ok(reducedMotion, "動きを減らすメディアクエリが存在すること");
  assert.match(reducedMotion, /animation:\s*none/);
  assert.match(reducedMotion, /transition:\s*none/);
});
