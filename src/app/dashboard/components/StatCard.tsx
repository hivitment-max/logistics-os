export default function StatCard({ title, value, change, color }: { 
  title: string; value: string; change?: string; color: string 
}) {
  return (
    <div className={`${color} p-6 rounded-xl`}>
      <p className="text-white/80 text-sm">{title}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
      {change && <p className="text-white/60 text-sm mt-2">{change}</p>}
    </div>
  )
}
