require('dotenv').config(); // Charger les variables d'environnement

const axios = require('axios');

// Informations de connexion API Shopify
const shopifyStoreName = process.env.SHOPIFY_STORE_NAME;
const accessToken = process.env.SHOPIFY_API_KEY;
const shopifyUrl = `https://${shopifyStoreName}/admin/api/2023-01/products.json?limit=250`; // Limiter à 250 produits par requête

// Fonction pour supprimer un produit de Shopify
async function deleteProductFromShopify(productId) {
    const deleteUrl = `https://${shopifyStoreName}/admin/api/2023-01/products/${productId}.json`;

    try {
        const response = await axios.delete(deleteUrl, {
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken
            }
        });
        console.log(`Produit supprimé : ${productId}`);
    } catch (error) {
        console.error(`Erreur lors de la suppression du produit ${productId} :`, error.message);
        if (error.response) {
            console.error('Code de statut HTTP :', error.response.status);
            console.error('Données de la réponse :', error.response.data);
        }
    }
}

// Fonction pour récupérer et supprimer les produits sans image avec pagination
async function deleteProductsWithoutImages(pageInfo = null) {
    try {
        // Ajouter page_info si c'est la page suivante
        const url = pageInfo ? `${shopifyUrl}&page_info=${pageInfo}` : shopifyUrl;

        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken
            }
        });

        const products = response.data.products;

        // Boucle sur les produits récupérés
        for (const product of products) {
            if (!product.images || product.images.length === 0) {
                console.log(`Produit sans image trouvé : ${product.id}, ${product.title}`);
                await deleteProductFromShopify(product.id); // Suppression du produit
            }
        }

        // Vérifier s'il y a une page suivante
        const linkHeader = response.headers.link;
        if (linkHeader && linkHeader.includes('rel="next"')) {
            const nextPageInfo = new URL(linkHeader.match(/<([^>]+)>; rel="next"/)[1]).searchParams.get('page_info');
            console.log('Chargement de la page suivante...');
            await deleteProductsWithoutImages(nextPageInfo); // Appel récursif pour la page suivante
        } else {
            console.log('Aucune page suivante. Fin de la suppression.');
        }

    } catch (error) {
        console.error('Erreur lors de la récupération des produits :', error.message);
        if (error.response) {
            console.error('Code de statut HTTP :', error.response.status);
            console.error('Données de la réponse :', error.response.data);
        }
    }
}

// Appel de la fonction pour supprimer les produits sans images
deleteProductsWithoutImages();