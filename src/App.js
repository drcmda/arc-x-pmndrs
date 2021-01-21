import * as THREE from 'three'
import React, { Suspense, useEffect, useRef, useState } from 'react'
import { createPortal, Canvas, useFrame } from 'react-three-fiber'
import { useGLTF, Circle, Text, OrbitControls } from 'drei'
import Particles from './shaders/Particles'
import usePostprocessing from './shaders/usePostprocessing'
import useReflector from './shaders/useReflector'
import './shaders/materials/ScreenMaterial'
import './shaders/materials/ReflectorMaterial'

function Button(props) {
  const { nodes, materials } = useGLTF('/arc-draco.glb')
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)
  useEffect(() => (document.body.style.cursor = hovered ? 'pointer' : 'auto'), [hovered])
  return (
    <mesh
      onClick={(e) => (e.stopPropagation(), setClicked(!clicked))}
      onPointerOver={(e) => (e.stopPropagation(), setHovered(true))}
      onPointerOut={() => setHovered(false)}
      material={materials['black.001']}
      geometry={nodes.Slice001.geometry}
      {...props}
      position-x={clicked ? -0.1 : 0}
    />
  )
}

function Model(props) {
  const group = useRef()
  const dotmaterial = useRef()
  const targetCamera = useRef()

  const { nodes, materials } = useGLTF('/arc-draco.glb')
  const [virtualScene] = useState(() => new THREE.Scene())
  const [meshRef, reflectorProps, passes] = useReflector()
  const screenProps = usePostprocessing(virtualScene, targetCamera.current, passes)

  const [pointer] = useState(() => new THREE.Vector3())
  useFrame(() => dotmaterial.current.pointer.lerp(pointer, 0.1))

  return (
    <>
      <orthographicCamera ref={targetCamera} args={[-20, 20, 20, -20]} />
      {createPortal(<Particles ref={dotmaterial} />, virtualScene)}
      <group ref={group} {...props} dispose={null}>
        <mesh material={materials.black} geometry={nodes.Cube.geometry} position={[0, 1, 0]} material-metalness={0.4}>
          <mesh
            material={materials['.Example Sheet_033.001']}
            geometry={nodes.Example_Sheet_033.geometry}
            position={[0.33, -0.36, 0.01]}
            rotation={[-Math.PI, 0, -Math.PI / 2]}
            material-color="#808080"
          />
          <mesh geometry={nodes.Slice.geometry}>
            <meshBasicMaterial transparent opacity={0.5} color="#60a0ff" />
            <Text
              position={[0.34, 1.7, 0.02]}
              rotation-y={Math.PI / 2}
              fontSize={0.05}
              lineHeight={1.2}
              font="https://fonts.gstatic.com/s/pressstart2p/v9/e3t4euO8T-267oIAQAu6jDQyK0nR.woff"
              children={`ARC4G\nx PMNDRS\n........`}
              color="#050505"
            />
          </mesh>
          <group position={[0.06, 0, 0]}>
            <Button position={[0, 0, 0]} />
            <Button position={[0, -0.47, 0]} />
            <Button position={[0, -0.95, 0]} />
          </group>
        </mesh>
        <mesh
          material={materials['Material.004']}
          geometry={nodes.Plane.geometry}
          position={[0, 1.6, 1.89]}
          rotation={[0, 0, -Math.PI / 2]}
          onPointerMove={(e) => pointer.copy(e.point)}>
          <mesh geometry={nodes.Plane.geometry} position-y={0.01} scale={[0.99, 0.99, 0.99]}>
            <screenMaterial color="#3c383a" roughness={0.18} metalness={0.7} envMapIntensity={0.4} {...screenProps} />
          </mesh>
        </mesh>
        <mesh geometry={nodes.Plane.geometry} position={[0.01, 1.6, 1.89]} rotation={[0, 0, -Math.PI / 2]} scale={[0.99, 0.1, 0.99]}></mesh>
        <mesh material={materials['black.002']} geometry={nodes.Plane002.geometry} position={[0, 1.6, 1.89]} rotation={[0, 0, -Math.PI / 2]} />
        <mesh material={materials['Material.001']} geometry={nodes.Plane003.geometry} scale={[11.8, 11.8, 11.8]} />
      </group>
      <Circle ref={meshRef} args={[12, 36, 36]} rotation-x={-Math.PI / 2} position-y={-1.39}>
        <reflectorMaterial transparent opacity={0.2} color="black" metalness={1} roughness={1} {...reflectorProps} />
      </Circle>
    </>
  )
}

export default function App() {
  return (
    <Canvas pixelRatio={[1, 1.5]} camera={{ position: [-4, 5, 7], fov: 35, near: 1, far: 15 }}>
      <ambientLight intensity={0.6} />
      <color attach="background" args={['#202020']} />
      <fog attach="fog" args={['#202020', 10, 15]} />
      <directionalLight position={[-10, 0, -15]} intensity={0.4} />
      <directionalLight position={[10, 10, 10]} intensity={0.4} />
      <Suspense fallback={null}>
        <Model position={[1, -1.4, 0]} rotation={[0, -Math.PI / 2, 0]} />
      </Suspense>
      <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 3} />
    </Canvas>
  )
}
