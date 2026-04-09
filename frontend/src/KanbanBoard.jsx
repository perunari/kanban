import { useEffect, useState, useCallback, useRef } from 'react'
import { Layout, Typography, Spin, Alert, Badge, Button, theme } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { getColumns, getTasks, getMembers, moveTask } from './api'
import TaskCard from './TaskCard'
import TaskModal from './TaskModal'
import MemberManagement from './MemberManagement'

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

      {/* Task List (droppable, scrollable) */}
      <Droppable droppableId={String(column.id)}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px 10px 4px',
              background: snapshot.isDraggingOver
                ? token.colorPrimaryBg
                : 'transparent',
              transition: 'background 0.2s ease',
              minHeight: 60,
            }}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver ? (
              <Text type="secondary" style={{ fontSize: 12, display: 'block', textAlign: 'center', marginTop: 16 }}>
                タスクなし
              </Text>
            ) : (
              tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        ...provided.draggableProps.style,
                        opacity: snapshot.isDragging ? 0.85 : 1,
                      }}
                    >
                      <TaskCard
                        task={task}
                        members={members}
                        onClick={() => onEditTask(task)}
                      />
                    </div>
                  )}
                </Draggable>
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

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
  const [modalOpen, setModalOpen]             = useState(false)
  const [editingTask, setEditingTask]         = useState(null)
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

  const reloadMembers = useCallback(async () => {
    const memberList = await getMembers()
    setMembers(memberList)
  }, [])

  const isDraggingRef = useRef(false)

  useEffect(() => {
    loadData()
  }, [loadData])

  // 5秒ポーリング: モーダルが閉じていてドラッグ中でない場合のみ更新
  useEffect(() => {
    const interval = setInterval(() => {
      if (!modalOpen && !isDraggingRef.current) {
        loadData()
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [loadData, modalOpen])

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

  function handleDragStart() {
    isDraggingRef.current = true
  }

  async function handleDragEnd(result) {
    isDraggingRef.current = false
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const taskId = parseInt(draggableId)
    const srcColumnId = parseInt(source.droppableId)
    const destColumnId = parseInt(destination.droppableId)

    // Optimistic update
    setTasks(prev => {
      const srcTasks = prev
        .filter(t => t.column_id === srcColumnId)
        .sort((a, b) => a.position - b.position)

      const movingTask = prev.find(t => t.id === taskId)

      if (srcColumnId === destColumnId) {
        const reordered = [...srcTasks]
        reordered.splice(source.index, 1)
        reordered.splice(destination.index, 0, movingTask)
        const reorderedIds = new Set(reordered.map(t => t.id))
        const others = prev.filter(t => !reorderedIds.has(t.id))
        return [
          ...others,
          ...reordered.map((t, i) => ({ ...t, position: i })),
        ]
      } else {
        const destTasks = prev
          .filter(t => t.column_id === destColumnId)
          .sort((a, b) => a.position - b.position)

        const newSrcTasks = srcTasks.filter(t => t.id !== taskId)
        const newDestTasks = [...destTasks]
        newDestTasks.splice(destination.index, 0, { ...movingTask, column_id: destColumnId })

        const changedIds = new Set([
          ...newSrcTasks.map(t => t.id),
          ...newDestTasks.map(t => t.id),
        ])
        const others = prev.filter(t => !changedIds.has(t.id))
        return [
          ...others,
          ...newSrcTasks.map((t, i) => ({ ...t, position: i })),
          ...newDestTasks.map((t, i) => ({ ...t, position: i })),
        ]
      }
    })

    try {
      await moveTask(taskId, { column_id: destColumnId, position: destination.index })
      // Sync with server to get accurate positions
      await loadData()
    } catch {
      // Revert on failure
      await loadData()
    }
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
        <MemberManagement members={members} onMembersChange={reloadMembers} />
      </Header>

      <Content style={{ padding: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
        </DragDropContext>
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
