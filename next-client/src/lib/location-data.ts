export const LOCATION_DATA = {
  "US": {
    "CA": ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento"],
    "NY": ["New York City", "Buffalo", "Rochester", "Albany", "Syracuse"],
    "TX": ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth"],
    "FL": ["Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale"],
    "IL": ["Chicago", "Aurora", "Naperville", "Joliet", "Rockford"],
    "WA": ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue"],
    "MA": ["Boston", "Worcester", "Springfield", "Cambridge", "Lowell"],
    "GA": ["Atlanta", "Augusta", "Columbus", "Savannah", "Athens"],
    "PA": ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading"],
    "AZ": ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale"],
  },
  "CA": {
    "ON": ["Toronto", "Ottawa", "Mississauga", "Hamilton", "London"],
    "QC": ["Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil"],
    "BC": ["Vancouver", "Victoria", "Surrey", "Burnaby", "Richmond"],
    "AB": ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "Fort McMurray"],
    "MB": ["Winnipeg", "Brandon", "Steinbach", "Thompson", "Portage la Prairie"],
    "SK": ["Saskatoon", "Regina", "Prince Albert", "Moose Jaw", "Swift Current"],
  },
};

export const COUNTRY_NAMES: Record<string, string> = {
  "US": "United States",
  "CA": "Canada",
};

export const STATE_NAMES: Record<string, Record<string, string>> = {
  "US": {
    "CA": "California",
    "NY": "New York",
    "TX": "Texas",
    "FL": "Florida",
    "IL": "Illinois",
    "WA": "Washington",
    "MA": "Massachusetts",
    "GA": "Georgia",
    "PA": "Pennsylvania",
    "AZ": "Arizona",
  },
  "CA": {
    "ON": "Ontario",
    "QC": "Quebec",
    "BC": "British Columbia",
    "AB": "Alberta",
    "MB": "Manitoba",
    "SK": "Saskatchewan",
  },
};

export type Country = keyof typeof LOCATION_DATA;
export type StateProvince<C extends Country> = keyof typeof LOCATION_DATA[C];
