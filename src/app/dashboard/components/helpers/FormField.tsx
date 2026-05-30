'use client'

interface FormFieldProps {
  label: string
  hint?: string
  required?: boolean
  type?: string
  value: any
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  options?: Array<{ value: string; label: string }>
  textarea?: boolean
  checkbox?: boolean
}

export default function FormField({
  label,
  hint,
  required,
  type = 'text',
  value,
  onChange,
  options,
  textarea,
  checkbox,
}: FormFieldProps) {
  if (checkbox) {
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-700/30 rounded-lg border border-gray-600">
        <input
          type="checkbox"
          checked={value}
          onChange={onChange}
          className="w-4 h-4 accent-blue-500"
        />
        <label className="text-xs text-gray-300">{label}</label>
      </div>
    )
  }

  return (
    <div className={textarea ? 'col-span-1 md:col-span-2' : ''}>
      <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {textarea ? (
        <textarea
          rows={3}
          value={value}
          onChange={onChange}
          placeholder={hint}
          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none"
        />
      ) : options ? (
        <select
          value={value ?? ''}
          onChange={onChange}
          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 transition"
        >
          <option value="">აირჩიე...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value ?? ''}
          onChange={onChange}
          placeholder={hint}
          required={required}
          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
        />
      )}
    </div>
  )
}