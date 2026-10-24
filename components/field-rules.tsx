'use client';
import {type Field} from '@/lib/schema';
import {useLocale} from './locale';
import {CountrySelect} from './phone-input';
import type {CountryCode} from 'libphonenumber-js';
export function FieldRules({field:f,onChange}:{field:Field;onChange:(patch:Partial<Field>)=>void}){
 const {locale}=useLocale(),en=locale==='en',v=f.validation||{};
 function set(key:keyof NonNullable<Field['validation']>,value:unknown){onChange({validation:{...v,[key]:value}})}
 const limits=f.type==='number'?[['min',en?'Minimum value':'최솟값'],['max',en?'Maximum value':'최댓값']]:f.type==='multi_select'?[['minChoices',en?'Minimum choices':'최소 선택 수'],['maxChoices',en?'Maximum choices':'최대 선택 수']]:['short_text','long_text'].includes(f.type)?[['minLength',en?'Minimum characters':'최소 글자 수'],['maxLength',en?'Maximum characters':'최대 글자 수']]:[];
 const impossible=f.type==='multi_select'&&v.minChoices!==undefined&&v.minChoices>f.options.length;
 const invalid=(v.min!==undefined&&v.max!==undefined&&v.min>v.max)||(v.minLength!==undefined&&v.maxLength!==undefined&&v.minLength>v.maxLength)||(v.minChoices!==undefined&&v.maxChoices!==undefined&&v.minChoices>v.maxChoices);
 return <details className="field-rules"><summary>{en?'Validation':'입력 형식 검사'}<span>{en?'Configure':'설정'}</span></summary><div className="field-rules-body">
 {f.type==='phone'&&<label className="block-setting-label">{en?'Default calling country':'기본 전화번호 국가'}<CountrySelect value={(v.phoneCountry||'KR') as CountryCode} onChange={country=>set('phoneCountry',country)}/></label>}
 <p>{f.type==='phone'?(en?'Checks the selected country’s phone number format.':'선택한 국가의 전화번호 규칙을 검사합니다.'):f.type==='email'?(en?'Email address format is checked automatically.':'이메일 주소 형식을 자동으로 검사합니다.'):f.type==='url'?(en?'Accepts valid http:// and https:// URLs.':'http://, https:// 주소 형식을 검사합니다.'):f.type==='date'||f.type==='time'?(en?'Only valid dates and times are accepted.':'유효한 날짜와 시간만 입력할 수 있습니다.'):en?'Checked when leaving a field, moving to the next page, and submitting.':'입력란을 벗어나거나 다음 페이지로 이동·제출할 때 검사합니다.'}</p>
 <div className="rule-columns">{limits.map(([key,label])=><label key={key}>{label}<input aria-label={label} type="number" step={f.type==='number'?'any':1} value={v[key as keyof typeof v] as number??''} placeholder={en?'No limit':'제한 없음'} onChange={e=>set(key as keyof typeof v,e.target.value===''?undefined:Number(e.target.value))}/></label>)}</div>
 {f.type==='number'&&<label className="switch-label"><input type="checkbox" checked={v.integer||false} onChange={e=>set('integer',e.target.checked)}/><span className="switch"/>{en?'Whole numbers only':'정수만 입력'}</label>}
 {impossible&&<p className="field-rule-error" role="alert">{en?'Minimum choices cannot exceed the available options.':'최소 선택 수는 선택지 개수보다 클 수 없어요.'}</p>}
 <label className="block-setting-label">{en?'Custom error message':'오류 안내 문구'}<input maxLength={300} value={v.errorMessage||''} placeholder={en?'Use the default message':'기본 안내 문구 사용'} onChange={e=>set('errorMessage',e.target.value||undefined)}/></label>
 {invalid&&<p className="field-rule-error" role="alert">{en?'Minimum must not exceed maximum.':'최솟값은 최댓값보다 클 수 없어요.'}</p>}
 </div></details>
}
