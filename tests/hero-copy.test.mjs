import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const INDEX_HTML_URL = new URL("../dist/index.html", import.meta.url);
const EXPECTED_HERO_COPY =
  "会社員の経験・スキルを活かして、月20時間の副業で、月20万円を目指す。";

test("セクション1に会社員の経験を起点とした見出しを表示する", async () => {
  const html = await readFile(INDEX_HTML_URL, "utf8");
  const heroHeading = html.match(/<h1>([\s\S]*?)<\/h1>/)?.[1];

  assert.ok(heroHeading, "セクション1のh1が存在すること");

  // 改行や装飾用spanに左右されず、利用者が読む文言を検証するために可視テキストへ正規化する。
  const visibleText = heroHeading.replace(/<[^>]+>/g, "").replace(/\s+/g, "");

  assert.equal(visibleText, EXPECTED_HERO_COPY);
});
