import { createFileRoute } from "@tanstack/react-router";
import { validateClient } from "@/lib/mcp/whatsapp-oauth.server";

export const Route=createFileRoute("/api/mcp/oauth/authorize")({server:{handlers:{GET:async({request})=>{
 try{
  const u=new URL(request.url);
  const clientId=u.searchParams.get("client_id")||"", redirectUri=u.searchParams.get("redirect_uri")||"";
  const state=u.searchParams.get("state")||"", challenge=u.searchParams.get("code_challenge")||"";
  if(u.searchParams.get("response_type")!=="code"||u.searchParams.get("code_challenge_method")!=="S256"||
     !state||!challenge||!clientId||!redirectUri) throw new Error();
  validateClient(clientId,redirectUri);
  const next=new URL("/mcp-authorize",u.origin);
  for(const key of ["client_id","redirect_uri","state","code_challenge"]) next.searchParams.set(key,u.searchParams.get(key)!);
  return Response.redirect(next,302);
 }catch{return Response.json({error:"invalid_request"},{status:400,headers:{"Cache-Control":"no-store"}});}
}}}});
