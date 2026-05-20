import { useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

interface UseDispatchProps {
  showNotification: (msg: string) => void
  loadData: () => Promise<void>
  logAudit: (action: string, target: string, details: string) => Promise<void>
}

export function useDispatch({ showNotification, loadData, logAudit }: UseDispatchProps) {
  
  const handleAssign = useCallback(async (
    orderId: string, 
    driverId: string | null, 
    vehicleId: string | null
  ) => {
    // 1. განვაახლოთ შეკვეთა
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        driver_id: driverId,
        vehicle_id: vehicleId,
        // ✅ შეცვლილია: 'assigned' → 'dispatched' (პროფესიონალური სტატუსი)
        status: driverId || vehicleId ? 'dispatched' : 'pending',
        assigned_at: driverId || vehicleId ? new Date().toISOString() : null
      })
      .eq('id', orderId)

    if (orderError) {
      showNotification(`❌ შეცდომა: ${orderError.message}`)
      return // ✅ void
    }

    // 2. თუ მძღოლი მივანიშნეთ → განვაახლოთ მისი სტატუსი
    if (driverId) {
      await supabase.from('drivers').update({ 
        is_available: false, 
        current_order_id: orderId 
      }).eq('id', driverId)
    }

    // 3. თუ მანქანა მივანიშნეთ → განვაახლოთ მისი სტატუსი
    if (vehicleId) {
      await supabase.from('vehicles').update({ 
        status: 'in_use', 
        assigned_order_id: orderId 
      }).eq('id', vehicleId)
    }

    // 4. ჩავწეროთ აუდიტი
    await logAudit('ORDER_ASSIGNED', orderId, `მინიჭებული: მძღოლი=${driverId || '-'}, მანქანა=${vehicleId || '-'}`)
    
    // 5. ჩავწეროთ ტრეკინგი
    await supabase.from('tracking_events').insert({
      order_id: orderId,
      event_type: 'assigned',
      location_name: 'დისპეტჩერი',
      notes: `შეკვეთა მინიჭებული: მძღოლი ${driverId ? 'მიბმულია' : '-'}, მანქანა ${vehicleId ? 'მიბმულია' : '-'}`
    })

    showNotification('✅ შეკვეთა წარმატებით მინიჭებულია!')
    await loadData()
    return // ✅ void
  }, [showNotification, loadData, logAudit])

  return {
    handleAssign
  }
}