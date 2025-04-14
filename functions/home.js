import { decrypt, encrypt ,existeTokenImpersonate} from './dababase.js';
import { apiUrl } from '../conexion/conexion.js';
export const funcImpersonate = async (body, accessToken, deviceId) => {
    try {
        const response = await fetch(`${apiUrl}api/Login/impersonate`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "X-Device-Id": deviceId,
                "Content-Type": "application/json",
                "X-User-Session": "123"
            },
            body: JSON.stringify(body)
        });
        const data = await response.json();

        if (response.ok) {
            sessionStorage.setItem("accessTokenImpersonate", data.accessToken); // ✅ Guardar solo el accessToken
            encrypt(data.refreshToken, data.refreshTokenId, deviceId,'impersonate')
        }
        else {
            throw new Error(data.Message || "Error al impersonar");
        }
    } catch (error) {
        console.error(error)
    }
}





export const refreshAction =  async() => {
    let deviceId = localStorage.getItem("deviceId");
    let ipDevice = "Desconocida";
    if (!deviceId) {
        deviceId = await getDeviceId();
        localStorage.setItem("deviceId", deviceId);
    }
    const impersonado = await existeTokenImpersonate();
    let type = impersonado ? "impersonate" : "session"
    const request = indexedDB.open("Prueba", 1);

    request.onsuccess = async (event) => {
        const db = event.target.result;
        const transaction = db.transaction("tokens", "readonly");
        const store = transaction.objectStore("tokens");
        const getRequest = store.get(`${deviceId}-${type}`);

        getRequest.onsuccess = async (event) => {
            const result = event.target.result;
            if (result) {
                console.log("Token encontrado:", result);
                let refreshToken = decrypt(result.value)
                console.log(refreshToken, result.refreshTokenId)
                // Aquí podrías llamar a renovarAccessToken(result.value) si quieres
                 await renovarAccessToken(result.refreshTokenId, refreshToken);
            } else {
                console.log("No se encontró ningún token con ese ID.");
            }
        };

        getRequest.onerror = () => {
            console.error("Error al obtener token de IndexedDB");
        };
    };

    request.onerror = () => {
        console.error("Error al abrir IndexedDB");
    };
}
export async function getDeviceId(params) {
    const { default: FingerprintJS } = await import('./fingerprint.js');

    const fp = await FingerprintJS.load();
    const result = await fp.get();

    return result.visitorId;
}
async function renovarAccessToken(refreshTokenId, refreshToken) {
    try {
        const deviceId = localStorage.getItem("deviceId") || "unknown";
        const accessToken = sessionStorage.getItem("accessToken")
        const impersonado = await existeTokenImpersonate();
        let type = impersonado ? "impersonate" : "session"
        const response = await fetch(`${apiUrl}api/Login/refresh-token`, {
            method: "POST",
            credentials: "include", // 🔥 Enviar la cookie HttpOnly automáticamente
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Device-Id": deviceId,
                "Content-Type": "application/json",
                "X-User-Session": "123"
            },
            body: JSON.stringify(
                {
                    refreshToken: refreshToken,
                    refreshTokenId: refreshTokenId,
                    ip: "Desconocido"
                }
            )
        });

        if (!response.ok) {
            throw new Error("Sesión expirada, por favor inicia sesión nuevamente.");
        }

        const data = await response.json();
        sessionStorage.setItem("accessToken", data.accessToken); // ✅ Guardar solo el accessToken
        encrypt(data.refreshToken, data.refreshTokenId, deviceId,type)
    } catch (error) {
        console.error(error.message);
        // window.location.href = "/login"; // Redirigir si la sesión expiró
    }
}