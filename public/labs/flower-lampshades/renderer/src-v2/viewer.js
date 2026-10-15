// Three.js scene. It knows nothing about flowers - it takes meshes from the
// generator and shows them as a lamp: a bulb inside, light through the wall,
// the petals' shadow on the floor. One material, because the shade is one
// thing: PLA, thin, lit from within.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createViewer(container, { still = false } = {}) {
  const MAIN_LAYER = 0;
  const SHADOW_LAYER = 1;
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: still });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0b0d);

  // A room around it, faintly, so the unlit shade still has an environment to
  // reflect and the translucent wall has something to refract.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;

  const camera = new THREE.PerspectiveCamera(34, 1, 1, 5000);
  camera.position.set(360, -440, 200);
  camera.up.set(0, 0, 1); // Z up: the print orientation, not the graphics default.

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.55; // not through the floor
  controls.target.set(0, 0, 110);

  // Auto-fit gets out of the way once the user has dollied: orbiting and
  // panning hold the distance constant, so a distance that changed across an
  // interaction can only have been a zoom, and that is a deliberate choice we
  // should not undo on the next slider tick.
  let userZoomed = false;
  let distanceAtStart = 0;
  controls.addEventListener('start', () => {
    distanceAtStart = camera.position.distanceTo(controls.target);
  });
  controls.addEventListener('end', () => {
    if (Math.abs(camera.position.distanceTo(controls.target) - distanceAtStart) > 0.5) {
      userZoomed = true;
    }
  });

  // A soft key from high and behind the camera, so the outside of the shade
  // has form when the lamp is off, and a cooler fill from the other side so a
  // lit wall is not washed flat - the ribs and the taper are the point, and
  // both are only visible as gradients.
  const key = new THREE.DirectionalLight(0xfff4e6, 1.1);
  key.position.set(300, -500, 650);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdbe4ff, 0.5);
  fill.position.set(-500, 300, 200);
  scene.add(fill);

  // The bulb: a point light roughly where an A60 filament sits above the
  // holder. It lights the wall but does not cast the floor shadow. Coupling
  // those jobs made the throat clip before the petal shadow became legible.
  // Three's lights are physical and the scene is in millimetres, so the
  // intensity is large by construction: irradiance falls as 1/d^2 in mm.
  const bulb = new THREE.PointLight(0xffe9c8, 0, 0, 2);
  bulb.position.set(0, 0, 85);
  scene.add(bulb);

  // A separate light supplies the floor illumination and shadow on its own
  // render layer. The shade is drawn with the dim bulb above, then invisible
  // copies of the parts cast into this light's shadow map in a second pass.
  // This keeps the shadow intensity independent of the transmitted wall.
  const shadowBulb = new THREE.PointLight(0xffe9c8, 0, 0, 2);
  shadowBulb.position.copy(bulb.position);
  shadowBulb.castShadow = true;
  shadowBulb.shadow.mapSize.set(1024, 1024);
  shadowBulb.shadow.camera.near = 20;
  shadowBulb.shadow.camera.far = 1500;
  shadowBulb.shadow.bias = -0.002;
  shadowBulb.shadow.radius = 4;
  shadowBulb.layers.set(SHADOW_LAYER);
  scene.add(shadowBulb);
  const bulbMesh = new THREE.Mesh(
    new THREE.SphereGeometry(28, 32, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff1d8 })
  );
  bulbMesh.position.copy(bulb.position);
  bulbMesh.visible = false;
  scene.add(bulbMesh);

  // A floor, so height reads as height and the shadow has somewhere to land.
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(1400, 96),
    new THREE.MeshStandardMaterial({ color: 0x232327, roughness: 0.95, metalness: 0 })
  );
  floor.position.z = -0.1;
  floor.receiveShadow = true;
  floor.layers.set(SHADOW_LAYER);
  floor.layers.enable(MAIN_LAYER);
  scene.add(floor);

  const parts = new THREE.Group();
  scene.add(parts);
  const shadowCasters = new THREE.Group();
  scene.add(shadowCasters);
  const shadowCasterMaterial = new THREE.MeshBasicMaterial({
    colorWrite: false,
    depthWrite: false,
  });

  const bounds = new THREE.Box3();
  const sphere = new THREE.Sphere();
  let fitted = false;
  let topView = false;
  let savedView = null;

  function fitDistance(radius) {
    // Fit the sphere in the narrower of the two half-angles: the vertical FOV
    // is fixed and the horizontal one follows the aspect, so a tall window is
    // limited by its width and a wide one by its height.
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    return (radius * 1.15) / Math.sin(Math.min(vFov, hFov) / 2);
  }

  /**
   * Point the camera at whatever is currently in `parts` and, unless the user
   * has zoomed, pull it back far enough to hold all of it. Called on rebuild
   * and on resize, because the framing depends on the aspect ratio too.
   */
  function fit() {
    if (!parts.children.length) return;
    bounds.setFromObject(parts);
    if (bounds.isEmpty()) return;
    bounds.getBoundingSphere(sphere);

    // Read the view direction before the target moves - that is what preserves
    // whatever the user orbited to.
    const direction = camera.position.clone().sub(controls.target).normalize();
    controls.target.copy(sphere.center);
    if (topView && userZoomed && fitted) {
      // A deliberate zoom wins over auto-fit even while Top is active. Move
      // both views to the current centre without changing either view's scale.
      savedView.target.copy(sphere.center);
      savedView.position.copy(savedView.target).addScaledVector(savedView.direction, savedView.distance);
      camera.position.copy(controls.target).addScaledVector(direction, savedView.distance);
      return;
    }
    if (!topView && userZoomed && fitted) return;

    const distance = fitDistance(sphere.radius);
    if (topView) {
      // Top is a temporary inspection mode. Keep its saved side direction,
      // but update that saved framing whenever current bounds or aspect change.
      savedView.target.copy(sphere.center);
      savedView.position.copy(savedView.target).addScaledVector(savedView.direction, distance);
    }
    camera.position.copy(controls.target).addScaledVector(direction, distance);
    fitted = true;
  }

  function render() {
    // OrbitControls caches the camera's up axis when it is constructed. The
    // locked top view uses a different up axis, so letting controls update it
    // would slowly pull the camera away from a true straight-down view.
    if (!topView) controls.update();

    // Three filters lights against the camera layer, so render the lamp and
    // its shadow separately. Keeping the first pass's depth buffer lets the
    // floor sit behind the lamp when the shadow pass is composited over it.
    camera.layers.set(MAIN_LAYER);
    renderer.render(scene, camera);
    const background = scene.background;
    scene.background = null;
    camera.layers.set(SHADOW_LAYER);
    renderer.autoClear = false;
    renderer.render(scene, camera);
    renderer.autoClear = true;
    camera.layers.set(MAIN_LAYER);
    scene.background = background;
  }

  let lastW = 0;
  let lastH = 0;
  function resize() {
    const { clientWidth: w, clientHeight: h } = container;
    // Bail on no-op resizes as well as zero ones: the observer fires for the
    // canvas we just sized, and reacting to that is how you get a feedback loop.
    if (!w || !h || (w === lastW && h === lastH)) return;
    lastW = w;
    lastH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    fit(); // The horizontal FOV just changed, so the framing has to be redone.
    if (still) render();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  // `still` renders once per change instead of every frame. It exists for
  // screenshots: a page that redraws forever never lets a headless browser
  // decide it has finished loading.
  if (!still) renderer.setAnimationLoop(render);

  return {
    scene,
    parts,
    render,
    clearParts() {
      // Shadow casters share their source mesh's BufferGeometry. Detach both
      // groups before disposing the unique visible geometries, exactly once.
      const geometries = new Set();
      parts.traverse((object) => {
        if (object.isMesh) geometries.add(object.geometry);
      });
      shadowCasters.clear();
      parts.clear();
      for (const geometry of geometries) geometry.dispose();
    },
    setTopView(on) {
      if (on === topView) return;

      if (on) {
        // Consume any damped orbit still in flight before recording the view,
        // so the first update after restoring it cannot apply stale motion.
        const damping = controls.enableDamping;
        controls.enableDamping = false;
        controls.update();
        controls.enableDamping = damping;
        savedView = {
          position: camera.position.clone(),
          target: controls.target.clone(),
          direction: camera.position.clone().sub(controls.target).normalize(),
          distance: camera.position.distanceTo(controls.target),
          up: camera.up.clone(),
          controlsEnabled: controls.enabled,
        };
        const distance = camera.position.distanceTo(controls.target);
        controls.enabled = false;
        camera.up.set(0, 1, 0);
        camera.position.copy(controls.target).addScaledVector(new THREE.Vector3(0, 0, 1), distance);
        camera.lookAt(controls.target);
      } else {
        camera.position.copy(savedView.position);
        controls.target.copy(savedView.target);
        camera.up.copy(savedView.up);
        camera.lookAt(controls.target);
        controls.enabled = savedView.controlsEnabled;
        savedView = null;
      }
      topView = on;
      if (still) render();
    },
    syncShadows(objects = parts.children) {
      shadowCasters.clear();
      for (const object of objects) {
        if (!object.castShadow || !object.isMesh) continue;
        const caster = new THREE.Mesh(object.geometry, shadowCasterMaterial);
        caster.position.copy(object.position);
        caster.quaternion.copy(object.quaternion);
        caster.scale.copy(object.scale);
        caster.castShadow = true;
        caster.layers.set(SHADOW_LAYER);
        shadowCasters.add(caster);
      }
    },
    setBulb(on) {
      bulb.intensity = on ? 30000 : 0;
      shadowBulb.intensity = on ? 3200000 : 0;
      bulbMesh.visible = on;
      if (still) render();
    },
    /** Put the bulb where an A60 filament sits, and re-fit the camera. */
    frame(shadeBottomZ = 0) {
      bulb.position.z = shadeBottomZ + 55;
      // Above and outside the shade, so the petals project onto the foreground
      // floor instead of the lower hardware turning into one central wedge.
      shadowBulb.position.set(0, 120, shadeBottomZ + 700);
      bulbMesh.position.z = bulb.position.z;
      fit();
      if (still) render();
    },
  };
}

