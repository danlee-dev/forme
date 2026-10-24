'use client';
import Link from 'next/link';
import {useLocale} from '@/components/locale';
export default function NotFound(){const {locale}=useLocale();return <main className="standalone-empty" id="main-content"><h1>{locale==='en'?'This page isn’t here.':'페이지를 찾을 수 없어요.'}</h1><p>{locale==='en'?'Check the URL or head back to your workspace.':'주소를 확인하거나 워크스페이스에서 다시 시작하세요.'}</p><Link className="btn btn-dark" href="/">{locale==='en'?'Back to workspace':'워크스페이스로'}</Link></main>}
