const CITIES_API = 'https://raw.githubusercontent.com/nshntarora/Indian-Cities-JSON/master/cities.json';

export interface IndianCity { name: string; state: string }

/** States and union territories, for state pickers. */
export const INDIAN_STATES: string[] = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam',
  'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

// State names in the API data that differ from INDIAN_STATES.
const STATE_ALIASES: Record<string, string> = {
  'Himachal Praddesh': 'Himachal Pradesh',
  'Dadra and Nagar Haveli': 'Dadra and Nagar Haveli and Daman and Diu',
};

// Static fallback used until the API resolves (and on network errors).
export const INDIAN_CITY_RECORDS_FALLBACK: IndianCity[] = [
  ['Agartala', 'Tripura'], ['Agra', 'Uttar Pradesh'], ['Ahmedabad', 'Gujarat'],
  ['Aizawl', 'Mizoram'], ['Ajmer', 'Rajasthan'], ['Aligarh', 'Uttar Pradesh'],
  ['Allahabad', 'Uttar Pradesh'], ['Amravati', 'Maharashtra'], ['Amritsar', 'Punjab'],
  ['Anand', 'Gujarat'], ['Aurangabad', 'Maharashtra'], ['Bengaluru', 'Karnataka'],
  ['Bhopal', 'Madhya Pradesh'], ['Bhubaneswar', 'Odisha'], ['Bilaspur', 'Chhattisgarh'],
  ['Bokaro', 'Jharkhand'], ['Chandigarh', 'Chandigarh'], ['Chennai', 'Tamil Nadu'],
  ['Coimbatore', 'Tamil Nadu'], ['Cuttack', 'Odisha'], ['Dehradun', 'Uttarakhand'],
  ['Delhi', 'Delhi'], ['Dhanbad', 'Jharkhand'], ['Dharwad', 'Karnataka'],
  ['Durgapur', 'West Bengal'], ['Erode', 'Tamil Nadu'], ['Faridabad', 'Haryana'],
  ['Ghaziabad', 'Uttar Pradesh'], ['Gorakhpur', 'Uttar Pradesh'], ['Gulbarga', 'Karnataka'],
  ['Guntur', 'Andhra Pradesh'], ['Gurgaon', 'Haryana'], ['Guwahati', 'Assam'],
  ['Gwalior', 'Madhya Pradesh'], ['Hubli', 'Karnataka'], ['Hyderabad', 'Telangana'],
  ['Imphal', 'Manipur'], ['Indore', 'Madhya Pradesh'], ['Itanagar', 'Arunachal Pradesh'],
  ['Jabalpur', 'Madhya Pradesh'], ['Jaipur', 'Rajasthan'], ['Jalandhar', 'Punjab'],
  ['Jammu', 'Jammu and Kashmir'], ['Jamnagar', 'Gujarat'], ['Jamshedpur', 'Jharkhand'],
  ['Jodhpur', 'Rajasthan'], ['Kakinada', 'Andhra Pradesh'], ['Kanpur', 'Uttar Pradesh'],
  ['Kochi', 'Kerala'], ['Kohima', 'Nagaland'], ['Kolhapur', 'Maharashtra'],
  ['Kolkata', 'West Bengal'], ['Kota', 'Rajasthan'], ['Kozhikode', 'Kerala'],
  ['Lucknow', 'Uttar Pradesh'], ['Ludhiana', 'Punjab'], ['Madurai', 'Tamil Nadu'],
  ['Mangaluru', 'Karnataka'], ['Meerut', 'Uttar Pradesh'], ['Mumbai', 'Maharashtra'],
  ['Mysuru', 'Karnataka'], ['Nagpur', 'Maharashtra'], ['Nanded', 'Maharashtra'],
  ['Nashik', 'Maharashtra'], ['Navi Mumbai', 'Maharashtra'], ['Noida', 'Uttar Pradesh'],
  ['Panaji', 'Goa'], ['Patna', 'Bihar'], ['Puducherry', 'Puducherry'],
  ['Pune', 'Maharashtra'], ['Raipur', 'Chhattisgarh'], ['Rajkot', 'Gujarat'],
  ['Ranchi', 'Jharkhand'], ['Salem', 'Tamil Nadu'], ['Shimla', 'Himachal Pradesh'],
  ['Siliguri', 'West Bengal'], ['Solapur', 'Maharashtra'], ['Srinagar', 'Jammu and Kashmir'],
  ['Surat', 'Gujarat'], ['Thane', 'Maharashtra'], ['Thiruvananthapuram', 'Kerala'],
  ['Tirupati', 'Andhra Pradesh'], ['Tirupur', 'Tamil Nadu'], ['Tiruchirappalli', 'Tamil Nadu'],
  ['Udaipur', 'Rajasthan'], ['Vadodara', 'Gujarat'], ['Varanasi', 'Uttar Pradesh'],
  ['Vijayawada', 'Andhra Pradesh'], ['Visakhapatnam', 'Andhra Pradesh'], ['Warangal', 'Telangana'],
].map(([name, state]) => ({ name, state }));

export const INDIAN_CITIES_FALLBACK: string[] = INDIAN_CITY_RECORDS_FALLBACK.map(c => c.name);

let recordsCache: Promise<IndianCity[]> | null = null;

/** Every city with its state, from the cities API (cached for the session). */
export function fetchIndianCityRecords(): Promise<IndianCity[]> {
  if (!recordsCache) {
    recordsCache = fetch(CITIES_API)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch cities');
        return res.json() as Promise<{ id: number; name: string; state: string }[]>;
      })
      .then(data => data.map(c => ({ name: c.name, state: STATE_ALIASES[c.state] ?? c.state })));
    recordsCache.catch(() => { recordsCache = null; });
  }
  return recordsCache;
}

export async function fetchIndianCities(): Promise<string[]> {
  const records = await fetchIndianCityRecords();
  return [...new Set(records.map(c => c.name))].sort();
}

/** Sorted, de-duplicated city names in `state`. */
export function citiesInState(records: IndianCity[], state: string): string[] {
  return [...new Set(records.filter(c => c.state === state).map(c => c.name))].sort();
}
