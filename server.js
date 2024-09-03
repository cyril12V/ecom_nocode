const express = require('express');
const { getSneakersList, addSneaker, getSneakerById, updateSneaker, deleteSneaker } = require('./swaggerApi');
const { createShopifyProduct } = require('./shopifyApi');

const app = express();

app.use(express.json()); // Pour pouvoir parser le JSON des requêtes POST et PUT

// Route pour récupérer la liste des sneakers avec pagination
app.get('/sneakers', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 25;
    
    const sneakers = await getSneakersList(page, pageSize);
    res.json(sneakers);

    // Optionnel : Créer un produit Shopify pour chaque sneaker récupérée
    sneakers.data.forEach(async (sneaker) => {
        const shopifyProduct = await createShopifyProduct(sneaker.attributes);
        console.log('Produit créé sur Shopify :', shopifyProduct);
    });
});

// Autres routes pour les opérations CRUD...

// Lancer le serveur sur le port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
