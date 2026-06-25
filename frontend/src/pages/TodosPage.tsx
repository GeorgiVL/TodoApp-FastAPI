import { useCallback, useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import TodoForm from '../components/TodoForm'
import TodoItem from '../components/TodoItem'
import { createTodo, deleteTodo, listTodos, updateTodo } from '../api/todos'
import { ApiError } from '../api/client'
import type { Todo, TodoInput } from '../types'

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Todo | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listTodos()
      // Newest first, then incomplete before complete for a tidy list.
      data.sort((a, b) => Number(a.complete) - Number(b.complete) || b.id - a.id)
      setTodos(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load todos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleCreate(input: TodoInput) {
    setSubmitting(true)
    setError(null)
    try {
      await createTodo(input)
      setShowCreate(false)
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create todo.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(input: TodoInput) {
    if (!editing) return
    setSubmitting(true)
    setError(null)
    try {
      await updateTodo(editing.id, input)
      setEditing(null)
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update todo.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggle(todo: Todo) {
    setBusyId(todo.id)
    setError(null)
    try {
      await updateTodo(todo.id, {
        title: todo.title,
        description: todo.description,
        priority: todo.priority,
        complete: !todo.complete,
      })
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update todo.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(todo: Todo) {
    if (!window.confirm(`Delete "${todo.title}"?`)) return
    setBusyId(todo.id)
    setError(null)
    try {
      await deleteTodo(todo.id)
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete todo.')
    } finally {
      setBusyId(null)
    }
  }

  const completedCount = todos.filter((t) => t.complete).length

  return (
    <>
      <Navbar />
      <main className="container">
        <div className="page-header">
          <div>
            <h1>Your todos</h1>
            {!loading && todos.length > 0 && (
              <p className="page-subtitle">
                {completedCount} of {todos.length} complete
              </p>
            )}
          </div>
          {!showCreate && (
            <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
              + New todo
            </button>
          )}
        </div>

        {showCreate && (
          <div className="card">
            <h2 className="card-title">Add a todo</h2>
            <TodoForm
              submitting={submitting}
              submitLabel="Add todo"
              onSubmit={handleCreate}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        )}

        {error && <p className="form-error banner">{error}</p>}

        {loading ? (
          <p className="muted">Loading…</p>
        ) : todos.length === 0 ? (
          <div className="empty-state">
            <p>No todos yet.</p>
            <p className="muted">Create your first one to get started.</p>
          </div>
        ) : (
          <ul className="todo-list">
            {todos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                busy={busyId === todo.id}
                onToggle={handleToggle}
                onEdit={setEditing}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </main>

      {editing && (
        <div className="modal-overlay" onClick={() => !submitting && setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="card-title">Edit todo</h2>
            <TodoForm
              initial={editing}
              submitting={submitting}
              submitLabel="Save changes"
              onSubmit={handleUpdate}
              onCancel={() => setEditing(null)}
            />
          </div>
        </div>
      )}
    </>
  )
}
