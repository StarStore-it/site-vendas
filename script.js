// SITE FINAL - FIX [object Object] nos ITEMS
let products = [];
let cart = [];
let loggedInUser = null;

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    const target = document.getElementById(screenId);
    target.style.display = 'block';
    target.classList.add('active');
}

// LOGIN
function login() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value;
    loggedInUser = (user === 'adimin' && pass === 'adiminadimin') ? 'adimin' : 'normal';
    showScreen('mainScreen');
    updateAdmin();
    loadProducts();
}

function guestLogin() {
    loggedInUser = 'convidado';
    showScreen('mainScreen');
    updateAdmin();
    loadProducts();
}

function logout() {
    showScreen('loginScreen');
}

// ADMIN
function updateAdmin() {
    const admin = document.getElementById('adminSection');
    admin.style.display = loggedInUser === 'adimin' ? 'block' : 'none';
}

// PRODUTOS
async function loadProducts() {
    try {
        const res = await fetch('/products.json');
        products = await res.json();
        const cont = document.getElementById('productsContainer');
        cont.innerHTML = products.map((p, i) => `
            <div class="product">
                <h3>${p.nome} - R$ ${p.preco}</h3>
                <input type="number" id="q${i}" value="1" min="1">
                <button onclick="addToCart(${i})">+ Carrinho</button>
                ${loggedInUser === 'adimin' ? `<button class="delete-btn" onclick="deleteProduct(${p.id})" style="margin-left:10px;">Excluir</button>` : ''}
            </div>`).join('') || '<p>Sem produtos</p>';
    } catch (e) {
        document.getElementById('productsContainer').innerHTML = '<p>Erro produtos</p>';
    }
}


