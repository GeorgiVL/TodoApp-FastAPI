import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Todo, TodoInput } from '../types'

interface TodoFormProps {
  initial?: Todo | null
  submitting?: boolean
  submitLabel?: string
  onSubmit: (input: TodoInput) => void | Promise<void>
  onCancel?: () => void
}

// Client-side validation mirrors the backend's Pydantic TodoRequest constraints.
function validate(title: string, description: string): string | null {
  if (title.trim().length < 3) return 'Title must be at least 3 characters.'
  if (description.trim().length < 3) return 'Description must be at least 3 characters.'
  if (description.trim().length > 100) return 'Description must be 100 characters or fewer.'
  return null
}

export default function TodoForm({
  initial,
  submitting = false,
  submitLabel = 'Save',
  onSubmit,
  onCancel,
}: TodoFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [priority, setPriority] = useState(initial?.priority ?? 3)
  const [complete, setComplete] = useState(initial?.complete ?? false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const validationError = validate(title, description)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      complete,
    })
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="todo-title">Title</label>
        <input
          id="todo-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          autoFocus
        />
      </div>

      <div className="field">
        <label htmlFor="todo-description">Description</label>
        <textarea
          id="todo-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a few details (max 100 chars)"
          rows={2}
          maxLength={100}
        />
        <span className="char-count">{description.length}/100</span>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="todo-priority">Priority</label>
          <select
            id="todo-priority"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
          >
            <option value={1}>1 — Lowest</option>
            <option value={2}>2 — Low</option>
            <option value={3}>3 — Medium</option>
            <option value={4}>4 — High</option>
            <option value={5}>5 — Highest</option>
          </select>
        </div>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={complete}
            onChange={(e) => setComplete(e.target.checked)}
          />
          Mark as complete
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
