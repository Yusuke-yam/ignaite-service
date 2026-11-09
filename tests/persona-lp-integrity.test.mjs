import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const DIST_URL = new URL("../dist/", import.meta.url);
const PERSONA_LP_URL = new URL("persona-lp.html", DIST_URL);
const LINE_URL = "https://lin.ee/pGwZL03";
const PROFILE_URL = "https://yusuke-yamamoto-profile.abc77cba77.chatgpt.site";

async function readPersonaLp() {
  return readFile(PERSONA_LP_URL, "utf8");
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"))?.[1];
}

test("LINEとプロフィールの外部リンクを安全な属性で開く", async () => {
  const html = await readPersonaLp();
  const externalAnchors = html.match(/<a\b[^>]*\bhref=["']https:\/\/[^"']+["'][^>]*>/gi) ?? [];
  const lineAnchors = externalAnchors.filter((anchor) => attribute(anchor, "href") === LINE_URL);
  const profileAnchors = externalAnchors.filter(
    (anchor) => attribute(anchor, "href") === PROFILE_URL,
  );

  assert.ok(lineAnchors.length >= 2, "LINE CTAが複数箇所に存在すること");
  assert.equal(profileAnchors.length, 1, "既存プロフィールリンクが1件存在すること");

  for (const anchor of externalAnchors) {
    assert.equal(attribute(anchor, "target"), "_blank");
    assert.equal(attribute(anchor, "rel"), "noopener noreferrer");
  }
});

test("参照するローカルCSS・JavaScript・画像がすべて存在する", async () => {
  const html = await readPersonaLp();
  const tags = html.match(/<(?:link|script|img)\b[^>]*>/gi) ?? [];
  const references = tags
    .map((tag) => attribute(tag, "src") ?? attribute(tag, "href"))
    .filter((reference) => reference && !/^(?:https?:|#|data:)/.test(reference));

  assert.ok(references.includes("style.css"));
  assert.ok(references.includes("reference-theme.css"));
  assert.ok(references.includes("persona-lp.css"));
  assert.ok(references.includes("script.js"));

  await Promise.all(references.map((reference) => access(new URL(reference, DIST_URL))));
});

test("既存のお客様の声スクリプトが必要とする要素を一意に持つ", async () => {
  const html = await readPersonaLp();

  for (const id of ["voice-track", "lightbox", "large-voice", "motion"]) {
    const matches = html.match(new RegExp(`\\bid=["']${id}["']`, "g")) ?? [];
    assert.equal(matches.length, 1, `${id}が1件だけ存在すること`);
  }
});
