"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ImageDistortionProps {
  imageUrl: string;
}

export const ImageDistortionGlitch: React.FC<ImageDistortionProps> = ({ imageUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const planeMeshRef = useRef<THREE.Mesh | null>(null);
  const isHoveredRef = useRef(false);
  const hoverDurationRef = useRef(0);

  const ANIMATION_CONFIG = {
    updateFrequency: 0.1,
    glitchIntensityMod: 0.5
  };

  const vertexShader = `
    varying vec2 vUv;
    void main() {
       vUv = uv;
       gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform sampler2D tDiffuse;
    uniform float glitchIntensity;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv;
      vec4 baseState = texture2D(tDiffuse, uv);
      if (glitchIntensity > 0.0) {
          float segment = floor(uv.y * 12.0); 
          float randomValue = fract(sin(segment * 12345.6789 + glitchIntensity) * 43758.5453); 
          vec2 offset = vec2(randomValue * 0.03, 0.0) * glitchIntensity;
          vec4 redGlitch = texture2D(tDiffuse, uv + offset);
          vec4 greenGlitch = texture2D(tDiffuse, uv - offset);
          vec4 blueGlitch = texture2D(tDiffuse, uv);
          if (mod(segment, 3.0) == 0.0) {
              gl_FragColor = vec4(redGlitch.r, greenGlitch.g, baseState.b, 1.0);
          } else if (mod(segment, 3.0) == 1.0) {
              gl_FragColor = vec4(baseState.r, greenGlitch.g, blueGlitch.b, 1.0);
          } else {
              gl_FragColor = vec4(redGlitch.r, baseState.g, blueGlitch.b, 1.0);
          }
      } else {
          gl_FragColor = baseState; 
      }
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
        tDiffuse: { value: texture },
        glitchIntensity: { value: 0.0 }
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

    const animateScene = () => {
      if (!planeMeshRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      requestAnimationFrame(animateScene);

      if (isHoveredRef.current) {
        hoverDurationRef.current += ANIMATION_CONFIG.updateFrequency;
        if (hoverDurationRef.current >= 0.5) {
          hoverDurationRef.current = 0;
          (planeMeshRef.current.material as THREE.ShaderMaterial).uniforms.glitchIntensity.value = 
            Math.random() * ANIMATION_CONFIG.glitchIntensityMod;
        }
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animateScene();

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      if (planeMeshRef.current) {
        (planeMeshRef.current.material as THREE.ShaderMaterial).uniforms.glitchIntensity.value = 0;
      }
    };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement);
      }
    };
  }, [imageUrl]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    />
  );
};