'use server'

import { createClient } from '@supabase/supabase-js'
import { calculatePrice, type PricingSettings, type PricingInput } from '@/lib/pricingCalculator'

export interface OrderData {
  distance_km: number
  weight_kg: number
  volume_m3: number
  cargo_type: string
  urgency: 'standard' | 'express' | 'urgent'
  requires_special_handling: boolean
  is_hazardous?: boolean
  is_refrigerated?: boolean
  waiting_hours?: number
}

export interface PricingResult {
  suggested_price: number
  confidence: number
  source: string
  explanation: string
  local_baseline: number
  breakdown?: any
  ai_reasoning?: string
  error?: string
}

// 🛡️ სერვერული Supabase კლიენტი
const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// ============================================================================
// 💰 SETTINGS-დან პარამეტრების წაკითხვა
// ============================================================================
async function getPricingSettings(): Promise<PricingSettings | null> {
  const supabase = getSupabaseAdmin()
  
  try {
    const { data: settings, error } = await supabase
      .from('settings')
      .select('*')
      .single()
    
    if (error || !settings) {
      console.warn('⚠️ Settings ვერ წაიკითხა, ვიყენებთ ნაგულისხმევ პარამეტრებს')
      return null
    }
    
    // ვაბრუნებთ pricing პარამეტრებს
    return {
      pricing_base_price: settings.pricing_base_price ?? 50,
      pricing_min_price: settings.pricing_min_price ?? 30,
      pricing_max_price: settings.pricing_max_price ?? 5000,
      pricing_rate_short_haul: settings.pricing_rate_short_haul ?? 0.80,
      pricing_rate_medium_haul: settings.pricing_rate_medium_haul ?? 0.50,
      pricing_rate_long_haul: settings.pricing_rate_long_haul ?? 0.30,
      pricing_rate_per_kg: settings.pricing_rate_per_kg ?? 0.10,
      pricing_rate_per_m3: settings.pricing_rate_per_m3 ?? 5.00,
      pricing_volume_weight_factor: settings.pricing_volume_weight_factor ?? 333,
      pricing_fuel_surcharge_per_km: settings.pricing_fuel_surcharge_per_km ?? 0.05,
      pricing_toll_fee_flat: settings.pricing_toll_fee_flat ?? 10,
      pricing_waiting_time_per_hour: settings.pricing_waiting_time_per_hour ?? 15,
      pricing_special_handling_adr: settings.pricing_special_handling_adr ?? 50,
      pricing_special_handling_refrigerated: settings.pricing_special_handling_refrigerated ?? 75,
      pricing_discount_percentage: settings.pricing_discount_percentage ?? 0,
    }
  } catch (err) {
    console.error('❌ Settings-ის წაკითხვის შეცდომა:', err)
    return null
  }
}

// ============================================================================
// 🧮 ახალი ლოკალური ფასის გამოთვლა (pricingCalculator.ts-ით)
// ============================================================================
function calculateLocalBaselineNew(orderData: OrderData, settings: PricingSettings | null): {
  price: number
  breakdown: any
} {
  // თუ settings არ გვაქვს, ვიყენებთ ნაგულისხმევს
  const pricingSettings: PricingSettings = settings || {
    pricing_base_price: 50,
    pricing_min_price: 30,
    pricing_max_price: 5000,
    pricing_rate_short_haul: 0.80,
    pricing_rate_medium_haul: 0.50,
    pricing_rate_long_haul: 0.30,
    pricing_rate_per_kg: 0.10,
    pricing_rate_per_m3: 5.00,
    pricing_volume_weight_factor: 333,
    pricing_fuel_surcharge_per_km: 0.05,
    pricing_toll_fee_flat: 10,
    pricing_waiting_time_per_hour: 15,
    pricing_special_handling_adr: 50,
    pricing_special_handling_refrigerated: 75,
    pricing_discount_percentage: 0,
  }
  
  const input: PricingInput = {
    distance_km: orderData.distance_km,
    weight_kg: orderData.weight_kg,
    volume_m3: orderData.volume_m3,
    is_hazardous: orderData.is_hazardous || orderData.cargo_type === 'adr',
    is_refrigerated: orderData.is_refrigerated || orderData.cargo_type === 'refrigerated',
    waiting_hours: orderData.waiting_hours || 0,
  }
  
  const result = calculatePrice(input, pricingSettings)
  
  if (!result.success) {
    console.error('❌ ფორმულით გამოთვლის შეცდომა:', result.summary)
    return { price: 0, breakdown: null }
  }
  
  // სასწრაფოობის მულტიპლიკატორი
  let finalPrice = result.breakdown.total
  if (orderData.urgency === 'express') finalPrice *= 1.3
  if (orderData.urgency === 'urgent') finalPrice *= 1.5
  
  return {
    price: Math.round(finalPrice),
    breakdown: {
      ...result.breakdown,
      urgency_multiplier: orderData.urgency === 'standard' ? 1 : orderData.urgency === 'express' ? 1.3 : 1.5,
      final_price: Math.round(finalPrice)
    }
  }
}

