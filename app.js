// =================================================================
// 1. CONFIGURATION & INITIALISATION DE FIREBASE
// =================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, getDoc, deleteDoc, serverTimestamp, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCPKbw-M_fbEUtoeUAW5L3GI8mKXJIlfyA",
  authDomain: "techshop-kamina.firebaseapp.com",
  projectId: "techshop-kamina",
  storageBucket: "techshop-kamina.firebasestorage.app",
  messagingSenderId: "400768708816",
  appId: "1:400768708816:web:aff9de5bec9d59b9ff2ed5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// =================================================================
// 2. ÉTATS GLOBAUX
// =================================================================
let CATALOGUE = [];
let PANIER = JSON.parse(localStorage.getItem('panier')) || [];
let categorieActiveClient = "tous";
let categorieActiveAdmin = "Ordinateurs";
let modeInscription = false;
let utilisateurConnecte = null;
let clientSelectionneChat = null;

// Chiffrement / Déchiffrement local de bout en bout
function crypterTexte(txt) {
    if (!txt) return "";
    return btoa(unescape(encodeURIComponent(txt)));
}
function decrypterTexte(crypto) {
    if (!crypto) return "";
    try { return decodeURIComponent(escape(atob(crypto))); } catch(e) { return crypto; }
}

// =================================================================
// 3. NAVIGATION (SPA)
// =================================================================
function naviguerVers(idEcran) {
    fermerPanier();
    document.querySelectorAll('.app-screen').forEach(screen => {
        screen.style.display = 'none';
    });
    const ecranCible = document.getElementById(idEcran);
    if (ecranCible) {
        if (idEcran === 'screen-checkout' || idEcran === 'screen-admin') {
            ecranCible.style.display = 'grid';
        } else {
            ecranCible.style.display = 'block';
        }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =================================================================
// 4. CHARGEMENT INITIAL & ÉCOUTEURS
// =================================================================
window.addEventListener('DOMContentLoaded', () => {
    const logo = document.getElementById('main-logo-btn');
    if (logo) logo.addEventListener('click', () => {
        if (utilisateurConnecte && document.getElementById('admin-badge').style.display !== 'none') {
            naviguerVers('screen-admin');
        } else {
            naviguerVers('screen-home');
        }
    });

    // Panier
    const openCartBtn = document.getElementById('open-cart-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const overlay = document.getElementById('sidebar-overlay');
    const proceedBtn = document.getElementById('proceed-to-checkout-btn');

    if (openCartBtn) openCartBtn.addEventListener('click', ouvrirPanier);
    if (closeCartBtn) closeCartBtn.addEventListener('click', fermerPanier);
    if (overlay) overlay.addEventListener('click', fermerPanier);

    if (proceedBtn) {
        proceedBtn.addEventListener('click', () => {
            if (PANIER.length === 0) {
                alert("Votre panier est vide !");
                return;
            }
            if (!utilisateurConnecte) {
                alert("Veuillez vous connecter pour valider votre commande.");
                modeInscription = false;
                basculerFormulaireAuth();
                naviguerVers('screen-auth');
                return;
            }
            preparerEcranCheckout();
            naviguerVers('screen-checkout');
        });
    }

    // Afficher/Masquer le mot de passe
    const togglePasswordBtn = document.getElementById('toggle-password-visibility');
    const passwordInput = document.getElementById('auth-password');
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
        });
    }

    // Authentification
    const authForm = document.getElementById('auth-form');
    if (authForm) authForm.addEventListener('submit', gererSoumissionAuth);

    const linkSwitch = document.getElementById('link-switch-auth');
    if (linkSwitch) {
        linkSwitch.addEventListener('click', (e) => {
            e.preventDefault();
            modeInscription = !modeInscription;
            basculerFormulaireAuth();
        });
    }

    // Checkout
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) checkoutForm.addEventListener('submit', validerCommandeFinale);
    const payMobile = document.getElementById('pay-mobile');
    const payCash = document.getElementById('pay-cash');
    if (payMobile) payMobile.addEventListener('change', () => { document.getElementById('mobile-operators-section').style.display = 'block'; });
    if (payCash) payCash.addEventListener('change', () => { document.getElementById('mobile-operators-section').style.display = 'none'; });

    // Filtres catégories
    document.querySelectorAll('.categories-container .filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.categories-container .filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            categorieActiveClient = this.getAttribute('data-category');
            afficherCatalogueClient();
        });
    });

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.addEventListener('input', filtrerRecherche);

    // Onglets Admin
    const tabsAdmin = { 'tab-computers': 'Ordinateurs', 'tab-smartphones': 'Smartphones', 'tab-accessories': 'Accessoires' };
    Object.keys(tabsAdmin).forEach(idTab => {
        const tabEl = document.getElementById(idTab);
        if (tabEl) {
            tabEl.addEventListener('click', function() {
                document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                categorieActiveAdmin = tabsAdmin[idTab];
                document.getElementById('form-admin-title').textContent = "Ajouter un produit dans : " + categorieActiveAdmin;
                afficherProduitsAdmin();
            });
        }
    });

    const adminProductForm = document.getElementById('admin-product-form');
    if (adminProductForm) adminProductForm.addEventListener('submit', ajouterNouveauProduitAdmin);

    // Mode Sombre
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
        });
    }

    // Chat widget
    const chatOpenBtn = document.getElementById('ai-chat-open-btn');
    const chatCloseBtn = document.getElementById('ai-chat-close-btn');
    const chatBox = document.getElementById('ai-chat-box');
    if (chatOpenBtn && chatBox) {
        chatOpenBtn.addEventListener('click', () => {
            chatBox.style.display = (chatBox.style.display === 'flex') ? 'none' : 'flex';
        });
    }
    if (chatCloseBtn && chatBox) {
        chatCloseBtn.addEventListener('click', () => { chatBox.style.display = 'none'; });
    }

    const clientChatSendBtn = document.getElementById('client-chat-send-btn') || document.getElementById('ai-chat-send-btn');
    const clientChatInput = document.getElementById('client-chat-input') || document.getElementById('ai-chat-input');
    if (clientChatSendBtn) clientChatSendBtn.addEventListener('click', envoyerMessageClient);
    if (clientChatInput) clientChatInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') envoyerMessageClient(); });

    // Démarrage des données
    synchroniserPanier();
    chargerCatalogueDepuisCloud();
});

