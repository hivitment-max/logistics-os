'use client'
import { useState, FormEvent, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function ProfileTab({ user, onUpdate }: any) {
  const [activeTab, setActiveTab] = useState<'private' | 'company'>('private')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<any>(null)

  // პროფილის ჩატვირთვა
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (data) {
        setProfile(data)
        setActiveTab(data.client_type || 'private')
      }
    }
    loadProfile()
  }, [user?.id])

  const [form, setForm] = useState({
    // ფიზიკური პირი
    full_name: '',
    personal_id: '',
    
    // იურიდიული პირი
    company_name: '',
    registration_number: '',
    contact_person: '',
    contact_phone: '',
    
    // საერთო
    phone: '',
    email: '',
    address: '',
    
    // დამატებითი (იურიდიული)
    vat_number: '',
    alternative_phone: '',
    website: '',
    bank_name: '',
    bank_account: '',
    bank_swift: '',
    industry: '',
    invoice_email: '',
    billing_address: '',
  })

  // ფორმის შევსება პროფილიდან
  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        personal_id: profile.client_type === 'private' ? (profile.tax_id || '') : '',
        company_name: profile.company_name || '',
        registration_number: profile.client_type === 'company' ? (profile.tax_id || '') : '',
        contact_person: profile.contact_person || '',
        contact_phone: profile.contact_phone || '',
        phone: profile.phone || '',
        email: profile.email || user?.email || '',
        address: profile.address || '',
        vat_number: profile.vat_number || '',
        alternative_phone: profile.alternative_phone || '',
        website: profile.website || '',
        bank_name: profile.bank_name || '',
        bank_account: profile.bank_account || '',
        bank_swift: profile.bank_swift || '',
        industry: profile.industry || '',
        invoice_email: profile.invoice_email || '',
        billing_address: profile.billing_address || '',
      })
    }
  }, [profile, user?.email])

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // ვალიდაცია
      if (!form.full_name.trim() && !form.company_name.trim()) {
        throw new Error('სახელი ან კომპანიის სახელი სავალდებულოა')
      }
      if (!form.phone.trim()) throw new Error('ტელეფონი სავალდებულოა')
      if (!form.email.trim()) throw new Error('Email სავალდებულოა')
      if (!form.address.trim()) throw new Error('მისამართი სავალდებულოა')

      if (form.full_name.trim() && !form.personal_id.trim()) {
        throw new Error('პირადი ნომერი სავალდებულოა')
      }

      if (form.company_name.trim() && !form.registration_number.trim()) {
        throw new Error('საიდენტო კოდი სავალდებულოა')
      }
      if (form.company_name.trim() && !form.contact_person.trim()) {
        throw new Error('საკონტაქტო პირი სავალდებულოა')
      }
      if (form.company_name.trim() && !form.contact_phone.trim()) {
        throw new Error('საკონტაქტო პირის ტელეფონი სავალდებულოა')
      }

      const updateData = {
        client_type: activeTab,
        full_name: form.full_name || null,
        tax_id: activeTab === 'private' ? form.personal_id : (form.registration_number || null),
        company_name: form.company_name || null,
        contact_person: form.contact_person || null,
        contact_phone: form.contact_phone || null,
        phone: form.phone,
        email: form.email,
        address: form.address,
        vat_number: form.vat_number || null,
        alternative_phone: form.alternative_phone || null,
        website: form.website || null,
        bank_name: form.bank_name || null,
        bank_account: form.bank_account || null,
        bank_swift: form.bank_swift || null,
        industry: form.industry || null,
        invoice_email: form.invoice_email || null,
        billing_address: form.billing_address || null,
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess('✅ პროფილი წარმატებით განახლდა!')
      onUpdate(updateData)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'შეცდომა პროფილის განახლებისას')
    } finally {
      setLoading(false)
    }
  }

  const InputField = ({ label, value, onChange, type = 'text', placeholder, required = false, disabled = false, maxLength }: any) => (
    <div>
      <label className="block text-[10px] font-semibold text-gray-400 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className={`w-full px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 transition ${
          disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-gray-600'
        }`}
        required={required}
      />
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#1a202c] border border-gray-700 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <span className="text-xl">👤</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">პროფილი</h2>
            <p className="text-[10px] text-gray-400">თქვენი ინფორმაცია</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center justify-between">
          <span>❌ {error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">✕</button>
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-xs">
          ✅ {success}
        </div>
      )}

      {/* Tab Selector */}
      <div className="bg-[#1a202c] border border-gray-700 rounded-xl p-4">
        <label className="block text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wide">
          პროფილის ტიპი
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('private')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'private'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            👤 ფიზიკური პირი
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('company')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'company'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            🏢 იურიდიული პირი
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {activeTab === 'private' ? (
          // ფიზიკური პირი - 2 ბარათი გვერდიგვერდ
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* მარცხენა ბარათი: პირადი ინფორმაცია */}
            <div className="bg-[#1a202c] border border-gray-700 rounded-xl p-4">
              <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-700">
                👤 პირადი ინფორმაცია
              </h3>
              <div className="space-y-3">
                <InputField
                  label="სახელი და გვარი"
                  value={form.full_name}
                  onChange={(e: any) => updateField('full_name', e.target.value)}
                  placeholder="გიორგი ბერიძე"
                  required
                />
                <InputField
                  label="პირადი ნომერი"
                  value={form.personal_id}
                  onChange={(e: any) => updateField('personal_id', e.target.value)}
                  placeholder="12345678901"
                  maxLength={11}
                  required
                />
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-1.5">
                    მისამართი <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="თბილისი, რუსთაველის გამზირი 12"
                    className="w-full px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 transition resize-none hover:border-gray-600"
                    required
                  />
                </div>
              </div>
            </div>

            {/* მარჯვენა ბარათი: საკონტაქტო ინფორმაცია */}
            <div className="bg-[#1a202c] border border-gray-700 rounded-xl p-4">
              <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-700">
                📧 საკონტაქტო ინფორმაცია
              </h3>
              <div className="space-y-3">
                <InputField
                  label="Email"
                  value={form.email || user?.email || ''}
                  disabled
                  placeholder={user?.email || ''}
                  required
                />
                <p className="text-[9px] text-gray-500 -mt-2 mb-2">Email იცვლება ავტორიზაციის გვერდიდან</p>
                <InputField
                  label="ტელეფონი"
                  type="tel"
                  value={form.phone}
                  onChange={(e: any) => updateField('phone', e.target.value)}
                  placeholder="+995 555 123 456"
                  required
                />
                <InputField
                  label="ალტერნატიული ტელეფონი"
                  type="tel"
                  value={form.alternative_phone}
                  onChange={(e: any) => updateField('alternative_phone', e.target.value)}
                  placeholder="+995 32 123 456"
                />
              </div>
            </div>
          </div>
        ) : (
          // იურიდიული პირი - 2 ბარათი გვერდიგვერდ
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* მარცხენა ბარათი: კომპანიის ინფორმაცია */}
            <div className="bg-[#1a202c] border border-gray-700 rounded-xl p-4">
              <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-700">
                🏢 კომპანიის ინფორმაცია
              </h3>
              <div className="space-y-3">
                <InputField
                  label="კომპანიის სახელი"
                  value={form.company_name}
                  onChange={(e: any) => updateField('company_name', e.target.value)}
                  placeholder="შპს ლოჯისტიკა"
                  required
                />
                <InputField
                  label="საიდენტო კოდი"
                  value={form.registration_number}
                  onChange={(e: any) => updateField('registration_number', e.target.value)}
                  placeholder="123456789"
                  maxLength={9}
                  required
                />
                <InputField
                  label="VAT ნომერი"
                  value={form.vat_number}
                  onChange={(e: any) => updateField('vat_number', e.target.value)}
                  placeholder="GE123456789"
                />
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-1.5">
                    იურიდიული მისამართი <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="თბილისი, რუსთაველის გამზირი 12"
                    className="w-full px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 transition resize-none hover:border-gray-600"
                    required
                  />
                </div>
              </div>
            </div>

            {/* მარჯვენა ბარათი: საკონტაქტო ინფორმაცია */}
            <div className="bg-[#1a202c] border border-gray-700 rounded-xl p-4">
              <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-700">
                📧 საკონტაქტო ინფორმაცია
              </h3>
              <div className="space-y-3">
                <InputField
                  label="Email"
                  value={form.email || user?.email || ''}
                  disabled
                  placeholder={user?.email || ''}
                  required
                />
                <p className="text-[9px] text-gray-500 -mt-2 mb-2">Email იცვლება ავტორიზაციის გვერდიდან</p>
                <InputField
                  label="ტელეფონი"
                  type="tel"
                  value={form.phone}
                  onChange={(e: any) => updateField('phone', e.target.value)}
                  placeholder="+995 555 123 456"
                  required
                />
                <InputField
                  label="ალტერნატიული ტელეფონი"
                  type="tel"
                  value={form.alternative_phone}
                  onChange={(e: any) => updateField('alternative_phone', e.target.value)}
                  placeholder="+995 32 123 456"
                />
                <div className="pt-2 border-t border-gray-700 mt-3">
                  <h4 className="text-[10px] font-semibold text-gray-400 mb-3">საკონტაქტო პირი</h4>
                  <InputField
                    label="სახელი და გვარი"
                    value={form.contact_person}
                    onChange={(e: any) => updateField('contact_person', e.target.value)}
                    placeholder="გიორგი ბერიძე"
                    required
                  />
                  <div className="mt-2">
                    <InputField
                      label="ტელეფონი"
                      type="tel"
                      value={form.contact_phone}
                      onChange={(e: any) => updateField('contact_phone', e.target.value)}
                      placeholder="+995 555 123 456"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* დამატებითი ინფორმაცია */}
        <div className="bg-[#1a202c] border border-gray-700 rounded-xl p-4">
          <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-700">
            📝 დამატებითი ინფორმაცია
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="ვებსაიტი"
              type="url"
              value={form.website}
              onChange={(e: any) => updateField('website', e.target.value)}
              placeholder="https://company.ge"
            />
            {activeTab === 'company' && (
              <>
                <InputField
                  label="ინვოისის Email"
                  type="email"
                  value={form.invoice_email}
                  onChange={(e: any) => updateField('invoice_email', e.target.value)}
                  placeholder="billing@company.ge"
                />
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-1.5">
                    ინდუსტრია
                  </label>
                  <select
                    value={form.industry}
                    onChange={(e) => updateField('industry', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 transition hover:border-gray-600"
                  >
                    <option value="">აირჩიეთ...</option>
                    <option value="logistics">ლოჯისტიკა</option>
                    <option value="construction">მშენებლობა</option>
                    <option value="retail">ვაჭრობა</option>
                    <option value="manufacturing">წარმოება</option>
                    <option value="agriculture">სოფლის მეურნეობა</option>
                    <option value="technology">ტექნოლოგიები</option>
                    <option value="other">სხვა</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* საბანკო ინფორმაცია (მხოლოდ კომპანიისთვის) */}
        {activeTab === 'company' && (
          <div className="bg-[#1a202c] border border-gray-700 rounded-xl p-4">
            <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-700">
              🏦 საბანკო ინფორმაცია
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="ბანკის სახელი"
                value={form.bank_name}
                onChange={(e: any) => updateField('bank_name', e.target.value)}
                placeholder="TBC Bank"
              />
              <InputField
                label="საბანკო ანგარიში (IBAN)"
                value={form.bank_account}
                onChange={(e: any) => updateField('bank_account', e.target.value)}
                placeholder="GE123456789012345678"
              />
              <InputField
                label="SWIFT/BIC კოდი"
                value={form.bank_swift}
                onChange={(e: any) => updateField('bank_swift', e.target.value)}
                placeholder="TBCBGE22"
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="bg-[#1a202c] border border-gray-700 rounded-xl p-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold text-white transition shadow-lg shadow-blue-500/20"
          >
            {loading ? '⏳ ინახება...' : '💾 პროფილის შენახვა'}
          </button>
        </div>
      </form>
    </div>
  )
}