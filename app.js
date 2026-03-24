// ====== State Management (LocalStorage) ======
const DEFAULT_PLACES = [
    { 
        id: 1, 
        name: "Hotel Maria del Mar", 
        type: "hotel", 
        catName: "Hotel",
        rating: 5.0, 
        image: "Hotel Maria Del Mar/Logo.jpg", 
        desc: "El mejor destino de descanso para disfrutar de impresionantes puestas de sol, relajación y contacto con la naturaleza. Tu escape perfecto en la playa.",
        coords: "18.6420777,-95.0989037",
        phone: "2727218110 y 2721265327",
        website: "https://www.facebook.com/HOTELMARIADELMARbreak",
        gallery: [
            "Hotel Maria Del Mar/Lobby.jpg", 
            "Hotel Maria Del Mar/Foto 1.jpg", 
            "Hotel Maria Del Mar/Foto 2.jpg", 
            "Hotel Maria Del Mar/Hab King.jpg", 
            "Hotel Maria Del Mar/Hab Triple.jpg", 
            "Hotel Maria Del Mar/Campestre.jpg"
        ]
    },
    { 
        id: 2, 
        name: "Playa de Montepío", 
        type: "attraction", 
        catName: "Zona Turística",
        rating: 5.0, 
        image: "playa de montepio/Playa 4.jpg", 
        desc: "Un paraíso natural perfecto para disfrutar del oleaje, la arena dorada y diversas actividades recreativas. El entorno ideal para relajarte o aventurarte.",
        coords: "18.6366,-95.0975",
        phone: "",
        website: "",
        gallery: [
            "playa de montepio/Playa 1.jpg", 
            "playa de montepio/Playa 2.jpg", 
            "playa de montepio/Playa 3.jpg", 
            "playa de montepio/Playa 4.jpg", 
            "playa de montepio/Playa 5.jpg"
        ]
    }
];

// Initialize DB if not exists
if (!localStorage.getItem('cx_places')) localStorage.setItem('cx_places', JSON.stringify(DEFAULT_PLACES));
if (!localStorage.getItem('cx_users')) localStorage.setItem('cx_users', JSON.stringify([]));
if (!localStorage.getItem('cx_comments')) localStorage.setItem('cx_comments', JSON.stringify([]));
if (!localStorage.getItem('cx_user_photos')) localStorage.setItem('cx_user_photos', JSON.stringify([]));
if (!localStorage.getItem('cx_current_user')) localStorage.setItem('cx_current_user', JSON.stringify(null));