// ============================================================================
// 🤖 მთავარი ფუნქცია
// ============================================================================
export async function calculateAIPrice(orderData: OrderData): Promise<PricingResult> {
  const supabase = getSupabaseAdmin()

  // 1️⃣ წავიკითხოთ ჩვენი pricing settings
  const pricingSettings = await getPricingSettings()
  
  // 2️⃣ გამოვთვალოთ ლოკალური ფასი ახალი ფორმულით
  const { price: localBaseline, breakdown } = calculateLocalBaselineNew(orderData, pricingSettings)
  
  // 3️⃣ წავიკითხოთ AI კონფიგურაცია (ძველი სისტემა)
  const { data: config, error: configError } = await supabase
    .from('ai_pricing_config')
    .select('*')
    .single()

  if (configError || !config?.is_active) {
    return {
      suggested_price: localBaseline,
      confidence: 0.75,
      source: 'formula_only',
      explanation: 'AI სისტემა გამორთულია. ფასი გამოთვლილია ფორმულით.',
      local_baseline: localBaseline,
      breakdown,
      ai_reasoning: generateFormulaExplanation(orderData, breakdown)
    }
  }

  // 4️⃣ წავიკითხოთ აქტიური პროვაიდერები
  const { data: providers, error: providersError } = await supabase
    .from('ai_pricing_providers')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: true })

  if (providersError || !providers || providers.length === 0) {
    return {
      suggested_price: localBaseline,
      confidence: 0.7,
      source: 'formula_fallback',
      explanation: 'AI პროვაიდერები ვერ მოიძებნა. ფასი გამოთვლილია ფორმულით.',
      local_baseline: localBaseline,
      breakdown,
      ai_reasoning: generateFormulaExplanation(orderData, breakdown)
    }
  }

  // 5️⃣ ვცადოთ თითოეული პროვაიდერი
  const maxDeviation = config.max_ai_price_deviation_percent || 20
  
  for (const provider of providers) {
    try {
      const result = await tryProvider(provider, orderData, localBaseline, breakdown, maxDeviation)
      if (result) {
        return {
          ...result,
          local_baseline: localBaseline,
          breakdown
        }
      }
    } catch (err) {
      console.warn(`⚠️ Provider ${provider.provider_name} failed:`, err)
    }
  }

  // 6️⃣ Fallback
  if (config.fallback_to_local_on_error) {
    return {
      suggested_price: localBaseline,
      confidence: 0.65,
      source: 'formula_fallback',
      explanation: 'ყველა AI სერვერთან კავშირი ვერ მოხერხდა. ფასი გამოთვლილია ფორმულით.',
      local_baseline: localBaseline,
      breakdown,
      ai_reasoning: generateFormulaExplanation(orderData, breakdown)
    }
  }

  return {
    suggested_price: localBaseline,
    confidence: 0.5,
    source: 'formula_only',
    explanation: 'AI ვერ მოხერხდა. გამოყენებულია ფორმულა.',
    local_baseline: localBaseline,
    breakdown,
    ai_reasoning: generateFormulaExplanation(orderData, breakdown),
    error: 'All AI providers failed'
  }
}

// ============================================================================
// 📝 ფორმულის ახსნის გენერაცია
// ============================================================================
function generateFormulaExplanation(orderData: OrderData, breakdown: any): string {
  if (!breakdown) return 'ფასი გამოთვლილია სტანდარტული ფორმულით.'
  
  const lines = [
    `💻 ფორმულით გამოთვლა:`,
    `📦 ბაზის ფასი: ${breakdown.base_price}₾`,
    `📏 მანძილი (${orderData.distance_km}კმ): ${breakdown.distance_fee}₾`,
    `⚖️ წონა (${breakdown.weight_breakdown.chargeable_weight_kg}კგ): ${breakdown.weight_fee}₾`,
    `📦 მოცულობა (${orderData.volume_m3}მ³): ${breakdown.volume_fee}₾`,
    `🔧 დამატებითი: ${breakdown.extra_fees}₾`,
  ]
  
  if (breakdown.discount > 0) {
    lines.push(`💸 ფასდაკლება: -${breakdown.discount}₾`)
  }
  
  if (orderData.urgency !== 'standard') {
    lines.push(`⚡ სასწრაფოობა (${orderData.urgency}): ×${breakdown.urgency_multiplier}`)
  }
  
  lines.push(`✅ საბოლოო: ${breakdown.final_price}₾`)
  
  return lines.join('\n')
}

