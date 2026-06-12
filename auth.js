// Base de données des comptes simulés
let UTILISATEURS = JSON.parse(localStorage.getItem('techUsers')) || [
    { email: "admin@gmail.com", pas: "admin123", role: "admin", status: "connecté" },
    { email: "client@gmail.com", pas: "client123", role: "client", status: "connecté" }
];
if(!localStorage.getItem('techUsers')) localStorage.setItem('techUsers', JSON.stringify(UTILISATEURS));

let modeInscription = false;

function basculerModeAuth(e) {
    e.preventDefault();
    modeInscription = !modeInscription;
    document.getElementById('auth-title').innerText = modeInscription ? "Créer un compte" : "Connexion";
    document.getElementById('auth-subtitle').innerText = modeInscription ? "Inscrivez-vous pour commander" : "Connectez-vous pour finaliser vos achats";
    document.getElementById('auth-submit-btn').innerText = modeInscription ? "S'inscrire" : "Se connecter";
    document.getElementById('auth-switch-text').innerHTML = modeInscription ? "Déjà inscrit ? <a href='#' onclick='basculerModeAuth(event)'>Se connecter</a>" : "Pas encore de compte ? <a href='#' onclick='basculerModeAuth(event)'>Créer un compte</a>";
}

function gererAuthentification(e) {
    e.preventDefault();
    let email = document.getElementById('auth-email').value;
    let pas = document.getElementById('auth-password').value;

    if (modeInscription) {
        let exist = UTILISATEURS.find(u => u.email === email);
        if(exist) { alert("Cette adresse mail possède déjà un compte."); return; }
        
        let newClient = { email, pas, role: "client", status: "connecté" };
        UTILISATEURS.push(newClient);
        localStorage.setItem('techUsers', JSON.stringify(UTILISATEURS));
        localStorage.setItem('sessionActive', JSON.stringify(newClient));
        
        alert("Compte créé avec succès !");
        window.location.href = 'checkout.html';
    } else {
        let user = UTILISATEURS.find(u => u.email === email && u.pas === pas);
        if(!user) { alert("Identifiants incorrects."); return; }
        
        user.status = "connecté";
        localStorage.setItem('techUsers', JSON.stringify(UTILISATEURS));
        localStorage.setItem('sessionActive', JSON.stringify(user));

        if(user.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'checkout.html';
        }
    }
}