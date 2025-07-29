import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import Stats from 'https://cdn.jsdelivr.net/npm/three@0.149.0/examples/jsm/libs/stats.module.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
document.body.appendChild(renderer.domElement);
renderer.setSize(window.innerWidth, window.innerHeight);

const stats = Stats();
document.body.appendChild(stats.dom);

// === Player ===
const player = new THREE.Object3D();
player.position.set(0, 0, 0);
scene.add(player);

// === Luz ===
const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 2, 3);
scene.add(directionalLight);

// === Chunks ===
const loader = new GLTFLoader();
const loadedChunks = {};
const loadingChunks = new Set(); // Para evitar requisições duplicadas
const visibleRadius = 2; // Aumentado para carregar mais chunks
const CHUNK_SIZE = 1500;

// Chunks disponíveis (gerados pelo script Python)
const AVAILABLE_CHUNKS = new Set();
for (let x = -2; x <= 2; x++) {
  for (let z = -2; z <= 2; z++) {
    AVAILABLE_CHUNKS.add(`${x}_${z}`);
  }
}

function getChunkId(x, z) {
  return `${x}_${z}`;
}

function isChunkAvailable(x, z) {
  return AVAILABLE_CHUNKS.has(getChunkId(x, z));
}

function loadChunk(x, z) {
  const chunkId = getChunkId(x, z);
  
  // Verifica se já está carregado ou carregando
  if (loadedChunks[chunkId] || loadingChunks.has(chunkId)) return;
  
  // Verifica se o chunk existe
  if (!isChunkAvailable(x, z)) return;

  // Marca como carregando para evitar múltiplas requisições
  loadingChunks.add(chunkId);

  loader.load(
    `chunks/${chunkId}.glb`, 
    gltf => {
      // Posiciona o chunk corretamente
      gltf.scene.position.set(x * CHUNK_SIZE, 0, z * CHUNK_SIZE);
      scene.add(gltf.scene);
      loadedChunks[chunkId] = gltf.scene;
      loadingChunks.delete(chunkId);
      updateUI();
    },
    undefined,
    error => {
      console.warn(`Erro ao carregar chunk ${chunkId}:`, error);
      loadingChunks.delete(chunkId);
    }
  );
}

function unloadChunk(x, z) {
  const chunkId = getChunkId(x, z);
  const chunk = loadedChunks[chunkId];
  
  if (!chunk || typeof chunk === 'string') return;

  scene.remove(chunk);
  
  // Limpa geometria e materiais para evitar vazamentos de memória
  chunk.traverse(child => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(mat => mat.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
  
  delete loadedChunks[chunkId];
  updateUI();
}

function updateChunks() {
  const px = Math.floor(player.position.x / CHUNK_SIZE);
  const pz = Math.floor(player.position.z / CHUNK_SIZE);

  const needed = new Set();

  // Carrega chunks necessários
  for (let dx = -visibleRadius; dx <= visibleRadius; dx++) {
    for (let dz = -visibleRadius; dz <= visibleRadius; dz++) {
      const cx = px + dx;
      const cz = pz + dz;
      const id = getChunkId(cx, cz);
      needed.add(id);
      loadChunk(cx, cz);
    }
  }

  // Remove chunks desnecessários
  Object.keys(loadedChunks).forEach(id => {
    if (!needed.has(id) && typeof loadedChunks[id] !== 'string') {
      const [cx, cz] = id.split('_').map(Number);
      unloadChunk(cx, cz);
    }
  });
}

// === Controles de movimento ===
const keys = { w: false, a: false, s: false, d: false };

// Alterna entre primeira e terceira pessoa com C
document.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  if (keys.hasOwnProperty(key)) {
    keys[key] = true;
  }
  
  if (key === 'c') {
    cameraMode = cameraMode === 'first' ? 'third' : 'first';
    updateUI();
  }
});

document.addEventListener('keyup', e => {
  const key = e.key.toLowerCase();
  if (keys.hasOwnProperty(key)) {
    keys[key] = false;
  }
});

// === Mouse look ===
let yaw = 0;
let pitch = 0;
let pointerLocked = false;
let cameraMode = 'third'; // 'first' ou 'third'

