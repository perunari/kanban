import { Card, Tag, Typography, Space, Tooltip } from 'antd'
import { UserOutlined, CalendarOutlined, ExclamationCircleOutlined } from '@ant-design/icons'

const { Text } = Typography

const PRIORITY_CONFIG = {
  urgent: { color: 'red',     label: '緊急', icon: <ExclamationCircleOutlined /> },
  high:   { color: 'orange',  label: '高' },
  medium: { color: 'blue',    label: '中' },
  low:    { color: 'default', label: '低' },
}

function formatDueDate(dateStr) {
  if (!dateStr) return null
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(date)
  due.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((due - today) / (1000 * 60 * 60 * 24))

  const label = `${date.getMonth() + 1}/${date.getDate()}`
  let color = 'default'
  if (diffDays < 0) color = 'red'
  else if (diffDays === 0) color = 'orange'
  else if (diffDays <= 3) color = 'gold'

  return { label, color }
}

export default function TaskCard({ task, members, onClick }) {
  const member = members.find((m) => m.id === task.member_id)
  const priority = PRIORITY_CONFIG[task.priority] || { color: 'default', label: task.priority }
  const dueInfo = formatDueDate(task.due_date)

  return (
    <Card
      size="small"
      hoverable
      onClick={onClick}
      style={{ marginBottom: 8, cursor: onClick ? 'pointer' : 'default' }}
      styles={{ body: { padding: '8px 10px' } }}
    >
      <Text strong style={{ display: 'block', marginBottom: 6, fontSize: 13, lineHeight: '1.4' }}>
        {task.title}
      </Text>

      <Space size={4} wrap>
        <Tag
          color={priority.color}
          icon={priority.icon}
          style={{ margin: 0, fontSize: 11 }}
        >
          {priority.label}
        </Tag>

        {member && (
          <Tag icon={<UserOutlined />} style={{ margin: 0, fontSize: 11 }} color="geekblue">
            {member.name}
          </Tag>
        )}

        {dueInfo && (
          <Tooltip title={`期限: ${task.due_date}`}>
            <Tag
              icon={<CalendarOutlined />}
              color={dueInfo.color}
              style={{ margin: 0, fontSize: 11 }}
            >
              {dueInfo.label}
            </Tag>
          </Tooltip>
        )}
      </Space>
    </Card>
  )
}
