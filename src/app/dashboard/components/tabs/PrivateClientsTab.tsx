'use client'
import LoadingTruck from '@/app/dashboard/components/ui/LoadingTruck'

interface PrivateClientsTabProps {
  clients: any[]
  loading: boolean
  onEdit: (client: any) => void
  onDelete: (client: any) => void
  onAdd: () => void
  ActionButtons: React.ComponentType<{ onEdit: () => void; onDelete: () => void }>
}

export default function PrivateClientsTab({ 
  clients, loading, onEdit, onDelete, onAdd, ActionButtons 
}: PrivateClientsTabProps) {
  if (loading) return <LoadingTruck message="კერძო პირები იტვირთება..." size="md" />

  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700/50 flex justify-between items-center bg-gray-800/80">
        <h2 className="text-xs font-bold uppercase text-gray-300">👤 კერძო პირები</h2>
        <button onClick={onAdd} className="bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded text-[10px] font-semibold transition">+ ახალი</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead className="text-gray-400 uppercase bg-gray-900/40">
            <tr>
              <th className="px-4 py-3 text-left">სახელი და გვარი</th>
              <th className="px-4 py-3 text-left">პირადი ნომერი</th>
              <th className="px-4 py-3 text-left">ტელეფონი</th>
              <th className="px-4 py-3 text-left">ელ-ფოსტა</th>
              <th className="px-4 py-3 text-left">მისამართი</th>
              <th className="px-4 py-3 text-left">სტატუსი</th>
              <th className="px-4 py-3 text-right">მოქმედება</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {clients.map(c => (
              <tr key={c.id} className="hover:bg-gray-700/20 transition">
                <td className="px-4 py-3 font-medium text-gray-200">{c.full_name}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-[9px]">{c.personal_id}</td>
                <td className="px-4 py-3 text-gray-400">{c.phone || '–'}</td>
                <td className="px-4 py-3 text-gray-400">{c.email || '–'}</td>
                <td className="px-4 py-3 text-gray-400">{c.address || '–'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] border ${
                    c.is_active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}>{c.is_active ? 'აქტიური' : 'არააქტიური'}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <ActionButtons onEdit={() => onEdit(c)} onDelete={() => onDelete(c)} />
                </td>
              </tr>
            ))}
            {clients.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">კერძო პირები არ არის</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}