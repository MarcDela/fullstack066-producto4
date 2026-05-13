const CLAVE_TOKEN = "token_agrojobs";
const CLAVE_USUARIO = "usuarioLogueado";

// --- MÓDULO DE SESION Y SEGURIDAD ---
export const Almacenaje = {
   // Guarda el token y los datos básicos del usuario al hacer login
    setSesion: (token, usuario) => {
        localStorage.setItem(CLAVE_TOKEN, token);
        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    },

    // Recupera el usuario completo (id, nombre, email, rol)
    getUsuario: () => {
        const user = localStorage.getItem(CLAVE_USUARIO);
        return user ? JSON.parse(user) : null;
    },

    // Recupera solo el Token (necesario para las cabeceras de los fetch)
    getToken: () => {
        return localStorage.getItem(CLAVE_TOKEN);
    },

    // Borra todo al salir
    borrarSesion: () => {
        localStorage.removeItem(CLAVE_TOKEN);
        localStorage.removeItem(CLAVE_USUARIO);
    }
};


// --- LÓGICA DE INTERFAZ REUTILIZABLE --- 
export function actualizarNavbar() {
    const usuario = Almacenaje.getUsuario();
    const zonaSesion = document.getElementById("zona-sesion");

    if (!zonaSesion) return;

    if (usuario) {
        zonaSesion.innerHTML = `
            <span class="nav-link mb-0">${usuario.email}</span>
            <button id="btn-logout" class="btn btn-outline-light btn-sm ms-lg-2 mt-2 mt-lg-0" type="button">
                Cerrar sesión
            </button>
        `;
        
        const botonLogout = document.getElementById("btn-logout");
        if (botonLogout) {
            botonLogout.onclick = cerrarSesion; 
        }
    } else {
        zonaSesion.innerHTML = `
            <a class="nav-link" href="login.html">Login</a>
        `;
    }
}

export function cerrarSesion() {
    Almacenaje.borrarSesion(); 
    window.location.href = "index.html"; 
}