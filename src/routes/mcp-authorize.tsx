import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route=createFileRoute("/mcp-authorize")({
 validateSearch:(s:Record<string,unknown>)=>({
  client_id:String(s.client_id||""),redirect_uri:String(s.redirect_uri||""),
  state:String(s.state||""),code_challenge:String(s.code_challenge||"")
 }),
 component:McpAuthorize,
});
function McpAuthorize(){
 const q=Route.useSearch(), navigate=useNavigate();
 const [status,setStatus]=useState("جارٍ التحقق من صلاحية حساب الإدارة…");
 useEffect(()=>{void (async()=>{
  const {data}=await supabase.auth.getSession();
  if(!data.session){
   const next=`/mcp-authorize?${new URLSearchParams(q).toString()}`;
   await navigate({to:"/auth",search:{next}});
   return;
  }
  const res=await fetch("/api/mcp/oauth/approve",{method:"POST",headers:{
   Authorization:`Bearer ${data.session.access_token}`,"Content-Type":"application/json"
  },body:JSON.stringify(q)});
  if(!res.ok){setStatus("هذا الحساب غير مخول لربط واتساب.");return;}
  const body=await res.json() as {redirect:string}; window.location.assign(body.redirect);
 })()},[navigate,q]);
 return <main className="min-h-screen grid place-items-center p-6" dir="rtl"><div className="max-w-md rounded-xl border p-6">
  <h1 className="text-xl font-bold">ربط Indexes WhatsApp</h1><p className="mt-3 text-sm">{status}</p>
  <p className="mt-2 text-xs text-muted-foreground">صلاحية قراءة فقط. لا إرسال ولا حذف ولا نشر.</p>
 </div></main>
}
