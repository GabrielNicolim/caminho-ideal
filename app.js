class Grafo {
    constructor() {
        this.adj = new Map();
    }

    adicionarCidade(nome) {
        if (!this.adj.has(nome)) {
            this.adj.set(nome, new Map());
        }
    }

    adicionarEstrada(a, b, peso) {
        if (!this.adj.has(a) || !this.adj.has(b)) return false;
        this.adj.get(a).set(b, Number(peso));
        this.adj.get(b).set(a, Number(peso));
        return true;
    }

    getCidades() {
        return Array.from(this.adj.keys());
    }

    getAdjacentes(cidade) {
        if (!this.adj.has(cidade)) return [];
        return Array.from(this.adj.get(cidade).entries()).map(([destino, peso]) => ({ destino, peso }));
    }

    temAresta(a, b) {
        return this.adj.has(a) && this.adj.get(a).has(b);
    }

    limpar() {
        this.adj.clear();
    }
}

function dijkstra(grafo, origem) {
    const dist = new Map();
    const prev = new Map();
    const pq = new TinyPQ();

    for (const v of grafo.getCidades()) {
        dist.set(v, Infinity);
        prev.set(v, null);
    }

    dist.set(origem, 0);
    pq.push(origem, 0);

    while (!pq.empty()) {
        const popped = pq.pop();
        if (!popped) break; // safety
        const u = popped.key;
        const du = dist.get(u);

        for (const { destino: v, peso } of grafo.getAdjacentes(u)) {
            const alt = du + peso;
            if (alt < dist.get(v)) {
                dist.set(v, alt);
                prev.set(v, u);
                pq.push(v, alt);
            }
        }
    }

    return { dist, prev };
}

function reconstruirCaminho(prev, origem, destino) {
    const path = [];
    let cur = destino;

    while (cur !== null && cur !== undefined) {
        path.push(cur);
        if (cur === origem) break;
        cur = prev.get(cur);
    }

    if (path[path.length - 1] !== origem) return null;
    return path.reverse();
}

async function calcularRotaMulti(grafo, origem, pedidos) {
    const relevantes = [origem, ...pedidoUnique(pedidos, origem)];
    const distAll = new Map();
    const prevAll = new Map();

    for (const r of relevantes) {
        const { dist, prev } = dijkstra(grafo, r);
        distAll.set(r, dist);
        prevAll.set(r, prev);
    }

    const remaining = new Set(pedidos);
    const tour = [];
    let cur = origem;

    while (remaining.size > 0) {
        const distMap = distAll.get(cur);
        let nearest = null;
        let bestD = Infinity;

        for (const p of remaining) {
            const d = distMap ? distMap.get(p) : undefined;
            if (d !== undefined && d < bestD) {
                bestD = d;
                nearest = p;
            }
        }

        if (nearest === null) {
            return { error: "Algum pedido é inalcançável a partir da posição atual." };
        }

        const prev = prevAll.get(cur);
        const caminho = reconstruirCaminho(prev, cur, nearest);

        if (!caminho) {
            return { error: `Sem caminho entre ${cur} e ${nearest}` };
        }

        for (let i = 0; i < caminho.length; i++) {
            const node = caminho[i];
            if (tour.length === 0 || tour[tour.length - 1] !== node) tour.push(node);
        }

        remaining.delete(nearest);
        cur = nearest;
    }

    let custo = 0;
    for (let i = 0; i < tour.length - 1; i++) {
        const a = tour[i];
        const b = tour[i + 1];
        const peso = grafo.adj.get(a).get(b);
        custo += peso;
    }

    return { tour, custo };
}

function pedidoUnique(pedidos, origem) {
    const s = new Set();
    for (const p of pedidos) if (p !== origem) s.add(p);
    return Array.from(s);
}

class TinyPQ {
    constructor() {
        this.arr = [];
    }

    push(key, priority) {
        this.arr.push({ key, priority });
    }

    pop() {
        if (this.empty()) return null;
        let minIdx = 0;
        for (let i = 1; i < this.arr.length; i++) {
            if (this.arr[i].priority < this.arr[minIdx].priority) minIdx = i;
        }
        const item = this.arr.splice(minIdx, 1)[0];
        return item;
    }

