import { createFileRoute } from "@tanstack/react-router";
import { registerClient } from "@/lib/mcp/whatsapp-oauth.server";

export const Route = createFileRoute("/api/mcp/oauth/register")({
  server:{handlers:{POST:async({request})=>{
    try{
      const body=await request.json() as {redirect_uris?:string[]};
      const redirect_uris=body.redirect_uris??[];
      const client_id=registerClient(redirect_uris);
      return Response.json({client_id,client_id_issued_at:Math.floor(Date.now()/1000),
        redirect_uris,token_endpoint_auth_method:"none",grant_types:["authorization_code"],
        response_types:["code"]},{status:201,headers:{"Cache-Control":"no-store"}});
    }catch{return Response.json({error:"invalid_client_metadata"},{status:400});}
  }}}
});
