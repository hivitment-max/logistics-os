#!/usr/bin/env node
/**
 * 🚛 Logistics OS v1.0 - სრული დიაგნოსტიკა v1.1 (გასწორებული ფორმების სკანირებით)
 * გამოყენება: node LogisticAppVER1.0.mjs
 */

import { readdir, readFile, writeFile, stat, mkdir } from 'fs/promises';
import { join, relative, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG = {
  rootPath: process.argv[2] || '/workspaces/logistics-os',
  outputDir: 'generated',
  outputFile: 'diagnostic_report.html',
  logFile: 'diagnostic_log.json',
  sqlCheckFile: 'verify_db_schema.sql',
  
  criticalFiles: [
    'src/app/dashboard/components/AdminDashboard/index.tsx',
    'src/app/dashboard/components/AdminDashboard/hooks/useAdminData.ts',
    'src/app/dashboard/components/AdminDashboard/hooks/useVehicles.ts',
    'src/app/dashboard/components/AdminDashboard/hooks/useDrivers.ts',
    'src/app/dashboard/components/AdminDashboard/hooks/useOrders.ts',
    'src/lib/supabase/client.ts',
    'package.json'
  ],

  schemaMapping: {
    vehicles: { table: 'vehicles', expectedTypes: { plate_number:'text', vin_number:'text', tech_passport:'text', pti_expiry:'date', insurance_policy:'text', insurance_cmre_policy:'text', owner_name:'text', owner_type:'text', model:'text', type:'text', body_type:'text', capacity_kg:'int4', volume_m3:'float4', length_m:'float4', width_m:'float4', height_m:'float4', adr_class:'text', euro_standard:'text', has_tail_lift:'bool', straps_count:'int4', gps_device_id:'text', has_fuel_sensor:'bool', photo_urls:'text', tire_season:'text', tire_condition:'text', status:'text', year_manufactured:'int4', mileage:'int4', fuel_type:'text', color:'text', last_service_date:'date', next_service_date:'date', insurance_expiry:'date', notes:'text' }},
    drivers: { table: 'drivers', expectedTypes: { employment_type:'text', full_name:'text', dob:'date', personal_id:'text', phone:'text', email:'text', address:'text', license_number:'text', license_category:'text', license_expiry:'date', license_photo:'text', criminal_record:'text', driving_record:'text', medical_cert:'text', total_experience_years:'int4', special_experience:'text', has_adr:'bool', adr_cert:'text', has_own_vehicle:'bool', vehicle_reg:'text', vehicle_insp_expiry:'date', vehicle_insurance:'text', bank_iban:'text', tax_status:'text', languages:'text', references:'text', uniform_size:'text', photo_url:'text', extra_skills:'text', is_available:'bool', hire_date:'date', daily_rate:'float4', emergency_contact:'text' }},
    orders: { table: 'orders', expectedTypes: { pickup_address:'text', delivery_address:'text', cargo_description:'text', cargo_weight_kg:'float4', price:'float4', currency:'text', client_name:'text', client_email:'text', client_address:'text', notes:'text', tracking_code:'text', status:'text', driver_type:'text', vehicle_type:'text', driver_id:'uuid', external_driver_id:'uuid', vehicle_id:'uuid', external_vehicle_id:'uuid', external_driver_rate:'float4', external_vehicle_rate:'float4', client_id:'uuid' }},
    private_clients: { table: 'private_clients', expectedTypes: { full_name:'text', personal_id:'text', phone:'text', email:'text', address:'text', notes:'text' }},
    companies: { table: 'companies', expectedTypes: { name:'text', registration_number:'text', vat_number:'text', contact_person:'text', phone:'text', email:'text', legal_address:'text', notes:'text' }}
  },

  suspiciousPatterns: [
    { pattern: /:\s*any\b/g, severity: 'warning', category: 'typescript', message: 'გამოყენებულია "any" ტიპი (სასურველია ინტერფეისი)' },
    { pattern: /console\.log\b/g, severity: 'info', category: 'debug', message: 'console.log დარჩა პროდაქშენ კოდში' },
    { pattern: /TODO|FIXME|HACK/gi, severity: 'warning', category: 'style', message: 'დროებითი კომენტარი/ფიქსი' },
  ]
};

class DiagnosticResult {
  constructor() {
    this.startTime = Date.now();
    this.passed = []; this.warnings = []; this.errors = []; this.info = [];
    this.fileStats = { total: 0, tsx: 0, ts: 0, other: 0 };
    this.codeMetrics = { lines: 0, functions: 0 };
    this.schemaIssues = [];
  }
  
  add(type, category, message, file = null) {
    const item = { type, category, message, file, timestamp: new Date().toISOString() };
    if (type === 'pass') this.passed.push(item);
    else if (type === 'warning') this.warnings.push(item);
    else if (type === 'error') this.errors.push(item);
    else this.info.push(item);
  }
  
  addSchemaIssue(entity, issue, detail) { this.schemaIssues.push({ entity, issue, detail, timestamp: new Date().toISOString() }); }

  getSummary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    // ✅ გასწორებული: წონიანი ფორმულა
    const weightedTotal = this.passed.length + (this.warnings.length * 0.15) + (this.errors.length * 3) + (this.schemaIssues.length * 2);
    const score = Math.min(100, Math.round((this.passed.length / Math.max(1, weightedTotal)) * 100));
    return {
      duration, totalChecks: this.passed.length + this.warnings.length + this.errors.length + this.schemaIssues.length,
      passed: this.passed.length, warnings: this.warnings.length, errors: this.errors.length,
      schemaIssues: this.schemaIssues.length, score,
      filesScanned: this.fileStats.total, linesAnalyzed: this.codeMetrics.lines,
      health: score >= 85 ? '🟢 Excellent' : score >= 70 ? '🟡 Good' : score >= 50 ? '🟠 Needs Work' : '🔴 Critical'
    };
  }
}

