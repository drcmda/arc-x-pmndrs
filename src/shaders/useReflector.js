import { useCallback, useMemo, useState } from 'react'
import * as THREE from 'three'
import { SavePass, RenderPass, LambdaPass, BlurPass } from 'postprocessing'
import { useResource, useThree } from 'react-three-fiber'

export default function useReflector(textureWidth = 128, textureHeight = 128) {
  const meshRef = useResource()
  const [reflectorPlane] = useState(() => new THREE.Plane())
  const [normal] = useState(() => new THREE.Vector3())
  const [reflectorWorldPosition] = useState(() => new THREE.Vector3())
  const [cameraWorldPosition] = useState(() => new THREE.Vector3())
  const [rotationMatrix] = useState(() => new THREE.Matrix4())
  const [lookAtPosition] = useState(() => new THREE.Vector3(0, 0, -1))
  const [clipPlane] = useState(() => new THREE.Vector4())
  const [view] = useState(() => new THREE.Vector3())
  const [target] = useState(() => new THREE.Vector3())
  const [q] = useState(() => new THREE.Vector4())
  const [textureMatrix] = useState(() => new THREE.Matrix4())
  const [virtualCamera] = useState(() => new THREE.PerspectiveCamera())
  const { gl, scene, camera, size } = useThree()

  const beforeRender = useCallback(() => {
    if (!meshRef.current) return
    meshRef.current.visible = false
    reflectorWorldPosition.setFromMatrixPosition(meshRef.current.matrixWorld)
    cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld)

    rotationMatrix.extractRotation(meshRef.current.matrixWorld)

    normal.set(0, 0, 1)
    normal.applyMatrix4(rotationMatrix)

    view.subVectors(reflectorWorldPosition, cameraWorldPosition)

    // Avoid rendering when reflector is facing away
    if (view.dot(normal) > 0) return

    view.reflect(normal).negate()
    view.add(reflectorWorldPosition)

    rotationMatrix.extractRotation(camera.matrixWorld)

    lookAtPosition.set(0, 0, -1)
    lookAtPosition.applyMatrix4(rotationMatrix)
    lookAtPosition.add(cameraWorldPosition)

    target.subVectors(reflectorWorldPosition, lookAtPosition)
    target.reflect(normal).negate()
    target.add(reflectorWorldPosition)

    virtualCamera.position.copy(view)
    virtualCamera.up.set(0, 1, 0)
    virtualCamera.up.applyMatrix4(rotationMatrix)
    virtualCamera.up.reflect(normal)
    virtualCamera.lookAt(target)

    virtualCamera.far = camera.far // Used in WebGLBackground

    virtualCamera.updateMatrixWorld()
    virtualCamera.projectionMatrix.copy(camera.projectionMatrix)

    // Update the texture matrix
    textureMatrix.set(0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0)
    textureMatrix.multiply(virtualCamera.projectionMatrix)
    textureMatrix.multiply(virtualCamera.matrixWorldInverse)
    textureMatrix.multiply(meshRef.current.matrixWorld)

    // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
    // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
    reflectorPlane.setFromNormalAndCoplanarPoint(normal, reflectorWorldPosition)
    reflectorPlane.applyMatrix4(virtualCamera.matrixWorldInverse)

    clipPlane.set(reflectorPlane.normal.x, reflectorPlane.normal.y, reflectorPlane.normal.z, reflectorPlane.constant)

    const projectionMatrix = virtualCamera.projectionMatrix

    q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0]
    q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5]
    q.z = -1.0
    q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14]

    // Calculate the scaled plane vector
    clipPlane.multiplyScalar(2.0 / clipPlane.dot(q))

    // Replacing the third row of the projection matrix
    projectionMatrix.elements[2] = clipPlane.x
    projectionMatrix.elements[6] = clipPlane.y
    projectionMatrix.elements[10] = clipPlane.z + 1.0
    projectionMatrix.elements[14] = clipPlane.w
  }, [
    meshRef,
    camera,
    reflectorPlane,
    normal,
    reflectorWorldPosition,
    cameraWorldPosition,
    rotationMatrix,
    lookAtPosition,
    clipPlane,
    view,
    target,
    q,
    textureMatrix,
    virtualCamera
  ])

  function afterRender() {
    if (!meshRef.current) return
    meshRef.current.visible = true
  }

  const [passes, props] = useMemo(() => {
    const parameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, encoding: gl.outputEncoding }
    const renderTarget = new THREE.WebGLRenderTarget(textureWidth, textureHeight, parameters)
    const renderPass = new RenderPass(scene, virtualCamera)
    const savePass = new SavePass(renderTarget)
    const lambdaPassBefore = new LambdaPass(beforeRender)
    const lambdaPassAfter = new LambdaPass(afterRender)
    const blurPass = new BlurPass({ width: 512, height: 512 })
    return [[lambdaPassBefore, renderPass, blurPass, savePass, lambdaPassAfter], { textureMatrix, tDiffuse: savePass.renderTarget.texture }]
  }, [size, gl, textureWidth, textureHeight, beforeRender, virtualCamera, scene, gl.outputEncoding])

  return [meshRef, props, passes]
}
