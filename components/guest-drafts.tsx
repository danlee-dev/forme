'use client';
import {useEffect,useState} from 'react';
import {useApp} from './provider';
import {validateForm} from '@/lib/schema';
import {copyTemplate} from '@/lib/templates';
import {Import,LoaderCircle} from './icons';
import {supabase} from '@/lib/supabase';
export function GuestDrafts(){const {user,save,notice}=useApp();const [count,setCount]=useState(0);const [busy,setBusy]=useState(false);
 useEffect(()=>{try{setCount(JSON.parse(localStorage.getItem('forme:guest')||'[]').length)}catch{setCount(0)}},[user?.id]);
 if(!user||!count)return null;
 return <section className="guest-import"><div><b>이 브라우저에 초안 {count}개가 있어요.</b><p>현재 계정으로 가져와서 이어서 편집하고 게시하세요.</p></div><button className="btn" disabled={busy} onClick={async()=>{setBusy(true);let imported=0;try{let drafts=JSON.parse(localStorage.getItem('forme:guest')||'[]');for(const raw of [...drafts]){const auth=await supabase?.auth.getUser();if(auth?.data.user?.id!==user.id)throw Error('계정이 변경되어 가져오기를 중단했어요.');const form=validateForm(raw);await save(copyTemplate(form));drafts=drafts.filter((f:{id:string})=>f.id!==form.id);localStorage.setItem('forme:guest',JSON.stringify(drafts));setCount(drafts.length);imported++;}localStorage.removeItem('forme:guest');notice(imported+'개 초안을 계정에 가져왔어요.');}catch(e){notice((e as Error).message||'가져오지 못한 초안은 브라우저에 보관됩니다.')}finally{setBusy(false)}}}>{busy?<LoaderCircle size={16} className="spin"/>:<Import size={16}/>}초안 가져오기</button></section>
}
