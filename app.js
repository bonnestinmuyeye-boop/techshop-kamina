import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Le catalogue démarre vide et se remplit via le Cloud
let CATALOGUE = [];
let categorieActive = "Tous";

// LECTURE : Charger dynamiquement le catalogue depuis Firebase
async function chargerCatalogueDepuisFirebase() {
    try {
        const querySnapshot = await getDocs(collection(db, "produits"));
        CATALOGUE = []; // Réinitialisation locale avant remplissage
        
        querySnapshot.forEach((docSnap) => {
            // Injection de l'identifiant unique généré par Firebase (docSnap.id)
            CATALOGUE.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        // Appelle la fonction d'affichage une fois les données reçues
        afficherCatalogue(); 
    } catch (error) {
        console.error("Erreur de synchronisation du catalogue avec Firebase :", error);
        const productGrid = document.getElementById('product-grid');
        if (productGrid) {
            productGrid.innerHTML = "<p style='color:red; text-align:center;'>Erreur de connexion avec la base de données cloud.</p>";
        }
    }
}

// Rendu HTML des cartes produits
function afficherCatalogue() {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return;
    
    productGrid.innerHTML = "";

    // Filtrage des produits selon la catégorie sélectionnée
    const produitsFiltres = CATALOGUE.filter(p => categorieActive === "Tous" || p.category === categorieActive);

    if (produitsFiltres.length === 0) {
        productGrid.innerHTML = "<p style='text-align:center; grid-column: 1/-1;'>Aucun équipement disponible pour le moment.</p>";
        return;
    }

    produitsFiltres.forEach(p => {
        productGrid.innerHTML += `
            <div class="product-card">
                <img src="${p.imageUrl}" alt="${p.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-title">${p.name}</h3>
                    <p class="product-specs">${p.specs || ''}</p>
                    <div class="product-footer">
                        <span class="product-price">${p.price} $</span>
                        <button class="add-to-cart-btn" onclick="ajouterAuPanierLocal('${p.id}')">Acheter</button>
                    </div>
                </div>
            </div>`;
    });
}

// Filtrage du catalogue via l'interface client
window.filtrerCategorie = function(categorie, bouton) {
    categorieActive = categorie;
    
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    bouton.classList.add('active');
    
    afficherCatalogue();
};

// Fonction passerelle pour lier les clics HTML au traitement du panier
window.ajouterAuPanierLocal = function(id) {
    const produit = CATALOGUE.find(p => p.id === id);
    if (produit && typeof window.ajouterAuPanier === "function") {
        window.ajouterAuPanier(produit);
    } else {
        alert("Erreur lors de l'ajout au panier.");
    }
};

// Lancement automatique au chargement de la page d'accueil
document.addEventListener("DOMContentLoaded", () => {
    chargerCatalogueDepuisFirebase();
});
