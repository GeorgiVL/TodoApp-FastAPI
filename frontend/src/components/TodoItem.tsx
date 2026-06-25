import type { Todo } from '../types'

interface TodoItemProps {
  todo: Todo
  busy?: boolean
  onToggle: (todo: Todo) => void
  onEdit: (todo: Todo) => void
  onDelete: (todo: Todo) => void
}

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Lowest',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Highest',
}

export default function TodoItem({ todo, busy = false, onToggle, onEdit, onDelete }: TodoItemProps) {
  return (
    <li className={`todo-item${todo.complete ? ' is-complete' : ''}`}>
      <input
        type="checkbox"
        className="todo-check"
        checked={todo.complete}
        disabled={busy}
        onChange={() => onToggle(todo)}
        aria-label={todo.complete ? 'Mark as not complete' : 'Mark as complete'}
      />

      <div className="todo-body">
        <span className="todo-title">{todo.title}</span>
        <span className="todo-description">{todo.description}</span>
      </div>

      <span className="priority-badge" data-priority={todo.priority}>
        P{todo.priority} · {PRIORITY_LABELS[todo.priority] ?? '—'}
      </span>

      <div className="todo-actions">
        <button type="button" className="btn btn-small" onClick={() => onEdit(todo)} disabled={busy}>
          Edit
        </button>
        <button
          type="button"
          className="btn btn-small btn-danger"
          onClick={() => onDelete(todo)}
          disabled={busy}
        >
          Delete
        </button>
      </div>
    </li>
  )
}
