# Persona-led Local LP Variant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 現行ローカルLPを変更せずに残し、ペルソナ起点のコピーと追加セクションを反映した確認用LPを別ファイルとして実装する。

**Architecture:** `dist/index.html`、`dist/style.css`、`dist/reference-theme.css`、`dist/script.js`、既存アセットは変更せず、確認用ページを `dist/persona-lp.html`、追加スタイルを `dist/persona-lp.css` として新設する。確認用ページは既存CSS・JS・アセットを再利用し、差分のレイアウトだけを追加CSSで定義する。

**Tech Stack:** 静的HTML、CSS、Vanilla JavaScript、Node.js標準テストランナー（`node:test`）

**Spec:** `docs/superpowers/specs/2026-11-09-persona-led-lp-copy-design.md`

## Global Constraints

- `dist/index.html` と既存CSS・JavaScript・画像は変更しない。
- 本番環境、Vercel、GitHubへ変更を送らない。
- 新規ページは `dist/persona-lp.html`、新規スタイルは `dist/persona-lp.css` に保存する。
- 新しいフレームワークや依存パッケージを導入しない。
- ファーストビューに「年収800万円」「今の会社を辞めずに」「月20時間で月20万円を目指す」を明示する。
- 収益目標を大きく表示する各ブロック内または直後に、目標であり成果保証ではない旨を表示する。
- 「4案件・月22時間・月25万円」は顧客実績ではなく、支援後に目指すモデルケースとしてのみ表示する。
- お客様の声を収益実績として扱わず、既存の注意書きを維持する。
- 内部フレームの名称「業務コンサル」「実務代行」「コーチング」「講師・研修」はページに表示しない。
- LINE無料相談とプロフィールの既存リンク、外部リンクの安全属性を維持する。
- PC・モバイルともに主要コピーの重なり、切れ、横スクロールを発生させない。

## Review Focus

- 現行版保全：新規版の実装後も `dist/index.html` と既存テスト2件が変更なく通ること。
- 表示リスク：月20万円・月25万円の各主張に、それぞれ近接する非保証注記があること。
- 実績誤認防止：モデルケースとお客様の声を別セクションに分離し、モデルケースに明示ラベルがあること。
- リンク安全性：すべての外部リンクが既存URLを保ち、`target="_blank"` と `rel="noopener noreferrer"` を持つこと。
- レスポンシブ表示：幅390pxと1440pxで意図しない横スクロールがなく、長い日本語見出しがカード外へはみ出さないこと。

---

### Task 1: 確認用LPのコピー契約をテストで固定する

**Files:**
- Create: `tests/persona-lp-copy.test.mjs`
- Create: `tests/persona-lp-integrity.test.mjs`
- Test: `tests/persona-lp-copy.test.mjs`
- Test: `tests/persona-lp-integrity.test.mjs`

**Interfaces:**
- Consumes: `docs/superpowers/specs/2026-11-09-persona-led-lp-copy-design.md` の確定コピーと禁止表現
- Produces: `dist/persona-lp.html` に要求するコピー・セクション・近接注記・リンク・アセットのテスト契約

- [ ] **Step 1: 失敗するコピーテストを書く**

  `dist/persona-lp.html` を読み込み、タグと空白を正規化する `visibleText(fragment)` をテスト内で定義し、次を個別テストにする。

  - `年収800万円。役職もある。それでも、自由に使えるお金は数万円。`
  - `今の会社を辞めずに、会社員の経験を副業に変え、月20時間で月20万円を目指す。`
  - `会社の評価制度は変えられなくても、収入の決まり方は変えられる。`
  - 1〜3か月目の見出しと「4か月目以降に自走するアクションプラン」
  - `目指す働き方のモデル`、`4件`、`月22時間`、`月25万円`
  - モデルケースの同一セクションに `実際の成果や達成を保証するものではありません`
  - 収益目標を表示するヒーローと支援後セクションの各々に非保証注記
  - `強みの発見` が存在しないこと
  - 内部フレーム4名称をカテゴリ一覧やサービス名として表示していないこと（本文中の正式な「認知科学コーチング」は許容する）

  `tests/persona-lp-integrity.test.mjs` には次を検証するテストを書く。

  - LINE CTAの `href` がすべて `https://lin.ee/pGwZL03`
  - プロフィールリンクが既存URLのまま
  - `https://` を持つ外部アンカーが `target="_blank"` と `rel="noopener noreferrer"` を持つ
  - `src` とローカルCSSの `href` が示すファイルがすべて `dist/` 内に存在する
  - `voice-track`、`lightbox`、`large-voice`、`motion` が各1件存在し、既存 `script.js` が安全に再利用できる

