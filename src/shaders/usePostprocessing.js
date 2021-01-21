import * as THREE from 'three'
import { useMemo } from 'react'
import { useFrame, useThree } from 'react-three-fiber'
import { EffectComposer, RenderPass, EffectPass, DepthOfFieldEffect, SavePass } from 'postprocessing'

export default function usePostprocessing(scene, camera, extra = []) {
  const { gl } = useThree()
  const [composer, props] = useMemo(() => {
    const parameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, encoding: gl.outputEncoding }
    const renderTarget = new THREE.WebGLRenderTarget(800, 800, parameters)

    const composer = new EffectComposer(null)
    composer.autoRenderToScreen = false
    composer.renderer = gl
    composer.inputBuffer = renderTarget
    composer.outputBuffer = renderTarget.clone()
    composer.enableExtensions()

    const renderPass = new SavePass()
    const blurPass = new SavePass()
    const passes = [
      new RenderPass(scene, camera),    
      renderPass,
      new EffectPass(camera, new DepthOfFieldEffect(camera, { bokehScale: 2, focalLength: 0.0, focusDistance: 0.0, width: 200, height: 200 })),      
      blurPass
    ]
    passes.forEach((pass) => composer.addPass(pass))
    extra.forEach((pass) => {
      composer.addPass(pass)
      pass.setSize(100, 100)
    })
    return [composer, { tDiffuse: renderPass.renderTarget.texture, tDiffuseBlur: blurPass.renderTarget.texture }]
  }, [scene, camera])

  useFrame((state, delta) => {
    composer.render(delta)
    gl.setRenderTarget(null)
  })
  return props
}
