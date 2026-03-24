// ====== State Management (LocalStorage) ======
const DEFAULT_PLACES = [
    { 
        id: 1, 
        name: "Hotel Maria del Mar", 
        type: "hotel", 
        catName: "Hotel",
        rating: 5.0, 
        image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80", 
        desc: "El mejor destino de descanso para disfrutar de impresionantes puestas de sol, relajación y contacto con la naturaleza. Tu escape perfecto en la playa.",
        coords: "18.6420777,-95.0989037"
    }
];

// Initialize DB if not exists
if (!localStorage.getItem('cx_places')) localStorage.setItem('cx_places', JSON.stringify(DEFAULT_PLACES));
if (!localStorage.getItem('cx_users')) localStorage.setItem('cx_users', JSON.stringify([]));
if (!localStorage.getItem('cx_comments')) localStorage.setItem('cx_comments', JSON.stringify([]));
if (!localStorage.getItem('cx_current_user')) localStorage.setItem('cx_current_user', JSON.stringify(null));

function getDB(key) { return JSON.parse(localStorage.getItem(key)); }
function setDB(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

// Current specific state
const state = {
    currentPlaceId: null
};

// ====== Navigation ======
function showSection(id) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    // Auth navbar update logic
    const currentUser = getDB('cx_current_user');
    if (currentUser && id === 'login') {
        alert("Ya has iniciado sesión como " + currentUser.name + ". ¡Ve a disfrutar del catálogo!");
        showSection('home');
    }

    if(id === 'home' || id === 'catalog') {
        renderCards('featured-grid', getDB('cx_places').slice(0, 3));
        renderCards('catalog-grid', getDB('cx_places'));
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ====== Render Functions ======
function getStarsHTML(rating) {
    let html = '';
    for(let i = 1; i <= 5; i++) {
        html += `<span style="color: ${i <= Math.round(rating) ? '#fbbf24' : '#94a3b8'}">★</span>`;
    }
    return html;
}

function renderCards(containerId, data) {
    const container = document.getElementById(containerId);
    if(!container) return;
    container.innerHTML = '';
    
    if(data.length === 0) {
        container.innerHTML = `<p class="text-muted text-center w-full" style="grid-column: 1/-1;">Aún no hay lugares registrados en esta categoría.</p>`;
        return;
    }

    data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'glass card';
        div.innerHTML = `
            <div class="tag">${item.catName}</div>
            <img src="${item.image}" alt="${item.name}" class="card-img">
            <div class="card-content">
                <h3 class="mb-2" style="color: var(--primary);">${item.name}</h3>
                <div class="rating">
                    ${getStarsHTML(item.rating)}
                    <span style="color: var(--text-muted); font-size: 0.9rem; margin-left: 5px;">${item.rating}</span>
                </div>
                <p class="text-muted" style="font-size: 0.95rem; margin-bottom: 1rem;">${item.desc.substring(0, 75)}...</p>
                <button class="btn-primary w-full" onclick="openDetail(${item.id})">Explorar</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function filterCatalog(type) {
    document.querySelectorAll('.filters .filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    const places = getDB('cx_places');
    const filtered = type === 'all' ? places : places.filter(p => p.type === type);
    renderCards('catalog-grid', filtered);
}

// ====== Detail Logic ======
function openDetail(id) {
    const places = getDB('cx_places');
    const place = places.find(p => p.id === id);
    if(!place) return;
    
    state.currentPlaceId = id;
    const container = document.getElementById('detail-content');
    
    // Get comments
    const allComments = getDB('cx_comments');
    const placeComments = allComments.filter(c => c.placeId === id);
    const commentsHTML = placeComments.map(c => `
        <div class="comment-item">
            <div style="display:flex; justify-content:space-between;">
                <strong class="text-accent">🌴 ${c.user}</strong>
                <button onclick="reportComment(${c.id})" title="Reportar comentario como ofensivo" style="background:transparent; border:none; color:#ef4444; font-size:0.8rem; cursor:pointer;">⚠️ Reportar</button>
            </div>
            <p class="mt-4" style="color: var(--text-muted);">${c.text}</p>
        </div>
    `).join('');

    const mapsEmbedUrl = \`https://maps.google.com/maps?q=\${place.coords}&t=&z=16&ie=UTF8&iwloc=&output=embed\`;

    container.innerHTML = `
        <div class="detail-header">
            <img src="${place.image}" alt="${place.name}" class="detail-img">
            <div class="detail-info">
                <div class="tag" style="position:relative; display:inline-block; top:0; right:0; margin-bottom:1rem;">${place.catName}</div>
                <h2 style="font-size: 2.5rem; margin-bottom: 0.5rem; color: var(--primary);">${place.name}</h2>
                <div class="rating mb-4" style="font-size: 1.5rem;">
                    ${getStarsHTML(place.rating)} <span style="color: var(--text-muted); font-size:1.2rem;">${place.rating} / 5</span>
                </div>
                <p class="text-muted mb-6" style="font-size: 1.1rem; line-height: 1.8;">${place.desc}</p>
                
                <div class="glass p-6" style="background: rgba(255,255,255,0.7); border: 1px solid var(--primary);">
                    <h3 style="color: var(--primary);">Comparte tu experiencia</h3>
                    <textarea id="new-comment-text" class="w-full" rows="3" placeholder="Escribe aquí tu reseña sobre ${place.name}..." style="background: white; border: 1px solid rgba(0,0,0,0.1); color: var(--text-main); padding: 10px; border-radius: 8px; margin-top: 10px; margin-bottom: 1rem; font-family:inherit;"></textarea>
                    <button class="btn-primary" onclick="postComment()">Publicar Reseña</button>
                </div>
            </div>
        </div>
        
        <div class="map-container">
            <h3 class="mb-4" style="color: var(--primary);">Ubicación GPS</h3>
            <iframe width="100%" height="400" src="${mapsEmbedUrl}" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
        </div>

        <div class="comments-list">
            <h3 class="mb-4" style="color: var(--primary);">Todas las Reseñas</h3>
            ${commentsHTML || '<p class="text-muted">No hay reseñas para mostrar todavía. ¡Sé el primero!</p>'}
        </div>
    `;
    
    showSection('detail');
}

// ====== Interactivity Logic ======
function postComment() {
    const currentUser = getDB('cx_current_user');
    if(!currentUser) {
        alert('🏄‍♂️ Por favor, Inicia Sesión en el panel superior antes de publicar.');
        showSection('login');
        return;
    }

    const textInput = document.getElementById('new-comment-text');
    const text = textInput.value.trim();
    if(!text) {
        alert('No escribiste nada en tu comentario.');
        return;
    }

    const comments = getDB('cx_comments');
    const newComment = {
        id: Date.now(), // Generate unique ID
        placeId: state.currentPlaceId,
        user: currentUser.name,
        text: text,
        reported: false
    };

    comments.push(newComment);
    setDB('cx_comments', comments);
    
    // Refresh detail view
    openDetail(state.currentPlaceId);
}

function reportComment(commentId) {
    if(confirm('¿Seguro quieres reportar este comentario como inapropiado? Los administradores lo revisarán.')) {
        const comments = getDB('cx_comments');
        const comment = comments.find(c => c.id === commentId);
        if(comment) {
            comment.reported = true;
            setDB('cx_comments', comments);
            alert('Gracias, el comentario ha sido enviado a revisión.');
        }
    }
}

// ====== Auth Logic ======
let authMode = 'login';
function switchAuth(mode) {
    authMode = mode;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    document.getElementById('name-group').style.display = mode === 'register' ? 'block' : 'none';
    document.getElementById('auth-submit').textContent = mode === 'register' ? '🌴 Registrarme' : '🌊 Entrar';
}

function handleAuth(event) {
    event.preventDefault();
    
    const email = event.target.querySelector('input[type="email"]').value.toLowerCase().trim();
    const pwd = event.target.querySelector('input[type="password"]').value;
    const users = getDB('cx_users');
    
    if (authMode === 'register') {
        // Register flow
        const name = event.target.querySelector('input[type="text"]').value.trim();
        if(users.some(u => u.email === email)) {
            alert('Ese correo ya está registrado en CostaFinder.');
            return;
        }
        
        const newUser = { id: Date.now(), name, email, pwd };
        users.push(newUser);
        setDB('cx_users', users);
        setDB('cx_current_user', { name, email, id: newUser.id });
        alert('¡Bienvenido! Cuenta creada exitosamente.');

    } else {
        // Login flow
        const user = users.find(u => u.email === email && u.pwd === pwd);
        if(!user) {
            alert('Correo o contraseña incorrecta, revisa tus datos 🏖️');
            return;
        }
        setDB('cx_current_user', { name: user.name, email: user.email, id: user.id });
    }

    // Limpiar form
    event.target.reset();
    updateNavbar();
    showSection('home');
}

function updateNavbar() {
    const currentUser = getDB('cx_current_user');
    const btn = document.querySelector('nav .btn-primary');
    
    if(currentUser) {
        btn.innerHTML = "Desconectar (" + currentUser.name.split(' ')[0] + ")";
        btn.style.background = "var(--danger)";
        btn.onclick = () => {
            if(confirm("¿Quieres cerrar sesión?")) {
                setDB('cx_current_user', null);
                updateNavbar();
                showSection('home');
            }
        };
    } else {
        btn.innerHTML = "Ingresar";
        btn.style.background = "var(--primary)";
        btn.onclick = () => showSection('login');
    }
}

// ====== Initialization ======
document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();
    showSection('home');
});
