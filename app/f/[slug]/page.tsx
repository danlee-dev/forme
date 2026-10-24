import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {FormRenderer} from '@/components/form-renderer';
import {nextForm} from '@/lib/templates';
import {db} from '@/lib/server';
import {validateForm} from '@/lib/schema';
export const dynamic='force-dynamic';
async function load(slug:string){if(slug==='next-homecoming')return nextForm;const {data,error}=await db().from('forme_publications').select('document,accepting').eq('slug',slug).maybeSingle();if(error||!data)return null;return validateForm({...data.document,status:data.accepting?'published':'closed'});}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const form=await load((await params).slug);return {title:form?.title||'폼을 찾을 수 없어요',description:form?.description.slice(0,160),robots:{index:false,follow:false}}}
export default async function PublicForm({params}:{params:Promise<{slug:string}>}){const form=await load((await params).slug);if(!form)notFound();return <FormRenderer form={form}/>}
