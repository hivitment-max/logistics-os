// საქართველოს ძირითადი ქალაქების კოორდინატები
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
    'თბილისი': { lat: 41.7151, lng: 44.8271 },
    'tbilisi': { lat: 41.7151, lng: 44.8271 },
    'ბათუმი': { lat: 41.6168, lng: 41.6367 },
    'batumi': { lat: 41.6168, lng: 41.6367 },
    'ქუთაისი': { lat: 42.2708, lng: 42.6922 },
    'kutaisi': { lat: 42.2708, lng: 42.6922 },
    'ზუგდიდი': { lat: 42.5088, lng: 41.8708 },
    'zugdidi': { lat: 42.5088, lng: 41.8708 },
    'რუსთავი': { lat: 41.5492, lng: 45.0131 },
    'rustavi': { lat: 41.5492, lng: 45.0131 },
    'გორი': { lat: 41.9842, lng: 44.1089 },
    'gori': { lat: 41.9842, lng: 44.1089 },
    'ფოთი': { lat: 42.1464, lng: 41.6719 },
    'poti': { lat: 42.1464, lng: 41.6719 },
    'ხაშური': { lat: 41.9022, lng: 43.6011 },
    'khashuri': { lat: 41.9022, lng: 43.6011 },
    'სამტრედია': { lat: 42.1547, lng: 42.3358 },
    'samtredia': { lat: 42.1547, lng: 42.3358 },
    'სენაკი': { lat: 42.2436, lng: 42.0769 },
    'senaki': { lat: 42.2436, lng: 42.0769 },
    'ზესტაფონი': { lat: 42.1089, lng: 43.0489 },
    'zestafoni': { lat: 42.1089, lng: 43.0489 },
    'თელავი': { lat: 41.9189, lng: 45.4739 },
    'telavi': { lat: 41.9189, lng: 45.4739 },
    'ამბროლაური': { lat: 42.5264, lng: 43.0119 },
    'ambrolauri': { lat: 42.5264, lng: 43.0119 },
    'ოზურგეთი': { lat: 41.9219, lng: 42.0081 },
    'ozurgeti': { lat: 41.9219, lng: 42.0081 },
    'მარნეული': { lat: 41.4714, lng: 44.8331 },
    'marneuli': { lat: 41.4714, lng: 44.8331 },
    'ახალციხე': { lat: 41.6367, lng: 42.9833 },
    'akhaltsikhe': { lat: 41.6367, lng: 42.9833 },
    'კობულეთი': { lat: 41.8167, lng: 41.7833 },
    'kobuleti': { lat: 41.8167, lng: 41.7833 },
    'პარიზი': { lat: 48.8566, lng: 2.3522 },
    'paris': { lat: 48.8566, lng: 2.3522 },
    'ლონდონი': { lat: 51.5074, lng: -0.1278 },
    'london': { lat: 51.5074, lng: -0.1278 },
    'ბარსელონა': { lat: 41.3851, lng: 2.1734 },
    'barcelona': { lat: 41.3851, lng: 2.1734 },
    'ლიონი': { lat: 45.7640, lng: 4.8357 },
    'lyon': { lat: 45.7640, lng: 4.8357 },
  }
  
  // ნაგულისხმევი კოორდინატები (თბილისი)
  export const DEFAULT_COORDINATES = { lat: 41.7151, lng: 44.8271 }
  
  // ქალაქის კოორდინატების მიღება
  export function getCityCoordinates(cityName: string): { lat: number; lng: number } {
    if (!cityName) return DEFAULT_COORDINATES
    
    const normalized = cityName.toLowerCase().trim()
    return CITY_COORDINATES[normalized] || DEFAULT_COORDINATES
  }
  
  // მანძილის გამოთვლა ორ წერტილს შორის (კმ)
  export function calculateDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
  ): number {
    const R = 6371 // დედამიწის რადიუსი კმ-ში
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(R * c)
  }