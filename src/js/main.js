import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Initialize scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });

// Enable shadow maps in the renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10); // Adjust position to cast longer shadows
light.castShadow = true; // Enable shadows from the light source

// Configure shadow settings for the light
light.shadow.mapSize.width = 2048; // Higher resolution for sharper shadows
light.shadow.mapSize.height = 2048;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 500;
light.shadow.camera.left = -100;
light.shadow.camera.right = 100;
light.shadow.camera.top = 100;
light.shadow.camera.bottom = -100;

scene.add(light);

// Add an ambient light for softer general lighting
const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
scene.add(ambientLight);

// Initialize OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth rotation
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;

// Load geojson data
fetch('data/segment.geojson')
  .then(response => response.json())
  .then(data => {

    const allCoordinates = [];
    data.features.forEach(feature => {
      const coordinates = feature.geometry.coordinates[0];
      allCoordinates.push(...coordinates);
    });

    const minX = Math.min(...allCoordinates.map(coord => coord[0]));
    const maxX = Math.max(...allCoordinates.map(coord => coord[0]));
    const minY = Math.min(...allCoordinates.map(coord => coord[1]));
    const maxY = Math.max(...allCoordinates.map(coord => coord[1]));

    const center = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2
    };

    const scaleFactor = 1 / 5;

    data.features.forEach(feature => {
      const coordinates = feature.geometry.coordinates[0];
      const buildingLevels = 3;
      const buildingColor = 'cyan';

      const shape = new THREE.Shape();
      coordinates.forEach((coord, index) => {
        const x = (coord[0] - center.x) * scaleFactor;
        const y = (coord[1] - center.y) * scaleFactor;

        if (index === 0) {
          shape.moveTo(x, y);
        } else {
          shape.lineTo(x, y);
        }
      });

      shape.lineTo((coordinates[0][0] - center.x) * scaleFactor, (coordinates[0][1] - center.y) * scaleFactor);

      const extrudeSettings = {
        depth: buildingLevels * 3, // 3m per level
        bevelEnabled: false
      };
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

      const material = new THREE.MeshStandardMaterial({ color: buildingColor, metalness: 0.5, roughness: 0.5 });
      const mesh = new THREE.Mesh(geometry, material);

      // Enable shadows for the buildings
      mesh.castShadow = true;
      mesh.receiveShadow = true; // Buildings receive shadows as well

      scene.add(mesh);
    });

    // Add a ground plane to receive shadows
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.5 }); // Ground plane with shadow receiving capability
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);

    // ground.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
    ground.position.y = 0; // Set ground to y=0 for visibility
    ground.receiveShadow = true; // Ground receives shadows
    
    scene.add(ground);

    camera.position.set(0, 50, 100); // Adjust camera height
    camera.lookAt(0, 0, 0); // Look at the center
    animate();
  });

// Animate the scene
function animate() {
  requestAnimationFrame(animate);

  controls.update(); // Update controls
  renderer.render(scene, camera); // Render the scene with the camera
}

// Handle window resize
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
