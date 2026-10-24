'use client';
import {type Theme} from '@/lib/schema';
import {useLocale} from './locale';
import {Select} from './controls';
export function FormAppearance({theme,onChange}:{theme:Theme;onChange:(patch:Partial<Theme>)=>void}){
 const {locale}=useLocale(),en=locale==='en';
 return <section className="appearance-controls"><h3>{en?'Readability & navigation':'가독성과 이동 버튼'}</h3>
 <label className="control-label">{en?'Text size':'글자 크기'}<Select value={theme.fontSize||'large'} onChange={e=>onChange({fontSize:e.target.value as Theme['fontSize']})}><option value="standard">{en?'Standard · 17–18 px':'기본 · 17–18 px'}</option><option value="large">{en?'Large · 18–20 px':'크게 · 18–20 px'}</option></Select></label>
 <div className="control-columns"><label className="control-label">{en?'Next button label':'다음 버튼 문구'}<input maxLength={60} value={theme.nextButtonLabel||''} placeholder={en?'Next':'다음'} onChange={e=>onChange({nextButtonLabel:e.target.value||undefined})}/></label><label className="control-label">{en?'Back button label':'이전 버튼 문구'}<input maxLength={60} value={theme.backButtonLabel||''} placeholder={en?'Back':'이전'} onChange={e=>onChange({backButtonLabel:e.target.value||undefined})}/></label></div>
 <div className="control-columns"><label className="control-label">{en?'Button style':'버튼 스타일'}<Select value={theme.buttonStyle||'solid'} onChange={e=>onChange({buttonStyle:e.target.value as Theme['buttonStyle']})}><option value="solid">{en?'Filled':'채우기'}</option><option value="outline">{en?'Outline':'테두리'}</option></Select></label><label className="control-label">{en?'Button size':'버튼 크기'}<Select value={theme.buttonSize||'comfortable'} onChange={e=>onChange({buttonSize:e.target.value as Theme['buttonSize']})}><option value="comfortable">{en?'Comfortable':'편안하게'}</option><option value="large">{en?'Large':'크게'}</option></Select></label></div>
 <label className="control-label">{en?'Button alignment':'버튼 배치'}<Select value={theme.buttonAlign||'left'} onChange={e=>onChange({buttonAlign:e.target.value as Theme['buttonAlign']})}><option value="left">{en?'Left':'왼쪽'}</option><option value="center">{en?'Center':'가운데'}</option><option value="stretch">{en?'Full width':'가로 채우기'}</option></Select></label>
 <p>{en?'Each page break can override its Next and Back labels. Submit text is set above.':'페이지 나누기에서 해당 위치의 다음·이전 문구를 개별 설정할 수 있습니다. 제출 문구는 위에서 설정하세요.'}</p>
 </section>
}
