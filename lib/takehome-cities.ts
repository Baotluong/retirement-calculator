export type TakehomeCityOption = {
  id: string;
  label: string;
  workCity: string;
  workCounty: string;
};

export const US_STATE_OPTIONS: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

export const TAKEHOME_CITIES_BY_STATE: Record<string, TakehomeCityOption[]> = {
  NY: [{ id: "nyc", label: "New York City", workCity: "New York", workCounty: "New York" }],
  PA: [{ id: "philadelphia", label: "Philadelphia", workCity: "Philadelphia", workCounty: "Philadelphia" }],
  OH: [
    { id: "columbus", label: "Columbus", workCity: "Columbus", workCounty: "Franklin" },
    { id: "cleveland", label: "Cleveland", workCity: "Cleveland", workCounty: "Cuyahoga" },
    { id: "cincinnati", label: "Cincinnati", workCity: "Cincinnati", workCounty: "Hamilton" },
  ],
  CA: [{ id: "san-francisco", label: "San Francisco", workCity: "San Francisco", workCounty: "San Francisco" }],
  MI: [{ id: "detroit", label: "Detroit", workCity: "Detroit", workCounty: "Wayne" }],
  KY: [{ id: "louisville", label: "Louisville", workCity: "Louisville", workCounty: "Jefferson" }],
};

export function getCitiesForState(state: string): TakehomeCityOption[] {
  return TAKEHOME_CITIES_BY_STATE[state.toUpperCase()] ?? [];
}

export function findCityOption(state: string, cityId: string | undefined): TakehomeCityOption | undefined {
  if (!cityId) return undefined;
  return getCitiesForState(state).find((city) => city.id === cityId);
}
export function getStateName(stateCode: string): string {
  const match = US_STATE_OPTIONS.find(
    (option) => option.code === stateCode.toUpperCase()
  );
  return match?.name ?? stateCode.toUpperCase();
}

export function formatTakehomeLocation(state: string, cityId?: string): string {
  const stateCode = state.toUpperCase();
  const city = findCityOption(stateCode, cityId);
  if (city) {
    return city.label + ", " + stateCode;
  }
  return getStateName(stateCode);
}

