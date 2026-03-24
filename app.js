// ====== State & Data ======
const state = {
    currentUser: null,
    places: [
        { 
            id: 1, 
            name: "Hotel Maria del Mar", 
            type: "hotel", 
            catName: "Hotel",
            rating: 4.8, 
            image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=600&q=80", 
            desc: "Un hermoso hotel boutique frente al mar, inspirado en la brisa tropical. Relájate en la piscina, camina por la suave arena y disfruta de los mejores atardeceres de la costa.",
            coords: "Hotel+María+del+Mar+Tulum" // Used for Google Maps Embed
        },
        { 
            id: 2, 
            name: "Mariscos El Pescador", 
            type: "restaurant", 
            catName: "Restaurante",
            rating: 4.7, 
            image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=600&q=80", 
            desc: "Disfruta de platillos frescos del mar a la mesa. Especialistas en ceviche, camarones al ajillo y pescado frito con vista directa al oleaje caribeño.",
            coords: "Marisquería+Playa"
        },
        { 
            id: 3, 
            name: "Buceo Coralino", 
            type: "attraction", 
            catName: "Atracción",
            rating: 4.9, 
            image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80", 
            desc: "Sumérgete en las maravillas ocultas bajo el océano. Ofrecemos tours de buceo y snorkel para explorar los arrecifes de coral y la vida marina.",
            coords: "Buceo+Arrecife"
        },
        { 
            id: 4, 
            name: "Club de Playa Oasis", 
            type: "attraction", 
            catName: "Club de Playa",
            rating: 4.5, 
            image: "https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?auto=format&fit=crop&w=600&q=80", 
            desc: "El club de playa con más vibrante energía. Cabañas privadas, DJs internacionales y cócteles exóticos bajo las palmeras.",
            coords: "Beach+Club+Costa"
        }
    ],
    comments: [
        { id: 1, placeId: 1, user: "ViajeroFrecuente", text: "Me hospedé en el Hotel Maria del Mar y la experiencia fue mágica. Recomendadísimo.", reported: false },
        { id: 2, placeId: 2, user: "AnaCocina", text: "El ceviche es espectacular, aunque había mucha fila para entrar.", reported: false },
        { id: 3, placeId: 1, user: "TuristaAlegre", text: "La piscina es muy agradable, perfecto para desconectarse.", reported: false }
    ],
    currentPlaceId: null
};

// ====== Navigation ======
function showSection(id) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    // Auth navbar update logic
    if (state.currentUser && id === 'login') {
        alert("Ya has iniciado sesión como " + state.currentUser.name);
        showSection('home');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ====== Render Functions ======

// Generate star string
function getStarsHTML(rating) {
    let html = '';
    for(let i = 1; i <= 5; i++) {
        html += `<span style="color: ${i <= Math.round(rating) ? '#fbbf24' : '#94a3b8'}">★</span>`;
    }
    return html;
}

// Render place cards
function renderCards(containerId, data) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
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

// ====== Catalog Logic ======
function filterCatalog(type) {
    // Update active button
    document.querySelectorAll('.filters .filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Filter array
    const filtered = type === 'all' 
        ? state.places 
        : state.places.filter(p => p.type === type);
    
    renderCards('catalog-grid', filtered);
}

// ====== Detail Logic & Google Maps ======
function openDetail(id) {
    const place = state.places.find(p => p.id === id);
    if(!place) return;
    
    state.currentPlaceId = id;
    const container = document.getElementById('detail-content');
    
    // Get comments for this place
    const placeComments = state.comments.filter(c => c.placeId === id);
    const commentsHTML = placeComments.map(c => `
        <div class="comment-item">
            <strong class="text-accent">${c.user}</strong>
            <p class="mt-4" style="color: var(--text-muted);">${c.text}</p>
        </div>
    `).join('');

    // Generate Google Maps URL (static embed without API key via standard query)
    const mapsEmbedUrl = \`https://maps.google.com/maps?q=\${place.coords}&t=&z=14&ie=UTF8&iwloc=&output=embed\`;

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
                    <h3 style="color: var(--primary);">Califica tu experiencia</h3>
                    <div style="font-size: 2rem; color: #94a3b8; margin: 10px 0; cursor: pointer;">
                        ★ ★ ★ ★ ★
                    </div>
                    <textarea class="w-full" rows="3" placeholder="Comparte tu opinión con otros viajeros..." style="background: white; border: 1px solid rgba(0,0,0,0.1); color: var(--text-main); padding: 10px; border-radius: 8px; margin-bottom: 1rem;"></textarea>
                    <button class="btn-primary" onclick="alert('Necesitas iniciar sesión para calificar.')">Publicar Reseña</button>
                </div>
            </div>
        </div>
        
        <div class="map-container">
            <h3 class="mb-4" style="color: var(--primary);">Ubicación en el Mapa GPS</h3>
            <iframe width="100%" height="400" src="${mapsEmbedUrl}" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
        </div>

        <div class="comments-list">
            <h3 class="mb-4" style="color: var(--primary);">Comentarios Recientes</h3>
            ${commentsHTML || '<p class="text-muted">Aún no hay comentarios. ¡Sé el primero en contar tu experiencia en la playa!</p>'}
        </div>
    `;
    
    showSection('detail');
}

// ====== Auth Logic ======
let authMode = 'login';
function switchAuth(mode) {
    authMode = mode;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    document.getElementById('name-group').style.display = mode === 'register' ? 'block' : 'none';
    document.getElementById('auth-submit').textContent = mode === 'register' ? 'Crear Cuenta' : 'Entrar';
}

function handleAuth(event) {
    event.preventDefault();
    // Simular Auth
    const email = event.target.querySelector('input[type="email"]').value;
    state.currentUser = { name: authMode === 'register' ? event.target.querySelector('input[type="text"]').value : email.split('@')[0], email };
    
    // Update navbar
    const btn = document.querySelector('nav .btn-primary');
    btn.innerHTML = "🌊 " + state.currentUser.name;
    btn.onclick = () => alert("Perfil de viajero próximamente");
    btn.style.background = "var(--accent)";
    
    alert(`¡Bienvenido a CostaFinder, ${state.currentUser.name}!`);
    showSection('home');
}

// ====== Initialization ======
document.addEventListener('DOMContentLoaded', () => {
    // Show top 3 in HOME
    renderCards('featured-grid', state.places.slice(0, 3));
    // Show all in CATALOG
    renderCards('catalog-grid', state.places);
});
