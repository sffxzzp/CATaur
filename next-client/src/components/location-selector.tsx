import { LOCATION_DATA, COUNTRY_NAMES, STATE_NAMES, type Country } from "@/lib/location-data";

type LocationSelectorProps = {
  country: string;
  state: string;
  city: string;
  onCountryChange: (country: string) => void;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  className?: string;
};

export function LocationSelector({
  country,
  state,
  city,
  onCountryChange,
  onStateChange,
  onCityChange,
  className = "",
}: LocationSelectorProps) {
  const inp = "w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm bg-[var(--surface)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]";

  const states = country ? Object.keys(LOCATION_DATA[country as Country]) : [];
  const cities = country && state ? LOCATION_DATA[country as Country][state as keyof typeof LOCATION_DATA[Country]] || [] : [];

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      <select
        className={inp}
        value={country}
        onChange={e => onCountryChange(e.target.value)}
      >
        <option value="">Country</option>
        {Object.keys(LOCATION_DATA).map(c => (
          <option key={c} value={c}>{COUNTRY_NAMES[c]}</option>
        ))}
      </select>
      <select
        className={inp}
        value={state}
        onChange={e => onStateChange(e.target.value)}
        disabled={!country}
      >
        <option value="">State/Province</option>
        {states.map(s => (
          <option key={s} value={s}>
            {country ? STATE_NAMES[country as Country][s] : s}
          </option>
        ))}
      </select>
      <select
        className={inp}
        value={city}
        onChange={e => onCityChange(e.target.value)}
        disabled={!state}
      >
        <option value="">City</option>
        {cities.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  );
}

export function formatLocation(city: string | null, state: string | null): string {
  if (!city || !state) return "—";
  return `${city}, ${state}`;
}
