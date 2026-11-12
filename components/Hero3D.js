'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Database, GitFork, ShieldCheck, UserCheck, Sparkles, Activity } from 'lucide-react';

const NODES_DATA = [
  {
    id: 'cache',
    name: 'Context Cache',
    color: '#00f2fe',
    hex: 0x00f2fe,
    pos: [-2.2, 0.95, 0.3],
    badge: 'CACHE HIT: 0 TOKENS',
    description: 'Tracks file hashes in memory. Repeated reads cost 0 tokens, slashing API bills by up to 80%.',
    icon: Database,
  },
  {
    id: 'router',
    name: 'Intelligent Model Router',
    color: '#8b7cf6',
    hex: 0x8b7cf6,
    pos: [2.2, 1.05, -0.3],
    badge: 'ADAPTIVE TIERING',
    description: 'Analyzes task complexity: routes lightweight edits to fast models and complex refactors to high-tier models.',
    icon: GitFork,
  },
  {
    id: 'privacy',
    name: 'Privacy Shield',
    color: '#10b981',
    hex: 0x10b981,
    pos: [-1.9, -1.15, -0.4],
    badge: 'AIR-GAPPED LOCAL ONLY',
    description: 'Flags confidential repositories. Prompts cannot override: all code execution is strictly forced to local Ollama.',
    icon: ShieldCheck,
  },
  {
    id: 'approval',
    name: 'Approval Gate',
    color: '#ff3d9a',
    hex: 0xff3d9a,
    pos: [2.0, -1.1, 0.4],
    badge: 'HUMAN-IN-THE-LOOP',
    description: 'Reads are instant. Destructive file writes, shell commands, and Git operations wait for your explicit authorization.',
    icon: UserCheck,
  },
];

