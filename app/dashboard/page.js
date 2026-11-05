'use client';
import {useEffect,useState} from 'react';import {useRouter} from 'next/navigation';import {Code2,Play,LogOut,CheckCircle2,AlertTriangle,Info,XCircle,ShieldCheck,Loader2} from 'lucide-react';
const IC={ok:[CheckCircle2,'ok'],wn:[AlertTriangle,'wn'],in:[Info,'in'],bad:[XCircle,'bad']};
export default function D(){const r=useRouter();const [u,setU]=useState(null);const [f,setF]=useState({task:'Fix the null check in auth.js and run the tests',files:'src/auth.js, src/db.js',limit:0.05,confidential:false,outage:false});const [res,setRes]=useState(null),[ap,setAp]=useState([]),[ld,setLd]=useState(false),[er,setEr]=useState('');
useEffect(()=>{const x=localStorage.getItem('tw_user');x?setU(x):r.replace('/login')},[r]);
async function run(a=ap){setLd(true);setEr('');try{const x=await fetch('/api/agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...f,user:u,approved:a})});const j=await x.json();if(!x.ok)throw new Error(j.error);setRes(j)}catch(k){setEr(k.message)}setLd(false)}
const approve=n=>{const a=[...ap,n];setAp(a);run(a)};const set=(k,v)=>setF({...f,[k]:v});
if(!u)return null;const pc=res?Math.min(100,res.spent/res.limit*100):0;
return <div className="w"><nav><div className="brand"><Code2 size={20} color="#6ee7ff"/>TOKENWISE AGENT</div><div style={{display:'flex',gap:12,alignItems:'center',fontSize:13,color:'#9a97b8'}}>{u}<button className="pill" style={{background:'none',cursor:'pointer'}} onClick={()=>{localStorage.removeItem('tw_user');r.push('/')}}><LogOut size={11}/> SIGN OUT</button></div></nav>
<div className="dash"><div className="box" style={{alignSelf:'start'}}><span className="lab">NEW TASK</span>
<label htmlFor="t">Task</label><textarea id="t" rows={4} value={f.task} onChange={e=>set('task',e.target.value)}/>
<label htmlFor="fl">Files to read (comma separated)</label><input id="fl" value={f.files} onChange={e=>set('files',e.target.value)}/>
<label htmlFor="l">Spending limit (USD)</label><input id="l" type="number" step="0.01" min="0" value={f.limit} onChange={e=>set('limit',e.target.value)}/>
<div className="row"><label htmlFor="c" style={{margin:0}}>Confidential repository</label><input id="c" className="tg" type="checkbox" checked={f.confidential} onChange={e=>set('confidential',e.target.checked)}/></div>
<div className="row"><label htmlFor="o" style={{margin:0}}>Simulate provider outage</label><input id="o" className="tg" type="checkbox" checked={f.outage} onChange={e=>set('outage',e.target.checked)}/></div>
<button className="btn" style={{width:'100%',justifyContent:'center',marginTop:20}} disabled={ld} onClick={()=>{setAp([]);run([])}}>{ld?<Loader2 size={16}/>:<Play size={16}/>} Run task</button>{er&&<div className="err" role="alert">{er}</div>}</div>
<div>{res&&<><div className="stats"><div className="box"><b>{res.tokens}</b><small>tokens used</small></div><div className="box"><b className="ok">{res.naive?Math.max(0,Math.round((1-res.tokens/res.naive)*100)):0}%</b><small>saved vs. no caching</small></div><div className="box"><b>${res.spent.toFixed(4)}</b><small>of ${(+res.limit).toFixed(2)} limit<div className="meter"><i style={{width:pc+'%'}}/></div></small></div></div>
<div className="box"><span className="lab">ACTIVITY</span>{res.steps.map((s,i)=>{const [I,c]=IC[s.k];return <div className="step" key={i}><I size={16} className={c}/><span>{s.t}</span></div>})}
{res.pending?.length>0&&<div style={{marginTop:14,display:'flex',gap:10,flexWrap:'wrap'}}>{res.pending.map(n=><button key={n} className="btn" onClick={()=>approve(n)}><ShieldCheck size={16}/> Approve {n}</button>)}</div>}</div></>}
{!res&&<div className="box"><span className="lab">ACTIVITY</span>Run a task to see model routing, caching, failover, spending and approvals here. Try the same task twice to watch cached files cut the token count.</div>}</div></div></div>}
