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

  assert.doesNotMatch(
    text,
    /今の会社で役職に就いて、年収も800万円はある。それでも手元に残るのは数万円だけ。/,
  );
  assert.doesNotMatch(hero, /class=["'][^"']*hero-audience[^"']*["']/);
  assert.doesNotMatch(text, /今の会社は続けたまま、/);
  assert.match(text, /会社員の経験を副業に活かし月20時間で月20万円の副収入を目指す/);
  assert.match(
    text,
    /出勤前や夕食後、そして休日の朝などに1時間だけ使って毎月20時間だけ。/,
  );
  assert.doesNotMatch(
    text,
    /※月20時間・月20万円は支援後に目指す目標であり、成果を保証するものではありません。/,
  );
});

test("現状セクションが役職者の仕事と家計の本音を具体的に示す", async () => {
  const html = await readPersonaLp();
  const reality = sectionById(html, "reality");

  assert.ok(reality, "現状セクションが存在すること");
  const text = visibleText(reality);

  assert.match(text, /役職に就いて年収も上がった。でも手元に残るお金は増えていない。/);
  assert.match(text, /責任は広がり仕事も増えた。でも、近々給与は大きくは変わらない。/);
  assert.match(
    text,
    /リーダー職や主任を任され仕事の責任範囲は広がった。次の大きな昇進・昇給はしばらく先なのも見えている。でも正直、大企業の役職と安定は手放せない。/,
  );
  assert.match(
    text,
    /年収800万円でも手取りは月40万円。結局、自由に使えるのは月数万円だけ。/,
  );
  assert.match(
    text,
    /高い家賃、家族の生活費、分割払い返済、奨学金返済、保険料支払い、積み立て金。毎月の支払いを終えると、手元に残るお金はわずか。周囲からは成功しているように見られるからこそ、本当はお金に余裕がないとは言いにくい。/,
  );
});