export default function Hero3D() {
  const mountRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [webGLSupported, setWebGLSupported] = useState(true);

  // Keep a stable ref for mouse raycasting
  const hoveredNodeRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. WebGL Feature Detection
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch (e) {
      setWebGLSupported(false);
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const getWidth = () => container.clientWidth || 400;
    const getHeight = () => container.clientHeight || 420;

    // 2. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, getWidth() / getHeight(), 0.1, 100);
    camera.position.set(0, 0, 6.2);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(getWidth(), getHeight());
    container.appendChild(renderer.domElement);

    // 3. Central Intelligence Core
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Inner Glowing Nucleus
    const nucleusGeo = new THREE.SphereGeometry(0.48, 24, 24);
    const nucleusMat = new THREE.MeshBasicMaterial({
      color: 0xff3d9a,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const nucleusMesh = new THREE.Mesh(nucleusGeo, nucleusMat);
    coreGroup.add(nucleusMesh);

    // Outer Faceted Shell
    const shellGeo = new THREE.IcosahedronGeometry(0.9, 1);
    const shellMat = new THREE.MeshBasicMaterial({
      color: 0x8b7cf6,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const shellMesh = new THREE.Mesh(shellGeo, shellMat);
    coreGroup.add(shellMesh);

    // Core Particle Halo
    const coreParticleCount = 90;
    const coreParticleGeo = new THREE.BufferGeometry();
    const coreParticlePos = new Float32Array(coreParticleCount * 3);
    for (let i = 0; i < coreParticleCount; i++) {
      const radius = 1.1 + Math.random() * 0.45;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      coreParticlePos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      coreParticlePos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      coreParticlePos[i * 3 + 2] = radius * Math.cos(phi);
    }
    coreParticleGeo.setAttribute('position', new THREE.BufferAttribute(coreParticlePos, 3));
    const coreParticleMat = new THREE.PointsMaterial({
      color: 0x00f2fe,
      size: 0.045,
      transparent: true,
      opacity: 0.8,
    });
    const coreParticles = new THREE.Points(coreParticleGeo, coreParticleMat);
    coreGroup.add(coreParticles);

    // 4. Orbital Boundary Rings
    const ring1Geo = new THREE.TorusGeometry(3.1, 0.012, 8, 120);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x8b7cf6,
      transparent: true,
      opacity: 0.25,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = 1.25;
    ring1.rotation.y = 0.35;
    scene.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(2.6, 0.01, 8, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.2,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -0.9;
    ring2.rotation.y = -0.5;
    scene.add(ring2);

    // 5. System Nodes & Data Pathways
    const nodeMeshes = [];
    const interactiveMeshes = [];
    const dataBeams = [];
    const dataPulses = [];

    NODES_DATA.forEach((data, index) => {
      const nodeGroup = new THREE.Group();
      nodeGroup.position.set(...data.pos);
      nodeGroup.userData = { id: data.id, index, basePos: [...data.pos] };

      // Inner Core Mesh
      const innerGeo = new THREE.OctahedronGeometry(0.3, 0);
      const innerMat = new THREE.MeshBasicMaterial({
        color: data.hex,
        wireframe: false,
      });
      const innerMesh = new THREE.Mesh(innerGeo, innerMat);
      nodeGroup.add(innerMesh);

      // Outer Wireframe Cage
      const outerGeo = new THREE.IcosahedronGeometry(0.48, 0);
      const outerMat = new THREE.MeshBasicMaterial({
        color: data.hex,
        wireframe: true,
        transparent: true,
        opacity: 0.75,
      });
      const outerMesh = new THREE.Mesh(outerGeo, outerMat);
      nodeGroup.add(outerMesh);

      // Orbital halo ring for node
      const haloGeo = new THREE.RingGeometry(0.55, 0.58, 24);
      const haloMat = new THREE.MeshBasicMaterial({
        color: data.hex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      nodeGroup.add(haloMesh);

      // Hit area (invisible bounding sphere for easy hovering)
      const hitGeo = new THREE.SphereGeometry(0.7, 12, 12);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.userData = { id: data.id, index };
      nodeGroup.add(hitMesh);

      scene.add(nodeGroup);
      nodeMeshes.push({ group: nodeGroup, innerMesh, outerMesh, haloMesh, hitMesh, data });
      interactiveMeshes.push(hitMesh);

      // Connecting Curved Energy Path
      const startPt = new THREE.Vector3(0, 0, 0);
      const endPt = new THREE.Vector3(...data.pos);
      const midPt = new THREE.Vector3()
        .addVectors(startPt, endPt)
        .multiplyScalar(0.5)
        .add(new THREE.Vector3(0, 0.4 * (index % 2 === 0 ? 1 : -1), 0.2));

      const curve = new THREE.QuadraticBezierCurve3(startPt, midPt, endPt);
      const curvePoints = curve.getPoints(36);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const lineMat = new THREE.LineBasicMaterial({
        color: data.hex,
        transparent: true,
        opacity: 0.35,
      });
      const lineMesh = new THREE.Line(lineGeo, lineMat);
      scene.add(lineMesh);
      dataBeams.push({ lineMesh, lineMat, curve });

      // Flowing Data Pulse Particles along the curve
      const pulseGeo = new THREE.SphereGeometry(0.06, 8, 8);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: data.hex,
      });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      scene.add(pulseMesh);
      dataPulses.push({ mesh: pulseMesh, curve, progress: index * 0.25, speed: 0.007 });
    });

    // 6. Interactive Raycasting & Mouse Tracking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let targetRotX = 0;
    let targetRotY = 0;

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      mouse.x = x;
      mouse.y = y;

      // Mild tilt based on mouse relative to window
      targetRotY = (e.clientX / window.innerWidth - 0.5) * 0.55;
      targetRotX = (e.clientY / window.innerHeight - 0.5) * 0.45;
    };

    const onPointerLeave = () => {
      mouse.x = -999;
      mouse.y = -999;
      targetRotX = 0;
      targetRotY = 0;
      hoveredNodeRef.current = null;
      setHoveredNode(null);
    };

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerleave', onPointerLeave);

    // 7. Animation Loop
    let animId;
    let clock = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = prefersReducedMotion ? 0.002 : 0.016;
      clock += delta;

      // Rotate core elements
      nucleusMesh.rotation.y += 0.012;
      nucleusMesh.rotation.x -= 0.008;
      shellMesh.rotation.y -= 0.007;
      shellMesh.rotation.z += 0.005;
      coreParticles.rotation.y += 0.004;

      // Gentle core pulse
      const pulseScale = 1 + Math.sin(clock * 2.5) * 0.05;
      nucleusMesh.scale.set(pulseScale, pulseScale, pulseScale);

      // Rotate orbital boundary rings
      ring1.rotation.z += 0.003;
      ring2.rotation.z -= 0.004;

      // Raycast for hover
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      let currentHoverId = null;
      if (intersects.length > 0) {
        currentHoverId = intersects[0].object.userData.id;
      }

      if (currentHoverId !== hoveredNodeRef.current) {
        hoveredNodeRef.current = currentHoverId;
        const found = NODES_DATA.find((n) => n.id === currentHoverId) || null;
        setHoveredNode(found);
      }

      // Animate Nodes
      nodeMeshes.forEach(({ group, innerMesh, outerMesh, haloMesh, data }) => {
        const isHovered = hoveredNodeRef.current === data.id;

        // Base idle rotations
        innerMesh.rotation.y += isHovered ? 0.03 : 0.01;
        innerMesh.rotation.x += isHovered ? 0.02 : 0.007;
        outerMesh.rotation.y -= isHovered ? 0.02 : 0.008;
        haloMesh.rotation.z += 0.015;

        // Hover scale transition (smooth lerp)
        const targetScale = isHovered ? 1.35 : 1.0;
        group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);

        // Gentle floating oscillation
        const floatOffset = Math.sin(clock * 1.8 + data.pos[0] * 2) * 0.08;
        group.position.y = data.pos[1] + floatOffset;
      });

      // Animate Data Beams & Flowing Pulses
      dataPulses.forEach((pulse, idx) => {
        const isConnectedNodeHovered = hoveredNodeRef.current === NODES_DATA[idx].id;
        const pulseSpeed = isConnectedNodeHovered ? pulse.speed * 2.2 : pulse.speed;

        pulse.progress = (pulse.progress + pulseSpeed) % 1.0;
        const pt = pulse.curve.getPoint(pulse.progress);
        pulse.mesh.position.copy(pt);

        // Scale pulse dynamically based on distance from core
        const scale = 0.8 + Math.sin(pulse.progress * Math.PI) * 0.8;
        pulse.mesh.scale.set(scale, scale, scale);
      });

      // Light beam opacity modulation
      dataBeams.forEach((beam, idx) => {
        const isHovered = hoveredNodeRef.current === NODES_DATA[idx].id;
        const targetOpacity = isHovered ? 0.9 : 0.35;
        beam.lineMat.opacity += (targetOpacity - beam.lineMat.opacity) * 0.1;
      });

      // Scene smooth dampening towards mouse target
      scene.rotation.y += (targetRotY - scene.rotation.y) * 0.06;
      scene.rotation.x += (targetRotX - scene.rotation.x) * 0.06;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize Listener
    const handleResize = () => {
      const w = getWidth();
      const h = getHeight();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 9. Comprehensive Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);

      // Dispose geometries and materials
      [
        nucleusGeo,
        shellGeo,
        coreParticleGeo,
        ring1Geo,
        ring2Geo,
      ].forEach((g) => g.dispose());

      [
        nucleusMat,
        shellMat,
        coreParticleMat,
        ring1Mat,
        ring2Mat,
      ].forEach((m) => m.dispose());

      nodeMeshes.forEach(({ innerMesh, outerMesh, haloMesh, hitMesh }) => {
        innerMesh.geometry.dispose();
        innerMesh.material.dispose();
        outerMesh.geometry.dispose();
        outerMesh.material.dispose();
        haloMesh.geometry.dispose();
        haloMesh.material.dispose();
        hitMesh.geometry.dispose();
        hitMesh.material.dispose();
      });

      dataBeams.forEach(({ lineMesh, lineMat }) => {
        lineMesh.geometry.dispose();
        lineMat.dispose();
      });

      dataPulses.forEach(({ mesh }) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });

      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* HUD Telemetry Header */}
      <div className="stage-hud">
        <div className="hud-badge">
          <span className="hud-status-dot" />
          <span>INTELLIGENCE CORE: ACTIVE</span>
        </div>
        <div className="hud-badge" style={{ color: '#00f2fe' }}>
          <Sparkles size={11} />
          <span>4 LIVE NODES</span>
        </div>
      </div>

      {/* 3D Canvas Container or WebGL Fallback */}
      {webGLSupported ? (
        <div
          ref={mountRef}
          style={{
            width: '100%',
            height: '100%',
            cursor: 'crosshair',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'center',
          }}
        >
          <Activity size={36} color="#8b7cf6" />
          <h4 style={{ margin: '12px 0 6px', color: '#fff' }}>Tokenwise Intelligence Architecture</h4>
          <p style={{ color: 'var(--mut)', fontSize: 13, maxWidth: 320 }}>
            Context Cache · Model Router · Privacy Shield · Approval Gate
          </p>
        </div>
      )}

      {/* Interactive Tooltip HUD Overlay when a node is hovered */}
      {hoveredNode && (
        <div
          style={{
            position: 'absolute',
            bottom: '68px',
            left: '16px',
            right: '16px',
            background: 'rgba(12, 10, 30, 0.92)',
            border: `1px solid ${hoveredNode.color}`,
            borderRadius: '12px',
            padding: '14px 18px',
            boxShadow: `0 8px 30px rgba(0,0,0,0.6), 0 0 20px ${hoveredNode.color}33`,
            backdropFilter: 'blur(16px)',
            zIndex: 20,
            pointerEvents: 'none',
            animation: 'fadeInUp 0.25s ease forwards',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, color: '#fff' }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: hoveredNode.color,
                  boxShadow: `0 0 8px ${hoveredNode.color}`,
                }}
              />
              {hoveredNode.name}
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: hoveredNode.color,
                background: `${hoveredNode.color}22`,
                border: `1px solid ${hoveredNode.color}55`,
                padding: '2px 8px',
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              {hoveredNode.badge}
            </span>
          </div>
          <p style={{ fontSize: 12.5, color: '#c9c5e8', lineHeight: 1.5, margin: 0 }}>
            {hoveredNode.description}
          </p>
        </div>
      )}

      {/* Bottom Node Quick Selector Pills */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          right: '12px',
          display: 'flex',
          gap: '6px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          zIndex: 15,
        }}
      >
        {NODES_DATA.map((node) => {
          const isActive = hoveredNode?.id === node.id;
          return (
            <div
              key={node.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 99,
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                background: isActive ? `${node.color}28` : 'rgba(10, 8, 25, 0.7)',
                border: `1px solid ${isActive ? node.color : 'rgba(255, 255, 255, 0.1)'}`,
                color: isActive ? '#fff' : 'var(--mut)',
                boxShadow: isActive ? `0 0 12px ${node.color}44` : 'none',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: node.color,
                }}
              />
              {node.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}
