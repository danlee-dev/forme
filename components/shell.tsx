'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useState,type ReactNode} from 'react';
import {LayoutGrid,Inbox,Layers,Plug,Plus,ArrowRight,Settings,BookOpen} from './icons';
import {useApp} from './provider';
import {NewForm} from './new-form';
export function BrandMark(){return <svg width="30" height="33" viewBox="0 0 32 34" fill="none" aria-hidden="true"><path d="M5 30V12C5 5.9 9.3 2 15.2 2H28V7H15.2C12.1 7 10 9 10 12V28C10 30.2 8.3 32 6.2 32H5V30Z" fill="currentColor"/><path d="M13 14H26V15C26 17.2 24.2 19 22 19H13V14Z" fill="currentColor"/></svg>}
export function Logo(){return <Link href="/" className="logo" aria-label="Forme 홈"><BrandMark/><span>forme</span></Link>}
const nav=[{href:'/',label:'내 폼',icon:LayoutGrid},{href:'/responses',label:'응답',icon:Inbox},{href:'/templates',label:'템플릿',icon:Layers},{href:'/integrations',label:'연동',icon:Plug}];
export function Shell({children}:{children:ReactNode}){
 const path=usePathname();const {user}=useApp();const [create,setCreate]=useState(false);
 useEffect(()=>{const fn=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();setCreate(true)}};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)},[]);
 return <div className="atelier-shell"><header className="atelier-header"><Logo/><nav className="atelier-nav" aria-label="주요 메뉴">{nav.map(({href,label,icon:Icon})=><Link key={href} href={href} aria-current={path===href?'page':undefined} className={path===href?'active':''}><Icon size={18}/><span>{label}</span></Link>)}</nav><div className="atelier-account">{!path.includes('/edit')&&<button className="header-create" aria-label="새 폼 만들기" title="새 폼 만들기 · ⌘K" onClick={()=>setCreate(true)}><Plus size={18}/><span>새 폼</span></button>}<Link href="/settings" className={'account-button '+(user?'signed-in':'')}><span>{user?user.email?.split('@')[0]:'로그인'}</span>{user?<Settings size={17}/>:<ArrowRight size={17}/>}</Link></div></header><div className="atelier-main">{children}</div><footer className="atelier-footer"><span>forme</span><Link href="/docs"><BookOpen size={15}/>사용 가이드</Link></footer>{create&&<NewForm onClose={()=>setCreate(false)}/>}</div>
}
