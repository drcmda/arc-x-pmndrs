import { extend } from 'react-three-fiber'
import { MeshPhysicalMaterial } from 'three'

class ScreenMaterial extends MeshPhysicalMaterial {
  _tDiffuse
  _tDiffuseBlur
  constructor(parameters = {}) {
    super(parameters)
    this.setValues(parameters)
    this._tDiffuse = { value: null }
    this._tDiffuseBlur = { value: null }
  }

  onBeforeCompile(shader) {
    shader.uniforms.tDiffuse = this._tDiffuse
    shader.uniforms.tDiffuseBlur = this._tDiffuseBlur
    shader.vertexShader = `
        varying vec2 my_vUv;
      ${shader.vertexShader}
    `
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `
        #include <project_vertex>
        my_vUv.y = uv.x*3.15-2.0;
        my_vUv.x = uv.y*2.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        `
    )
    shader.fragmentShader = `
        uniform sampler2D tDiffuse;
        uniform sampler2D tDiffuseBlur;
        varying vec2 my_vUv;
        ${shader.fragmentShader}
    `
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `
        #include <dithering_fragment>
        vec4 textureMap = texture2D(tDiffuse, my_vUv);
        vec4 textureBlur = texture2D(tDiffuseBlur, my_vUv);
        vec2 bbb = abs(my_vUv - 0.5);
        float mixFactor = smoothstep(0.0, 0.4, bbb.y);
        textureBlur *= 0.5 + 0.5 * (1.0-mixFactor);
        gl_FragColor += smoothstep(0.0, 1.0, mix(textureMap, textureBlur, mixFactor));
       `
    )
  }
  get tDiffuse() {
    return this._tDiffuse.value
  }
  set tDiffuse(v) {
    this._tDiffuse.value = v
  }
  get tDiffuseBlur() {
    return this._tDiffuseBlur.value
  }
  set tDiffuseBlur(v) {
    this._tDiffuseBlur.value = v
  }
}

extend({ ScreenMaterial })
