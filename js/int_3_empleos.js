import { ofertas as ofertasIniciales, demandas as demandasIniciales } from "./datos.js";
import { Almacenaje, actualizarNavbar } from "./almacenaje.js";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Sincronización inicial con LocalStorage
    if (Almacenaje.obtenerOfertas().length === 0) Almacenaje.guardarOfertas(ofertasIniciales);
    if (Almacenaje.obtenerDemandas().length === 0) Almacenaje.guardarDemandas(demandasIniciales);

    const formularioOferta = document.getElementById("form-oferta");
    const inputTipo = document.getElementById("tipo");
    const inputTitulo = document.getElementById("titulo");
    const inputEmpresa = document.getElementById("empresa");
    const inputUbicacion = document.getElementById("ubicacion");
    const inputDescripcion = document.getElementById("descripcion");
    const mensajeOferta = document.getElementById("mensaje-oferta");
    const contenedorOfertas = document.getElementById("contenedor-ofertas");
    const tablaOfertas = document.getElementById("tabla-ofertas");

    function mostrarMensaje(texto, tipo) {
        if (!mensajeOferta) return;
        mensajeOferta.textContent = texto;
        mensajeOferta.className = "";
        mensajeOferta.classList.add(tipo === "error" ? "mensaje-error" : "mensaje-ok");
    }


    function obtenerNuevoId() {
        const ofertas = Almacenaje.obtenerOfertas();
        const demandas = Almacenaje.obtenerDemandas();
    
        const todos = [...ofertas, ...demandas];

        if (todos.length === 0) return 1;

        //Buscamos el ID más alto entre TODOS
        return Math.max(...todos.map(e => e.id)) + 1;
    }

    function pintarPublicaciones() {
        const ofertas = Almacenaje.obtenerOfertas();
        const demandas = Almacenaje.obtenerDemandas();
        
        pintarTarjetas(ofertas, demandas);
        pintarTabla(ofertas, demandas);
        registrarEventosEliminar();
        dibujarGrafico();
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
        contenedorOfertas.innerHTML = html;
    }

    function pintarTabla(ofertas, demandas) {
        if (!tablaOfertas) return;
        let html = "";
        
        const fila = (id, tipo, t1, t2, t3, t4, desc, clase, btnClase) => `
            <tr>
                <td>${id}</td>
                <td><span class="badge ${clase}">${tipo}</span></td>
                <td>${t1}</td><td>${t2}</td><td>${t3}</td><td>${t4}</td>
                <td class="small">${desc || "-"}</td>
                <td class="text-end">
                    <button class="btn btn-outline-danger btn-sm ${btnClase}" data-id="${id}">Eliminar</button>
                </td>
            </tr>`;

        ofertas.forEach(o => html += fila(o.id, "Oferta", o.titulo, o.empresa, o.ubicacion, o.descripcion, o.fecha, "text-bg-primary", "btn-eliminar-oferta"));
        demandas.forEach(d => html += fila(d.id, "Demanda", d.nombre, d.profesion, d.disponibilidad, d.descripcion, d.fecha, "text-bg-success", "btn-eliminar-demanda"));
        
        tablaOfertas.innerHTML = html;
    }

    function registrarEventosEliminar() {
        document.querySelectorAll(".btn-eliminar-oferta").forEach(b => {
            b.onclick = () => {
                const lista = Almacenaje.obtenerOfertas().filter(o => o.id !== Number(b.dataset.id));
                Almacenaje.guardarOfertas(lista);
                pintarPublicaciones();
                mostrarMensaje("Oferta eliminada", "ok");
            };
        });
        document.querySelectorAll(".btn-eliminar-demanda").forEach(b => {
            b.onclick = () => {
                const lista = Almacenaje.obtenerDemandas().filter(d => d.id !== Number(b.dataset.id));
                Almacenaje.guardarDemandas(lista);
                pintarPublicaciones();
                mostrarMensaje("Demanda eliminada", "ok");
            };
        });
    }

    function crearPublicacion(evento) {
        evento.preventDefault();
        const tipo = inputTipo.value;
        const fechaActual = obtenerFechaActual();
        const datos = {
            titulo: inputTitulo.value.trim(),
            empresa: inputEmpresa.value.trim(),
            ubicacion: inputUbicacion.value.trim(),
            descripcion: inputDescripcion.value.trim(),
            fecha: fechaActual
        };

        if (!tipo || !datos.titulo || !datos.empresa || !datos.ubicacion) {
            mostrarMensaje("Rellena todos los campos", "error");
            return;
        }

        if (tipo === "oferta") {
            const lista = Almacenaje.obtenerOfertas();
            lista.push({ id: obtenerNuevoId(), ...datos });
            Almacenaje.guardarOfertas(lista);

        } else {
            const lista = Almacenaje.obtenerDemandas();
            lista.push({ 
                id: obtenerNuevoId(), 
                nombre: datos.titulo, 
                profesion: datos.empresa, 
                disponibilidad: datos.ubicacion, 
                descripcion: datos.descripcion,
                fecha: datos.fecha
            });
            Almacenaje.guardarDemandas(lista);
        }

        formularioOferta.reset();
        pintarPublicaciones();
        mostrarMensaje("Publicado con éxito", "ok");
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
        const numOfertas = Almacenaje.obtenerOfertas().length;
        const numDemandas = Almacenaje.obtenerDemandas().length;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const margen = 50;
        const anchoBarra = 80;
        const alturaMax = canvas.height - (margen * 2);

        const maxDatos = Math.max(numOfertas, numDemandas, 1); 
        const escala = alturaMax / maxDatos;

        ctx.beginPath();
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 2;
        ctx.moveTo(margen, margen); // Eje Y
        ctx.lineTo(margen, canvas.height - margen); // Esquina
        ctx.lineTo(canvas.width - margen, canvas.height - margen); // Eje X
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
    pintarPublicaciones();
    if (formularioOferta) formularioOferta.addEventListener("submit", crearPublicacion);
});