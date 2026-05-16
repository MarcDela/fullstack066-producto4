/*
IA utilizada: ChatGPT

Prompt 1: "Cómo pintar tarjetas dinámicas con JavaScript a partir de arrays"
Prompt 2: "Cómo mostrar ofertas y demandas en un dashboard con Bootstrap"
Prompt 3: "Cómo crear tarjetas visuales con imágenes placeholder en JavaScript"
Prompt 4: "Cómo mostrar usuario logueado y botón cerrar sesión en la navbar"
*/

import { ofertas as ofertasIniciales, demandas as demandasIniciales } from "./datos.js";
import { Almacenaje, actualizarNavbar } from "./almacenaje.js";

document.addEventListener("DOMContentLoaded", () => {
    const contenedorDisponibles = document.getElementById("contenedor-disponibles");
    const contenedorSeleccionados = document.getElementById("contenedor-seleccionados");

    if (Almacenaje.obtenerOfertas().length === 0) {
        Almacenaje.guardarOfertas(ofertasIniciales);
    }
    if (Almacenaje.obtenerDemandas().length === 0) {
        Almacenaje.guardarDemandas(demandasIniciales);
    }

    // Función global para printear las tarjetas en ambas secciones
    function pintarDashboard() {

        const ofertas = Almacenaje.obtenerOfertas();
        const demandas = Almacenaje.obtenerDemandas();
        const todas = [...ofertas, ...demandas];

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
            const id = Number(e.dataTransfer.getData("text/plain"));
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

    actualizarNavbar();
    pintarDashboard();
});