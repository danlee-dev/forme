'use client';
import {useLocale} from './locale';
import { createContext, useCallback, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { type FormDocument, validateForm } from '@/lib/schema';
import { templates } from '@/lib/templates';
type AppState = {
    forms: FormDocument[];
    user: User | null;
    ready: boolean;
    notice: (text: string) => void;
    save: (form: FormDocument) => Promise<FormDocument>;
    remove: (id: string) => Promise<void>;
    request: (path: string, init?: RequestInit) => Promise<any>;
    refresh: () => Promise<void>;
    download:(path:string)=>Promise<Blob>;
};
const Context = createContext<AppState | null>(null);
export function Provider({ children }: {
    children: ReactNode;
}) {
    const { t: tr, locale, date: formatDate, count: formatCount } = useLocale();
    const generation = useRef(0);
    const [forms, setForms] = useState<FormDocument[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [ready, setReady] = useState(false);
    const [toast, setToast] = useState('');
    const notice = useCallback((text: string) => { setToast(text); }, []);
    useEffect(() => { if (!toast)
        return; const t = setTimeout(() => setToast(''), 5000); return () => clearTimeout(t); }, [toast]);
    const request = useCallback(async (path: string, init: RequestInit = {}) => { const session = (await supabase?.auth.getSession())?.data.session; if (!session)
        throw Error(tr("로그인 후 사용할 수 있어요.")); const r = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', 'Accept-Language': locale, Authorization: 'Bearer ' + session.access_token, ...init.headers } }); const data = await r.json(); if (!r.ok)
        throw Error(data.error || tr("요청을 처리하지 못했어요.")); return data; }, [locale,tr]);
    const download=useCallback(async(path:string)=>{const session=(await supabase?.auth.getSession())?.data.session;if(!session)throw Error(tr("로그인 후 사용할 수 있어요."));const response=await fetch(path,{headers:{Authorization:'Bearer '+session.access_token,'Accept-Language':locale}});if(!response.ok){const data=await response.json();throw Error(data.error||tr("요청을 처리하지 못했어요."))}return response.blob()},[locale,tr]);
    const refresh = useCallback(async () => { const data = await request('/api/v1/forms'); setForms(data.forms); }, [request]);
    useEffect(() => {
        let alive = true;
        async function load(u: User | null) { if (!alive)
            return; const run = ++generation.current; setUser(u); setReady(false); setForms([]); try {
            if (u) {
                const session = (await supabase!.auth.getSession()).data.session;
                const r = await fetch('/api/v1/forms', { headers: { Authorization: 'Bearer ' + session?.access_token } });
                if (!r.ok)
                    throw Error("폼을 불러오지 못했어요. 새로고침해주세요.");
                const d = await r.json();
                if (alive && run === generation.current)
                    setForms(d.forms);
            }
            else {
                const raw = localStorage.getItem('forme:guest');
                if (raw && alive && run === generation.current)
                    setForms(JSON.parse(raw).map((f: unknown) => validateForm(f)));
            }
        }
        catch (e) {
            notice(e instanceof Error ? e.message : tr("불러오기 실패"));
        }
        finally {
            if (alive && run === generation.current)
                setReady(true);
        } }
        supabase?.auth.getSession().then(({ data }) => load(data.session?.user ?? null));
        if (!supabase)
            void load(null);
        const listener = supabase?.auth.onAuthStateChange((_event, session) => { setTimeout(() => void load(session?.user ?? null), 0); });
        return () => { alive = false; listener?.data.subscription.unsubscribe(); };
    }, [notice]);
    const save = useCallback(async (input: FormDocument) => { let f = validateForm({ ...input, isExample: false, updatedAt: new Date().toISOString() }); if (user) {
        const d = await request('/api/v1/forms', { method: 'PUT', body: JSON.stringify({ form: f }) });
        f = d.form;
    } setForms(prev => { const next = [f, ...prev.filter(x => x.id !== f.id)]; if (!user)
        localStorage.setItem('forme:guest', JSON.stringify(next)); return next; }); return f; }, [user, request]);
    const remove = useCallback(async (id: string) => { if (user)
        await request('/api/v1/forms/' + id, { method: 'DELETE' }); setForms(prev => { const next = prev.filter(x => x.id !== id); if (!user)
        localStorage.setItem('forme:guest', JSON.stringify(next)); return next; }); }, [user, request]);
    return <Context.Provider value={{ forms, user, ready, notice, save, remove, request, download, refresh }}>{children}{toast && <div className="toast" role="status">{tr(toast)}<button aria-label={tr("알림 닫기")} onClick={() => setToast('')}>×</button></div>}</Context.Provider>;
}
export function useApp() { const c = useContext(Context); if (!c)
    throw Error('Provider missing'); return c; }
export function useExamples() { return templates; }
