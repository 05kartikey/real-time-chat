import { MessageSquare } from "lucide-react"

function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <MessageSquare className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">{children}</div>
        <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>
      </div>
    </div>
  )
}

export default AuthLayout
