const lista = document.getElementById('lista');
const campoBusca = document.getElementById('busca');
const contagem = document.getElementById('contagem');
const vazio = document.getElementById('vazio');

const audio = new Audio();
audio.preload = 'none';

let hinos = [];
let atual = null; // caminho do áudio em reprodução

const normalizar = (t) =>
  String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const esc = (t) =>
  String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const formatar = (s) => {
  if (!isFinite(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

const nomeDownload = (h) => {
  const ext = (h.audios.hino.match(/\.[a-z0-9]+$/i) || [''])[0];
  return `${h.numero} - ${h.titulo}${ext}`;
};

const ICONE_PLAY = '<svg class="i-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
const ICONE_PAUSE = '<svg class="i-pause" viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
const ICONE_BAIXAR = '<svg viewBox="0 0 24 24"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/></svg>';

function render(itens) {
  lista.innerHTML = itens.map((h) => {
    const src = h.audios.hino;
    const ativo = src === atual;
    const tocando = ativo && !audio.paused;
    return `
      <li class="hino${ativo ? ' ativo' : ''}${tocando ? ' tocando' : ''}" data-src="${esc(src)}">
        <div class="linha-principal">
          <span class="numero">${esc(h.numero)}</span>
          <h2 class="nome">${esc(h.titulo)}</h2>
          <button class="btn tocar" type="button" aria-label="Tocar ou pausar ${esc(h.titulo)}">${ICONE_PLAY}${ICONE_PAUSE}</button>
          <a class="btn baixar" href="${esc(encodeURI(src))}" download="${esc(nomeDownload(h))}" aria-label="Baixar ${esc(h.titulo)}">${ICONE_BAIXAR}</a>
        </div>
        <div class="player">
          <span class="tempo atual-tempo">0:00</span>
          <input class="progresso" type="range" min="0" max="100" step="0.1" value="0" aria-label="Posição do hino" />
          <span class="tempo total-tempo">0:00</span>
        </div>
        <p class="erro">Não foi possível carregar este áudio. Verifique se o arquivo existe e está em MP3, Opus ou AAC.</p>
      </li>`;
  }).join('');

  contagem.textContent = `${itens.length} ${itens.length === 1 ? 'hino' : 'hinos'}`;
  vazio.hidden = itens.length > 0;
}

function filtrar() {
  const q = normalizar(campoBusca.value);
  render(q ? hinos.filter((h) => normalizar(`${h.numero} ${h.titulo}`).includes(q)) : hinos);
}

const linhaAtiva = () => [...lista.children].find((li) => li.dataset.src === atual);

function atualizarProgresso() {
  const li = linhaAtiva();
  if (!li) return;
  const barra = li.querySelector('.progresso');
  const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  barra.value = pct;
  barra.style.setProperty('--p', pct + '%');
  li.querySelector('.atual-tempo').textContent = formatar(audio.currentTime);
  li.querySelector('.total-tempo').textContent = formatar(audio.duration);
}

function alternar(li) {
  const src = li.dataset.src;
  if (src === atual) {
    audio.paused ? audio.play() : audio.pause();
    return;
  }
  document.querySelectorAll('.hino.ativo').forEach((el) => el.classList.remove('ativo', 'tocando', 'falhou'));
  atual = src;
  li.classList.add('ativo');
  audio.src = encodeURI(src);
  audio.play().catch(() => li.classList.add('falhou'));
}

lista.addEventListener('click', (e) => {
  const btn = e.target.closest('.tocar');
  if (btn) alternar(btn.closest('.hino'));
});

lista.addEventListener('input', (e) => {
  if (!e.target.classList.contains('progresso') || !audio.duration) return;
  audio.currentTime = (e.target.value / 100) * audio.duration;
  atualizarProgresso();
});

audio.addEventListener('play', () => linhaAtiva()?.classList.add('tocando'));
audio.addEventListener('pause', () => linhaAtiva()?.classList.remove('tocando'));
audio.addEventListener('timeupdate', atualizarProgresso);
audio.addEventListener('loadedmetadata', atualizarProgresso);
audio.addEventListener('error', () => linhaAtiva()?.classList.add('falhou'));
audio.addEventListener('ended', () => {
  audio.currentTime = 0;
  linhaAtiva()?.classList.remove('tocando');
  atualizarProgresso();
});

campoBusca.addEventListener('input', filtrar);

fetch('hinos.json')
  .then((r) => r.json())
  .then((dados) => {
    hinos = dados.sort((a, b) => a.numero.localeCompare(b.numero, 'pt-BR', { numeric: true }) || a.titulo.localeCompare(b.titulo, 'pt-BR'));
    render(hinos);
  })
  .catch((erro) => {
    console.error('Erro ao carregar o repertório:', erro);
    contagem.textContent = '';
    vazio.textContent = 'Não foi possível carregar a lista de hinos.';
    vazio.hidden = false;
  });
