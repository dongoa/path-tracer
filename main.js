const Trackball = require('trackball-controller');
const createRenderer = require('./renderer');

const canvas = document.getElementById('render-canvas');
canvas.height = canvas.width = 512;

const renderer = createRenderer(canvas);
const Control = function() {
  this.resolution = 512;
  this.samples = 1;
  this.converge = true;
  this.antialias = true;
  this.circle_roughness = 0.0;
  this.plane_roughness = 0.0;
  this.light_radius = 4.0;
  this.light_intensity = 4.1;
  this.light_angle = 4.73;
  this.bounces = 3;
  this.focal_plane = 3.0;
  this.focal_length = 0.1;
}

const control = new Control();
const trackball = new Trackball(canvas, {
  drag: 0.05,
  onRotate: renderer.reset,
});
function loop() {
  const eye = [0, 0, 10];
  const target = [0, 0, 0];
  for (let i = 0; i < control.samples; i++) {
    renderer.sample({
      eye: eye,
      target: target,
      model: trackball.rotation,
      circle_roughness: control.circle_roughness,
      plane_roughness: control.plane_roughness,
      light_radius: control.light_radius,
      light_intensity: control.light_intensity,
      light_angle: control.light_angle,
      bounces: control.bounces,
      focal_plane: control.focal_plane,
      focal_length: control.focal_length,
      antialias: control.antialias,
    });
  }
  renderer.display();
  if (!control.converge) renderer.reset();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