// =================================================================
// 5. AUTHENTIFICATION & SESSION
// =================================================================
onAuthStateChanged(auth, async (user) => {
    const authBtn = document.getElementById('auth-nav-btn');
    const adminBadge = document.getElementById('admin-badge');

    if (user) {
        utilisateurConnecte = user;
        if (authBtn) authBtn.textContent = "Déconnexion";

        try {
            const docRef = doc(db, "utilisateurs", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists() && docSnap.data().role === 'admin') {
                if (adminBadge) adminBadge.style.display = 'inline-block';
                naviguerVers('screen-admin');
                chargerUtilisateursAdmin();
                ecouterCommandesAdmin();
                ecouterDiscussionsPourAdmin();
            } else {
                if (adminBadge) adminBadge.style.display = 'none';
                ecouterMessagesClient();
            }
        } catch (e) {
            console.error(e);
        }
    } else {
        utilisateurConnecte = null;
        if (authBtn) authBtn.textContent = "Connexion";
        if (adminBadge) adminBadge.style.display = 'none';
    }
});

const authNavBtn = document.getElementById('auth-nav-btn');
if (authNavBtn) {
    authNavBtn.addEventListener('click', () => {
        if (utilisateurConnecte) {
            signOut(auth).then(() => {
                alert("Session déconnectée.");
                naviguerVers('screen-home');
            });
        } else {
            modeInscription = false;
            basculerFormulaireAuth();
            naviguerVers('screen-auth');
        }
    });
}

