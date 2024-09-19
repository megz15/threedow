import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import 'leaflet';

// Initialize Leaflet map with OpenStreetMap tiles
const map = L.map('map').setView([17.49319309, 78.56584627], 18); // Adjust initial map position and zoom

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
}).addTo(map);

// Create a container to overlay the Three.js scene on top of Leaflet
const threeContainer = document.createElement('div');
threeContainer.style.position = 'absolute';
threeContainer.style.top = '0';
threeContainer.style.left = '0';
threeContainer.style.pointerEvents = 'none'; // Pass through mouse events to the map
threeContainer.style.width = '100%';
threeContainer.style.height = '100%';
document.body.appendChild(threeContainer);

// Initialize Three.js renderer, scene, and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true }); // Alpha to allow background map
renderer.setSize(window.innerWidth, window.innerHeight);
threeContainer.appendChild(renderer.domElement);

// Add lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1).normalize();
scene.add(light);

// Initialize OrbitControls for Three.js
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;

// Sync Three.js camera with Leaflet map
map.on('move', updateCamera);

function updateCamera() {
  const center = map.getCenter();
  const zoom = map.getZoom();
  
  // Adjust Three.js camera position based on Leaflet center and zoom
  const scaleFactor = 1000 / Math.pow(2, zoom);  // Scale according to zoom level
  camera.position.set(center.lng * scaleFactor, -center.lat * scaleFactor, 500);  // Adjust altitude
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}

// Load GeoJSON data and create 3D buildings
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
      y: (minY + maxY) / 2,
    };

    const scaleFactor = 1 / 50000; // Scale to match Leaflet's coordinate system

    data.features.forEach(feature => {
      const coordinates = feature.geometry.coordinates[0];
      const buildingLevels = 3; // Adjust building height
      const buildingColor = 'cyan'; // Building color

      // Create shape from GeoJSON coordinates
      const shape = new THREE.Shape();
      coordinates.forEach((coord, index) => {
        const latlng = L.latLng(coord[1], coord[0]); // Convert coordinates to Leaflet latlng
        const point = map.latLngToLayerPoint(latlng); // Convert latlng to map layer points

        const x = (point.x - center.x) * scaleFactor;
        const y = (point.y - center.y) * scaleFactor;

        if (index === 0) {
          shape.moveTo(x, y);
        } else {
          shape.lineTo(x, y);
        }
      });

      // Close the shape
      const firstPoint = map.latLngToLayerPoint(L.latLng(coordinates[0][1], coordinates[0][0]));
      shape.lineTo((firstPoint.x - center.x) * scaleFactor, (firstPoint.y - center.y) * scaleFactor);

      // Extrude the shape to create 3D geometry
      const extrudeSettings = {
        depth: buildingLevels * 3, // 3 meters per level
        bevelEnabled: false,
      };
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const material = new THREE.MeshBasicMaterial({ color: buildingColor });
      const mesh = new THREE.Mesh(geometry, material);

      scene.add(mesh);
    });

    camera.position.set(0, 0, 500); // Set initial camera position above the map
    animate();
  });

// Animate the Three.js scene
function animate() {
  requestAnimationFrame(animate);

  controls.update(); // Update controls
  renderer.render(scene, camera); // Render the scene with the camera
}

// Handle window resize for both Leaflet and Three.js
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});