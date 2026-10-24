export const conditionOperators=['equals','not_equals','contains','not_contains','starts_with','ends_with','greater_than','greater_or_equal','less_than','less_or_equal','is_empty','is_filled'] as const;
export type ConditionOperator=typeof conditionOperators[number];
export type ConditionRule={fieldId:string;value:string;operator?:ConditionOperator};
type Conditional={condition?:ConditionRule;conditions?:{match:'all'|'any';rules:ConditionRule[]}};
type Values=Record<string,string|string[]|number|boolean>;
export function conditionRules(field:Conditional):ConditionRule[]{return field.conditions?.rules||(field.condition?[field.condition]:[])}
export function conditionReferences(field:Conditional){return conditionRules(field).map(rule=>rule.fieldId)}
function empty(value:Values[string]|undefined){return value===undefined||value===false||(typeof value==='string'&&!value.trim())||(Array.isArray(value)&&!value.length)}
export function matchesRule(rule:ConditionRule,answers:Values,available?:Set<string>){
 if(available&&!available.has(rule.fieldId))return false;
 const value=answers[rule.fieldId],op=rule.operator||'equals';
 if(op==='is_empty')return empty(value);if(op==='is_filled')return !empty(value);
 if(!rule.operator&&rule.value==='')return empty(value);
 if(empty(value))return false;
 if(typeof value==='number'&&(op==='equals'||op==='not_equals')){if(!rule.value.trim()||!Number.isFinite(Number(rule.value)))return false;return op==='equals'?value===Number(rule.value):value!==Number(rule.value)}
 if(op==='equals')return Array.isArray(value)?value.includes(rule.value):String(value)===rule.value;
 if(op==='not_equals')return Array.isArray(value)?!value.includes(rule.value):String(value)!==rule.value;
 if(['greater_than','greater_or_equal','less_than','less_or_equal'].includes(op)){if(Array.isArray(value)||typeof value==='boolean'||!rule.value.trim())return false;const a=Number(value),b=Number(rule.value);if(!Number.isFinite(a)||!Number.isFinite(b))return false;return op==='greater_than'?a>b:op==='greater_or_equal'?a>=b:op==='less_than'?a<b:a<=b}
 const text=Array.isArray(value)?undefined:String(value);
 if(op==='contains')return Array.isArray(value)?value.includes(rule.value):Boolean(text?.includes(rule.value));
 if(op==='not_contains')return Array.isArray(value)?!value.includes(rule.value):!text?.includes(rule.value);
 if(op==='starts_with')return Boolean(text?.startsWith(rule.value));if(op==='ends_with')return Boolean(text?.endsWith(rule.value));return false;
}
export function matchesConditions(field:Conditional,answers:Values,available?:Set<string>){const rules=conditionRules(field);if(!rules.length)return true;return field.conditions?.match==='any'?rules.some(r=>matchesRule(r,answers,available)):rules.every(r=>matchesRule(r,answers,available))}
export function removeConditionReference<T extends Conditional>(field:T,id:string):T{if(!conditionReferences(field).includes(id))return field;
 // Removing one clause can broaden an AND/OR rule. Keep its dependent block hidden until the author reviews it.
 return {...field,condition:undefined,conditions:undefined,conditionNeedsReview:true};
}
