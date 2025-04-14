import {funcImpersonate,refreshAction,getDeviceId} from './functions/home.js'

let dropDownUsuarios = document.getElementById('usuarios');
dropDownUsuarios.addEventListener('change', async (event) => {
    const nombre = event.target.options[event.target.selectedIndex].text;
    let deviceId = localStorage.getItem("deviceId");
    let hHome = document.getElementById("hHome");
    let btnCerrarSesion = document.getElementById("btnLogout")
    const accessToken = sessionStorage.getItem("accessToken")
    if (!deviceId) {
        deviceId = await getDeviceId();
        localStorage.setItem("deviceId", deviceId);
    }
    let body = {
        usuarioImpersonarId: event.target.value,
        ip: "desconocido",
        Navegador: "default"
    }
    await funcImpersonate(body, accessToken, deviceId)
    hHome.innerText = `Estas impersonando a ${nombre}`
    btnCerrarSesion.textContent = `Cerrar sesion de ${nombre}`
})
let btnRefresh = document.getElementById('btnRefresh')
btnRefresh.addEventListener('click', async function () {
    await refreshAction();
})
