import * as THREE from 'three';
import { latLngToCartesian } from './utils.js';

// Initialize the scene, camera, and renderer
export function initScene() {
    const canvas = document.getElementById('threejs-canvas');
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(70, 20, 50);

    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    // Add directional light (sun) with shadows
    // const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    // directionalLight.position.set(100, -50, 200);
    // directionalLight.castShadow = true;
    // scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);  // Soft white light
    scene.add(ambientLight);

    // Add ground plane to receive shadows
    const groundGeometry = new THREE.PlaneGeometry(5000, 5000);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Load and display the GeoJSON data
    loadGeoJSON(scene, 'data/export.geojson');

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    // Resize handling
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
    });
}

// Function to load and display GeoJSON data
function loadGeoJSON(scene, url) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            data.features.forEach(feature => {
                const coords = feature.geometry.coordinates[0];
                const shape = new THREE.Shape();

                // Add points to the shape based on building footprint coordinates
                coords.forEach(([lng, lat]) => {
                    const { x, y } = latLngToCartesian(lat, lng);
                    shape.lineTo(x, y);
                });

                // Extrude the 2D shape into 3D buildings
                const extrudeSettings = {
                    steps: 1,
                    depth: 20,  // Example building height
                    bevelEnabled: false
                };

                const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
                const buildingMesh = new THREE.Mesh(geometry, material);
                buildingMesh.castShadow = true;
                buildingMesh.receiveShadow = true;

                // Add the building mesh to the scene
                scene.add(buildingMesh);
            });
        })
        .catch(err => {
            console.error('Error loading GeoJSON:', err);
        });
}