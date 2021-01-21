import * as THREE from 'three'
import { extend } from 'react-three-fiber'

class DotMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      transparent: true,
      uniforms: { time: { value: 1 }, speed: { value: 1 }, pointer: { value: new THREE.Vector3() } },
      vertexShader: `
      uniform float time;
      uniform float speed;
      uniform vec3 pointer;
      attribute float size;
      varying float _size;

      float cubicPulse( float c, float w, float x ){
        x = abs(x - c);
        if( x>w ) return 0.0;
        x /= w;
        return 1.0 - x*x*(6.0 * speed-5.0 * speed*x);
      }

      void main() {
        float PI = 3.1415926538;
        float ROW = 150.;
        float COL = 150.;
        float NUM = ROW * COL;
        float x = position.x;
        float y = position.y;
        float id = position.z;

        float distance = length(vec2((x- pointer.y * 10. )/COL,(y + pointer.x * 10.)/ROW) - vec2(0.5));
        float maxDist = 0.01;
        float normDistance = (distance/maxDist) * 0.01;
        float amount = 0.06;
        float amount2 = 0.09;
        float pulse = cubicPulse(mix(0.1, 1. - amount, normDistance), amount, pow(mod((time / 8.), 1.), 1. + pow(normDistance, 2.)));    
        float pulse2 = cubicPulse(mix(0.1, 1. - amount2, normDistance), amount2, pow(mod((time / 4.), 1.), 1. + pow(normDistance, 2.)));    
        vec3 pos = vec3(
          x - pointer.y * 1.,
          y + pointer.x * 2.,
          30.0 * (pulse / mix(4., 1., (normDistance * 1.0)))+
          + 8.0* (pulse2 / mix(4., 1., (normDistance * 1.0)))+
            0.6 * (cos((8. * PI * (x - COL / 2.)) / COL + time) * sin((8. * PI * (y - ROW / 2.)) / ROW + time)) +
            0.4 * (cos((16. * PI * (x - COL / 2.)) / COL + time) * sin((16. * PI * (y - ROW / 2.)) / ROW + time))
        ) * speed;
        pos.z += -10.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0 );
        gl_PointSize = size;
        _size = gl_PointSize;
      }`,
      fragmentShader: `
      uniform float time;
      varying float _size;

      void main() {
        gl_FragColor = vec4(_size > 5.0 ? vec3(210., 180., 140.)/255.0: vec3(1.,1.,1.), step(length(gl_PointCoord.xy - vec2(0.5)), 0.5));
      }`
    })
  }
  get pointer() {
    return this.uniforms.pointer.value
  }
}

extend({ DotMaterial })
