/**
 * 💰 ფასების გამოთვლის ცენტრალიზებული სისტემა
 * 
 * ეს ფაილი გამოიყენება:
 * - შეკვეთის შექმნისას (AddOrderModal)
 * - AI აგენტის მიერ რეკომენდაციისთვის
 * - ინვოისის გენერაციისას
 * - ანალიტიკისთვის
 * 
 * ფორმულა:
 * TOTAL_PRICE = BASE_PRICE + DISTANCE_FEE + WEIGHT_FEE + VOLUME_FEE + EXTRA_FEES - DISCOUNT
 */

// ============================================================================
// 📋 ტიპები
// ============================================================================

export interface PricingSettings {
    // ბაზის პარამეტრები
    pricing_base_price: number
    pricing_min_price: number
    pricing_max_price: number
    
    // მანძილის ტარიფები
    pricing_rate_short_haul: number    // < 100km
    pricing_rate_medium_haul: number   // 100-500km
    pricing_rate_long_haul: number     // > 500km
    
    // წონა & მოცულობა
    pricing_rate_per_kg: number
    pricing_rate_per_m3: number
    pricing_volume_weight_factor: number  // 333 საგზაო, 167 საჰაერო
    
    // დამატებითი ხარჯები
    pricing_fuel_surcharge_per_km: number
    pricing_toll_fee_flat: number
    pricing_waiting_time_per_hour: number
    pricing_special_handling_adr: number
    pricing_special_handling_refrigerated: number
    
