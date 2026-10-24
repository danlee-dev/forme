import {english} from './messages';
export type Locale='en'|'ko';
export function resolveLocale(saved?:string|null,acceptLanguage=''):Locale{
 if(saved==='en'||saved==='ko')return saved;
 const languages=acceptLanguage.split(',').map((part,index)=>{const [tag,...params]=part.trim().toLowerCase().split(';');const q=params.find(p=>p.trim().startsWith('q='));return {tag:tag.split('-')[0],q:q?Number(q.trim().slice(2)):1,index}}).filter(l=>['en','ko'].includes(l.tag)&&Number.isFinite(l.q)&&l.q>0&&l.q<=1).sort((a,b)=>b.q-a.q||a.index-b.index);
 return (languages[0]?.tag as Locale)||'en';
}
export function translate(text:string|undefined|null,locale:Locale){if(!text)return '';if(locale==='ko')return text;const translated=english[text.trim()];if(translated===undefined)return text;return (/^\s/.test(text)&&!/^\s/.test(translated)?' ':'')+translated+(/\s$/.test(text)&&!/\s$/.test(translated)?' ':'')}
export function localeTag(locale:Locale){return locale==='ko'?'ko-KR':'en-US'}
