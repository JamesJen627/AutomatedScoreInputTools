interface PageAction {
  readonly label: string
  readonly disabled?: boolean
}

interface PagePlaceholderProps {
  readonly title: string
  readonly description: string
  readonly actions?: readonly PageAction[]
}

export function PagePlaceholder({
  title,
  description,
  actions = []
}: PagePlaceholderProps): React.ReactElement {
  return (
    <div className="page page-placeholder">
      <header className="page__header">
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      {actions.length > 0 && (
        <div className="page-placeholder__actions">
          {actions.map((action) => (
            <button key={action.label} type="button" className="btn btn--primary" disabled={action.disabled}>
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
