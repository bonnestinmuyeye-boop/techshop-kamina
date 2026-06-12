// Initialisation ou chargement du catalogue depuis le stockage local
let CATALOGUE = JSON.parse(localStorage.getItem('techCatalogue')) || [
    { id: "p1", name: "MacBook Air M2", category: "Ordinateurs", price: 1200, specs: "8 Go RAM - 256 Go SSD", imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500" },
    { id: "p3", name: "iPhone 15 Pro", category: "Smartphones", price: 1050, specs: "128 Go - Titane Naturel", imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500" },
    { id: "p5", name: "Casque Sony WH-1000XM5", category: "Accessoires", price: 350, specs: "Réduction de bruit active", imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500" }
];
if(!localStorage.getItem('techCatalogue')) {
    localStorage.setItem('techCatalogue', JSON.stringify(CATALOGUE));
}

let panier = JSON.parse(localStorage.getItem('monPanierTech')) || [];
let categorieActuelle = "tous";
let rechercheActuelle = "";

// Capture DOM
const themeToggle = document.getElementById('theme-toggle');
const productsContainer = document.getElementById('products-container');
const cartCountBadge = document.getElementById('cart-count');
const cartTotalSpan = document.getElementById('cart-total');
const cartItemsContainer = document.getElementById('cart-items-container');
const authNavBtn = document.getElementById('auth-nav-btn');

// --- LOGIQUE DU THÈME SOMBRE / CLAIR ---
const themeActuel = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', themeActuel);

themeToggle.addEventListener('click', () => {
    let mode = document.documentElement.getAttribute('data-theme');
    let nouveauMode = mode === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nouveauMode);
    localStorage.setItem('theme', nouveauMode);
});

// Ajuster le bouton de connexion si quelqu'un est connecté
const sessionActive = JSON.parse(localStorage.getItem('sessionActive'));
if(sessionActive) {
    authNavBtn.innerText = sessionActive.role === 'admin' ? "Admin panel" : "Déconnexion";
    authNavBtn.onclick = () => {
        if(sessionActive.role === 'admin') { window.location.href='admin.html'; }
        else { localStorage.removeItem('sessionActive'); window.location.reload(); }
    };
}

// Interdire ou autoriser l'accès au checkout selon la connexion
document.getElementById('proceed-to-checkout-btn').addEventListener('click', () => {
    if(!sessionActive) {
        alert("Vous devez être connecté pour valider votre panier.");
        window.location.href = 'login.html';
    } else {
        window.location.href = 'checkout.html';
    }
});

// Filtrage et affichage
function afficherCatalogue() {
    if(!productsContainer) return;
    productsContainer.innerHTML = "";
    
    let filtres = CATALOGUE.filter(p => {
        let matchCat = (categorieActuelle === "tous" || p.category === categorieActuelle);
        let matchSearch = p.name.toLowerCase().includes(rechercheActuelle.toLowerCase());
        return matchCat && matchSearch;
    });

    filtres.forEach(p => {
        productsContainer.innerHTML += `
            <div class="product-card">
                <div class="img-container"><img src="${p.imageUrl}"></div>
                <div class="product-info">
                    <span class="category-tag">${p.category}</span>
                    <h3>${p.name}</h3><p class="specs">${p.specs}</p>
                    <div class="price-row">
                        <span class="price">${p.price} $</span>
                        <button class="add-btn-large" onclick="ajouterAuPanier('${p.id}')">Ajouter au panier</button>
                    </div>
                </div>
            </div>`;
    });
}

// Écouteurs de recherche et filtres
if(document.getElementById('search-input')) {
    document.getElementById('search-input').addEventListener('input', (e) => {
        rechercheActuelle = e.target.value;
        afficherCatalogue();
    });
    document.querySelectorAll('.filter-btn').forEach(b => {
        b.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            categorieActuelle = e.target.getAttribute('data-category');
            afficherCatalogue();
        });
    });
}

// Panier Actions
function ajouterAuPanier(id) {
    let p = CATALOGUE.find(prod => prod.id === id);
    let exist = panier.find(item => item.id === id);
    if(exist) { exist.quantite++; } 
    else { panier.push({...p, quantite: 1}); }
    mettreAJourPanier();
}
function changerQuantite(id, act) {
    let item = panier.find(i => i.id === id);
    if(act==='up') item.quantite++;
    else { item.quantite--; if(item.quantite===0) panier = panier.filter(i=>i.id!==id); }
    mettreAJourPanier();
}
function supprimerArticle(id) {
    panier = panier.filter(i => i.id !== id);
    mettreAJourPanier();
}
function mettreAJourPanier() {
    localStorage.setItem('monPanierTech', JSON.stringify(panier));
    if(cartCountBadge) cartCountBadge.innerText = panier.reduce((t, i) => t + i.quantite, 0);
    if(cartTotalSpan) cartTotalSpan.innerText = `${panier.reduce((t, i) => t + (i.price * i.quantite), 0)} $`;
    
    if(!cartItemsContainer) return;
    if(panier.length === 0) { cartItemsContainer.innerHTML = "<p class='empty-cart-msg'>Vide</p>"; return; }
    
    cartItemsContainer.innerHTML = "";
    panier.forEach(i => {
        cartItemsContainer.innerHTML += `
            <div class="cart-item">
                <img src="${i.imageUrl}">
                <div class="cart-item-info">
                    <h4>${i.name}</h4><p class="cart-item-price">${i.price} $</p>
                    <div class="cart-item-actions">
                        <div class="quantity-controls">
                            <button onclick="changerQuantite('${i.id}','down')">-</button><span>${i.quantite}</span><button onclick="changerQuantite('${i.id}','up')">+</button>
                        </div>
                        <button onclick="supprimerArticle('${i.id}')">🗑️</button>
                    </div>
                </div>
            </div>`;
    });
}

// Lanceurs d'animations d'ouverture
if(document.getElementById('open-cart-btn')) {
    document.getElementById('open-cart-btn').addEventListener('click', () => { document.getElementById('cart-sidebar').classList.add('open'); document.getElementById('sidebar-overlay').classList.add('visible'); });
    document.getElementById('close-cart-btn').addEventListener('click', () => { document.getElementById('cart-sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').classList.remove('visible'); });
}

afficherCatalogue();
mettreAJourPanier();
