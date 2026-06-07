'use server'

import { createClient } from '@supabase/supabase-js'

export interface OrderData {
  distance_km: number
  weight_kg: number
  volume_m3: number
  cargo_type: string
  urgency: 'standard' | 'express' | 'urgent'
  requires_special_handling: boolean
}

export interface PricingResult {
  suggested_price: number
  confidence: number
  source: string
  explanation: string
  local_baseline: number
  error?: string
}

// 🛡️ სერვერული Supabase კლიენტი (RLS-ის გვერდის ავლით, უსაფრთხოების გასაღებით)
const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function calculateAIPrice(orderData: OrderData): Promise<PricingResult> {
  const supabase = getSupabaseAdmin()

  // 1️⃣ წავიკითხოთ კონფიგურაცია
  const { data: config, error: configError } = await supabase
    .from('ai_pricing_config')
    .select('*')
    .single()

  if (configError || !config?.is_active) {
    return calculateLocalPrice(orderData, 1.5, 'AI სისტემა გამორთულია')
  }

  // 2️⃣ წავიკითხოთ აქტიური პროვაიდერები პრიორიტეტის მიხედვით
  const { data: providers, error: providersError } = await supabase
    .from('ai_pricing_providers')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: true })

  if (providersError || !providers || providers.length === 0) {
    return calculateLocalPrice(orderData, config.local_base_rate_per_km, 'AI პროვაიდერები ვერ მოიძებნა')
  }

  // 3️⃣ გამოვთვალოთ ლოკალური ბაზისური ფასი (უსაფრთხოების ქვედა/ზედა ზღვრისთვის და Fallback-ისთვის)
  const localBaseline = calculateLocalBaseline(orderData, config.local_base_rate_per_km)

  // 4️⃣ ვცადოთ თითოეული პროვაიდერი რიგით
  for (const provider of providers) {
    try {
      const result = await tryProvider(provider, orderData, localBaseline, config.max_ai_price_deviation_percent)
      if (result) {
        return {
          ...result,
          local_baseline: localBaseline
        }
      }
    } catch (err) {
      console.warn(`⚠️ Provider ${provider.provider_name} failed:`, err)
      // გავაგრძელოთ შემდეგ პროვაიდერზე
    }
  }

  // 5️⃣ Fallback: თუ ყველა API ჩავარდა, გამოვიყენოთ ლოკალური ალგორითმი
  if (config.fallback_to_local_on_error) {
    return {
      suggested_price: localBaseline,
      confidence: 0.6,
      source: 'local_fallback',
      explanation: 'ყველა AI სერვერთან კავშირი ვერ მოხერხდა. ფასი გამოთვლილია სარეზერვო ლოკალური ფორმულით.',
      local_baseline: localBaseline
    }
  }

  return {
    suggested_price: 0,
    confidence: 0,
    source: 'error',
    explanation: 'ფასის გამოთვლა ვერ მოხერხდა.',
    local_baseline: localBaseline,
    error: 'All providers failed'
  }
}

// 🧮 ლოკალური ბაზისური ფასის გამოთვლა
function calculateLocalBaseline(orderData: OrderData, baseRate: number): number {
  let price = orderData.distance_km * baseRate
  
  // წონის ფაქტორი
  if (orderData.weight_kg > 1000) price *= 1.5
  else if (orderData.weight_kg > 500) price *= 1.2

  // მოცულობის ფაქტორი
  if (orderData.volume_m3 > 10) price *= 1.3
  else if (orderData.volume_m3 > 5) price *= 1.1

  // სპეციალური მოპყრობა
  if (orderData.requires_special_handling) price += 50

  // სასწრაფოობა
  if (orderData.urgency === 'express') price *= 1.3
  if (orderData.urgency === 'urgent') price *= 1.5

  return Math.round(price)
}

