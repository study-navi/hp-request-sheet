# HP制作 ご希望シート

公開先: https://study-navi.github.io/hp-request-sheet/
管理画面: https://study-navi.github.io/hp-request-sheet/admin.html

添付の5ステップとかわいいデザインを活用した、GitHub Pages + Supabaseの希望受付アプリです。

## 利用・管理
- 公開URLを制作希望者へ送ります。活動名・連絡先・同意が必須です。
- 入力は端末に30日間保存。送信成功時に下書きは削除されます。
- 管理画面は事前登録されたSupabase Authアカウントでログインします。GitHubのパスワードではありません。
- 一覧・検索・対応状況・詳細・コピー・TXT/JSONダウンロードが使えます。
- テスト回答はアーカイブで分けられます。
- iPhone Safariの共有メニューから「ホーム画面に追加」。オフラインでは下書き入力まで。送信はオンライン必須です。

## 構成
- index.html / app.css: 入力と選択連動プレビュー
- admin.html / admin.js / admin.css: 認証済み管理者用UI
- config.js: 公開可能なキーのみ。秘密キーは置きません。
- edge-function.ts: Supabase hp-request-submitのソース。サービスキーはSupabaseの実行環境でのみ参照。
- manifest.json / sw.js / アイコン: PWA

## セキュリティ
- hp_requestsはRLS有効。一般利用者に直接のSELECT/INSERT/UPDATE権限はありません。
- hp_request_adminsに登録されたauth.uid()だけが回答を読み、status列を変更できます。
- 送信APIはサーバー側入力チェック、同意チェック、送信回数制限、同じUUIDによる再送の重複防止を行います。
- 送信成功は保存済みの受付番号と時刻を確認後に表示します。
- 回答・管理API・ログイン画面はService Workerにキャッシュしません。
- 管理セッションはsessionStorage（タブ単位）です。共用端末では必ずログアウトしてください。

## 更新
GitHubのmain更新でPagesに反映されます。PWAを更新する際はsw.jsのCACHE名を新しい版にしてください。入力中の自動リロードを避け、ネットワーク優先で新しいファイルを取得します。新しいService Workerは既存タブを閉じた後に有効になります。

費用のかかる契約変更はしていません。Supabaseの既存プロジェクトを共用しているため、利用枠・稼働状態を管理してください。IPのハッシュは送信回数制限用で、管理画面には公開しません。

## 運用注意
回答の削除依頼は、制作担当者が受付番号を確認して専用テーブルの該当行のみを削除します。管理画面のアーカイブは削除ではありません。保存期間は制作の必要がなくなった時点を目安に整理してください。
