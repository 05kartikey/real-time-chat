import { useEffect, useState } from "react"
import axios from "axios"
import { Check, Search } from "lucide-react"
import clsx from "clsx"
import useDebounce from "../../hooks/useDebounce"
import { usersApi } from "../../services/chatApi"
import { getErrorMessage } from "../../services/api"
import Avatar from "../ui/Avatar"
import Spinner from "../ui/Spinner"

// Debounced user search. Each new query aborts the previous request, so a
// slow response for "al" can never overwrite the results for "alice".
function UserSearch({ onSelect, selectedIds = [], excludeIds = [], autoFocus = false }) {
  const [query, setQuery] = useState("")
  const debounced = useDebounce(query.trim(), 300)
  const [result, setResult] = useState({ query: "", users: [], error: null })

  useEffect(() => {
    if (!debounced) return
    const controller = new AbortController()

    usersApi
      .search(debounced, { signal: controller.signal })
      .then((users) => setResult({ query: debounced, users, error: null }))
      .catch((err) => {
        if (!axios.isCancel(err)) setResult({ query: debounced, users: [], error: getErrorMessage(err) })
      })

    return () => controller.abort()
  }, [debounced])

  const isCurrent = debounced && result.query === debounced
  const isLoading = Boolean(query.trim()) && !isCurrent
  const users = isCurrent ? result.users.filter((u) => !excludeIds.includes(u.id)) : []

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">Search users</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username"
          autoFocus={autoFocus}
          className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </label>

      <div className="mt-2 min-h-24">
        {isLoading && (
          <div className="flex justify-center py-6">
            <Spinner className="size-5" />
          </div>
        )}
        {isCurrent && result.error && <p className="py-4 text-center text-sm text-rose-600">{result.error}</p>}
        {isCurrent && !result.error && users.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-500">No users found</p>
        )}
        {!query.trim() && <p className="py-4 text-center text-sm text-slate-400">Type a username to search</p>}

        <ul className="space-y-1">
          {users.map((u) => {
            const selected = selectedIds.includes(u.id)
            return (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => onSelect(u)}
                  aria-pressed={selected}
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition",
                    selected ? "bg-indigo-50" : "hover:bg-slate-50"
                  )}
                >
                  <Avatar name={u.username} src={u.avatar} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u.username}</p>
                    {u.bio && <p className="truncate text-xs text-slate-500">{u.bio}</p>}
                  </div>
                  {selected && <Check className="size-4 text-indigo-600" />}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default UserSearch
