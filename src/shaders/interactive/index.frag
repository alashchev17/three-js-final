precision highp float;

uniform float uTime;
uniform sampler2D uTextureA;
uniform sampler2D uTextureB;
uniform sampler2D uDrawMap;
uniform sampler2D uBrushTexture;
uniform float uRevealFactor;
uniform bool uInvertTextureA; // used to determine if we substract textureA or not

varying vec2 vUv;

float valueRemap(float value, float oldMin, float oldMax, float newMin, float newMax) {
    return newMin + (value - oldMin) * (newMax - newMin) / (oldMax - oldMin);
}
vec2 valueRemap(vec2 value, float oldMin, float oldMax, float newMin, float newMax) {
    return vec2(
    valueRemap(value.x, oldMin, oldMax, newMin, newMax), valueRemap(value.y, oldMin, oldMax, newMin, newMax)
    );
}
vec3 valueRemap(vec3 value, float oldMin, float oldMax, float newMin, float newMax) {
    return vec3(
    valueRemap(value.x, oldMin, oldMax, newMin, newMax), valueRemap(value.y, oldMin, oldMax, newMin, newMax), valueRemap(value.z, oldMin, oldMax, newMin, newMax)
    );
}

void main() {
  // HARDCODED TO CHANGE
  float revealFactor = uRevealFactor;
  float aspectRatio = 1.4;

  vec2 brushUv = vUv * 8.0 * vec2(aspectRatio, 1.0);
  float brush = 1.0 - length(texture2D(uBrushTexture, brushUv).rgb);
  float depthBrushTransition = 0.2;
  float revealTransition = 0.1;
  float revealF = valueRemap(revealFactor, 0.0, 1.0, 0.0 - depthBrushTransition, 1.7 + depthBrushTransition);
  float reveal = smoothstep(revealF, revealF + revealTransition, 1.0);
  vec2 drawUv = vUv + vec2(brush * 0.04);
  float drawFactor = texture2D(uDrawMap, drawUv).r;
  reveal = 1. - clamp(reveal - drawFactor, 0.0, 1.0);

  vec4 textureA;
  if (!uInvertTextureA) {
    textureA = 1. - texture2D(uTextureA, vUv) + 0.1; // inverting textureA, makes a nice map based on the 1.jpg in a mix with revealFactor
  } else {
    textureA = texture2D(uTextureA, vUv) + 0.1; // rendering normal textureA as we should
  }
  vec4 textureB = texture2D(uTextureB, vUv);
  
  gl_FragColor = mix(textureA, textureB, reveal);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
  #include <dithering_fragment>
}
