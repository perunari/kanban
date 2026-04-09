import { useEffect, useState } from 'react'
import { Layout, Typography, Spin, Alert, Badge, theme } from 'antd'
import { getColumns, getTasks } from './api'

const { Header, Content } = Layout
const { Title, Text } = Typography

const PRIORITY_COLOR = {
  urgent: '#ff4d4f',
  high:   '#fa8c16',
  medium: '#1677ff',
  low:    '#8c8c8c',
}

const PRIORITY_LABEL = {
  urgent: '緊急',
  high:   '高',
  medium: '中',
  low:    '低',
}

function TaskItem({ task, members }) {
  const member = members.find((m) => m.id === task.member_id)
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e8e8e8',
      borderRadius: 6,
      padding: '8px 10px',
      marginBottom: 8,
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    }}>
      <Text strong style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>
        {task.title}
      </Text>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
        <span style={{
          fontSize: 11,
          color: '#fff',
          background: PRIORITY_COLOR[task.priority] || '#8c8c8c',
          borderRadius: 3,
          padding: '1px 5px',
        }}>
          {PRIORITY_LABEL[task.priority] || task.priority}
        </span>
        {member && (
          <Text type="secondary" style={{ fontSize: 11 }}>
            {member.name}
          </Text>
        )}
        {task.due_date && (
          <Text type="secondary" style={{ fontSize: 11 }}>
            {task.due_date}
          </Text>
        )}
      </div>
    </div>
  )
}

function KanbanColumn({ column, tasks, members }) {
  const { token } = theme.useToken()
  return (
    <div style={{
      width: 260,
      minWidth: 260,
      background: token.colorFillAlter,
      borderRadius: 8,
      display: 'flex',
      flexDirection: 'column',
      maxHeight: 'calc(100vh - 120px)',
    }}>
      {/* Column Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: `2px solid ${token.colorBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: token.colorBgContainer,
        borderRadius: '8px 8px 0 0',
        flexShrink: 0,
      }}>
        <Text strong style={{ fontSize: 14 }}>{column.name}</Text>
        <Badge count={tasks.length} showZero color={token.colorPrimary} />
      </div>

      {/* Task List (scrollable) */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 10px 4px',
      }}>
        {tasks.length === 0 ? (
          <Text type="secondary" style={{ fontSize: 12, display: 'block', textAlign: 'center', marginTop: 16 }}>
            タスクなし
          </Text>
        ) : (
          tasks.map((task) => (
            <TaskItem key={task.id} task={task} members={members} />
          ))
        )}
      </div>
    </div>
  )
}

export default function KanbanBoard() {
  const [columns, setColumns]   = useState([])
  const [tasks, setTasks]       = useState([])
  const [members, setMembers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const [cols, taskList] = await Promise.all([getColumns(), getTasks()])
        setColumns(cols)
        setTasks(taskList)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert type="error" message="データの取得に失敗しました" description={error} showIcon />
      </div>
    )
  }

  const tasksByColumn = Object.fromEntries(
    columns.map((col) => [
      col.id,
      tasks
        .filter((t) => t.column_id === col.id)
        .sort((a, b) => a.position - b.position),
    ])
  )

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{
        background: '#001529',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <Title level={4} style={{ color: '#fff', margin: 0 }}>
          カンバンボード
        </Title>
      </Header>

      <Content style={{ padding: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Horizontal scrolling board */}
        <div style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 12,
          flex: 1,
          alignItems: 'flex-start',
        }}>
          {columns.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={tasksByColumn[col.id] || []}
              members={members}
            />
          ))}
        </div>
      </Content>
    </Layout>
  )
}
