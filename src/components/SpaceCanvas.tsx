import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createEffect, onCleanup, onMount } from 'solid-js';

interface SpaceCanvasProps {
  onLoaded?: () => void; // Callback to signal when canvas is loaded
}

export default function SpaceCanvas(props: SpaceCanvasProps) {
  let canvasRef: HTMLCanvasElement | undefined;

  onMount(() => {
    if (canvasRef) {
      initThreeJS(canvasRef, props.onLoaded);
    }
  });

  return (
    <canvas ref={canvasRef} id="space-canvas" />
  );
}

interface PlanetUserData {
  velocity: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
}

interface ShootingStarUserData {
  active: boolean;
  velocity: THREE.Vector3;
  timer: number;
  duration: number;
}

function initThreeJS(canvas: HTMLCanvasElement, onLoaded?: () => void) {
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;
  let stars: THREE.Points;
  let starMaterial: THREE.PointsMaterial;
  let shootingStars: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>[] = [];
  let planets: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>[] = [];
  const clock = new THREE.Clock();
  
  // Track loading state
  let assetsLoaded = 0;
  const totalAssets = 2; // Stars and planets
  
  function assetLoaded() {
    assetsLoaded++;
    if (assetsLoaded >= totalAssets && onLoaded) {
      // Small delay to ensure smooth transition
      setTimeout(() => onLoaded(), 500);
    }
  }
  
  // Zoom parameters
  const zoomSettings = {
    minFov: 30,
    maxFov: 110,
    defaultFov: 75,
    sensitivity: 0.05,
    smoothing: 0.1,
    targetFov: 75,
    currentFov: 75,
    autoZoomSpeed: 0.04,  // Speed of automatic zoom
    autoZoomAmount: 10,   // Range of automatic zoom
    autoZoomEnabled: true, // Flag to track if auto zoom is enabled
    lastUserInteraction: 0, // Track when user last interacted
    userInteractionTimeout: 3000, // Delay before auto zoom resumes after user interaction
    autoZoomDirection: 1 // 1 = zooming in, -1 = zooming out
  };

  // Create a circular texture for stars
  function createStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    
    if (context) {
      // Draw a radial gradient for a soft circle
      const gradient = context.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  // --- Initialization Function ---
  function init() {
    // 1. Scene Setup
    scene = new THREE.Scene();

    // 2. Camera Setup
    camera = new THREE.PerspectiveCamera(zoomSettings.defaultFov, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 50; // Start further back to see the scene
    zoomSettings.currentFov = zoomSettings.defaultFov;
    zoomSettings.targetFov = zoomSettings.defaultFov;

    // 3. Renderer Setup
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // Adjust for high-DPI screens

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Soft ambient light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // A directional light source
    directionalLight.position.set(5, 5, 5).normalize();
    scene.add(directionalLight);

    // 5. Controls (Optional: allows mouse interaction)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smooth camera movement
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 10;
    controls.maxDistance = 500;
    controls.enableZoom = false; // Disable default zoom to use our custom scroll zoom
    controls.enableRotate = false; // Optional: disable rotation for smoother experience

    // 6. Create Scene Objects
    createStars();
    createPlanets(5); // Create 5 planets
    createShootingStarPool(3); // Create a pool of 3 potential shooting stars

    // 7. Handle Window Resize and Scroll
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('wheel', onWheel, { passive: false });
  }

  // Handle zoom on wheel event
  function onWheel(event: WheelEvent) {
    event.preventDefault();
    
    // Reset auto zoom on user interaction
    zoomSettings.autoZoomEnabled = false;
    zoomSettings.lastUserInteraction = Date.now();
    
    // Adjust target FOV based on scroll direction
    const zoomAmount = event.deltaY * zoomSettings.sensitivity;
    zoomSettings.targetFov = THREE.MathUtils.clamp(
      zoomSettings.targetFov + zoomAmount,
      zoomSettings.minFov,
      zoomSettings.maxFov
    );
  }

  // Update camera FOV with smooth transition
  function updateCameraZoom(deltaTime: number) {
    // Check if auto zoom should be re-enabled
    if (!zoomSettings.autoZoomEnabled && 
        Date.now() - zoomSettings.lastUserInteraction > zoomSettings.userInteractionTimeout) {
      zoomSettings.autoZoomEnabled = true;
      // Set target FOV to current to prevent sudden jumps
      zoomSettings.targetFov = zoomSettings.currentFov;
    }
    
    // Apply auto zoom if enabled
    if (zoomSettings.autoZoomEnabled) {
      // Create a gentle oscillation for zoom effect
      const midFov = (zoomSettings.minFov + zoomSettings.maxFov) / 2;
      const zoomRange = zoomSettings.autoZoomAmount;
      
      // Oscillate between zooming in and out
      zoomSettings.targetFov += zoomSettings.autoZoomDirection * zoomSettings.autoZoomSpeed;
      
      // Change direction if we reach the limits
      if (zoomSettings.targetFov < midFov - zoomRange/2) {
        zoomSettings.autoZoomDirection = 1; // Start zooming out
      } else if (zoomSettings.targetFov > midFov + zoomRange/2) {
        zoomSettings.autoZoomDirection = -1; // Start zooming in
      }
      
      // Ensure we stay within our bounds
      zoomSettings.targetFov = THREE.MathUtils.clamp(
        zoomSettings.targetFov,
        zoomSettings.minFov,
        zoomSettings.maxFov
      );
    }
    
    // Apply smooth transition to current FOV
    if (Math.abs(zoomSettings.currentFov - zoomSettings.targetFov) > 0.01) {
      zoomSettings.currentFov += (zoomSettings.targetFov - zoomSettings.currentFov) * zoomSettings.smoothing;
      camera.fov = zoomSettings.currentFov;
      camera.updateProjectionMatrix();
    }
  }

  // --- Object Creation Functions ---

  // Create the starfield
  function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starVertices: number[] = [];
    const starSizes: number[] = []; // Store initial sizes for sparkling effect
    const numStars = 10000;

    // Create random star positions within a large sphere
    for (let i = 0; i < numStars; i++) {
      const x = THREE.MathUtils.randFloatSpread(1500); // Spread out in x
      const y = THREE.MathUtils.randFloatSpread(1500); // Spread out in y
      const z = THREE.MathUtils.randFloatSpread(1500); // Spread out in z
      starVertices.push(x, y, z);
      starSizes.push(Math.random() * 1.5 + 0.5); // Random initial size
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    starGeometry.setAttribute('initialSize', new THREE.Float32BufferAttribute(starSizes, 1)); // Store sizes

    // Material for the stars with circular texture
    starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      sizeAttenuation: true, // Size decreases with distance
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending, // Brighter where stars overlap
      map: createStarTexture() // Use our circular texture
    });

    stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    
    // Mark stars as loaded
    assetLoaded();
  }

  // Create planets
  function createPlanets(count: number) {
    const planetGeometry = new THREE.SphereGeometry(1, 32, 32); // Base geometry

    for (let i = 0; i < count; i++) {
      // Increased planet size range
      const size = THREE.MathUtils.randFloat(15, 30); // Bigger planets
      const planetMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(Math.random(), Math.random(), Math.random()), // Random color
        roughness: 0.8,
        metalness: 0.2
      });

      const planet = new THREE.Mesh(planetGeometry, planetMaterial);
      planet.scale.set(size, size, size); // Apply random size

      // Random initial position (further out than stars)
      planet.position.set(
        THREE.MathUtils.randFloatSpread(800),
        THREE.MathUtils.randFloatSpread(800),
        THREE.MathUtils.randFloatSpread(800) - 400 // Place some further back
      );

      // Assign random velocity for movement
      const userData: PlanetUserData = {
        velocity: new THREE.Vector3(
          THREE.MathUtils.randFloat(-0.05, 0.05),
          THREE.MathUtils.randFloat(-0.05, 0.05),
          THREE.MathUtils.randFloat(-0.05, 0.05)
        ),
        // Assign random rotation speed
        rotationSpeed: new THREE.Vector3(
          THREE.MathUtils.randFloat(-0.005, 0.005),
          THREE.MathUtils.randFloat(-0.005, 0.005),
          THREE.MathUtils.randFloat(-0.005, 0.005)
        )
      };
      
      planet.userData = userData;
      planets.push(planet);
      scene.add(planet);
    }
    
    // Mark planets as loaded
    assetLoaded();
  }

  // Create a pool of shooting star objects (lines)
  function createShootingStarPool(count: number) {
    for (let i = 0; i < count; i++) {
      const points = [];
      points.push(new THREE.Vector3(0, 0, 0)); // Start point
      points.push(new THREE.Vector3(0, 0, -10)); // End point (defines length)

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 2, // Note: linewidth might not work on all systems/drivers
        transparent: true,
        opacity: 0 // Start invisible
      });
      
      const line = new THREE.Line(geometry, material);
      const userData: ShootingStarUserData = {
        active: false,
        velocity: new THREE.Vector3(),
        timer: 0,
        duration: THREE.MathUtils.randFloat(0.5, 1.5) // How long it lives
      };
      
      line.userData = userData;
      shootingStars.push(line);
      scene.add(line);
    }
  }

  // --- Animation & Update Functions ---

  // Handle window resizing
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Animate stars (sparkling effect)
  function animateStars(deltaTime: number) {
    if (!stars) return;

    const time = clock.getElapsedTime();
    const positions = stars.geometry.attributes.position.array;
    const initialSizes = stars.geometry.attributes.initialSize.array;
    const numStars = stars.geometry.attributes.position.count;

    // Note: Directly modifying BufferAttribute arrays is generally discouraged
    // for performance. For a large number of stars, shaders are better.
    // This is a simpler approach for demonstration.

    // Instead of modifying attributes per frame, let's modulate the material size slightly
    const baseSize = 1.5;
    const sizeVariation = 0.5;
    starMaterial.size = baseSize + Math.sin(time * 2) * sizeVariation * 0.5; // Gentle overall pulse
    starMaterial.opacity = 0.7 + Math.sin(time * 1.5) * 0.1; // Slight opacity change

    // For individual sparkle (more intensive):
    // You could iterate through a *subset* of stars each frame and modify
    // their color or perceived size via shaders if performance becomes an issue.
  }

  // Animate planets (movement and rotation)
  function animatePlanets(deltaTime: number) {
    planets.forEach(planet => {
      const userData = planet.userData as PlanetUserData;
      // Move planet based on velocity
      planet.position.addScaledVector(userData.velocity, deltaTime * 10); // Adjust speed multiplier as needed

      // Rotate planet
      planet.rotation.x += userData.rotationSpeed.x;
      planet.rotation.y += userData.rotationSpeed.y;
      planet.rotation.z += userData.rotationSpeed.z;

      // Basic boundary check (wrap around) - very simple
      const boundary = 1000;
      if (Math.abs(planet.position.x) > boundary) planet.position.x *= -0.99; // Move back towards center slightly
      if (Math.abs(planet.position.y) > boundary) planet.position.y *= -0.99;
      if (Math.abs(planet.position.z) > boundary) planet.position.z *= -0.99;
    });
  }

  // Animate shooting stars
  function animateShootingStars(deltaTime: number) {
    // Chance to activate an inactive shooting star
    if (Math.random() < 0.01) { // Adjust probability as needed
      const inactiveStar = shootingStars.find(star => !(star.userData as ShootingStarUserData).active);
      if (inactiveStar) {
        const userData = inactiveStar.userData as ShootingStarUserData;
        // Reset position to a random point outside the main view
        const startX = THREE.MathUtils.randFloatSpread(1000);
        const startY = THREE.MathUtils.randFloat(200, 500) * (Math.random() < 0.5 ? 1 : -1); // Start high or low
        const startZ = THREE.MathUtils.randFloat(-500, -1000); // Start far away
        inactiveStar.position.set(startX, startY, startZ);

        // Set a random velocity vector (mostly horizontal/diagonal)
        userData.velocity.set(
          THREE.MathUtils.randFloat(-150, 150), // Horizontal speed
          THREE.MathUtils.randFloat(-50, 50),   // Vertical speed
          THREE.MathUtils.randFloat(200, 400)    // Speed towards camera
        );
        userData.velocity.normalize().multiplyScalar(THREE.MathUtils.randFloat(300, 500)); // Overall speed

        // Make it visible and reset timer
        inactiveStar.material.opacity = 1.0;
        userData.active = true;
        userData.timer = 0;
        userData.duration = THREE.MathUtils.randFloat(0.5, 1.5); // New duration
      }
    }

    // Update active shooting stars
    shootingStars.forEach(star => {
      const userData = star.userData as ShootingStarUserData;
      if (userData.active) {
        star.position.addScaledVector(userData.velocity, deltaTime);
        userData.timer += deltaTime;

        // Fade out towards the end of its life
        const lifeRatio = userData.timer / userData.duration;
        star.material.opacity = Math.max(0, 1.0 - lifeRatio * lifeRatio); // Fade out faster at the end

        // Deactivate if timer exceeds duration or goes too far
        if (userData.timer >= userData.duration || star.position.z > camera.position.z) {
          userData.active = false;
          star.material.opacity = 0; // Make invisible
        }
      }
    });
  }

  // --- Main Animation Loop ---
  let animationFrameId: number;
  
  function animate() {
    animationFrameId = requestAnimationFrame(animate); // Request next frame

    const deltaTime = clock.getDelta(); // Time since last frame

    updateCameraZoom(deltaTime); // Update the camera zoom based on scroll or auto-zoom
    animateStars(deltaTime);
    animatePlanets(deltaTime);
    animateShootingStars(deltaTime);

    controls.update(); // Update controls if damping is enabled
    renderer.render(scene, camera); // Render the scene
  }

  // Start the animation
  init();
  animate();

  // Clean up on component unmount (SolidJS lifecycle)
  onCleanup(() => {
    window.removeEventListener('resize', onWindowResize);
    window.removeEventListener('wheel', onWheel);
    cancelAnimationFrame(animationFrameId);
    renderer.dispose();
  });
}

