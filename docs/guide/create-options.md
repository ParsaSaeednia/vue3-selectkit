# Create an option

Let people add a missing option without giving up type safety.

## Return a typed option

Provide `create-option(query, { signal })`. Returning an option enables the create action when the trimmed query has no exact matching label. Both synchronous and asynchronous callbacks work.

```ts
interface Tag {
  id: string
  name: string
}
async function createTag(name: string, { signal }: { signal: AbortSignal }): Promise<Tag> {
  const response = await fetch('/api/tags', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!response.ok) throw new Error('Could not create tag')
  return response.json()
}
```

Bind it as `:create-option="createTag"` with `searchable`, `option-key="id"`, and `label-key="name"`.

## Success and failure

The component adds the returned option to its local options, selects it, and emits one `change` with reason `create`, followed by `create`. It never mutates the supplied options. Your callback or application handles persistence.

Duplicate keys or projected values produce `create-error`. Pending creation cannot be submitted twice. Errors preserve the query and can be retried using the error slot. Unmounting aborts the supplied signal and prevents late UI updates.
