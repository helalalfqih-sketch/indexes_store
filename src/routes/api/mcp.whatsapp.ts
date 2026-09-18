import { createFileRoute } from "@tanstack/react-router";
import { handleWhatsappMcp } from "@/lib/mcp/whatsapp-handler.server";
export const Route=createFileRoute("/api/mcp/whatsapp")({server:{handlers:{POST:({request})=>handleWhatsappMcp(request),GET:({request})=>handleWhatsappMcp(request),OPTIONS:({request})=>handleWhatsappMcp(request)}}});
