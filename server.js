const express = require('express');
const { getSneakersList, addSneaker, getSneakerById, updateSneaker, deleteSneaker } = require('./swaggerApi');
const app = express();
const { createShopifyProduct } = require('./shopifyApi');


// Route pour récupérer la liste des sneakers
app.get('/sneakers', async (req, res) => {
    const sneakers = await getSneakersList();
    res.json(sneakers);
});

// Route pour ajouter une nouvelle sneaker
app.post('/sneakers', async (req, res) => {
    const newSneaker = await addSneaker(req.body);
    res.json(newSneaker);
});

// Route pour récupérer une sneaker par ID
app.get('/sneakers/:id', async (req, res) => {
    const sneaker = await getSneakerById(req.params.id);
    res.json(sneaker);
});

// Route pour mettre à jour une sneaker
app.put('/sneakers/:id', async (req, res) => {
    const updatedSneaker = await updateSneaker(req.params.id, req.body);
    res.json(updatedSneaker);
});

// Route pour supprimer une sneaker
app.delete('/sneakers/:id', async (req, res) => {
    const deletedSneaker = await deleteSneaker(req.params.id);
    res.json(deletedSneaker);
});

// Lancer le serveur sur le port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});


app.get('/sneakers', async (req, res) => {
    const sneakers = await getSneakersList();
    res.json(sneakers);

    // Optionnel : Créer un produit Shopify pour chaque sneaker récupérée
    sneakers.forEach(async (sneaker) => {
        const shopifyProduct = await createShopifyProduct(sneaker);
        console.log('Produit créé sur Shopify :', shopifyProduct);
    });
});
