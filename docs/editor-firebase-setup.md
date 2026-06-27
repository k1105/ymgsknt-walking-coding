# /editor の Firebase 有効化手順

オンラインエディタ（`/editor`）は **Firebase が未設定でもローカルで動作**します（IndexedDB ドラフトのみ）。
本番で「山岸さん個人だけがアクセスでき、端末をまたいで保持される」状態にするには、以下を設定してください。

## 1. Firebase プロジェクト作成

1. https://console.firebase.google.com で新規プロジェクトを作成
2. **Authentication** → Sign-in method → **Google** を有効化
3. **Firestore Database** を作成（本番モードで開始）
4. プロジェクト設定 → 「ウェブアプリ」を追加し、表示される `firebaseConfig` の値を控える

## 2. 承認済みドメインの追加

Authentication → Settings → 承認済みドメイン に以下を追加：

- `localhost`
- 本番ドメイン（例 `your-app.vercel.app` / 独自ドメイン）

## 3. 環境変数

`.env.local`（ローカル）と Vercel の環境変数に以下を設定（値は `firebaseConfig` から）：

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

`NEXT_PUBLIC_*` は公開される値で問題ありません（保護は下記ルールが担保）。

> Vercel CLI を使う場合：`vercel env add NEXT_PUBLIC_FIREBASE_API_KEY` … を各キー分。

## 4. Firestore セキュリティルール

リポジトリ直下の `firestore.rules` を Firebase コンソール（Firestore → ルール）に貼り付けて公開。
これが**本当のアクセスゲート**です（許可メール `kntymgs1105@gmail.com` のみ read/write 可）。

別のメールを許可したい場合は `firestore.rules` と `lib/editor/firebase.ts` の `ALLOWED_EMAIL` を**両方**書き換えること。

## 5. 動作確認

1. `.env.local` 設定後に `next dev` を再起動
2. `/editor` を開くと **Google サインイン画面**が出る（＝ Firebase 有効化成功）
3. 許可メールでサインイン → エディタが開く
4. コードを編集 → 別端末／別ブラウザで同じアカウントでサインインすると同じ内容が同期される

## データモデル

```
sketches/{id} = {
  sketch: { id, entry, files: { "sketch.js": {...}, ... }, libraries: [...] },
  updatedAt: <ms>
}
```

- 現状 id は `"draft"` 固定（作業中スケッチ1件）。将来 publish 時に日付 id へ分岐予定（Phase 4）。
- 画像/フォント等のバイナリは将来 Firebase Storage へ（現状は data URL でVFS内）。

## 保持の二層構造

| 層 | 保存先 | タイミング | 役割 |
|---|---|---|---|
| ① ドラフト | IndexedDB | 入力から ~300ms | 即時・オフライン・クラッシュ耐性 |
| ② 正本 | Firestore | 入力から ~300ms（サインイン時） | 端末横断・正本。再オープン時 updatedAt の新しい方を採用 |
