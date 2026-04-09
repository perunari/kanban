# Kanban App

社内向けカンバンボードアプリです。

## 技術スタック

- フロントエンド: React (Vite) + Ant Design
- バックエンド: Node.js + Express
- DB: SQLite
- コンテナ: Docker / Docker Compose

## セットアップ

### 環境変数

`.env` ファイルを `kanban/` ディレクトリに作成してください:

```env
API_KEY=your-strong-random-api-key
```

### 起動

```bash
cd kanban
docker compose up --build
```

- フロントエンド: http://localhost:5173
- バックエンド API: http://localhost:3001

## セキュリティ上の注意

> **このアプリは社内ネットワーク限定での使用を前提としています。**

### VITE_API_KEY について

`VITE_API_KEY` は Vite のビルド時に JavaScript バンドルへ **静的に埋め込まれます**。  
ブラウザの DevTools からバンドルを閲覧すれば誰でも API キーを取得できるため、
**インターネットへの公開は禁止です**。

必ず以下のいずれかのネットワーク境界保護を実施してください:

- VPN によるアクセス制限
- ファイアウォール / リバースプロキシによる IP 制限
- インターネット非到達のプライベートサブネットへの配置

詳細は [SECURITY.md](./SECURITY.md) を参照してください。
