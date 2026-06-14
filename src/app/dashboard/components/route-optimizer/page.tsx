import RouteOptimizer from '@/app/dashboard/components/route-optimizer/RouteOptimizer'

export default function RouteOptimizerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>🗺️</span>
          მარშრუტების ოპტიმიზაცია
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          რეალური დროის მარშრუტების დაგეგმვა და ტრეკინგი
        </p>
      </div>
      
      <RouteOptimizer />
    </div>
  )
}