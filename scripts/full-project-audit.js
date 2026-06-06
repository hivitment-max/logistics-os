const fs = require('fs');
const path = require('path');

console.log('🔍 დაწყებულია მთლიანი პროექტის ღრმა აუდიტი...\n');

const stats = {
  filesScanned: 0,
  errors: [],
  warnings: [],
  successes: []
};

// 🚫 საქაღალდეები, რომლებსაც სკრიპტი გამოტოვებს
const IGNORE_DIRS = ['node_modules', '.next', '.git', 'scripts', 'public'];

// 🔍 რეგულარული გამოსახულებები პრობლემების საპოვნელად
const RULES = [
  {
    name: 'მრავლობითი Supabase კლიენტის შექმნა',
    regex: /createClient\s*\(|createBrowserClient\s*\(/,
    severity: 'error',
    message: '⛔ კრიტიკული: Supabase კლიენტი უნდა იქმნებოდეს მხოლოდ client.ts-ში. აქ მისი შექმნა იწვევს "orphaned lock" და 429 შეცდომებს.',
    excludeFile: /client\.ts$/
  },
  {
    name: 'აკლია onAuthStateChange-ის გასუფთავება',
    regex: /onAuthStateChange/,
    severity: 'error',
    message: '⛔ კრიტიკული: იყენებ onAuthStateChange-ს, მაგრამ არ ჩანს .unsubscribe() გამოძახება. ეს ტოვებს "გაჭედილ" ლოქს და იწვევს უსასრულო ციკლს.',
    customCheck: (content) => !content.includes('.unsubscribe()')
  },
  {
    name: 'აკლია detectSessionInUrl: false',
    regex: /detectSessionInUrl:\s*false/,
    severity: 'error',
    message: '⛔ კრიტიკული: client.ts-ში აკლია detectSessionInUrl: false. ეს Next.js-ში იწვევს უსასრულო რედირექტებს და 429 შეცდომას.',
    targetFile: /client\.ts$/
  },
  {
    name: 'Console.log / console.error დარჩენილია',
    regex: /console\.(log|warn|error|debug)\s*\(/,
    severity: 'warning',
    message: '⚠️ გაფრთხილება: პროდაქშენში console.log არ უნდა იყოს. შეამოწმე ეს ხაზი.'
  },
  {
    name: 'useEffect ცარიელი დამოკიდებულებებით (შესაძლო პრობლემა)',
    regex: /useEffect\s*\(\s*\(\)\s*=>\s*\{[\s\S]{10,300}?\},\s*\[\s*\]\s*\)/,
    severity: 'warning',
    message: '⚠️ გაფრთხილება: useEffect-ს აქვს ცარიელი [] მასივი, მაგრამ შიგნით შესაძლოა ცვლადებს იყენებდე. შეამოწმე, ხომ არ აკლია dependency.'
  }
];

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(file)) {
        walkDir(filePath);
      }
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      stats.filesScanned++;
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(process.cwd(), filePath);

      RULES.forEach(rule => {
        // თუ წესი კონკრეტულ ფაილს ეხება (მაგ. client.ts)
        if (rule.targetFile && !rule.targetFile.test(filePath)) return;
        // თუ წესი გამორიცხავს კონკრეტულ ფაილს
        if (rule.excludeFile && rule.excludeFile.test(filePath)) return;

        if (rule.regex.test(content)) {
          // თუ არის customCheck ფუნქცია, შევამოწმოთ ისიც
          if (rule.customCheck && !rule.customCheck(content)) return;

          const issue = {
            file: relativePath,
            rule: rule.name,
            message: rule.message
          };

          if (rule.severity === 'error') {
            stats.errors.push(issue);
          } else {
            stats.warnings.push(issue);
          }
        }
      });
    }
  }
}

// 🚀 სკანირების დაწყება
try {
  walkDir('.');
  
  console.log('============================================================');
  console.log(`📊 სკანირება დასრულდა! შემოწმდა ${stats.filesScanned} ფაილი.`);
  console.log('============================================================\n');

  if (stats.errors.length > 0) {
    console.log('❌ კრიტიკული შეცდომები (უნდა გამოსწორდეს აუცილებლად):');
    stats.errors.forEach((err, i) => {
      console.log(`\n  ${i + 1}. ფაილი: ${err.file}`);
      console.log(`     პრობლემა: ${err.rule}`);
      console.log(`     დეტალი: ${err.message}`);
    });
    console.log('\n');
  }

  if (stats.warnings.length > 0) {
    console.log('⚠️ გაფრთხილებები (რეკომენდირებულია შემოწმება):');
    // ვაჩვენებთ მხოლოდ პირველ 10 გაფრთხილებას, რომ კონსოლი არ გადაიტვირთოს
    stats.warnings.slice(0, 10).forEach((warn, i) => {
      console.log(`\n  ${i + 1}. ფაილი: ${warn.file}`);
      console.log(`     დეტალი: ${warn.message}`);
    });
    if (stats.warnings.length > 10) {
      console.log(`\n  ... და კიდევ ${stats.warnings.length - 10} გაფრთხილება.`);
    }
    console.log('\n');
  }

  if (stats.errors.length === 0) {
    console.log('✅ კოდი სუფთაა! კრიტიკული შეცდომები ვერ მოიძებნა.');
    console.log('\n💡 მნიშვნელოვანი შეხსენება 429 შეცდომისთვის:');
    console.log('თუ კოდი სუფთაა და მაინც გიწერს 429 შეცდომას, პრობლემა არის ბრაუზერის "გაჭედილ" LocalStorage-ში.');
    console.log('გააკეთე ეს 3 რამ:');
    console.log('1. გახსენი DevTools (F12) -> Application -> Local Storage -> წაშალე ყველაფერი (Clear All).');
    console.log('2. დახურე ტაბი სრულად და გახსენი თავიდან (ან Incognito რეჟიმში სცადე).');
    console.log('3. თუ მაინც გრძელდება, დროებით next.config.js-ში დაწერე: reactStrictMode: false');
  }

  console.log('\n============================================================');
} catch (error) {
  console.error('❌ სკრიპტის შეცდომა:', error.message);
}