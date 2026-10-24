import {Shell} from '@/components/shell';
import {Editor} from '@/components/editor';
export default async function Edit({params}:{params:Promise<{id:string}>}){return <Shell><Editor id={(await params).id}/></Shell>}