/**
 * Convert a generator Mesh into a geometry with smooth normals and, if a
 * per-vertex wall thickness is given, a colour that darkens with it.
 *
 * The wall is not one thickness: it tapers to the margin and thickens along
 * the veins, and lit from inside that is exactly what shows - a thin margin
 * glows, a rib is a darker line. Three's transmission is tinted by the
 * diffuse colour, so a vertex colour is enough to carry that into the render
 * without touching the shader.
 */
export function toGeometry(mesh, wall = null) {
  // Worker results are already typed arrays; generator Mesh instances need
  // converting. Accept both so the hardware can stay local while the grown
  // shade crosses the worker boundary without being copied again.
  const { positions, indices } = typeof mesh.toTypedArrays === 'function' ? mesh.toTypedArrays() : mesh;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  if (wall) {
    const { thickness, min, max } = wall;
    const colours = new Float32Array(thickness.length * 3);
    const span = Math.max(max - min, 1e-6);
    for (let i = 0; i < thickness.length; i++) {
      const d = Math.min(1, Math.max(0, (thickness[i] - min) / span));
      // Thicker is darker and a touch warmer, the way PLA goes amber with depth.
      colours[i * 3] = 1 - 0.38 * d;
      colours[i * 3 + 1] = 1 - 0.45 * d;
      colours[i * 3 + 2] = 1 - 0.56 * d;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  }
  return geometry;
}

export function shadeMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xfaf6ee,
    vertexColors: true,
    side: THREE.DoubleSide,
    roughness: 0.55,
    metalness: 0,
    // Translucent, not transparent: PLA glows, it does not show what is behind.
    transmission: 0.55,
    thickness: 1.2,
    ior: 1.46,
    attenuationColor: new THREE.Color(0xffd9a6),
    attenuationDistance: 6,
    transparent: true,
    opacity: 0.98,
  });
}

export function hardwareMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.55, metalness: 0.15 });
}