document.body.addEventListener('click', () => {
  renderer.domElement.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === renderer.domElement;
});

document.addEventListener('mousemove', e => {
  if (!pointerLocked) return;
  
  const sensitivity = 0.002;
  yaw -= e.movementX * sensitivity;
  pitch -= e.movementY * sensitivity;
  
  // Limita o pitch
  pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));
});

// Alterna entre primeira e terceira pessoa com C
document.addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'c') {
    cameraMode = cameraMode === 'first' ? 'third' : 'first';
  }
});

// === UI ===
function updateUI() {
  const positionElement = document.getElementById('position');
  const chunksElement = document.getElementById('chunks');
  const cameraModeElement = document.getElementById('camera-mode');
  
  if (positionElement) {
    const chunkX = Math.floor(player.position.x / CHUNK_SIZE);
    const chunkZ = Math.floor(player.position.z / CHUNK_SIZE);
    positionElement.textContent = `${Math.round(player.position.x)}, ${Math.round(player.position.z)} (Chunk: ${chunkX}, ${chunkZ})`;
  }
  
  if (chunksElement) {
    const loadedCount = Object.keys(loadedChunks).filter(id => typeof loadedChunks[id] !== 'string').length;
    const loadingCount = loadingChunks.size;
    chunksElement.textContent = `${loadedCount} carregados, ${loadingCount} carregando`;
  }
  
  if (cameraModeElement) {
    cameraModeElement.textContent = cameraMode === 'first' ? '1ª Pessoa' : '3ª Pessoa';
  }
}

// === Inicialização ===
const clock = new THREE.Clock();

// Configuração inicial da câmera
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Carrega chunks iniciais
updateChunks();
updateUI();

// === Loop de animação ===
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const speed = 200; // Velocidade aumentada para chunk maior


  stats.update();
  let moved = false;
  const dir = new THREE.Vector3();

  // Movimento baseado nas teclas pressionadas
  if (keys.w) dir.z -= 1;
  if (keys.s) dir.z += 1;
  if (keys.a) dir.x -= 1;
  if (keys.d) dir.x += 1;

  if (dir.lengthSq() > 0) {
    dir.normalize();
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    player.position.addScaledVector(dir, speed * delta);
    moved = true;
  }

  // Atualiza chunks apenas se o jogador mudou de chunk significativamente
  const currentChunkX = Math.floor(player.position.x / CHUNK_SIZE);
  const currentChunkZ = Math.floor(player.position.z / CHUNK_SIZE);
  
  if (moved) {
    // Só atualiza chunks se mudou de chunk ou é a primeira vez
    if (!window.lastChunkX || !window.lastChunkZ || 
        currentChunkX !== window.lastChunkX || 
        currentChunkZ !== window.lastChunkZ) {
      updateChunks();
      window.lastChunkX = currentChunkX;
      window.lastChunkZ = currentChunkZ;
    }
    updateUI();
  }

  // Atualiza rotação do player
  player.rotation.y = yaw;

  // Sistema de câmera melhorado
  if (cameraMode === 'first') {
    // Primeira pessoa - câmera na posição do player
    const playerHeight = 15;
    camera.position.copy(player.position);
    camera.position.y += playerHeight;
    
    // Direção baseada em yaw e pitch
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
    direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    
    const lookTarget = camera.position.clone().add(direction);
    camera.lookAt(lookTarget);
    
  } else {
    // Terceira pessoa - câmera atrás do player
    const distance = 15;
    const height = 15;
    
    // Posição da câmera baseada na rotação
    const cameraOffset = new THREE.Vector3(0, height, distance);
    cameraOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), pitch * 0.5);
    cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    
    const targetCamPos = player.position.clone().add(cameraOffset);
    
    // Suaviza o movimento da câmera
    camera.position.lerp(targetCamPos, 0.15);
    
    // Ponto para onde a câmera olha
    const lookTarget = player.position.clone();
    lookTarget.y += 8;
    camera.lookAt(lookTarget);
  }

  renderer.render(scene, camera);
}

// === Redimensionamento da janela ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();