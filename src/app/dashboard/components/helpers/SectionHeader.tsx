'use client'

interface SectionHeaderProps {
  title: string
  icon: string
  color: string
}

export default function SectionHeader({ title, icon, color }: SectionHeaderProps) {
  return (
    <div className={`flex items-center gap-2 mb-4 pb-2 border-b border-gray-700/50 ${color}`}>
      <span className="text-lg">{icon}</span>
      <h3 className="text-xs font-bold uppercase tracking-wider">{title}</h3>
    </div>
  )
}