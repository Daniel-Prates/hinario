import os
import json
import re

def gerar_json_hinos():
    # Atualizado para a sua nova pasta
    pasta_audios = 'audios'
    repertorio = []

    if not os.path.exists(pasta_audios):
        print(f"Erro: A pasta '{pasta_audios}' não foi encontrada.")
        return

    # Lista os arquivos da pasta de áudios
    arquivos = sorted(os.listdir(pasta_audios))

    for arquivo in arquivos:
        # Filtra apenas arquivos de áudio válidos
        if arquivo.startswith('.') or not arquivo.lower().endswith(('.wma', '.mp3', '.opus')):
            continue
        
        # Pega o nome do arquivo sem a extensão original
        nome_sem_ext, _ = os.path.splitext(arquivo)
        
        # Regex para capturar o número inicial e o resto do título
        match = re.match(r'^(\d+)[-_\s]*(.*)$', nome_sem_ext)
        
        if match:
            numero = match.group(1)
            titulo_cru = match.group(2).strip()
            
            # Limpa traços ou espaços extras apenas para o título visual da tela
            titulo = re.sub(r'^[-_\s]+', '', titulo_cru)
            
            # IMPORTANTE: Mantém o nome exato do arquivo físico original,
            # apenas trocando a extensão final para .opus
            nome_arquivo_opus = f"{nome_sem_ext}.opus"
            caminho_final_audio = f"audios/{nome_arquivo_opus}"
            
            # Monta a estrutura do hino
            item = {
                "numero": numero,
                "titulo": titulo,
                "audios": {
                    "hino": caminho_final_audio
                }
            }
            repertorio.append(item)

    # Grava o hinos.json formatado
    with open('hinos.json', 'w', encoding='utf-8') as f:
        json.dump(repertorio, f, ensure_ascii=False, indent=2)
    
    print(f"Sucesso! {len(repertorio)} hinos mapeados corretamente em hinos.json")

if __name__ == '__main__':
    gerar_json_hinos()
