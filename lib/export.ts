import {csvEscape,type FormDocument,type Answers} from './schema';
export type ExportRow={id:string;created_at:string;answers:Answers;field_labels?:Record<string,string>};
export function exportHeader(form:FormDocument,locale:'en'|'ko'){const fields=form.fields.filter(f=>!['section','page_break'].includes(f.type));return {fields,header:[locale==='ko'?'접수 번호':'Response ID',locale==='ko'?'제출 시각':'Submitted at',...fields.map(f=>f.label),locale==='ko'?'이전 문항 답변 (JSON)':'Archived answers (JSON)']}}
export function exportLine(form:FormDocument,row:ExportRow){const fields=exportHeader(form,'en').fields,ids=new Set(fields.map(f=>f.id));const archived=Object.fromEntries(Object.entries(row.answers).filter(([id])=>!ids.has(id)).map(([id,answer])=>[id,{label:row.field_labels?.[id]||id,answer}]));return [row.id,row.created_at,...fields.map(f=>row.answers[f.id]),Object.keys(archived).length?JSON.stringify(archived):''].map(csvEscape).join(',')+'\r\n'}
export function csvStream(form:FormDocument,batches:AsyncIterable<ExportRow[]>,locale:'en'|'ko',onCancel?:()=>void){const encoder=new TextEncoder(),iterator=batches[Symbol.asyncIterator]();return new ReadableStream<Uint8Array>({
 start(controller){controller.enqueue(encoder.encode('\uFEFF'+exportHeader(form,locale).header.map(csvEscape).join(',')+'\r\n'))},
 async pull(controller){try{const next=await iterator.next();if(next.done){controller.close();return}controller.enqueue(encoder.encode(next.value.map(row=>exportLine(form,row)).join('')))}catch(error){controller.error(error)}},
 async cancel(){onCancel?.();await iterator.return?.()}
})}
