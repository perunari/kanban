# カンバンアプリ 固有ガイドライン

## 技術スタック
- フロントエンド: React (Vite)
- バックエンド: Node.js + Express
- DB: SQLite（起動時自動マイグレーション）
- Docker対応

## デザイン指針
- UIライブラリは **Ant Design** を使う（独自CSSは最小限に）
- Ant Design のコンポーネント（Card・Modal・Form・Select・Tag・Button等）を積極的に活用する
- 優先度は Tag コンポーネントで色分け（緊急: red・高: orange・中: blue・低: default）
- レイアウトは Ant Design の Layout・Row・Col を使う
- アイコンは @ant-design/icons を使う
- ドラッグ&ドロップは **@hello-pangea/dnd** を使う（react-beautiful-dnd の後継）
