import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

interface UsePrivateClientsProps {
  showNotification: (msg: string) => void
  loadData: () => Promise<void>
}

export function usePrivateClients({ showNotification, loadData }: UsePrivateClientsProps) {
  // 👤 Modal States
  const [showAddPrivateClientModal, setShowAddPrivateClientModal] = useState(false)
  const [editingPrivateClient, setEditingPrivateClient] = useState<any | null>(null)
  const [showEditPrivateClientModal, setShowEditPrivateClientModal] = useState(false)
  const [editPrivateClientForm, setEditPrivateClientForm] = useState<any>({})
  const [deletingPrivateClient, setDeletingPrivateClient] = useState<any | null>(null)
  const [showDeletePrivateClientModal, setShowDeletePrivateClientModal] = useState(false)

  // 📝 Add Form State
  const [privateClientForm, setPrivateClientForm] = useState({ 
    full_name: '', personal_id: '', phone: '', email: '', address: '', notes: '' 
  })

  // 🔧 Handlers
  const handleAddPrivateClient = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('private_clients').insert([{ ...privateClientForm }])
    if (error) { showNotification(`❌ ${error.message}`); return }
    showNotification('✅ კერძო პირი წარმატებით დაემატა!'); setShowAddPrivateClientModal(false)
    setPrivateClientForm({ full_name: '', personal_id: '', phone: '', email: '', address: '', notes: '' })
    loadData()
  }, [privateClientForm, showNotification, loadData])

  const handleEditPrivateClientClick = useCallback((client: any) => {
    setEditingPrivateClient(client); setEditPrivateClientForm({ ...client }); setShowEditPrivateClientModal(true)
  }, [])

  const handleSaveEditPrivateClient = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPrivateClient) return
    const { error } = await supabase.from('private_clients').update(editPrivateClientForm).eq('id', editingPrivateClient.id)
    if (error) { showNotification(`❌ ${error.message}`); return }
    showNotification('✅ კერძო პირი განახლდა!'); setShowEditPrivateClientModal(false); setEditingPrivateClient(null); loadData()
  }, [editingPrivateClient, editPrivateClientForm, showNotification, loadData])

  const handleDeletePrivateClientClick = useCallback((client: any) => {
    setDeletingPrivateClient(client); setShowDeletePrivateClientModal(true)
  }, [])

  const confirmDeletePrivateClient = useCallback(async () => {
    if (!deletingPrivateClient) return
    const { error } = await supabase.from('private_clients').delete().eq('id', deletingPrivateClient.id)
    if (error) { showNotification(`❌ ${error.message}`); return }
    showNotification('🗑️ წაიშალა!'); setShowDeletePrivateClientModal(false); setDeletingPrivateClient(null); loadData()
  }, [deletingPrivateClient, showNotification, loadData])

  return {
    // Modal States
    showAddPrivateClientModal, setShowAddPrivateClientModal,
    showEditPrivateClientModal, setShowEditPrivateClientModal,
    showDeletePrivateClientModal, setShowDeletePrivateClientModal,
    editingPrivateClient, setEditingPrivateClient,
    editPrivateClientForm, setEditPrivateClientForm,
    deletingPrivateClient, setDeletingPrivateClient,
    // Form
    privateClientForm, setPrivateClientForm,
    // Handlers
    handleAddPrivateClient,
    handleEditPrivateClientClick,
    handleSaveEditPrivateClient,
    handleDeletePrivateClientClick,
    confirmDeletePrivateClient
  }
}