import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function Bank() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="flex items-center p-4 bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <Link to="/" className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold ml-2 text-gray-800">Bank (銀行)</h1>
      </header>
      
      <main className="flex-1 p-4 flex flex-col items-center justify-center space-y-4">
        <p className="text-gray-500">スキャナーと残高画面をここに実装します</p>
      </main>
    </div>
  )
}