- [ ] **Step 2: テストがファイル未作成で失敗することを確認する**

  Run: `node --test tests/persona-lp-copy.test.mjs tests/persona-lp-integrity.test.mjs`

  Expected: FAIL with `ENOENT` for `dist/persona-lp.html`

- [ ] **Step 3: テストだけをコミットする**

  ```bash
  git add tests/persona-lp-copy.test.mjs tests/persona-lp-integrity.test.mjs
  git commit -m "test: define persona LP copy contract"
  ```

### Task 2: 現行版から独立した確認用HTMLを実装する

**Files:**
- Create: `dist/persona-lp.html`
- Modify: `tests/persona-lp-copy.test.mjs`
- Test: `tests/persona-lp-copy.test.mjs`
- Test: `tests/persona-lp-integrity.test.mjs`

**Interfaces:**
- Consumes: Task 1のコピー契約、既存 `dist/style.css`、`dist/reference-theme.css`、`dist/script.js`、`dist/assets/*`
- Produces: `#reality`、`#vision`、`#program`、`#model`、`#profile`、`#voices`、`#consultation` を持つ確認用LP

- [ ] **Step 1: HTML構造の失敗テストを追加する**

  `tests/persona-lp-copy.test.mjs` に、上記7セクション、見出し階層、`style.css` → `reference-theme.css` → `persona-lp.css` の読込順、`script.js` の読込を検証するテストを追加する。

- [ ] **Step 2: 構造テストが失敗することを確認する**

  Run: `node --test tests/persona-lp-copy.test.mjs`

  Expected: FAIL because the required sections and stylesheet link do not exist

- [ ] **Step 3: `dist/persona-lp.html` を作成する**

  既存ページのヘッダー、プロフィール、お客様の声、CTA、フッター、ダイアログを再利用し、本文を次の順番で構成する。

  1. ヒーロー：年収800万円／今の会社を辞めない／月20時間で月20万円を目指す／近接注記
  2. 現状：年収・役職が上がっても手元に残るお金が増えない現実
  3. 解決：会社員経験を会社の外で売れる形へ変える3つの変化と、「課題整理」「業務遂行」「目標達成支援」「知識共有」という4つの価値変換例（内部フレーム名は表示しない）
  4. 3か月支援：業務スキルの可視化と副業決定、案件獲得、収益化
  5. 支援後：3か月の伴走から4か月目以降の自走への流れ、主目標と近接注記
  6. モデルケース：4案件・月22時間・月25万円と非保証注記
  7. 伴走：定期セッションとLINEで応募・商談・納品の次の行動を決める
  8. 既存プロフィール
  9. 既存のお客様の声と既存注意書き
  10. 最終CTA：仕事を辞めずに経験を収入へ変える方法を無料相談で整理

  現状・解決セクションには、家賃、生活費、分割払い、奨学金、保険、積み立てに加え、スーツの新調、子どもの教育費という具体的な生活変化を含める。プロフィール見出しは、会社員経験・マネジメント経験・副業実践・認知科学コーチングが今回の支援方法につながる表現へ改稿する。ヘッダーナビゲーションは「現状」「目指す姿」「3か月の支援」「プロフィール」「お客様の声」とする。

  `title` と `meta description` は、年収800万円の会社員、今の会社を辞めない、月20時間で月20万円を目指す、3か月伴走を含む非保証的な表現にする。

- [ ] **Step 4: コピーテストと構造テストを通す**

  Run: `node --test tests/persona-lp-copy.test.mjs tests/persona-lp-integrity.test.mjs`

  Expected: all tests PASS

- [ ] **Step 5: HTMLとテストをコミットする**

  ```bash
  git add dist/persona-lp.html tests/persona-lp-copy.test.mjs tests/persona-lp-integrity.test.mjs
  git commit -m "feat: add persona-led local LP variant"
  ```

### Task 3: 新規セクションのレスポンシブスタイルを実装する

