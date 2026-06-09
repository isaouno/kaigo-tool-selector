# 介護用品えらびサポート

Acolclubカタログ `acolclub.pdf` を参照しながら、チャット形式で介護用品の候補を絞り込む静的Webアプリです。

## ローカル確認

このフォルダで静的サーバーを起動します。

```powershell
python -m http.server 4173
```

ブラウザで `http://localhost:4173/` を開きます。

## 公開する場合

このアプリはHTML/CSS/JavaScript/PDFだけで動くため、静的ホスティングへアップロードすればURL共有できます。

## GitHub Pagesで公開する場合

GitHub Pagesを使う場合は、リポジトリ直下を公開元にする構成が簡単です。

公開対象:

- `index.html`
- `styles.css`
- `app.js`
- `catalog-data.js`
- `product-data.js`
- `acolclub.pdf`
- `robots.txt`
- `.nojekyll`

公開しないもの:

- `kaienntai.pdf`: 旧カタログ。100MiBを超えるためGitHubへ通常pushできません。
- `P3`: 誤生成された空ファイル。

初回公開手順:

1. GitHubで新しいリポジトリを作成する。
2. このフォルダをリポジトリとして登録し、公開対象ファイルをpushする。
3. GitHubのリポジトリ画面で `Settings` → `Pages` を開く。
4. `Build and deployment` の `Source` を `Deploy from a branch` にする。
5. `Branch` を `main`、フォルダを `/(root)` にして保存する。
6. 数分後に表示される `https://<ユーザー名>.github.io/<リポジトリ名>/` を確認する。

公開後に修正する手順:

1. ローカルで修正する。
2. テストを実行する。
3. 変更をcommitする。
4. GitHubへpushする。
5. GitHub Pagesへ反映されたURLで動作確認する。

本番URLを安定させたい場合は、`main`を本番用、別ブランチや別リポジトリを確認用に分けると安全です。

公開前の確認:

1. `index.html`, `styles.css`, `app.js`, `catalog-data.js`, `product-data.js`, `acolclub.pdf`, `robots.txt` を同じ場所へアップロードする。
2. `node tests\conversation-engine.test.js` を通して、代表的な相談で候補がずれていないことを確認する。
3. 商品名下のカタログリンクが `acolclub.pdf` の該当ページへ飛ぶことを確認する。
4. 回答結果は最終判断ではなく、専門相談員・ケアマネジャー確認前の候補整理であることを運用上明確にする。
5. 不適切な提案が出た会話例を記録し、テストへ追加して改善する。

公開後に修正しながら運用する場合は、本番公開用と修正確認用を分けるのがおすすめです。

- 本番: 利用者に案内するURL
- 確認用: 修正内容を公開前に確認するURL

修正の基本手順:

1. ローカルで変更する。
2. `node --check` とテストを実行する。
3. 確認用URLへ反映して、実際の画面で確認する。
4. 問題なければ本番URLへ反映する。
5. 変更内容と確認した会話例を記録する。

## 構成

- `index.html`: アプリ画面
- `styles.css`: レイアウトと見た目
- `app.js`: ヒアリング、会話状態、商品候補の検索・点数化、提案ロジック
- `catalog-data.js`: Acolclubの掲載ジャンルとページ番号
- `product-data.js`: Acolclub掲載ページから整理した具体商品、型番、価格、確認ポイント
- `acolclub.pdf`: 参照カタログ
- `robots.txt`: 検索エンジン向けのクロール設定
- `.nojekyll`: GitHub Pagesで静的ファイルをそのまま配信するための設定
- `.gitignore`: GitHubへ含めないファイルの設定
- `tests/conversation-engine.test.js`: 代表的な会話シナリオの自動確認
- `tests/catalog-page-map.test.js`: カタログ表示ページとPDFリンク先ページの対応確認

## テスト

```powershell
node --check app.js
node --check product-data.js
node --check catalog-data.js
node --check tests\conversation-engine.test.js
node tests\conversation-engine.test.js
node tests\catalog-page-map.test.js
```

## 補足

PDF内の日本語テキストは埋め込みフォントの都合で機械抽出時に文字化けするため、商品データはカタログページを確認して `product-data.js` に整理しています。
