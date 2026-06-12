let panierCheckout = JSON.parse(localStorage.getItem('monPanierTech')) || [];
const opsBox = document.getElementById('mobile-operators-section');

function toggleMobileOperators(show) {
    if(opsBox) opsBox.style.display = show ? 'block' : 'none';
}

function afficherResume() {
    const itemsContainer = document.getElementById('checkout-summary-items');
    if(!itemsContainer) return;
    itemsContainer.innerHTML = "";
    let total = 0;
    
    panierCheckout.forEach(i => {
        total += i.price * i.quantite;
        itemsContainer.innerHTML += `
            <div class="cart-item">
                <img src="${i.imageUrl}" style="width:40px;height:40px;">
                <div style="flex:1;"><h4>${i.name}</h4><small>Qté: ${i.quantite}</small></div>
                <span>${i.price * i.quantite} $</span>
            </div>`;
    });
    document.getElementById('summary-subtotal').innerText = `${total} $`;
    document.getElementById('summary-total').innerText = `${total} $`;
}

function validerLaCommande(e) {
    e.preventDefault();
    let nom = document.getElementById('nom').value;
    let tel = "+243 " + document.getElementById('telephone').value;
    
    // Concaténation propre de l'adresse éclatée pour le traitement final
    let num = document.getElementById('adr-numero').value;
    let ave = document.getElementById('adr-avenue').value;
    let qrt = document.getElementById('adr-quartier').value;
    let com = document.getElementById('adr-commune').value;
    let adresseComplete = `N° ${num}, Av. ${ave}, Q/ ${qrt}, Ville: ${com}`;

    let payMode = document.querySelector('input[name="payment"]:checked').value;
    
    if(payMode === 'mobile_money') {
        let operateur = document.querySelector('input[name="operator"]:checked').value;
        // Message d'envoi de confirmation par code PIN demandé
        alert(`[Paiement Simulé via ${operateur}]\nUn message USSD a été envoyé au numéro ${tel}. Veuillez saisir votre code PIN pour confirmer le débit.`);
    }

    alert(`Félicitations ${nom} ! Commande enregistrée pour livraison à l'adresse :\n${adresseComplete}`);
    localStorage.removeItem('monPanierTech');
    window.location.href = 'index.html';
}

afficherResume();
toggleMobileOperators(true);