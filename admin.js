import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Variables d'état globales pour l'interface admin
let categorieActiveAdmin = "Ordinateurs";

// Changer de catégorie dans l'interface admin
window.changerCategorieAdmin = function(categorie) {
    categorieActiveAdmin = categorie;
    
    // Mise à jour visuelle des boutons de filtrage admin
    document.querySelectorAll('.admin-filter-btn').forEach(btn => {
        if (btn.innerText.includes(categorie)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Recharger les produits de la catégorie sélectionnée depuis Firebase
    afficherProduitsAdmin();
};

// AJOUT : Envoyer un nouveau produit sur Cloud Firestore
window.ajouterNouveauProduitAdmin = async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('admin-p-name').value;
    const specs = document.getElementById('admin-p-specs').value;
    const price = document.getElementById('admin-p-price').value;
    const imageUrl = document.getElementById('admin-p-image').value;

    if (!name || !price || !imageUrl) {
        alert("Veuillez remplir les champs obligatoires (Nom, Prix, Image)");
        return;
    }

    const nouveauProduit = {
        name: name,
        category: categorieActiveAdmin,
        price: parseInt(price, 10),
        specs: specs,
        imageUrl: imageUrl,
        createdAt: new Date().getTime()
    };

    try {
        // Enregistrement dans la collection "produits" sur Firebase
        await addDoc(collection(db, "produits"), nouveauProduit);
        
        document.getElementById('admin-product-form').reset();
        alert("Équipement ajouté avec succès sur Firebase !");
        
        // Rafraîchir l'affichage de la catégorie actuelle
        afficherProduitsAdmin(); 
    } catch (error) {
        alert("Erreur d'enregistrement Firebase : " + error.message);
    }
};

// SUPPRESSION : Retirer un produit directement du Cloud
window.supprimerProduitAdmin = async function(id) {
    if (confirm("Voulez-vous vraiment supprimer cet équipement de Firebase ?")) {
        try {
            await deleteDoc(doc(db, "produits", id));
            alert("Produit supprimé du cloud avec succès !");
            afficherProduitsAdmin();
        } catch (error) {
            alert("Erreur de suppression : " + error.message);
        }
    }
};

// LECTURE : Afficher les produits filtrés depuis Firebase
async function afficherProduitsAdmin() {
    const listContainer = document.getElementById('admin-products-list-container');
    if (!listContainer) return;
    
    listContainer.innerHTML = "<p>Mise à jour du stock depuis Firebase...</p>";
    
    try {
        const querySnapshot = await getDocs(collection(db, "produits"));
        listContainer.innerHTML = "";
        
        let aucunProduit = true;

        querySnapshot.forEach((docSnap) => {
            const p = docSnap.data();
            if (p.category === categorieActiveAdmin) {
                aucunProduit = false;
                listContainer.innerHTML += `
                    <div class="admin-product-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 10px; border-bottom: 1px solid #eee;">
                        <div>
                            <strong>${p.name}</strong> - <small>${p.price} $</small>
                            <br><span style="font-size:12px; color:#666;">${p.specs || 'Aucune spécification'}</span>
                        </div>
                        <button class="filter-btn" style="border: 1px solid #ef4444; color:#ef4444; background: transparent; padding: 5px 10px; cursor: pointer; border-radius: 4px;" onclick="supprimerProduitAdmin('${docSnap.id}')">Supprimer</button>
                    </div>`;
            }
        });

        if (aucunProduit) {
            listContainer.innerHTML = `<p>Aucun produit dans la catégorie ${categorieActiveAdmin}.</p>`;
        }
    } catch (error) {
        console.error("Erreur Firestore lors du chargement des produits :", error);
        listContainer.innerHTML = "<p style='color:red;'>Erreur lors du chargement des données.</p>";
    }
}

// LECTURE : Afficher la liste des clients réels enregistrés sur Firebase
async function afficherUtilisateurs() {
    const container = document.getElementById('admin-users-container');
    if (!container) return;
    
    container.innerHTML = "<p>Chargement des comptes clients depuis Firebase...</p>";
    
    try {
        const querySnapshot = await getDocs(collection(db, "utilisateurs"));
        container.innerHTML = "";
        
        querySnapshot.forEach((docSnap) => {
            const u = docSnap.data();
            container.innerHTML += `
                <div class="user-row" style="padding: 8px 0; border-bottom: 1px solid #eee;">
                    <strong>${u.email}</strong> - <span style="text-transform:capitalize; color:#007bff; font-weight:600;">${u.role || 'client'}</span>
                </div>`;
        });
    } catch (error) {
        console.error("Erreur Firestore lors de la récupération des utilisateurs :", error);
        container.innerHTML = "<p style='color:red;'>Erreur de chargement des utilisateurs.</p>";
    }
}

// Initialisation au chargement de la page d'administration
document.addEventListener("DOMContentLoaded", () => {
    afficherProduitsAdmin();
    afficherUtilisateurs();
});