class LogisticsDiagnostic {
  constructor(config) { this.config = config; this.result = new DiagnosticResult(); }
  
  async run() {
    console.log('🚛 Logistics OS v1.0 - სრული დიაგნოსტიკა v1.1');
    console.log('═'.repeat(60));
    await this.scanFileSystem();
    await this.checkCriticalFiles();
    await this.analyzeCodeQuality();
    await this.checkFormSchemaAlignment(); // ✅ ახლა სკანირებს hooks/ ფაილებსაც
    await this.checkSecurity();
    await this.generateReport();
    this.printDetailedTerminalReport();
    return this.result.getSummary();
  }
  
  async scanFileSystem() {
    const scanDir = async (dir, rel = '') => {
      try {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const e of entries) {
          if (['node_modules', '.git', '.next', 'generated', 'LogisticAppVER1.0.mjs'].includes(e.name)) continue;
          const fullPath = join(dir, e.name);
          const rPath = rel ? `${rel}/${e.name}` : e.name;
          if (e.isDirectory()) await scanDir(fullPath, rPath);
          else {
            this.result.fileStats.total++;
            if (['.tsx', '.ts'].includes(extname(e.name))) this.result.fileStats.tsx += extname(e.name)==='.tsx' ? 1 : 0;
            else this.result.fileStats.other++;
            if (this.config.criticalFiles.includes(rPath)) {
              try {
                const content = await readFile(fullPath, 'utf-8');
                this.result.codeMetrics.lines += content.split('\n').length;
                this.result.add('pass', 'filesystem', `კრიტიკული ფაილი: ${rPath}`, rPath);
              } catch { this.result.add('error', 'filesystem', `ვერ წავიკითხე: ${rPath}`, rPath); }
            }
          }
        }
      } catch {}
    };
    await scanDir(this.config.rootPath);
  }
  
  async checkCriticalFiles() {
    for (const f of this.config.criticalFiles) {
      try { await stat(join(this.config.rootPath, f)); }
      catch { this.result.add('error','critical-file',`არ არსებობს: ${f}`,f); }
    }
  }
  
  async analyzeCodeQuality() {
    const scan = async (dir) => {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        if (['node_modules','.git','.next','generated'].includes(e.name)) continue;
        const fp = join(dir, e.name);
        if (e.isDirectory()) { await scan(fp); continue; }
        if (!['.ts','.tsx','.js'].includes(extname(fp))) continue;
        try {
          const content = await readFile(fp,'utf-8');
          for (const {pattern, severity, category, message} of this.config.suspiciousPatterns) {
            const m = content.match(pattern);
            if (m) this.result.add(severity==='error'?'error':severity==='info'?'info':'warning', category, `${message} (${m.length}x)`, relative(this.config.rootPath,fp));
          }
          this.result.codeMetrics.functions += (content.match(/\bfunction\s+\w+\s*\(/g) || []).length + (content.match(/const\s+\w+\s*=\s*\([^)]*\)\s*=>/g) || []).length;
        } catch {}
      }
    };
    await scan(this.config.rootPath);
  }
  
  // ✅ ახალი: სკანირებს index.tsx + ყველა ჰუკს ფორმების საპოვნელად
  async checkFormSchemaAlignment() {
    console.log('\n🗄️ ბაზის სქემისა და UI ველების შესაბამისობა...');
    const scanPaths = [
      join(this.config.rootPath, 'src/app/dashboard/components/AdminDashboard/index.tsx'),
      join(this.config.rootPath, 'src/app/dashboard/components/AdminDashboard/hooks/useVehicles.ts'),
      join(this.config.rootPath, 'src/app/dashboard/components/AdminDashboard/hooks/useDrivers.ts'),
      join(this.config.rootPath, 'src/app/dashboard/components/AdminDashboard/hooks/useOrders.ts')
    ];
    
    const extractedForms = {};
    const formRegex = /const\s+\[(\w*Form\w*)\s*,\s*\w+\]\s*=\s*useState\(\s*\{([\s\S]*?)\}\s*\)/g;

    for (const filePath of scanPaths) {
      try {
        const content = await readFile(filePath, 'utf-8');
        let match;
        // Reset lastIndex because of 'g' flag
        formRegex.lastIndex = 0;
        while ((match = formRegex.exec(content)) !== null) {
          const formName = match[1];
          const body = match[2];
          // ამოიღებს გასაღებებს
          const keys = body.match(/\b([a-zA-Z_]\w*)\s*:/g)?.map(k => k.replace(':','').trim()) || [];
          extractedForms[formName] = keys;
        }
      } catch {}
    }

    const formToTable = { vehicleForm: 'vehicles', driverForm: 'drivers', orderForm: 'orders', privateClientForm: 'private_clients', companyForm: 'companies' };
    for (const [formName, tableKey] of Object.entries(formToTable)) {
      const schema = this.config.schemaMapping[tableKey];
      if (!schema) continue;
      const uiKeys = extractedForms[formName] || [];
      const dbKeys = Object.keys(schema.expectedTypes);
      
      let missingInUI = 0;
      for (const key of dbKeys) {
        if (!uiKeys.includes(key)) {
          const isUiOnly = ['client_type','client_name','client_email','client_address','client_personal_id','client_registration_number','external_driver_rate','external_vehicle_rate'].includes(key);
          if (!isUiOnly) {
            this.result.add('warning','schema',`ბაზის ველი აკლია UI ფორმას: ${key}`, tableKey);
            missingInUI++;
          }
        } else this.result.add('pass','schema',`ველი შესაბამისობაშია: ${key}`, tableKey);
      }
      
      if (missingInUI === 0 && uiKeys.length > 0) {
        this.result.add('pass','schema',`${formName} სრულად სინქრონიზებულია ${tableKey}-თან`, formName);
      }
    }
    console.log(`   ✓ გაანალიზებულია ${Object.keys(extractedForms).length} ფორმა რეფაქტორებული ჰუკებიდან`);
  }
  
  async checkSecurity() {
    const middlewarePath = join(this.config.rootPath, 'middleware.ts');
    try {
      const content = await readFile(middlewarePath, 'utf-8');
      if (content.includes('auth') || content.includes('token') || content.includes('role')) this.result.add('pass', 'security', 'middleware აქვს ავთენტიკაციის ლოგიკა', 'middleware.ts');
      else this.result.add('warning', 'security', 'middleware არ შეიცავს ავთენტიკაციის ლოგიკას', 'middleware.ts');
    } catch { 
      // App Router-ში ოპციონალურია თუ route protection სხვაგანაა
      this.result.add('info', 'security', 'middleware.ts არ არსებობს (ოპციონალური)', 'middleware.ts'); 
    }
  }
  
  async generateReport() {
    const outDir = join(this.config.rootPath, this.config.outputDir);
    await mkdir(outDir, { recursive: true });
    const summary = this.result.getSummary();
    await writeFile(join(outDir, this.config.logFile), JSON.stringify({ ...summary, passed: this.result.passed, warnings: this.result.warnings, errors: this.result.errors, schemaIssues: this.result.schemaIssues }, null, 2), 'utf-8');
    await writeFile(join(outDir, this.config.sqlCheckFile), this.generateVerificationSQL(), 'utf-8');
    await writeFile(join(outDir, this.config.outputFile), this.generateHTMLReport(summary), 'utf-8');
  }
  
  generateVerificationSQL() {
    let sql = `-- 🚛 Logistics OS v1.0 - ბაზის სქემის ვერიფიკაცია\n-- გაუშვი ეს სკრიპტი Supabase SQL Editor-ში\n\n`;
    for (const [key, schema] of Object.entries(this.config.schemaMapping)) {
      sql += `-- 🔍 ${schema.table} ცხრილის სვეტები:\nSELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${schema.table}' ORDER BY ordinal_position;\n`;
      sql += `-- ⚠️ მოსალოდნელი ველები (UI-დან):\n-- ${Object.keys(schema.expectedTypes).join(', ')}\n\n`;
    }
    sql += `-- 🔍 დუბლირებული ან ზედმეტი სვეტების ძიება:\nSELECT column_name, count(*) as cnt FROM information_schema.columns WHERE table_schema = 'public' GROUP BY column_name HAVING count(*) > 1 ORDER BY cnt DESC;\n`;
    return sql;
  }
  
  generateHTMLReport(summary) {
    return `<!DOCTYPE html><html lang="ka"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>🚛 Logistics OS v1.0 - დიაგნოსტიკა</title>
<style>:root{--bg:#0f172a;--card:#1e293b;--text:#f1f5f9;--muted:#94a3b8;--g:#22c55e;--y:#eab308;--r:#ef4444;--b:#3b82f6}*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.6;padding:20px}.c{max-width:1100px;margin:0 auto}h1{text-align:center;font-size:1.8rem;margin-bottom:10px}.sub{text-align:center;color:var(--muted);margin-bottom:30px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:15px;margin-bottom:30px}.card{background:var(--card);padding:15px;border-radius:12px;text-align:center}.card h3{font-size:2rem}.card.p h3{color:var(--g)}.card.w h3{color:var(--y)}.card.e h3{color:var(--r)}.card.s h3{color:var(--b);font-size:2.5rem}.sec{margin-bottom:30px}.sec h2{font-size:1.3rem;padding-bottom:10px;border-bottom:1px solid #334155;margin-bottom:15px}.item{background:var(--card);padding:12px;margin-bottom:8px;border-radius:8px;border-left:4px solid var(--b);display:flex;align-items:flex-start;gap:10px}.item.p{border-color:var(--g)}.item.w{border-color:var(--y)}.item.e{border-color:var(--r)}.b{padding:2px 8px;border-radius:4px;font-size:.75rem;font-weight:700}.b.p{background:var(--g);color:#000}.b.w{background:var(--y);color:#000}.b.e{background:var(--r);color:#fff}.f{color:var(--muted);font-family:monospace;font-size:.8rem;margin-top:4px}.h{font-size:1.1rem;font-weight:600;margin:10px 0}h.g{color:var(--g)}h.o{color:var(--y)}h.b{color:var(--r)}@media(max-width:768px){.grid{grid-template-columns:1fr 1fr}}</style></head><body><div class="c">
<h1>🚛 Logistics OS v1.0</h1><p class="sub">სრული დიაგნოსტიკა v1.1 • ${new Date().toLocaleString('ka-GE')}</p>
<div class="grid">
<div class="card p"><h3>${summary.passed}</h3><p>წარმატებული</p></div>
<div class="card w"><h3>${summary.warnings}</h3><p>გაფრთხილება</p></div>
<div class="card e"><h3>${summary.errors}</h3><p>შეცდომა</p></div>
<div class="card s"><h3>${summary.score}</h3><p>ქულა / 100</p></div>
</div>
<p class="h ${summary.health.includes('Excellent')?'g':summary.health.includes('Good')?'o':'b'}">${summary.health} • ${summary.duration}s • ${summary.filesScanned} ფაილი</p>
${this.result.errors.length ? `<div class="sec"><h2>❌ შეცდომები</h2>${this.result.errors.map(i=>`<div class="item e"><span class="b e">ERROR</span><div><strong>${i.message}</strong>${i.file?`<div class="f">📄 ${i.file}</div>`:''}</div></div>`).join('')}</div>` : ''}
${this.result.warnings.length ? `<div class="sec"><h2>⚠️ გაფრთხილებები</h2>${this.result.warnings.slice(0,30).map(i=>`<div class="item w"><span class="b w">WARN</span><div><strong>${i.message}</strong>${i.file?`<div class="f">📄 ${i.file}</div>`:''}</div></div>`).join('')}${this.result.warnings.length>30?`<p style="text-align:center;color:var(--muted)">+ ${this.result.warnings.length-30} მეტი...</p>`:''}</div>` : ''}
<div style="text-align:center;margin-top:40px"><button onclick="window.print()" style="background:var(--b);color:#fff;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:1rem">🖨️ დაბეჭდვა / PDF</button></div>
</div></body></html>`;
  }

  printDetailedTerminalReport() {
    const summary = this.result.getSummary();
    console.log('\n📊 დეტალური ანგარიში');
    console.log('═'.repeat(60));
    console.log(`🎯 ქულა: ${summary.score}/100 (${summary.health})`);
    console.log(`⏱️ დრო: ${summary.duration}s | 📄 ფაილები: ${summary.filesScanned} | 📝 სტრიქონები: ${summary.linesAnalyzed.toLocaleString()}`);
    console.log('═'.repeat(60));

    if (this.result.errors.length > 0) {
      console.log('\n❌ შეცდომები (გასასწორებელი):');
      this.result.errors.forEach((e, i) => console.log(`  ${i+1}. [${e.file || 'N/A'}] ${e.message}`));
    } else console.log('\n✅ ❌ შეცდომები: 0');

    if (this.result.warnings.length > 0) {
      console.log('\n⚠️ გაფრთხილებები (' + this.result.warnings.length + '):');
      const grouped = {};
      this.result.warnings.forEach(w => {
        const key = w.message.replace(/\s*\(\d+x\)/, '').trim();
        if (!grouped[key]) grouped[key] = { files: new Set(), count: 0 };
        grouped[key].files.add(w.file || 'unknown');
        grouped[key].count++;
      });
      Object.entries(grouped).forEach(([msg, data], i) => {
        console.log(`  ${i+1}. ${msg} (${data.count}x)`);
        Array.from(data.files).slice(0, 4).forEach(f => console.log(`     → 📄 ${f}`));
        if (data.files.size > 4) console.log(`     → ... და კიდევ ${data.files.size - 4} ფაილი`);
      });
    } else console.log('\n✅ ⚠️ გაფრთხილებები: 0');

    if (this.result.schemaIssues.length > 0) {
      console.log('\n🗄️ ბაზის სქემის პრობლემები:');
      this.result.schemaIssues.forEach((s, i) => console.log(`  ${i+1}. [${s.entity}] ${s.issue}: ${s.detail}`));
    } else console.log('\n✅ 🗄️ ბაზის სქემის პრობლემები: 0');

    console.log('\n💾 ანგარიშები:');
    console.log(`   📄 HTML: ${this.config.outputDir}/${this.config.outputFile}`);
    console.log(`   📜 SQL:  ${this.config.outputDir}/${this.config.sqlCheckFile}`);
    console.log(`   📋 JSON: ${this.config.outputDir}/${this.config.logFile}`);
    console.log('═'.repeat(60));
  }
}

async function main() {
  try { await new LogisticsDiagnostic(CONFIG).run(); }
  catch (e) { console.error('💥 კრიტიკული შეცდომა:', e.message); process.exit(2); }
}
main();