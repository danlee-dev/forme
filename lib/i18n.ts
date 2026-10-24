import {english} from './messages';
export type Locale='en'|'ko';
export function resolveLocale(saved?:string|null,acceptLanguage=''):Locale{
 if(saved==='en'||saved==='ko')return saved;
 const languages=acceptLanguage.split(',').map((part,index)=>{const [tag,...params]=part.trim().toLowerCase().split(';');const q=params.find(p=>p.trim().startsWith('q='));return {tag:tag.split('-')[0],q:q?Number(q.trim().slice(2)):1,index}}).filter(l=>['en','ko'].includes(l.tag)&&Number.isFinite(l.q)&&l.q>0&&l.q<=1).sort((a,b)=>b.q-a.q||a.index-b.index);
 return (languages[0]?.tag as Locale)||'en';
}
export function translate(text:string|undefined|null,locale:Locale){if(!text)return '';if(locale==='ko')return text;const patterns:[RegExp,(match:RegExpMatchArray)=>string][]=[[/^최소 (.+)자 이상 입력해주세요\.$/,m=>'Use at least '+m[1]+' characters.'],[/^최대 (.+)자까지 입력할 수 있어요\.$/,m=>'Use '+m[1]+' characters or fewer.'],[/^최소 (.+)개를 선택해주세요\.$/,m=>'Choose at least '+m[1]+' options.'],[/^최대 (.+)개를 선택해주세요\.$/,m=>'Choose no more than '+m[1]+' options.'],[/^(.+) 이상 입력해주세요\.$/,m=>'Enter '+m[1]+' or more.'],[/^(.+) 이하로 입력해주세요\.$/,m=>'Enter '+m[1]+' or less.']];for(const [pattern,format]of patterns){const match=text.match(pattern);if(match)return format(match)}const translated=english[text.trim()];if(translated===undefined)return text;return (/^\s/.test(text)&&!/^\s/.test(translated)?' ':'')+translated+(/\s$/.test(text)&&!/\s$/.test(translated)?' ':'')}
export function localeTag(locale:Locale){return locale==='ko'?'ko-KR':'en-US'}
