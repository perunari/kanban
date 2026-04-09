import { useState } from 'react'
import { Button, Modal, List, Input, Space, Typography, Popconfirm, Avatar, message } from 'antd'
import { UserOutlined, PlusOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons'
import { createMember, deleteMember } from './api'

const { Text } = Typography

export default function MemberManagement({ members, onMembersChange }) {
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleAdd() {
    const name = newName.trim()
    if (!name) return
    setAdding(true)
    try {
      await createMember(name)
      setNewName('')
      await onMembersChange()
      message.success(`${name} を追加しました`)
    } catch (e) {
      message.error(e.message || 'メンバーの追加に失敗しました')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(member) {
    try {
      await deleteMember(member.id)
      await onMembersChange()
      message.success(`${member.name} を削除しました`)
    } catch (e) {
      message.error(e.message || 'メンバーの削除に失敗しました')
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <>
      <Button
        icon={<TeamOutlined />}
        onClick={() => setOpen(true)}
        style={{ marginLeft: 'auto' }}
      >
        メンバー管理
      </Button>

      <Modal
        title={
          <Space>
            <TeamOutlined />
            メンバー管理
          </Space>
        }
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={400}
      >
        {/* Add Member */}
        <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
          <Input
            prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="メンバー名を入力"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={50}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            loading={adding}
            disabled={!newName.trim()}
          >
            追加
          </Button>
        </Space.Compact>

        {/* Member List */}
        <List
          dataSource={members}
          locale={{ emptyText: 'メンバーがいません' }}
          renderItem={(member) => (
            <List.Item
              actions={[
                <Popconfirm
                  key="delete"
                  title={`${member.name} を削除しますか？`}
                  description="このメンバーに紐づくタスクの担当者は未設定になります。"
                  onConfirm={() => handleDelete(member)}
                  okText="削除"
                  cancelText="キャンセル"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                  />
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={<UserOutlined />}
                    style={{ backgroundColor: '#1677ff' }}
                  />
                }
                title={<Text>{member.name}</Text>}
              />
            </List.Item>
          )}
        />
      </Modal>
    </>
  )
}
