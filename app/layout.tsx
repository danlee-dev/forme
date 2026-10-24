import type {Metadata} from 'next';
import {Provider} from '@/components/provider';
import './globals.css';
import './atelier.css';
export const metadata:Metadata={title:{default:'Forme — 작은 질문, 새로운 연결',template:'%s · Forme'},description:'질문에서 시작되는 좋은 연결. 당신답게 만드는 폼, Forme.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ko" data-scroll-behavior="smooth"><body><a className="skip-link" href="#main-content">본문으로 건너뛰기</a><Provider>{children}</Provider></body></html>}
