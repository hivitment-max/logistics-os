'use client'

interface ActionButtonsProps {
  onEdit?: () => void
  onDelete?: () => void
  onPrint?: () => void
}

export default function ActionButtons({ onEdit, onDelete, onPrint }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      {onPrint && (
        <button
          onClick={onPrint}
          className="p-1.5 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 rounded-md transition"
          title="დაბეჭდვა / დეტალები"
        >
          🖨️
        </button>
      )}
      {onEdit && (
        <button
          onClick={onEdit}
          className="p-1.5 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-md transition"
          title="რედაქტირება"
        >
          ✏️
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="p-1.5 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-md transition"
          title="წაშლა"
        >
          🗑️
        </button>
      )}
    </div>
  )
}