 Container autodev-autodev-run-3208bd41fade Creating 
 Container autodev-autodev-run-3208bd41fade Created 
SECURITY_FAIL
- [MEDIUM] backend/src/index.js:8 - `app.use(cors())` がオリジン制限なしで全ドメインからのリクエストを許可している。本番環境では `cors({ origin: 'https://your-domain.com' })` のように許可オリジンを明示的に指定すること。
- [MEDIUM] backend/src/index.js:16-285 - 全APIエンドポイントに認証・認可チェックが存在しない。APIに直接アクセス可能な環境では、誰でもタスク・メンバー・カラムの作成・更新・削除が可能。最低限、APIキー検証またはセッション認証ミドルウェアを追加すること。
- [LOW] backend/src/index.js:23 - `POST /api/members` の `name` フィールドにバックエンド側の長さ制限がない。フロントエンドは `maxLength={50}` を持つが、APIを直接叩かれた場合は無制限の文字列が保存される。`name.length > 100` 等のチェックを追加すること。
- [LOW] backend/src/index.js:57 - `POST /api/columns` の `name` フィールドも同様に長さ制限なし。同上の対応を行うこと。
- [LOW] backend/src/index.js:116 - `POST /api/tasks` の `title`・`description` フィールドにバックエンド側の長さ制限がない。大量データによるDB肥大化やDoSのリスクがある。
- [LOW] backend/src/index.js:114 - `due_date` の書式バリデーションが存在しない。任意の文字列（例: `"' OR 1=1"`）が保存可能。SQLインジェクションはプレースホルダーにより防止されているが、不正なデータが永続化される。`/^\d{4}-\d{2}-\d{2}$/.test(due_date)` のような正規表現チェックを追加すること。
