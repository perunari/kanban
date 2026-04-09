 Container autodev-autodev-run-f8fe235b794f Creating 
 Container autodev-autodev-run-f8fe235b794f Created 
SECURITY_FAIL
- [HIGH] `frontend/src/api.js` — `x-api-key` ヘッダーが一切送信されていない。バックエンドは `app.use('/api', requireApiKey)` で全エンドポイントに認証を要求しているが、フロントエンドの `request()` 関数はそのヘッダーを含まない。結果として全 API 呼び出しが 401 を返しアプリが機能しない（認証機構の実装漏れ）。修正: `VITE_API_KEY` 環境変数を用意し `headers` に `'x-api-key': import.meta.env.VITE_API_KEY` を追加する。
- [MEDIUM] `backend/src/index.js:8` + `docker-compose.yml` — API キーのフォールバック値 `'internal-dev-key'` がソースコード上にハードコードされており、`docker-compose.yml` でも `API_KEY` 環境変数が設定されていない。本番・開発いずれの環境でもデフォルト値が使われ、ソースコードを読んだ攻撃者が認証を突破できる。修正: `docker-compose.yml` の `backend.environment` に `API_KEY` をシークレット経由で設定し、コード側はフォールバックを削除してenv未設定時に起動失敗させる。
