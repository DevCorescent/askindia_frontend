import { useState, useEffect } from 'react';
import {
  fetchIndianCities, fetchIndianCityRecords,
  INDIAN_CITIES_FALLBACK, INDIAN_CITY_RECORDS_FALLBACK, type IndianCity,
} from '../data/cities';

export function useCities(): string[] {
  const [cities, setCities] = useState<string[]>(INDIAN_CITIES_FALLBACK);

  useEffect(() => {
    fetchIndianCities()
      .then(setCities)
      .catch(() => { /* keep fallback */ });
  }, []);

  return cities;
}

/** Cities with their state, for state → city pickers. */
export function useCityRecords(): IndianCity[] {
  const [records, setRecords] = useState<IndianCity[]>(INDIAN_CITY_RECORDS_FALLBACK);

  useEffect(() => {
    let cancelled = false;
    fetchIndianCityRecords()
      .then(r => { if (!cancelled) setRecords(r); })
      .catch(() => { /* keep fallback */ });
    return () => { cancelled = true; };
  }, []);

  return records;
}