function getDB(key) { return JSON.parse(localStorage.getItem(key)); }
function setDB(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

// Auto-migrate old cached places (like Hotel Maria del Mar Unsplash pic)
(function migrateDb() {
    let places = getDB('cx_places');
    if (places) {
        let hotel = places.find(p => p.id === 1);
        if (hotel) {
            hotel.phone = "2727218110 y 2721265327";
            hotel.website = "https://www.facebook.com/HOTELMARIADELMARbreak";
            if (!hotel.gallery) {
                hotel.image = "Hotel Maria Del Mar/Logo.jpg";
                hotel.gallery = [
                    "Hotel Maria Del Mar/Lobby.jpg", 
                    "Hotel Maria Del Mar/Foto 1.jpg", 
                    "Hotel Maria Del Mar/Foto 2.jpg", 
                    "Hotel Maria Del Mar/Hab King.jpg", 
                    "Hotel Maria Del Mar/Hab Triple.jpg", 
                    "Hotel Maria Del Mar/Campestre.jpg"
                ];
            }
        }
        
        let montepio = places.find(p => p.id === 2);
        if (!montepio) {
            places.push(DEFAULT_PLACES[1]);
        }
        setDB('cx_places', places);
    }
})();

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

function getCalculatedRating(placeId) {
    const comments = getDB('cx_comments').filter(c => c.placeId === placeId && c.rating);
    if (comments.length === 0) {
        const place = getDB('cx_places').find(p => p.id === placeId);
        return place ? place.rating : 5.0; 
    }
    const sum = comments.reduce((acc, c) => acc + c.rating, 0);
    return (sum / comments.length).toFixed(1);
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
        const currentRating = getCalculatedRating(item.id);
        const div = document.createElement('div');
        div.className = 'glass card';
        div.innerHTML = `
            <div class="tag">${item.catName}</div>
            <img src="${item.image}" alt="${item.name}" class="card-img">
            <div class="card-content">
                <h3 class="mb-2" style="color: var(--primary);">${item.name}</h3>
                <div class="rating">
                    ${getStarsHTML(currentRating)}
                    <span style="color: var(--text-muted); font-size: 0.9rem; margin-left: 5px;">${currentRating}</span>
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
                <div>
                    <strong class="text-accent">🌴 ${c.user}</strong>
                    ${c.rating ? `<span style="margin-left:10px; font-size:0.9rem;">${getStarsHTML(c.rating)}</span>` : ''}
                </div>
                <button onclick="reportComment(${c.id})" title="Reportar comentario como ofensivo" style="background:transparent; border:none; color:#ef4444; font-size:0.8rem; cursor:pointer;">⚠️ Reportar</button>
            </div>
            <p class="mt-4" style="color: var(--text-muted);">${c.text}</p>
        </div>
    `).join('');

    const currentRating = getCalculatedRating(id);
    const mapsEmbedUrl = `https://maps.google.com/maps?q=${place.coords}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

    // user photos
    const allUserPhotos = getDB('cx_user_photos') || [];
    const userPhotosHtml = allUserPhotos.filter(p => p.placeId === id).map(p => `
        <div style="display:inline-block; margin: 10px; width: 120px; text-align:center;">
            <img src="${p.photoUrl}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px;">
            <small style="color:var(--text-muted); display:block; margin-top:5px;">Por: ${p.user}</small>
        </div>
    `).join('');

    const officialGalleryHtml = place.gallery ? place.gallery.map(img => `
        <img src="${img}" onclick="openImageModal('${img}')" style="width: 150px; height: 100px; object-fit: cover; border-radius: 8px; margin-right: 15px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
    `).join('') : '';

    container.innerHTML = `
        <div class="detail-header">
            <img src="${place.image}" alt="${place.name}" class="detail-img">
            <div class="detail-info">
                <div class="tag" style="position:relative; display:inline-block; top:0; right:0; margin-bottom:1rem;">${place.catName}</div>
                <h2 style="font-size: 2.5rem; margin-bottom: 0.5rem; color: var(--primary);">${place.name}</h2>
                <div class="rating mb-4" style="font-size: 1.5rem;">
                    ${getStarsHTML(currentRating)} <span style="color: var(--text-muted); font-size:1.2rem;">${currentRating} / 5</span>
                </div>
                <p class="text-muted mb-6" style="font-size: 1.1rem; line-height: 1.8;">${place.desc}</p>
                
                ${place.phone || place.website || officialGalleryHtml ? `
                <div class="glass p-6 mb-6" style="background: rgba(var(--primary-rgb), 0.1); border: 1px solid var(--primary); border-radius: 12px;">
                    <h3 style="color: var(--primary); margin-bottom: 0.5rem;">Contacto Oficial</h3>
                    ${place.phone ? `<p style="color: var(--text-main); margin-bottom: 0.5rem;">📞 ${place.phone}</p>` : ''}
                    ${place.website ? `<p style="color: var(--text-main); margin-bottom: 1rem;">🌐 <a href="${place.website}" target="_blank" style="color: var(--accent); text-decoration: none;">Visitar Sitio Web</a></p>` : ''}
                    ${officialGalleryHtml ? `
                    <h4 style="color: var(--text-main); margin-top: 1rem; margin-bottom: 0.5rem;">Catálogo Oficial</h4>
                    <div style="display: flex; overflow-x: auto; padding-bottom: 10px;">
                        ${officialGalleryHtml}
                    </div>` : ''}
                </div>
                ` : ''}
                
                <div class="glass p-6" style="background: rgba(255,255,255,0.7); border: 1px solid var(--primary);">
                    <h3 style="color: var(--primary);">Comparte tu experiencia</h3>
                    <div style="margin-bottom: 0.5rem;">
                        <label style="color:var(--text-main); font-weight:600; margin-right: 0.5rem;">Calificación:</label>
                        <select id="new-comment-rating" style="padding: 5px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.1); font-family: inherit;">
                            <option value="5">⭐⭐⭐⭐⭐ Excelente</option>
                            <option value="4">⭐⭐⭐⭐ Muy Bueno</option>
                            <option value="3">⭐⭐⭐ Bueno</option>
                            <option value="2">⭐⭐ Regular</option>
                            <option value="1">⭐ Malo</option>
                        </select>
                    </div>
                    <textarea id="new-comment-text" class="w-full" rows="3" placeholder="Escribe aquí tu reseña sobre ${place.name}..." style="background: white; border: 1px solid rgba(0,0,0,0.1); color: var(--text-main); padding: 10px; border-radius: 8px; margin-top: 10px; margin-bottom: 1rem; font-family:inherit;"></textarea>
                    <button class="btn-primary" onclick="postComment()" style="margin-bottom: 1rem;">Publicar Reseña</button>
                    
                    <hr style="border:0; border-top:1px solid rgba(0,0,0,0.1); margin: 1rem 0;">
                    
                    <h4 style="color: var(--primary); margin-bottom: 0.5rem;">Añadir Foto del Lugar</h4>
                    <input type="file" id="user-photo-upload" accept="image/*" style="margin-bottom: 10px; width:100%;">
                    <button class="btn-outline" onclick="uploadUserPhoto()">Subir Foto</button>
                </div>
            </div>
        </div>
        
        <div class="map-container">
            <h3 class="mb-4" style="color: var(--primary);">Ubicación GPS</h3>
            <iframe width="100%" height="400" src="${mapsEmbedUrl}" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
        </div>

        <div class="user-photos-list" style="margin-top: 2rem;">
            <h3 class="mb-4" style="color: var(--primary);">Fotos de usuarios</h3>
            <div>
            ${userPhotosHtml || '<p class="text-muted">Aún no hay fotos de usuarios. ¡Sé el primero en subir una!</p>'}
            </div>
        </div>

        <div class="comments-list" style="margin-top: 2rem;">
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

    const ratingInput = document.getElementById('new-comment-rating');
    const commentRating = ratingInput ? parseInt(ratingInput.value) : 5;

    const comments = getDB('cx_comments');
    const newComment = {
        id: Date.now(), // Generate unique ID
        placeId: state.currentPlaceId,
        user: currentUser.name,
        text: text,
        rating: commentRating,
        reported: false
    };

    comments.push(newComment);
    setDB('cx_comments', comments);
    
    // Refresh detail view
    openDetail(state.currentPlaceId);
}

