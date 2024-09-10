const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const shopifyApiUrl = `https://${process.env.SHOPIFY_STORE_NAME}/admin/api/2023-01/products.json`;
const swaggerApiUrl = process.env.SWAGGER_API_URL;
const processedIdsFile = 'processed_ids.txt';
const processedIds = new Set(fs.readFileSync(processedIdsFile, 'utf-8').split('\n').filter(Boolean));
const batchSize = 5;  // Nombre de batchs parallèles

// Objets pour stocker les produits par genre, année et marque
let productsByGender = {};
let productsByYear = {};
let productsByBrand = {};

// Fonction pour créer un produit sur Shopify
async function createShopifyProduct(sneaker) {
    try {
        const productData = {
            product: {
                title: sneaker.name,
                body_html: sneaker.story || "No description available.",
                vendor: sneaker.brand,
                product_type: sneaker.silhouette,
                variants: [
                    {
                        price: sneaker.estimatedMarketValue,
                        sku: sneaker.sku,
                        compare_at_price: sneaker.retailPrice
                    }
                ],
                images: [
                    {
                        src: sneaker.image.original
                    }
                ],
                tags: `${sneaker.gender}, ${sneaker.releaseYear}`
            }
        };

        const response = await axios.post(shopifyApiUrl, productData, {
            headers: {
                'X-Shopify-Access-Token': process.env.SHOPIFY_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Produit importé : ${sneaker.name}`);

        // Organiser les produits par genre, année et marque
        if (!productsByGender[sneaker.gender]) {
            productsByGender[sneaker.gender] = [];
        }
        productsByGender[sneaker.gender].push(response.data.product.id);

        if (!productsByYear[sneaker.releaseYear]) {
            productsByYear[sneaker.releaseYear] = [];
        }
        productsByYear[sneaker.releaseYear].push(response.data.product.id);

        if (!productsByBrand[sneaker.brand]) {
            productsByBrand[sneaker.brand] = [];
        }
        productsByBrand[sneaker.brand].push(response.data.product.id);

        return response.data;
    } catch (error) {
        console.error(`Erreur lors de la création du produit "${sneaker.name}":`, error.response ? error.response.data : error);
    }
}

// Fonction pour importer les sneakers en batchs
async function importSneakersBatch(startPage, endPage) {
    for (let currentPage = startPage; currentPage <= endPage; currentPage++) {
        try {
            const url = `${swaggerApiUrl}?page=${currentPage}&pageSize=25`;
            console.log(`Fetching page ${currentPage}: ${url}`);
            const response = await axios.get(url);

            if (!response || !response.data || !response.data.data || !response.data.meta) {
                console.error(`Invalid response on page ${currentPage}. Skipping...`);
                continue;
            }

            const sneakers = response.data.data;
            console.log(`Traitement de la page ${currentPage}...`);

            for (const item of sneakers) {
                const sneaker = item.attributes;
                const sneakerId = item.id;

                if (!processedIds.has(sneakerId)) {
                    await createShopifyProduct(sneaker);
                    processedIds.add(sneakerId);

                    // Ajouter l'ID traité au fichier
                    fs.appendFileSync(processedIdsFile, `${sneakerId}\n`);
                } else {
                    console.log(`Produit déjà traité : ${sneakerId} - ${sneaker.name}`);
                }
            }

            // Introduire un court délai pour éviter de surcharger le serveur
            await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay

        } catch (error) {
            console.error(`Erreur lors de l'importation de la page ${currentPage}:`, error);
        }
    }
}

// Fonction principale pour gérer les batchs
async function importAllSneakersToShopifyInBatches() {
    try {
        // Log de démarrage
        console.log('Démarrage de l\'importation des sneakers...');

        // Démarrer le chronomètre pour l'importation complète
        console.time('Temps total d\'importation');

        const response = await axios.get(`${swaggerApiUrl}?page=1&pageSize=25`);
        const totalPages = response.data.meta.pagination.pageCount;

        console.log(`Total pages à traiter: ${totalPages}`);

        let batchStart = 1;

        while (batchStart <= totalPages) {
            const batchEnd = Math.min(batchStart + batchSize - 1, totalPages);

            console.log(`Importation en batch des pages ${batchStart} à ${batchEnd}...`);

            // Démarrer le chronomètre pour chaque batch
            console.time(`Batch ${batchStart}-${batchEnd}`);

            const batchPromises = [];
            for (let i = 0; i < batchSize; i++) {
                const batchPageStart = batchStart + i;
                if (batchPageStart > totalPages) break;
                batchPromises.push(importSneakersBatch(batchPageStart, batchPageStart));
            }

            await Promise.all(batchPromises);

            // Arrêter le chronomètre pour le batch
            console.timeEnd(`Batch ${batchStart}-${batchEnd}`);

            batchStart += batchSize;
        }

        // Arrêter le chronomètre pour l'importation complète
        console.timeEnd('Temps total d\'importation');

        console.log("Tous les sneakers ont été importés sur Shopify !");

        // Création des collections après l'importation
        await createCollections();

    } catch (error) {
        console.error('Erreur lors de l\'importation des sneakers en batch :', error);
    }
}




// Exécuter l'importation en batchs
importAllSneakersToShopifyInBatches();