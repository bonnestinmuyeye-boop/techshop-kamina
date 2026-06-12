let CATALOGUE_ADMIN = JSON.parse(localStorage.getItem('techCatalogue')) || [];
let USERS_ADMIN = JSON.parse(localStorage.getItem('techUsers')) || [];
let categorieActiveAdmin = "Ordinateurs";

// Protection de la page admin
const session = JSON.parse(localStorage.getItem('sessionActive'));
if(!session || session.role !== 'admin') {
    alert("Accès refusé. Réservé à l'administrateur.");
    window.location.href = 'login.html';
}

function deconnexionAdmin() {
    localStorage.removeItem('sessionActive');
    window.location.href = 'index.html';
}

function changerCategorieAdmin(cat) {
    categorieActiveAdmin = cat;
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
    if(cat === 'Ordinateurs') document.getElementById('tab-computers').classList.add('active');
    if(cat === 'Smartphones') document.getElementById('tab-smartphones').classList.add('active');
    if(cat === 'Accessoires') document.getElementById('tab-accessories').classList.add('active');
    
    document.getElementById('form-admin-title').innerText = `Ajouter un produit dans : ${cat}`;
    afficherProduitsAdmin();
}

function afficherProduitsAdmin() {
    const listContainer = document.getElementById('admin-products-list-container');
    listContainer.innerHTML = "";
    
    // Filtrage automatique selon l'un des trois boutons cliqués
    let filtres = CATALOGUE_ADMIN.filter(p => p.category === categorieActiveAdmin);
    
    filtres.forEach(p => {
        listContainer.innerHTML += `
            <div class="admin-product-row">
                <div>
                    <strong>${p.name}</strong> - <small>${p.price} $</small>
                    <br><span style="font-size:12px; color:var(--text-muted);">${p.specs}</span>
                </div>
                <button class="filter-btn" style="border-color:#ef4444; color:#ef4444;" onclick="supprimerProduitAdmin('${p.id}')">Supprimer</button>
            </div>`;
    });
}

function ajouterNouveauProduitAdmin(e) {
    e.preventDefault();
    let name = document.getElementById('admin-p-name').value;
    let specs = document.getElementById('admin-p-specs').value;
    let price = document.getElementById('admin-p-price').value;
    let imageUrl = document.getElementById('admin-p-image').value; // Lien URL internet direct

    let newProd = {
        id: "p_" + Date.now(),
        name,
        category: categorieActiveAdmin,
        price: parseInt(price),
        specs,
        imageUrl
    };

    CATALOGUE_ADMIN.push(newProd);
    localStorage.setItem('techCatalogue', JSON.stringify(CATALOGUE_ADMIN));
    document.getElementById('admin-product-form').reset();
    afficherProduitsAdmin();
    alert("Équipement ajouté au catalogue global !");
}

function supprimerProduitAdmin(id) {
    if(confirm("Supprimer cet équipement du catalogue ?")) {
        CATALOGUE_ADMIN = CATALOGUE_ADMIN.filter(p => p.id !== id);
        localStorage.setItem('techCatalogue', JSON.stringify(CATALOGUE_ADMIN));
        afficherProduitsAdmin();
    }
}

function afficherUtilisateurs() {
    const container = document.getElementById('admin-users-container');
    container.innerHTML = "";
    USERS_ADMIN.forEach(u => {
        container.innerHTML += `
            <div class="user-row">
                <span class="user-status"></span>
                <strong>${u.email}</strong> (${u.role})
            </div>`;
    });
}

// Lancement
changerCategorieAdmin('Ordinateurs');
afficherUtilisateurs();