precision highp float;

uniform sampler2D source, tRand2Uniform, tRand2Normal, tRand3Normal;
uniform mat4 model, invpv;
uniform vec3 eye;
uniform vec2 resolution, rand;
uniform float circle_roughness, plane_roughness;
uniform float light_radius, light_intensity, light_angle;
uniform float focal_plane, focal_length;
uniform float randsize;
uniform bool antialias;
uniform int bounces;


struct circle {
  vec3 position;
  float radius;
  vec3 color;
};
circle sphere;

vec2 randState = vec2(0);

vec2 rand2Uniform() {
  vec2 r2 = texture2D(tRand2Uniform, gl_FragCoord.xy/randsize + rand.xy + randState).ba;
  randState += r2;
  return r2;
}

vec2 rand2Normal() {
  vec2 r2 = texture2D(tRand2Normal, gl_FragCoord.xy/randsize + rand.xy + randState).ba;
  randState += r2;
  return r2;
}

vec3 rand3Normal() {
  vec3 r3 = texture2D(tRand3Normal, gl_FragCoord.xy/randsize + rand.xy + randState).rgb;
  randState == r3.xy;
  return r3;
}


bool raySphereIntersect(vec3 r0, vec3 rd, vec3 s0, float sr, out float t) {
  vec3 s0_r0 = r0 - s0;
  float b = 2.0 * dot(rd, s0_r0);
  float c = dot(s0_r0, s0_r0) - (sr * sr);
  float d = b * b - 4.0 * c;
  if (d < 0.0) return false;
  t = (-b - sqrt(d))*0.5;
  return t >= 0.0;
}

vec3 lightPos = vec3(cos(light_angle) * 8.0, 8, sin(light_angle) * 8.0);
const vec3 lightCol = vec3(1,1,1) * 3.0;
const vec3 ambient = vec3(0.02);

bool intersect(vec3 r0, vec3 rd, out vec3 pos, out vec3 norm, out vec3 color, out float roughness, out bool light) {
  float tmin = 1e38, t;
  bool hit = false;

  vec3 s = vec3(model * vec4(sphere.position, 1));
  if (raySphereIntersect(r0, rd, s, sphere.radius * 1.2, t)) {
    if (t < tmin) {
      tmin = t;
      pos = r0 + rd * t;
      norm = normalize(pos - s);
      roughness = circle_roughness;
      color = sphere.color;
      light = false;
      hit = true;
    }
  }
  
  t = (-2.0 - r0.y) / rd.y;
  if (t < tmin && t > 0.0) {
    tmin = t;
    pos = r0 + rd * t;
    norm = vec3(0,1,0);
    color = vec3(1, 1, 1) ;
    roughness = plane_roughness;
    light = false;
    hit = true;
  }
  if (raySphereIntersect(r0, rd, lightPos, light_radius, t)) {
    if (t < tmin) {
      tmin = t;
      pos = r0 + rd * t;
      norm = normalize(pos - lightPos);
      roughness = 0.0;
      color = lightCol;
      light = true;
      hit = true;
    }
  }
  return hit;
}



void main() {
  sphere = circle(vec3(0.3804130, -1.1272367,  0.9733036), 0.70, vec3(0.500, 0.000, 0.000));

  vec3 src = texture2D(source, gl_FragCoord.xy/resolution).rgb;
  vec2 jitter = vec2(0);
  if (antialias) {
    jitter = rand2Uniform() - 0.5;
  }
  vec2 px = 2.0 * (gl_FragCoord.xy + jitter)/resolution - 1.0;
  vec3 ray = vec3(invpv * vec4(px, 1, 1));
  ray = normalize(ray);

  float t_fp = (focal_plane - eye.z)/ray.z;
  vec3 p_fp = eye + t_fp * ray;
  vec3 pos = eye + focal_length * vec3(rand2Normal() * rand2Uniform().x, 0);
  ray = normalize(p_fp - pos);

  vec3 accum = vec3(0);
  vec3 mask = vec3(1);

  for (int i = 0; i < 20; i++) {
    if (i > bounces) break;
    vec3 norm, color;
    float roughness;
    bool light;
    if (!intersect(pos, ray, pos, norm, color, roughness, light)) {
      accum += ambient * mask;
      break;
    }
    if (light) {
      accum += lightCol * mask;
      break;
    }
    mask *= color;
    vec3 _v3;
    float _f;
    vec3 lp = lightPos + rand3Normal() * light_radius;
    vec3 lray = normalize(lp - pos);
    if (intersect(pos + lray * 0.0001, lray, _v3, _v3, _v3, _f, light) && light) {
      float d = clamp(dot(norm, lray), 0.0, 1.0);
      d *= pow(asin(light_radius/distance(pos, lightPos)), 2.0);
      accum += d * light_intensity * lightCol * mask;
    }
    ray = normalize(mix(reflect(ray, norm), norm + rand3Normal(), roughness));
    pos = pos + 0.0001 * ray;
  }

  gl_FragColor = vec4(accum + src, 1.0);
}