test("解決策が会社の外で収入を作る考え方を明示する", async () => {
  const html = await readPersonaLp();
  const vision = sectionById(html, "vision");

  assert.ok(vision, "目指す姿セクションが存在すること");
  assert.match(
    visibleText(vision),
    /会社の評価制度は変えられなくても、収入は今すぐ増やせる。/,
  );

  const text = visibleText(vision);
  assert.match(text, /これまでの仕事で身につけたスキルを、そのまま副業に活かす/);
  assert.match(
    text,
    /キャリア、担当業務、役割、成果を棚卸しし、あなたが副業で提供できる価値を言語化。/,
  );
  assert.match(
    text,
    /出勤前、夕食後もしくは休日朝の1時間だけを使って月20時間を副業に使う/,
  );
  assert.match(
    text,
    /毎月20時間だけで副業案件を進める方法を一緒に見つけていきます。/,
  );
  assert.match(text, /毎月20万円の副収入で、自分と家族の選択肢を広げる/);
  assert.match(
    text,
    /仕事用スーツをオーダーメイドで新調、子どもを私立に通わせる教育費を貯めるなどして、お金を理由に将来の選択肢を諦めない状態を目指します。/,
  );
  assert.doesNotMatch(
    text,
    /※月20万円は支援後に目指す目標であり、成果を保証するものではありません。/,
  );
  assert.doesNotMatch(text, /TRANSLATE YOUR EXPERIENCE/);
  assert.match(
    text,
    /仕事で当たり前にやっていることが、会社の外で重宝され収益化できます。/,
  );
  assert.doesNotMatch(vision, /class=["'][^"']*\btime-grid\b[^"']*["']/);

  for (const value of [
    "業務コンサルをする",
    "実務を代行する",
    "目標達成を伴走支援",
    "講師・研修をする",
  ]) {
    assert.match(text, new RegExp(value));
  }
});

test("目指す姿の月20万円訴求から指定の非保証注記を除去する", async () => {
  const html = await readPersonaLp();
  const vision = sectionById(html, "vision");

  assert.ok(vision, "目指す姿セクションが存在すること");
  const incomeCard = [...vision.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)]
    .map(([article]) => article)
    .find((article) =>
      visibleText(article).includes("毎月20万円の副収入で、自分と家族の選択肢を広げる"),
    );

  assert.ok(incomeCard, "月20万円を訴求するカードが存在すること");
  assert.doesNotMatch(
    visibleText(incomeCard),
    /支援後に目指す目標であり、成果を保証するものではありません/,
  );
});

test("3か月の支援と4か月目以降の自走を区別して示す", async () => {
  const html = await readPersonaLp();
  const program = sectionById(html, "program");

  assert.ok(program, "3か月の支援セクションが存在すること");
  const text = visibleText(program);

  assert.doesNotMatch(
    text,
    /副業未経験でも、何を決め、何を実行するのかを毎月明確にします。/,
  );
  assert.match(text, /1ヶ月目取り組む副業を見つける/);
  assert.match(text, /2ヶ月目最初の案件を獲得する/);
  assert.match(
    text,
    /プロフィール作成、応募文面作成、案件応募の見極めなども丁寧にサポートして案件獲得を目指します。/,
  );
  assert.match(text, /3ヶ月目案件を実行して初収益を得る/);
  assert.doesNotMatch(text, /MONTH0[1-3]|[123]か月目：/);
  assert.match(
    text,
    /案件を受注したら、これまでのスキルを活かして実行していきます。生成AIも活用して業務効率化しながら本業の負担にならずに最初の収益化を目指します。/,
  );
  assert.match(
    text,
    /4ヶ月目には独り立ちし月20時間で月20万円を稼げる状態をめざします。/,
  );
});

test("3か月の支援カードに補助タグ行を表示しない", async () => {
  const html = await readPersonaLp();
  const program = sectionById(html, "program");

  assert.ok(program, "3か月の支援セクションが存在すること");
  assert.doesNotMatch(program, /class=["'][^"']*month-foot[^"']*["']/);
});

test("プロフィール・お客様の声・無料相談を指定内容に整理する", async () => {
  const html = await readPersonaLp();
  const profile = sectionById(html, "profile");
  const voices = sectionById(html, "voices");
  const consultation = sectionById(html, "consultation");

  assert.ok(profile, "プロフィールセクションが存在すること");
  assert.match(visibleText(profile), /伴走するコーチの紹介/);
  assert.doesNotMatch(
    visibleText(profile),
    /会社員・マネジメント・副業の実践経験と、認知科学コーチングを掛け合わせて伴走します。/,
  );
  assert.match(visibleText(profile), /コーチングカンパニー/);
  assert.doesNotMatch(visibleText(profile), /Certification|日本認知科学コーチング協会認定プロ認知科学コーチ/);

  assert.ok(voices, "お客様の声セクションが存在すること");
  const voicesText = visibleText(voices);
  assert.doesNotMatch(voicesText, /一歩を踏み出した、その後に。/);
  assert.doesNotMatch(voicesText, /これまでの支援を通じていただいたメッセージをご紹介します。/);
  assert.doesNotMatch(voicesText, /画像をタップすると拡大できます。/);
  assert.doesNotMatch(voicesText, /一時停止|再生/);
  assert.doesNotMatch(voicesText, /過去の支援に対する個人の感想です/);

  assert.ok(consultation, "無料相談セクションが存在すること");
  assert.match(
    visibleText(consultation),
    /【無料】あなたの仕事経験を活かせる副業を見つける/,
  );
  assert.doesNotMatch(visibleText(html), /【無料】LINEから今すぐ相談/);
  assert.match(visibleText(html), /【無料】LINEで今すぐ相談/);

  assert.doesNotMatch(html, /class=["'][^"']*\bmobile-cta\b[^"']*["']/);
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

test("目指す働き方のモデルカードを表示しない", async () => {
  const html = await readPersonaLp();
  const model = sectionById(html, "model");

  assert.equal(model, undefined);
  assert.doesNotMatch(visibleText(html), /目指す働き方のモデル/);
});

test("抽象的な旧見出しを表示しない", async () => {
  const html = await readPersonaLp();
  const text = visibleText(html);

  assert.doesNotMatch(text, /強みの発見/);
});

test("英語のセクションラベルを表示しない", async () => {
  const html = await readPersonaLp();
  const text = visibleText(html);

  for (const label of [
    "YOUR REALITY",
    "A NEW INCOME RULE",
    "3-MONTH PROGRAM",
    "COACH PROFILE",
    "CLIENT VOICES",
    "YOUR NEXT STEP",
    "TRANSLATE YOUR EXPERIENCE",
  ]) {
    assert.doesNotMatch(text, new RegExp(label.replace(/\s+/g, "")));
  }
});

test("確認用LPが必要なセクションと見出し階層を持つ", async () => {
  const html = await readPersonaLp();

  for (const id of [
    "reality",
    "vision",
    "program",
    "profile",
    "voices",
    "consultation",
  ]) {
    assert.ok(sectionById(html, id), `#${id} セクションが存在すること`);
  }

  assert.equal((html.match(/<h1\b/gi) ?? []).length, 1, "h1は1件だけであること");
  assert.ok((html.match(/<h2\b/gi) ?? []).length >= 5, "主要セクションにh2があること");
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
