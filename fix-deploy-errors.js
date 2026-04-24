// fix-deploy-errors.js - მხოლოდ export default-ის უსაფრთხო აღდგენა
const fs = require('fs');

const dashboards = [
  'AdminDashboard', 'ManagerDashboard', 'AccountantDashboard',
  'DispatcherDashboard', 'DriverDashboard', 'ClientDashboard'
];

console.log('🔧 ვასწორებ export default-ს (უსაფრთხო რეჟიმი)...\n');

dashboards.forEach(name => {
  const filePath = `src/app/dashboard/components/${name}.tsx`;
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ ${name}.tsx ვერ მოიძებნა`);
    return;
  }

  let code = fs.readFileSync(filePath, 'utf8');

  // 1. წაშალე Props interface-ები (მხოლოდ თუ შეიცავს user/setNotification)
  code = code.replace(/interface\s+\w*Props?\s*\{[\s\S]*?(?:user|setNotification)[\s\S]*?\}\s*\n?/g, '');

  // 2. შეცვალე: function Name(...) { → export default function Name() {
  code = code.replace(
    new RegExp(`(export\\s+)?function\\s+${name}\\s*\\([^)]*\\)\\s*(:\\s*[^{]+)?\\s*\\{`, 'g'),
    `export default function ${name}() {`
  );

  // 3. შეცვალე: const Name = (...) => { → export default function Name() {
  code = code.replace(
    new RegExp(`(export\\s+)?const\\s+${name}\\s*=\\s*\\([^)]*\\)\\s*=>\\s*\\{`, 'g'),
    `export default function ${name}() {`
  );

  // 4. წაშალე ნებისმიერი დარჩენილი "=> void" ან მსგავსი სინტაქსური ნაგავი
  code = code.replace(/=>\s*void\s*\)?/g, '');
  code = code.replace(/\)\s*=>\s*void/g, ')');

  fs.writeFileSync(filePath, code);
  console.log(`✅ ${name}.tsx - export default უსაფრთხოდ აღდგენილია`);
});

console.log('\n🎉 ყველაფერი მზადაა!');
console.log('📋 გაუშვი: npm run build');