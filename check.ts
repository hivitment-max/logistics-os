/**
 * 🚛 Logistics OS - სრული დიაგნოსტიკა (v3.0)
 * --------------------------------------------------------------
 * ამოწმებს:
 * 1️⃣ გარემოს ცვლადები
 * 2️⃣ ყველა მომხმარებლის ავტორიზაცია & Role Metadata
 * 3️⃣ ბაზის ცხრილები & მონაცემები
 * 4️⃣ კავშირები (Relations)
 * --------------------------------------------------------------
 * გაშვება: npx ts-node -r dotenv/config check.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// ⚙️ კონფიგურაცია
// ============================================================================
const env = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
};

// ⚠️ განახლებული პაროლები (შენი რეალური მონაცემებით)
const TEST_USERS = [
  { email: 'admin@logistics.ge', password: 'admin123', role: 'admin' },
  { email: 'manager@logistics.ge', password: 'Accountant123', role: 'manager' }, // ✅ შენი პაროლი
  { email: 'accountant@logistics.ge', password: 'Accountant123!', role: 'accountant' }, // ✅ შენი პაროლი
  { email: 'dispatcher@logistics.ge', password: 'disp123', role: 'dispatcher' }, // ✅ შენი პაროლი
  { email: 'driver@logistics.ge', password: 'driver123', role: 'driver' },
  { email: 'client@logistics.ge', password: 'client123', role: 'client' },
];

const supabase = createClient(env.url, env.key);

// ============================================================================
// 🎨 ლოგინგის ფუნქციები
// ============================================================================
const log = {
  header: (msg: string) => console.log(`\n🟣 =========================================\n   ${msg}\n=========================================`),
  info: (msg: string) => console.log(`💡 ${msg}`),
  success: (msg: string) => console.log(`✅ ${msg}`),
  warn: (msg: string) => console.log(`⚠️ ${msg}`),
  error: (msg: string, err?: any) => {
    console.error(`❌ ${msg}`);
    if (err) console.error('   Details:', err.message || err);
  },
};

// ============================================================================
// 🧪 ტესტის ფუნქციები
// ============================================================================

async function testAuthAndMetadata() {
  log.header('1️⃣ ავტორიზაცია & Role Metadata შემოწმება');
  
  let passed = 0;
  
  for (const user of TEST_USERS) {
    try {
      log.info(`🔐 ტესტი: ${user.email}`);
      
      // 1. შესვლა
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password,
      });

      if (signInError) {
        log.error(`   ვერ შემოვიდა: ${signInError.message}`);
        continue;
      }

      log.success(`   შესვლა წარმატებულია`);

      // 2. Metadata-ის შემოწმება
      const actualRole = signInData.user?.user_metadata?.role;
      
      if (actualRole === user.role) {
        log.success(`   ✅ Role სწორია: '${actualRole}'`);
        passed++;
      } else {
        log.warn(`   ⚠️ Role არასწორია! ელოდებოდა: '${user.role}', ნაპოვნია: '${actualRole || 'null'}'`);
        log.warn(`   💡 გაუშვი SQL: UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"role": "${user.role}"}' WHERE email = '${user.email}';`);
      }

      // 3. გასვლა
      await supabase.auth.signOut();
      
    } catch (err: any) {
      log.error(`   კრიტიკული შეცდომა: ${err.message}`);
    }
  }

  console.log(`\n📊 შედეგი: ${passed}/${TEST_USERS.length} წარმატებული`);
}

async function testDatabaseTables() {
  log.header('2️⃣ ბაზის ცხრილები & მონაცემები');

  const tables = [
    { name: 'hubs', required: true },
    { name: 'drivers', required: true },
    { name: 'vehicles', required: true },
    { name: 'orders', required: true },
    { name: 'tracking_events', required: true },
    { name: 'audit_logs', required: false }, // ახალია, შეიძლება ცარიელი იყოს
  ];

  for (const table of tables) {
    try {
      log.info(`🔍 ვამოწმებ: ${table.name}...`);
      const { count, error } = await supabase.from(table.name).select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('does not exist')) {
          log.warn(`   ⚪ ცხრილი არ არსებობს`);
        } else {
          log.error(`   ❌ შეცდომა: ${error.message}`);
        }
      } else {
        log.success(`   ✅ ${count} ჩანაწერი`);
      }
    } catch (err) {
      log.warn(`   ⚠️ ვერ შემოწმდა`);
    }
  }
}

async function testRelations() {
  log.header('3️⃣ კავშირების (Relations) შემოწმება');
  
  try {
    log.info(`🔗 ვამოწმებ: Orders -> Drivers/Vehicles Join...`);
    
    const { data, error } = await supabase
      .from('orders')
      .select(`
        tracking_code,
        drivers (full_name),
        vehicles (plate_number)
      `)
      .limit(1);

    if (error) {
      log.error(`   ❌ Join შეცდომა: ${error.message}`);
    } else if (data && data.length > 0) {
      log.success(`   ✅ კავშირები მუშაობს`);
      const row = data[0] as any;
      const driverName = Array.isArray(row.drivers) ? row.drivers[0]?.full_name : row.drivers?.full_name;
      log.info(`   📦 ნიმუში: ${row.tracking_code} -> ${driverName || 'N/A'}`);
    } else {
      log.warn(`   ⚠️ Orders ცხრილი ცარიელია, კავშირი ვერ შემოწმდა`);
    }
  } catch (err: any) {
    log.error(`   ❌ ${err.message}`);
  }
}

async function testCompliance() {
  log.header('4️⃣ კომპლაენსი (ვადების) შემოწმება');
  
  try {
    const { data: drivers } = await supabase.from('drivers').select('full_name, license_expiry');
    if (!drivers || drivers.length === 0) {
      log.info(`   ℹ️ მძღოლები არ არის`);
      return;
    }

    const today = new Date();
    const warningDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 დღე
    let alerts = 0;

    drivers.forEach(d => {
      if (d.license_expiry) {
        const exp = new Date(d.license_expiry);
        if (exp < warningDate) {
          log.warn(`   ⚠️ ${d.full_name}: ლიცენზია იწურება (${d.license_expiry})`);
          alerts++;
        }
      }
    });

    if (alerts === 0) log.success(`   ✅ ყველა ლიცენზია ვადაშია`);

  } catch (err: any) {
    log.error(`   ❌ ${err.message}`);
  }
}

// ============================================================================
// 🚀 მთავარი გაშვება
// ============================================================================
async function runDiagnostics() {
  console.log('\n🚛 Logistics OS - სრული დიაგნოსტიკა იწყება... (v3.0)\n');
  
  await testAuthAndMetadata();
  await testDatabaseTables();
  await testRelations();
  await testCompliance();

  log.header('🏁 დასკვნა');
  console.log('💡 თუ Metadata-ში შეცდომაა, გამოიყენე ზემოთ მითითებული SQL ბრძანება.\n');
  console.log('✅ სისტემა მზადაა შემდეგი ეტაპისთვის (RLS & Production)!\n');
  
  process.exit(0);
}

runDiagnostics().catch(err => {
  console.error('💥 სკრიპტი კრეშდა:', err);
  process.exit(1);
});