precision highp float;

uniform float uTime;
uniform sampler2D uTextureA;
uniform sampler2D uTextureB;
uniform sampler2D uNoise;
uniform sampler2D uPaintNoise;
uniform sampler2D uDrawMap;
uniform sampler2D uBrushTexture;

varying vec2 vUv;

// Rotate UV coordinates
vec2 rotateUv(float degrees, vec2 center, vec2 uv) {
  float angle = radians(degrees);
  mat2 rotationMatrix = mat2(
    cos(angle), -sin(angle), 
    sin(angle), cos(angle)
  );
  vec2 translatedUv = uv - center;
  vec2 rotatedUv = rotationMatrix * translatedUv;
  return rotatedUv + center;
}

// Create paint-like diffusion around drawMap
float getPaintDiffusion(vec2 uv) {
  float baseDrawMap = texture2D(uDrawMap, uv).r;
  
  if (baseDrawMap > 0.1) {
    return baseDrawMap; // Already revealed area
  }
  
  // Use paint noise for diffusion effect
  vec2 noiseUv1 = rotateUv(uTime * 5.0, vec2(0.5), uv);
  vec2 noiseUv2 = rotateUv(uTime * -8.0, vec2(0.5), uv);
  
  float noise1 = texture2D(uPaintNoise, noiseUv1 * 15.0).r;
  float noise2 = texture2D(uPaintNoise, noiseUv2 * 25.0).r;
  float noise3 = texture2D(uPaintNoise, uv * 40.0).r; // Fine detail
  
  // Multiply for fractal-like behavior
  float combinedNoise = noise1 * noise2 * noise3;
  
  // Sample drawMap in multiple directions to detect nearby paint
  float radius = 0.08;
  float paintInfluence = 0.0;
  
  for (float angle = 0.0; angle < 6.28; angle += 0.785) { // 8 directions
    vec2 offset = vec2(cos(angle), sin(angle)) * radius;
    float nearbyPaint = texture2D(uDrawMap, uv + offset).r;
    paintInfluence = max(paintInfluence, nearbyPaint);
  }
  
  // Create organic paint bleeding effect
  float diffusion = paintInfluence * combinedNoise;
  diffusion = smoothstep(0.4, 0.8, diffusion);
  
  return diffusion * 0.5; // Subtle paint bleeding
}

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

float getRevealSdf(float radius) {
    vec2 center = vec2(-2.0, -2.0);
    vec2 uv = vUv * 2.0 - vec2(1., 1.);
    uv.x *= 1.0;
    float sdf = length(uv - center) - radius;
    return sdf;
}

void main() {
  // Get base drawMap
  // float baseReveal = texture2D(uDrawMap, vUv).r;
  
  // // Apply paint noise to all revealed areas to create organic edges
  // if (baseReveal > 0.01) {
  //   vec2 paintNoiseUv = vUv * 20.0 + uTime * 0.05;
  //   float paintNoise = texture2D(uPaintNoise, paintNoiseUv).r;
    
  //   // Make paint noise affect the edges more
  //   float edgeFactor = smoothstep(0.0, 1.0, baseReveal);
  //   baseReveal *= mix(0.5, 1.0, smoothstep(0.2, 0.8, paintNoise));
  // }
  
  // float paintDiffusion = getPaintDiffusion(vUv);
  // float reveal = max(baseReveal, paintDiffusion);
  
  // // Use cloud noise for unrevealed area displacement
  // vec2 cloudNoiseUV = vUv * 2.0 + uTime * 0.1;
  // float cloudNoise = texture2D(uNoise, cloudNoiseUV).r;
  // vec2 displacement = vec2((cloudNoise - 0.5) * 0.1);
  
  // // Apply cloud noise only to non-revealed areas
  // vec2 noiseDisplacement = displacement * (1.0 - reveal);
  
  // vec4 textureA = texture2D(uTextureA, vUv + noiseDisplacement);
  // vec4 textureB = texture2D(uTextureB, vUv + noiseDisplacement);
  
  // gl_FragColor = mix(textureA, textureB, reveal);


  //
  // HARDCODED TO CHANGE
  float revealFactor = 0.2;
  float aspectRatio = 0.8;

  vec2 brushUv = vUv * 8.0 * vec2(aspectRatio, 1.0);
  float brush = 1.0 - length(texture2D(uBrushTexture, brushUv).rgb);
  float depthBrushTransition = 0.2;
  float revealTransition = 0.1;
  //float revealDepth = getRevealSdf(0.1) + brush * depthBrushTransition;
  // float revealDepth = 0.5 + brush * depthBrushTransition;
  float revealF = valueRemap(revealFactor, 0.0, 1.0, 0.0 - depthBrushTransition, 1.7 + depthBrushTransition);
  float reveal = smoothstep(revealF, revealF + revealTransition, 1.0);
  vec2 drawUv = vUv + vec2(brush * 0.04);
  float drawFactor = texture2D(uDrawMap, drawUv).r;
  reveal = 1. - clamp(reveal - drawFactor, 0.0, 1.0);

  // gl_FragColor = vec4(vec3(reveal), 1.0);
  vec4 textureA = texture2D(uTextureA, vUv);
  vec4 textureB = texture2D(uTextureB, vUv);
  
  gl_FragColor = mix(textureA, textureB, reveal);
  // gl_FragColor = vec4(vec3(getRevealSdf(0.1)), 1.0);
}
