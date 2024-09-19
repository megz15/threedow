import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// Initialize scene
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

// Add lighting
const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.set(1, 1, 1).normalize()
scene.add(light)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true //smooth rotation
controls.dampingFactor = 0.25
controls.screenSpacePanning = false
// controls.maxPolarAngle = Math.PI / 2

// Load geojson data
fetch('data/segment.geojson')
  .then(response => response.json())
  .then(data => {

    const allCoordinates = []
    data.features.forEach(feature => {
      const coordinates = feature.geometry.coordinates[0]
      allCoordinates.push(...coordinates)
    })

    const minX = Math.min(...allCoordinates.map(coord => coord[0]))
    const maxX = Math.max(...allCoordinates.map(coord => coord[0]))
    const minY = Math.min(...allCoordinates.map(coord => coord[1]))
    const maxY = Math.max(...allCoordinates.map(coord => coord[1]))
    
    const center = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2
    }
    
    const scaleFactor = 1/5

    data.features.forEach(feature => {
      const coordinates = feature.geometry.coordinates[0]
      const buildingLevels = 3
      const buildingColor = 'cyan'

      const shape = new THREE.Shape()
      coordinates.forEach((coord, index) => {
        const x = (coord[0] - center.x) * scaleFactor
        const y = (coord[1] - center.y) * scaleFactor
      
        if (index === 0) {
          shape.moveTo(x, y)
        } else {
          shape.lineTo(x, y)
        }
      })

      shape.lineTo((coordinates[0][0] - center.x) * scaleFactor, (coordinates[0][1] - center.y) * scaleFactor)

      const extrudeSettings = {
        depth: buildingLevels * 3, // 3m per level (civil moment)
        bevelEnabled: false
      }
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)

      const material = new THREE.MeshBasicMaterial({ color: buildingColor })
      const mesh = new THREE.Mesh(geometry, material)

      scene.add(mesh)
    })

    camera.position.set(0, 0, 50)
    animate()
  })

function animate() {
  requestAnimationFrame(animate)

  controls.update()
  renderer.render(scene, camera)
}