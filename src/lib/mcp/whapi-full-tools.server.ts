import { z } from "zod";
import { WhapiError } from "@/lib/whapi.server";

const MANIFEST_URLS = [
  "https://raw.githubusercontent.com/Whapi-Cloud/whapi-mcp/main/B_manifest.json",
  "https://raw.githubusercontent.com/Whapi-Cloud/whapi-mcp/master/B_manifest.json",
];
const WHAPI_BASE = "https://gate.whapi.cloud";

type Primitive = string | number | boolean | null;
type S = { type?: string; description?: string; enum?: Primitive[]; properties?: Record<string,S>; items?: S; required?: string[] };
type T = { toolName:string; summary?:string|null; description?:string|null; inputSchema?:S; http:{method:string;path:string;pathParams?:{name:string}[];queryParams?:{name:string}[];requestBody?:{contentType?:string|null;schema?:S|null;fields?:{name:string;required?:boolean}[]};timeouts?:{requestMs?:number}} };
let cache: Promise<T[]> | null = null;

async function manifest() {
  if (!cache)
    cache = (async () => {
      for (const url of MANIFEST_URLS) {
        try {
          const r = await fetch(url, {
            headers: { Accept: "application/json" },
            cache: "force-cache",
            signal: AbortSignal.timeout(10000),
          });
          if (!r.ok) continue;
          const x = await r.json();
          if (Array.isArray(x) && x.length >= 100) return x as T[];
        } catch {
          // Try the next pinned provider location. Never fail MCP discovery for a remote 404.
        }
      }
      return [];
    })().catch((e) => {
      cache = null;
      throw e;
    });
  return cache;
}
function zs(s?:S):z.ZodTypeAny {
  if(!s) return z.any();
  let v:z.ZodTypeAny;
  if(s.enum?.length===1) v=z.literal(s.enum[0]);
  else if(s.enum&&s.enum.length>1){const [first,second,...rest]=s.enum.map(x=>z.literal(x));v=z.union([first,second,...rest])}
  else if(s.type==="string") v=z.string();
  else if(s.type==="integer") v=z.number().int();
  else if(s.type==="number") v=z.number();
  else if(s.type==="boolean") v=z.boolean();
  else if(s.type==="array") v=z.array(zs(s.items));
  else if(s.type==="object"){const sh:Record<string,z.ZodTypeAny>={};const req=new Set(s.required??[]);for(const [k,c] of Object.entries(s.properties??{})){const q=zs(c);sh[k]=req.has(k)?q:q.optional()}v=z.object(sh).passthrough()}
  else v=z.any();
  return s.description?v.describe(s.description):v;
}
function shape(s?:S){const sh:Record<string,z.ZodTypeAny>={};const req=new Set(s?.required??[]);for(const[k,c]of Object.entries(s?.properties??{})){const q=zs(c);sh[k]=req.has(k)?q:q.optional()}return sh}
function inputShape(t:T){const schema=t.http.requestBody?.schema??t.inputSchema;return shape(schema)}
function destructive(t:T){return t.http.method==="DELETE"||/delete|remove|leave|reject|reset|revoke|unsubscribe|demote|blacklist/i.test(t.toolName)}
async function run(t:T,args:Record<string,unknown>){
  const token=process.env.WHAPI_TOKEN;if(!token?.trim())throw new WhapiError("WHAPI_NOT_CONFIGURED",503);
  const pp=new Set((t.http.pathParams??[]).map(x=>x.name)), qp=new Set((t.http.queryParams??[]).map(x=>x.name));
  let path=t.http.path;
  for(const n of pp){const v=args[n];if(v==null)throw new WhapiError("MISSING_PATH_PARAM",400);path=path.replace(`{${n}}`,encodeURIComponent(String(v)))}
  const q=new URLSearchParams();for(const n of qp){const v=args[n];if(v==null)continue;if(Array.isArray(v))v.forEach(x=>q.append(n,String(x)));else q.set(n,String(v))}
  const body:Record<string,unknown>={};
  const bodyFields=new Set((t.http.requestBody?.fields??[]).map(x=>x.name));
  for(const[k,v]of Object.entries(args)){
    if(v===undefined||pp.has(k)||qp.has(k)||k==="confirmed")continue;
    if(bodyFields.size===0||bodyFields.has(k))body[k]=v;
  }
  for(const field of t.http.requestBody?.fields??[]){
    if(field.required&&body[field.name]===undefined)throw new WhapiError("MISSING_BODY_PARAM",400);
  }
  const method=t.http.method.toUpperCase(), hasBody=!["GET","HEAD"].includes(method)&&Object.keys(body).length>0;
  const headers:Record<string,string>={Authorization:`Bearer ${token}`,Accept:"application/json"};if(hasBody)headers["Content-Type"]=t.http.requestBody?.contentType||"application/json";
  const r=await fetch(`${WHAPI_BASE}${path}${q.size?`?${q}`:""}`,{method,headers,body:hasBody?JSON.stringify(body):undefined,redirect:"error",cache:"no-store",signal:AbortSignal.timeout(Math.min(t.http.timeouts?.requestMs??30000,30000))});
  const raw=await r.text();let data:unknown=raw;try{data=raw?JSON.parse(raw):null}catch{}
  if(!r.ok){
    let providerMessage:string|null=null;
    if(data&&typeof data==="object"&&!Array.isArray(data)){
      const rec=data as Record<string,unknown>;
      const err=rec.error&&typeof rec.error==="object"&&!Array.isArray(rec.error)?rec.error as Record<string,unknown>:null;
      providerMessage=typeof rec.message==="string"?rec.message.slice(0,240):err&&typeof err.message==="string"?err.message.slice(0,240):null;
    }
    console.warn("[WHAPI_DYNAMIC_TOOL_ERROR]",{tool:t.toolName,path:t.http.path,status:r.status,providerMessage});
    throw new WhapiError(`WHAPI_${t.toolName.toUpperCase()}_${r.status}`,r.status===429?429:502);
  }
  return data;
}
export async function registerFullWhapiTools(instance:any,readSec:unknown,writeSec:unknown){
  const list=await manifest();
  for(const t of list){
    // Original media retrieval is exposed as the fixed whapi_get_media_image tool.
    // Do not register the generic getMedia action because its binary response is
    // serialized as text by this dynamic adapter and competes with image discovery.
    if(t.toolName==="getMedia") continue;
    const ro=["GET","HEAD"].includes(t.http.method),d=destructive(t),sh=inputShape(t);if(d)sh.confirmed=z.literal(true).describe("Explicit confirmation required.");
    instance.registerTool(t.toolName,{title:t.summary||t.toolName,description:`${d?"[DESTRUCTIVE] ":""}${t.description||`${t.http.method} ${t.http.path}`}`,inputSchema:z.object(sh).passthrough(),annotations:{readOnlyHint:ro,destructiveHint:d,idempotentHint:ro,openWorldHint:true},_meta:{securitySchemes:ro?readSec:writeSec}},async(args:Record<string,unknown>)=>{try{const data=await run(t,args);return{structuredContent:{data},content:[{type:"text" as const,text:JSON.stringify(data)}]}}catch(e){return{isError:true,content:[{type:"text" as const,text:e instanceof Error?e.message:"WHAPI_TOOL_FAILED"}]}}});
  }
  return list.length;
}
