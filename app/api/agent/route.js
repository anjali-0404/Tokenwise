const S=(globalThis.__s??={spend:{},seen:{}});
const M={local:{n:'ollama/llama3.2 (local)',p:0},small:{n:'haiku-class (cloud)',p:.002},big:{n:'sonnet-class (cloud)',p:.01},backup:{n:'backup-provider mid-tier (cloud)',p:.006}};
const FILE_TOK=800,est=t=>Math.ceil(t.length/4);
const ACT=[['file write',/\b(write|create|edit|fix|refactor|add|update|delete)\b/i],['shell command',/\b(run|test|install|npm|build|exec|script)\b/i],['git operation',/\b(commit|push|branch|merge|git|pull request)\b/i]];
export async function POST(q){const b=await q.json();const user=b.user||'anon',task=String(b.task||'').slice(0,4000),limit=Math.max(0,+b.limit||0.05),approved=b.approved||[],steps=[];
if(!task.trim())return Response.json({error:'Describe a task first.'},{status:400});
const add=(k,t)=>steps.push({k,t});const spent=S.spend[user]||0;
const files=String(b.files||'').split(',').map(x=>x.trim()).filter(Boolean);S.seen[user]??={};
let ft=0,hit=0;for(const f of files){if(S.seen[user][f]){hit++}else{S.seen[user][f]=1;ft+=FILE_TOK}}
if(files.length)add('ok',`Read ${files.length} file(s): ${hit} served from cache, ${files.length-hit} newly read (${ft} tokens).`);
const tokens=est(task)+ft+300;let tier;
if(b.confidential){tier='local';add('in','Repository is confidential, so only the local model is used. Instructions in the prompt cannot change this.')}
else{tier=task.length<90&&!/refactor|architect|debug|migrate|design/i.test(task)?'small':'big';add('in',`Task looks ${tier==='small'?'simple':'complex'}, so it goes to the ${M[tier].n} model.`)}
let m=M[tier];
if(tier!=='local'&&b.outage){m=M.backup;add('wn',`Primary provider is unavailable. Switched to ${m.n}; your session and context are intact.`)}
const cost=tokens/1000*m.p;
if(spent+cost>limit){add('bad',`Blocked: this call costs about $${cost.toFixed(4)} and you have used $${spent.toFixed(4)} of your $${limit.toFixed(2)} limit. Raise the limit or mark the repo confidential to use the free local model.`);return Response.json({steps,blocked:true,spent,limit,tokens:0,pending:[]})}
S.spend[user]=spent+cost;add('ok',`Model call on ${m.n}: ${tokens} tokens, $${cost.toFixed(4)}.`);
const pending=[];for(const [n,re] of ACT)if(re.test(task)){if(approved.includes(n))add('ok',`Approved by you and executed: ${n}.`);else{pending.push(n);add('wn',`Waiting for your approval: ${n}.`)}}
if(!pending.length&&!ACT.some(([,re])=>re.test(task)))add('ok','Read-only task completed. No approval needed.');
const naive=est(task)+files.length*FILE_TOK+300;
return Response.json({steps,pending,tokens,naive,model:m.n,spent:S.spend[user],limit,blocked:false})}
