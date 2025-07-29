# Sistema de Streaming de Chunks 3D

Um sistema de carregamento dinâmico de chunks 3D usando Three.js e GLB, similar aos sistemas de mundo aberto em jogos.

## 🚀 Demo Online

Acesse a demo em: [https://mfelipesoares.github.io/Chunk-Test](https://mfelipesoares.github.io/Chunk-Test)

## 📋 Características

- **Streaming de Chunks**: Carregamento dinâmico de chunks conforme o jogador se move
- **Otimização de Memória**: Descarregamento automático de chunks distantes
- **Câmeras Flexíveis**: Primeira e terceira pessoa
- **Controles Intuitivos**: WASD + mouse para navegação
- **Terreno Procedural**: Chunks gerados no Blender com variações aleatórias

## 🎮 Controles

- **WASD**: Movimento
- **Mouse**: Olhar ao redor
- **C**: Alternar entre câmeras (1ª/3ª pessoa)
- **Clique**: Capturar mouse

## 🛠️ Tecnologias

- **Three.js**: Renderização 3D
- **GLB/GLTF**: Formato de modelos 3D
- **Express.js**: Servidor web
- **Bun**: Runtime JavaScript
- **Blender**: Geração de chunks (script Python incluído)

## 📁 Estrutura do Projeto

```
├── index.html          # Interface principal
├── index.js            # Lógica do sistema de chunks
├── server.js           # Servidor Express
├── script.py           # Script Blender para gerar chunks
└── chunks/             # Pasta com arquivos GLB dos chunks
    ├── -2_-2.glb
    ├── -2_-1.glb
    └── ...
```

## 🔧 Instalação Local

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio
```

2. Instale as dependências:

```bash
bun install
```

3. Gere os chunks (opcional - já incluídos):

   - Abra o Blender
   - Execute o `script.py` no Blender
   - Os chunks serão gerados na pasta `chunks/`
4. Inicie o servidor:

```bash
bun start
```

5. Acesse `http://localhost:3000`

## 🎨 Gerando Chunks Personalizados

1. Abra o Blender
2. Cole e execute o código do `script.py`
3. Os chunks serão exportados como arquivos GLB
4. Copie a pasta `chunks/` para o projeto

### Configurações do Script:

- **CHUNK_SIZE**: Tamanho de cada chunk (padrão: 1500)
- **GRID_RADIUS**: Quantos chunks gerar em cada direção (padrão: 2 = 5x5)

## 🔧 Configurações

### JavaScript (index.js):

```javascript
const CHUNK_SIZE = 1500;      // Deve coincidir com o script Python
const visibleRadius = 2;      // Quantos chunks carregar ao redor do jogador
```

### Python (script.py):

```python
CHUNK_SIZE = 1500            # Tamanho dos chunks
GRID_RADIUS = 2              # Gera chunks de -2 a 2 (5x5)
```

## 📈 Performance

- **Carregamento Inteligente**: Apenas chunks visíveis são carregados
- **Cleanup de Memória**: Geometrias e materiais são limpos ao descarregar chunks
- **Otimização de Requisições**: Evita requisições duplicadas e desnecessárias
- **Cache do Navegador**: Chunks são cacheados automaticamente

## 🔗 Links Úteis

- [Three.js Documentation](https://threejs.org/docs/)
- [Blender Python API](https://docs.blender.org/api/current/)
- [GLB Format Specification](https://github.com/KhronosGroup/glTF)
