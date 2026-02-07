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
};
