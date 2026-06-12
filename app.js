import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Tableau local synchronisé avec la base cloud
let CATALOGUE = [];
let categorieActive = "Tous";

window.addEventListener('DOMContentLoaded', () => {
    chargerCatalogueDepuisFirebase();
});

// LECTURE : Récupération des données cloud en temps réel
async function chargerCatalogueDepuisFirebase() {
    const container = document.getElementById('shop-container');
    if (container) {
        container.innerHTML = "<p style='text-align:center; grid-column: 1/-1;'>Connexion au serveur Cloud Firestore en cours...</p>";
    }

    try {
        const querySnapshot = await getDocs(collection(db, "produits"));
        CATALOGUE = []; // Réinitialisation du tableau local
        
        querySnapshot.forEach((doc) => {
            // Extraction de l'ID généré par Firebase pour les futures commandes
            CATALOGUE.push({ id: doc.id, ...doc.data() });
        });
        
        // Affichage initial
        afficherCatalogue();
    } catch (error) {
        console.error("Erreur de synchronisation du catalogue :", error);
        if (container) {
            container.innerHTML = "<p style='color:red; text-align:center; grid-column: 1/-1;'>Erreur de chargement des produits. Vérifiez votre connexion.</p>";
        }
    }
}

// FILTRAGE : Gestion du clic sur les catégories côté vitrine client
window.filtrerCategorie = function(categorie, bouton) {
    categorieActive = categorie;
    
    // Gestion de l'état actif des boutons
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (bouton) bouton.classList.add('active');

    afficherCatalogue();
};

// AFFICHAGE : Génération des cartes produits dynamiques HTML
function afficherCatalogue() {
    const container = document.getElementById('shop-container');
    if (!container) return;

    container.innerHTML = "";

    // Filtrage basé sur la sélection du client
    const produitsFiltres = CATALOGUE.filter(p => categorieActive === "Tous" || p.category === categorieActive);

    if (produitsFiltres.length === 0) {
        container.innerHTML = "<p style='text-align:center; grid-column: 1/-1; color:var(--text-muted);'>Aucun produit disponible actuellement dans cette catégorie.</p>";
        return;
    }

    produitsFiltres.forEach(produit => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${produit.imageUrl || 'https://via.placeholder.com/200'}" alt="${produit.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${produit.name}</h3>
                <p class="product-specs">${produit.specs || 'Aucune spécification fournie.'}</p>
                <div class="product-footer">
                    <span class="product-price">${produit.price} $</span>
                    <button class="add-to-cart-btn" onclick="ajouterAuPanier('${produit.id}')">
                        <i class="fas fa-shopping-cart"></i> Ajouter
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Gestion globale du panier (Utilise l'ID Firebase)
window.ajouterAuPanier = function(id) {
    let panier = JSON.parse(localStorage.getItem('panier')) || [];
    let produit = CATALOGUE.find(p => p.id === id);

    if (produit) {
        let produitExistant = panier.find(item => item.id === id);
        if (produitExistant) {
            produitExistant.quantite += 1;
        } else {
            panier.push({ ...produit, quantite: 1 });
        }
        localStorage.setItem('panier', JSON.stringify(panier));
        
        // Si ta fonction de mise à jour visuelle du panier existe dans l'interface, on l'appelle :
        if (typeof mettreAJourBadgePanier === "function") mettreAJourBadgePanier();
        
        alert(`${produit.name} ajouté au panier !`);
    }
};
