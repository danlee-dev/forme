'use client';
import {useLocale} from './locale';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, ArrowUpRight, ArrowRight, ArrowUp, MoreHorizontal, LayoutGrid, List, Copy, Trash2, ExternalLink, FileText, Layers, LoaderCircle } from './icons';
import { useApp } from './provider';
import { NewForm, CreateShortcut } from './new-form';
import { Modal } from './ui';
import { GuestDrafts } from './guest-drafts';
import { nextForm, localizedTemplates, copyTemplate, blankForm } from '@/lib/templates';
import type { FormDocument } from '@/lib/schema';
function PaperPreview({ form }: {
    form: FormDocument;
}) { const { t: tr, locale, date: formatDate, count: formatCount } = useLocale(); return <div className="paper-preview" aria-hidden="true"><span className="paper-fold"/><b>{form.title}</b>{form.fields.filter(f => f.type !== 'section').slice(0, 3).map(f => <div key={f.id}><span>{f.label}</span><i /></div>)}</div>; }
export function Dashboard({ templatePage = false }: {
    templatePage?: boolean;
}) {
    const { t: tr, locale, date: formatDate, count: formatCount } = useLocale(); const templates=localizedTemplates(locale);
    const { forms, ready, user, save, remove, request, notice } = useApp();
    const router = useRouter();
    const [create, setCreate] = useState(false);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [layout, setLayout] = useState('grid');
    const [menu, setMenu] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<FormDocument | null>(null);
    const [prompt, setPrompt] = useState('');
    const [busy, setBusy] = useState(false);
    const [writing, setWriting] = useState(false);
    useEffect(() => { const saved = sessionStorage.getItem('forme:prompt'); if (saved) {
        setPrompt(saved);
        setWriting(true);
        sessionStorage.removeItem('forme:prompt');
    } }, []);
    const all = templatePage ? templates : forms;
    const list = useMemo(() => all.filter(f => (filter === 'all' || f.status === filter) && f.title.toLowerCase().includes(search.toLowerCase())), [all, filter, search]);
    useEffect(() => { if (!menu)
        return; const list = document.getElementById('actions-' + menu); list?.querySelector<HTMLElement>('button,a')?.focus(); const close = (e: KeyboardEvent) => { if (e.key === 'Escape') {
        setMenu(null);
        document.getElementById('trigger-' + menu)?.focus();
    } }; document.addEventListener('keydown', close); return () => document.removeEventListener('keydown', close); }, [menu]);
    async function duplicate(f: FormDocument) { try {
        const d = await save(copyTemplate(f));
        router.push('/forms/' + d.id + '/edit');
    }
    catch (e) {
        notice((e as Error).message);
    } }
    async function generate() { if (!user) {
        setCreate(true);
        return;
    } setBusy(true); try {
        const d = await request('/api/ai', { method: 'POST', body: JSON.stringify({ prompt, locale }) });
        const f = await save({ ...blankForm(locale), ...d.form });
        router.push('/forms/' + f.id + '/edit');
    }
    catch (e) {
        notice((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    async function createBlank() { setBusy(true); try {
        const f = await save(blankForm(locale));
        router.push('/forms/' + f.id + '/edit');
    }
    catch (e) {
        notice((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    return <><main className={'dashboard studio-home ' + (templatePage ? 'template-library' : '')} id="main-content">
 {!templatePage ? <><GuestDrafts /><div className="desk-heading"><div><h1>{tr("폼 작업실")}</h1><p>{user ? tr("좋은 질문을 만들고, 답변을 이어가세요.") : tr("브라우저에서 시작하고, 로그인하면 게시하세요.")}</p></div><button className="btn btn-dark desk-primary" onClick={() => void createBlank()} disabled={busy}><Plus size={20}/>{tr("새 폼 만들기")}</button></div><section className="creation-tray" aria-label={tr("폼 시작 방법")}><button onClick={() => void createBlank()} disabled={busy}><div className="tray-art blank-art"><span /><span /><span /></div><b>{tr("빈 페이지에서")}</b><p>{tr("직접 질문을 적어보세요")}</p><ArrowUpRight size={20}/></button><button aria-expanded={writing} onClick={() => setWriting(v => !v)}><div className="tray-art writing-art"><span>{tr("이름을 물어보고,")}</span><span>{tr("이야기를 들어볼까요")}</span><i /></div><b>{tr("설명으로 시작")}</b><p>{tr("원하는 폼을 말해주세요")}</p><ArrowUpRight size={20}/></button><Link href="/templates"><div className="tray-art template-art"><i /><i /><i /></div><b>{tr("준비된 틀에서")}</b><p>{tr("마음에 드는 폼을 골라보세요")}</p><ArrowUpRight size={20}/></Link></section>{writing && <section className="inline-creation"><h2>{tr("어떤 정보를 모을까요?")}</h2><div className="creation-composer"><textarea autoFocus value={prompt} onChange={e => setPrompt(e.target.value)} maxLength={3000} aria-label={tr("만들고 싶은 폼")} placeholder={tr("예: 독서 모임 참가자의 이름, 좋아하는 책과 참여 가능한 요일을 받고 싶어요.")} onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && prompt.trim().length >= 8)
        void generate(); }}/><div className="composer-toolbar"><span>{user ? tr("생성한 질문은 자유롭게 바꿀 수 있어요.") : tr("AI로 만들려면 로그인이 필요해요.")}</span><button className="btn btn-dark" disabled={busy || prompt.trim().length < 8} onClick={() => void generate()}>{busy ? <LoaderCircle className="spin" size={18}/> : null}{busy ? tr("질문을 정리하고 있어요") : tr("폼 만들기")}<ArrowRight size={17}/></button></div></div></section>}</> : <div className="library-heading"><h1>{tr("템플릿")}</h1><p>{tr("좋은 시작점을 골라, 당신의 폼으로.")}</p></div>}

 <section className="forms-library"><div className="library-top"><h2>{templatePage ? tr("모든 템플릿") : tr("내가 만든 폼")}<span>{templatePage ? templates.length : forms.length}</span></h2><div className="library-actions"><label className="search-field"><Search size={17}/><input aria-label={tr("폼 검색")} placeholder={tr("검색")} value={search} onChange={e => setSearch(e.target.value)}/></label><div className="view-toggle"><button aria-label={tr("카드 보기")} aria-pressed={layout === 'grid'} className={layout === 'grid' ? 'selected' : ''} onClick={() => setLayout('grid')}><LayoutGrid size={16}/></button><button aria-label={tr("목록 보기")} aria-pressed={layout === 'list'} className={layout === 'list' ? 'selected' : ''} onClick={() => setLayout('list')}><List size={17}/></button></div><button className="add-form-icon" aria-label={tr("새 폼 만들기")} onClick={() => setCreate(true)}><Plus size={20}/></button></div></div>
 {!templatePage && forms.length > 0 && <div className="quiet-tabs">{[['all', tr("전체")], ['published', tr("게시됨")], ['draft', tr("초안")], ['closed', tr("접수 중단")]].map(([id, label]) => <button key={id} className={filter === id ? 'selected' : ''} onClick={() => setFilter(id)}>{label}</button>)}</div>}
 {!ready && !templatePage ? <div className="rows-skeleton"><div /><div /><div /></div> : list.length === 0 ? <div className="quiet-empty"><FileText size={25}/><div><b>{search ? tr("검색 결과가 없어요.") : filter !== 'all' ? tr("이 상태의 폼이 없어요.") : tr("아직 만든 폼이 없어요.")}</b><p>{search ? tr("다른 이름으로 찾아보세요.") : tr("직접 만들거나, 위에 원하는 폼을 설명해보세요.")}</p></div><button className="text-btn" onClick={() => void createBlank()}>{tr("새 폼")}<Plus size={15}/></button></div> : <div className={'document-collection ' + (layout === 'grid' ? 'as-grid' : 'as-list')}>{list.map(f => <article className="document-item" key={f.id}><button className="document-open" onClick={() => f.isExample ? void duplicate(f) : router.push('/forms/' + f.id + '/edit')}><div className="document-thumbnail"><PaperPreview form={f}/></div><div className="document-info"><h3>{f.title}</h3><p>{formatCount(f.fields.filter(x => x.type !== 'section').length,'question')}<span>·</span>{f.isExample ? tr("템플릿") : new Date(f.updatedAt).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', { month: 'long', day: 'numeric' })}</p></div></button><div className="document-end"><span className="document-status">{f.isExample ? tr("사용하기") : f.status === 'draft' ? tr("초안") : f.status === 'published' ? tr("게시됨") : tr("접수 중단")}</span><button className="icon-btn" id={'trigger-' + f.id} aria-haspopup="menu" aria-label={f.title + tr(" 메뉴")} aria-expanded={menu === f.id} onClick={() => setMenu(menu === f.id ? null : f.id)}><MoreHorizontal size={19}/></button></div>{menu === f.id && <><div className="menu-dismiss" onClick={() => setMenu(null)}/><div className="dropdown" id={'actions-' + f.id} role="menu" onKeyDown={e => { if (!['ArrowDown', 'ArrowUp'].includes(e.key))
        return; e.preventDefault(); const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button,a')); const index = items.indexOf(document.activeElement as HTMLElement); items[(index + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus(); }}><button role="menuitem" onClick={() => { setMenu(null); void duplicate(f); }}><Copy size={15}/>{f.isExample ? tr("템플릿 사용") : tr("복제하기")}</button>{!f.isExample && f.status !== 'draft' && <Link role="menuitem" href={'/f/' + f.slug}><ExternalLink size={15}/>{tr("공개 폼 열기")}</Link>}{!f.isExample && <button role="menuitem" className="danger" onClick={() => { setMenu(null); setDeleting(f); }}><Trash2 size={15}/>{tr("삭제하기")}</button>}</div></>}</article>)}</div>}
 </section>{!templatePage && <section className="example-section"><div className="library-top"><h2>{tr("이렇게 만들 수 있어요")}</h2><Link href="/templates" className="text-btn">{tr("템플릿 보기")}<ArrowRight size={14}/></Link></div><Link className="example-document" href={locale==='en'?'/f/next-homecoming-en':'/f/next-homecoming'}><div className="example-preview"><PaperPreview form={templates[0]}/></div><div><span>{tr("행사 신청")}</span><h3>{tr("NEXT 홈커밍")}</h3><p>{tr("질문과 디자인, 응답 흐름을 살펴보세요.")}</p></div><ArrowUpRight size={19}/></Link></section>}</main>
 {create && <NewForm initialPrompt={prompt} onClose={() => setCreate(false)}/>}
 {deleting && <Modal title={tr("폼을 삭제할까요?")} onClose={() => setDeleting(null)}><p>{tr("폼과 모든 응답이 삭제되며 되돌릴 수 없습니다.")}</p><div className="modal-actions"><button className="btn" onClick={() => setDeleting(null)}>{tr("취소")}</button><button className="btn btn-danger" onClick={async () => { try {
        await remove(deleting.id);
        setDeleting(null);
        notice(tr("폼을 삭제했어요."));
    }
    catch (e) {
        notice((e as Error).message);
    } }}>{tr("삭제하기")}</button></div></Modal>}</>;
}