function uploadUserPhoto() {
    const currentUser = getDB('cx_current_user');
    if(!currentUser) {
        alert('🏄‍♂️ Por favor, Inicia Sesión en el panel superior antes de subir fotos.');
        showSection('login');
        return;
    }

    const fileInput = document.getElementById('user-photo-upload');
    if(!fileInput.files || fileInput.files.length === 0) {
        alert('Por favor, selecciona una foto primero.');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const photos = getDB('cx_user_photos') || [];
        photos.push({
            id: Date.now(),
            placeId: state.currentPlaceId,
            user: currentUser.name,
            photoUrl: e.target.result
        });
        setDB('cx_user_photos', photos);
        openDetail(state.currentPlaceId);
    };
    reader.readAsDataURL(file);
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
            alert('Ese correo ya está registrado en CoastGuide.');
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

// ====== Image Modal Logic ======
window.openImageModal = function(src) {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(0,0,0,0.85)';
    modal.style.zIndex = '9999';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.cursor = 'pointer';
    modal.innerHTML = `
        <img src="${src}" style="max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <button style="position: absolute; top: 20px; right: 30px; background: transparent; color: white; border: none; font-size: 2.5rem; cursor: pointer;">&times;</button>
    `;
    modal.onclick = () => document.body.removeChild(modal);
    document.body.appendChild(modal);
};
