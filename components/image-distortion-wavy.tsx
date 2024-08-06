"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface WaveDistortionProps {
  imageUrl: string;
}

export const ImageDistortionWavy: React.FC<WaveDistortionProps> = ({ imageUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const planeMeshRef = useRef<THREE.Mesh | null>(null);

  const currentStateRef = useRef({ mousePosition: { x: 0, y: 0 }, waveIntensity: 0.005 });
  const targetStateRef = useRef({ mousePosition: { x: 0, y: 0 }, waveIntensity: 0.005 });

  const ANIMATION_CONFIG = {
    transitionSpeed: 0.03,
    baseIntensity: 0.005,
    hoverIntensity: 0.009
  };

  const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform float u_intensity;
    uniform sampler2D u_texture;
    varying vec2 vUv;

    void main() {
        vec2 uv = vUv;
        float wave1 = sin(uv.x * 10.0 + u_time * 0.5 + u_mouse.x * 5.0) * u_intensity;
        float wave2 = sin(uv.y * 12.0 + u_time * 0.8 + u_mouse.y * 4.0) * u_intensity;
        float wave3 = cos(uv.x * 8.0 + u_time * 0.5 + u_mouse.x * 3.0) * u_intensity;
        float wave4 = cos(uv.y * 9.0 + u_time * 0.7 + u_mouse.y * 3.5) * u_intensity;

        uv.y += wave1 + wave2;
        uv.x += wave3 + wave4;
        
        gl_FragColor = texture2D(u_texture, uv);
    }
  `;

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    const initializeScene = (texture: THREE.Texture) => {
      sceneRef.current = new THREE.Scene();

      cameraRef.current = new THREE.PerspectiveCamera(80, width / height, 0.01, 10);
      cameraRef.current.position.z = 1;

      const shaderUniforms = {
        u_time: { value: 1.0 },
        u_mouse: { value: new THREE.Vector2() },
        u_intensity: { value: currentStateRef.current.waveIntensity },
        u_texture: { value: texture }
      };

      planeMeshRef.current = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.ShaderMaterial({
          uniforms: shaderUniforms,
          vertexShader,
          fragmentShader
        })
      );

      sceneRef.current.add(planeMeshRef.current);

      rendererRef.current = new THREE.WebGLRenderer();
      rendererRef.current.setSize(width, height);

      container.appendChild(rendererRef.current.domElement);
    };

    const texture = new THREE.TextureLoader().load(imageUrl);
    initializeScene(texture);

    const updateValue = (targetState: number, current: number, transitionSpeed: number) => {
      return current + (targetState - current) * transitionSpeed;
    };

    const animateScene = () => {
      if (!planeMeshRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      requestAnimationFrame(animateScene);

      currentStateRef.current.mousePosition.x = updateValue(
        targetStateRef.current.mousePosition.x,
        currentStateRef.current.mousePosition.x,
        ANIMATION_CONFIG.transitionSpeed
      );

      currentStateRef.current.mousePosition.y = updateValue(
        targetStateRef.current.mousePosition.y,
        currentStateRef.current.mousePosition.y,
        ANIMATION_CONFIG.transitionSpeed
      );

      currentStateRef.current.waveIntensity = updateValue(
        targetStateRef.current.waveIntensity,
        currentStateRef.current.waveIntensity,
        ANIMATION_CONFIG.transitionSpeed
      );

      const uniforms = (planeMeshRef.current.material as THREE.ShaderMaterial).uniforms;

      uniforms.u_intensity.value = currentStateRef.current.waveIntensity;
      uniforms.u_time.value += 0.005;
      uniforms.u_mouse.value.set(currentStateRef.current.mousePosition.x, currentStateRef.current.mousePosition.y);

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animateScene();

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      targetStateRef.current.mousePosition.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      targetStateRef.current.mousePosition.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handleMouseOver = () => {
      targetStateRef.current.waveIntensity = ANIMATION_CONFIG.hoverIntensity;
    };

    const handleMouseOut = () => {
      targetStateRef.current.waveIntensity = ANIMATION_CONFIG.baseIntensity;
      targetStateRef.current.mousePosition = { x: 0, y: 0 };
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseover', handleMouseOver);
    container.addEventListener('mouseout', handleMouseOut);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseover', handleMouseOver);
      container.removeEventListener('mouseout', handleMouseOut);
      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement);
      }
    };
  }, [imageUrl]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '600px',
        height: '800px',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '10px',
        maxWidth: '100%',
        filter: 'saturate(50%)',
        transition: 'all ease 0.5s',
      }}
      onMouseOver={(e) => {
        (e.currentTarget as HTMLDivElement).style.filter = 'saturate(100%)';
      }}
      onMouseOut={(e) => {
        (e.currentTarget as HTMLDivElement).style.filter = 'saturate(50%)';
      }}
    />
  );
};