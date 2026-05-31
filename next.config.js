// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    // ✅ ცალსახად ვუთითებთ რომ პროექტი იყენებს src/ ფოლდერს
    srcDir: 'src/',
    
    // ✅ ვრთავთ server actions-ს (საჭიროა ზოგიერთი API ფუნქციისთვის)
    experimental: {
      serverActions: {
        allowedOrigins: ['localhost:3000', 'logistics-os-seven.vercel.app']
      }
    },
    
    // ✅ ვრთავთ ტაიპსკრიპტის სტრიქტ რეჟიმს
    typescript: {
      ignoreBuildErrors: false
    }
  }
  
  module.exports = nextConfig