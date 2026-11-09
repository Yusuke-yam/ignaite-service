import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const INDEX_HTML_URL = new URL("../dist/index.html", import.meta.url);
const EXPECTED_OUTCOME_HEADINGS = [
  "会社員としての経験を、そのまま副業に活かす",
  "本業出勤前もしくは帰宅後の1時間の使い方を変える",
];

test("セクション2に会社員の経験と1時間の活用方法を示す", async () => {
  const html = await readFile(INDEX_HTML_URL, "utf8");
  const visionSection = html.match(
    /<section id="vision"[\s\S]*?<\/section>/,
  )?.[0];

  assert.ok(visionSection, "セクション2が存在すること");

  // 装飾用タグの構造ではなく、利用者が読む見出しを検証する。
  const headings = [...visionSection.matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map(
    ([, heading]) => heading.replace(/<[^>]+>/g, "").replace(/\s+/g, ""),
  );

  assert.deepEqual(headings.slice(0, 2), EXPECTED_OUTCOME_HEADINGS);
});
