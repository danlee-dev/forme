import {conditionReferences} from './conditions';
import type {Field,FormDocument} from './schema';
export const choiceTypes=new Set<Field['type']>(['select','multi_select','dropdown','ranking']);
export function reorderBlock(fields:Field[],sourceId:string,beforeId:string|null):Field[]|null{
 if(sourceId===beforeId)return fields;
 const source=fields.find(f=>f.id===sourceId);if(!source)return null;
 const next=fields.filter(f=>f.id!==sourceId);
 const index=beforeId===null?next.length:next.findIndex(f=>f.id===beforeId);if(index<0)return null;
 next.splice(index,0,source);const seen=new Set<string>();
 for(const f of next){if(conditionReferences(f).some(id=>!seen.has(id)))return null;seen.add(f.id)}
 return next.every((f,i)=>f===fields[i])?fields:next;
}
export function insertBlock(fields:Field[],field:Field,afterId:string|null):Field[]|null{
 if(fields.length>=60||fields.some(f=>f.id===field.id))return null;
 const index=afterId===null?fields.length:fields.findIndex(f=>f.id===afterId)+1;
 if(afterId!==null&&index===0)return null;
 const next=[...fields];next.splice(index,0,field);return next;
}

export function normalizeDraft(form:FormDocument,locale:'en'|'ko'):FormDocument{return {...form,title:form.title.trim()?form.title:locale==='en'?'Untitled form':'제목 없는 폼',fields:form.fields.map(f=>f.label.trim()?f:{...f,label:f.type==='section'?(locale==='en'?'New section':'새 섹션'):(locale==='en'?'New question':'새 질문')})}}
