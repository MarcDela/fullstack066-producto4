const CLAVE_USUARIOS = "usuarios";
const CLAVE_SESION = "usuarioLogueado";
const GQL_URL = "http://localhost:4000/graphql";

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
  // --- DATOS DE SESION ---
    getSesion: () => localStorage.getItem(CLAVE_SESION), 
    getToken: () => localStorage.getItem("token_agrojobs"), 
    setSesion: (token, email) => {
        localStorage.setItem("token_agrojobs", token);
        localStorage.setItem(CLAVE_SESION, email);
    },
    borrarSesion: () => {
        localStorage.removeItem("token_agrojobs");
        localStorage.removeItem(CLAVE_SESION);
    },

    // --- DATOS DE OFERTAS ---
   obtenerOfertas: async () => {
        try {
            const respuesta = await fetch(GQL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `query { obtenerOfertas { id titulo empresa ubicacion descripcion fecha } }`
                })
            });
            const { data } = await respuesta.json();
            return data.obtenerOfertas;
        } catch (error) {
            console.error("Error ofertas:", error);
            return [];
        }
    },

    crearOferta: async (titulo, empresa, ubicacion, descripcion) => {
        const respuesta = await fetch(GQL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `mutation { crearOferta(titulo: "${titulo}", empresa: "${empresa}", ubicacion: "${ubicacion}", descripcion: "${descripcion}") { id } }`
            })
        });
        const { data } = await respuesta.json();
        return data.crearOferta;
    },

    // --- DATOS DE DEMANDAS (GraphQL) ---
    obtenerDemandas: async () => {
        try {
            const respuesta = await fetch(GQL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `query { obtenerDemandas { id nombre profesion disponibilidad descripcion fecha } }`
                })
            });
            const { data } = await respuesta.json();
            return data.obtenerDemandas;
        } catch (error) {
            console.error("Error demandas:", error);
            return [];
        }
    },

    crearDemanda: async (nombre, profesion, disponibilidad, descripcion) => {
        const respuesta = await fetch(GQL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `mutation { crearDemanda(nombre: "${nombre}", profesion: "${profesion}", disponibilidad: "${disponibilidad}", descripcion: "${descripcion}") { id } }`
            })
        });
        const { data } = await respuesta.json();
        return data.crearDemanda;
    }
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