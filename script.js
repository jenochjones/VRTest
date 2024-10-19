// Import Three.js and necessary addons
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

let scene, camera, renderer, cube, controller1, controller2;
let grabState = { isGrabbing: false, controller: null };
let scaleState = { isScaling: false, startDistance: null };

init();
animate();

function init() {
    // Set up scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333333);

    // Set up camera
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 3); // Place camera at a comfortable VR height

    // Set up renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(VRButton.createButton(renderer));
    document.getElementById('scene-container').appendChild(renderer.domElement);

    // Create a cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Add light
    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(5, 5, 5);
    scene.add(light);

    // Set up VR controllers
    controller1 = renderer.xr.getController(0);
    controller2 = renderer.xr.getController(1);
    scene.add(controller1);
    scene.add(controller2);

    controller1.addEventListener('selectstart', onSelectStart);
    controller1.addEventListener('selectend', onSelectEnd);
    controller2.addEventListener('selectstart', onSelectStart);
    controller2.addEventListener('selectend', onSelectEnd);

    window.addEventListener('resize', onWindowResize);
}

function onSelectStart(event) {
    const controller = event.target;
    if (grabState.isGrabbing) return;
    
    const intersects = getIntersections(controller, [cube]);
    if (intersects.length > 0) {
        grabState.isGrabbing = true;
        grabState.controller = controller;
        controller.attach(cube);
    }
}

function onSelectEnd(event) {
    if (!grabState.isGrabbing || grabState.controller !== event.target) return;
    grabState.isGrabbing = false;
    scene.attach(cube);
}

function getIntersections(controller, objects) {
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    
    const raycaster = new THREE.Raycaster();
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    return raycaster.intersectObjects(objects);
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    if (grabState.isGrabbing) {
        const distanceBetweenControllers = controller1.position.distanceTo(controller2.position);
        if (scaleState.isScaling) {
            const scaleRatio = distanceBetweenControllers / scaleState.startDistance;
            cube.scale.set(scaleRatio, scaleRatio, scaleRatio);
        } else if (controller1.grip.buttonPressed && controller2.grip.buttonPressed) {
            scaleState.isScaling = true;
            scaleState.startDistance = distanceBetweenControllers;
        }
    } else {
        scaleState.isScaling = false;
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
