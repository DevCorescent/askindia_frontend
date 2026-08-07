const CITIES_API = 'https://raw.githubusercontent.com/nshntarora/Indian-Cities-JSON/master/cities.json';

// Static fallback used until the API resolves (and on network errors).
export const INDIAN_CITIES_FALLBACK: string[] = [
  'Agartala', 'Agra', 'Ahmedabad', 'Aizawl', 'Ajmer', 'Aligarh', 'Allahabad',
  'Amravati', 'Amritsar', 'Anand', 'Aurangabad', 'Bengaluru', 'Bhopal',
  'Bhubaneswar', 'Bilaspur', 'Bokaro', 'Chandigarh', 'Chennai',
  'Coimbatore', 'Cuttack', 'Dehradun', 'Delhi', 'Dhanbad', 'Dharwad',
  'Durgapur', 'Erode', 'Faridabad', 'Ghaziabad', 'Gorakhpur', 'Gulbarga',
  'Guntur', 'Gurgaon', 'Guwahati', 'Gwalior', 'Hubli', 'Hyderabad',
  'Imphal', 'Indore', 'Itanagar', 'Jabalpur', 'Jaipur', 'Jalandhar',
  'Jammu', 'Jamnagar', 'Jamshedpur', 'Jodhpur', 'Kakinada', 'Kanpur',
  'Kochi', 'Kohima', 'Kolhapur', 'Kolkata', 'Kota', 'Kozhikode', 'Lucknow',
  'Ludhiana', 'Madurai', 'Mangaluru', 'Meerut', 'Mumbai', 'Mysuru', 'Nagpur',
  'Nanded', 'Nashik', 'Navi Mumbai', 'Noida', 'Panaji', 'Patna', 'Puducherry',
  'Pune', 'Raipur', 'Rajkot', 'Ranchi', 'Salem', 'Shimla', 'Siliguri',
  'Solapur', 'Srinagar', 'Surat', 'Thane', 'Thiruvananthapuram', 'Tirupati',
  'Tirupur', 'Tiruchirappalli', 'Udaipur', 'Vadodara', 'Varanasi',
  'Vijayawada', 'Visakhapatnam', 'Warangal',
];

let cache: string[] | null = null;

export async function fetchIndianCities(): Promise<string[]> {
  if (cache) return cache;
  const res = await fetch(CITIES_API);
  if (!res.ok) throw new Error('Failed to fetch cities');
  const data: { id: number; name: string; state: string }[] = await res.json();
  cache = [...new Set(data.map(c => c.name))].sort();
  return cache;
}
