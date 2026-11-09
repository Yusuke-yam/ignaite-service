import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const PERSONA_LP_URL = new URL("../dist/persona-lp.html", import.meta.url);

async function readPersonaLp() {
  return readFile(PERSONA_LP_URL, "utf8");
}

function visibleText(fragment) {
  return fragment
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, "")
    .trim();
}

function sectionById(html, id) {
  return html.match(new RegExp(`<section\\b[^>]*id=["']${id}["'][\\s\\S]*?<\\/section>`, "i"))?.[0];
}

function blockByClass(html, className) {
  return html.match(
    new RegExp(
      `<([a-z][a-z0-9]*)\\b[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>[\\s\\S]*?<\\/\\1>`,
      "i",
    ),
  )?.[0];
}

test("ファーストビューが対象者の現実と目標を具体的に示す", async () => {
  const html = await readPersonaLp();
  const hero = html.match(/<section\b[^>]*class=["'][^"']*\bhero\b[^"']*["'][\s\S]*?<\/section>/i)?.[0];

  assert.ok(hero, "ヒーローセクションが存在すること");
  const text = visibleText(hero);

  assert.match(text, /年収800万円。役職もある。それでも、自由に使えるお金は数万円。/);
  assert.match(text, /今の会社を辞めずに、会社員の経験を副業に変え、月20時間で月20万円を目指す。/);
  assert.match(text, /目標であり、成果を保証するものではありません/);
});

test("解決策が会社の外で収入を作る考え方を明示する", async () => {
  const html = await readPersonaLp();
  const vision = sectionById(html, "vision");

  assert.ok(vision, "目指す姿セクションが存在すること");
  assert.match(
    visibleText(vision),
    /会社の評価制度は変えられなくても、収入の決まり方は変えられる。/,
  );
});

test("目指す姿の月20万円訴求にも非保証注記を近接表示する", async () => {
  const html = await readPersonaLp();
  const vision = sectionById(html, "vision");

  assert.ok(vision, "目指す姿セクションが存在すること");
  const incomeCard = [...vision.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)]
    .map(([article]) => article)
    .find((article) => article.includes("毎月20万円の選択肢を、自分と家族のために増やす"));

  assert.ok(incomeCard, "月20万円を訴求するカードが存在すること");
  assert.match(
    visibleText(incomeCard),
    /支援後に目指す目標であり、成果を保証するものではありません/,
  );
});

test("3か月の支援と4か月目以降の自走を区別して示す", async () => {
  const html = await readPersonaLp();
  const program = sectionById(html, "program");

  assert.ok(program, "3か月の支援セクションが存在すること");
  const text = visibleText(program);

  assert.match(text, /1か月目：売れるスキルと取り組む副業を決める/);
  assert.match(text, /2か月目：最初の案件を獲得する/);
  assert.match(text, /3か月目：受注した仕事を収益に変える/);
  assert.match(text, /4か月目以降に自走するアクションプラン/);
});

test("支援後の収益目標を非保証注記と近接表示する", async () => {
  const html = await readPersonaLp();
  const outcome = blockByClass(html, "independence-goal");

  assert.ok(outcome, "支援後の目標ブロックが存在すること");
  const text = visibleText(outcome);

  assert.match(text, /月20時間/);
  assert.match(text, /月20万円/);
  assert.match(text, /目標であり、成果を保証するものではありません/);
});

test("4案件・月22時間・月25万円をモデルケースとして表示する", async () => {
  const html = await readPersonaLp();
  const model = sectionById(html, "model");

  assert.ok(model, "モデルケースセクションが存在すること");
  const text = visibleText(model);

  assert.match(text, /目指す働き方のモデル/);
  assert.match(text, /4件の継続案件を月22時間で担当し、月25万円の副収入へ。/);
  assert.match(text, /支援後に目指すモデルケースであり、実際の成果や達成を保証するものではありません/);
});

test("抽象的な旧見出しと内部フレーム名を表向きに表示しない", async () => {
  const html = await readPersonaLp();
  const text = visibleText(html);

  assert.doesNotMatch(text, /強みの発見/);
  assert.doesNotMatch(text, /業務コンサル/);
  assert.doesNotMatch(text, /実務代行/);
  assert.doesNotMatch(text, /講師・研修/);
  assert.doesNotMatch(html, /<li[^>]*>\s*コーチング\s*<\/li>/);
});

test("確認用LPが必要なセクションと見出し階層を持つ", async () => {
  const html = await readPersonaLp();

  for (const id of [
    "reality",
    "vision",
    "program",
    "model",
    "profile",
    "voices",
    "consultation",
  ]) {
    assert.ok(sectionById(html, id), `#${id} セクションが存在すること`);
  }

  assert.equal((html.match(/<h1\b/gi) ?? []).length, 1, "h1は1件だけであること");
  assert.ok((html.match(/<h2\b/gi) ?? []).length >= 6, "主要セクションにh2があること");
});

test("既存スタイルの後に専用スタイルを読み込み既存スクリプトを再利用する", async () => {
  const html = await readPersonaLp();
  const styleIndex = html.indexOf('href="style.css"');
  const themeIndex = html.indexOf('href="reference-theme.css"');
  const personaIndex = html.indexOf('href="persona-lp.css"');

  assert.ok(styleIndex >= 0, "style.cssを読み込むこと");
  assert.ok(themeIndex > styleIndex, "reference-theme.cssをstyle.cssの後に読み込むこと");
  assert.ok(personaIndex > themeIndex, "persona-lp.cssを既存CSSの後に読み込むこと");
  assert.match(html, /<script\b[^>]*src=["']script\.js["'][^>]*defer[^>]*>/i);
});
