import ct from 'countries-and-timezones';

/** OMAYA: default pre-chat phone country to Somalia (+252). */
const DEFAULT_COUNTRY_CODE = 'SO';
const DEFAULT_DIAL_CODE = '+252';

export const getActiveDialCode = () => DEFAULT_DIAL_CODE;

export const getActiveCountryCode = () => {
  const country = ct.getCountry(DEFAULT_COUNTRY_CODE) || {};
  return country.id || DEFAULT_COUNTRY_CODE;
};
