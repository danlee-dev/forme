import {cookies,headers} from 'next/headers';
import {LocaleProvider,SkipLink} from '@/components/locale';
import {resolveLocale} from '@/lib/i18n';
import type {Metadata} from 'next';
import {Provider} from '@/components/provider';
import './globals.css';
import './atelier.css';
export const metadata:Metadata={title:{default:'Forme — A space for better questions',template:'%s · Forme'},description:'Create thoughtful forms. Make them yours. Connect your workflow.'};
export default async function RootLayout({children}:{children:React.ReactNode}){const locale=resolveLocale((await cookies()).get('forme_locale')?.value,(await headers()).get('accept-language')||'');return <html lang={locale} data-scroll-behavior="smooth"><body><LocaleProvider initialLocale={locale}><SkipLink/><Provider>{children}</Provider></LocaleProvider></body></html>}
