'use client';
import {useEffect,useRef} from 'react';import * as T from 'three';
export default function Hero3D(){const r=useRef();useEffect(()=>{const el=r.current;let g;try{g=new T.WebGLRenderer({alpha:true,antialias:true})}catch(e){return}
const w=()=>el.clientWidth||300,h=()=>el.clientHeight||300;const s=new T.Scene(),c=new T.PerspectiveCamera(50,w()/h(),.1,100);c.position.z=5.5;g.setPixelRatio(Math.min(devicePixelRatio,2));g.setSize(w(),h());el.appendChild(g.domElement);
const m=(geo,col)=>new T.Mesh(geo,new T.MeshBasicMaterial({color:col,wireframe:true,transparent:true,opacity:.8}));
const a=m(new T.IcosahedronGeometry(1.7,1),0x8b7cf6),b=m(new T.TorusKnotGeometry(.65,.2,100,14),0xff3d9a),d=m(new T.TorusGeometry(2.5,.012,8,120),0x6ee7ff),e2=m(new T.OctahedronGeometry(.4),0xffffff);s.add(a,b,d,e2);
let id,t=0,mx=0,my=0;const mv=ev=>{mx=ev.clientX/innerWidth-.5;my=ev.clientY/innerHeight-.5};addEventListener('pointermove',mv);
const f=()=>{t+=.01;a.rotation.x+=.003;a.rotation.y+=.005;b.rotation.y-=.012;b.rotation.x+=.006;d.rotation.x=1.2+Math.sin(t)*.3;d.rotation.y+=.004;e2.position.set(Math.cos(t*2)*2.5,Math.sin(t*2)*1.2,0);s.rotation.y+=(mx*.8-s.rotation.y)*.05;s.rotation.x+=(my*.6-s.rotation.x)*.05;g.render(s,c);id=requestAnimationFrame(f)};f();
const rs=()=>{g.setSize(w(),h());c.aspect=w()/h();c.updateProjectionMatrix()};addEventListener('resize',rs);
return()=>{cancelAnimationFrame(id);removeEventListener('resize',rs);removeEventListener('pointermove',mv);g.dispose();if(g.domElement.parentNode===el)el.removeChild(g.domElement)}},[]);return <div ref={r} style={{width:'100%',height:'100%'}}/>}
