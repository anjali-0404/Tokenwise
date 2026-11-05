'use client';
import dynamic from 'next/dynamic';import Link from 'next/link';
import {Code2,ShieldCheck,Wallet,RefreshCw,Lock,ArrowRight,Cpu} from 'lucide-react';
const Hero3D=dynamic(()=>import('../components/Hero3D'),{ssr:false});
const R=[[RefreshCw,'Reliability','Keeps working through provider outages and rate limits without losing the session, and tells you when another model takes over.'],[Wallet,'Budget management','Enforces a spending limit per user before every model call, with a clear stop when the limit is reached.'],[Lock,'Code privacy','Repositories marked confidential go to local models only, whatever the prompt says.'],[ShieldCheck,'Action approval','Reads are free. Writes, shell commands and Git operations wait for your approval. Prompts cannot override this.']];
export default function P(){return <><div className="top"/><div className="w">
<nav><div className="brand"><Code2 size={20} color="#6ee7ff"/>TOKENWISE AGENT</div><div style={{display:'flex',gap:10,alignItems:'center'}}><Link href="/login" className="pill">SIGN IN</Link><Link href="/signup" className="pill" style={{background:'#8b7cf622'}}>GET STARTED</Link></div></nav>
<section className="hero"><div><span className="lab">GLOBAL AI HACKATHON · AI AGENTS</span>
<h1>A coding agent that gets the job done on the <span className="pk">fewest tokens</span></h1>
<p className="lead">It caches files it has already read, sends simple tasks to smaller models, switches providers when one goes down, and asks before it changes anything.</p>
<Link href="/signup" className="btn">Start building <ArrowRight size={16}/></Link><Link href="/login" className="btn g">Sign in</Link></div>
<div className="stage"><Hero3D/></div></section>
<span className="lab">WHAT IT GUARANTEES</span>
<div className="grid4">{R.map(([I,t,d])=><div className="req" key={t}><I size={18}/><div><b>{t}</b><span>{d}</span></div></div>)}</div>
<div className="box"><span className="lab">EXPECTED OUTCOME</span>Successful task completion, lower token use, reliable model failover, enforced spending limits and secure execution of development operations.</div>
<div className="foot"><span>BUILD <b>1–15 NOV 2026</b></span><span>TEAM <b>1–4</b></span><span>FORMAT <b>ONLINE · GLOBAL</b></span><span>JUDGING <b>29 NOV 2026</b></span><span>INTEGRATE <b>BIFROST + TAVILY</b></span></div></div></>}
