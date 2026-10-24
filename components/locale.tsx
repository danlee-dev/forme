'use client';
import {createContext,useCallback,useContext,useEffect,useMemo,useState,type ReactNode} from 'react';
import {translate,localeTag,type Locale} from '@/lib/i18n';
const Context=createContext({locale:'en' as Locale,setLocale:(_locale:Locale)=>{}});
export function LocaleProvider({children,initialLocale}:{children:ReactNode;initialLocale:Locale}){
 const [locale,setLocale]=useState(initialLocale);
 useEffect(()=>{document.documentElement.lang=locale;document.cookie='forme_locale='+locale+'; Path=/; Max-Age=31536000; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'')},[locale]);
 const value=useMemo(()=>({locale,setLocale}),[locale]);return <Context.Provider value={value}>{children}</Context.Provider>
}
export function LocaleScope({locale,children}:{locale:Locale;children:ReactNode}){const {setLocale}=useContext(Context);const value=useMemo(()=>({locale,setLocale}),[locale,setLocale]);return <Context.Provider value={value}>{children}</Context.Provider>}
export function useLocale(){const {locale,setLocale}=useContext(Context);const t=useCallback((text:string|undefined|null)=>translate(text,locale),[locale]);const date=useCallback((value:string|number|Date,options?:Intl.DateTimeFormatOptions)=>new Intl.DateTimeFormat(localeTag(locale),options).format(new Date(value)),[locale]);const count=useCallback((n:number,kind:'question'|'response'|'draft')=>locale==='ko'?n+({question:'개 질문',response:'개 응답',draft:'개 초안'})[kind]:new Intl.NumberFormat('en-US').format(n)+' '+kind+(n===1?'':'s'),[locale]);return {locale,setLocale,t,date,count}}
export function SkipLink(){const {locale}=useLocale();return <a className="skip-link" href="#main-content">{locale==='ko'?'본문으로 건너뛰기':'Skip to content'}</a>}
