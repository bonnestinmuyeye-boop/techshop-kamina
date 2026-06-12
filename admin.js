import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Variable globale pour suivre la catégorie sélectionnée par l'admin
let categorieActiveAdmin = "Ordinateurs";

// Initialisation au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
    configurerFormulaireAdmin();
    changerCategorieAdmin(categorieActiveAdmin);
    afficherUtilisateursCloud();
});

// Configuration de la soumission du formulaire
function configurerFormulaireAdmin() {
    const form = document.getElementById('admin-product-form');
    if (form) {
        form.addEventListener('submit', ajouterNouveauProduitAdmin);
    }
}

// Fonction pour basculer entre les onglets de catégories
window.changerCategorieAdmin = function(categorie) {
    categorieActiveAdmin = categorie;
    
    // Mise à jour visuelle des boutons de filtrage admin
    document.querySelectorAll('.admin-filter-btn').forEach(btn => {
        if (btn.textContent.trim() === categorie) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Recharger la liste filtrée depuis le cloud
    afficherProduitsAdmin();
};

// AJOUT : Enregistrer un nouvel équipement sur Firestore
async function ajouterNouveauProduitAdmin(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('admin-p-name');
    const specsInput = document.getElementById('admin-p-specs');
    const priceInput = document.getElementById('admin-p-price');
    const imageInput = document.getElementById('admin-p-image');

    if (!nameInput || !priceInput) return;

    let nouveauProduit = {
        name: nameInput.value,
        category: categorieActiveAdmin,
        price: parseInt(priceInput.value) || 0,
        specs: specsInput ? specsInput.value : "",
        imageUrl: imageInput ? imageInput.value : "",
        createdAt: new Date().getTime()
    };

    try {
        // Envoi direct dans la collection "produits"
        await addDoc(collection(db, "produits"), nouveauProduit);
        
        document.getElementById('admin-product-form').reset();
        alert("Équipement ajouté avec succès sur Cloud Firestore !");
        
        // Rafraîchir l'affichage
        afficherProduitsAdmin();
    } catch (error) {
        alert("Erreur d'enregistrement Firebase : " + error.message);
    }
}

// LECTURE : Afficher les produits de la catégorie active
async function afficherProduitsAdmin() {
    const listContainer = document.getElementById('admin-products-list-container');
    if (!listContainer) return;
    
    listContainer.innerHTML = "<p>Mise à jour du stock depuis le cloud...</p>";
    
    try {
        const querySnapshot = await getDocs(collection(db, "produits"));
        listContainer.innerHTML = "";
        let aucunProduit = true;
        
        querySnapshot.forEach((doc) => {
            let p = doc.data();
            if (p.category === categorieActiveAdmin) {
                aucunProduit = false;
                listContainer.innerHTML += `
                    <div class="admin-product-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding:10px; background:#1e1e1e; border-radius:6px;">
                        <div>
                            <strong>${p.name}</strong> - <small>${p.price} $</small>
                            <br><span style="font-size:12px; color:#aaa;">${p.specs}</span>
                        </div>
                        <button class="filter-btn" style="border:1px solid #ef4444; color:#ef4444; background:transparent; padding:5px 10px; cursor:pointer; border-radius:4px;" onclick="supprimerProduitAdmin('${doc.id}')">Supprimer</button>
                    </div>`;
            }
        });

        if (aucunProduit) {
            listContainer.innerHTML = "<p style='color:#aaa;'>Aucun équipement dans cette catégorie.</p>";
        }
    } catch (error) {
        console.error("Erreur d'affichage admin :", error);
        listContainer.innerHTML = "<p style='color:red;'>Erreur lors du chargement des stocks.</p>";
    }
}

// SUPPRESSION : Retirer un produit de Firestore
window.supprimerProduitAdmin = async function(id) {
    if (confirm("Supprimer définitivement cet équipement du Cloud ?")) {
        try {
            await deleteDoc(doc(db, "produits", id));
            alert("Produit supprimé du cloud avec succès !");
            afficherProduitsAdmin();
        } catch (error) {
            alert("Erreur de suppression : " + error.message);
        }
    }
};

// LECTURE : Afficher tous les utilisateurs inscrits dans le système
async function afficherUtilisateursCloud() {
    const container = document.getElementById('admin-users-container');
    if (!container) return;
    
    container.innerHTML = "<p>Chargement des utilisateurs...</p>";
    
    try {
        const querySnapshot = await getDocs(collection(db, "utilisateurs"));
        container.innerHTML = "";
        
        querySnapshot.forEach((doc) => {
            const u = doc.data();
            container.innerHTML += `
                <div class="user-row" style="padding:8px; border-bottom:1px solid #222;">
                    <strong>${u.email}</strong> - <span style="text-transform:capitalize; color:#00adb5; font-weight:600;">${u.role || 'client'}</span>
                </div>`;
        });
    } catch (error) {
        console.error("Erreur Firestore Utilisateurs :", error);
        container.innerHTML = "<p style='color:red;'>Erreur de chargement des comptes clients.</p>";
    }
}
