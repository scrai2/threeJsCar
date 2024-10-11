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


const HDRIShader = {
  uniforms: {
    'tDiffuse': { value: null },
    'temperature': { value: 0.0 }, // Temperature adjustment (-1.0 to 1.0)
    'contrast': { value: 1.0 }, // Contrast adjustment
    'saturation': { value: 1.0 }, // Saturation adjustment
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float temperature;
    uniform float contrast;
    uniform float saturation;
    
    varying vec2 vUv;

    vec3 applyTemperature(vec3 color, float temp) {
      return vec3(color.r + temp * 0.1, color.g, color.b - temp * 0.1); // Adjust red and blue channels for warmth
    }

    vec3 applyContrast(vec3 color, float contrast) {
      return (color - 0.5) * contrast + 0.5;
    }

    vec3 applySaturation(vec3 color, float saturation) {
      float gray = dot(color, vec3(0.2126, 0.7152, 0.0722)); // Luminance conversion
      return mix(vec3(gray), color, saturation);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      color.rgb = applyTemperature(color.rgb, temperature);
      color.rgb = applyContrast(color.rgb, contrast);
      color.rgb = applySaturation(color.rgb, saturation);
      gl_FragColor = color;
    }
  `,
};
