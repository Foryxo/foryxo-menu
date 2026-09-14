import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/domains/auth/server";
import { getDb } from "@/domains/db/client";
import { user } from "@/domains/db/schema/index";
import { audit } from "@/domains/audit/log";
const schema=z.object({userId:z.string().min(1),role:z.enum(["superadmin","creator","admin","finance","support","editor","business","consumer"]),isSuspended:z.boolean()});
export async function POST(req:NextRequest){const session=await auth.api.getSession({headers:req.headers});const role=(session?.user as {role?:string}|undefined)?.role??"";if(!session?.user||role!=="superadmin")return NextResponse.json({error:"forbidden"},{status:403});const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"invalid_input"},{status:400});if(parsed.data.userId===session.user.id&&parsed.data.role!=="superadmin")return NextResponse.json({error:"cannot_demote_self"},{status:409});const db=getDb();const [before]=await db.select().from(user).where(eq(user.id,parsed.data.userId)).limit(1);if(!before)return NextResponse.json({error:"not_found"},{status:404});await db.update(user).set({role:parsed.data.role,isSuspended:parsed.data.isSuspended,updatedAt:new Date()}).where(eq(user.id,parsed.data.userId));await audit.log({actorUserId:session.user.id,actorRole:role,action:"user.update_access",targetType:"user",targetId:parsed.data.userId,previous:{role:before.role,isSuspended:before.isSuspended},next:parsed.data});return NextResponse.json({ok:true})}
