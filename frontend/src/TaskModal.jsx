import { useEffect } from 'react'
import { Modal, Form, Input, Select, DatePicker, Button, Space, Popconfirm, message } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { createTask, updateTask, deleteTask } from './api'

const { TextArea } = Input

const PRIORITY_OPTIONS = [
  { value: 'urgent', label: '緊急' },
  { value: 'high',   label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low',    label: '低' },
]

/**
 * TaskModal - タスクの作成・編集・削除モーダル
 *
 * Props:
 *   open        - 表示フラグ
 *   task        - 編集対象タスク（null なら新規作成）
 *   columns     - カラム一覧 [{id, name}]
 *   members     - メンバー一覧 [{id, name}]
 *   defaultColumnId - 新規作成時のデフォルトカラムID
 *   onSuccess   - 作成・更新・削除後のコールバック
 *   onCancel    - モーダルを閉じるコールバック
 */
export default function TaskModal({ open, task, columns, members, defaultColumnId, onSuccess, onCancel }) {
  const [form] = Form.useForm()
  const isEdit = !!task

  useEffect(() => {
    if (open) {
      if (isEdit) {
        form.setFieldsValue({
          title:       task.title,
          description: task.description || '',
          column_id:   task.column_id,
          member_id:   task.member_id ?? undefined,
          priority:    task.priority || 'medium',
          due_date:    task.due_date ? dayjs(task.due_date) : undefined,
        })
      } else {
        form.resetFields()
        form.setFieldsValue({
          priority:  'medium',
          column_id: defaultColumnId ?? (columns[0]?.id),
        })
      }
    }
  }, [open, task, isEdit, form, defaultColumnId, columns])

  async function handleOk() {
    let values
    try {
      values = await form.validateFields()
    } catch {
      return
    }

    const payload = {
      title:       values.title.trim(),
      description: values.description?.trim() || '',
      member_id:   values.member_id ?? null,
      priority:    values.priority,
      due_date:    values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
    }

    try {
      if (isEdit) {
        await updateTask(task.id, payload)
        message.success('タスクを更新しました')
      } else {
        await createTask({ ...payload, column_id: values.column_id })
        message.success('タスクを作成しました')
      }
      onSuccess()
    } catch (e) {
      message.error(e.message || '操作に失敗しました')
    }
  }

  async function handleDelete() {
    try {
      await deleteTask(task.id)
      message.success('タスクを削除しました')
      onSuccess()
    } catch (e) {
      message.error(e.message || '削除に失敗しました')
    }
  }

  return (
    <Modal
      title={isEdit ? 'タスクを編集' : 'タスクを作成'}
      open={open}
      onCancel={onCancel}
      destroyOnClose
      footer={
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          {isEdit ? (
            <Popconfirm
              title="このタスクを削除しますか？"
              okText="削除"
              okType="danger"
              cancelText="キャンセル"
              onConfirm={handleDelete}
            >
              <Button danger icon={<DeleteOutlined />}>削除</Button>
            </Popconfirm>
          ) : (
            <span />
          )}
          <Space>
            <Button onClick={onCancel}>キャンセル</Button>
            <Button type="primary" onClick={handleOk}>
              {isEdit ? '更新' : '作成'}
            </Button>
          </Space>
        </Space>
      }
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item
          name="title"
          label="タイトル"
          rules={[
            { required: true, message: 'タイトルを入力してください' },
            { max: 100, message: '100文字以内で入力してください' },
            { whitespace: true, message: 'タイトルを入力してください' },
          ]}
        >
          <Input placeholder="タスクのタイトル" maxLength={100} showCount />
        </Form.Item>

        <Form.Item name="description" label="説明">
          <TextArea placeholder="詳細説明（任意）" rows={3} maxLength={500} showCount />
        </Form.Item>

        <Form.Item
          name="column_id"
          label="列"
          rules={[{ required: true, message: '列を選択してください' }]}
        >
          <Select placeholder="列を選択">
            {columns.map((col) => (
              <Select.Option key={col.id} value={col.id}>{col.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="priority"
          label="優先度"
          rules={[{ required: true, message: '優先度を選択してください' }]}
        >
          <Select options={PRIORITY_OPTIONS} />
        </Form.Item>

        <Form.Item name="member_id" label="担当者">
          <Select placeholder="担当者を選択（任意）" allowClear>
            {members.map((m) => (
              <Select.Option key={m.id} value={m.id}>{m.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="due_date" label="期限">
          <DatePicker style={{ width: '100%' }} placeholder="期限を選択（任意）" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