// 🤖 კონკრეტული პროვაიდერის გამოძახება
async function tryProvider(
  provider: any, 
  orderData: OrderData, 
  localBaseline: number, 
  maxDeviation: number
): Promise<Omit<PricingResult, 'local_baseline'> | null> {
  
  const prompt = `
    შენ ხარ ლოგისტიკის ფასების ექსპერტი. გამოთვალე ოპტიმალური ფასი მოცემული პარამეტრების მიხედვით.
    შეკვეთის დეტალები:
    - მანძილი: ${orderData.distance_km} კმ
    - წონა: ${orderData.weight_kg} კგ
    - მოცულობა: ${orderData.volume_m3} მ³
    - ტვირთის ტიპი: ${orderData.cargo_type}
    - სასწრაფოობა: ${orderData.urgency}
    - სპეციალური მოპყრობა: ${orderData.requires_special_handling ? 'კი' : 'არა'}
    
    ჩვენი ლოკალური ალგორითმით გამოთვლილი ბაზისური ფასია: ${localBaseline} GEL.
    
    გაითვალისწინე ბაზრის სტანდარტები. თუ ტვირთი მყიფეა ან სასწრაფო, დაამატე შესაბამისი დანამატი.
    დააბრუნე მხოლოდ JSON ფორმატში, ზუსტად ამ სტრუქტურით (არ დაამატო სხვა ტექსტი):
    {
      "suggested_price": number,
      "confidence": number,
      "explanation": "მოკლე ახსნა ქართულად, რატომ არის ეს ფასი ოპტიმალური"
    }
  `

  let response: Response
  const modelName = provider.model_name || getDefaultModel(provider.provider_type)

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
        max_tokens: 300, 
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
        messages: [{ role: "user", content: prompt }], 
        max_tokens: 300 
      })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`)
    
    const text = data.choices?.[0]?.message?.content
    return parseAIResponse(text, localBaseline, maxDeviation, provider.provider_name)
  }
}

function getDefaultModel(providerType: string): string {
  switch (providerType) {
    case 'gemini': return 'gemini-1.5-flash'
    case 'groq': return 'llama3-8b-8192'
    case 'anthropic': return 'claude-3-haiku-20240307'
    default: return 'gpt-3.5-turbo'
  }
}

// 🧹 JSON-ის გაწმენდა და პარსინგი (Markdown ბლოკების მოშორება)
function parseAIResponse(text: string | undefined, localBaseline: number, maxDeviation: number, providerName: string): Omit<PricingResult, 'local_baseline'> | null {
  if (!text) return null

  let cleanText = text.trim()
  // Markdown JSON ბლოკების მოშორება (LLM-ები ხშირად ამატებენ)
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.replace(/^```json\n?/, '').replace(/\n?```$/, '')
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```\n?/, '').replace(/\n?```$/, '')
  }

  try {
    const parsed = JSON.parse(cleanText)
    let finalPrice = Number(parsed.suggested_price)
    
    // 🛡️ უსაფრთხოების ზღვარი: AI ვერ შესთავაზებს ლოკალურ ფასზე maxDeviation%-ით მეტს/ნაკლებს
    const maxAllowed = localBaseline * (1 + maxDeviation / 100)
    const minAllowed = localBaseline * (1 - maxDeviation / 100)
    
    if (finalPrice > maxAllowed) finalPrice = maxAllowed
    if (finalPrice < minAllowed) finalPrice = minAllowed

    return {
      suggested_price: Math.round(finalPrice),
      confidence: Number(parsed.confidence) || 0.8,
      source: `ai_${providerName.toLowerCase().replace(/\s+/g, '_')}`,
      explanation: parsed.explanation || 'AI-მ გამოთვალა ფასი ბაზრის პირობების გათვალისწინებით.'
    }
  } catch (err) {
    console.error('❌ Failed to parse AI response:', text, err)
    return null
  }
}

function calculateLocalPrice(orderData: OrderData, baseRate: number, reason: string): PricingResult {
  const price = calculateLocalBaseline(orderData, baseRate)
  return {
    suggested_price: price,
    confidence: 0.7,
    source: 'local_only',
    explanation: reason,
    local_baseline: price
  }
}