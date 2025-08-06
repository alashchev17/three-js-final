precision highp float;

uniform float uTime;
uniform vec2 uMouse; // normalized mouse coordinates
uniform vec2 uIntersectionUV; // UV coordinates of raycaster intersection
uniform float uMouseVelocity; // speed of mouse movement
uniform float uIsIntersecting; // 1.0 if intersecting, 0.0 if not
uniform sampler2D uTextureA;
uniform sampler2D uTextureB;
uniform sampler2D uNoise;

varying vec2 vUv;

void main() {
  float baseRadius = 0.1;
  float velocityRadius = uMouseVelocity * 1.2;
  float totalRadius = baseRadius + velocityRadius;
  
  float distance = length(vUv - uIntersectionUV);
  
  float reveal = 1.0 - smoothstep(totalRadius * 0.5, totalRadius, distance);
  
  reveal *= uIsIntersecting;
  
  vec2 noiseUV = vUv * 8.0 + uTime * 0.1;
  float noise = texture2D(uNoise, noiseUV).r;
  vec2 displacement = vec2((noise - 0.5) * 0.1);
  
  vec4 textureA = texture2D(uTextureA, vUv + displacement);
  vec4 textureB = texture2D(uTextureB, vUv + displacement);
  
  gl_FragColor = mix(textureA, textureB, reveal);
}
