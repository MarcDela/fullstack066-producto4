
import { Almacenaje, actualizarNavbar } from "./almacenaje.js";

const GQL_URL = "http://localhost:4000/graphql";

document.addEventListener("DOMContentLoaded", async () => {
    const contenedorDisponibles = document.getElementById("contenedor-disponibles");
    const contenedorSeleccionados = document.getElementById("contenedor-seleccionados");
    
    //Función imprimir targetas principal
   async function pintarDashboard() {
        try {
            const respuesta = await fetch(GQL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `
                        query {
                            obtenerOfertas {id titulo empresa ubicacion descripcion fecha}
                            obtenerDemandas {id nombre profesion disponibilidad descripcion fecha}
                        }
                    `
                })
            });

            const { data } = await respuesta.json();
            const ofertas = data.obtenerOfertas || [];
            const demandas = data.obtenerDemandas || [];
            const todas = [...ofertas, ...demandas];

            const seleccionadosIds = JSON.parse(localStorage.getItem("dashboard_seleccionados") || "[]");
            const disponibles = todas.filter(item => !seleccionadosIds.includes(item.id));
            const seleccionados = todas.filter(item => seleccionadosIds.includes(item.id));
            renderizarZona(contenedorDisponibles, disponibles, "No hay más publicaciones disponibles.");
            renderizarZona(contenedorSeleccionados, seleccionados, "Arrastra aquí tus publicaciones favoritas.");
            configurarEventosDrag();

        } catch (error) {
            console.error("Error al cargar el Dashboard:", error);
        }
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
     *Drag&Drop
     */
    function configurarEventosDrag() {
        [contenedorDisponibles, contenedorSeleccionados].forEach(zona => {
        zona.ondragover = (e) => {
            e.preventDefault();
            zona.classList.add("drag-over");
        };

        zona.ondragleave = () => zona.classList.remove("drag-over");
      zona.ondrop = (e) => {
            e.preventDefault();
            zona.classList.remove("drag-over");
            const id = e.dataTransfer.getData("text/plain"); 
            if (id) {
                actualizarEstadoSeleccion(id, zona.id === "contenedor-seleccionados");
            }
        };
    });
    }


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

    actualizarNavbar();
    await pintarDashboard();
});