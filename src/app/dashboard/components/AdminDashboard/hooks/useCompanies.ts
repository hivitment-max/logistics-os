import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

interface UseCompaniesProps {
  showNotification: (msg: string) => void
  loadData: () => Promise<void>
}

export function useCompanies({ showNotification, loadData }: UseCompaniesProps) {
  // 🏢 Modal States
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState<any | null>(null)
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false)
  const [editCompanyForm, setEditCompanyForm] = useState<any>({})
  const [deletingCompany, setDeletingCompany] = useState<any | null>(null)
  const [showDeleteCompanyModal, setShowDeleteCompanyModal] = useState(false)

  // 📝 Add Form State
  const [companyForm, setCompanyForm] = useState({ 
    name: '', registration_number: '', vat_number: '', contact_person: '', phone: '', email: '', legal_address: '', notes: '' 
  })

  // 🔧 Handlers
  const handleAddCompany = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('companies').insert([{ ...companyForm }])
    if (error) { showNotification(`❌ ${error.message}`); return }
    showNotification('✅ კომპანია წარმატებით დაემატა!'); setShowAddCompanyModal(false)
    setCompanyForm({ name: '', registration_number: '', vat_number: '', contact_person: '', phone: '', email: '', legal_address: '', notes: '' })
    loadData()
  }, [companyForm, showNotification, loadData])

  const handleEditCompanyClick = useCallback((company: any) => {
    setEditingCompany(company); setEditCompanyForm({ ...company }); setShowEditCompanyModal(true)
  }, [])

  const handleSaveEditCompany = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCompany) return
    const { error } = await supabase.from('companies').update(editCompanyForm).eq('id', editingCompany.id)
    if (error) { showNotification(`❌ ${error.message}`); return }
    showNotification('✅ კომპანია განახლდა!'); setShowEditCompanyModal(false); setEditingCompany(null); loadData()
  }, [editingCompany, editCompanyForm, showNotification, loadData])

  const handleDeleteCompanyClick = useCallback((company: any) => {
    setDeletingCompany(company); setShowDeleteCompanyModal(true)
  }, [])

  const confirmDeleteCompany = useCallback(async () => {
    if (!deletingCompany) return
    const { error } = await supabase.from('companies').delete().eq('id', deletingCompany.id)
    if (error) { showNotification(`❌ ${error.message}`); return }
    showNotification('🗑️ წაიშალა!'); setShowDeleteCompanyModal(false); setDeletingCompany(null); loadData()
  }, [deletingCompany, showNotification, loadData])

  return {
    // Modal States
    showAddCompanyModal, setShowAddCompanyModal,
    showEditCompanyModal, setShowEditCompanyModal,
    showDeleteCompanyModal, setShowDeleteCompanyModal,
    editingCompany, setEditingCompany,
    editCompanyForm, setEditCompanyForm,
    deletingCompany, setDeletingCompany,
    // Form
    companyForm, setCompanyForm,
    // Handlers
    handleAddCompany,
    handleEditCompanyClick,
    handleSaveEditCompany,
    handleDeleteCompanyClick,
    confirmDeleteCompany
  }
}