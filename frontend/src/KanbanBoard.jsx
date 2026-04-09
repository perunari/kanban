import { useEffect, useState, useCallback } from 'react'
import { Layout, Typography, Spin, Alert, Badge, Button, theme } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { getColumns, getTasks, getMembers } from './api'
import TaskCard from './TaskCard'
import TaskModal from './TaskModal'

const { Header, Content } = Layout
const { Title, Text } = Typography

function KanbanColumn({ column, tasks, members, onAddTask, onEditTask }) {
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
            <TaskCard
              key={task.id}
              task={task}
              members={members}
              onClick={() => onEditTask(task)}
            />
          ))
        )}
      </div>

      {/* Add Task Button */}
      <div style={{ padding: '4px 10px 10px', flexShrink: 0 }}>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          block
          size="small"
          onClick={() => onAddTask(column.id)}
        >
          タスクを追加
        </Button>
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

  // Modal state
  const [modalOpen, setModalOpen]           = useState(false)
  const [editingTask, setEditingTask]       = useState(null)   // null = 新規作成
  const [defaultColumnId, setDefaultColumnId] = useState(null)

  const loadData = useCallback(async () => {
    try {
      const [cols, taskList, memberList] = await Promise.all([getColumns(), getTasks(), getMembers()])
      setColumns(cols)
      setTasks(taskList)
      setMembers(memberList)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  function openAddModal(columnId) {
    setEditingTask(null)
    setDefaultColumnId(columnId)
    setModalOpen(true)
  }

  function openEditModal(task) {
    setEditingTask(task)
    setDefaultColumnId(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingTask(null)
  }

  async function handleModalSuccess() {
    closeModal()
    await loadData()
  }

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
              onAddTask={openAddModal}
              onEditTask={openEditModal}
            />
          ))}
        </div>
      </Content>

      <TaskModal
        open={modalOpen}
        task={editingTask}
        columns={columns}
        members={members}
        defaultColumnId={defaultColumnId}
        onSuccess={handleModalSuccess}
        onCancel={closeModal}
      />
    </Layout>
  )
}
