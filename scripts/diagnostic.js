// 📋 ფაილი: /scripts/diagnostic.js
// გაშვება: node scripts/diagnostic.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Logistics OS - სრული Diagnostic Script');
console.log('='.repeat(60));
console.log('');

// 📊 სტატისტიკა
const stats = {
  totalFiles: 0,
  tsxFiles: 0,
  tsFiles: 0,
  cssFiles: 0,
  errors: [],
  warnings: [],
  checks: []
};

// 🎯 ფაილების სკანირება
function scanDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        scanDirectory(filePath, fileList);
      }
    } else {
      fileList.push(filePath);
      stats.totalFiles++;
      
      if (file.endsWith('.tsx')) stats.tsxFiles++;
      if (file.endsWith('.ts') && !file.endsWith('.tsx')) stats.tsFiles++;
      if (file.endsWith('.css')) stats.cssFiles++;
    }
  });
  
  return fileList;
}

// 🔍 client.ts შემოწმება
function checkClientTS() {
  console.log('🔐 [1/7] client.ts შემოწმება...');
  const clientPath = 'src/lib/supabase/client.ts';
  
  if (!fs.existsSync(clientPath)) {
    stats.errors.push('❌ client.ts ვერ მოიძებნა!');
    return;
  }
  
  const content = fs.readFileSync(clientPath, 'utf-8');
  
  // შემოწმებები
  const checks = [
    {
      name: '@supabase/supabase-js',
      test: content.includes('@supabase/supabase-js'),
      error: '❌ არ გამოიყენება @supabase/supabase-js (გამოიყენება @supabase/ssr?)'
    },
    {
      name: 'detectSessionInUrl: false',
      test: content.includes('detectSessionInUrl: false'),
      error: '❌ detectSessionInUrl არ არის false!'
    },
    {
      name: 'autoRefreshToken: true',
      test: content.includes('autoRefreshToken: true'),
      error: '⚠️ autoRefreshToken არ არის true'
    },
    {
      name: 'persistSession: true',
      test: content.includes('persistSession: true'),
      error: '⚠️ persistSession არ არის true'
    }
  ];
  
  checks.forEach(check => {
    if (check.test) {
      stats.checks.push(`✅ ${check.name}`);
    } else {
      stats.errors.push(check.error);
    }
  });
  
  console.log('   ' + checks.filter(c => c.test).length + '/' + checks.length + ' შემოწმება წარმატებულია');
}

// 🔍 SettingsTab შემოწმება
function checkSettingsTab() {
  console.log('⚙️  [2/7] SettingsTab.tsx შემოწმება...');
  const settingsPath = 'src/app/dashboard/components/tabs/SettingsTab.tsx';
  
  if (!fs.existsSync(settingsPath)) {
    stats.errors.push('❌ SettingsTab.tsx ვერ მოიძებნა!');
    return;
  }
  
  const content = fs.readFileSync(settingsPath, 'utf-8');
  
  const checks = [
    {
      name: 'fixed property',
      test: content.includes("fixed?: 'left' | 'right'"),
      error: '❌ fixed property არ არის OrderColumnConfig-ში!'
    },
    {
      name: 'DEFAULT_ORDER_COLUMNS-ში fixed',
      test: content.includes("fixed: 'left'") && content.includes("fixed: 'right'"),
      error: '❌ DEFAULT_ORDER_COLUMNS-ში არ არის fixed სვეტები!'
    },
    {
      name: 'handleColumnMove - temp variable',
      test: content.includes('const temp = columns['),
      error: '❌ handleColumnMove არ იყენებს temp ცვლადს!'
    },
    {
      name: '!!columns[index - 1]?.fixed',
      test: content.includes('!!columns[index - 1]?.fixed'),
      error: '❌ disabled attribute-ში არ გამოიყენება !! ოპერატორი!'
    }
  ];
  
  checks.forEach(check => {
    if (check.test) {
      stats.checks.push(`✅ ${check.name}`);
    } else {
      stats.errors.push(check.error);
    }
  });
  
  console.log('   ' + checks.filter(c => c.test).length + '/' + checks.length + ' შემოწმება წარმატებულია');
}

