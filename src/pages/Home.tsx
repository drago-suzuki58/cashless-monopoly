import { Link } from 'react-router-dom'
import { Landmark, Smartphone } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Cashless<br />Monopoly
        </h1>
        <p className="mt-2 text-gray-500">アナログゲームをもっとスムーズに</p>
      </div>

      <div className="w-full space-y-4 max-w-sm">
        <Link 
          to="/bank" 
          className="flex items-center p-6 bg-white border-2 border-indigo-600 rounded-2xl shadow-sm hover:bg-indigo-50 transition-colors"
        >
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full mr-4">
            <Landmark size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">銀行（親機）</h2>
            <p className="text-sm text-gray-500">残高を管理する端末</p>
          </div>
        </Link>

        <Link 
          to="/player" 
          className="flex items-center p-6 bg-white border-2 border-emerald-600 rounded-2xl shadow-sm hover:bg-emerald-50 transition-colors"
        >
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full mr-4">
            <Smartphone size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">プレイヤー（子機）</h2>
            <p className="text-sm text-gray-500">お金を払う・もらう端末</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
