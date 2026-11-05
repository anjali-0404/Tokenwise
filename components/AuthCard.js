'use client';
import {useState} from 'react';import Link from 'next/link';import {useRouter} from 'next/navigation';import {Code2,Mail,Lock,Loader2} from 'lucide-react';
export default function AuthCard({mode}){const r=useRouter();const su=mode==='signup';const [e,setE]=useState(''),[p,setP]=useState(''),[er,setEr]=useState(''),[ld,setLd]=useState(false);
async function go(ev){ev.preventDefault();setEr('');setLd(true);try{const x=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,email:e,password:p})});const j=await x.json();if(!x.ok)throw new Error(j.error);localStorage.setItem('tw_user',j.email);r.push('/dashboard')}catch(k){setEr(k.message)}setLd(false)}
return <div className="auth"><div className="box card"><div className="brand"><Code2 size={20} color="#6ee7ff"/>TOKENWISE AGENT</div>
<h2>{su?'Create your account':'Welcome back'}</h2><p>{su?'Set up a workspace with its own spending limit.':'Sign in to run tasks and review approvals.'}</p>
<form onSubmit={go}><label htmlFor="e"><Mail size={12}/> Email</label><input id="e" type="email" required value={e} onChange={x=>setE(x.target.value)} placeholder="you@team.dev"/>
<label htmlFor="p"><Lock size={12}/> Password</label><input id="p" type="password" required minLength={6} value={p} onChange={x=>setP(x.target.value)} placeholder="At least 6 characters"/>
{er&&<div className="err" role="alert">{er}</div>}
<button className="btn" style={{width:'100%',justifyContent:'center',marginTop:20}} disabled={ld}>{ld&&<Loader2 size={16} className="spin"/>}{su?'Create account':'Sign in'}</button></form>
<p style={{marginTop:18,marginBottom:0}}>{su?<>Have an account? <Link href="/login" className="pk">Sign in</Link></>:<>New here? <Link href="/signup" className="pk">Create an account</Link></>}</p></div></div>}
