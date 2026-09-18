import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { readWhapi } from "@/lib/whapi.server";
import { verifyAccessToken, AUDIENCE } from "./whatsapp-oauth.server";

const META=`${AUDIENCE.replace("/api/mcp/whatsapp","")}/.well-known/oauth-protected-resource/api/mcp/whatsapp`;
const annotations={readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:true};
function bearer(request:Request){
 const m=/^Bearer (.+)$/.exec(request.headers.get("authorization")||"");
 if(!m) return null;
 try{return verifyAccessToken(m[1]);}catch{return null;}
}
function server(){
 const s=new McpServer({name:"indexes-whatsapp",version:"1.0.0"},{instructions:"Private read-only WhatsApp access for the Indexes Store administrator. Never send, delete, publish or mutate."});
 const add=(name:string,resource:"chats"|"groups"|"channels"|"products")=>s.registerTool(name,{
  description:`Read one bounded page of WhatsApp ${resource}.`,
  inputSchema:z.object({count:z.number().int().min(1).max(50).default(20),offset:z.number().int().min(0).max(10000).default(0)}).strict(),
  annotations,_meta:{securitySchemes:[{type:"oauth2",scopes:["whatsapp.read"]}]}
 },async({count,offset})=>{const data=await readWhapi({resource,count,offset});return{structuredContent:{data},content:[{type:"text" as const,text:JSON.stringify(data)}]};});
 add("whapi_list_chats","chats"); add("whapi_list_groups","groups"); add("whapi_list_channels","channels"); add("whapi_get_products","products");
 s.registerTool("whapi_get_messages",{description:"Read a bounded page of messages from an exact chat ID returned by whapi_list_chats.",
  inputSchema:z.object({chatId:z.string().min(1).max(128),count:z.number().int().min(1).max(50).default(20),offset:z.number().int().min(0).max(10000).default(0)}).strict(),
  annotations,_meta:{securitySchemes:[{type:"oauth2",scopes:["whatsapp.read"]}]}
 },async({chatId,count,offset})=>{const data=await readWhapi({resource:"messages",chatId,count,offset});return{structuredContent:{data},content:[{type:"text" as const,text:JSON.stringify(data)}]};});
 return s;
}
export async function handleWhatsappMcp(request:Request){
 if(!bearer(request)) return Response.json({error:"unauthorized"},{status:401,headers:{"WWW-Authenticate":`Bearer resource_metadata="${META}"`,"Cache-Control":"private, no-store"}});
 if(request.method!=="POST") return new Response(null,{status:405,headers:{Allow:"POST"}});
 const s=server(); const transport=new WebStandardStreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true});
 try{await s.connect(transport);return await transport.handleRequest(request);}finally{await s.close();}
}
