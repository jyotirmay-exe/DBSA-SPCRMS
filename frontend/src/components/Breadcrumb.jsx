import { Link } from 'react-router-dom'

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-1 text-xs text-slate-500 mb-5">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-slate-400">/</span>}
          {item.to
            ? <Link to={item.to} className="hover:text-slate-700 transition-colors">{item.label}</Link>
            : <span className="text-slate-700">{item.label}</span>
          }
        </span>
      ))}
    </nav>
  )
}
