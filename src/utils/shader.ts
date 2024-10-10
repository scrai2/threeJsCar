const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D hdrMap;
  uniform float saturation;
  uniform vec3 tint;
  uniform float temperature;

  varying vec2 vUv;

  vec3 applySaturation(vec3 color, float saturation) {
    float luminance = dot(color, vec3(0.3, 0.59, 0.11));
    return mix(vec3(luminance), color, saturation);
  }

  vec3 applyTemperature(vec3 color, float temperature) {
    float t = temperature / 6500.0; // Scale the temperature
    return color * vec3(1.0 + t * 0.1, 1.0 - t * 0.1, 1.0 - t * 0.2);
  }

  void main() {
    vec3 hdrColor = texture2D(hdrMap, vUv).rgb;
    hdrColor = applySaturation(hdrColor, saturation);
    hdrColor = applyTemperature(hdrColor, temperature);
    gl_FragColor = vec4(hdrColor + tint, 1.0); // Add tint
  }
`;
