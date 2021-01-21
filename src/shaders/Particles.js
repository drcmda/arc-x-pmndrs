import * as THREE from 'three'
import React, { useRef, useMemo } from 'react'
import { useFrame } from 'react-three-fiber'
import './materials/DotMaterial'

const ROW = 150
const COL = 150
const Particles = React.forwardRef(({ speed = 1 }, ref) => {
  const [coords, sizes] = useMemo(() => {
    const initialCoords = []
    const initialSizes = []
    let i = 0
    for (let y = 0; y < ROW; y += 1) {
      for (let x = 0; x < COL; x += 1) {
        initialCoords.push(x)
        initialCoords.push(y)
        initialCoords.push(i)
        initialSizes.push(Math.random() < 0.01 ? 8 : 2)
        i++
      }
    }
    const coords = new Float32Array(initialCoords)
    const sizes = new Float32Array(initialSizes)
    return [coords, sizes]
  }, [])

  const geom = useRef()
  useFrame((state) => {
    geom.current.material.uniforms.time.value = state.clock.elapsedTime
    geom.current.geometry.verticesNeedUpdate = true
    geom.current.material.uniforms.speed.value = THREE.MathUtils.lerp(geom.current.material.uniforms.speed.value, speed, 0.1)
  })

  return (
    <points ref={geom} position={[50, -15, 0]} rotation={[-Math.PI / 2.4, 0, Math.PI / 2.5]}>
      <bufferGeometry>
        <bufferAttribute attachObject={['attributes', 'position']} count={coords.length / 3} array={coords} itemSize={3} />
        <bufferAttribute attachObject={['attributes', 'size']} count={sizes.length} array={sizes} itemSize={1} />
      </bufferGeometry>
      <dotMaterial ref={ref} />
    </points>
  )
})

export default Particles
