import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const DIST_URL = new URL("../dist/", import.meta.url);
const PERSONA_LP_URL = new URL("persona-lp.html", DIST_URL);
const PERSONA_CSS_URL = new URL("persona-lp.css", DIST_URL);
const VERCEL_CONFIG_URL = new URL("../vercel.json", import.meta.url);
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
  const externalAnchors = html.match(/<a\b[^>]*\bhref=["']https:\/\/[^"']+["'][^>]*>[\s\S]*?<\/a\s*>/gi) ?? [];
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

  for (const anchor of lineAnchors) {
    const visibleText = anchor.replace(/<[^>]+>/g, "").replace(/\s+/g, "");
    assert.match(visibleText, /【無料】LINEから今すぐ相談/);
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

test("スマホ表示でヒーロー見出しの長い1行を途中改行しない", async () => {
  const [html, css] = await Promise.all([
    readPersonaLp(),
    readFile(PERSONA_CSS_URL, "utf8"),
  ]);

  assert.match(
    html,
    /class=["'][^"']*hero-line-nowrap[^"']*["'][^>]*>会社員の経験を副業に活かし</,
  );
  assert.match(css, /\.hero-line-nowrap\s*\{[^}]*white-space:\s*nowrap;/s);
});

test("スマホ表示では主要見出しを意味の区切りで改行する", async () => {
  const [html, css] = await Promise.all([
    readPersonaLp(),
    readFile(PERSONA_CSS_URL, "utf8"),
  ]);

  for (const phrase of [
    "役職に就いて",
    "会社の評価制度は",
    "売れるスキルと",
    "4ヶ月目には独り立ちし",
    "【無料】今の仕事を",
    "副収入を得る方法を",
  ]) {
    assert.match(
      html,
      new RegExp(`${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*?mobile-break`, "s"),
      `${phrase}の直後にスマホ用改行があること`,
    );
  }

  assert.match(css, /\.mobile-break\s*\{[^}]*display:\s*none;/s);
  assert.match(
    css,
    /@media\s*\(max-width:\s*760px\)[\s\S]*?\.mobile-break\s*\{[^}]*display:\s*block;/,
  );
  assert.match(
    css,
    /\.persona-program\s+\.month\s+h3\s+\.mobile-break\s*\{[^}]*display:\s*block;/s,
  );
  assert.match(
    css,
    /\.persona-page\s+footer\s*\{[^}]*padding-bottom:\s*32px;/s,
  );
});

test("本番ルートで確認用LPを表示し旧LPファイルは保持する", async () => {
  const config = JSON.parse(await readFile(VERCEL_CONFIG_URL, "utf8"));

  assert.ok(
    config.rewrites?.some(
      ({ source, destination }) => source === "/" && destination === "/persona-lp.html",
    ),
    "本番ルートをpersona-lp.htmlへ向けること",
  );
  await access(new URL("index.html", DIST_URL));
});
