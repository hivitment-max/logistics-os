export default function OrderDetailsModal({ order, onClose }: { order: any, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 p-6 rounded-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4">📋 {order?.tracking_code}</h3>
        <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded">დახურვა</button>
      </div>
    </div>
  )
}
