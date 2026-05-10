/*
IA utilizada: ChatGPT

Prompt 1: "Cómo pintar tarjetas dinámicas con JavaScript a partir de arrays"
Prompt 2: "Cómo mostrar ofertas y demandas en un dashboard con Bootstrap"
Prompt 3: "Cómo crear tarjetas visuales con imágenes placeholder en JavaScript"
Prompt 4: "Cómo mostrar usuario logueado y botón cerrar sesión en la navbar"
*/

import { Almacenaje, actualizarNavbar } from "./almacenaje.js";

document.addEventListener("DOMContentLoaded", () => {
    const contenedorDisponibles = document.getElementById("contenedor-disponibles");
    const contenedorSeleccionados = document.getElementById("contenedor-seleccionados");

    /**
     * Obtiene todos los datos de MongoDB para el Dashboard
     */
    async function obtenerDatosServidor() {
        const query = {
            query: `query {
                obtenerOfertas { id titulo empresa ubicacion descripcion fecha }
                obtenerDemandas { id nombre profesion disponibilidad descripcion fecha }
            }`
        };

        try {
            const res = await fetch('/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(query)
            });
            const { data } = await res.json();
            return data;
        } catch (error) {
            console.error("Error cargando dashboard:", error);
            return { obtenerOfertas: [], obtenerDemandas: [] };
        }
    }

    /**
     * Función principal para pintar las tarjetas en ambas secciones
     */
    async function pintarDashboard() {

        const data = await obtenerDatosServidor();
        const todas = [...data.obtenerOfertas, ...data.obtenerDemandas];

        // IDs que ha seleccionado el usuario (en una nueva clave del storage)
        const seleccionadosIds = JSON.parse(localStorage.getItem("dashboard_seleccionados") || "[]");

        // Filtramos en que lado deben estar
        const disponibles = todas.filter(item => !seleccionadosIds.includes(item.id));
        const seleccionados = todas.filter(item => seleccionadosIds.includes(item.id));

        renderizarZona(contenedorDisponibles, disponibles, "No hay más publicaciones disponibles.");
        renderizarZona(contenedorSeleccionados, seleccionados, "Arrastra aquí tus publicaciones favoritas.");

        configurarEventosDrag();
    }

    function renderizarZona(contenedor, lista, mensajeVacio) {
        if (!contenedor) return;

        if (lista.length === 0) {
            contenedor.innerHTML = `
                <div class="col-12 text-center py-4 text-muted small">
                    ${mensajeVacio}
                </div>`; 
            return;
        }

        contenedor.innerHTML = lista.map(item => {
            const esOferta = item.titulo !== undefined;
            const claseCard = esOferta ? "oferta-card" : "demanda-card";
            const badgeClase = esOferta ? "text-bg-primary" : "text-bg-success";
            const tituloFinal = esOferta ? item.titulo : item.nombre;
            const subTitulo = item.empresa || item.profesion;
            const infoExtra = item.ubicacion || item.disponibilidad;

            return `
                <div class="col-12 mb-2">
                    <article class="card dashboard-card ${claseCard} h-100 shadow-sm tarjeta-arrastrable" 
                            draggable="true" 
                            data-id="${item.id}"
                            ondragstart="event.dataTransfer.setData('text/plain', '${item.id}')">
                        <div class="card-body p-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div style="max-width: 80%;">
                                    <h6 class="card-title mb-1 fw-bold text-truncate">${tituloFinal}</h6>
                                    <p class="card-text small mb-0 fw-bold">${subTitulo}</p>
                                    <p class="card-text small mb-0 text-muted">${infoExtra}</p>
                                    <p class="card-text x-small mb-1 text-secondary" style="font-size: 0.7rem;">
                                    ${item.fecha || 'Sin fecha'}
                                    </p>
                                    <p class="card-text small mb-0 text-muted text-truncate" style="max-height: 3em;">
                                    ${item.descripcion || 'Sin descripción'}
                                    </p>
                                </div>
                                <span class="badge rounded-pill ${badgeClase}">${esOferta ? 'Oferta' : 'Demanda'}</span>
                            </div>
                        </div>
                    </article>
                </div>
            `;
        }).join("");
    }

    /**
     * Listeners nativos de HTML5 Drag & Drop
     */
    function configurarEventosDrag() {
        [contenedorDisponibles, contenedorSeleccionados].forEach(zona => {
        // Limpiamos eventos previos para evitar acumulación (La página crashea si se mueven muchas veces de un sitio a otro)
        zona.ondragover = (e) => {
            e.preventDefault();
            zona.classList.add("drag-over");
        };

        zona.ondragleave = () => zona.classList.remove("drag-over");

        zona.ondrop = (e) => {
            e.preventDefault();
            zona.classList.remove("drag-over");
            const id = e.dataTransfer.getData("text/plain"); //Los id's ya no son Numbers, ahora son strings 
            if (id) {
                actualizarEstadoSeleccion(id, zona.id === "contenedor-seleccionados");
            }
        };
    });
    }

    /**
     * Guarda el cambio en LocalStorage y repinta
     */
    function actualizarEstadoSeleccion(id, añadir) {
        let seleccionadosIds = JSON.parse(localStorage.getItem("dashboard_seleccionados") || "[]");

        if (añadir) {
            if (!seleccionadosIds.includes(id)) seleccionadosIds.push(id);
        } else {
            seleccionadosIds = seleccionadosIds.filter(favId => favId !== id);
        }

        localStorage.setItem("dashboard_seleccionados", JSON.stringify(seleccionadosIds));
        pintarDashboard();
    }

    function conectarSuscripciones() {
        // 1. Detectamos el protocolo: si la web es https, el socket debe ser wss (seguro)
        const protocolo = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
        // 2. Usamos el host actual (que en CodeSandbox será algo como xxxx.csb.app)
        // 3. Importante: GraphQL suele exponer las suscripciones en /graphql
        const urlSocket = `${protocolo}//${window.location.host}/graphql`;

        console.log("Conectando WebSocket a:", urlSocket);

        const socket = new WebSocket(urlSocket, 'graphql-ws');
    
        socket.onopen = () => {
            // Al abrirse la conexión, enviamos el "protocolo de inicio" de GraphQL
            const initMsg = JSON.stringify({ type: 'connection_init', payload: {} });
            socket.send(initMsg);

            // Enviamos la suscripción para Ofertas
            const subOferta = JSON.stringify({
                id: '1',
                type: 'start',
                payload: {
                    query: `subscription { 
                        ofertaCreada { id titulo empresa ubicacion descripcion fecha } 
                    }`
                }
            });
            socket.send(subOferta);

            // Enviamos la suscripción para Demandas
            const subDemanda = JSON.stringify({
                id: '2',
                type: 'start',
                payload: {
                    query: `subscription { 
                        demandaCreada { id nombre profesion disponibilidad descripcion fecha } 
                    }`
                }
            });
            socket.send(subDemanda);
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
        
            // Si recibimos datos de una nueva publicación
            if (data.type === 'data') {
                console.log("¡Nueva publicación recibida vía WebSocket!", data.payload.data);
            
                // En lugar de refrescar toda la página, simplemente volvemos a pintar 
                // el dashboard para que la nueva tarjeta aparezca en "Disponibles"
                pintarDashboard(); 
            
                // Opcional: Mostrar un aviso visual al usuario
                const publicacion = data.payload.data.ofertaCreada || data.payload.data.demandaCreada;
                const titulo = publicacion.titulo || publicacion.nombre;
                mostrarNotificacion(`Nueva publicación: ${titulo}`);
            }
        };
    }

    // Función auxiliar para avisar al usuario
    function mostrarNotificacion(mensaje) {
        const toast = document.createElement("div");
        toast.className = "alert alert-info position-fixed bottom-0 end-0 m-3 shadow";
        toast.style.zIndex = "9999";
        toast.innerText = mensaje;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    actualizarNavbar();
    pintarDashboard();
    conectarSuscripciones();
});