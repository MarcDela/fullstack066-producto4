const CLAVE_USUARIOS = "usuarios";
const CLAVE_SESION = "usuarioLogueado";

// --- MÓDULO CRUD Y STORAGE ---
export const Almacenaje = {
    obtenerUsuarios: () => {
        const data = localStorage.getItem(CLAVE_USUARIOS);
        return data ? JSON.parse(data) : [];
    },

    guardarUsuarios: (usuarios) => {
        localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios));
    },

    buscarUsuario: (email) => {
        const usuarios = Almacenaje.obtenerUsuarios();
        return usuarios.find(u => u.email === email);
    },

    borrarUsuario: (email) => {
        const usuarios = Almacenaje.obtenerUsuarios();
        const filtrados = usuarios.filter(u => u.email !== email);
        Almacenaje.guardarUsuarios(filtrados);
    },

    // --- DATOS DE SESION ---
    getSesion: () => localStorage.getItem(CLAVE_SESION),
    setSesion: (email) => localStorage.setItem(CLAVE_SESION, email),
    borrarSesion: () => localStorage.removeItem(CLAVE_SESION),

    // --- DATOS DE OFERTAS ---
    obtenerOfertas: () => JSON.parse(localStorage.getItem("ofertas") || "[]"),
    guardarOfertas: (ofertas) => localStorage.setItem("ofertas", JSON.stringify(ofertas)),
    obtenerDemandas: () => JSON.parse(localStorage.getItem("demandas") || "[]"),
    guardarDemandas: (demandas) => localStorage.setItem("demandas", JSON.stringify(demandas)),
};


// --- LÓGICA DE INTERFAZ REUTILIZABLE --- (Evitamos repetir funciones en todos los archivos js)
export function actualizarNavbar() {
    const emailLogueado = Almacenaje.getSesion();
    const zonaSesion = document.getElementById("zona-sesion");

    if (!zonaSesion) return;

    if (emailLogueado) {
        zonaSesion.innerHTML = `
            <span class="nav-link mb-0">${emailLogueado}</span>
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