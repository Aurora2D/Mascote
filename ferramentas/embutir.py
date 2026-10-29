"""Regenera os arquivos embutidos a partir das pastas de assets:
  assets/pecas/*.webp -> fantoche-assets.js (window.FANTOCHE_ASSETS)
  assets/sons/*.mp3   -> miados.js          (window.MIADOS)

Rode da raiz do repositório depois de trocar, adicionar ou apagar uma peça ou um som:
  python3 ferramentas/embutir.py

Mantém a ordem das entradas que já existem, põe as novas no fim e tira as que não têm mais arquivo."""
import base64, re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent

def embutir(js_nome, cabecalho, pasta, ext, mime):
    js = RAIZ / js_nome
    antigos = re.findall(r'^"([^"]+)":', js.read_text(), re.M) if js.exists() else []
    arquivos = {p.stem: p for p in sorted((RAIZ / pasta).glob(f'*.{ext}'))}
    ordem = [n for n in antigos if n in arquivos] + [n for n in arquivos if n not in antigos]
    linhas = [f'"{n}":"data:{mime};base64,{base64.b64encode(arquivos[n].read_bytes()).decode()}",' for n in ordem]
    js.write_text(cabecalho + '\n'.join(linhas) + '\n};\n')
    novos, sumiram = set(ordem) - set(antigos), set(antigos) - set(ordem)
    print(f'{js_nome}: {len(ordem)} entradas' + (f', novas: {sorted(novos)}' if novos else '') + (f', removidas: {sorted(sumiram)}' if sumiram else ''))

embutir('fantoche-assets.js', 'window.FANTOCHE_ASSETS={\n', 'assets/pecas', 'webp', 'image/webp')
embutir('miados.js', '/* Miados da Niquinha embutidos (para funcionar aberto direto do disco). Gerados por ferramentas/miados.py */\nwindow.MIADOS={\n',
        'assets/sons', 'mp3', 'audio/mpeg')
