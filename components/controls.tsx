'use client';
import {useLocale} from './locale';
import { readableInk } from '@/lib/color';
import * as Popover from '@radix-ui/react-popover';
import { Children, isValidElement, useId, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronDown, Search, QuestionIcon } from './icons';
type Option = {
    value: string;
    children: ReactNode;
    disabled?: boolean;
};
type Props = {
    valueLabel?:ReactNode;
    children: ReactNode;
    value?: string;
    onChange?: (e: {
        target: {
            value: string;
        };
    }) => void;
    className?: string;
    id?: string;
    disabled?: boolean;
    'aria-label'?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    'aria-required'?: boolean;
    onBlur?:()=>void;
};
export function Select({ children, value = '', onChange, className = '', onBlur, valueLabel, ...props }: Props) {
    const { t: tr, locale, date: formatDate, count: formatCount } = useLocale();
    const options = Children.toArray(children).filter(isValidElement<Option>).map(c => c.props);
    const [open, setOpen] = useState(false), [query, setQuery] = useState(''), [active, setActive] = useState(0);
    const [container, setContainer] = useState<HTMLElement | undefined>();
    const trigger = useRef<HTMLButtonElement>(null);
    const id = useId();
    const filtered = options.filter(o => !o.disabled && String(o.children).toLowerCase().includes(query.toLowerCase()));
    function pick(o: Option) { onChange?.({ target: { value: o.value } }); setOpen(false); }
    return <Popover.Root open={open} onOpenChange={v => { setContainer(trigger.current?.closest('dialog') || undefined); setOpen(v); setQuery(''); setActive(Math.max(0, options.findIndex(o => o.value === value))); }}>
 <Popover.Trigger ref={trigger} type="button" {...props} onBlur={()=>{if(!open)onBlur?.()}} className={'custom-select ' + className} aria-haspopup="listbox"><span>{valueLabel??(options.find(o => o.value === value)?.children || tr("선택해주세요"))}</span><ChevronDown size={15}/></Popover.Trigger>
 <Popover.Portal container={container}><Popover.Content className="select-popover" sideOffset={8} collisionPadding={12} align="start">
 <label className="select-search"><Search size={17}/><input autoFocus value={query} aria-label={(props['aria-label'] || tr("항목")) + ' ' + tr("검색")} role="combobox" aria-autocomplete="list" aria-expanded aria-controls={id} aria-activedescendant={filtered[active] ? id + '-' + active : undefined} placeholder={tr("검색하거나 선택하세요")} onChange={e => { setQuery(e.target.value); setActive(0); }} onKeyDown={e => { if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
        setActive(n => { const next = e.key === 'Home' ? 0 : e.key === 'End' ? filtered.length - 1 : Math.max(0, Math.min(filtered.length - 1, n + (e.key === 'ArrowDown' ? 1 : -1))); document.getElementById(id + '-' + next)?.scrollIntoView({ block: 'nearest' }); return next; });
    } if (e.key === 'Enter' && filtered[active]) {
        e.preventDefault();
        pick(filtered[active]);
    } if (e.key === 'Tab')
        setOpen(false); }}/></label>
 <div className="select-options" role="listbox" id={id} aria-label={props['aria-label'] || tr("항목 선택")}>{filtered.map((o, i) => <button type="button" role="option" aria-selected={value === o.value} id={id + '-' + i} key={o.value} tabIndex={-1} className={active === i ? 'highlighted' : ''} onMouseDown={e => e.preventDefault()} onMouseEnter={() => setActive(i)} onClick={() => pick(o)}><span className="select-option-label">{props['aria-label'] === tr("문항 유형") && <QuestionIcon type={o.value} size={19}/>}<span>{o.children}</span></span>{value === o.value && <Check size={16}/>}</button>)}{!filtered.length && <p className="select-no-results">{tr("일치하는 항목이 없어요.")}</p>}</div>
 </Popover.Content></Popover.Portal></Popover.Root>;
}
export function Color({ value, onChange, 'aria-label': label = '색상 선택' }: {
    value: string;
    onChange: (e: {
        target: {
            value: string;
        };
    }) => void;
    'aria-label'?: string;
    type?: string;
}) {
    const { t: tr, locale, date: formatDate, count: formatCount } = useLocale();
    const [hex, setHex] = useState(value);
    const [container, setContainer] = useState<HTMLElement | undefined>();
    const ref = useRef<HTMLButtonElement>(null);
    return <Popover.Root onOpenChange={() => { setHex(value); setContainer(ref.current?.closest('dialog') || undefined); }}><Popover.Trigger ref={ref} type="button" className="color-trigger" aria-label={tr(label)}><i style={{ background: value }}/><span>{value.toUpperCase()}</span></Popover.Trigger><Popover.Portal container={container}><Popover.Content className="select-popover color-popover" sideOffset={8} collisionPadding={12}><b>{tr("원하는 색상")}</b><div className="custom-palette">{['#242424', '#ffffff', '#f5f2eb', '#8b3043', '#3e6959', '#315e83', '#7465a0', '#dc5a46'].map(c => <button type="button" key={c} aria-label={c} aria-pressed={value === c} style={{ background: c }} onClick={() => { setHex(c); onChange({ target: { value: c } }); }}>{value === c && <Check size={17} style={{ color: readableInk(c) }}/>}</button>)}</div><label>HEX<input aria-label={tr("색상 코드")} value={hex} maxLength={7} onChange={e => { setHex(e.target.value); if (/^#[a-f0-9]{6}$/i.test(e.target.value))
        onChange({ target: { value: e.target.value } }); }}/></label><small>{tr("예: #242424")}</small></Popover.Content></Popover.Portal></Popover.Root>;
}
type TemporalProps = {onBlur?:()=>void;
    type: 'date' | 'time' | 'datetime-local';
    value: string;
    onChange: (e: {
        target: {
            value: string;
        };
    }) => void;
    id?: string;
    'aria-label'?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    'aria-required'?: boolean;
};
export function Temporal({ type, value, onChange, onBlur, ...props }: TemporalProps) {
    const { t: tr, locale, date: formatDate, count: formatCount } = useLocale();
    const ref = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);
    const [container, setContainer] = useState<HTMLElement | undefined>();
    const [month, setMonth] = useState(() => new Date().getMonth()), [year, setYear] = useState(() => new Date().getFullYear());
    const uid = useId();
    const date = value.split('T')[0];
    const time = type === 'time' ? value : value.split('T')[1] || '12:00';
    const [hour, minute] = time.split(':');
    const pad = (n: number) => String(n).padStart(2, '0');
    function changeDate(d: string) { onChange({ target: { value: type === 'datetime-local' ? d + 'T' + time : d } }); if (type === 'date')
        setOpen(false); }
    function changeTime(h: string, m: string) { onChange({ target: { value: type === 'datetime-local' ? (value ? date : year + '-' + pad(month + 1) + '-01') + 'T' + h + ':' + m : h + ':' + m } }); }
    function navigate(delta: number) { const d = new Date(year, month + delta, 1); setMonth(d.getMonth()); setYear(d.getFullYear()); }
    const cells = Array.from({ length: new Date(year, month, 1).getDay() }, (_, i) => <span key={'empty' + i}/>);
    for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day++) {
        const d = year + '-' + pad(month + 1) + '-' + pad(day);
        cells.push(<button type="button" key={d} id={uid + '-' + d} aria-label={d} aria-pressed={date === d} className={date === d ? 'selected' : ''} onClick={() => changeDate(d)} onKeyDown={e => { const delta = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 } as Record<string, number>)[e.key]; if (!delta)
            return; e.preventDefault(); const next = new Date(year, month, day + delta); setMonth(next.getMonth()); setYear(next.getFullYear()); const nextId = next.getFullYear() + '-' + pad(next.getMonth() + 1) + '-' + pad(next.getDate()); requestAnimationFrame(() => document.getElementById(uid + '-' + nextId)?.focus()); }}>{day}</button>);
    }
    return <Popover.Root open={open} onOpenChange={v => { setContainer(ref.current?.closest('dialog') || undefined); if (v && type !== 'time' && value) {
        const d = new Date(date + 'T12:00');
        if (!Number.isNaN(d.getTime())) {
            setYear(d.getFullYear());
            setMonth(d.getMonth());
        }
    } setOpen(v); }}>
 <Popover.Trigger type="button" ref={ref} {...props} onBlur={()=>{if(!open)onBlur?.()}} className="temporal-trigger"><span>{value ? type==='time'?value:formatDate(new Date(type==='date'?value+'T12:00':value),{year:'numeric',month:'short',day:'numeric',...(type==='datetime-local'?{hour:'numeric',minute:'2-digit'}:{})}) : type === 'time' ? tr("시간 선택") : type === 'date' ? tr("날짜 선택") : tr("날짜와 시간 선택")}</span><QuestionIcon type={type === 'time' ? 'time' : 'date'} size={18}/></Popover.Trigger>
 <Popover.Portal container={container}><Popover.Content className="select-popover calendar-popover" sideOffset={8} collisionPadding={12} align="start" aria-label={tr("날짜와 시간 선택")}>
 {type !== 'time' && <><div className="calendar-heading"><button type="button" aria-label={tr("이전 달")} onClick={() => navigate(-1)}>‹</button><Select aria-label={tr("연도")} value={String(year)} onChange={e => setYear(Number(e.target.value))}>{Array.from({ length: 201 }, (_, i) => year - 100 + i).map(y => <option key={y} value={String(y)}>{String(y)}</option>)}</Select><Select aria-label={tr("월")} value={String(month)} onChange={e => setMonth(Number(e.target.value))}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={String(i)}>{new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {month:'short'}).format(new Date(2024,i,1))}</option>)}</Select><button type="button" aria-label={tr("다음 달")} onClick={() => navigate(1)}>›</button></div><div className="calendar-weekdays" aria-hidden="true">{Array.from({length:7},(_,i)=>new Intl.DateTimeFormat(locale==='ko'?'ko-KR':'en-US',{weekday:'short'}).format(new Date(2024,0,7+i))).map(d => <span key={d}>{d}</span>)}</div><div className="calendar-grid">{cells}</div></>}
 {type !== 'date' && <div className="time-options"><QuestionIcon type="time" size={18}/><Select aria-label={tr("시")} value={hour || '12'} onChange={e => changeTime(e.target.value, minute || '00')}>{Array.from({ length: 24 }, (_, i) => <option key={i} value={pad(i)}>{pad(i) + (locale === 'ko' ? '시' : '')}</option>)}</Select><Select aria-label={tr("분")} value={minute || '00'} onChange={e => changeTime(hour || '12', e.target.value)}>{Array.from({ length: 60 }, (_, i) => <option key={i} value={pad(i)}>{pad(i) + (locale === 'ko' ? '분' : '')}</option>)}</Select></div>}
 <div className="calendar-footer"><button type="button" onClick={() => { onChange({ target: { value: '' } }); setOpen(false); }}>{tr("지우기")}</button><button type="button" onClick={() => { const today = new Date(); if (type === 'time')
        changeTime(pad(today.getHours()), pad(today.getMinutes()));
    else
        changeDate(today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate())); setOpen(false); }}>{type === 'time' ? tr("현재 시간") : tr("오늘")}</button><button type="button" className="calendar-done" onClick={() => { if (type === 'time' && !value)
        changeTime(hour || '12', minute || '00'); setOpen(false); }}>{tr("완료")}</button></div>
 </Popover.Content></Popover.Portal></Popover.Root>;
}
