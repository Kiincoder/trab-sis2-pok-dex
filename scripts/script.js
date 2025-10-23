const apiBase = 'https://pokeapi.co/api/v2';
const pokedexEl = document.getElementById('pokedex');
const searchInput = document.getElementById('searchInput');
const loadBtn = document.getElementById('loadBtn');
const limitSelect = document.getElementById('limitSelect');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
const detailEl = document.getElementById('detail');

let limit = 151;
let offset = 0;

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erro fetch ' + res.status);
  return res.json();
}

function formatId(id) {
  return '#' + String(id).padStart(3, '0');
}

function typeClass(t) {
  return 'type-' + t;
}

function capitalize(str) {
  return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}

async function loadList() {
  pokedexEl.innerHTML = '<p style="grid-column:1/-1;text-align:center;opacity:.8">Carregando...</p>';


  try {
    const url = `${apiBase}/pokemon?limit=${limit}&offset=${offset}`;
    const data = await fetchJson(url);
    const items = data.results;

    pokedexEl.innerHTML = '';

    const promises = items.map(i => fetchJson(i.url).catch(() => null));
    const details = await Promise.all(promises);

    details.forEach(d => {
      if (!d) return;
      const card = document.createElement('article');
      card.className = 'card';
      card.dataset.name = d.name;
      card.innerHTML = `
        <img class="poke-img" src="${d.sprites.other['official-artwork'].front_default || d.sprites.front_default}" alt="${d.name}" />
        <div class="id">${formatId(d.id)}</div>
        <div class="name">${d.name}</div>
        <div class="types">${d.types.map(t => `<span style="width: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px;" class="type ${typeClass(t.type.name)}">${capitalize(t.type.name)}</span>`).join('')}</div>
      `;
      card.addEventListener('click', () => openDetail(d));
      pokedexEl.appendChild(card);
    });

    pageInfo.textContent = `Página ${Math.floor(offset / limit) + 1}`;
    prevBtn.disabled = offset === 0;
    nextBtn.disabled = (offset + limit) >= data.count;
  } catch (err) {
    pokedexEl.innerHTML = `<p style="grid-column:1/-1;color:#a00">Erro: ${err.message}</p>`;
  }
}

function renderStats(stats) {
  const translateStatName = (name) => {
    switch (name) {
      case 'hp': return 'HP';
      case 'attack': return 'Ataque';
      case 'defense': return 'Defesa';
      case 'special-attack': return 'Ataque Especial';
      case 'special-defense': return 'Defesa Especial';
      case 'speed': return 'Velocidade';
      default: return name;
    }
  };

  return stats.map(s => `
    <div class="stat">
      <strong>${translateStatName(s.stat.name)}</strong>
      <span>${s.base_stat}</span>
    </div>`).join('');
}

function openDetail(pokemon) {
  detailEl.innerHTML = `
    <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
      <img src="${pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}" alt="${pokemon.name}" />
      <div>
        <h2>${pokemon.name} <small style="color:#666">${formatId(pokemon.id)}</small></h2>
        <div class="types">${pokemon.types.map(t => `<span style="padding: 10px; width: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px;" class="type ${typeClass(t.type.name)}">${capitalize(t.type.name)}</span>`).join('')}</div>
        <p style="margin-top:8px;color:#444">Altura: ${pokemon.height / 10}m • Peso: ${pokemon.weight / 10}kg</p>
      </div>
    </div>
    <div class="detail-grid">
      <div>
        <h3>Habilidades</h3>
        <ul>${pokemon.abilities.map(a =>
          `<li style="text-transform:capitalize">${a.ability.name}${a.is_hidden ? ' (oculta)' : ''}</li>`).join('')}
        </ul>
      </div>
      <div>
        <h3>Status base</h3>
        ${renderStats(pokemon.stats)}
      </div>
    </div>
  `;
}

searchInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') await doSearch();
});

loadBtn.addEventListener('click', () => { offset = 0; loadList(); });
prevBtn.addEventListener('click', () => { offset = Math.max(0, offset - limit); loadList(); });
nextBtn.addEventListener('click', () => { offset = offset + limit; loadList(); });

async function doSearch() {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) return loadList();

  pokedexEl.innerHTML = '<p style="grid-column:1/-1;text-align:center;opacity:.8">Buscando...</p>';
  try {
    const data = await fetchJson(`${apiBase}/pokemon/${encodeURIComponent(q)}`);
    pokedexEl.innerHTML = '';
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img class="poke-img" src="${data.sprites.other['official-artwork'].front_default || data.sprites.front_default}" alt="${data.name}" />
      <div class="id">${formatId(data.id)}</div>
      <div class="name">${data.name}</div>
      <div class="types">${data.types.map(t => `<span class="type ${typeClass(t.type.name)}">${t.type.name}</span>`).join('')}</div>
    `;
    card.addEventListener('click', () => openDetail(data));
    pokedexEl.appendChild(card);
    pageInfo.textContent = 'Resultado da busca';
  } catch {
    pokedexEl.innerHTML = `<p style="grid-column:1/-1;color:#a00">Pokémon não encontrado!</p>`;
  }
}

loadList();
