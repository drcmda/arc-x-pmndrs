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
  useEffect(() => (document.body.style.cursor = hovered ? 'pointer' : 'auto'), [hovered])
  return (
    <mesh
      onPointerOver={(e) => (e.stopPropagation(), setHovered(true))}
      onPointerOut={() => setHovered(false)}
      material={materials['black.001']}
      geometry={nodes.Slice001.geometry}
      {...props}
    />
  )
}

function Model(props) {
  const group = useRef()
  const dotmaterial = useRef()
  const targetCamera = useRef()
  const screen = useRef()
  const arm = useRef()

  const { nodes, materials } = useGLTF('/arc-draco.glb')
  const [virtualScene] = useState(() => new THREE.Scene())
  const [meshRef, reflectorProps, passes] = useReflector()
  const screenProps = usePostprocessing(virtualScene, targetCamera.current, passes)

  const [b1, setB1] = useState(false)
  const [b2, setB2] = useState(false)
  const [b3, setB3] = useState(false)

  const [color] = useState(() => new THREE.Color())
  const [pointer] = useState(() => new THREE.Vector3())
  useFrame(() => {
    dotmaterial.current.pointer.lerp(pointer, 0.1)
    screen.current.color.lerp(color.set(b1 ? '#60a0ff' : '#0c080a'), 0.1)
    arm.current.rotation.z = THREE.MathUtils.lerp(arm.current.rotation.z, -Math.PI / (b3 ? 3 : 2), 0.1)
  })

  return (
    <>
      <orthographicCamera ref={targetCamera} args={[-20, 20, 20, -20]} />
      {createPortal(<Particles ref={dotmaterial} speed={b2 ? 2 : 1} />, virtualScene)}
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
            <meshBasicMaterial transparent opacity={0.5} color="#60a0ff" toneMapped={false} />
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
            <Button onPointerUp={(e) => (e.stopPropagation(), setB1(!b1))} position={[b1 ? -0.04 : 0, 0, 0]} />
            <Button onPointerUp={(e) => (e.stopPropagation(), setB2(!b2))} position={[b2 ? -0.04 : 0, -0.47, 0]} />
            <Button onPointerUp={(e) => (e.stopPropagation(), setB3(!b3))} position={[b3 ? -0.04 : 0, -0.95, 0]} />
          </group>
        </mesh>
        <group ref={arm} position={[0, 1.6, 1.85]}>
          <mesh geometry={nodes.Plane.geometry} material={materials['Material.004']} onPointerMove={(e) => pointer.copy(e.point)}>
            <mesh geometry={nodes.Plane.geometry} position-y={0.01} scale={[0.99, 0.2, 0.99]}>
              <screenMaterial ref={screen} roughness={0.18} metalness={0.7} {...screenProps} />
            </mesh>
          </mesh>
          <mesh material={materials['black.002']} geometry={nodes.Plane002.geometry} />
        </group>
        <mesh material={materials['Material.001']} geometry={nodes.Plane003.geometry} scale={[11.8, 11.8, 11.8]} />
      </group>
      <Circle ref={meshRef} args={[2.75, 36, 36]} rotation-x={-Math.PI / 2} position={[1, -1.39, 0]}>
        <reflectorMaterial transparent opacity={0.5} color="black" metalness={1} roughness={1} {...reflectorProps} />
      </Circle>
    </>
  )
}

export default function App() {
  return (
    <Canvas pixelRatio={[1, 1.5]} camera={{ position: [-8, 4, 18], fov: 15, near: 1, far: 50 }}>
      <ambientLight intensity={1} />
      <color attach="background" args={['#151515']} />
      <fog attach="fog" args={['#151515', 20, 25]} />
      <directionalLight position={[-10, 0, -15]} intensity={0.2} />
      <directionalLight position={[10, 10, 10]} intensity={0.2} />
      <Suspense fallback={null}>
        <Model position={[1, -1.4, 0]} rotation={[0, -Math.PI / 2, 0]} />
      </Suspense>
      <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 3} />
    </Canvas>
  )
}