// ============================================================================
// 🤖 AI პროვაიდერის გამოძახება (გაუმჯობესებული prompt-ით)
// ============================================================================
async function tryProvider(
  provider: any, 
  orderData: OrderData, 
  localBaseline: number,
  breakdown: any,
  maxDeviation: number
): Promise<Omit<PricingResult, 'local_baseline' | 'breakdown'> | null> {
  
  // გაუმჯობესებული prompt ჩვენი ფორმულის კონტექსტით
  const prompt = `შენ ხარ ლოგისტიკის ფასების ექსპერტი საქართველოში.

📊 შეკვეთის დეტალები:
• მანძილი: ${orderData.distance_km} კმ
• წონა: ${orderData.weight_kg} კგ
• მოცულობა: ${orderData.volume_m3} მ³
• ტვირთის ტიპი: ${orderData.cargo_type}
• სასწრაფოობა: ${orderData.urgency}
• სპეციალური მოპყრობა: ${orderData.requires_special_handling ? 'კი' : 'არა'}

💻 ჩვენი ფორმულით გამოთვლილი ფასი:
${breakdown ? `
• ბაზის ფასი: ${breakdown.base_price}₾
• მანძილის ფასი: ${breakdown.distance_fee}₾
• წონის ფასი: ${breakdown.weight_fee}₾ (chargeable: ${breakdown.weight_breakdown.chargeable_weight_kg}კგ)
• მოცულობის ფასი: ${breakdown.volume_fee}₾
• დამატებითი ხარჯები: ${breakdown.extra_fees}₾
• ჯამი: ${breakdown.total}₾
` : `• ბაზისური ფასი: ${localBaseline}₾`}

🎯 შენი ამოცანა:
1. შეაფასე ეს ფასი ბაზრის სტანდარტებთან
2. გაითვალისწინე: ტვირთის ტიპი, სასწრაფოობა, მარშრუტის სპეციფიკა
3. შესთავაზე ოპტიმალური ფასი (შეგიძლია ±${maxDeviation}% ფარგლებში)

⚠️ დააბრუნე მხოლოდ JSON (არა markdown):
{
  "suggested_price": number,
  "confidence": number (0-1),
  "explanation": "მოკლე ახსნა ქართულად (მაქს 150 სიმბოლო)"
}`

  let response: Response
  const modelName = provider.model_name || getDefaultModel(provider.provider_type)

  try {
    if (provider.provider_type === 'gemini') {
      response = await fetch(`${provider.api_endpoint}/v1beta/models/${modelName}:generateContent?key=${provider.api_key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`)
      
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      return parseAIResponse(text, localBaseline, maxDeviation, provider.provider_name)

    } else if (provider.provider_type === 'anthropic') {
      response = await fetch(`${provider.api_endpoint}/v1/messages`, {
        method: 'POST',
        headers: { 
          'x-api-key': provider.api_key, 
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          model: modelName, 
          max_tokens: 400, 
          messages: [{ role: "user", content: prompt }] 
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`)
      
      const text = data.content?.[0]?.text
      return parseAIResponse(text, localBaseline, maxDeviation, provider.provider_name)

    } else {
      // OpenAI & Groq
      response = await fetch(`${provider.api_endpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${provider.api_key}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          model: modelName, 
          messages: [
            { 
              role: "system", 
              content: "შენ ხარ ლოგისტიკის ფასების ექსპერტი. ყოველთვის პასუხობ JSON ფორმატში, არა markdown." 
            },
            { role: "user", content: prompt }
          ], 
          max_tokens: 400,
          temperature: 0.3
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`)
      
      const text = data.choices?.[0]?.message?.content
      return parseAIResponse(text, localBaseline, maxDeviation, provider.provider_name)
    }
  } catch (err) {
    console.error(`❌ Provider ${provider.provider_name} error:`, err)
    throw err
  }
}

function getDefaultModel(providerType: string): string {
  switch (providerType) {
    case 'gemini': return 'gemini-1.5-flash'
    case 'groq': return 'llama-3.1-8b-instant'
    case 'anthropic': return 'claude-3-haiku-20240307'
    default: return 'gpt-4o-mini'
  }
}

// ============================================================================
// 🧹 JSON პარსინგი
// ============================================================================
function parseAIResponse(
  text: string | undefined, 
  localBaseline: number, 
  maxDeviation: number, 
  providerName: string
): Omit<PricingResult, 'local_baseline' | 'breakdown'> | null {
  if (!text) return null

  let cleanText = text.trim()
  
  // Markdown JSON ბლოკების მოშორება
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.replace(/^```json\n?/, '').replace(/\n?```$/, '')
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```\n?/, '').replace(/\n?```$/, '')
  }

  try {
    const parsed = JSON.parse(cleanText)
    let finalPrice = Number(parsed.suggested_price)
    
    // უსაფრთხოების ზღვარი
    const maxAllowed = localBaseline * (1 + maxDeviation / 100)
    const minAllowed = localBaseline * (1 - maxDeviation / 100)
    
    if (finalPrice > maxAllowed) finalPrice = maxAllowed
    if (finalPrice < minAllowed) finalPrice = minAllowed

    return {
      suggested_price: Math.round(finalPrice),
      confidence: Number(parsed.confidence) || 0.8,
      source: `ai_${providerName.toLowerCase().replace(/\s+/g, '_')}`,
      explanation: parsed.explanation || 'AI-მ გამოთვალა ფასი ბაზრის პირობების გათვალისწინებით.',
      ai_reasoning: parsed.explanation
    }
  } catch (err) {
    console.error('❌ Failed to parse AI response:', text, err)
    return null
  }
}