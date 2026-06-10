'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import LoadingTruck from '@/app/dashboard/components/ui/LoadingTruck'

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  // 🔐 LOGIN ფუნქცია
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('🔐 [Login] Attempting sign in...')
      
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      if (!signInData?.user) throw new Error('No user returned')

      console.log('✅ [Login] Sign in successful:', signInData.user.email)

      const userRole = signInData.user.user_metadata?.role || 'client'
      localStorage.setItem('userRole', userRole)
      console.log('🎭 [Login] Role saved:', userRole)

      await router.push('/dashboard')
      await router.refresh()
      
    } catch (err: any) {
      console.error('❌ [Login] Error:', err.message)
      setError(err.message || 'შესვლა ვერ მოხერხდა')
      setLoading(false)
    }
  }

  // 📝 REGISTER ფუნქცია (განახლებული)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // ვალიდაცია
    if (password !== confirmPassword) {
      setError('პაროლები არ ემთხვევა')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('პაროლი უნდა იყოს მინიმუმ 8 სიმბოლო')
      setLoading(false)
      return
    }

    try {
      // 1️⃣ ვქმნით მომხმარებელს Supabase Auth-ში
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { role: 'client' },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (signUpError) throw signUpError
      
      if (!signUpData?.user) {
        throw new Error('მომხმარებელი არ შეიქმნა')
      }

      console.log('✅ [Register] User created:', signUpData.user.id)

      // 2️⃣ ვქმნით პროფილს profiles ცხრილში
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: signUpData.user.id,
          email: email,
          role: 'client',
          status: 'active',
          onboarding_completed: true,
          approval_status: 'client_active',
          selected_role: 'client'
        })

      if (profileError) {
        console.error('❌ [Register] Profile creation error:', profileError)
        // თუ პროფილი ვერ შეიქმნა, მაინც გავაგრძელოთ
      } else {
        console.log('✅ [Register] Profile created')
      }

      // 3️⃣ ვცდილობთ ავტომატურ შესვლას
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        // თუ ავტომატური შესვლა ვერ მოხერხდა (email confirmation-ის გამო)
        console.log('⚠️ [Register] Auto sign-in failed, email confirmation needed')
        setSuccess('✅ რეგისტრაცია წარმატებულია! გთხოვთ შეამოწმოთ თქვენი email დადასტურებისთვის, შემდეგ კი შეხვიდეთ სისტემაში.')
        
        // 3 წამის შემდეგ login ტაბზე დაბრუნება
        setTimeout(() => {
          setActiveTab('login')
          setSuccess('')
          setEmail('')
          setPassword('')
          setConfirmPassword('')
          setLoading(false)
        }, 3000)
        return
      }

      // 4️⃣ ავტომატური შესვლა წარმატებულია - გადავდივართ დეშბორდზე
      console.log('✅ [Register] Auto sign-in successful, redirecting to dashboard')
      localStorage.setItem('userRole', 'client')
      
      setSuccess('✅ რეგისტრაცია წარმატებულია! გადაგყავთ დეშბორდზე...')
      
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
      
    } catch (err: any) {
      console.error('❌ [Register] Error:', err.message)
      setError(err.message || 'რეგისტრაცია ვერ მოხერხდა')
      setLoading(false)
    }
  }

  // 🚛 Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <LoadingTruck 
          message={activeTab === 'login' ? 'სისტემაში შესვლა...' : 'ანგარიშის შექმნა...'} 
          size="lg" 
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex text-gray-900">
      {/* მარცხენა მხარე - ბრენდინგი */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400 opacity-10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
        
        <div className="relative z-10 text-center text-white max-w-md">
          <div className="mb-8 flex justify-center">
            <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/20">
              <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
          </div>

          <h1 className="text-5xl font-bold mb-8 tracking-tight">Logistics OS</h1>

          <div className="space-y-4 text-left">
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-lg">Real-time Tracking</p>
                <p className="text-sm text-blue-100">ტვირთის მონიტორინგი რეალურ დროში</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-lg">Smart Route Optimization</p>
                <p className="text-sm text-blue-100">AI-ზე დაფუძნებული მარშრუტიზაცია</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-lg">Multi-role Access</p>
                <p className="text-sm text-blue-100">4 სხვადასხვა როლი და წვდომა</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* მარჯვენა მხარე - ფორმა */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 text-gray-900">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mb-4">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Logistics OS</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            {/* ტაბები */}
            <div className="flex gap-2 mb-8 bg-gray-100 p-1.5 rounded-2xl">
              <button
                onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'login'
                    ? 'bg-white text-blue-600 shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                შესვლა
              </button>
              <button
                onClick={() => { setActiveTab('register'); setError(''); setSuccess(''); }}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'register'
                    ? 'bg-white text-blue-600 shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                რეგისტრაცია
              </button>
            </div>

            {/* LOGIN FORM */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email მისამართი</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none hover:border-gray-400"
                    placeholder="you@company.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">პაროლი</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none hover:border-gray-400"
                    placeholder="••••••••"
                    required
                  />
                </div>
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">⚠️ {error}</div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  შესვლა
                </button>
              </form>
            )}

            {/* REGISTER FORM */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email მისამართი</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none hover:border-gray-400"
                    placeholder="you@company.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">პაროლი</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none hover:border-gray-400"
                    placeholder="მინიმუმ 8 სიმბოლო"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">პაროლის დადასტურება</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none hover:border-gray-400"
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs flex items-start gap-2">
                  <span>ℹ️</span>
                  <span>რეგისტრაციის შემდეგ ავტომატურად მიიღებთ <strong>"დამკვეთის"</strong> სტატუსს. მოგვიანებით შეგეძლებათ მძღოლადაც დარეგისტრირება.</span>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">⚠️ {error}</div>
                )}
                {success && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">✅ {success}</div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  ანგარიშის შექმნა
                </button>
                <p className="text-center text-sm text-gray-600">
                  უკვე გაქვთ ანგარიში?{' '}
                  <button type="button" onClick={() => setActiveTab('login')} className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2">
                    შესვლა
                  </button>
                </p>
              </form>
            )}
          </div>

          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 text-xs text-gray-500 bg-white/50 px-4 py-2 rounded-full">
              <span className="text-green-600">🔒</span>
              <span>დაცულია უსაფრთხო ენკრიფციით</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}