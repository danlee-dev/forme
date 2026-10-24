'use client';
import {useLocale} from './locale';
import { Select, Color, Temporal } from './controls';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { readableInk } from '@/lib/color';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Copy, Eye, Globe, Check, LoaderCircle, Palette, SlidersHorizontal, Monitor, Smartphone, Undo2, Redo2, ExternalLink, SquarePen } from './icons';
import { useApp } from './provider';
import { Modal, Cover, Empty } from './ui';
import { type FormDocument, type Field, validateForm } from '@/lib/schema';
import { DocumentBlock,DocumentText } from './document-block';
import { AddBlock } from './block-picker';
import {insertBlock,reorderBlock,choiceTypes,normalizeDraft} from '@/lib/document';
import { field as makeField } from '@/lib/templates';
import { FormRenderer } from './form-renderer';
import { inspectForm } from '@/lib/quality';
export function Editor({ id }: {
    id: string;
}) {
    const { t: tr, locale, date: formatDate, count: formatCount } = useLocale();
    const router = useRouter();
    const { forms, ready, save, request, notice, user, refresh } = useApp();
    const [form, setForm] = useState<FormDocument | null>(null);
    const [tab, setTab] = useState('questions');
    const [active, setActive] = useState<string | null>(null);
    const [focusId,setFocusId]=useState<string|null>(null);const [focusVersion,setFocusVersion]=useState(0);
    const [preview, setPreview] = useState(false);
    const [mobile, setMobile] = useState(false);
    const [busy, setBusy] = useState(false);
    const [saved, setSaved] = useState('');
    const [recovery, setRecovery] = useState<FormDocument | null>(null);
    const [share, setShare] = useState('');
    const [versions, setVersions] = useState<{
        revision: number;
        created_at: string;
        document: FormDocument;
    }[] | null>(null);
    const [quality, setQuality] = useState(false);
    const [aiReview, setAiReview] = useState<{
        summary: string;
        suggestions: {
            fieldId: string;
            label: string;
            description: string;
            required: boolean;
            reason: string;
        }[];
    } | null>(null);
    const [reviewing, setReviewing] = useState(false);
    const history = useRef<FormDocument[]>([]);
    const future = useRef<FormDocument[]>([]);
    const initialized = useRef(false);
    const initialFocus=useRef(false);
    const recoveryKey = 'forme:recovery:' + (user?.id || 'guest') + ':' + id;
    useEffect(() => { if (!ready || initialized.current)
        return; const f = forms.find(f => f.id === id); if (!f)
        return; setForm(f); setSaved(JSON.stringify(f)); initialized.current = true; try {
        const raw = localStorage.getItem(recoveryKey);
        if (raw) {
            const d = validateForm(JSON.parse(raw));
            if (JSON.stringify(d) !== JSON.stringify(f))
                setRecovery(d);
        }
    }
    catch { /* ignore invalid local backup */ } }, [ready, forms, id, recoveryKey]);
    useEffect(()=>{if(!form||initialFocus.current)return;initialFocus.current=true;if(['Untitled form','제목 없는 폼'].includes(form.title))requestAnimationFrame(()=>{const el=document.getElementById('form-title') as HTMLTextAreaElement|null;el?.focus();el?.select()})},[form]);
    const dirty = Boolean(form && JSON.stringify(form) !== saved);
    useEffect(() => { if (!form || !dirty)
        return; const timer = setTimeout(() => { try {
        localStorage.setItem(recoveryKey, JSON.stringify(normalizeDraft(form,locale)));
    }
    catch {
        notice(tr("브라우저 복구본을 저장하지 못했어요. 저장 버튼을 눌러주세요."));
    } }, 500); const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); }; window.addEventListener('beforeunload', handler); return () => { clearTimeout(timer); window.removeEventListener('beforeunload', handler); }; }, [form, dirty, recoveryKey, notice]);
    function edit(patch: Partial<FormDocument>) { if (!form)
        return; history.current = [...history.current.slice(-29), form]; future.current = []; setForm({ ...form, ...patch }); }
    function updateField(id: string, patch: Partial<Field>) { if (form)
        edit({ fields: form.fields.map(f => f.id === id ? { ...f, ...patch } : f) }); }
    function move(index: number, delta: number) { if (!form)
        return; const fields = [...form.fields]; const other = index + delta; if (other < 0 || other >= fields.length)
        return; [fields[index], fields[other]] = [fields[other], fields[index]]; const ids = fields.map(f => f.id); if (fields.some((f, i) => f.condition && ids.indexOf(f.condition.fieldId) >= i)) {
        notice(tr("조건부 문항은 참조하는 문항 뒤에 있어야 해요."));
        return;
    } edit({ fields }); }
    function focusBlock(nextId:string|null){setActive(nextId);setFocusId(nextId);setFocusVersion(v=>v+1)}
    function addBlock(type:Field['type'],afterId:string|null=null){if(!form)return;const f=makeField(crypto.randomUUID(),type,type==='section'?(locale==='en'?'New section':'새 섹션'):(locale==='en'?'New question':'새 질문'),{options:choiceTypes.has(type)?[locale==='en'?'Option 1':'선택지 1',locale==='en'?'Option 2':'선택지 2']:[]});const next=insertBlock(form.fields,f,afterId);if(!next){notice(locale==='en'?'A form can have up to 60 blocks.':'한 폼에는 블록을 60개까지 추가할 수 있어요.');return}edit({fields:next});focusBlock(f.id)}
    function duplicateBlock(f:Field){if(!form)return;const copy={...structuredClone(f),id:crypto.randomUUID()};const next=insertBlock(form.fields,copy,f.id);if(!next){notice(locale==='en'?'A form can have up to 60 blocks.':'한 폼에는 블록을 60개까지 추가할 수 있어요.');return}edit({fields:next});focusBlock(copy.id)}
    function dropBlock(sourceId:string,targetId:string|null){if(!form)return;const next=reorderBlock(form.fields,sourceId,targetId);if(!next){notice(tr('조건부 문항은 참조하는 문항 뒤에 있어야 해요.'));return}if(next!==form.fields)edit({fields:next})}
    function removeField(id: string) { if (!form)
        return; const index=form.fields.findIndex(f=>f.id===id);const target=form.fields[index-1]||form.fields[index+1];edit({ fields: form.fields.filter(f => f.id !== id).map(f => f.condition?.fieldId === id ? { ...f, condition: undefined } : f) }); focusBlock(target?.id||null); }
    async function persist() { if (!form)
        return null; setBusy(true); try {
        const result = await save(normalizeDraft(form,locale));
        setForm(result);
        setSaved(JSON.stringify(result));
        localStorage.removeItem(recoveryKey);
        notice(user ? tr("클라우드에 저장했어요.") : tr("이 브라우저에 저장했어요."));
        return result;
    }
    catch (e) {
        notice((e as Error).message);
        return null;
    }
    finally {
        setBusy(false);
    } }
    useEffect(()=>{const handler=(event:KeyboardEvent)=>{if(!form||event.isComposing||!(event.metaKey||event.ctrlKey)||!(event.target instanceof HTMLElement)||!event.target.closest('.editor'))return;const key=event.key.toLowerCase();if(key==='s'){event.preventDefault();if(!busy)void persist()}if(key==='z'){event.preventDefault();const stack=event.shiftKey?future.current:history.current;const snapshot=stack.pop();if(snapshot){(event.shiftKey?history.current:future.current).push(form);setForm({...snapshot,revision:form.revision,status:form.status,updatedAt:form.updatedAt})}}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler)},[form,busy,persist]);
    async function publish() { if (!user) {
        const local = await persist();
        if (local) {
            notice(tr("초안을 저장했어요. 로그인 후 브라우저 초안을 가져오면 게시할 수 있어요."));
            router.push('/settings');
        }
        return;
    } const result = await persist(); if (!result)
        return; setBusy(true); try {
        const d = await request('/api/v1/forms/' + id, { method: 'POST', body: JSON.stringify({ action: 'publish' }) });
        setForm(d.form);
        setSaved(JSON.stringify(d.form));
        setShare(d.url);
        await refresh();
        notice(tr("폼을 게시했어요."));
    }
    catch (e) {
        notice((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    if (!ready)
        return <main className="editor-loading">{tr("편집기를 준비하고 있어요…")}</main>;
    if (!form)
        return <Empty title={tr("폼을 찾을 수 없어요")} description={tr("이 폼이 저장된 계정으로 로그인하거나 워크스페이스에서 다시 열어주세요.")}><Link className="btn btn-dark" href="/">{tr("워크스페이스로")}</Link></Empty>;
    return <main id="main-content" className="editor"><div className="editor-toolbar"><Link href="/" className="icon-btn" aria-label={tr("워크스페이스로")}><ArrowLeft size={19}/></Link><div className="editor-title"><span>{form.emoji}</span><b>{form.title}</b><span className="status status-draft">{form.status === 'draft' ? tr("초안") : form.status === 'published' ? tr("게시됨") : tr("접수 중단")}</span></div><span className="save-state">{busy ? <><LoaderCircle size={13} className="spin"/>{tr("저장 중")}</> : dirty ? tr("변경사항 · 브라우저 복구본 저장") : <><Check size={13}/>{user ? tr("클라우드 저장됨") : tr("브라우저 저장됨")}</>}</span><div className="editor-toolbar-actions"><button className="btn quality-button" onClick={() => setQuality(true)}>{tr("폼 점검")}</button><button className="btn" onClick={() => setPreview(true)}><Eye size={16}/><span>{tr("미리보기")}</span></button><button className="btn" disabled={busy} onClick={() => void persist()}>{tr("저장")}</button><button className="btn btn-dark" disabled={busy} onClick={() => void publish()}><Globe size={15}/>{tr("게시하기")}</button></div></div>{recovery && <div className="recovery-banner"><span>{tr("이 브라우저에 저장하지 않은 작업이 남아 있어요.")}</span><button onClick={() => { setForm({ ...recovery, revision: form.revision }); setRecovery(null); }}>{tr("복구하기")}</button><button onClick={() => { setRecovery(null); localStorage.removeItem(recoveryKey); }}>{tr("무시")}</button></div>}<div className="editor-tabs"><button className={tab === 'questions' ? 'selected' : ''} onClick={() => setTab('questions')}><SquarePen size={16}/>{tr("문항")}</button><button className={tab === 'design' ? 'selected' : ''} onClick={() => setTab('design')}><Palette size={16}/>{tr("디자인")}</button><button className={tab === 'settings' ? 'selected' : ''} onClick={() => setTab('settings')}><SlidersHorizontal size={16}/>{tr("설정")}</button><div className="editor-tab-spacer"/><button aria-label={tr("실행 취소")} disabled={!history.current.length} onClick={() => { const prev = history.current.pop(); if (prev) {
        future.current.push(form);
        setForm({...prev,revision:form.revision,status:form.status,updatedAt:form.updatedAt});
    } }}><Undo2 size={16}/></button><button aria-label={tr("다시 실행")} disabled={!future.current.length} onClick={() => { const next = future.current.pop(); if (next) {
        history.current.push(form);
        setForm({...next,revision:form.revision,status:form.status,updatedAt:form.updatedAt});
    } }}><Redo2 size={16}/></button><Link href={'/responses?form=' + id}>{tr("응답 보기")}<ArrowUp size={14} style={{ transform: 'rotate(45deg)' }}/></Link></div><div className="editor-layout"><div className="editor-canvas" style={{ '--canvas-bg': form.theme.background } as CSSProperties}>{tab === 'questions' ? <div className={'edit-sheet font-' + form.theme.font}>{form.theme.cover !== 'none' && <Cover kind={form.theme.cover}/>}<div className="edit-sheet-inner">{form.emoji&&<input className="emoji-edit" value={form.emoji} aria-label={tr("폼 아이콘")} maxLength={16} onChange={e => edit({ emoji: e.target.value })}/>}<DocumentText id="form-title" className={'document-title title-'+locale+' typeface-'+form.theme.font} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing&&e.keyCode!==229){e.preventDefault();if(form.fields[0]){focusBlock(form.fields[0].id)}else addBlock('short_text')}}} label={tr("폼 제목")} value={form.title} placeholder={locale==='en'?'Untitled form':'제목 없는 폼'} maxLength={160} onChange={title=>edit({title})}/><textarea className="document-intro" aria-label={tr("폼 설명")} value={form.description} placeholder={tr("소개 문구를 적어주세요.")} rows={Math.min(12, Math.max(2, form.description.split('\n').length))} maxLength={3000} onChange={e => edit({ description: e.target.value })}/>{form.fields.map((f,i)=><DocumentBlock key={f.id} field={f} index={i} fields={form.fields} selected={active===f.id} autoFocus={focusId===f.id} focusVersion={focusId===f.id?focusVersion:0} onActivate={()=>setActive(f.id)} onChange={patch=>updateField(f.id,patch)} onInsert={type=>addBlock(type,f.id)} onDuplicate={()=>duplicateBlock(f)} onRemove={()=>removeField(f.id)} onMove={delta=>move(i,delta)} onDropBlock={dropBlock}/>)}<div className="document-tail" onDragOver={e=>{if(Array.from(e.dataTransfer.types).includes('application/x-forme-block'))e.preventDefault()}} onDrop={e=>{const source=e.dataTransfer.getData('application/x-forme-block');if(source){e.preventDefault();dropBlock(source,null)}}}><AddBlock onSelect={type=>addBlock(type)}/><span className="document-writing-hint">{locale==='en'?'Enter for a new question · / for blocks':'Enter로 다음 질문 · / 로 블록 선택'}</span></div><div className="fake-submit" style={{ background: form.theme.accent, color: readableInk(form.theme.accent) }}>{form.theme.buttonLabel} <ArrowRight size={17}/></div></div></div> : tab === 'design' ? <div className="settings-sheet"><div className="eyebrow">MAKE IT YOURS</div><h2>{tr("디자인")}</h2><p className="muted">{tr("서체와 색, 페이지의 구성을 바꿔보세요.")}</p><label className="control-label">{tr("폼 아이콘")}<input aria-label={tr("폼 아이콘")} value={form.emoji} placeholder={locale==='en'?'An emoji or a short symbol':'이모지 또는 짧은 기호'} maxLength={16} onChange={e=>edit({emoji:e.target.value})}/></label><label className="control-label">{tr("포인트 컬러")}</label><div className="color-swatches">{['#dc5a46', '#8b3043', '#3e6959', '#7465a0', '#315e83', '#272727'].map(c => <button key={c} aria-label={c} aria-pressed={form.theme.accent === c} style={{ background: c }} onClick={() => edit({ theme: { ...form.theme, accent: c } })}>{form.theme.accent === c && <Check size={17}/>}</button>)}<Color aria-label={tr("커스텀 포인트 컬러")} type="color" value={form.theme.accent} onChange={e => edit({ theme: { ...form.theme, accent: e.target.value } })}/></div><label className="control-label">{tr("페이지 배경")}<Color type="color" value={form.theme.background} onChange={e => edit({ theme: { ...form.theme, background: e.target.value } })}/></label><label className="control-label">{tr("커버 스타일")}</label><div className="cover-picker">{['peach', 'sage', 'lavender', 'ink', 'none'].map(c => <button key={c} aria-label={c + tr(" 커버")} aria-pressed={form.theme.cover === c} className={form.theme.cover === c ? 'selected' : ''} onClick={() => edit({ theme: { ...form.theme, cover: c as FormDocument['theme']['cover'] } })}><Cover compact kind={c}/><span>{({ peach: tr("살구빛"), sage: tr("초록 정원"), lavender: tr("라벤더"), ink: tr("미드나잇"), none: tr("커버 없음") } as Record<string, string>)[c]}</span></button>)}</div><div className="control-columns"><label className="control-label">{tr("서체")}<Select value={form.theme.font} onChange={e => edit({ theme: { ...form.theme, font: e.target.value as 'sans' | 'serif' } })}><option value="sans">{tr("깔끔한 고딕")}</option><option value="serif">{tr("차분한 명조")}</option></Select></label><label className="control-label">{tr("모서리")}<Select value={form.theme.radius} onChange={e => edit({ theme: { ...form.theme, radius: e.target.value as FormDocument['theme']['radius'] } })}><option value="soft">{tr("부드럽게")}</option><option value="round">{tr("둥글게")}</option><option value="square">{tr("반듯하게")}</option></Select></label></div><label className="control-label">{locale==='en'?'Form language':'폼 언어'}<Select aria-label={locale==='en'?'Form language':'폼 언어'} value={form.theme.language||'auto'} onChange={e=>edit({theme:{...form.theme,language:e.target.value as 'auto'|'en'|'ko'}})}><option value="auto">{locale==='en'?'Match respondent’s browser':'응답자 브라우저 언어'}</option><option value="en">English</option><option value="ko">한국어</option></Select></label><label className="control-label">{tr("진행 방식")}<Select value={form.theme.layout} onChange={e => edit({ theme: { ...form.theme, layout: e.target.value as 'classic' | 'step' } })}><option value="classic">{tr("한 페이지에 모든 질문")}</option><option value="step">{tr("한 번에 한 질문씩")}</option></Select></label><label className="control-label">{tr("제출 버튼 문구")}<input value={form.theme.buttonLabel} maxLength={60} onChange={e => edit({ theme: { ...form.theme, buttonLabel: e.target.value } })}/></label><button className="btn btn-dark" onClick={() => setPreview(true)}><Eye size={16}/>{tr("디자인 미리보기")}</button></div> : <div className="settings-sheet"><div className="eyebrow">THE FINISHING TOUCHES</div><h2>{tr("폼 설정")}</h2><label className="control-label">{tr("공유 주소")}<span className="input-prefix">/f/<input value={form.slug} maxLength={80} onChange={e => edit({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}/></span></label><p className="tiny muted">{tr("게시 후 주소를 바꾸면 기존 링크가 작동하지 않습니다.")}</p><label className="control-label">{tr("응답 마감 (선택)")}<Temporal type="datetime-local" value={form.closesAt ? new Date(Date.parse(form.closesAt) - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={e => edit({ closesAt: e.target.value ? new Date(e.target.value).toISOString() : null })}/></label><label className="control-label">{tr("최대 응답 수 (선택)")}<input type="number" min={1} max={1000000} placeholder={tr("제한 없음")} value={form.responseLimit ?? ''} onChange={e => edit({ responseLimit: e.target.value ? Number(e.target.value) : null })}/></label><div className="settings-space"/><h3>{tr("제출 완료 화면")}</h3><label className="control-label">{tr("제목")}<input value={form.thankYouTitle} maxLength={200} onChange={e => edit({ thankYouTitle: e.target.value })}/></label><label className="control-label">{tr("메시지")}<textarea value={form.thankYouMessage} maxLength={1000} onChange={e => edit({ thankYouMessage: e.target.value })}/></label><div className="settings-space"/><h3>{tr("저장 기록")}</h3><p className="muted">{tr("최근 50개 저장 버전을 보관합니다. 복구한 내용은 다시 게시하기 전까지 공개 폼에 반영되지 않아요.")}</p><button className="btn" disabled={!user} onClick={async () => { try {
        const d = await request('/api/v1/forms/' + id + '/versions');
        setVersions(d.versions);
    }
    catch (e) {
        notice((e as Error).message);
    } }}>{tr("버전 기록 보기")}</button><div className="settings-space"/><h3>{tr("폼 파일")}</h3><button className="btn" onClick={() => { const url = URL.createObjectURL(new Blob([JSON.stringify(form, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = form.slug + '.forme.json'; a.click(); URL.revokeObjectURL(url); }}>{tr("폼 JSON 내보내기")}</button><div className="settings-space"/><h3>{tr("응답 접수 관리")}</h3><p className="muted">{tr("접수를 중단해도 기존 응답은 보관됩니다.")}</p><button className="btn" disabled={!user || form.status === 'draft' || busy} onClick={async () => { setBusy(true); try {
        const d = await request('/api/v1/forms/' + id, { method: 'POST', body: JSON.stringify({ action: 'close' }) });
        setForm(d.form);
        setSaved(JSON.stringify(d.form));
        await refresh();
        notice(tr("응답 접수를 중단했어요."));
    }
    catch (e) {
        notice((e as Error).message);
    }
    finally {
        setBusy(false);
    } }}>{tr("접수 중단하기")}</button><p className="tiny muted">{tr("다시 게시하면 응답 접수가 열립니다. Google Sheets는 연동 메뉴에서 설정하세요.")}</p></div>}</div></div>{preview && <Modal title={tr("응답자 미리보기")} onClose={() => setPreview(false)} wide><div className="preview-tools"><button className={mobile ? '' : 'selected'} aria-label={tr("데스크톱 미리보기")} onClick={() => setMobile(false)}><Monitor size={18}/></button><button className={mobile ? 'selected' : ''} aria-label={tr("모바일 미리보기")} onClick={() => setMobile(true)}><Smartphone size={18}/></button><span>{tr("이 화면의 응답은 저장되지 않아요.")}</span></div><div className={'preview-frame ' + (mobile ? 'mobile' : '')}><FormRenderer key={JSON.stringify(form.theme)} form={form} preview/></div></Modal>}{versions && <Modal title={tr("저장 기록")} onClose={() => setVersions(null)}><p className="muted">{tr("복구하면 현재 초안이 선택한 버전으로 바뀝니다.")}</p><div className="version-list">{versions.map(v => <div key={v.revision}><span><b>{tr("버전")}{v.revision}</b><small>{new Date(v.created_at).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US')}</small></span><button className="btn" disabled={busy || v.revision === form.revision} onClick={async () => { setBusy(true); try {
        const d = await request('/api/v1/forms/' + id + '/versions', { method: 'POST', body: JSON.stringify({ revision: v.revision }) });
        setForm(d.form);
        setSaved(JSON.stringify(d.form));
        await refresh();
        setVersions(null);
        notice(tr("선택한 버전을 초안으로 복구했어요."));
    }
    catch (e) {
        notice((e as Error).message);
    }
    finally {
        setBusy(false);
    } }}>{tr("복구")}</button></div>)}</div></Modal>}{quality && <Modal title={tr("공유 전, 한 번 더 확인해요.")} onClose={() => setQuality(false)}><p className="muted">{tr("문항 구조와 작성 상태를 살펴보는 자동 점검입니다.")}</p><div className="review-ai-control"><button className="btn" disabled={!user || reviewing} onClick={async () => { setReviewing(true); try {
        const d = await request('/api/ai', { method: 'POST', body: JSON.stringify({ intent: 'review', form, locale }) });
        setAiReview({ ...d.review, suggestions: d.review.suggestions.filter((s: {
                fieldId: string;
            }) => form.fields.some(f => f.id === s.fieldId)) });
    }
    catch (e) {
        notice((e as Error).message);
    }
    finally {
        setReviewing(false);
    } }}>{reviewing ? <LoaderCircle size={16} className="spin"/> : null}{tr("AI로 문항 검토")}</button><small>{tr("질문의 명확성·응답 부담·개인정보 수집을 검토합니다.")}</small></div>{aiReview && <div className="ai-review-results"><p>{aiReview.summary}</p>{aiReview.suggestions.filter(s => form.fields.some(f => f.id === s.fieldId)).map((s, i) => <div className="quality-issue" key={i}><span>{form.fields.find(f => f.id === s.fieldId)?.label}</span><h3>{s.label}</h3><p>{s.reason}</p><button className="text-btn" onClick={() => { updateField(s.fieldId, { label: s.label, description: s.description, required: s.required }); setAiReview({ ...aiReview, suggestions: aiReview.suggestions.filter((_, n) => n !== i) }); notice(tr("제안을 초안에 적용했어요.")); }}>{tr("이 제안 적용 →")}</button></div>)}</div>}{inspectForm(form).length ? inspectForm(form).map((issue, i) => <div className="quality-issue" key={i}><span>{issue.level === 'warning' ? tr("확인 필요") : tr("제안")}</span><p>{tr(issue.message)}</p>{issue.fieldId && <button className="text-btn" onClick={() => { setQuality(false); setTab('questions'); setActive(issue.fieldId!); setTimeout(() => document.getElementById('edit-' + issue.fieldId)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0); }}>{tr("질문으로 이동 →")}</button>}</div>) : <div className="empty"><Check size={28}/><h3>{tr("구조상 발견된 문제가 없어요.")}</h3><p>{tr("실제 응답 흐름과 개인정보 안내는 직접 확인해주세요.")}</p></div>}</Modal>}{share && <Modal title={tr("당신의 폼이 준비됐어요.")} onClose={() => setShare('')}><div className="share-illustration">↗</div><p className="muted">{tr("이 링크를 통해 누구나 응답을 보낼 수 있어요.")}</p><div className="copy-row"><input readOnly value={share} aria-label={tr("공유 링크")}/><button className="btn btn-dark" onClick={() => navigator.clipboard.writeText(share).then(() => notice(tr("링크를 복사했어요."))).catch(() => notice(tr("주소를 선택해 직접 복사해주세요.")))}><Copy size={15}/>{tr("복사")}</button></div><a href={share} className="btn" target="_blank" rel="noreferrer">{tr("공개 폼 열기")}<ExternalLink size={15}/></a></Modal>}</main>;
}
