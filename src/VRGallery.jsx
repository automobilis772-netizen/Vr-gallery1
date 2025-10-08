import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls, Sky, Text } from "@react-three/drei";
import { XR, VRButton, Controllers, Hands } from "@react-three/xr";

/** WASD judėjimas (pelė – apsidairyti) */
function FPSControls({ speed = 4 }) {
  const { camera, gl } = useThree();
  const keys = useRef({});
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const up = new THREE.Vector3(0, 1, 0);

  useEffect(() => {
    const onKeyDown = (e) => (keys.current[e.code] = true);
    const onKeyUp = (e) => (keys.current[e.code] = false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    velocity.current.x -= velocity.current.x * 8.0 * delta;
    velocity.current.z -= velocity.current.z * 8.0 * delta;

    direction.current.set(0, 0, 0);
    if (keys.current["KeyW"]) direction.current.z -= 1;
    if (keys.current["KeyS"]) direction.current.z += 1;
    if (keys.current["KeyA"]) direction.current.x -= 1;
    if (keys.current["KeyD"]) direction.current.x += 1;
    if (direction.current.lengthSq() > 0) direction.current.normalize();

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, up).negate();

    const accel = speed;
    velocity.current.addScaledVector(forward, direction.current.z * accel * delta);
    velocity.current.addScaledVector(right, direction.current.x * accel * delta);

    camera.position.add(velocity.current);

    const bound = 9.2;
    camera.position.x = Math.max(-bound, Math.min(bound, camera.position.x));
    camera.position.z = Math.max(-bound, Math.min(bound, camera.position.z));
    camera.position.y = Math.max(1.2, Math.min(3.5, camera.position.y));

    gl.xr.enabled = true;
  });

  return <PointerLockControls selector="#enterPointerLock" />;
}

/** Vienas paveikslas + rėmelis + pavadinimas */
function Artwork({ texture, aspect = 1.5, title = "", position = [0, 2, -4], scale = 2 }) {
  const width = scale;
  const height = scale / aspect;

  useEffect(() => {
    if (texture) {
      texture.anisotropy = 8;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.needsUpdate = true;
    }
  }, [texture]);

  return (
    <group position={position}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={texture} side={THREE.FrontSide} />
      </mesh>
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[width + 0.15, height + 0.15, 0.1]} />
        <meshStandardMaterial color={"#262626"} metalness={0.3} roughness={0.6} />
      </mesh>
      {title && (
        <Text
          position={[0, -height / 2 - 0.25, 0]}
          fontSize={0.25}
          maxWidth={width + 0.5}
          textAlign="center"
          color="white"
          anchorX="center"
          anchorY="top"
        >
          {title}
        </Text>
      )}
    </group>
  );
}

/** Kambarys (sienos, grindys, lubos) */
function Room() {
  const size = 20;
  const height = 5;
  const wallColor = "#d9d9d9";
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color={"#bfbfbf"} roughness={1} metalness={0} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color={"#efefef"} />
      </mesh>
      <mesh rotation={[0, 0, 0]} position={[0, height / 2, -size / 2]}>
        <planeGeometry args={[size, height]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      <mesh rotation={[0, Math.PI, 0]} position={[0, height / 2, size / 2]}>
        <planeGeometry args={[size, height]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[size / 2, height / 2, 0]}>
        <planeGeometry args={[size, height]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-size / 2, height / 2, 0]}>
        <planeGeometry args={[size, height]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
    </group>
  );
}

/** Išdėstymas: 1-as vaizdas ant įėjimo durų, kiti – ant sienų */
function GalleryArtworks({ images }) {
  const loader = useMemo(() => new THREE.TextureLoader(), []);
  const textures = useMemo(
    () =>
      images.map((img) => {
        const texture = loader.load(img.url);
        return {
          texture,
          aspect: img.width && img.height ? img.width / img.height : 1.5,
          title: img.name || "",
        };
      }),
    [images, loader]
  );

  const positions = useMemo(() => {
    const arr = [];
    const wallZ = -9.5;
    const wallZBack = 9.5;
    const wallX = -9.5;
    const wallXRight = 9.5;
    const y = 2;
    const spacing = 4;

    // 1-as – įėjimo durų centras
    arr.push([0, y, wallZ]);
    // likę aplink visas sienas
    for (let i = -6; i <= 6; i += spacing) if (i !== 0) arr.push([i, y, wallZ]);
    for (let i = -6; i <= 6; i += spacing) arr.push([i, y, wallZBack]);
    for (let i = -6; i <= 6; i += spacing) arr.push([wallX, y, i]);
    for (let i = -6; i <= 6; i += spacing) arr.push([wallXRight, y, i]);
    return arr;
  }, []);

  return (
    <group>
      {textures.slice(0, positions.length).map((t, i) => {
        const p = positions[i];
        let rotY = 0;
        if (p[2] === -9.5) rotY = 0;
        if (p[2] === 9.5) rotY = Math.PI;
        if (p[0] === -9.5) rotY = -Math.PI / 2;
        if (p[0] === 9.5) rotY = Math.PI / 2;
        return (
          <group key={i} rotation={[0, rotY, 0]} position={p}>
            <Artwork texture={t.texture} aspect={t.aspect} title={t.title} />
          </group>
        );
      })}
    </group>
  );
}

export default function VRGallery() {
  const [images, setImages] = useState([]);

  const onFiles = async (files) => {
    const arr = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      const url = URL.createObjectURL(file);
      const dims = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.src = url;
      });
      arr.push({ url, ...dims, name: file.name.replace(/\.[^.]+$/, "") });
    }
    setImages((prev) => [...prev, ...arr]);
  };

  useEffect(() => () => images.forEach((i) => URL.revokeObjectURL(i.url)), [images]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#000" }}>
      {/* UI */}
      <div className="ui">
        <div className="card">
          <div style={{ fontWeight: 600 }}>3D VR galerija</div>
          <div style={{ opacity: 0.8, fontSize: 12 }}>
            1-as įkeltas vaizdas rodomas ant įėjimo durų. Likę – ant sienų. WASD + pelė. „Enter VR“ – jei palaikoma.
          </div>
        </div>
        <label className="upload">
          📤 Įkelti paveikslus
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => onFiles(e.target.files)}
          />
        </label>
        <button id="enterPointerLock" className="btn">🕹️ Valdyti pele</button>
      </div>

      {/* 3D scena */}
      <Canvas shadows camera={{ position: [0, 1.6, 5], fov: 60 }}>
        <XR>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 8, 5]} intensity={1.0} castShadow />
          <Sky sunPosition={[100, 20, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.01} />

          <Room />
          <GalleryArtworks images={images} />

          <FPSControls speed={5} />
          <Controllers />
          <Hands />
        </XR>
      </Canvas>

      <div className="center-bottom">
        <VRButton />
      </div>

      <div className="footer">
        {images.length > 0 ? `${images.length} paveikslai galerijoje` : "Galerija tuščia – įkelk paveikslus"}
      </div>
    </div>
  );
}