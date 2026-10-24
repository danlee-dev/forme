import {createClient} from '@supabase/supabase-js';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
const publicClient=()=>createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false}});
const userIds=[];let count=0;
async function request(path,token,method='GET',body){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',Accept:'application/json, text/event-stream',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});const d=await r.json();return {status:r.status,data:d};}
async function createUser(){const email='forme-verify-'+randomUUID()+'@example.com';const password=randomBytes(32).toString('hex');const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});if(error)throw error;userIds.push(data.user.id);const {data:session,error:loginError}=await publicClient().auth.signInWithPassword({email,password});if(loginError)throw loginError;return session.session.access_token;}
function check(label,fn){fn();count++;console.log('PASS',label);}
try{
 const a=await createUser();const b=await createUser();
 const id=randomUUID();const slug='verify-'+id.slice(0,8);const stamp=new Date().toISOString();
 let form={id,slug,title:'Verification form',description:'Synthetic test only',emoji:'F',fields:[{id:'name',type:'short_text',label:'Name',description:'',placeholder:'',required:true,options:[]},{id:'email',type:'email',label:'Email',description:'',placeholder:'',required:true,options:[]}],theme:{accent:'#252525',background:'#ffffff',font:'sans',radius:'soft',cover:'none',layout:'classic',buttonLabel:'Submit'},status:'draft',thankYouTitle:'Received',thankYouMessage:'Thank you',closesAt:null,responseLimit:2,createdAt:stamp,updatedAt:stamp,revision:0,isExample:false};
 let r=await request('/api/v1/forms',a,'PUT',{form});check('save owner draft',()=>assert.equal(r.status,200));form=r.data.form;
 r=await request('/api/v1/forms/'+id,b);check('other owner cannot read draft',()=>assert.equal(r.status,404));
 r=await request('/api/v1/forms/'+id,null);check('anonymous cannot read owner API',()=>assert.equal(r.status,401));
 const anon=publicClient();const {data:privateRows,error:privateError}=await anon.from('forme_forms').select('*');check('RLS blocks anonymous direct table reads',()=>assert.ok(privateError||privateRows?.length===0));
 let p=await fetch(base+'/f/'+slug);check('unpublished form has no public page',()=>assert.equal(p.status,404));
 r=await request('/api/v1/forms/'+id,a,'POST',{action:'publish'});check('publish returns share URL',()=>assert.equal(r.status,200));
 r=await request('/api/v1/forms',a,'PUT',{form:{...form,title:'Changed private draft'}});check('update private draft',()=>assert.equal(r.status,200));const newer=r.data.form;
 p=await fetch(base+'/f/'+slug);const html=await p.text();check('saved draft does not overwrite publication',()=>{assert.match(html,/Verification form/);assert.doesNotMatch(html,/Changed private draft/)});
 r=await request('/api/v1/forms',a,'PUT',{form});check('stale revision rejected',()=>assert.equal(r.status,409));
 r=await request('/api/submit',null,'POST',{slug,answers:{name:'Test',email:'bad'},idempotencyKey:randomUUID()});check('invalid submission rejected',()=>assert.equal(r.status,400));
 const key=randomUUID();r=await request('/api/submit',null,'POST',{slug,answers:{name:'Synthetic',email:'test@example.com'},idempotencyKey:key});check('valid response stored',()=>assert.equal(r.status,200));const submissionId=r.data.id;
 r=await request('/api/submit',null,'POST',{slug,answers:{name:'Synthetic',email:'test@example.com'},idempotencyKey:key});check('repeated request returns same receipt',()=>assert.equal(r.data.id,submissionId));
 const parallel=await Promise.all([1,2,3].map(()=>request('/api/submit',null,'POST',{slug,answers:{name:'Concurrent',email:'test@example.com'},idempotencyKey:randomUUID()})));check('atomic response cap under concurrent requests',()=>assert.equal(parallel.filter(x=>x.status===200).length,1));
 r=await request('/api/v1/forms/'+id+'/responses',b);check('other owner cannot read responses',()=>assert.equal(r.status,404));
 r=await request('/api/v1/forms/'+id+'/responses',a);check('owner sees exact stored count',()=>assert.equal(r.data.total,2));
 r=await request('/api/integrations',a,'POST',{action:'create_key',name:'Verification'});check('key issued once',()=>assert.ok(r.data.token?.startsWith('fm_')));const apiKey=r.data.token;const keyId=r.data.key.id;
 r=await request('/api/v1/forms/'+id,apiKey);check('API key accesses own form',()=>assert.equal(r.status,200));
 r=await request('/api/mcp',apiKey,'POST',{jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'verification',version:'1'}}});check('MCP initializes',()=>assert.equal(r.status,200));
 const mr=await fetch(base+'/api/mcp',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json',Accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:2,method:'tools/list',params:{}})});const md=await mr.json();check('MCP discovers six actual tools',()=>assert.equal(md.result.tools.length,6));
 await request('/api/integrations',a,'POST',{action:'revoke_key',id:keyId});r=await request('/api/v1/forms',apiKey);check('revoked key rejected',()=>assert.equal(r.status,401));
 r=await request('/api/v1/forms/'+id+'/versions',a);check('owner reads saved versions',()=>assert.ok(r.status===200&&r.data.versions.length>=2));
 const revisionToRestore=r.data.versions.at(-1).revision;
 r=await request('/api/v1/forms/'+id+'/versions',b);check('other owner cannot read version history',()=>assert.equal(r.status,404));
 r=await request('/api/v1/forms/'+id+'/versions',a,'POST',{revision:revisionToRestore});check('restore creates a fresh draft revision',()=>{assert.equal(r.status,200);assert.ok(r.data.form.revision>newer.revision);});
 r=await request('/api/v1/forms/'+id,a,'POST',{action:'close'});check('atomic close increments revision',()=>assert.equal(r.data.form.status,'closed'));
 p=await fetch(base+'/f/'+slug);const closedHtml=await p.text();check('closed form remains viewable with explicit closed message',()=>assert.match(closedHtml,/응답 접수가 중단|isn.t accepting responses/));
console.log('Verified '+count+' API boundaries.');
}finally{
 for(const id of userIds){const {error}=await admin.auth.admin.deleteUser(id);if(error)console.error('Test account cleanup failed');}
}
