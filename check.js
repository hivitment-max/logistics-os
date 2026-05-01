#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// 🎨 Terminal Colors
const C = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', 
  blue: '\x1b[34m', cyan: '\x1b[36m', bold: '\x1b[1m'
};
const log = {
  info: m => console.log(`${C.cyan}[ℹ️]${C.reset} ${m}`),
  ok: m => console.log(`${C.green}[✅]${C.reset} ${m}`),
  warn: m => console.log(`${C.yellow}[⚠️]${C.reset} ${m}`),
  err: m => console.log(`${C.red}[❌]${C.reset} ${m}`),
  head: m => console.log(`\n${C.bold}${C.blue}═══ ${m} ═══${C.reset}\n`)
};

// 🔍 CHECKS
function checkFiles() {
  log.head('📁 ფაილების სტრუქტურა');
  const files = [
    'package.json', 'next.config.js', 'tsconfig.json',
    'src/app/layout.tsx', 'src/app/page.tsx',
    'src/app/login/page.tsx', 'src/app/dashboard/page.tsx', 'src/app/dashboard/client/page.tsx',
    'src/app/dashboard/components/AdminDashboard.tsx',
    'src/app/dashboard/components/ManagerDashboard.tsx',
    'src/app/dashboard/components/AccountantDashboard.tsx',
    'src/app/dashboard/components/DispatcherDashboard.tsx',
    'src/app/dashboard/components/DriverDashboard.tsx',
    'src/app/dashboard/client/tabs/ClientOverviewTab.tsx',
    'src/app/dashboard/client/tabs/MyOrdersTab.tsx',
    'src/app/dashboard/client/tabs/NewOrderTab.tsx',
    'src/app/dashboard/client/tabs/TrackingTab.tsx',
    'src/app/dashboard/client/tabs/ClientInvoicesTab.tsx',
    'src/app/dashboard/client/tabs/ProfileTab.tsx',
    'src/app/dashboard/client/tabs/NotificationsTab.tsx',
    'src/app/dashboard/client/tabs/SettingsTab.tsx',
    'src/lib/supabase/client.ts', '.env.local'
  ];
  let pass = true;
  files.forEach(f => {
    if (fs.existsSync(path.join(ROOT, f))) log.ok(f);
    else { log.err(`არ არსებობს: ${f}`); pass = false; }
  });
  return pass;
}

function checkSyntax() {
  log.head('🔤 TypeScript სინტაქსი & პროპსები');
  const dashboards = ['ManagerDashboard', 'AccountantDashboard', 'DispatcherDashboard', 'DriverDashboard'];
  let pass = true;
  
  dashboards.forEach(name => {
    const f = path.join(ROOT, `src/app/dashboard/components/${name}.tsx`);
    if (!fs.existsSync(f)) return;
    const code = fs.readFileSync(f, 'utf8');
    
    // 1. Check for old props
    if (code.match(/export default function \w+\(\s*{[^}]*user[^}]*setNotification[^}]*}/)) {
      log.warn(`${name}.tsx: ჯერ კიდევ ითხოვს { user, setNotification } პროპსებს`);
      pass = false;
    } else {
      log.ok(`${name}.tsx: პროპსები სწორია`);
    }
    
    // 2. Check braces balance
    const open = (code.match(/{/g) || []).length;
    const close = (code.match(/}/g) || []).length;
    if (open !== close) { log.warn(`${name}.tsx: ფრჩხილების დისბალანსი {${open}} vs }${close}`); pass = false; }
  });
  
  // Check page.tsx for prop passing
  const page = path.join(ROOT, 'src/app/dashboard/page.tsx');
  if (fs.existsSync(page)) {
    const code = fs.readFileSync(page, 'utf8');
    if (code.includes('user={user}') || code.includes('setNotification={')) {
      log.warn('dashboard/page.tsx: ჯერ კიდევ აგზავნის პროპსებს დაშბორდებზე');
      pass = false;
    } else {
      log.ok('dashboard/page.tsx: პროპსები არ გადაეცემა (სწორია)');
    }
  }
  return pass;
}

function checkSupabase() {
  log.head('🗄️ Supabase & .env');
  const clientPath = path.join(ROOT, 'src/lib/supabase/client.ts');
  const envPath = path.join(ROOT, '.env.local');
  
  let pass = true;
  if (!fs.existsSync(clientPath)) { log.err('client.ts არ არსებობს'); pass = false; }
  else {
    const c = fs.readFileSync(clientPath, 'utf8');
    if (c.includes('createClient') || c.includes('createBrowserClient')) log.ok('Supabase client ინიციალიზებულია');
    else { log.warn('Supabase client-ში createClient არ ჩანს'); pass = false; }
  }
  
  if (!fs.existsSync(envPath)) { log.err('.env.local არ არსებობს'); pass = false; }
  else {
    const e = fs.readFileSync(envPath, 'utf8');
    ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'].forEach(v => {
      if (e.includes(v)) log.ok(`${v} არსებობს`);
      else { log.warn(`${v} არ არის .env.local-ში`); pass = false; }
    });
  }
  return pass;
}

function checkDeps() {
  log.head('📦 package.json დამოკიდებულებები');
  const pkgPath = path.join(ROOT, 'package.json');
  if (!fs.existsSync(pkgPath)) { log.err('package.json არ არსებობს'); return false; }
  
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const required = ['next', 'react', 'react-dom', '@supabase/supabase-js', 'typescript', 'tailwindcss'];
  let pass = true;
  
  required.forEach(d => {
    if (deps[d]) log.ok(`${d}: ${deps[d]}`);
    else { log.warn(`${d} არ არის დაყენებული`); pass = false; }
  });
  return pass;
}

// 🚀 RUN
async function main() {
  console.log(`${C.bold}${C.cyan}
╔════════════════════════════════════════╗
║  🚛 LOGISTICS OS - DIAGNOSTIC         ║
║  სრული დიაგნოსტიკა (Node.js Native)    ║
╚════════════════════════════════════════╝${C.reset}\n`);

  const results = {
    files: checkFiles(),
    syntax: checkSyntax(),
    supabase: checkSupabase(),
    deps: checkDeps()
  };

  log.head('📊 შედეგები');
  const passed = Object.values(results).filter(Boolean).length;
  console.log(`${C.bold}გავლილი: ${C.green}${passed}${C.reset} / ${C.bold}4${C.reset} შემოწმება`);
  
  if (passed === 4) {
    log.ok('🎉 ყველაფერი რიგზეა! შეგიძლია გაუშვა: npm run dev');
  } else {
    log.warn('⚠️ აღმოჩენილია პრობლემები. გაასწორე ზემოთ მითითებული შეცდომები.');
  }
  
  console.log(`\n${C.cyan}💡 რჩევა: გაუშვი 'npm run build' კონსოლში დეტალური კომპილაციის შეცდომების სანახავად.${C.reset}\n`);
}

main().catch(e => { log.err(e.message); process.exit(1); });