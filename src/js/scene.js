import * as THREE from 'three';
import { latLngToCartesian } from './utils.js';

function loadGeoJSON(data) {
    data.features.forEach(feature => {
        const coords = feature.geometry.coordinates[0];
        const shape = new THREE.Shape();

        coords.forEach(([lng, lat]) => {
            const { x, y } = latLngToCartesian(lat, lng);
            shape.lineTo(x, y);
        });

        const extrudeSettings = {
            steps: 1,
            depth: 20,  // Example height
            bevelEnabled: false
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const building = new THREE.Mesh(geometry, material);
        building.castShadow = true;
        building.receiveShadow = true;

        scene.add(building);
    });
}

// Initialize the scene, camera, and renderer
export function initScene() {
    const canvas = document.getElementById('threejs-canvas');
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    // Add directional light (sun) with shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(-50, 100, -50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Add ground plane to receive shadows
    const groundGeometry = new THREE.PlaneGeometry(5000, 5000);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

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
    });
}