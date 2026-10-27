import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const AnimatedCircuitBackground: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Track mouse and touch movement for subtle 3D parallax depth
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      mousePosRef.current = { x: nx, y: ny };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        const nx = (touch.clientX / window.innerWidth) * 2 - 1;
        const ny = (touch.clientY / window.innerHeight) * 2 - 1;
        mousePosRef.current = { x: nx * 0.4, y: ny * 0.4 };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  useEffect(() => {
    if (isReducedMotion || isPaused || !mountRef.current) return;

    const container = mountRef.current;
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;
    const isMobile = width < 768;

    // 1. THREE.JS SCENE & CAMERA SETUP (Responsive FOV & Camera Distance)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030712');
    scene.fog = new THREE.FogExp2('#030712', 0.016);

    const cameraFov = isMobile ? 60 : 40;
    const camera = new THREE.PerspectiveCamera(cameraFov, width / height, 0.1, 1000);
    const initialCamPos = isMobile ? new THREE.Vector3(0, 22, 28) : new THREE.Vector3(0, 17, 24);
    camera.position.copy(initialCamPos);
    camera.lookAt(0, 0, 0);

    // 2. RENDERER & PBR PIPELINE WITH SOFTWARE-GL & MOBILE OPTIMIZATION
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl && !isMobile,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    // Cap pixel ratio to save battery on high-DPI mobile screens
    const maxPixelRatio = isMobile ? 1.35 : 2;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, maxPixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = !isSoftwareGl && !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Procedural Studio Environment for realistic metallic reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    pmremGenerator.dispose();

    // 3. CINEMATIC LIGHTING RIG
    // Key Light (Warm Violet/Purple Studio Spotlight)
    const keyLight = new THREE.DirectionalLight('#c084fc', 2.8);
    keyLight.position.set(14, 25, 16);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.shadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 70;
      keyLight.shadow.camera.left = -20;
      keyLight.shadow.camera.right = 20;
      keyLight.shadow.camera.top = 20;
      keyLight.shadow.camera.bottom = -20;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    // Cool Rim/Fill Light (Cyan/Electric Blue)
    const fillLight = new THREE.DirectionalLight('#38bdf8', 1.4);
    fillLight.position.set(-16, 14, -12);
    scene.add(fillLight);

    // Soft Ambient Hemisphere Light (Dark Charcoal ground, Purple sky)
    const hemiLight = new THREE.HemisphereLight('#a855f7', '#020617', 0.9);
    scene.add(hemiLight);

    // Oscillating Cinematic Specular Light Sweep
    const sweepLight = new THREE.SpotLight('#f3e8ff', 3.2, 35, Math.PI / 5.5, 0.5, 1.2);
    sweepLight.position.set(-12, 16, 6);
    scene.add(sweepLight);

    // 4. WORKBENCH SURFACE & CIRCUIT TRACK
    const benchGroup = new THREE.Group();
    scene.add(benchGroup);

    // Dark Conductive ESD Mat Surface
    const matGeo = new THREE.PlaneGeometry(54, 44);
    const matMat = new THREE.MeshStandardMaterial({
      color: '#030712',
      roughness: 0.88,
      metalness: 0.08,
    });
    const matMesh = new THREE.Mesh(matGeo, matMat);
    matMesh.rotation.x = -Math.PI / 2;
    matMesh.receiveShadow = true;
    benchGroup.add(matMesh);

    // Precision ESD Grid lines
    const gridHelper = new THREE.GridHelper(50, 50, '#6d28d9', '#1e1b4b');
    gridHelper.position.y = 0.01;
    (gridHelper.material as THREE.Material).opacity = 0.22;
    (gridHelper.material as THREE.Material).transparent = true;
    benchGroup.add(gridHelper);

    // Circuit Track Waypoints (Rectangle with rounded corners)
    const trackPoints = [
      new THREE.Vector3(-12.5, 0.02, -7.5),
      new THREE.Vector3(12.5, 0.02, -7.5),
      new THREE.Vector3(12.5, 0.02, 7.5),
      new THREE.Vector3(-12.5, 0.02, 7.5),
    ];

    // Metallic Track Strip
    const trackCurve = new THREE.CatmullRomCurve3(trackPoints, true, 'catmullrom', 0.18);
    const trackGeo = new THREE.TubeGeometry(trackCurve, 140, 0.16, 8, true);
    const trackMat = new THREE.MeshStandardMaterial({
      color: '#7c3aed',
      roughness: 0.25,
      metalness: 0.85,
      emissive: '#4c1d95',
      emissiveIntensity: 0.45,
    });
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    benchGroup.add(trackMesh);

    // 5. PHYSICAL OBSTACLES AT WAYPOINTS (Where car stops & scans)
    const obstacleGroup = new THREE.Group();
    scene.add(obstacleGroup);

    // Obstacle 1: 9V Battery Block with metal snap terminals at Waypoint 0
    const batt9v = new THREE.Group();
    const batt9vBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 1.6, 0.7),
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.4, metalness: 0.3 })
    );
    batt9vBody.position.y = 0.8;
    batt9vBody.castShadow = true;
    // Gold stripe
    const battStripe = new THREE.Mesh(
      new THREE.BoxGeometry(1.01, 0.3, 0.71),
      new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.3, metalness: 0.7 })
    );
    battStripe.position.y = 1.2;
    // Terminal snaps
    const term1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.18, 12),
      new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.95, roughness: 0.1 })
    );
    term1.position.set(-0.25, 1.65, 0);
    const term2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.15, 6),
      new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.95, roughness: 0.1 })
    );
    term2.position.set(0.25, 1.65, 0);
    batt9v.add(batt9vBody, battStripe, term1, term2);
    batt9v.position.set(-12.5, 0, -7.5);
    obstacleGroup.add(batt9v);

    // Obstacle 2: Aluminum Canister Capacitor with safety vent at Waypoint 1
    const capObstacle = new THREE.Group();
    const capCan = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 1.5, 24),
      new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.85, roughness: 0.25 })
    );
    capCan.position.y = 0.75;
    capCan.castShadow = true;
    const capSleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.56, 0.56, 1.1, 24),
      new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.4 })
    );
    capSleeve.position.y = 0.65;
    capObstacle.add(capCan, capSleeve);
    capObstacle.position.set(12.5, 0, -7.5);
    obstacleGroup.add(capObstacle);

    // Obstacle 3: Electronics Breadboard Test Block at Waypoint 2
    const bbObstacle = new THREE.Group();
    const bbBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.4, 1.4),
      new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.7 })
    );
    bbBase.position.y = 0.2;
    bbBase.castShadow = true;
    // Little DIP chip on breadboard
    const dipChip = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.18, 0.4),
      new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.5 })
    );
    dipChip.position.y = 0.45;
    bbObstacle.add(bbBase, dipChip);
    bbObstacle.position.set(12.5, 0, 7.5);
    obstacleGroup.add(bbObstacle);

    // Obstacle 4: Calibrated Optical Obstacle Target Block at Waypoint 3
    const targetObstacle = new THREE.Group();
    const targetPillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.4, 0.8),
      new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.3, metalness: 0.4 })
    );
    targetPillar.position.y = 0.7;
    targetPillar.castShadow = true;
    // Hazard reflection face
    const targetFace = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.4, 0.82),
      new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.2, metalness: 0.6 })
    );
    targetFace.position.y = 0.7;
    targetObstacle.add(targetPillar, targetFace);
    targetObstacle.position.set(-12.5, 0, 7.5);
    obstacleGroup.add(targetObstacle);

    // 6. PROCEDURAL 3D ARDUINO ROBOT CAR (`THREE.Group`)
    const carGroup = new THREE.Group();
    scene.add(carGroup);

    // --- CAR CHASSIS: Black Laser-Cut Acrylic Platform ---
    const chassisShape = new THREE.Shape();
    const cw = 2.6, cl = 3.8, cr = 0.35;
    chassisShape.moveTo(-cw / 2 + cr, -cl / 2);
    chassisShape.lineTo(cw / 2 - cr, -cl / 2);
    chassisShape.quadraticCurveTo(cw / 2, -cl / 2, cw / 2, -cl / 2 + cr);
    chassisShape.lineTo(cw / 2, cl / 2 - cr);
    chassisShape.quadraticCurveTo(cw / 2, cl / 2, cw / 2 - cr, cl / 2);
    chassisShape.lineTo(-cw / 2 + cr, cl / 2);
    chassisShape.quadraticCurveTo(-cw / 2, cl / 2, -cw / 2, cl / 2 - cr);
    chassisShape.lineTo(-cw / 2, -cl / 2 + cr);
    chassisShape.quadraticCurveTo(-cw / 2, -cl / 2, -cw / 2 + cr, -cl / 2);

    const extrudeSettings = { depth: 0.14, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 };
    const chassisGeo = new THREE.ExtrudeGeometry(chassisShape, extrudeSettings);
    const chassisMat = new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.35, metalness: 0.4 });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    chassisMesh.rotation.x = Math.PI / 2;
    chassisMesh.position.y = 0.55;
    chassisMesh.castShadow = true;
    carGroup.add(chassisMesh);

    // --- WHEELS (Left & Right Rubber Tires with Yellow Gearbox Motor Hubs) ---
    const wheelRadius = 0.52;
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.32, 28);
    const tireMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.85 });
    const yellowHubMat = new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.5, roughness: 0.3 });

    // Left Wheel Assembly
    const leftWheel = new THREE.Group();
    const lwTire = new THREE.Mesh(wheelGeo, tireMat);
    lwTire.rotation.z = Math.PI / 2;
    lwTire.castShadow = true;
    const lwHub = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.34, 16), yellowHubMat);
    lwHub.rotation.z = Math.PI / 2;
    leftWheel.add(lwTire, lwHub);
    leftWheel.position.set(-1.45, 0.52, 0.3);
    carGroup.add(leftWheel);

    // Right Wheel Assembly
    const rightWheel = new THREE.Group();
    const rwTire = new THREE.Mesh(wheelGeo, tireMat);
    rwTire.rotation.z = Math.PI / 2;
    rwTire.castShadow = true;
    const rwHub = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.34, 16), yellowHubMat);
    rwHub.rotation.z = Math.PI / 2;
    rightWheel.add(rwTire, rwHub);
    rightWheel.position.set(1.45, 0.52, 0.3);
    carGroup.add(rightWheel);

    // Rear Omni Caster Ball Wheel
    const casterGeo = new THREE.SphereGeometry(0.26, 16, 16);
    const casterMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.95, roughness: 0.1 });
    const casterMesh = new THREE.Mesh(casterGeo, casterMat);
    casterMesh.position.set(0, 0.26, -1.35);
    carGroup.add(casterMesh);

    // --- ARDUINO UNO R3 BOARD (Accurate Layout & Components) ---
    const unoGroup = new THREE.Group();
    // Blue Arduino PCB
    const unoPcbGeo = new THREE.BoxGeometry(1.6, 0.08, 2.1);
    const unoPcbMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.35, metalness: 0.2 });
    const unoPcb = new THREE.Mesh(unoPcbGeo, unoPcbMat);
    unoPcb.castShadow = true;
    unoGroup.add(unoPcb);

    // USB-B Port (Shiny Silver Shielding)
    const usbMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.36, 0.46),
      new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.92, roughness: 0.15 })
    );
    usbMesh.position.set(-0.5, 0.22, -0.78);
    unoGroup.add(usbMesh);

    // 2.1mm DC Barrel Power Jack
    const dcJackMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.38, 0.52),
      new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.6 })
    );
    dcJackMesh.position.set(0.5, 0.22, -0.75);
    unoGroup.add(dcJackMesh);

    // ATmega328P DIP-28 Microcontroller IC Socket & Chip
    const chipMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.16, 1.15),
      new THREE.MeshStandardMaterial({ color: '#0b0f19', roughness: 0.7 })
    );
    chipMesh.position.set(0.22, 0.12, 0.15);
    unoGroup.add(chipMesh);

    // Female Pin Header Socket Strips (Digital & Analog rails)
    const headerMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.6 });
    const hDigital = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 1.45), headerMat);
    hDigital.position.set(-0.65, 0.18, 0.15);
    const hAnalog = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 1.45), headerMat);
    hAnalog.position.set(0.65, 0.18, 0.15);
    unoGroup.add(hDigital, hAnalog);

    // 16 MHz Quartz Crystal on Uno
    const unoCrystal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.22, 12),
      new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.95, roughness: 0.1 })
    );
    unoCrystal.rotation.z = Math.PI / 2;
    unoCrystal.position.set(-0.3, 0.1, -0.2);
    unoGroup.add(unoCrystal);

    // Board Status & Communication LEDs
    const ledGeo = new THREE.BoxGeometry(0.07, 0.05, 0.07);
    // ON (Power) LED - Red
    const onLed = new THREE.Mesh(ledGeo, new THREE.MeshBasicMaterial({ color: '#ef4444' }));
    onLed.position.set(-0.35, 0.08, -0.45);
    // TX LED - Green
    const txLedMat = new THREE.MeshBasicMaterial({ color: '#15803d' });
    const txLed = new THREE.Mesh(ledGeo, txLedMat);
    txLed.position.set(-0.15, 0.08, -0.45);
    // RX LED - Yellow
    const rxLedMat = new THREE.MeshBasicMaterial({ color: '#854d0e' });
    const rxLed = new THREE.Mesh(ledGeo, rxLedMat);
    rxLed.position.set(0.05, 0.08, -0.45);
    unoGroup.add(onLed, txLed, rxLed);

    unoGroup.position.set(0, 0.68, 0.15);
    carGroup.add(unoGroup);

    // --- L298N DUAL H-BRIDGE MOTOR DRIVER (Red PCB at Rear) ---
    const l298Group = new THREE.Group();
    const l298Pcb = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.08, 1.3),
      new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.4 })
    );
    // Large Aluminum Finned Heatsink
    const heatsink = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.65, 0.55),
      new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.88, roughness: 0.18 })
    );
    heatsink.position.y = 0.35;
    // Screw Terminal Blocks (Blue)
    const termBlock1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.25, 0.5),
      new THREE.MeshStandardMaterial({ color: '#2563eb', roughness: 0.5 })
    );
    termBlock1.position.set(-0.45, 0.15, 0);
    const termBlock2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.25, 0.5),
      new THREE.MeshStandardMaterial({ color: '#2563eb', roughness: 0.5 })
    );
    termBlock2.position.set(0.45, 0.15, 0);
    l298Group.add(l298Pcb, heatsink, termBlock1, termBlock2);
    l298Group.position.set(0, 0.68, -1.0);
    carGroup.add(l298Group);

    // --- 4xAA BATTERY HOLDER PACK ---
    const battHolder = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.45, 1.35),
      new THREE.MeshPhysicalMaterial({
        color: '#0284c7',
        roughness: 0.25,
        transmission: 0.5,
        ior: 1.45,
      })
    );
    battHolder.position.set(0, 0.95, -1.0);
    carGroup.add(battHolder);

    // =========================================================================
    // 7. HIGH-FIDELITY REALISTIC SENSORS
    // =========================================================================

    // -------------------------------------------------------------------------
    // SENSOR A: HC-SR04 ULTRASONIC SENSOR (Front Bumper with exact components)
    // -------------------------------------------------------------------------
    const hcsr04Group = new THREE.Group();

    // 1. Blue PCB Board (Exact 45mm x 20mm scale proportion)
    const hcsr04Pcb = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.65, 0.08),
      new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.35, metalness: 0.15 })
    );
    hcsr04Group.add(hcsr04Pcb);

    // 4 Corner Mounting Holes / Vias (Metallic rings)
    const viaPositions = [
      [-0.62, 0.24, 0.045],
      [0.62, 0.24, 0.045],
      [-0.62, -0.24, 0.045],
      [0.62, -0.24, 0.045],
    ];
    viaPositions.forEach(([vx, vy, vz]) => {
      const viaRing = new THREE.Mesh(
        new THREE.RingGeometry(0.03, 0.05, 12),
        new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.9, roughness: 0.2, side: THREE.DoubleSide })
      );
      viaRing.position.set(vx, vy, vz);
      hcsr04Group.add(viaRing);
    });

    // 2. Dual Aluminum Cylindrical Transducers:
    // Left: Transmitter ("T"), Right: Receiver ("R")
    const transCylGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.38, 24);
    const transAluMat = new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      metalness: 0.92,
      roughness: 0.15,
    });
    const meshFaceMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      roughness: 0.8,
    });
    const piezoCenterMat = new THREE.MeshStandardMaterial({
      color: '#cbd5e1',
      metalness: 0.85,
      roughness: 0.2,
    });

    // Helper to build an authentic transducer can
    const createTransducer = (xOffset: number, isTransmitter: boolean) => {
      const tGroup = new THREE.Group();

      // Aluminum Canister Shell
      const shell = new THREE.Mesh(transCylGeo, transAluMat);
      shell.rotation.x = Math.PI / 2;
      shell.position.z = 0.19;
      shell.castShadow = true;
      tGroup.add(shell);

      // Outer Bezel Rim at the front edge
      const bezel = new THREE.Mesh(
        new THREE.TorusGeometry(0.24, 0.02, 8, 24),
        transAluMat
      );
      bezel.position.z = 0.38;
      tGroup.add(bezel);

      // Recessed Acoustic Grill / Mesh Screen
      const meshScreen = new THREE.Mesh(
        new THREE.CircleGeometry(0.22, 20),
        meshFaceMat
      );
      meshScreen.position.z = 0.375;
      tGroup.add(meshScreen);

      // Center Microphone / Piezo Disc Button
      const piezoDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16),
        piezoCenterMat
      );
      piezoDisc.rotation.x = Math.PI / 2;
      piezoDisc.position.z = 0.385;
      tGroup.add(piezoDisc);

      // Stamp indicator: Transmitter ("T") or Receiver ("R") marker dot
      const stampDot = new THREE.Mesh(
        new THREE.RingGeometry(0.02, 0.04, 8),
        new THREE.MeshBasicMaterial({ color: isTransmitter ? '#38bdf8' : '#a855f7', side: THREE.DoubleSide })
      );
      stampDot.position.set(0, 0.14, 0.385);
      tGroup.add(stampDot);

      tGroup.position.x = xOffset;
      return tGroup;
    };

    const transmitterCan = createTransducer(-0.38, true);
    const receiverCan = createTransducer(0.38, false);
    hcsr04Group.add(transmitterCan, receiverCan);

    // 3. Central Quartz Crystal Oscillator Can (HC-49S package between T and R)
    const crystalGeo = new THREE.CapsuleGeometry(0.06, 0.24, 8, 12);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: '#f1f5f9',
      metalness: 0.95,
      roughness: 0.1,
    });
    const crystalCan = new THREE.Mesh(crystalGeo, crystalMat);
    crystalCan.rotation.z = Math.PI / 2;
    crystalCan.position.set(0, 0.08, 0.1);
    hcsr04Group.add(crystalCan);

    // 4. Quad Op-Amp IC Chip (LM324 / MAX232 equivalent on PCB)
    const opamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.18, 0.06),
      new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.6 })
    );
    opamp.position.set(0, -0.12, 0.05);
    hcsr04Group.add(opamp);

    // 5. 4-Pin Right-Angle Male Header at bottom (VCC, Trig, Echo, GND)
    const headerBlock = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.12, 0.12),
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.6 })
    );
    headerBlock.position.set(0, -0.32, 0.02);
    hcsr04Group.add(headerBlock);

    // 4 Gold Pins
    const pinGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.16, 8);
    const pinMat = new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.85, roughness: 0.2 });
    [-0.18, -0.06, 0.06, 0.18].forEach((px) => {
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.set(px, -0.4, 0.02);
      hcsr04Group.add(pin);
    });

    // Acrylic / Metal Mounting Bracket at Front Bumper
    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.5, 0.15),
      new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.6, roughness: 0.3 })
    );
    bracket.position.set(0, -0.15, -0.1);
    hcsr04Group.add(bracket);

    // Mount HC-SR04 at front of car chassis
    hcsr04Group.position.set(0, 0.72, 1.95);
    carGroup.add(hcsr04Group);

    // -------------------------------------------------------------------------
    // SENSOR B: DHT11 TEMPERATURE & HUMIDITY SENSOR (Blue Vented Slotted Housing)
    // -------------------------------------------------------------------------
    const dht11Group = new THREE.Group();
    // Signature Cyan/Blue Grid Housing
    const dht11Body = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.62, 0.24),
      new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.4 })
    );
    dht11Body.castShadow = true;
    dht11Group.add(dht11Body);

    // 4 Characteristic Louver Ventilation Slits on front face
    [-0.15, -0.05, 0.05, 0.15].forEach((sy) => {
      const slit = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.035, 0.02),
        new THREE.MeshStandardMaterial({ color: '#03396c', roughness: 0.9 })
      );
      slit.position.set(0, sy, 0.125);
      dht11Group.add(slit);
    });

    // 4 Pins at base
    const dhtPinGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.18, 8);
    [-0.15, -0.05, 0.05, 0.15].forEach((px) => {
      const p = new THREE.Mesh(dhtPinGeo, pinMat);
      p.position.set(px, -0.38, 0);
      dht11Group.add(p);
    });

    // Position DHT11 mounted on the left side mast of the car chassis
    dht11Group.position.set(-0.95, 0.9, 0.75);
    dht11Group.rotation.y = Math.PI / 4;
    carGroup.add(dht11Group);

    // -------------------------------------------------------------------------
    // SENSOR C: PIR MOTION SENSOR HC-SR501 (White Faceted Fresnel Lens)
    // -------------------------------------------------------------------------
    const pirGroup = new THREE.Group();
    // Green Base PCB
    const pirPcb = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.08, 0.72),
      new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.4 })
    );
    pirGroup.add(pirPcb);

    // White Translucent Faceted Dome Fresnel Lens
    const fresnelGeo = new THREE.SphereGeometry(0.28, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    const fresnelMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.5,
      metalness: 0.05,
      transparent: true,
      opacity: 0.92,
    });
    const fresnelDome = new THREE.Mesh(fresnelGeo, fresnelMat);
    fresnelDome.position.y = 0.04;
    fresnelDome.castShadow = true;
    pirGroup.add(fresnelDome);

    // Stepped concentric ring grooves of the Fresnel lens
    const fresnelRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.015, 6, 18),
      new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.4 })
    );
    fresnelRing.rotation.x = Math.PI / 2;
    fresnelRing.position.y = 0.15;
    pirGroup.add(fresnelRing);

    // Two Orange/Yellow Trimmer Potentiometers (Delay & Sensitivity) with cross screw slot
    const potGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.08, 12);
    const potMat = new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.4 });
    const potScrewMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.9, roughness: 0.2 });

    const pot1 = new THREE.Mesh(potGeo, potMat);
    pot1.position.set(-0.2, -0.06, 0.18);
    const screw1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), potScrewMat);
    screw1.position.set(-0.2, -0.1, 0.18);

    const pot2 = new THREE.Mesh(potGeo, potMat);
    pot2.position.set(0.2, -0.06, 0.18);
    const screw2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), potScrewMat);
    screw2.position.set(0.2, -0.1, 0.18);

    pirGroup.add(pot1, screw1, pot2, screw2);

    // Mount PIR Sensor on the right side mast of the car chassis
    pirGroup.position.set(0.95, 0.95, 0.75);
    pirGroup.rotation.y = -Math.PI / 4;
    carGroup.add(pirGroup);

    // -------------------------------------------------------------------------
    // SENSOR D: IR OBSTACLE / LINE TRACKING SENSORS (Under Front Bumper)
    // -------------------------------------------------------------------------
    const irSensorGroup = new THREE.Group();
    // Dual Diode Pair: Clear Blue IR Emitter + Glossy Black Phototransistor Receiver
    const irEmitter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.16, 12),
      new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.85 })
    );
    irEmitter.rotation.x = Math.PI / 2;
    irEmitter.position.set(-0.1, 0, 0.08);

    const irReceiver = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.16, 12),
      new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.2, metalness: 0.8 })
    );
    irReceiver.rotation.x = Math.PI / 2;
    irReceiver.position.set(0.1, 0, 0.08);

    const irPcb = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.06, 0.6),
      new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.4 })
    );
    irSensorGroup.add(irEmitter, irReceiver, irPcb);
    irSensorGroup.position.set(0, 0.38, 1.6);
    carGroup.add(irSensorGroup);

    // -------------------------------------------------------------------------
    // REALISTIC DUPONT JUMPER WIRES (Curved 3D Splines connecting to Arduino & Motor)
    // -------------------------------------------------------------------------
    // 4 Wires from HC-SR04 to Arduino Pins (Red: VCC, Yellow: Trig, Cyan: Echo, Black: GND)
    const hcsr04Wires = [
      { color: '#ef4444', start: new THREE.Vector3(-0.18, 0.35, 1.95), end: new THREE.Vector3(-0.55, 0.85, 0.6) }, // VCC -> 5V
      { color: '#eab308', start: new THREE.Vector3(-0.06, 0.35, 1.95), end: new THREE.Vector3(-0.55, 0.85, 0.2) }, // Trig -> Pin 9
      { color: '#06b6d4', start: new THREE.Vector3(0.06, 0.35, 1.95), end: new THREE.Vector3(-0.55, 0.85, 0.0) },  // Echo -> Pin 10
      { color: '#1e293b', start: new THREE.Vector3(0.18, 0.35, 1.95), end: new THREE.Vector3(-0.55, 0.85, 0.8) },  // GND -> GND
    ];

    hcsr04Wires.forEach(({ color, start, end }) => {
      const midPoint = new THREE.Vector3(
        (start.x + end.x) * 0.5 + (Math.random() - 0.5) * 0.15,
        Math.max(start.y, end.y) + 0.35 + Math.random() * 0.1,
        (start.z + end.z) * 0.5
      );
      const wireCurve = new THREE.CatmullRomCurve3([start, midPoint, end]);
      const wireGeo = new THREE.TubeGeometry(wireCurve, 20, 0.022, 6, false);
      const wireMat = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.2 });
      const wireMesh = new THREE.Mesh(wireGeo, wireMat);
      carGroup.add(wireMesh);
    });

    // Jumper Wires from L298N Motor Driver to Arduino Digital PWM pins
    const motorWires = [
      { color: '#8b5cf6', start: new THREE.Vector3(-0.3, 0.8, -0.9), end: new THREE.Vector3(-0.55, 0.85, -0.2) },
      { color: '#ec4899', start: new THREE.Vector3(0.3, 0.8, -0.9), end: new THREE.Vector3(-0.55, 0.85, -0.4) },
      { color: '#10b981', start: new THREE.Vector3(0.1, 0.8, -0.9), end: new THREE.Vector3(0.55, 0.85, 0.3) },
    ];
    motorWires.forEach(({ color, start, end }) => {
      const midPoint = new THREE.Vector3(
        (start.x + end.x) * 0.5,
        1.25,
        (start.z + end.z) * 0.5
      );
      const wireCurve = new THREE.CatmullRomCurve3([start, midPoint, end]);
      const wireGeo = new THREE.TubeGeometry(wireCurve, 16, 0.022, 6, false);
      const wireMat = new THREE.MeshStandardMaterial({ color, roughness: 0.45 });
      carGroup.add(new THREE.Mesh(wireGeo, wireMat));
    });

    // =========================================================================
    // 8. DUAL-WAVE ULTRASONIC SCANNING & REFLECTION SYSTEM
    // =========================================================================
    const sonarGroup = new THREE.Group();
    scene.add(sonarGroup);

    interface SonarWave {
      mesh: THREE.Mesh;
      origin: THREE.Vector3;
      direction: THREE.Vector3;
      distance: number;
      maxDistance: number;
      isEcho: boolean;
      life: number;
    }
    const activeSonarWaves: SonarWave[] = [];

    // Trigger an ultrasonic ping pulse from Transmitter ('T') and scheduled echo reflection from Obstacle
    const triggerUltrasonicPing = (carPos: THREE.Vector3, carAngle: number, obstaclePos: THREE.Vector3) => {
      // 1. Transmit Wave from 'T' Transducer (Cyan Arc)
      const forwardDir = new THREE.Vector3(Math.sin(carAngle), 0, Math.cos(carAngle)).normalize();
      const tOrigin = new THREE.Vector3(-0.38, 0.72, 1.95).applyAxisAngle(new THREE.Vector3(0, 1, 0), carAngle).add(carPos);

      const transWaveGeo = new THREE.RingGeometry(0.1, 0.22, 24, 1, -Math.PI * 0.3, Math.PI * 0.6);
      const transWaveMat = new THREE.MeshBasicMaterial({
        color: '#38bdf8',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
      });
      const transWaveMesh = new THREE.Mesh(transWaveGeo, transWaveMat);
      transWaveMesh.rotation.x = Math.PI / 2;
      transWaveMesh.rotation.z = -carAngle - Math.PI / 2;
      transWaveMesh.position.copy(tOrigin);
      sonarGroup.add(transWaveMesh);

      const distToObstacle = tOrigin.distanceTo(obstaclePos);
      activeSonarWaves.push({
        mesh: transWaveMesh,
        origin: tOrigin.clone(),
        direction: forwardDir.clone(),
        distance: 0,
        maxDistance: distToObstacle,
        isEcho: false,
        life: 1.0,
      });

      // 2. Schedule Reflected Echo Wave from the Obstacle back to Receiver ('R')
      setTimeout(() => {
        if (!container) return;
        const echoOrigin = obstaclePos.clone();
        echoOrigin.y = 0.72;
        const returnDir = forwardDir.clone().negate();

        const echoWaveGeo = new THREE.RingGeometry(0.12, 0.2, 20, 1, -Math.PI * 0.35, Math.PI * 0.7);
        const echoWaveMat = new THREE.MeshBasicMaterial({
          color: '#c084fc',
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        });
        const echoWaveMesh = new THREE.Mesh(echoWaveGeo, echoWaveMat);
        echoWaveMesh.rotation.x = Math.PI / 2;
        echoWaveMesh.rotation.z = -carAngle + Math.PI / 2;
        echoWaveMesh.position.copy(echoOrigin);
        sonarGroup.add(echoWaveMesh);

        activeSonarWaves.push({
          mesh: echoWaveMesh,
          origin: echoOrigin,
          direction: returnDir,
          distance: 0,
          maxDistance: distToObstacle,
          isEcho: true,
          life: 1.0,
        });
      }, 350);
    };

    // =========================================================================
    // 9. 3D MINIATURE ARTICULATED ROBOTIC ARM (In Background)
    // =========================================================================
    const armGroup = new THREE.Group();
    armGroup.position.set(11.5, 0, -10.5);
    scene.add(armGroup);

    // Turntable Base
    const armBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.3, 1.5, 0.35, 24),
      new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.75, roughness: 0.25 })
    );
    armBase.position.y = 0.175;
    armGroup.add(armBase);

    // Shoulder Pivot & Lower Arm Segment
    const shoulderGroup = new THREE.Group();
    shoulderGroup.position.set(0, 0.35, 0);

    const lowerLink = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 2.4, 0.35),
      new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.65, roughness: 0.3 })
    );
    lowerLink.position.y = 1.2;
    shoulderGroup.add(lowerLink);
    armGroup.add(shoulderGroup);

    // Elbow Pivot & Upper Arm Segment
    const elbowGroup = new THREE.Group();
    elbowGroup.position.set(0, 2.4, 0);

    const upperLink = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 2.0, 0.28),
      new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.65, roughness: 0.3 })
    );
    upperLink.position.y = 1.0;
    elbowGroup.add(upperLink);
    shoulderGroup.add(elbowGroup);

    // Gripper Claws with Picked Sensor Component
    const clawLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.65, 0.09),
      new THREE.MeshStandardMaterial({ color: '#c084fc', metalness: 0.85, roughness: 0.15 })
    );
    clawLeft.position.set(-0.2, 2.1, 0);

    const clawRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.65, 0.09),
      new THREE.MeshStandardMaterial({ color: '#c084fc', metalness: 0.85, roughness: 0.15 })
    );
    clawRight.position.set(0.2, 2.1, 0);

    // Mini Sensor breakout held in claw
    const heldSensor = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.12, 0.38),
      new THREE.MeshStandardMaterial({ color: '#38bdf8', metalness: 0.7, roughness: 0.2, emissive: '#0284c7', emissiveIntensity: 0.6 })
    );
    heldSensor.position.set(0, 2.3, 0);
    elbowGroup.add(clawLeft, clawRight, heldSensor);

    // =========================================================================
    // 10. LAB WORKBENCH PROPS (Soldering Station, Components, Breadboard)
    // =========================================================================
    const propsGroup = new THREE.Group();
    scene.add(propsGroup);

    // Large Breadboard with Jumper Wire Links
    const bbGeo = new THREE.BoxGeometry(4.0, 0.2, 2.2);
    const bbMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.65 });
    const bbMesh = new THREE.Mesh(bbGeo, bbMat);
    bbMesh.position.set(-11, 0.1, -11.5);
    bbMesh.rotation.y = Math.PI / 6;
    propsGroup.add(bbMesh);

    // Additional Sensors on Workbench: Spare PIR & DHT11 for Student Testing
    const benchDht11 = dht11Group.clone();
    benchDht11.position.set(-11.5, 0.2, -10.5);
    benchDht11.rotation.set(0, Math.PI / 3, 0);
    propsGroup.add(benchDht11);

    // Resistors with Color Bands on Workbench
    const resGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.45, 12);
    const resMat = new THREE.MeshStandardMaterial({ color: '#fde047', roughness: 0.4 });
    const r1 = new THREE.Mesh(resGeo, resMat); r1.rotation.z = Math.PI / 2; r1.position.set(-8, 0.07, -12);
    const r2 = new THREE.Mesh(resGeo, resMat); r2.rotation.x = Math.PI / 2; r2.position.set(-7, 0.07, -11.5);
    propsGroup.add(r1, r2);

    // --- TAB VISIBILITY HANDLING ---
    let isTabVisible = true;
    const handleVisibilityChange = () => {
      isTabVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // =========================================================================
    // 11. BELIEVABLE SENSOR KINEMATICS & CONTROL LOOP
    // =========================================================================
    let progress = 0;
    const timer = new THREE.Timer();
    let txLedTimer = 0, rxLedTimer = 0;
    let sonarCooldown = 0;
    let pauseTimer = 0;
    let currentWheelAngle = 0;

    const tick = () => {
      if (!isTabVisible) return;

      const delta = Math.min(timer.getDelta(), 0.1);
      const time = timer.getElapsed();

      // 1. Cinematic Specular Light Sweep
      sweepLight.position.x = Math.sin(time * 0.7) * 16;
      sweepLight.position.z = Math.cos(time * 0.5) * 11;

      // 2. Mouse Parallax Damping for subtle 3D depth
      const targetCamX = initialCamPos.x + mousePosRef.current.x * 2.2;
      const targetCamY = initialCamPos.y + mousePosRef.current.y * 1.5;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 4, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 4, delta);
      camera.lookAt(0, 0, 0);

      // 3. Track Progression & Kinematics
      const currentPoint = trackCurve.getPointAt(progress);
      const lookAheadProgress = (progress + 0.015) % 1.0;
      const nextPoint = trackCurve.getPointAt(lookAheadProgress);

      // Identify closest obstacle to check distance
      let closestObstacle = trackPoints[0];
      let minDistance = 999;
      trackPoints.forEach((pt) => {
        const d = currentPoint.distanceTo(pt);
        if (d < minDistance) {
          minDistance = d;
          closestObstacle = pt;
        }
      });

      // Ultrasonic Detection Thresholds
      const isApproaching = minDistance < 3.2;
      const isInScanZone = minDistance < 1.7;

      // Believable Car Motion Logic:
      // When entering scan zone, car pauses smoothly, scans with HC-SR04, then steers and continues
      let currentSpeed = 0.032; // Normal cruising speed

      if (isInScanZone) {
        if (pauseTimer < 1.6) {
          pauseTimer += delta;
          currentSpeed = 0.0; // Full pause during sensor inspection
        } else {
          currentSpeed = 0.018; // Slow crawl out of the turn
          if (minDistance > 1.8) {
            pauseTimer = 0; // Reset once cleared
          }
        }
      } else if (isApproaching) {
        // Smooth deceleration when approaching obstacle
        currentSpeed = THREE.MathUtils.lerp(0.012, 0.032, (minDistance - 1.7) / 1.5);
      } else {
        pauseTimer = 0;
      }

      // Advance progress
      const distanceMoved = currentSpeed * delta;
      progress = (progress + distanceMoved) % 1.0;

      // Update Car Position
      carGroup.position.copy(currentPoint);

      // Update Car Orientation (Steering towards path)
      const targetAngle = Math.atan2(nextPoint.x - currentPoint.x, nextPoint.z - currentPoint.z);
      // Add slight scanning sweep when paused at obstacle
      let steerAngle = targetAngle;
      if (pauseTimer > 0.3 && pauseTimer < 1.4) {
        steerAngle += Math.sin((pauseTimer - 0.3) * Math.PI * 2) * 0.12;
      }
      carGroup.rotation.y = THREE.MathUtils.damp(carGroup.rotation.y, steerAngle, 7, delta);

      // Rotate Wheel tires in EXACT synchronization with ground distance traveled
      // (rotation = distanceMoved / wheelRadius)
      if (currentSpeed > 0.0001) {
        const trackLength = 80; // approximate perimeter
        const physicalDistance = distanceMoved * trackLength;
        const wheelDeltaRot = physicalDistance / wheelRadius;
        currentWheelAngle += wheelDeltaRot;
        leftWheel.rotation.x = currentWheelAngle;
        rightWheel.rotation.x = currentWheelAngle;
      }

      // Ultrasonic Sonar Wave Emission & LED Burst
      sonarCooldown -= delta;
      if (isInScanZone && sonarCooldown <= 0) {
        triggerUltrasonicPing(carGroup.position, carGroup.rotation.y, closestObstacle);
        sonarCooldown = 0.75; // Ping interval
        txLedTimer = 0.22;
        setTimeout(() => {
          rxLedTimer = 0.25;
        }, 350);
      }

      // Arduino LED Indicators update
      if (txLedTimer > 0) {
        txLedTimer -= delta;
        txLedMat.color.set('#22c55e');
      } else {
        txLedMat.color.set('#15803d');
      }

      if (rxLedTimer > 0) {
        rxLedTimer -= delta;
        rxLedMat.color.set('#facc15');
      } else {
        rxLedMat.color.set('#854d0e');
      }

      // 4. Update Active Ultrasonic Sonar Wave Rings
      for (let i = activeSonarWaves.length - 1; i >= 0; i--) {
        const wave = activeSonarWaves[i];
        wave.distance += delta * 6.5;
        wave.life -= delta * 1.4;

        // Expand arc scale
        const scale = 1.0 + wave.distance * 1.8;
        wave.mesh.scale.set(scale, scale, scale);

        // Move along direction vector
        const stepPos = wave.origin.clone().addScaledVector(wave.direction, wave.distance);
        wave.mesh.position.x = stepPos.x;
        wave.mesh.position.z = stepPos.z;

        (wave.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, wave.life * 0.85);

        if (wave.life <= 0 || wave.distance >= wave.maxDistance + 1.2) {
          sonarGroup.remove(wave.mesh);
          wave.mesh.geometry.dispose();
          (wave.mesh.material as THREE.Material).dispose();
          activeSonarWaves.splice(i, 1);
        }
      }

      // 5. Robotic Arm Pick-and-Place Kinematics Cycle
      const armPhase = (time * 0.55) % (Math.PI * 2);
      shoulderGroup.rotation.z = Math.sin(armPhase) * 0.22 - 0.08;
      elbowGroup.rotation.z = Math.cos(armPhase) * 0.28 + 0.18;
      armGroup.rotation.y = Math.sin(armPhase * 0.4) * 0.45;

      const clawGap = Math.abs(Math.sin(armPhase * 2)) * 0.09 + 0.14;
      clawLeft.position.x = -clawGap;
      clawRight.position.x = clawGap;
      heldSensor.visible = Math.sin(armPhase) > -0.25;

      // 6. Render Frame
      renderer.render(scene, camera);
    };

    let animationFrameId: number;
    const animate = (timestamp?: number) => {
      timer.update(timestamp);
      tick();
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Resize Handler with responsive FOV & pixel ratio
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      const mobile = width < 768;
      camera.fov = mobile ? 60 : 40;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const pr = isSoftwareGl ? 1 : (mobile ? Math.min(window.devicePixelRatio, 1.35) : Math.min(window.devicePixelRatio, 2));
      renderer.setPixelRatio(pr);
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      // Clean up sonar wave meshes
      activeSonarWaves.forEach((w) => {
        sonarGroup.remove(w.mesh);
        w.mesh.geometry.dispose();
        (w.mesh.material as THREE.Material).dispose();
      });

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isReducedMotion, isPaused]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-slate-950">
      {!isReducedMotion ? (
        <div ref={mountRef} className="absolute inset-0 w-full h-full opacity-95" />
      ) : (
        <div className="absolute inset-0 bg-slate-950 bg-[radial-gradient(ellipse_at_center,rgba(109,40,217,0.15)_0%,rgba(3,7,18,1)_80%)]" />
      )}

      {/* Sensor Legend & Motion pause/play toggle dock at bottom-left */}
      <div className="pointer-events-auto absolute bottom-3 left-3 z-20 flex items-center gap-2">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="text-[11px] font-mono font-medium text-slate-300 hover:text-white bg-slate-900/85 backdrop-blur-md border border-slate-800 hover:border-slate-700 px-2.5 py-1.5 rounded-lg shadow-lg transition-colors cursor-pointer flex items-center gap-1.5"
          title={isPaused ? 'Resume 3D robotics lab scene' : 'Pause 3D robotics scene'}
        >
          <span>{isPaused ? '▶' : '⏸'}</span>
          <span>{isPaused ? 'Resume Lab' : 'Pause Lab'}</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            HC-SR04 Sonar
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            DHT11
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            PIR Dome
          </span>
        </div>
      </div>
    </div>
  );
};
