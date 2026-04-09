import { ConfigProvider } from 'antd'
import jaJP from 'antd/locale/ja_JP'
import KanbanBoard from './KanbanBoard'

function App() {
  return (
    <ConfigProvider locale={jaJP}>
      <KanbanBoard />
    </ConfigProvider>
  )
}

export default App
