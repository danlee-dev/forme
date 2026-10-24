#!/usr/bin/env node
import {Server} from '@modelcontextprotocol/sdk/server/index.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {ListToolsRequestSchema,CallToolRequestSchema} from '@modelcontextprotocol/sdk/types.js';
const endpoint=process.env.FORME_URL;
const key=process.env.FORME_API_KEY;
if(!endpoint||!key){console.error('Set FORME_URL and FORME_API_KEY. Create a key in Forme → Integrations.');process.exit(1);}
const url=new URL('/api/mcp',endpoint);
if(url.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(url.hostname))throw Error('HTTPS required');
const client=new Client({name:'forme-bridge',version:'0.1.0'});
await client.connect(new StreamableHTTPClientTransport(url,{requestInit:{headers:{Authorization:'Bearer '+key}}}));
const server=new Server({name:'forme',version:'0.1.0'},{capabilities:{tools:{}}});
server.setRequestHandler(ListToolsRequestSchema,()=>client.listTools());
server.setRequestHandler(CallToolRequestSchema,async r=>client.callTool(r.params));
await server.connect(new StdioServerTransport());
process.on('SIGINT',async()=>{await client.close();await server.close();process.exit(0)});