// 🔍 OrdersTab შემოწმება
function checkOrdersTab() {
  console.log('📋 [3/7] OrdersTab.tsx შემოწმება...');
  const ordersPath = 'src/app/dashboard/components/tabs/OrdersTab.tsx';
  
  if (!fs.existsSync(ordersPath)) {
    stats.errors.push('❌ OrdersTab.tsx ვერ მოიძებნა!');
    return;
  }
  
  const content = fs.readFileSync(ordersPath, 'utf-8');
  
  const checks = [
    {
      name: 'FIXED_LEFT_WIDTHS',
      test: content.includes('FIXED_LEFT_WIDTHS'),
      error: '❌ FIXED_LEFT_WIDTHS არ არის!'
    },
    {
      name: 'FIXED_RIGHT_WIDTHS',
      test: content.includes('FIXED_RIGHT_WIDTHS'),
      error: '❌ FIXED_RIGHT_WIDTHS არ არის!'
    },
    {
      name: 'getFixedLeftColumns',
      test: content.includes('getFixedLeftColumns'),
      error: '❌ getFixedLeftColumns ფუნქცია არ არის!'
    },
    {
      name: 'getMiddleColumns',
      test: content.includes('getMiddleColumns'),
      error: '❌ getMiddleColumns ფუნქცია არ არის!'
    },
    {
      name: 'COL - 1fr',
      test: content.includes("'1fr'"),
      error: '❌ COL-ში არ გამოიყენება 1fr!'
    },
    {
      name: 'getOrderedColumns',
      test: content.includes('getOrderedColumns'),
      error: '❌ getOrderedColumns ფუნქცია არ არის!'
    },
    {
      name: 'handleEditSave - tracking_code fix',
      test: !content.includes('tracking_code: editingOrder?.tracking_code, ...payload'),
      error: '❌ handleEditSave-ში tracking_code ორჯერ არის!'
    }
  ];
  
  checks.forEach(check => {
    if (check.test) {
      stats.checks.push(`✅ ${check.name}`);
    } else {
      stats.errors.push(check.error);
    }
  });
  
  console.log('   ' + checks.filter(c => c.test).length + '/' + checks.length + ' შემოწმება წარმატებულია');
}

// 🔍 AddOrderModal შემოწმება
function checkAddOrderModal() {
  console.log('📦 [4/7] AddOrderModal.tsx შემოწმება...');
  const modalPath = 'src/app/dashboard/components/modals/AddOrderModal.tsx';
  
  if (!fs.existsSync(modalPath)) {
    stats.errors.push('❌ AddOrderModal.tsx ვერ მოიძებნა!');
    return;
  }
  
  const content = fs.readFileSync(modalPath, 'utf-8');
  
  const checks = [
    {
      name: '6 ნაბიჯიანი wizard',
      test: content.includes('STEPS = [') && (content.match(/id: \d/g) || []).length >= 6,
      error: '⚠️ 6 ნაბიჯიანი wizard არ ჩანს'
    },
    {
      name: 'upsertClient ფუნქცია',
      test: content.includes('upsertClient'),
      error: '❌ upsertClient ფუნქცია არ არის!'
    },
    {
      name: 'dual client save',
      test: content.includes('private_clients') && content.includes('clients'),
      error: '❌ dual client save არ მუშაობს!'
    }
  ];
  
  checks.forEach(check => {
    if (check.test) {
      stats.checks.push(`✅ ${check.name}`);
    } else {
      stats.warnings.push(check.error);
    }
  });
  
  console.log('   ' + checks.filter(c => c.test).length + '/' + checks.length + ' შემოწმება წარმატებულია');
}

// 🔍 globals.css შემოწმება
function checkGlobalsCSS() {
  console.log('🎨 [5/7] globals.css შემოწმება...');
  const cssPath = 'src/app/globals.css';
  
  if (!fs.existsSync(cssPath)) {
    stats.errors.push('❌ globals.css ვერ მოიძებნა!');
    return;
  }
  
  const content = fs.readFileSync(cssPath, 'utf-8');
  
  const checks = [
    {
      name: 'truck-move animation',
      test: content.includes('@keyframes truck-move'),
      error: '❌ truck-move animation არ არის!'
    },
    {
      name: 'animate-truck',
      test: content.includes('.animate-truck'),
      error: '❌ .animate-truck class არ არის!'
    },
    {
      name: 'wheel-spin',
      test: content.includes('@keyframes wheel-spin'),
      error: '❌ wheel-spin animation არ არის!'
    },
    {
      name: 'print styles',
      test: content.includes('@media print'),
      error: '⚠️ print styles არ არის'
    }
  ];
  
  checks.forEach(check => {
    if (check.test) {
      stats.checks.push(`✅ ${check.name}`);
    } else {
      stats.warnings.push(check.error);
    }
  });
  
  console.log('   ' + checks.filter(c => c.test).length + '/' + checks.length + ' შემოწმება წარმატებულია');
}

