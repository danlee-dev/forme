import {createClient} from '@supabase/supabase-js';
import {randomUUID,randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
const email='forme-ai-'+randomUUID()+'@example.com',password=randomBytes(32).toString('hex');let id;
try{
 const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});if(error)throw error;id=data.user.id;
 const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false}});
 const auth=await client.auth.signInWithPassword({email,password});
 const headers={'Content-Type':'application/json',Authorization:'Bearer '+auth.data.session.access_token};
 const r=await fetch(base+'/api/ai',{method:'POST',headers,body:JSON.stringify({prompt:'이름과 이메일, 좋아하는 책을 묻는 간단한 독서 모임 신청 폼을 만들어줘. 날짜와 장소는 미정이야.'})});
 const d=await r.json();assert.equal(r.status,200,JSON.stringify(d));assert.ok(d.form.fields.length>=3);console.log('PASS actual AI generates structured Korean form ('+d.form.fields.length+' fields)');
 const stamp=new Date().toISOString();const form={id:randomUUID(),slug:'verify-'+randomUUID().slice(0,8),title:d.form.title,description:d.form.description,emoji:d.form.emoji,fields:d.form.fields,theme:d.form.theme,status:'draft',thankYouTitle:'Thanks',thankYouMessage:'',closesAt:null,responseLimit:null,createdAt:stamp,updatedAt:stamp,revision:0,isExample:false};
 const save=await fetch(base+'/api/v1/forms',{method:'PUT',headers,body:JSON.stringify({form})});assert.equal(save.status,200);console.log('PASS generated form passes real server validation and persists');
 const review=await fetch(base+'/api/ai',{method:'POST',headers,body:JSON.stringify({intent:'review',form})});const result=await review.json();assert.equal(review.status,200,JSON.stringify(result));assert.ok(typeof result.review.summary==='string');console.log('PASS actual AI reviews existing questions ('+result.review.suggestions.length+' suggestions)');
}finally{if(id)await admin.auth.admin.deleteUser(id)}