    empty() {
        return this.arr.length === 0;
    }
}

const grafo = new Grafo();

const nodes = new vis.DataSet([]);
const edges = new vis.DataSet([]);

const container = document.getElementById('network');
const data = { nodes, edges };
const options = {
    physics: { stabilization: true },
    nodes: {
        shape: 'dot',
        size: 18,
        font: { size: 14 },
        borderWidth: 2
    },
    edges: {
        width: 2,
        arrows: { to: false },
        smooth: { type: 'dynamic' }
    },
    interaction: { hover: true, tooltipDelay: 100 }
};

const network = new vis.Network(container, data, options);

function refreshSelects() {
    const cidades = grafo.getCidades();
    const selects = ['road-from', 'road-to', 'pedido-city', 'origin-city'];

    for (const id of selects) {
        const sel = document.getElementById(id);
        if (!sel) continue;
        const cur = sel.value;
        sel.innerHTML = '';

        for (const c of cidades) {
            const opt = document.createElement('option');
            opt.value = c;
            opt.text = c;
            sel.appendChild(opt);
        }

        if (cidades.length === 0) {
            const opt = document.createElement('option');
            opt.disabled = true;
            opt.text = '— nenhuma cidade —';
            sel.appendChild(opt);
        } else {
            if ([...sel.options].some(o => o.value === cur)) sel.value = cur;
        }
    }

    const nodeCountEl = document.getElementById('node-count');
    const edgeCountEl = document.getElementById('edge-count');
    if (nodeCountEl) nodeCountEl.textContent = String(cidades.length);
    if (edgeCountEl) edgeCountEl.textContent = String(edges.length);
}

const pedidos = [];

function refreshPedidosUI() {
    const ul = document.getElementById('pedidos-list');
    if (!ul) return;
    ul.innerHTML = '';

    for (const p of pedidos) {
        const li = document.createElement('li');
        li.textContent = p;

        const btn = document.createElement('button');
        btn.textContent = ' ×';
        btn.className = 'text-red-500 ml-2';
        btn.onclick = () => {
            const idx = pedidos.indexOf(p);
            if (idx >= 0) {
                pedidos.splice(idx, 1);
                refreshPedidosUI();
            }
        };

        li.appendChild(btn);
        ul.appendChild(li);
    }
}

document.getElementById('add-city').addEventListener('click', () => {
    const nomeEl = document.getElementById('city-name');
    if (!nomeEl) return;
    const nome = nomeEl.value.trim();

    if (!nome) {
        swal({ title: 'Informe um nome de cidade.', icon: 'info' });
        return;
    }

    if (grafo.adj.has(nome)) {
        swal({ title: 'Cidade já existe.', icon: 'info' });
        return;
    }

    grafo.adicionarCidade(nome);
    nodes.add({ id: nome, label: nome });
    nomeEl.value = '';
    refreshSelects();
});

document.getElementById('add-road').addEventListener('click', () => {
    const f = document.getElementById('road-from')?.value;
    const t = document.getElementById('road-to')?.value;
    const w = Number(document.getElementById('road-weight')?.value);

    if (!f || !t) {
        swal({ title: 'Selecione origem e destino.', icon: 'info' });
        return;
    }

    if (f === t) {
        swal({ title: 'Origem e destino não podem ser iguais.', icon: 'info' });
        return;
    }

    if (isNaN(w) || w <= 0) {
        swal({ title: 'Peso deve ser um número positivo.', icon: 'info' });
        return;
    }

    const ok = grafo.adicionarEstrada(f, t, w);
    if (!ok) {
        swal('Erro ao adicionar estrada (verifique se cidades existem).', { icon: 'error' });
        return;
    }

    const edgeId = edgeIdFrom(f, t);
    if (![...edges.get()].some(e => e.id === edgeId)) {
        edges.add({ id: edgeId, from: f, to: t, label: String(w), physics: false });
    } else {
        edges.update({ id: edgeId, label: String(w) });
    }

    refreshSelects();
});

function edgeIdFrom(a, b) {
    return [a, b].sort().join('::');
}

