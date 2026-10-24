import { z } from 'zod';
export const fieldTypes = ['short_text','long_text','email','phone','number','date','url','select','multi_select','rating','consent','section','dropdown','time','linear_scale','ranking','hidden'] as const;
export const fieldSchema = z.object({
 id:z.string().min(1).max(80), type:z.enum(fieldTypes), label:z.string().min(1).max(300), description:z.string().max(1000).default(''), placeholder:z.string().max(200).default(''), required:z.boolean().default(false), options:z.array(z.string().min(1).max(200)).max(30).default([]), condition:z.object({fieldId:z.string(),value:z.string()}).optional()
});
export const themeSchema=z.object({accent:z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#dc5a46'),background:z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#faf8f5'),font:z.enum(['sans','serif']).default('sans'),radius:z.enum(['soft','round','square']).default('soft'),cover:z.enum(['peach','sage','ink','lavender','none']).default('peach'),layout:z.enum(['classic','step']).default('classic'),buttonLabel:z.string().min(1).max(60).default('제출하기')});
export const formSchema=z.object({
 id:z.string().uuid(),slug:z.string().min(3).max(80).regex(/^[a-z0-9][a-z0-9-]*$/),title:z.string().min(1).max(160),description:z.string().max(3000).default(''),emoji:z.string().max(16).default('✦'),fields:z.array(fieldSchema).max(60),theme:themeSchema,status:z.enum(['draft','published','closed']).default('draft'),thankYouTitle:z.string().min(1).max(200).default('답변을 잘 받았어요.'),thankYouMessage:z.string().max(1000).default('함께해 주셔서 감사합니다.'),closesAt:z.string().datetime().nullable().default(null),responseLimit:z.number().int().min(1).max(1000000).nullable().default(null),createdAt:z.string(),updatedAt:z.string(),revision:z.number().int().min(0).default(0),isExample:z.boolean().default(false)
});
export type FormDocument=z.infer<typeof formSchema>;
export type Field=z.infer<typeof fieldSchema>;
export type Theme=z.infer<typeof themeSchema>;
export type Answers=Record<string,string|string[]|number|boolean>;
export type Submission={id:string;form_id:string;answers:Answers;created_at:string;delivery_status?:string};
export const fieldLabels:Record<Field['type'],string>={short_text:'단답형',long_text:'장문형',email:'이메일',phone:'전화번호',number:'숫자',date:'날짜',url:'링크',select:'단일 선택',multi_select:'복수 선택',rating:'별점',consent:'동의',section:'섹션',dropdown:'드롭다운',time:'시간',linear_scale:'선형 척도',ranking:'순위',hidden:'숨김 필드'};
export function isVisible(field:Field,answers:Answers){if(!field.condition)return true;const value=answers[field.condition.fieldId];return Array.isArray(value)?value.includes(field.condition.value):String(value??'')===field.condition.value;}
export function validateAnswers(form:FormDocument,answers:Answers){
 const errors:Record<string,string>={};const clean:Answers={};
 for(const f of form.fields){if(f.type==='section'||!isVisible(f,clean))continue;const value=answers[f.id];const empty=value===undefined||value===''||value===false||(Array.isArray(value)&&value.length===0);
 if(empty){if(f.required)errors[f.id]='이 항목을 입력해주세요.';continue;}
 if(f.type==='multi_select'||f.type==='ranking'){if(!Array.isArray(value)||value.length>30||value.some(v=>!f.options.includes(v))||(f.type==='ranking'&&(value.length!==f.options.length||new Set(value).size!==value.length)))errors[f.id]='선택 항목을 확인해주세요.';else clean[f.id]=[...new Set(value)];continue;}
 if(f.type==='consent'){if(value!==true)errors[f.id]='동의 여부를 확인해주세요.';else clean[f.id]=true;continue;}
 if(f.type==='rating'||f.type==='number'||f.type==='linear_scale'){const n=Number(value);if(!Number.isFinite(n)||(f.type==='rating'&&(!Number.isInteger(n)||n<1||n>5))||(f.type==='linear_scale'&&(!Number.isInteger(n)||n<0||n>10)))errors[f.id]='올바른 숫자를 입력해주세요.';else clean[f.id]=n;continue;}
 if(typeof value!=='string'||value.length>5000){errors[f.id]='5,000자 이하로 입력해주세요.';continue;}
 const s=value.trim(); if(f.required&&!s){errors[f.id]='이 항목을 입력해주세요.';continue;}
 if(f.type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))errors[f.id]='이메일 주소를 확인해주세요.';
 if(f.type==='phone'&&!/^\+?[\d\s()-]{7,30}$/.test(s))errors[f.id]='전화번호를 확인해주세요.';
 if(f.type==='date'&&(!/^\d{4}-\d{2}-\d{2}$/.test(s)||Number.isNaN(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s))errors[f.id]='날짜를 확인해주세요.';
 if(f.type==='url'){try{if(!['https:','http:'].includes(new URL(s).protocol))throw Error();}catch{errors[f.id]='https://로 시작하는 주소를 입력해주세요.';}}
 if((f.type==='select'||f.type==='dropdown')&&!f.options.includes(s))errors[f.id]='선택 항목을 확인해주세요.';
 if(f.type==='time'&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(s))errors[f.id]='시간을 확인해주세요.';
 clean[f.id]=s;
 }return {errors,answers:clean};
}
export function validateForm(input:unknown){const parsed=formSchema.parse(input);const ids=new Set<string>();for(const f of parsed.fields){if(ids.has(f.id))throw new Error('문항 ID가 중복되었습니다.');ids.add(f.id);if(['select','multi_select','dropdown','ranking'].includes(f.type)&&(!f.options.length||new Set(f.options).size!==f.options.length))throw new Error('선택지는 비어 있거나 중복될 수 없습니다.');if(f.condition&&!parsed.fields.slice(0,parsed.fields.indexOf(f)).some(p=>p.id===f.condition!.fieldId))throw new Error('조건은 앞 문항만 참조할 수 있습니다.');}return parsed;}
export function csvEscape(value:unknown){let text=Array.isArray(value)?value.join(', '):String(value??'');if(/^[\s]*[=+\-@\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
