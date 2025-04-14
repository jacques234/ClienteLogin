const key = "2BE1moQ*4{w(uh?W?]SlB9W1Hsl`|<8j";

export const encrypt = (refreshToken, refreshTokenId, deviceId,type) => {
    const encrypted = CryptoJS.AES.encrypt(refreshToken, key).toString();
    const request = indexedDB.open("Prueba", 1)
    request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction("tokens", "readwrite")
        const store = transaction.objectStore("tokens");
        store.put({ id: `${deviceId}-${type}`, value: encrypted, refreshTokenId: refreshTokenId })
    };

}

export const decrypt = (encrypted) => {
    const decrypted = CryptoJS.AES.decrypt(encrypted, key).toString(CryptoJS.enc.Utf8);
    return decrypted;
}
export const existeTokenImpersonate = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("Prueba", 1);

        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction("tokens", "readonly");
            const store = transaction.objectStore("tokens");
            const getRequest = store.getAll();

            getRequest.onsuccess = (event) => {
                const result = event.target.result;
                const existe = result.some(el => el.id.includes('-impersonate'));
                resolve(existe); // true o false
            };

            getRequest.onerror = () => reject(false);
        };

        request.onerror = () => reject(false);
    });
};