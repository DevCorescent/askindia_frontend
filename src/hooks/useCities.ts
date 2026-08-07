import { useState, useEffect } from 'react';
import { fetchIndianCities, INDIAN_CITIES_FALLBACK } from '../data/cities';

export function useCities(): string[] {
  const [cities, setCities] = useState<string[]>(INDIAN_CITIES_FALLBACK);

  useEffect(() => {
    fetchIndianCities()
      .then(setCities)
      .catch(() => { /* keep fallback */ });
  }, []);

  return cities;
}
