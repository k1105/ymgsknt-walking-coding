import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// === Scene ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(5, 3, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// === Light ===
const ambient = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambient);

const key = new THREE.DirectionalLight(0xffffff, 1.5);
key.position.set(5, 10, 5);
scene.add(key);

const rim = new THREE.DirectionalLight(0x88aaff, 1.0);
rim.position.set(-5, 5, -5);
scene.add(rim);

// === OBJ Loader ===
const loader = new OBJLoader();
loader.load(
  'car.obj',
  (obj) => {
    // Auto-center and scale
    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    obj.position.sub(center);
    obj.scale.setScalar(3 / maxDim);

    // Apply a basic material to all meshes
    obj.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xcccccc,
          metalness: 0.7,
          roughness: 0.3,
        });
      }
    });

    scene.add(obj);
  },
  undefined,
  (err) => console.error('OBJ load error:', err)
);

// === Controls ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// === Post Processing ===
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  1.0,  // strength
  0.6,  // radius
  0.85  // threshold
);
composer.addPass(bloom);

composer.addPass(new OutputPass());

// === Animation Loop ===
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  composer.render();
}
animate();

// === Resize ===
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});
