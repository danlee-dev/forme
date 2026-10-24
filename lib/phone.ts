import {parsePhoneNumberFromString,getCountries as allCountries,getCountryCallingCode as callingCode,isSupportedCountry as supportsCountry,type CountryCode} from 'libphonenumber-js/core';
import metadata from 'libphonenumber-js/metadata.max.json';
export type {CountryCode};
export function parsePhone(value:string,country:CountryCode='KR'){return parsePhoneNumberFromString(value,{defaultCountry:country,extract:false},metadata)}
export function getCountries(){return allCountries(metadata)}
export function getCountryCallingCode(country:CountryCode){return callingCode(country,metadata)}
export function isSupportedCountry(country:string){return supportsCountry(country as CountryCode,metadata)}
