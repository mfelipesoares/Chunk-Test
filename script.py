import bpy
import random
import os
import bmesh

# Pasta onde os arquivos .glb serão exportados
EXPORT_DIR = bpy.path.abspath("//chunks")
if not os.path.exists(EXPORT_DIR):
    os.makedirs(EXPORT_DIR)

# Remove tudo da cena de forma segura
try:
    # Verifica se há objetos na cena antes de tentar selecioná-los
    if bpy.context.scene.objects:
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete(use_global=False)
    else:
        print("Cena já está vazia")
except Exception as e:
    print(f"Aviso ao limpar cena: {e}")

# Remove materiais antigos de forma segura
try:
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)
except Exception as e:
    print(f"Aviso ao limpar materiais: {e}")

# Cria materiais coloridos
def create_random_material(name):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    
    # Gera cor aleatória mais saturada
    hue = random.random()
    saturation = 0.7 + random.random() * 0.3  # Entre 0.7 e 1.0
    value = 0.6 + random.random() * 0.4       # Entre 0.6 e 1.0
    
    # Converte HSV para RGB
    import colorsys
    r, g, b = colorsys.hsv_to_rgb(hue, saturation, value)
    color = [r, g, b, 1.0]
    
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Roughness'].default_value = 0.8
    bsdf.inputs['Metallic'].default_value = 0.1
    
    return mat

# Adiciona alguma geometria interessante ao plano
def add_terrain_details(obj):
    try:
        # Certifica que o objeto está ativo
        bpy.context.view_layer.objects.active = obj
        bpy.context.view_layer.update()
        
        # Entra no modo de edição
        bpy.ops.object.mode_set(mode='EDIT')
        
        # Subdivide o plano
        bpy.ops.mesh.subdivide(number_cuts=8)
        
        # Volta ao modo objeto para modificar vértices
        bpy.ops.object.mode_set(mode='OBJECT')
        
        # Aplica deslocamento aleatório nos vértices diretamente
        mesh = obj.data
        for vertex in mesh.vertices:
            if abs(vertex.co.x) < 650 and abs(vertex.co.y) < 650:  # Apenas vértices internos
                vertex.co.z += random.uniform(-5, 20)  # Elevação aleatória
        
        # Atualiza a mesh
        mesh.update()
        
    except Exception as e:
        print(f"Erro ao adicionar detalhes ao terreno: {e}")
        # Garante que volta ao modo objeto mesmo se der erro
        try:
            bpy.ops.object.mode_set(mode='OBJECT')
        except:
            pass

# Tamanho do chunk e espaçamento
CHUNK_SIZE = 1500
GRID_RADIUS = 2  # Gera chunks de -2 a 2 (5x5)

chunk_count = 0
total_chunks = (GRID_RADIUS * 2 + 1) ** 2

for x in range(-GRID_RADIUS, GRID_RADIUS + 1):
    for z in range(-GRID_RADIUS, GRID_RADIUS + 1):
        chunk_count += 1
        print(f"Gerando chunk {chunk_count}/{total_chunks}: {x}_{z}")
        
        # Cria o plano na posição correta (XZ, Y=0)
        try:
            bpy.ops.mesh.primitive_plane_add(
                size=CHUNK_SIZE, 
                location=(0, 0, 0)  # Sempre cria na origem
            )
            plane = bpy.context.active_object
            plane.name = f"Chunk_{x}_{z}"
        except Exception as e:
            print(f"  ✗ Erro ao criar plano: {e}")
            continue
        
        # Adiciona detalhes ao terreno
        add_terrain_details(plane)
        
        # Adiciona alguns cubos aleatórios para tornar interessante (mais objetos para chunk maior)
        for i in range(random.randint(8, 15)):
            try:
                cube_x = random.uniform(-600, 600)
                cube_y = random.uniform(-600, 600)
                cube_z = random.uniform(2, 15)
                scale = random.uniform(1.0, 8.0)  # Objetos maiores para chunk maior
                
                bpy.ops.mesh.primitive_cube_add(
                    size=5,  # Cubos maiores para chunk maior
                    location=(cube_x, cube_y, cube_z)
                )
                cube = bpy.context.active_object
                cube.scale = (scale, scale, scale)
                
                # Material para o cubo
                cube_mat = create_random_material(f"CubeMat_{x}_{z}_{i}")
                cube.data.materials.append(cube_mat)
                
                # Junta o cubo ao plano
                cube.select_set(True)
                plane.select_set(True)
                bpy.context.view_layer.objects.active = plane
                bpy.ops.object.join()
            except Exception as e:
                print(f"  Aviso: Erro ao criar cubo {i}: {e}")
                continue
        
        # Material para o plano principal
        terrain_mat = create_random_material(f"TerrainMat_{x}_{z}")
        plane.data.materials.append(terrain_mat)
        
        # Seleciona apenas o chunk atual para exportação
        try:
            bpy.ops.object.select_all(action='DESELECT')
            plane.select_set(True)
            bpy.context.view_layer.objects.active = plane
        except Exception as e:
            print(f"  Aviso: Erro na seleção: {e}")
        
        # Exporta o chunk
        filename = f"{x}_{z}.glb"
        filepath = os.path.join(EXPORT_DIR, filename)
        
        try:
            bpy.ops.export_scene.gltf(
                filepath=filepath,
                export_format='GLB',
                use_selection=True,
                export_materials='EXPORT',
                export_colors=True,
                export_normals=True,
                export_tangents=False,
                export_texcoords=True,
                export_yup=True
            )
            print(f"  ✓ Exportado: {filename}")
        except Exception as e:
            print(f"  ✗ Erro ao exportar {filename}: {e}")
        
        # Remove o chunk da cena
        try:
            bpy.ops.object.delete()
        except Exception as e:
            print(f"  Aviso: Erro ao deletar objeto: {e}")

print(f"\n✓ Exportação concluída!")
print(f"  📁 Diretório: {EXPORT_DIR}")
print(f"  📄 {chunk_count} chunks gerados")

# Limpa materiais não utilizados
try:
    for mat in list(bpy.data.materials):
        if mat.users == 0:
            bpy.data.materials.remove(mat)
except Exception as e:
    print(f"Aviso ao limpar materiais finais: {e}")