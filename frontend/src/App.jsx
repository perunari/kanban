import { ConfigProvider } from 'antd'
import jaJP from 'antd/locale/ja_JP'

function App() {
  return (
    <ConfigProvider locale={jaJP}>
      <div>カンバンボード（準備中）</div>
    </ConfigProvider>
  )
}

export default App
