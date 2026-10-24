import type {Answers,Field,FormDocument} from './schema';
import {isVisible,validateAnswers} from './schema';
export type FormPage={id:string;fields:Field[];nextLabel?:string;backLabel?:string};
export function isQuestion(field:Field){return !['section','page_break','hidden'].includes(field.type)}
export function visibleFields(form:FormDocument,answers:Answers){const normalized=validateAnswers(form,answers).answers;const visible:Answers={};const available=new Set<string>();return form.fields.filter(f=>{if(!isVisible(f,visible,available))return false;available.add(f.id);if(normalized[f.id]!==undefined)visible[f.id]=normalized[f.id];return true})}
export function formPages(form:FormDocument,answers:Answers):FormPage[]{
 const fields=visibleFields(form,answers);
 if(form.theme.layout==='classic')return [{id:'all',fields:fields.filter(f=>f.type!=='page_break')}];
 const pages:FormPage[]=[];let current:FormPage={id:'start',fields:[]};
 const flush=()=>{if(current.fields.some(f=>f.type!=='hidden'))pages.push(current)};
 if(form.theme.layout==='step'){
  let headings:Field[]=[];for(const f of fields){if(f.type==='section'){headings.push(f);continue}if(!isQuestion(f))continue;pages.push({id:f.id,fields:[...headings,f]});headings=[]}if(headings.length&&pages.length)pages.at(-1)!.fields.push(...headings);return pages.length?pages:[{id:'empty',fields:headings}];
 }
 for(const f of fields){if(f.type==='page_break'){current.nextLabel=f.navigation?.nextLabel;flush();current={id:f.id,fields:[],backLabel:f.navigation?.backLabel};continue}if(f.type==='section'&&f.pageStart&&current.fields.some(p=>p.type!=='hidden')){flush();current={id:f.id,fields:[]}}current.fields.push(f)}
 flush();return pages.length?pages:[{id:'empty',fields:[]}];
}
