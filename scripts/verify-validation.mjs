import {createClient} from '@supabase/supabase-js';
import {randomUUID,randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
let userId;let count=0;
async function req(path,token,method,body){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json','Accept-Language':'en',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()}}
function check(name,fn){fn();console.log('PASS',name);count++}
try{
 const email='forme-validation-'+randomUUID()+'@example.com',password=randomBytes(32).toString('hex');
 const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});if(error)throw error;userId=data.user.id;
 const anon=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false}});
 const login=await anon.auth.signInWithPassword({email,password});if(login.error)throw login.error;const token=login.data.session.access_token;
 const id=randomUUID(),stamp=new Date().toISOString(),slug='validate-'+id.slice(0,8);
 const field=(id,type,label,extra={})=>({id,type,label,description:'',placeholder:'',required:true,options:[],...extra});
 const form={id,slug,title:'Synthetic validation verification',description:'',emoji:'',fields:[field('phone','phone','Phone',{validation:{phoneCountry:'KR'}}),field('name','short_text','Name',{validation:{minLength:3,maxLength:10}}),field('page','page_break','Page',{required:false,navigation:{nextLabel:'Continue',backLabel:'Edit'}}),field('age','number','Age',{validation:{min:18,max:99,integer:true}}),field('topics','multi_select','Topics',{options:['A','B','C'],validation:{minChoices:2,maxChoices:2}})],theme:{accent:'#252525',background:'#ffffff',font:'sans',radius:'soft',cover:'none',layout:'pages',buttonLabel:'Send',nextButtonLabel:'Next page',buttonStyle:'outline',buttonAlign:'stretch',buttonSize:'large',fontSize:'large'},status:'draft',thankYouTitle:'Received',thankYouMessage:'Thank you',closesAt:null,responseLimit:null,createdAt:stamp,updatedAt:stamp,revision:0,isExample:false};
 let r=await req('/api/v1/forms',token,'PUT',{form});check('save new validation and page settings',()=>{assert.equal(r.status,200);assert.equal(r.data.form.fields[2].navigation.nextLabel,'Continue');assert.equal(r.data.form.theme.buttonAlign,'stretch')});
 r=await req('/api/v1/forms/'+id,token,'POST',{action:'publish'});check('publish paginated form',()=>assert.equal(r.status,200));
 const good={phone:'010-1234-5678',name:'Alex',age:25,topics:['A','B']};
 for(const [label,bad,key] of [['short phone',{phone:'01020494'},'phone'],['short name',{name:'Al'},'name'],['noninteger',{age:25.5},'age'],['out of range',{age:17},'age'],['not enough choices',{topics:['A']},'topics'],['too many choices',{topics:['A','B','C']},'topics']]){
  r=await req('/api/submit',null,'POST',{slug,answers:{...good,...bad},idempotencyKey:randomUUID()});check('server rejects '+label,()=>{assert.equal(r.status,400);assert.ok(r.data.errors[key]);assert.doesNotMatch(r.data.errors[key],/[가-힣]/)});
 }
 r=await req('/api/submit',null,'POST',{slug,answers:good,idempotencyKey:randomUUID()});check('valid final answers accepted',()=>assert.equal(r.status,200));
 r=await req('/api/v1/forms/'+id+'/responses',token,'GET');check('only valid response stored with canonical phone',()=>{assert.equal(r.data.total,1);assert.equal(r.data.responses[0].answers.phone,'+821012345678');assert.equal(r.data.responses[0].answers.age,25);assert.equal(r.data.responses[0].answers.page,undefined)});
 console.log('Verified '+count+' validation API boundaries.');
}finally{if(userId){const {error}=await admin.auth.admin.deleteUser(userId);if(error)throw Error('Synthetic account cleanup failed');console.log('Synthetic account and data removed.')}}
