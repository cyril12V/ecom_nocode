const axios = require('axios');
require('dotenv').config();

const apiURL = process.env.SWAGGER_API_URL || 'http://54.37.12.181:1337/api/sneakers'; 


const getSneakersList = async (page = 1, pageSize = 25) => {
    try {
        const response = await axios.get(`${apiURL}?pagination[page]=${page}&pagination[pageSize]=${pageSize}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des sneakers :', error);
    }
};


const addSneaker = async (sneaker) => {
    try {
        const response = await axios.post(`${apiURL}`, sneaker);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de l\'ajout de la sneaker :', error);
    }
};

const getSneakerById = async (id) => {
    try {
        const response = await axios.get(`${apiURL}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération de la sneaker :', error);
    }
};

const updateSneaker = async (id, updatedSneaker) => {
    try {
        const response = await axios.put(`${apiURL}/${id}`, updatedSneaker);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la sneaker :', error);
    }
};

const deleteSneaker = async (id) => {
    try {
        const response = await axios.delete(`${apiURL}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la suppression de la sneaker :', error);
    }
};

module.exports = { getSneakersList, addSneaker, getSneakerById, updateSneaker, deleteSneaker };
