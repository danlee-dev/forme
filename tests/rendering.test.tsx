import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {LocaleProvider} from '../components/locale';
import {FormRenderer} from '../components/form-renderer';
import {localizedTemplates,nextForm} from '../lib/templates';
test('English respondent example renders English chrome and content from a Korean workspace',()=>{const html=renderToStaticMarkup(<LocaleProvider initialLocale="ko"><FormRenderer form={localizedTemplates('en')[0]}/></LocaleProvider>);assert.match(html,/lang="en"/);assert.match(html,/Together again, NEXT/);assert.match(html,/This is a preview example/);assert.doesNotMatch(html,/[가-힣]/)});
test('Korean owner content remains intact when the workspace language is English',()=>{const html=renderToStaticMarkup(<LocaleProvider initialLocale="en"><FormRenderer form={nextForm}/></LocaleProvider>);assert.match(html,/lang="ko"/);assert.match(html,/다시 만나, NEXT/);assert.match(html,/운영 검토용 예시입니다/)});

import {AppRouterContext,type AppRouterInstance} from 'next/dist/shared/lib/app-router-context.shared-runtime';
import {PathnameContext} from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import {Provider} from '../components/provider';
import {Shell} from '../components/shell';
import {Dashboard} from '../components/dashboard';
import {Account} from '../components/account';
import {Integrations} from '../components/integrations';
import {Responses} from '../components/responses';
import {NewForm} from '../components/new-form';
import type {ReactNode} from 'react';
const router:AppRouterInstance={bfcacheId:"test",back(){},forward(){},refresh(){},push(){},replace(){},prefetch(){}};
function renderWorkspace(children:ReactNode,path='/'){return renderToStaticMarkup(<LocaleProvider initialLocale="en"><AppRouterContext.Provider value={router}><PathnameContext.Provider value={path}><Provider>{children}</Provider></PathnameContext.Provider></AppRouterContext.Provider></LocaleProvider>)}
test('English workspace renders translated navigation and creation actions',()=>{const html=renderWorkspace(<Shell><Dashboard/></Shell>);assert.match(html,/Your workspace/);assert.match(html,/Integrations/);assert.match(html,/Sign in/);assert.match(html,/From scratch/);assert.doesNotMatch(html.replaceAll('Language / 언어',''),/[가-힣]/)});
test('English account, integrations, responses and creation dialog contain no untranslated Korean UI',()=>{for(const content of [<Account key="account"/>,<Integrations key="integrations"/>,<Responses key="responses"/>,<NewForm key="create" onClose={()=>{}}/>]){const html=renderWorkspace(content);assert.doesNotMatch(html,/[가-힣]/)}});
