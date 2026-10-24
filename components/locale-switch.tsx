'use client';
import {Select} from './controls';
import {useLocale} from './locale';
import {Globe} from './icons';
export function LocaleSwitch(){const {locale,setLocale}=useLocale();return <div className="locale-switch"><Globe size={16}/><Select aria-label={locale==='ko'?'언어 / Language':'Language / 언어'} value={locale} onChange={e=>setLocale(e.target.value as 'en'|'ko')}><option value="en">English</option><option value="ko">한국어</option></Select></div>}
