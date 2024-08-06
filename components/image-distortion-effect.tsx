"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ImageDistortionProps {
  imageUrl: string;
}

export const ImageDistortion: React.FC<ImageDistortionProps> = ({ imageUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const planeMeshRef = useRef<THREE.Mesh | null>(null);
  const mousePositionRef = useRef({ x: 0.5, y: 0.5 });
  const targetMousePositionRef = useRef({ x: 0.5, y: 0.5 });
  const prevPositionRef = useRef({ x: 0.5, y: 0.5 });
  const aberrationIntensityRef = useRef(0.0);
  const easeFactorRef = useRef(0.02);

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec2 vUv;
    uniform sampler2D u_texture;    
    uniform vec2 u_mouse;
    uniform vec2 u_prevMouse;
    uniform float u_aberrationIntensity;

    void main() {
        vec2 gridUV = floor(vUv * vec2(20.0, 20.0)) / vec2(20.0, 20.0);
        vec2 centerOfPixel = gridUV + vec2(1.0/20.0, 1.0/20.0);
        
        vec2 mouseDirection = u_mouse - u_prevMouse;
        
        vec2 pixelToMouseDirection = centerOfPixel - u_mouse;
        float pixelDistanceToMouse = length(pixelToMouseDirection);
        float strength = smoothstep(0.3, 0.0, pixelDistanceToMouse);
 
        vec2 uvOffset = strength * - mouseDirection * 0.2;
        vec2 uv = vUv - uvOffset;

        vec4 colorR = texture2D(u_texture, uv + vec2(strength * u_aberrationIntensity * 0.01, 0.0));
        vec4 colorG = texture2D(u_texture, uv);
        vec4 colorB = texture2D(u_texture, uv - vec2(strength * u_aberrationIntensity * 0.01, 0.0));

        gl_FragColor = vec4(colorR.r, colorG.g, colorB.b, 1.0);
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
        u_mouse: { value: new THREE.Vector2() },
        u_prevMouse: { value: new THREE.Vector2() },
        u_aberrationIntensity: { value: 0.0 },
        u_texture: { value: texture }
      };

      planeMeshRef.current = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 1.5),
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

    const animateScene = () => {
      if (!planeMeshRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      requestAnimationFrame(animateScene);

      const { x: targetX, y: targetY } = targetMousePositionRef.current;
      mousePositionRef.current.x += (targetX - mousePositionRef.current.x) * easeFactorRef.current;
      mousePositionRef.current.y += (targetY - mousePositionRef.current.y) * easeFactorRef.current;

      const uniforms = (planeMeshRef.current.material as THREE.ShaderMaterial).uniforms;
      uniforms.u_mouse.value.set(
        mousePositionRef.current.x,
        1.0 - mousePositionRef.current.y
      );

      uniforms.u_prevMouse.value.set(
        prevPositionRef.current.x,
        1.0 - prevPositionRef.current.y
      );

      aberrationIntensityRef.current = Math.max(0.0, aberrationIntensityRef.current - 0.05);

      uniforms.u_aberrationIntensity.value = aberrationIntensityRef.current;

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animateScene();

    const handleMouseMove = (event: MouseEvent) => {
      easeFactorRef.current = 0.02;
      const rect = container.getBoundingClientRect();
      prevPositionRef.current = { ...targetMousePositionRef.current };

      targetMousePositionRef.current = {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height
      };

      aberrationIntensityRef.current = 1;
    };

    const handleMouseEnter = (event: MouseEvent) => {
      easeFactorRef.current = 0.02;
      const rect = container.getBoundingClientRect();

      mousePositionRef.current = targetMousePositionRef.current = {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height
      };
    };

    const handleMouseLeave = () => {
      easeFactorRef.current = 0.05;
      targetMousePositionRef.current = { ...prevPositionRef.current };
    };

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

      const newWidth = containerRef.current.offsetWidth;
      const newHeight = containerRef.current.offsetHeight;
      
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
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
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '10px',
        transition: 'all ease 0.5s',
      }}
      className='rounded-[12px]'
    />
  );
};