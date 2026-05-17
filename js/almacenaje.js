import { Almacenaje, actualizarNavbar } from "./almacenaje.js";

const GQL_URL = "http://localhost:4000/graphql";

document.addEventListener("DOMContentLoaded", async () => {
    
    const formularioOferta = document.getElementById("form-oferta");
    const inputTipo = document.getElementById("tipo");
    const inputTitulo = document.getElementById("titulo");
    const inputEmpresa = document.getElementById("empresa");
    const inputUbicacion = document.getElementById("ubicacion");
    const inputDescripcion = document.getElementById("descripcion");
    const mensajeOferta = document.getElementById("mensaje-offer"); // Asegurar coincidencia con ID HTML
    const mensajeGeneral = document.getElementById("mensaje-oferta"); // Fallback
    const contenedorOfertas = document.getElementById("contenedor-ofertas");
    const tablaOfertas = document.getElementById("tabla-ofertas");

    // Arrays en memoria local para alimentar el gráfico Canvas dinámicamente
    let ofertasLocales = [];
    let demandasLocales = [];

    function mostrarMensaje(texto, tipo) {
        const elemento = mensajeGeneral || mensajeOferta;
        if (!elemento) return;
        elemento.textContent = texto;
        elemento.className = "";
        elemento.classList.add(tipo === "error" ? "mensaje-error" : "mensaje-ok");
    }

    // Petición asíncrona para obtener las publicaciones aplicando filtros por Rol
    async function pintarPublicaciones() {
        const emailUsuario = Almacenaje.getSesion();
        const rolUsuario = localStorage.getItem("usuario_role") || localStorage.getItem("usuario_rol");

        try {
            const respuesta = await fetch(GQL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `
                        query {
                            obtenerOfertas { id titulo empresa ubicacion descripcion fecha autorEmail }
                            obtenerDemandas { id nombre profesion disponibilidad descripcion fecha autorEmail }
                        }
                    `
                })
            });

            const { data } = await respuesta.json();
            let ofertas = data.obtenerOfertas || [];
            let demandas = data.obtenerDemandas || [];

            // REQUISITO ENUNCIADO: Si no es admin, solo ve lo que ha publicado él mismo
            if (rolUsuario !== "admin") {
                ofertas = ofertas.filter(o => o.autorEmail === emailUsuario);
                demandas = demandas.filter(d => d.autorEmail === emailUsuario);
            }

            // Guardamos en memoria para el Canvas
            ofertasLocales = ofertas;
            demandasLocales = demandas;
            
            pintarTarjetas(ofertas, demandas);
            pintarTabla(ofertas, demandas);
            registrarEventosEliminar();
            dibujarGrafico();

        } catch (error) {
            console.error("Error al sincronizar con MongoDB Atlas:", error);
            mostrarMensaje("No se pudieron cargar los datos del servidor.", "error");
        }
    }

    function pintarTarjetas(ofertas, demandas) {
        if (!contenedorOfertas) return;
        let html = "";

        ofertas.forEach((o) => {
            html += `
                <div class="col-md-6 col-xl-4">
                    <article class="card dashboard-card h-100 shadow-sm">
                        <div class="card-body">
                            <span class="small text-uppercase text-primary fw-semibold d-block mb-2">Oferta laboral</span>
                            <h3 class="card-title h4">${o.titulo}</h3>
                            <p class="card-text mb-1"><strong>${o.empresa}</strong></p>
                            <p class="card-text mb-1"><strong>${o.fecha}</strong></p>
                            <p class="card-text text-muted small">${o.ubicacion}</p>
                            <p class="mt-3 small">${o.descripcion || "Sin descripción."}</p>
                            <div class="d-flex justify-content-between align-items-center mt-4">
                                <span class="badge rounded-pill text-bg-primary">Oferta</span>
                                <button class="btn btn-outline-danger btn-sm btn-eliminar-oferta" data-id="${o.id}">Eliminar</button>
                            </div>
                        </div>
                    </article>
                </div>`;
        });

        demandas.forEach((d) => {
            html += `
                <div class="col-md-6 col-xl-4">
                    <article class="card dashboard-card h-100 shadow-sm">
                        <div class="card-body">
                            <span class="small text-uppercase text-success fw-semibold d-block mb-2">Perfil candidato</span>
                            <h3 class="card-title h4">${d.nombre}</h3>
                            <p class="card-text mb-1"><strong>${d.profesion}</strong></p>
                            <p class="card-text mb-1"><strong>${d.fecha}</strong></p>
                            <p class="card-text text-muted small">${d.disponibilidad}</p>
                            <p class="mt-3 small">${d.descripcion || "Sin descripción."}</p>
                            <div class="d-flex justify-content-between align-items-center mt-4">
                                <span class="badge rounded-pill text-bg-success">Demanda</span>
                                <button class="btn btn-outline-danger btn-sm btn-eliminar-demanda" data-id="${d.id}">Eliminar</button>
                            </div>
                        </div>
                    </article>
                </div>`;
        });
        contenedorOfertas.innerHTML = html || `<div class="text-muted text-center py-4">No tienes publicaciones registradas.</div>`;
    }

    function pintarTabla(ofertas, demandas) {
        if (!tablaOfertas) return;
        let html = "";
        
        const fila = (id, tipo, t1, t2, t3, t4, desc, clase, btnClase) => `
            <tr>
                <td class="small text-truncate" style="max-width: 80px;">${id}</td>
                <td><span class="badge ${clase}">${tipo}</span></td>
                <td>${t1}</td><td>${t2}</td><td>${t3}</td><td>${t4}</td>
                <td class="small">${desc || "-"}</td>
                <td class="text-end">
                    <button class="btn btn-outline-danger btn-sm ${btnClase}" data-id="${id}">Eliminar</button>
                </td>
            </tr>`;

        ofertas.forEach(o => html += fila(o.id, "Oferta", o.titulo, o.empresa, o.ubicacion, o.descripcion, o.fecha, "text-bg-primary", "btn-eliminar-oferta"));
        demandas.forEach(d => html += fila(d.id, "Demanda", d.nombre, d.profesion, d.disponibilidad, d.descripcion, d.fecha, "text-bg-success", "btn-eliminar-demanda"));
        
        tablaOfertas.innerHTML = html || `<tr><td colspan="8" class="text-center text-muted">No hay datos en la tabla.</td></tr>`;
    }

    function registrarEventosEliminar() {
        document.querySelectorAll(".btn-eliminar-oferta").forEach(b => {
            b.onclick = async () => {
                try {
                    await fetch(GQL_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            query: `mutation { eliminarOferta(id: "${b.dataset.id}") }`
                        })
                    });
                    pintarPublicaciones();
                    mostrarMensaje("Oferta eliminada con éxito", "ok");
                } catch (error) {
                    mostrarMensaje("No se pudo eliminar la oferta.", "error");
                }
            };
        });

        document.querySelectorAll(".btn-eliminar-demanda").forEach(b => {
            b.onclick = async () => {
                try {
                    await fetch(GQL_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            query: `mutation { eliminarDemanda(id: "${b.dataset.id}") }`
                        })
                    });
                    pintarPublicaciones();
                    mostrarMensaje("Demanda eliminada con éxito", "ok");
                } catch (error) {
                    mostrarMensaje("No se pudo eliminar la demanda.", "error");
                }
            };
        });
    }

    async function crearPublicacion(evento) {
        evento.preventDefault();
        const tipo = inputTipo.value;
        const fechaActual = obtenerFechaActual();
        const emailAutor = Almacenaje.getSesion() || "anonimo@test.com";

        const titulo = inputTitulo.value.trim();
        const empresa = inputEmpresa.value.trim();
        const ubicacion = inputUbicacion.value.trim();
        const descripcion = inputDescripcion.value.trim();

        if (!tipo || !titulo || !empresa || !ubicacion) {
            mostrarMensaje("Rellena todos los campos obligatorios", "error");
            return;
        }

        try {
            let queryMutation = "";

            if (tipo === "oferta") {
                queryMutation = `
                    mutation {
                        crearOferta(titulo: "${titulo}", empresa: "${empresa}", ubicacion: "${ubicacion}", descripcion: "${descripcion}", fecha: "${fechaActual}", autorEmail: "${emailAutor}") { id }
                    }
                `;
            } else {
                queryMutation = `
                    mutation {
                        crearDemanda(nombre: "${titulo}", profesion: "${empresa}", disponibilidad: "${ubicacion}", descripcion: "${descripcion}", fecha: "${fechaActual}", autorEmail: "${emailAutor}") { id }
                    }
                `;
            }

            const respuesta = await fetch(GQL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: queryMutation })
            });

            const resultado = await respuesta.json();

            if (resultado.errors) {
                mostrarMensaje("Error en las validaciones de Mongoose.", "error");
                return;
            }

            formularioOffer.reset(); // Intento reset formulario original
            if (formularioOferta) formularioOferta.reset();
            
            await pintarPublicaciones();
            mostrarMensaje("Publicado con éxito en la nube Atlas", "ok");

        } catch (error) {
            console.error(error);
            mostrarMensaje("Error de red al guardar la publicación.", "error");
        }
    }

    function obtenerFechaActual() {
        const hoy = new Date();
        const dia = String(hoy.getDate()).padStart(2, '0');
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const anio = hoy.getFullYear();
        return `${dia}/${mes}/${anio}`;
    }

    function dibujarGrafico() {
        const canvas = document.getElementById("grafico-stats");
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const numOfertas = ofertasLocales.length;
        const numDemandas = demandasLocales.length;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const margen = 50;
        const anchoBarra = 80;
        const alturaMax = canvas.height - (margen * 2);
    
        const maxDatos = Math.max(numOfertas, numDemandas, 1); 
        const escala = alturaMax / maxDatos;

        ctx.beginPath();
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 2;
        ctx.moveTo(margen, margen); 
        ctx.lineTo(margen, canvas.height - margen); 
        ctx.lineTo(canvas.width - margen, canvas.height - margen); 
        ctx.stroke();

        function dibujarBarra(x, valor, color, etiqueta) {
            const h = valor * escala;
            const y = (canvas.height - margen) - h;

            ctx.fillStyle = color;
            ctx.fillRect(x, y, anchoBarra, h);

            ctx.fillStyle = "#000";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "center";
            ctx.fillText(valor, x + (anchoBarra / 2), y - 10);

            ctx.font = "12px Arial";
            ctx.fillText(etiqueta, x + (anchoBarra / 2), canvas.height - (margen / 2));
        }

        dibujarBarra(margen + 50, numOfertas, "#0d6efd", "Ofertas");
        dibujarBarra(margen + 180, numDemandas, "#198754", "Demandas");
    }

    actualizarNavbar();
    await pintarPublicaciones();
    if (formularioOferta) formularioOferta.addEventListener("submit", crearPublicacion);
});