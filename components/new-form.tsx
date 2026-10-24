'use client';
import {useLocale} from './locale';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Sparkles, ArrowUpRight, ArrowRight, LoaderCircle } from './icons';
import { Modal } from './ui';
import { useApp } from './provider';
import { validateForm } from '@/lib/schema';
import { blankForm, copyTemplate, localizedTemplates } from '@/lib/templates';
export function NewForm({ onClose, initialPrompt = '' }: {
    onClose: () => void;
    initialPrompt?: string;
}) { const { t: tr, locale, date: formatDate, count: formatCount } = useLocale(); const templates=localizedTemplates(locale); const [prompt, setPrompt] = useState(initialPrompt); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const { save, request, user, notice } = useApp(); const router = useRouter(); async function create(kind: string, index = 0) { setBusy(true); setError(''); try {
    let form = kind === 'blank' ? blankForm(locale) : copyTemplate(templates[index]);
    if (kind === 'ai') {
        const d = await request('/api/ai', { method: 'POST', body: JSON.stringify({ prompt, locale }) });
        form = { ...blankForm(locale), ...d.form };
    }
    form = await save(form);
    notice(user ? tr("새 폼을 만들었어요.") : tr("이 브라우저에 초안을 만들었어요. 게시하려면 로그인해주세요."));
    onClose();
    router.push('/forms/' + form.id + '/edit');
}
catch (e) {
    setError(e instanceof Error ? e.message : tr("생성에 실패했어요."));
}
finally {
    setBusy(false);
} } return <Modal title={tr("어떤 이야기를 시작할까요?")} onClose={onClose}><p className="muted">{tr("빈 페이지에서, 혹은 작은 도움을 받아 시작해보세요.")}</p><button className="blank-start" disabled={busy} onClick={() => create('blank')}><span><Plus size={22}/></span><div><b>{tr("빈 폼으로 시작")}</b><small>{tr("나만의 질문을 하나씩 채워보세요.")}</small></div><ArrowUpRight size={19}/></button><div className="ai-box"><div className="eyebrow"><Sparkles size={15}/>FORME AI</div><h3>{tr("아이디어를 적으면, 폼이 됩니다.")}</h3><textarea aria-label={tr("AI 폼 생성 요청")} placeholder={tr("예: 독서 모임 신청 폼. 이름, 연락처, 좋아하는 책과 참여 가능한 요일을 물어봐줘.")} value={prompt} onChange={e => setPrompt(e.target.value)} maxLength={3000}/><div className="ai-box-bottom"><span>{tr("생성 후 모든 질문을 수정할 수 있어요.")}</span><button className="btn btn-dark" disabled={busy || !user || prompt.trim().length < 8} onClick={() => create('ai')}>{busy ? <LoaderCircle className="spin" size={16}/> : <Sparkles size={16}/>}{tr("AI로 만들기")}</button></div>{!user && <Link className="ai-login-link" href="/settings" onClick={() => { sessionStorage.setItem('forme:prompt', prompt); onClose(); }}>{tr("로그인하고 AI로 만들기")}<ArrowRight size={15}/></Link>}</div>{error && <p className="error-banner" role="alert">{tr(error)}</p>}<label className="json-import-button"><input type="file" accept="application/json,.json" disabled={busy} onChange={async (e) => { const file = e.target.files?.[0]; if (!file)
    return; if (file.size > 150000) {
    setError(tr("폼 파일은 150KB 이하만 가져올 수 있어요."));
    return;
} setBusy(true); try {
    const imported = validateForm(JSON.parse(await file.text()));
    const f = await save(copyTemplate(imported));
    onClose();
    router.push('/forms/' + f.id + '/edit');
}
catch {
    setError(tr("Forme에서 내보낸 올바른 JSON 파일인지 확인해주세요."));
}
finally {
    setBusy(false);
} }}/>{tr("Forme JSON 파일 가져오기")}<ArrowUpRight size={14}/></label><div className="section-label">{tr("템플릿으로 빠르게 시작하기")}</div><div className="template-quick">{templates.map((t, i) => <button key={t.id} disabled={busy} onClick={() => create('template', i)}><span>{t.emoji}</span><b>{[tr("행사 신청"), tr("제품 피드백"), tr("문의 & 연락")][i]}</b><ArrowRight size={15}/></button>)}</div></Modal>; }
export function CreateShortcut({ onOpen }: {
    onOpen: () => void;
}) { const { t: tr, locale, date: formatDate, count: formatCount } = useLocale(); useEffect(() => { const handler = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    onOpen();
} }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }, [onOpen]); return null; }
