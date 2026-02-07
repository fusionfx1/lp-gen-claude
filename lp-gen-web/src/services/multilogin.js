import { api } from "./api";

export const multiloginApi = {
    async signin() {
        return api.post('/ml/signin', {});
    },
    async refreshToken() {
        return api.post('/ml/refresh-token', {});
    },
    async getProfiles() {
        return api.get('/ml/profiles');
    },
    async createProfile(profileData) {
        return api.post('/ml/profiles', profileData);
    },
    async startProfile(profileId) {
        return api.post(`/ml/profiles/${profileId}/start`, {});
    },
    async stopProfile(profileId) {
        return api.post(`/ml/profiles/${profileId}/stop`, {});
    },
    async cloneProfile(profileId) {
        return api.post(`/ml/profiles/${profileId}/clone`, {});
    },
    async getAutomationToken() {
        return api.post('/mlx/automation-token', {});
    },
    async getFolders() {
        return api.get('/mlx/folders');
    },
    async updateProfile(data) {
        return api.patch('/mlx/profiles/update', data);
    },
    async deleteProfiles(ids, folderId) {
        return api.delBody('/mlx/profiles/delete', { ids, folderId });
    },
    async getActiveProfiles() {
        return api.get('/mlx/profiles/active');
    },
    async syncProfiles() {
        return api.post('/mlx/profiles/sync', {});
    },
};