function basculerFormulaireAuth() {
    document.getElementById('auth-title').textContent = modeInscription ? "Créer un compte" : "Connexion";
    document.getElementById('auth-submit-btn').textContent = modeInscription ? "S'inscrire" : "Se connecter";
    document.getElementById('auth-switch-text').innerHTML = modeInscription ? 
        `Déjà inscrit ? <a href="#" id="link-switch-auth">Se connecter</a>` : 
        `Pas encore de compte ? <a href="#" id="link-switch-auth">Créer un compte</a>`;

    document.getElementById('link-switch-auth').addEventListener('click', (e) => {
        e.preventDefault();
        modeInscription = !modeInscription;
        basculerFormulaireAuth();
    });
}

async function gererSoumissionAuth(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;

    try {
        if (modeInscription) {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            await setDoc(doc(db, "utilisateurs", userCredential.user.uid), {
                email: email,
                role: "client",
                createdAt: serverTimestamp()
            });
            alert("Compte client créé avec succès !");
        } else {
            await signInWithEmailAndPassword(auth, email, pass);
        }
        document.getElementById('auth-form').reset();
        naviguerVers('screen-home');
    } catch (err) {
        alert("Erreur Authentification : " + err.message);
    }
}

// =================================================================
// 6. CHARGEMENT ET AFFICHAGE DU CATALOGUE (RÉSOLU)
// =================================================================
async function chargerCatalogueDepuisCloud() {
    try {
        const querySnapshot = await getDocs(collection(db, "produits"));
        CATALOGUE = [];
        querySnapshot.forEach((docSnap) => {
            const d = docSnap.data();
            CATALOGUE.push({
                id: docSnap.id,
                name: d.name || d.nom || "Article",
                specs: d.specs || d.caracteristiques || "",
                price: d.price || d.prix || 0,
                imageUrl: d.imageUrl || d.image || "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400",
                category: d.category || d.categorie || "Ordinateurs"
            });
        });
        afficherCatalogueClient();
        if (utilisateurConnecte) afficherProduitsAdmin();
    } catch (error) {
        console.error("Erreur de chargement Firestore :", error);
    }
}

function afficherCatalogueClient() {
    const container = document.getElementById('products-container');
    if (!container) return;
    container.innerHTML = "";

    const produitsFiltres = CATALOGUE.filter(p => categorieActiveClient === "tous" || p.category === categorieActiveClient);

    if (produitsFiltres.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted);">Aucun équipement disponible.</p>`;
        return;
    }

    produitsFiltres.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${p.imageUrl}" alt="${p.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${p.name}</h3>
                <p class="product-specs">${p.specs}</p>
                <div class="product-footer">
                    <span class="product-price">${p.price} $</span>
                    <button class="add-to-cart-btn" data-id="${p.id}">🛒 Ajouter</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            ajouterAuPanier(this.getAttribute('data-id'));
        });
    });
}

