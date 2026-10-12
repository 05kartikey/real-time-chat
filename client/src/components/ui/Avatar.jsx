import clsx from "clsx"
import { Users } from "lucide-react"

const COLORS = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-fuchsia-500",
]

const SIZES = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
  xl: "size-24 text-3xl",
}

// The same name always gets the same color
const colorFor = (name = "") => COLORS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % COLORS.length]

function Avatar({ name, src, size = "md", online = false, group = false, className }) {
  return (
    <div className={clsx("relative shrink-0", className)}>
      {src ? (
        <img src={src} alt={name} className={clsx(SIZES[size], "rounded-full object-cover")} />
      ) : (
        <div
          aria-hidden="true"
          className={clsx(
            SIZES[size],
            group ? "bg-slate-400" : colorFor(name),
            "flex items-center justify-center rounded-full font-semibold uppercase text-white"
          )}
        >
          {group ? <Users className="size-1/2" /> : name?.[0]}
        </div>
      )}
      {online && (
        <span
          title="Online"
          className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-emerald-500"
        />
      )}
    </div>
  )
}

export default Avatar
