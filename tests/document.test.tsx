import './dom-environment';
import test from 'node:test';
import assert from 'node:assert/strict';
import {act,useState} from 'react';
import {AddBlock} from '../components/block-picker';
import {createRoot,type Root} from 'react-dom/client';
import {LocaleProvider} from '../components/locale';
import {DocumentBlock} from '../components/document-block';
import {field,blankForm} from '../lib/templates';
import {insertBlock,reorderBlock,normalizeDraft} from '../lib/document';
import type {Field} from '../lib/schema';

test('block reordering preserves IDs, supports append, and rejects broken conditional order',()=>{
 const fields=[field('a','select','A',{options:['yes','no']}),field('b','short_text','B',{condition:{fieldId:'a',value:'yes'}}),field('c','email','C')];
 const before=JSON.stringify(fields);
 assert.equal(reorderBlock(fields,'b','a'),null);
 assert.deepEqual(reorderBlock(fields,'c','a')?.map(f=>f.id),['c','a','b']);
 assert.deepEqual(reorderBlock(fields,'a',null),null);
 assert.deepEqual(reorderBlock(fields,'c',null)?.map(f=>f.id),['a','b','c']);
 assert.equal(reorderBlock(fields,'missing','a'),null);
 assert.equal(JSON.stringify(fields),before);
});
test('insertion is anchored, does not mutate the source, and respects the 60 block limit',()=>{
 const fields=[field('a','short_text','A'),field('b','short_text','B')],fresh=field('c','date','C');
 assert.deepEqual(insertBlock(fields,fresh,'a')?.map(f=>f.id),['a','c','b']);
 assert.equal(fields.length,2);assert.equal(insertBlock(fields,fresh,'missing'),null);
 assert.equal(insertBlock(Array.from({length:60},(_,i)=>field(String(i),'short_text','Q')),fresh,null),null);
});

let root:Root;
async function setup(f:Field){
 const container=document.getElementById('test-root')!;const insertions:string[]=[];const changes:Partial<Field>[]=[];const drops:string[][]=[];
 root=createRoot(container);
 await act(async()=>{root.render(<LocaleProvider initialLocale="en"><DocumentBlock field={f} fields={[f]} index={0} selected autoFocus onActivate={()=>{}} onChange={patch=>changes.push(patch)} onInsert={type=>insertions.push(type)} onDuplicate={()=>{}} onRemove={()=>{}} onMove={()=>{}} onDropBlock={(source,target)=>drops.push([source,target])}/></LocaleProvider>)});
 return {container,insertions,changes,drops,title:container.querySelector<HTMLTextAreaElement>('.block-question')!};
}
async function cleanup(){await act(async()=>{root.unmount()})}

test('Enter inserts a question; Shift+Enter and IME composition do not create accidental blocks',async()=>{
 const {title,insertions}=await setup(field('name','short_text','Name'));
 try{await act(async()=>{title.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,isComposing:true}));title.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,shiftKey:true}))});assert.deepEqual(insertions,[]);
 await act(async()=>{title.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))});assert.deepEqual(insertions,['short_text']);}
 finally{await cleanup()}
});
test('slash opens a searchable block menu, Enter converts the selected question',async()=>{
 const {title,changes}=await setup(field('name','short_text','Name'));
 try{
 title.setSelectionRange(0,title.value.length);
 await act(async()=>{title.dispatchEvent(new KeyboardEvent('keydown',{key:'/',bubbles:true}))});
 const search=document.querySelector<HTMLInputElement>('[aria-label="Search blocks"]');assert.ok(search);
 await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(search,'email');search.dispatchEvent(new Event('input',{bubbles:true}))});
 assert.equal(document.querySelectorAll('[role="option"]').length,1);
 await act(async()=>{search.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))});
 assert.equal(changes.at(-1)?.type,'email');
 }finally{await cleanup()}
});
test('slash in the middle of a question remains ordinary punctuation',async()=>{
 const {title}=await setup(field('name','short_text','What is a/b?'));
 try{title.setSelectionRange(5,5);await act(async()=>{title.dispatchEvent(new KeyboardEvent('keydown',{key:'/',bubbles:true}))});assert.equal(document.querySelector('[aria-label="Search blocks"]'),null)}
 finally{await cleanup()}
});
test('Enter on a choice inserts an option directly after that choice',async()=>{
 const {container,changes}=await setup(field('choice','select','Choose',{options:['A','B']}));
 try{const input=container.querySelector<HTMLInputElement>('#option-choice-0')!;await act(async()=>{input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))});assert.deepEqual(changes.at(-1)?.options,['A','Option 3','B'])}
 finally{await cleanup()}
});
test('Escape dismisses slash search and returns focus without changing the question',async()=>{
 const {title,changes}=await setup(field('name','short_text','Name'));
 try{title.setSelectionRange(0,title.value.length);await act(async()=>{title.dispatchEvent(new KeyboardEvent('keydown',{key:'/',bubbles:true}))});const search=document.querySelector<HTMLInputElement>('[aria-label="Search blocks"]')!;assert.ok(search);await act(async()=>{search.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await new Promise(resolve=>setTimeout(resolve,15))});assert.equal(document.querySelector('[aria-label="Search blocks"]'),null);assert.deepEqual(changes,[]);assert.equal(document.activeElement,title)}
 finally{await cleanup()}
});
test('drop handler forwards the source and target block identifiers',async()=>{
 const {container,drops}=await setup(field('target','short_text','Target'));
 try{const event=new Event('drop',{bubbles:true,cancelable:true});Object.defineProperty(event,'dataTransfer',{value:{getData:()=> 'source',types:['application/x-forme-block']}});await act(async()=>{container.querySelector('.document-block')!.dispatchEvent(event)});assert.deepEqual(drops,[['source','target']])}
 finally{await cleanup()}
});

test('unfinished blank blocks remain recoverable without mutating filled content',()=>{const form=blankForm('en');form.title=' ';form.fields=[field('empty','short_text',''),field('filled','long_text','Keep my wording',{description:'My description'})];const normalized=normalizeDraft(form,'en');assert.equal(normalized.title,'Untitled form');assert.equal(normalized.fields[0].label,'New question');assert.equal(normalized.fields[1],form.fields[1]);assert.equal(form.fields[0].label,'');assert.equal(normalizeDraft(form,'ko').fields[0].label,'새 질문')});

test('inserting from the footer leaves typing focus in the new block',async()=>{
 function Harness(){const [fields,setFields]=useState<Field[]>([]);return <LocaleProvider initialLocale="en">{fields.map((f,i)=><DocumentBlock key={f.id} field={f} fields={fields} index={i} selected autoFocus onActivate={()=>{}} onChange={()=>{}} onInsert={()=>{}} onDuplicate={()=>{}} onRemove={()=>{}} onMove={()=>{}} onDropBlock={()=>{}}/>)}<div className="document-tail"><AddBlock onSelect={type=>setFields([field('new',type,'New question')])}/></div></LocaleProvider>}
 const container=document.getElementById('test-root')!;root=createRoot(container);
 try{await act(async()=>{root.render(<Harness/>)});await act(async()=>{container.querySelector<HTMLButtonElement>('.document-tail button')!.click()});const search=document.querySelector<HTMLInputElement>('[aria-label="Search blocks"]')!;await act(async()=>{search.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await new Promise(resolve=>setTimeout(resolve,20))});assert.equal(document.activeElement,container.querySelector('.block-question'));}
 finally{await cleanup()}
});
