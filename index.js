import { encrypt,decrypt,existeTokenImpersonate } from './functions/dababase.js';
import { apiUrl } from './conexion/conexion.js';
async function getDeviceId() {
    const { default: FingerprintJS } = await import('./fingerprint.js');

    const fp = await FingerprintJS.load();
    const result = await fp.get();

    return result.visitorId;
}
async function getPublicIP() {
    try {
        const response = await fetch("https://api64.ipify.org?format=json");
        const data = await response.json();
        console.log("IP Pública:", data.ip);
        return data.ip;
    } catch (error) {
        console.error("Error obteniendo la IP:", error);
        return null;
    }
}

// 🔥 Ejemplo de uso


function getInfoDispositivo() {
    const ua = navigator.userAgent;
    let so = 'Desconocido';
    let modelo = 'Desconocido'
    if (/android/i.test(ua)) {
        so = "Android";
        modelo = ua.match(/Android\s\d+;\s([^\)]+)\)/)?.[1] || "Desconocido";
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
        so = "iOS";
        modelo = ua.match(/\(([^;]+);/i)?.[1] || "Desconocido";
    } else if (/Windows NT/i.test(ua)) {
        so = "Windows";
    } else if (/Mac OS X/i.test(ua)) {
        so = "macOS";
    } else if (/Linux/i.test(ua)) {
        so = "Linux";
    }

    return { so, modelo }
}
function getBrowserInfo() {
    const ua = navigator.userAgent;

    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
    if (ua.includes("Edg")) return "Edge";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
    if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
    if (ua.includes("MSIE") || ua.includes("Trident")) return "Internet Explorer";

    return "Desconocido";
}

const request = indexedDB.open("Prueba", 1)

request.onupgradeneeded = (event) => {
    const db = event.target.result;
    db.createObjectStore("tokens", { keyPath: "id" })
}
const getTokenDB = async (deviceId) => {

    return new Promise((resolve, reject) => {
        const request = indexedDB.open("Prueba", 1);

        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction("tokens", "readonly");
            const store = transaction.objectStore("tokens");
            const getRequest = store.get(`${deviceId}-session`);

            getRequest.onsuccess = (event) => {
                const result = event.target.result;
                if (result) {
                    const refreshToken = decrypt(result.value);
                    resolve({
                        refreshToken,
                        refreshTokenId: result.refreshTokenId
                    });
                } else {
                    resolve(null);
                }
            };

            getRequest.onerror = () => reject("Error al obtener token");
        };

        request.onerror = () => reject("Error al abrir la base de datos");
    });
};








document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault(); // Evita que la página se recargue

    // Capturar datos del formulario
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    let deviceId = localStorage.getItem("deviceId");
    let ipDevice = "Desconocida";
    if (!deviceId) { // 🔥 Esperamos la promesa ANTES de asignarla
        deviceId = await getDeviceId(); // ✅ Esperamos la resolución
        localStorage.setItem("deviceId", deviceId);
    }
    getPublicIP().then(ip => {
        console.log("Tu IP pública es:", ip);
        ipDevice = ip
    });
    console.log("Device ID:", deviceId); // ✅ Verificar en la consola del móvil
    let deviceInfo = getInfoDispositivo()
    let navigatatorDevice = getBrowserInfo()
    let accessToken = sessionStorage.getItem("accessToken")
    let tokens = await getTokenDB(deviceId);
    // Enviar datos al backend
    try {
        const response = await fetch(`${apiUrl}api/Login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(
                {
                    email: email,
                    password: password,
                    deviceId: deviceId, // 🔥 Ahora siempre es un string válido
                    Tipo: 'WEB',
                    Modelo: deviceInfo.Modelo,
                    SistemaOperativo: deviceInfo.so,
                    IP: ipDevice,
                    Navegador: navigatatorDevice,
                    accessToken: accessToken,
                    refreshToken: tokens ? tokens.refreshToken : null,
                    refreshTokenId: tokens ? tokens.refreshTokenId : null,
                }
            )
        });

        const data = await response.json();

        if (response.ok) {
            console.log("Access Token:", data.usuarioInfo);
            alert("Inicio de sesión exitoso ✅");
            sessionStorage.setItem("accessToken", data.accessToken)
            console.log(data.refreshToken, data.refreshTokenId)
            encrypt(data.refreshToken, data.refreshTokenId, deviceId,'session')
            window.location.href = "./home.html";
        } else {
            throw new Error(data.message || "Error al iniciar sesión");
        }
    } catch (error) {
        document.getElementById("message").textContent = error.message;
        document.getElementById("message").classList.remove("hidden");
    }
});