// PEDIDOS - FIX [object Object]
async function showPedidos() {
    try {
        const res = await fetch('/pedidos.json');
        let pedidosRaw = await res.json();
        const pedidos = Array.isArray(pedidosRaw) ? pedidosRaw : [pedidosRaw];
        // Filtrar pedidos entregues
        const pedidosPendentes = pedidos.filter(p => p.status !== 'entregue');
        const list = document.getElementById('pedidosList');
        if (!pedidosPendentes.length) {
            list.innerHTML = '<p style="text-align:center; color:#666;">Nenhum pedido pendente encontrado</p>';
            return;
        }
        list.innerHTML = pedidosPendentes.map((p, index) => {
            // FIX ITEMS [object Object]
            let itemsText = 'N/A';
            if (Array.isArray(p.items)) {
                itemsText = p.items.map(item => `${item.nome} x${item.qty}`).join(', ');
            } else if (p.items && typeof p.items === 'object') {
                itemsText = p.items.nome ? `${p.items.nome} x${p.items.qty || 1}` : 'Item único';
            }
            
            return `
                <div style="border:2px solid #007bff; padding:20px; margin:15px 0; background:#f0f8ff; border-radius:10px; box-shadow:0 2px 5px rgba(0,123,255,0.2);">
                    <h4 style="color:#007bff; margin:0 0 10px;">Pedido #${p.id || index + 1}</h4>
                    <strong>Identificação:</strong> ${p.identificacao || 'N/A'}<br>
                    <strong>Contato:</strong> ${p.contato || 'N/A'}<br>
                    <strong>Items:</strong> ${itemsText}<br>
                    <strong>Total:</strong> <span style="color:#28a745; font-size:1.2em;">R$ ${(p.total || 0).toFixed(2)}</span><br>
                    <strong>Data:</strong> ${p.date || new Date().toLocaleString() || 'N/A'}<br>
                    <button class="delivered-btn" onclick="markAsDelivered(${pedidos.indexOf(p)})" style="margin-top:10px;">Marcar como Entregue</button>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Erro pedidos:', e);
        document.getElementById('pedidosList').innerHTML = '<p style="color:red;">Erro ao carregar pedidos</p>';
    }
}


// CARRINHO
function addToCart(i) {
    const qty = parseInt(document.getElementById(`q${i}`).value);
    const p = {...products[i], qty};
    cart.push(p);
    document.getElementById('cartCount').textContent = cart.reduce((s, item) => s + item.qty, 0);
}

function showCart() {
    showScreen('cartScreen');
    const cont = document.getElementById('cartItems');
    if (cart.length === 0) {
        cont.innerHTML = '<p>Vazio</p>';
        return;
    }
    const total = cart.reduce((s, i) => s + i.preco * i.qty, 0);
    cont.innerHTML = cart.map(i => `
        <div>${i.nome} x${i.qty} R$ ${(i.preco * i.qty).toFixed(2)}</div>
    `).join('') + `<div style="font-weight:bold; font-size:1.1em; color:#007bff;">Total R$ ${total.toFixed(2)}</div>`;
}

function showMain() {
    showScreen('mainScreen');
}

async function buy() {
    const identificacao = prompt('Identificação:');
    const contato = prompt('Contato:');
    if (identificacao && contato && cart.length > 0) {
        const pedido = {
            id: Date.now(),
            user: loggedInUser,
            identificacao,
            contato,
            items: cart.map(i => ({nome: i.nome, preco: i.preco, qty: i.qty})),
            total: cart.reduce((s, i) => s + i.preco * i.qty, 0),
            date: new Date().toLocaleString('pt-BR')
        };
        try {
            const res = await fetch('/pedidos.json');
            let pedidos = [];
            try {
                pedidos = await res.json();
                if (!Array.isArray(pedidos)) pedidos = [pedidos];
            } catch {}
            pedidos.push(pedido);
            await fetch('/pedidos.json', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(pedidos)
            });
            alert('✅ Pedido salvo!');
        } catch (e) {
            console.error(e);
            alert('Erro salvar');
        }
        cart = [];
        showMain();
    } else {
        alert('Carrinho vazio ou dados inválidos');
    }
}

// ADMIN FORM
function toggleAddProduct() {
    const form = document.getElementById('addProductForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

async function addProduct() {
    const nome = document.getElementById('newNome').value.trim();
    const preco = parseFloat(document.getElementById('newPreco').value);
    if (nome && !isNaN(preco) && preco > 0) {
        const newP = {
            id: products.length ? Math.max(...products.map(p => p.id || 0)) + 1 : 1,
            nome,
            preco
        };
        try {
            const res = await fetch('/products.json');
            let current = [];
            try {
                current = await res.json();
            } catch {}
            current.push(newP);
            await fetch('/products.json', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(current)
            });
            alert('✅ Produto adicionado!');
            document.getElementById('newNome').value = '';
            document.getElementById('newPreco').value = '';
            loadProducts();
        } catch (e) {
            alert('Erro ao salvar');
        }
    } else {
        alert('Nome e preço > 0 obrigatórios');
    }
}

// NOVAS FUNÇÕES ADMIN
async function markAsDelivered(originalIndex) {
    try {
        const res = await fetch('/pedidos.json');
        let pedidosRaw = await res.json();
        let pedidos = Array.isArray(pedidosRaw) ? pedidosRaw : [pedidosRaw];
        if (originalIndex >= 0 && originalIndex < pedidos.length) {
            pedidos[originalIndex].status = 'entregue';
            await fetch('/pedidos.json', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(pedidos)
            });
            alert('✅ Pedido marcado como entregue!');
            showPedidos(); // Refresh
        }
    } catch (e) {
        console.error('Erro marcar entregue:', e);
        alert('Erro ao atualizar pedido');
    }
}

async function deleteProduct(id) {
    if (!confirm('Confirmar exclusão do produto?')) return;
    try {
        const res = await fetch('/products.json');
        let current = await res.json();
        const updated = current.filter(p => p.id !== id);
        await fetch('/products.json', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(updated)
        });
        alert('✅ Produto excluído!');
        loadProducts(); // Refresh
    } catch (e) {
        console.error('Erro excluir produto:', e);
        alert('Erro ao excluir');
    }
}


// INIT
window.onload = () => {
    showScreen('loginScreen');
};
