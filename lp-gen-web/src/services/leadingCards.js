import { api } from "./api";

export const leadingCardsApi = {
    async getCards(params = {}) {
        const query = new URLSearchParams(params).toString();
        return api.get(`/lc/cards${query ? '?' + query : ''}`);
    },
    async createCard(cardData) {
        return api.post('/lc/cards', cardData);
    },
    async blockCard(uuid) {
        return api.put(`/lc/cards/${uuid}/block`, {});
    },
    async activateCard(uuid) {
        return api.put(`/lc/cards/${uuid}/activate`, {});
    },
    async changeLimit(uuid, limit) {
        return api.put(`/lc/cards/${uuid}/change_limit`, { limit });
    },
    async getBins() {
        return api.get('/lc/bins');
    },
    async getBillingAddresses() {
        return api.get('/lc/billing');
    },
    async createBillingAddress(data) {
        return api.post('/lc/billing', data);
    },
    async getTags() {
        return api.get('/lc/tags');
    },
    async getTransactions(fromDate) {
        return api.get(`/lc/transactions${fromDate ? '?from_date=' + fromDate : ''}`);
    },
    async getTeams() {
        return api.get('/lc/teams');
    },
};
