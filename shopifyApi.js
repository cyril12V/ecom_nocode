const axios = require('axios');
require('dotenv').config();

const shopifyApiUrl = `https://${process.env.SHOPIFY_STORE_NAME}/admin/api/2023-04/products.json`;
const apiKey = process.env.SHOPIFY_API_KEY;
const apiSecret = process.env.SHOPIFY_API_SECRET;

const createShopifyProduct = async (sneaker) => {
    try {
        const response = await axios.post(shopifyApiUrl, {
            product: {
                title: sneaker.name,
                body_html: `<strong>${sneaker.description}</strong>`,
                vendor: sneaker.brand,
                product_type: 'Sneakers',
                variants: [
                    {
                        option1: 'Default Title',
                        price: sneaker.price,
                        sku: sneaker.sku
                    }
                ]
            }
        }, {
            auth: {
                username: apiKey,
                password: apiSecret
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la création du produit sur Shopify :', error);
    }
};

module.exports = { createShopifyProduct };