// 🔍 layout.tsx შემოწმება
function checkLayout() {
  console.log('📐 [6/7] layout.tsx შემოწმება...');
  const layoutPath = 'src/app/layout.tsx';
  
  if (!fs.existsSync(layoutPath)) {
    stats.errors.push('❌ layout.tsx ვერ მოიძებნა!');
    return;
  }
  
  const content = fs.readFileSync(layoutPath, 'utf-8');
  
  const checks = [
    {
      name: 'viewport export',
      test: content.includes('export const viewport'),
      error: '❌ viewport export არ არის!'
    },
    {
      name: 'themeColor in viewport',
      test: content.includes('themeColor') && content.includes('viewport'),
      error: '❌ themeColor არ არის viewport-ში!'
    }
  ];
  
  checks.forEach(check => {
    if (check.test) {
      stats.checks.push(`✅ ${check.name}`);
    } else {
      stats.errors.push(check.error);
    }
  });
  
  console.log('   ' + checks.filter(c => c.test).length + '/' + checks.length + ' შემოწმება წარმატებულია');
}

// 🔍 Login page შემოწმება
function checkLoginPage() {
  console.log('🔐 [7/7] login/page.tsx შემოწმება...');
  const loginPath = 'src/app/login/page.tsx';
  
  if (!fs.existsSync(loginPath)) {
    stats.errors.push('❌ login/page.tsx ვერ მოიძებნა!');
    return;
  }
  
  const content = fs.readFileSync(loginPath, 'utf-8');
  
  const checks = [
    {
      name: 'text-gray-900',
      test: content.includes('text-gray-900'),
      error: '❌ text-gray-900 არ არის (ტექსტი თეთრი იქნება)!'
    },
    {
      name: 'input text-gray-900',
      test: (content.match(/text-gray-900/g) || []).length >= 3,
      error: '❌ input-ებში text-gray-900 არ არის!'
    }
  ];
  
  checks.forEach(check => {
    if (check.test) {
      stats.checks.push(`✅ ${check.name}`);
    } else {
      stats.errors.push(check.error);
    }
  });
  
  console.log('   ' + checks.filter(c => c.test).length + '/' + checks.length + ' შემოწმება წარმატებულია');
}

// 📊 ანგარიში
function printReport() {
  console.log('');
  console.log('='.repeat(60));
  console.log('📊 DIAGNOSTIC REPORT');
  console.log('='.repeat(60));
  console.log('');
  
  console.log('📁 ფაილების სტატისტიკა:');
  console.log(`   სულ ფაილები: ${stats.totalFiles}`);
  console.log(`   TSX ფაილები: ${stats.tsxFiles}`);
  console.log(`   TS ფაილები: ${stats.tsFiles}`);
  console.log(`   CSS ფაილები: ${stats.cssFiles}`);
  console.log('');
  
  console.log('✅ წარმატებული შემოწმებები:');
  stats.checks.forEach(check => console.log('   ' + check));
  console.log('');
  
  if (stats.warnings.length > 0) {
    console.log('⚠️  გაფრთხილებები:');
    stats.warnings.forEach(warning => console.log('   ' + warning));
    console.log('');
  }
  
  if (stats.errors.length > 0) {
    console.log('❌ შეცდომები:');
    stats.errors.forEach(error => console.log('   ' + error));
    console.log('');
  }
  
  console.log('='.repeat(60));
  console.log('🎯 დასკვნა:');
  
  if (stats.errors.length === 0) {
    console.log('   ✅ ყველაფერი კარგადაა! კოდი მზადია!');
    console.log('');
    console.log('🚀 შემდეგი ნაბიჯები:');
    console.log('   1. დახურე StackBlitz-ის ტაბი');
    console.log('   2. გაასუფთავე localStorage (F12 → Console → localStorage.clear())');
    console.log('   3. დაელოდე 5 წუთი (Supabase rate limit-ის მოსახსნელად)');
    console.log('   4. გახსენი StackBlitz ხელახლა');
    console.log('   5. დააჭირე Ctrl+Shift+R (hard refresh)');
    console.log('');
    console.log('💡 ალტერნატივა:');
    console.log('   დააპუშე Vercel-ზე: git push origin main');
    console.log('   Vercel-ზე ეს პრობლემა არ იქნება!');
  } else {
    console.log('   ❌ ნაპოვნია ' + stats.errors.length + ' შეცდომა!');
    console.log('   გთხოვ გაასწორო ზემოთ ჩამოთვლილი პრობლემები.');
  }
  
  console.log('='.repeat(60));
}

// 🚀 მთავარი ფუნქცია
function main() {
  try {
    scanDirectory('.');
    
    checkClientTS();
    checkSettingsTab();
    checkOrdersTab();
    checkAddOrderModal();
    checkGlobalsCSS();
    checkLayout();
    checkLoginPage();
    
    printReport();
  } catch (error) {
    console.error('❌ Diagnostic script-ის შეცდომა:', error.message);
    process.exit(1);
  }
}

main();