    // ფასდაკლება
    pricing_discount_percentage: number
  }
  
  export interface PricingInput {
    distance_km: number
    weight_kg: number
    volume_m3: number
    
    // ოფციონალური პარამეტრები
    is_hazardous?: boolean           // ADR ტვირთი
    is_refrigerated?: boolean        // მაცივრიანი
    waiting_hours?: number           // ლოდინის საათები
    discount_percentage?: number     // ინდივიდუალური ფასდაკლება
  }
  
  export interface PricingBreakdown {
    base_price: number
    distance_fee: number
    distance_breakdown: {
      short_haul_km: number
      short_haul_cost: number
      medium_haul_km: number
      medium_haul_cost: number
      long_haul_km: number
      long_haul_cost: number
    }
    weight_fee: number
    weight_breakdown: {
      actual_weight_kg: number
      volume_weight_kg: number
      chargeable_weight_kg: number
      rate_per_kg: number
    }
    volume_fee: number
    subtotal: number
    extra_fees: number
    extra_breakdown: {
      fuel_surcharge: number
      toll_fee: number
      waiting_fee: number
      special_handling: number
    }
    discount: number
    total_before_limits: number
    total: number
    currency: string
  }
  
  export interface PricingResult {
    success: boolean
    input: PricingInput
    breakdown: PricingBreakdown
    summary: string
  }
  
  // ============================================================================
  // 💰 ფასის გამოთვლა
  // ============================================================================
  
  export function calculatePrice(
    input: PricingInput,
    settings: PricingSettings,
    currency: string = 'GEL'
  ): PricingResult {
    try {
      // ვალიდაცია
      if (input.distance_km < 0 || input.weight_kg < 0 || input.volume_m3 < 0) {
        throw new Error('უარყოფითი მნიშვნელობები დაუშვებელია')
      }
  
      // 1. ბაზის ფასი
      const base_price = settings.pricing_base_price
  
      // 2. მანძილის ფასი (ზონური)
      let distance_fee = 0
      let short_haul_km = 0, short_haul_cost = 0
      let medium_haul_km = 0, medium_haul_cost = 0
      let long_haul_km = 0, long_haul_cost = 0
  
      if (input.distance_km < 100) {
        short_haul_km = input.distance_km
        short_haul_cost = short_haul_km * settings.pricing_rate_short_haul
        distance_fee = short_haul_cost
      } else if (input.distance_km < 500) {
        short_haul_km = 100
        short_haul_cost = short_haul_km * settings.pricing_rate_short_haul
        
        medium_haul_km = input.distance_km - 100
        medium_haul_cost = medium_haul_km * settings.pricing_rate_medium_haul
        
        distance_fee = short_haul_cost + medium_haul_cost
      } else {
        short_haul_km = 100
        short_haul_cost = short_haul_km * settings.pricing_rate_short_haul
        
        medium_haul_km = 400
        medium_haul_cost = medium_haul_km * settings.pricing_rate_medium_haul
        
        long_haul_km = input.distance_km - 500
        long_haul_cost = long_haul_km * settings.pricing_rate_long_haul
        
        distance_fee = short_haul_cost + medium_haul_cost + long_haul_cost
      }
  
      // 3. წონის ფასი (Chargeable Weight)
      const actual_weight_kg = input.weight_kg
      const volume_weight_kg = input.volume_m3 * settings.pricing_volume_weight_factor
      const chargeable_weight_kg = Math.max(actual_weight_kg, volume_weight_kg)
      const weight_fee = chargeable_weight_kg * settings.pricing_rate_per_kg
  
      // 4. მოცულობის ფასი
      const volume_fee = input.volume_m3 * settings.pricing_rate_per_m3
  
      // 5. ქვეჯამი
      const subtotal = base_price + distance_fee + weight_fee + volume_fee
  
      // 6. დამატებითი ხარჯები
      const fuel_surcharge = input.distance_km * settings.pricing_fuel_surcharge_per_km
      const toll_fee = settings.pricing_toll_fee_flat
      const waiting_fee = (input.waiting_hours || 0) * settings.pricing_waiting_time_per_hour
      
      let special_handling = 0
      if (input.is_hazardous) special_handling += settings.pricing_special_handling_adr
      if (input.is_refrigerated) special_handling += settings.pricing_special_handling_refrigerated
      
      const extra_fees = fuel_surcharge + toll_fee + waiting_fee + special_handling
  
      // 7. ფასდაკლება
      const total_before_discount = subtotal + extra_fees
      const discount_percent = input.discount_percentage || settings.pricing_discount_percentage
      const discount = total_before_discount * (discount_percent / 100)
  
      // 8. საბოლოო ფასი
      let total = total_before_discount - discount
  
      // 9. მინ/მაქს შეზღუდვები
      const total_before_limits = total
      if (total < settings.pricing_min_price) total = settings.pricing_min_price
      if (total > settings.pricing_max_price) total = settings.pricing_max_price
  
      // 10. დამრგვალება
      const breakdown: PricingBreakdown = {
        base_price: round(base_price),
        distance_fee: round(distance_fee),
        distance_breakdown: {
          short_haul_km: round(short_haul_km),
          short_haul_cost: round(short_haul_cost),
          medium_haul_km: round(medium_haul_km),
          medium_haul_cost: round(medium_haul_cost),
          long_haul_km: round(long_haul_km),
          long_haul_cost: round(long_haul_cost)
        },
        weight_fee: round(weight_fee),
        weight_breakdown: {
          actual_weight_kg: round(actual_weight_kg),
          volume_weight_kg: round(volume_weight_kg),
          chargeable_weight_kg: round(chargeable_weight_kg),
          rate_per_kg: settings.pricing_rate_per_kg
        },
        volume_fee: round(volume_fee),
        subtotal: round(subtotal),
        extra_fees: round(extra_fees),
        extra_breakdown: {
          fuel_surcharge: round(fuel_surcharge),
          toll_fee: round(toll_fee),
          waiting_fee: round(waiting_fee),
          special_handling: round(special_handling)
        },
        discount: round(discount),
        total_before_limits: round(total_before_limits),
        total: round(total),
        currency
      }
  
      // 11. შემაჯამებელი ტექსტი
      const summary = generateSummary(breakdown, input)
  
      return {
        success: true,
        input,
        breakdown,
        summary
      }
  
    } catch (error: any) {
      return {
        success: false,
        input,
        breakdown: {} as PricingBreakdown,
        summary: `❌ შეცდომა: ${error.message}`
      }
    }
  }
  
  // ============================================================================
  // 🔧 დამხმარე ფუნქციები
  // ============================================================================
  
  function round(value: number): number {
    return Math.round(value * 100) / 100
  }
  
  function generateSummary(breakdown: PricingBreakdown, input: PricingInput): string {
    const lines = [
      `💰 ფასის გამოთვლა:`,
      `📏 მანძილი: ${input.distance_km} კმ → ${breakdown.distance_fee} ₾`,
      `⚖️ წონა: ${breakdown.weight_breakdown.chargeable_weight_kg} კგ (chargeable) → ${breakdown.weight_fee} ₾`,
      `📦 მოცულობა: ${input.volume_m3} მ³ → ${breakdown.volume_fee} ₾`,
      `🔧 დამატებითი: ${breakdown.extra_fees} ₾`,
      `💸 ფასდაკლება: -${breakdown.discount} ₾`,
      `━━━━━━━━━━━━━━━━━━━`,
      `✅ საბოლოო: ${breakdown.total} ₾`
    ]
    
    return lines.join('\n')
  }
  
  // ============================================================================
  // 🧪 ტესტირების ფუნქცია
  // ============================================================================
  
  export function testPricing() {
    const testSettings: PricingSettings = {
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
      pricing_discount_percentage: 0
    }
  
    const testInput: PricingInput = {
      distance_km: 150,
      weight_kg: 500,
      volume_m3: 2,
      is_refrigerated: true
    }
  
    const result = calculatePrice(testInput, testSettings)
    
    console.log('🧪 ტესტის შედეგი:')
    console.log(result.summary)
    console.log('\n📊 დეტალური breakdown:')
    console.log(result.breakdown)
    
    return result
  }
  
  // ============================================================================
  // 📊 AI აგენტისთვის helper ფუნქცია
  // ============================================================================
  
  export function getPricingContextForAI(
    input: PricingInput,
    settings: PricingSettings
  ): string {
    const result = calculatePrice(input, settings)
    
    if (!result.success) {
      return `❌ ფასის გამოთვლა ვერ მოხერხდა: ${result.summary}`
    }
  
    const b = result.breakdown
    
    return `
  💰 ფასის ანალიზი:
  
  📊 ბაზის ფასი: ${b.base_price} ₾
  📏 მანძილი (${input.distance_km} კმ): ${b.distance_fee} ₾
  ⚖️ წონა (${b.weight_breakdown.chargeable_weight_kg} კგ chargeable): ${b.weight_fee} ₾
  📦 მოცულობა (${input.volume_m3} მ³): ${b.volume_fee} ₾
  🔧 დამატებითი ხარჯები: ${b.extra_fees} ₾
  💸 ფასდაკლება: ${b.discount} ₾
  ━━━━━━━━━━━━━━━━━━━
  ✅ საბოლოო ფასი: ${b.total} ₾
  
  📈 დეტალური ინფორმაცია AI ანალიზისთვის:
  - მანძილის ზონა: ${input.distance_km < 100 ? 'მოკლე (<100კმ)' : input.distance_km < 500 ? 'საშუალო (100-500კმ)' : 'გრძელი (>500კმ)'}
  - Chargeable weight: ${b.weight_breakdown.chargeable_weight_kg} კგ (${b.weight_breakdown.actual_weight_kg} კგ რეალური vs ${b.weight_breakdown.volume_weight_kg} კგ მოცულობითი)
  - სპეციალური ტვირთი: ${input.is_hazardous ? 'ADR' : ''} ${input.is_refrigerated ? 'მაცივრიანი' : ''}
  - ლოდინის საათები: ${input.waiting_hours || 0}
  `.trim()
  }