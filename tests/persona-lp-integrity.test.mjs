import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const DIST_URL = new URL("../dist/", import.meta.url);
const PERSONA_LP_URL = new URL("persona-lp.html", DIST_URL);
const PERSONA_CSS_URL = new URL("persona-lp.css", DIST_URL);
const VERCEL_CONFIG_URL = new URL("../vercel.json", import.meta.url);
const GITIGNORE_URL = new URL("../.gitignore", import.meta.url);
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
    assert.match(visibleText, /【無料】LINEで今すぐ相談/);
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
    "会社の評価制度は",
    "4ヶ月目には独り立ちし",
  ]) {
    assert.match(
      html,
      new RegExp(`${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*?mobile-break`, "s"),
      `${phrase}の直後にスマホ用改行があること`,
    );
  }

  assert.match(
    html,
    /class=["']mobile-line["'][^>]*>役職に就いて年収も上がった。<\/span><br class=["']mobile-break["']\s*\/><span class=["']mobile-line["']>でも手元に残るお金は増えていない。/,
  );
  assert.match(
    html,
    />リーダー職や主任を任され仕事の責任範囲は広がった。<\/span><br class=["']mobile-break["']\s*\/><span class=["']mobile-line["']>次の大きな昇進・昇給はしばらく先なのも見えている。<\/span><br class=["']mobile-break["']\s*\/><span class=["']mobile-line["']>でも正直、大企業の役職と安定は手放せない。/,
  );
  assert.match(
    html,
    /会社員として積み重ねた経験を、<br class=["']mobile-break["']\s*\/>会社の外で対価を得られるサービスへ変える。/,
  );
  assert.match(
    html,
    /class=["']mobile-line["'][^>]*>仕事で当たり前にやっていることが、<\/span><br class=["']mobile-break["']\s*\/><span class=["']mobile-line["']>会社の外で重宝され収益化できます。/,
  );
  assert.match(
    html,
    /月<span>20<\/span>時間の副業で、<br class=["']mobile-break["']\s*\/>月<span>20<\/span>万円。/,
  );
  assert.match(
    html,
    /class=["'][^"']*consultation-heading[^"']*["'][^>]*><span class=["']mobile-line["']>【無料】あなたの仕事経験を<\/span><br class=["']mobile-break["']\s*\/><span class=["']mobile-line["']>活かせる副業を見つける<\/span>/,
  );

  assert.match(css, /\.mobile-break\s*\{[^}]*display:\s*none;/s);
  assert.match(
    css,
    /@media\s*\(max-width:\s*760px\)[\s\S]*?\.mobile-line\s*\{[^}]*white-space:\s*nowrap;/,
  );
  assert.match(
    css,
    /@media\s*\(max-width:\s*760px\)[\s\S]*?\.mobile-break\s*\{[^}]*display:\s*block;/,
  );
  assert.match(
    css,
    /@media\s*\(max-width:\s*760px\)[\s\S]*?\.closing\s+\.consultation-heading\s*\{[^}]*font-size:\s*min\(25px,\s*calc\(\(100vw\s*-\s*72px\)\s*\/\s*13\)\);/,
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

test("本番ルート用の専用出力を生成し旧LPを保持する", async () => {
  const [configSource, gitignore, legacyLp, personaLp] = await Promise.all([
    readFile(VERCEL_CONFIG_URL, "utf8"),
    readFile(GITIGNORE_URL, "utf8"),
    readFile(new URL("index.html", DIST_URL), "utf8"),
    readPersonaLp(),
  ]);
  const config = JSON.parse(configSource);

  assert.equal(config.buildCommand, "node scripts/prepare-deploy.mjs");
  assert.equal(config.outputDirectory, "deploy");
  assert.equal(config.rewrites, undefined);
  assert.match(gitignore, /^deploy\/$/m, "生成したデプロイ出力をGit管理から除外すること");
  assert.notEqual(legacyLp, personaLp, "旧LPと確認用LPを別ファイルで保持すること");
});
