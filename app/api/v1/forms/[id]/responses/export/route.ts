import {identity,db,getOwned,apiError,rateLimit} from '@/lib/server';
import {csvStream,type ExportRow} from '@/lib/export';
import {resolveLocale} from '@/lib/i18n';
export const runtime='nodejs';
export const maxDuration=300;
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const user=await identity(req),id=(await params).id,form=await getOwned(id,user.id);
  await rateLimit('export:'+user.id,5,60);
  const snapshot=new Date().toISOString(),abort=new AbortController(),signal=AbortSignal.any([req.signal,abort.signal]);
  const client=db(),batchSize=1000;
  async function load(cursor?:ExportRow){let query=client.from('forme_submissions').select('id,created_at,answers,field_labels').eq('form_id',id).lte('created_at',snapshot).order('created_at',{ascending:true}).order('id',{ascending:true}).limit(batchSize);
   if(cursor)query=query.or('created_at.gt.'+cursor.created_at+',and(created_at.eq.'+cursor.created_at+',id.gt.'+cursor.id+')');
   const {data,error}=await query.abortSignal(signal);if(error)throw error;return data as ExportRow[];
  }
  const first=await load();
  async function* batches(){let rows=first;while(rows.length){yield rows;if(rows.length<batchSize)return;rows=await load(rows.at(-1))}}
  return new Response(csvStream(form,batches(),resolveLocale(undefined,req.headers.get('accept-language')||''),()=>abort.abort()),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="'+form.slug+'-responses.csv"','Cache-Control':'private, no-store','X-Export-Snapshot':snapshot}});
 }catch(error){return apiError(error,req)}
}