document.getElementById('add-pedido').addEventListener('click', () => {
    const cidade = document.getElementById('pedido-city')?.value;
    if (!cidade) {
        swal({ title: 'Selecione uma cidade para o pedido.', icon: 'info' });
        return;
    }

    if (!grafo.adj.has(cidade)) {
        swal({ title: 'Cidade inválida.', icon: 'error' });
        return;
    }

    pedidos.push(cidade);
    refreshPedidosUI();
    highlightPedidos();
});

function highlightPedidos() {
    const pedidoSet = new Set(pedidos);
    for (const n of grafo.getCidades()) {
        const color = pedidoSet.has(n)
            ? { background: '#f97316', border: '#c2410c', highlight: { background: '#fb923c' } }
            : undefined;
        nodes.update({ id: n, color });
    }
}

document.getElementById('clear-graph').addEventListener('click', () => {
    swal({
        title: 'Limpar grafo e pedidos?',
        buttons: true,
        dangerMode: true
    }).then((willClear) => {
        if (!willClear) return;
        grafo.limpar();
        nodes.clear();
        edges.clear();
        pedidos.length = 0;
        refreshSelects();
        refreshPedidosUI();
    });
});

document.getElementById('auto-sample').addEventListener('click', () => {
    const sampleCities = ['A', 'B', 'C', 'D', 'E', 'F'];
    const sampleEdges = [
        ['A', 'B', 7], ['A', 'C', 9], ['A', 'F', 14],
        ['B', 'C', 10], ['B', 'D', 15],
        ['C', 'D', 11], ['C', 'F', 2],
        ['D', 'E', 6], ['E', 'F', 9]
    ];

    grafo.limpar();
    nodes.clear();
    edges.clear();
    pedidos.length = 0;
    refreshPedidosUI();

    for (const c of sampleCities) {
        grafo.adicionarCidade(c);
        nodes.add({ id: c, label: c });
    }

    for (const [a, b, w] of sampleEdges) {
        grafo.adicionarEstrada(a, b, w);
        edges.add({ id: edgeIdFrom(a, b), from: a, to: b, label: String(w) });
    }

    refreshSelects();
});

document.getElementById('fit-view').addEventListener('click', () => {
    network.fit({ animation: { duration: 500 } });
});

document.getElementById('calc-route').addEventListener('click', async () => {
    const origem = document.getElementById('origin-city')?.value;
    if (!origem) {
        swal({ title: 'Selecione origem do caminhão.', icon: 'info' });
        return;
    }

    if (pedidos.length === 0) {
        swal({ title: 'Adicione pelo menos um pedido.', icon: 'info' });
        return;
    }

    try {
        const res = await calcularRotaMulti(grafo, origem, pedidos.slice());
        if (res.error) {
            swal(res.error, { icon: 'error' });
            return;
        }

        const { tour, custo } = res;
        highlightRoute(tour);
    } catch (err) {
        swal('Erro: ' + err.message, { icon: 'error' });
        console.error(err);
    }
});

function highlightRoute(tour) {
    for (const e of edges.get()) {
        edges.update({ id: e.id, color: { color: undefined }, width: 2, arrows: { to: false } });
    }

    for (let i = 0; i < tour.length - 1; i++) {
        const a = tour[i];
        const b = tour[i + 1];
        const id = edgeIdFrom(a, b);

        if (edges.get(id)) {
            edges.update({ id, color: { color: '#16a34a' }, width: 6 });
        } else {
            edges.add({ id: 'tmp::' + a + '::' + b, from: a, to: b, color: { color: '#16a34a' }, width: 6, dashes: true });
        }
    }

    const inTour = new Set(tour);
    for (const n of nodes.get()) {
        const idx = tour.indexOf(n.id);
        const label = idx >= 0 ? `${n.id}\n#${idx + 1}` : n.label;
        nodes.update({ id: n.id, label, color: inTour.has(n.id) ? { background: '#bbf7d0', border: '#16a34a' } : undefined });
    }

    network.fit({ animation: true });
}

network.on('doubleClick', function (params) {
    if (!params.nodes || params.nodes.length === 0) return;
    const nodeId = params.nodes[0];
    document.getElementById('origin-city').value = nodeId;
});

nodes.on('*', () => refreshSelects());
edges.on('*', () => refreshSelects());

refreshSelects();
