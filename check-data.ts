/**
 * 📊 ბაზის მონაცემების შემოწმება
 * გაშვება: npx ts-node -r dotenv/config check-data.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkData() {
  console.log('\n📊 ====================================');
  console.log('   ბაზის მონაცემების შემოწმება');
  console.log('====================================\n');

  // 1️⃣ ჰაბები
  console.log('🏢 HUBS:');
  const { data: hubsData, error: hubsError } = await supabase.from('hubs').select('*');
  if (hubsError) {
    console.log('   ❌ შეცდომა:', hubsError.message);
  } else {
    console.log(`   ✅ ნაპოვნია: ${hubsData?.length || 0} ჩანაწერი`);
    hubsData?.forEach((hub: any, i: number) => {
      console.log(`      ${i + 1}. ${hub.name} - ${hub.city}`);
    });
  }

  // 2️⃣ მანქანები
  console.log('\n🚐 VEHICLES:');
  const { data: vehiclesData, error: vehiclesError } = await supabase.from('vehicles').select('*');
  if (vehiclesError) {
    console.log('   ❌ შეცდომა:', vehiclesError.message);
  } else {
    console.log(`   ✅ ნაპოვნია: ${vehiclesData?.length || 0} ჩანაწერი`);
    vehiclesData?.forEach((v: any, i: number) => {
      console.log(`      ${i + 1}. ${v.plate_number} - ${v.model} (${v.status})`);
    });
  }

  // 3️⃣ მძღოლები
  console.log('\n🚛 DRIVERS:');
  const { data: driversData, error: driversError } = await supabase.from('drivers').select('*');
  if (driversError) {
    console.log('   ❌ შეცდომა:', driversError.message);
  } else {
    console.log(`   ✅ ნაპოვნია: ${driversData?.length || 0} ჩანაწერი`);
    driversData?.forEach((d: any, i: number) => {
      console.log(`      ${i + 1}. ${d.full_name} - ${d.phone} (Available: ${d.is_available})`);
    });
  }

  // 4️⃣ შეკვეთები
  console.log('\n📦 ORDERS:');
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select(`*, drivers (full_name), vehicles (plate_number)`);
  
  if (ordersError) {
    console.log('   ❌ შეცდომა:', ordersError.message);
  } else {
    console.log(`   ✅ ნაპოვნია: ${ordersData?.length || 0} ჩანაწერი`);
    ordersData?.forEach((o: any, i: number) => {
      console.log(`      ${i + 1}. ${o.tracking_code}`);
      console.log(`         მარშრუტი: ${o.pickup_address?.split(',')[0] || ''} → ${o.delivery_address?.split(',')[0] || ''}`);
      console.log(`         ტვირთი: ${o.cargo_description}`);
      console.log(`         ფასი: $${o.price}`);
      console.log(`         სტატუსი: ${o.status}`);
      console.log(`         მძღოლი: ${o.drivers?.full_name || 'არ არის მინიჭებული'}`);
      console.log(`         მანქანა: ${o.vehicles?.plate_number || 'არ არის მინიჭებული'}`);
      console.log('');
    });
  }

  // 5️⃣ თვალყურის დევნება
  console.log('\n📍 TRACKING EVENTS:');
  const { data: trackingData, error: trackingError } = await supabase.from('tracking_events').select('*');
  if (trackingError) {
    console.log('   ❌ შეცდომა:', trackingError.message);
  } else {
    console.log(`   ✅ ნაპოვნია: ${trackingData?.length || 0} ჩანაწერი`);
  }

  // 📊 სტატისტიკა
  console.log('\n📈 სტატისტიკა:');
  const safeOrders = ordersData || [];
  const safeDrivers = driversData || [];
  
  const totalOrders = safeOrders.length;
  const pendingOrders = safeOrders.filter((o: any) => o.status === 'pending').length;
  const inTransitOrders = safeOrders.filter((o: any) => o.status === 'in_transit').length;
  const deliveredOrders = safeOrders.filter((o: any) => o.status === 'delivered').length;
  const totalRevenue = safeOrders.reduce((sum: number, o: any) => sum + (o.price || 0), 0);
  const availableDrivers = safeDrivers.filter((d: any) => d.is_available).length;

  console.log(`   • სულ შეკვეთა: ${totalOrders}`);
  console.log(`   • ლოდინში: ${pendingOrders}`);
  console.log(`   • გზაში: ${inTransitOrders}`);
  console.log(`   • ჩაბარებული: ${deliveredOrders}`);
  console.log(`   • საერთო შემოსავალი: $${totalRevenue}`);
  console.log(`   • თავისუფალი მძღოლები: ${availableDrivers}`);

  // ============================================================================
  // 👥 ახალი სექცია: მომხმარებლების (Auth) შემოწმება
  // ============================================================================
  console.log('\n👥 მომხმარებლები (Auth):');
  try {
    // listUsers() მუშაობს მხოლოდ Service Role-ით, მაგრამ ჩვენ ვცდილობთ anon-ითაც
    // თუ შეცდომას დააგდებს, ეს ნორმალურია და უბრალოდ გამოტოვებს ამ ნაწილს
    const {  users, error: usersError } = await (supabase.auth as any).admin?.listUsers?.();
    
    if (usersError) {
      console.log('   ⚠️  admin.listUsers() ხელმისაწვდომი არ არის anon key-ით');
      console.log('   💡  შეამოწმე პირდაპირ Supabase Dashboard-ში: Authentication → Users');
    } else if (users) {
      users.forEach((u: any, i: number) => {
        const role = u.user_metadata?.role || u.raw_user_meta_data?.role || 'NOT SET';
        console.log(`   ${i + 1}. ${u.email}`);
        console.log(`      🔑 Role: ${role}`);
        console.log(`      🆔 ID: ${u.id?.slice(0, 8)}...`);
        console.log(`      ✅ Confirmed: ${u.email_confirmed_at ? 'Yes' : 'No'}`);
      });
    }
  } catch (err: any) {
    console.log('   ⚠️  ვერ მოხერხდა მომხმარებლების ჩამოტვირთვა (ნორმალურია)');
  }

  console.log('\n====================================\n');

  if (totalOrders === 0) {
    console.log('⚠️  ბაზა ცარიელია!');
    console.log('💡  გაუშვი INSERT სკრიპტი მონაცემების ჩასამატებლად\n');
  } else {
    console.log('✅  ბაზაში მონაცემებია!\n');
  }
}

checkData().catch(err => {
  console.error('💥 შეცდომა:', err);
  process.exit(1);
});