**Files:**
- Create: `tests/persona-lp-style.test.mjs`
- Create: `dist/persona-lp.css`
- Modify: `dist/persona-lp.html`
- Test: `tests/persona-lp-style.test.mjs`

**Interfaces:**
- Consumes: Task 2のセクションクラス、既存デザイントークンとブレークポイント
- Produces: 既存デザインへ追加するヒーロー注記、現状カード、時間帯カード、自走フロー、モデルケースのPC・モバイルスタイル

- [ ] **Step 1: 失敗するスタイル契約テストを書く**

  `persona-lp.html` の新規ブロックに専用クラスがあること、`persona-lp.css` に次の契約があることを検証する。

  - `.persona-hero-note`、`.reality-grid`、`.time-grid`、`.independence-flow`、`.model-case`
  - `@media(max-width:760px)` 内で新規グリッドを1列化
  - 長文要素へ `min-width:0` と `overflow-wrap:anywhere`
  - `prefers-reduced-motion:reduce` で追加アニメーションを無効化

- [ ] **Step 2: CSS未作成でテストが失敗することを確認する**

  Run: `node --test tests/persona-lp-style.test.mjs`

  Expected: FAIL with `ENOENT` for `dist/persona-lp.css`

- [ ] **Step 3: `dist/persona-lp.css` を実装する**

  既存の紺・黄・白、角丸カード、既存の `760px` ブレークポイントを踏襲する。新規ページ固有の変更だけを記述し、既存CSSを複製しない。

- [ ] **Step 4: スタイル契約テストを通す**

  Run: `node --test tests/persona-lp-style.test.mjs`

  Expected: all tests PASS

- [ ] **Step 5: CSS・HTML・テストをコミットする**

  ```bash
  git add dist/persona-lp.css dist/persona-lp.html tests/persona-lp-style.test.mjs
  git commit -m "style: add responsive persona LP sections"
  ```

### Task 4: 現行版保全とローカル表示を最終検証する

**Files:**
- Verify only: `dist/index.html`
- Verify only: `dist/style.css`
- Verify only: `dist/reference-theme.css`
- Verify only: `dist/script.js`
- Verify only: `dist/persona-lp.html`
- Verify only: `dist/persona-lp.css`

**Interfaces:**
- Consumes: Tasks 1〜3の成果物
- Produces: 現行版を保全したまま確認可能なローカルLP

- [ ] **Step 1: 全自動テストを実行する**

  Run: `node --test tests/*.test.mjs`

  Expected: existing and new tests all PASS

- [ ] **Step 2: 現行版ファイルが変更されていないことを確認する**

  Run: `git diff 2f8c0e7 -- dist/index.html dist/style.css dist/reference-theme.css dist/script.js`

  Expected: no output

- [ ] **Step 3: セキュリティと差分品質を確認する**

  Run: `git diff --check`

  Expected: no output

  Run: `rg -n '誰でも|必ず|絶対|業務コンサル|実務代行|講師・研修' dist/persona-lp.html`

  Expected: no matches（認知科学コーチングの正式表現は対象外）

- [ ] **Step 4: ローカルサーバーでPC表示を確認する**

  Run: `python3 -m http.server 4173 --directory dist`

  Open: `http://127.0.0.1:4173/persona-lp.html` at 1440px width

  Expected: 主要見出し・数字・非保証注記が読め、重なりと横スクロールがなく、CTA・お客様の声モーダルが動作する

- [ ] **Step 5: モバイル表示を確認する**

  Open the same URL at 390px width

  Expected: すべての新規グリッドが1列になり、長文見出しとモデルケースが画面外へはみ出さない

- [ ] **Step 6: 確認用ページをアプリ内ブラウザで開く**

  Open: `file:///Users/yusukeyamamoto/Projects/LP%20&%E3%83%95%E3%82%9A%E3%83%AD%E3%83%95%E3%82%A3%E3%83%BC%E3%83%AB%20/LP/output/ignaite-career-lp/dist/persona-lp.html`

  Expected: ユーザーが現行 `index.html` と新規 `persona-lp.html` を別ファイルとして比較できる

- [ ] **Step 7: 最終状態をコミットする**

  ```bash
  git add dist/persona-lp.html dist/persona-lp.css tests/persona-lp-*.test.mjs
  git commit -m "feat: complete local persona LP variant"
  ```

  変更がなければ空コミットは作成しない。本番デプロイとGit pushは行わない。
