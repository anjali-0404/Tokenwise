import {scryptSync,randomBytes,timingSafeEqual} from 'crypto';
const U=(globalThis.__u??=new Map());
export async function POST(q){const {mode,email,password}=await q.json();const k=String(email||'').toLowerCase().trim();
if(!/^\S+@\S+\.\S+$/.test(k)||String(password||'').length<6)return Response.json({error:'Enter a valid email and a password of 6+ characters.'},{status:400});
if(mode==='signup'){if(U.has(k))return Response.json({error:'That email already has an account. Sign in instead.'},{status:409});const s=randomBytes(16).toString('hex');U.set(k,{s,h:scryptSync(password,s,32).toString('hex')});return Response.json({email:k})}
const u=U.get(k);if(!u||!timingSafeEqual(Buffer.from(u.h,'hex'),scryptSync(password,u.s,32)))return Response.json({error:'Email or password is wrong. New here? Create an account first.'},{status:401});return Response.json({email:k})}