function filtrerRecherche() {
    const cible = this.value.toLowerCase();
    const container = document.getElementById('products-container');
    if (!container) return;
    container.innerHTML = "";

    const produitsFiltres = CATALOGUE.filter(p => p.name.toLowerCase().includes(cible) || p.specs.toLowerCase().includes(cible));

    produitsFiltres.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${p.imageUrl}" alt="${p.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${p.name}</h3>
                <p class="product-specs">${p.specs}</p>
                <div class="product-footer">
                    <span class="product-price">${p.price} $</span>
                    <button class="add-to-cart-btn" data-id="${p.id}">🛒 Ajouter</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// =================================================================
// 7. GESTION DU PANIER
// =================================================================
function ouvrirPanier() {
    document.getElementById('cart-sidebar').classList.add('open');
    document.getElementById('sidebar-overlay').classList.add('open');
}
function fermerPanier() {
    document.getElementById('cart-sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('open');
}

function ajouterAuPanier(id) {
    const itemStock = CATALOGUE.find(p => p.id === id);
    if (!itemStock) return;
    const existant = PANIER.find(item => item.id === id);
    if (existant) {
        existant.quantite++;
    } else {
        PANIER.push({ ...itemStock, quantite: 1 });
    }
    synchroniserPanier();
}

window.viderLePanierComplet = function() {
    if (confirm("Voulez-vous vraiment vider le panier ?")) {
        PANIER = [];
        synchroniserPanier();
        fermerPanier();
    }
};

function synchroniserPanier() {
    localStorage.setItem('panier', JSON.stringify(PANIER));
    const totalItems = PANIER.reduce((sum, item) => sum + item.quantite, 0);
    const prixTotal = PANIER.reduce((sum, item) => sum + (item.price * item.quantite), 0);

    const countEl = document.getElementById('cart-count');
    const totalEl = document.getElementById('cart-total');
    if (countEl) countEl.textContent = totalItems;
    if (totalEl) totalEl.textContent = prixTotal + " $";

    const container = document.getElementById('cart-items-container');
    if (!container) return;

    if (PANIER.length === 0) {
        container.innerHTML = `<p class="empty-cart-msg">Votre panier est vide.</p>`;
    } else {
        container.innerHTML = "";
        PANIER.forEach(item => {
            const row = document.createElement('div');
            row.className = 'cart-item';
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.justifyContent = 'space-between';
            row.style.padding = '10px 0';
            row.style.borderBottom = '1px solid var(--border)';
            row.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px; flex:1;">
                    <img src="${item.imageUrl}" alt="${item.name}" style="width:45px; height:45px; object-fit:cover; border-radius:6px; background:#fafafa;">
                    <div>
                        <h4 style="margin:0; font-size:13px; font-weight:600;">${item.name}</h4>
                        <small style="color:var(--text-muted);">${item.price} $ x ${item.quantite}</small>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:5px;">
                    <button class="qty-btn" onclick="window.modifierQte('${item.id}', -1)">-</button>
                    <button class="qty-btn" onclick="window.modifierQte('${item.id}', 1)">+</button>
                    <button onclick="window.retirerDuPanier('${item.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer;">❌</button>
                </div>
            `;
            container.appendChild(row);
        });

        const clearBtn = document.createElement('div');
        clearBtn.style.padding = '10px 0';
        clearBtn.innerHTML = `
            <button onclick="window.viderLePanierComplet()" style="width:100%; background:#ef4444; color:white; border:none; padding:10px; border-radius:8px; font-weight:bold; cursor:pointer;">
                🗑️ Vider le panier
            </button>
        `;
        container.appendChild(clearBtn);
    }
}

window.modifierQte = function(id, mod) {
    const item = PANIER.find(i => i.id === id);
    if (!item) return;
    item.quantite += mod;
    if (item.quantite <= 0) PANIER = PANIER.filter(i => i.id !== id);
    synchroniserPanier();
};

window.retirerDuPanier = function(id) {
    PANIER = PANIER.filter(i => i.id !== id);
    synchroniserPanier();
};

function preparerEcranCheckout() {
    const summaryContainer = document.getElementById('checkout-summary-items');
    if (!summaryContainer) return;
    summaryContainer.innerHTML = "";

    PANIER.forEach(item => {
        summaryContainer.innerHTML += `<div style="display:flex; justify-content:space-between; margin-bottom:8px;"><span>${item.name} (x${item.quantite})</span><span>${item.price * item.quantite} $</span></div>`;
    });
    const total = PANIER.reduce((sum, item) => sum + (item.price * item.quantite), 0);
    document.getElementById('summary-subtotal').textContent = total + " $";
    document.getElementById('summary-total').textContent = total + " $";
}

async function validerCommandeFinale(e) {
    e.preventDefault();
    const modePaiement = document.querySelector('input[name="payment"]:checked').value;
    let detailPaiement = modePaiement === 'cash' ? 'À la livraison (Espèces)' : 'Mobile Money';

    if (modePaiement === 'mobile_money') {
        const operateur = document.querySelector('input[name="operator"]:checked').value;
        detailPaiement += ` (${operateur})`;
    }

    const commandePayload = {
        clientUid: utilisateurConnecte.uid,
        clientEmail: utilisateurConnecte.email,
        livraison: {
            nom: document.getElementById('nom').value,
            telephone: "+243" + document.getElementById('telephone').value,
            numero: document.getElementById('adr-numero').value,
            avenue: document.getElementById('adr-avenue').value,
            quartier: document.getElementById('adr-quartier').value,
            commune: document.getElementById('adr-commune').value
        },
        articles: PANIER.map(item => ({ name: item.name, price: item.price, quantite: item.quantite })),
        montantTotal: PANIER.reduce((sum, item) => sum + (item.price * item.quantite), 0),
        modePaiement: detailPaiement,
        dateCommande: serverTimestamp()
    };

    try {
        await addDoc(collection(db, "commandes"), commandePayload);
        alert("Commande enregistrée avec succès !");
        PANIER = [];
        synchroniserPanier();
        document.getElementById('checkout-form').reset();
        naviguerVers('screen-home');
    } catch (err) {
        alert("Erreur commande : " + err.message);
    }
}

// =================================================================
// 8. LOGIQUE ADMINISTRATION FIRESTORE
// =================================================================
async function ajouterNouveauProduitAdmin(e) {
    e.preventDefault();
    const nouveauProduit = {
        name: document.getElementById('admin-p-name').value,
        specs: document.getElementById('admin-p-specs').value,
        price: parseInt(document.getElementById('admin-p-price').value) || 0,
        imageUrl: document.getElementById('admin-p-image').value,
        category: categorieActiveAdmin,
        createdAt: new Date().getTime()
    };

    try {
        await addDoc(collection(db, "produits"), nouveauProduit);
        alert("Produit ajouté avec succès !");
        document.getElementById('admin-product-form').reset();
        chargerCatalogueDepuisCloud();
    } catch (err) {
        alert("Erreur d'ajout : " + err.message);
    }
}

function afficherProduitsAdmin() {
    const listContainer = document.getElementById('admin-products-list-container');
    if (!listContainer) return;
    listContainer.innerHTML = "";

    const produitsFiltres = CATALOGUE.filter(p => p.category === categorieActiveAdmin);

    produitsFiltres.forEach(p => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '8px';
        row.style.borderBottom = '1px solid var(--border)';
        row.innerHTML = `
            <div><strong>${p.name}</strong> - ${p.price} $</div>
            <button style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;" onclick="window.supprProd('${p.id}')">Supprimer</button>
        `;
        listContainer.appendChild(row);
    });
}

window.supprProd = async function(id) {
    if (confirm("Supprimer ce produit ?")) {
        try {
            await deleteDoc(doc(db, "produits", id));
            chargerCatalogueDepuisCloud();
        } catch (e) {
            alert(e.message);
        }
    }
};

function ecouterCommandesAdmin() {
    const container = document.getElementById('admin-orders-container');
    if (!container) return;

    const q = query(collection(db, "commandes"), orderBy("dateCommande", "desc"));
    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            container.innerHTML = `<p style="color: var(--text-muted); font-size: 14px;">Aucune commande pour le moment.</p>`;
            return;
        }
        container.innerHTML = "";
        snapshot.forEach((docSnap) => {
            const cmd = docSnap.data();
            let listeArticles = (cmd.articles || []).map(a => `<li>${a.name} (x${a.quantite}) - ${a.price}$</li>`).join('');
            container.innerHTML += `
                <div style="background:var(--bg-body); border:1px solid var(--border); padding:12px; border-radius:8px; margin-bottom:10px; font-size:13px;">
                    <strong>${cmd.livraison?.nom || 'Client'}</strong> - Total: ${cmd.montantTotal} $ (${cmd.modePaiement})<br>
                    📞 ${cmd.livraison?.telephone} | 📍 ${cmd.livraison?.commune}<br>
                    <ul style="margin:5px 0 0 15px;">${listeArticles}</ul>
                </div>
            `;
        });
    });
}

async function chargerUtilisateursAdmin() {
    const container = document.getElementById('admin-users-container');
    if (!container) return;
    try {
        const querySnapshot = await getDocs(collection(db, "utilisateurs"));
        container.innerHTML = "";
        querySnapshot.forEach((docSnap) => {
            const u = docSnap.data();
            container.innerHTML += `<div style="padding:6px; border-bottom:1px solid var(--border); font-size:12px;">👤 ${u.email} - <strong>${u.role || 'client'}</strong></div>`;
        });
    } catch (e) {
        console.error(e);
    }
}

// =================================================================
// 9. CHAT SÉCURISÉ CLIENT <-> ADMIN (ZERO IA)
// =================================================================
function ecouterMessagesClient() {
    if (!utilisateurConnecte) return;
    const container = document.getElementById('client-chat-messages-container') || document.getElementById('ai-chat-messages');
    if (!container) return;

    const q = query(collection(db, "chats", utilisateurConnecte.uid, "messages"), orderBy("timestamp", "asc"));
    onSnapshot(q, (snapshot) => {
        container.innerHTML = "";
        snapshot.forEach((docSnap) => {
            const m = docSnap.data();
            const estMoi = (m.senderId === utilisateurConnecte.uid);
            const texte = decrypterTexte(m.message);
            const msgDiv = document.createElement('div');
            msgDiv.className = `ai-msg ${estMoi ? 'user' : 'bot'}`;
            msgDiv.textContent = texte;
            container.appendChild(msgDiv);
        });
        container.scrollTop = container.scrollHeight;
    });
}

async function envoyerMessageClient() {
    const input = document.getElementById('client-chat-input') || document.getElementById('ai-chat-input');
    if (!input || !input.value.trim()) return;
    if (!utilisateurConnecte) {
        alert("Connectez-vous pour envoyer un message.");
        return;
    }

    const texteChiffre = crypterTexte(input.value.trim());
    input.value = "";

    await setDoc(doc(db, "utilisateurs_actifs_chat", utilisateurConnecte.uid), {
        uid: utilisateurConnecte.uid,
        email: utilisateurConnecte.email,
        derniereMaj: new Date().getTime()
    });

    await addDoc(collection(db, "chats", utilisateurConnecte.uid, "messages"), {
        senderId: utilisateurConnecte.uid,
        message: texteChiffre,
        timestamp: serverTimestamp()
    });
}

function ecouterDiscussionsPourAdmin() {
    const container = document.getElementById('admin-chat-users-list');
    if (!container) return;

    const q = query(collection(db, "utilisateurs_actifs_chat"), orderBy("derniereMaj", "desc"));
    onSnapshot(q, (snapshot) => {
        container.innerHTML = "";
        if (snapshot.empty) {
            container.innerHTML = `<p style="padding:10px; font-size:12px; color:var(--text-muted);">Aucun client.</p>`;
            return;
        }
        snapshot.forEach(docSnap => {
            const u = docSnap.data();
            const div = document.createElement('div');
            div.className = `chat-user-item ${clientSelectionneChat === u.uid ? 'active' : ''}`;
            div.textContent = u.email ? u.email.split('@')[0] : 'Client';
            div.addEventListener('click', () => {
                clientSelectionneChat = u.uid;
                const chatArea = document.getElementById('admin-chat-area');
                if (chatArea) chatArea.style.display = 'flex';
                const headerTitle = document.getElementById('admin-active-client-title');
                if (headerTitle) headerTitle.textContent = `Discussion avec : ${u.email}`;
                ecouterMessagesAdminClient(u.uid);
            });
            container.appendChild(div);
        });
    });
}

function ecouterMessagesAdminClient(clientUid) {
    const container = document.getElementById('admin-chat-messages-container');
    if (!container) return;

    const q = query(collection(db, "chats", clientUid, "messages"), orderBy("timestamp", "asc"));
    onSnapshot(q, (snapshot) => {
        container.innerHTML = "";
        snapshot.forEach(docSnap => {
            const m = docSnap.data();
            const estAdminMsg = (m.senderId === utilisateurConnecte.uid);
            const div = document.createElement('div');
            div.className = `msg-bubble ${estAdminMsg ? 'outgoing' : 'incoming'}`;
            div.textContent = decrypterTexte(m.message);
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    });

    const sendBtn = document.getElementById('admin-chat-send-btn');
    const input = document.getElementById('admin-chat-input');
    if (sendBtn && input) {
        sendBtn.onclick = async () => {
            if (!input.value.trim()) return;
            const texteChiffre = crypterTexte(input.value.trim());
            input.value = "";
            await addDoc(collection(db, "chats", clientUid, "messages"), {
                senderId: utilisateurConnecte.uid,
                message: texteChiffre,
                timestamp: serverTimestamp()
            });
        };
    }
}
