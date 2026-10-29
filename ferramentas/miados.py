"""Gera os miados da Niquinha por síntese de formantes (sem gravação nenhuma).
Cada miado é 'm-i-a-u': a voz (harmônicos de um tom que sobe e desce) passa por
ressonâncias que mudam de vogal ao longo do tempo."""
import sys, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 32000
OUT = sys.argv[1]
rng = np.random.default_rng(7)

def interp(pts, n):
    """pts = [(fração do tempo, valor), ...] -> curva suave com n amostras"""
    x = np.linspace(0, 1, n)
    xs, ys = zip(*pts)
    y = np.interp(x, xs, ys)
    k = max(1, n // 60)                      # suaviza as quinas
    return np.convolve(np.pad(y, k, mode='edge'), np.ones(2 * k + 1) / (2 * k + 1), 'valid')

def voz(dur, f0_pts, vogais, amp_pts, vibrato=0.012, rouco=0.0, escala=1.45):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f0 = interp(f0_pts, n)
    f0 = f0 * (1 + vibrato * np.sin(2 * np.pi * 6.5 * t) + 0.004 * np.convolve(rng.standard_normal(n), np.ones(200) / 200, 'same'))
    fase = 2 * np.pi * np.cumsum(f0) / SR
    # formantes de cada vogal (escala > 1 = trato vocal pequeno, de gatinho)
    F = {'m': [(280, 80, 1.0), (1200, 200, 0.08), (2500, 300, 0.03)],
         'i': [(310, 70, 0.8), (2250, 150, 1.0), (3000, 250, 0.5)],
         'e': [(450, 80, 1.0), (1900, 150, 0.7), (2600, 250, 0.35)],
         'a': [(750, 110, 1.0), (1250, 140, 0.8), (2550, 250, 0.3)],
         'u': [(330, 80, 1.0), (820, 120, 0.35), (2300, 300, 0.05)]}
    seq = [(p, F[v]) for p, v in vogais]
    def formantes(i):
        return [interp([(p, f[i][0] * escala) for p, f in seq], n),
                interp([(p, f[i][1] * escala) for p, f in seq], n),
                interp([(p, f[i][2]) for p, f in seq], n)]
    fs = [formantes(i) for i in range(3)]
    sinal = np.zeros(n)
    for h in range(1, 40):
        fh = f0 * h
        ok = fh < SR / 2 - 500
        g = np.zeros(n)
        for fc, bw, a in fs:
            g += a / (1 + ((fh - fc) / bw) ** 2)          # ressonância
        g *= h ** -0.6                                      # fonte mais forte embaixo
        sinal += np.where(ok, g * np.sin(h * fase), 0)
    if rouco:
        ruido = sosfilt(butter(2, [1500, 6000], 'bandpass', fs=SR, output='sos'), rng.standard_normal(n))
        sinal += rouco * ruido * np.abs(sinal).mean() * 8
    env = interp(amp_pts, n)
    return sinal * env

def ronron(dur=1.8):
    n = int(SR * dur); t = np.arange(n) / SR
    base = sosfilt(butter(2, [60, 450], 'bandpass', fs=SR, output='sos'), rng.standard_normal(n))
    pulsos = (0.5 + 0.5 * np.sin(2 * np.pi * 26 * t)) ** 3          # ~26 batidas por segundo
    resp = 0.65 + 0.35 * np.sin(2 * np.pi * t / dur * 1.0 - np.pi / 2)  # inspira/expira
    env = interp([(0, 0), (0.08, 1), (0.9, 1), (1, 0)], n)
    return base * pulsos * resp * env

def miu():
    """'miu?' curtinho subindo no fim, como pergunta."""
    return voz(0.42, [(0, 620), (0.5, 700), (1, 980)], [(0, 'm'), (0.18, 'i'), (0.7, 'e'), (1, 'u')],
               [(0, 0), (0.12, 1), (0.8, 0.9), (1, 0)], vibrato=0.008, escala=1.55)

def normaliza(x, pico=0.85):
    x = x - np.mean(x)
    fade = int(SR * 0.008); x[:fade] *= np.linspace(0, 1, fade); x[-fade:] *= np.linspace(1, 0, fade)
    return (x / np.max(np.abs(x)) * pico)

SONS = {
    'miadinho': voz(0.34, [(0, 820), (0.35, 1050), (1, 900)], [(0, 'm'), (0.15, 'i'), (0.55, 'e'), (1, 'u')],
                    [(0, 0), (0.12, 1), (0.7, 0.85), (1, 0)], vibrato=0.01, escala=1.6),
    'miau': voz(0.62, [(0, 560), (0.4, 760), (1, 520)], [(0, 'm'), (0.12, 'i'), (0.45, 'a'), (1, 'u')],
                [(0, 0), (0.1, 1), (0.75, 0.8), (1, 0)], rouco=0.04),
    'miaaau': voz(1.0, [(0, 520), (0.3, 720), (0.7, 680), (1, 430)], [(0, 'm'), (0.1, 'i'), (0.35, 'a'), (0.75, 'a'), (1, 'u')],
                  [(0, 0), (0.08, 0.9), (0.4, 1), (0.85, 0.7), (1, 0)], vibrato=0.02, rouco=0.05),
    'miu': miu(),
    'ronron': ronron(),
}

for nome, x in SONS.items():
    wavfile.write(f'{OUT}/{nome}.wav', SR, (normaliza(x, 0.6 if nome == 'ronron' else 0.85) * 32767).astype(np.int16))
    print(nome, round(len(x) / SR, 2), 's')
