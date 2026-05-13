/*
IA utilizada: ChatGPT

Prompt 1: "Cómo crear y renderizar ofertas y demandas con JavaScript y arrays"
Prompt 2: "Cómo usar un formulario para añadir elementos a un array en JavaScript"
Prompt 3: "Cómo eliminar tarjetas dinámicas con addEventListener y data attributes"
Prompt 4: "Cómo mostrar ofertas y demandas con estilos diferentes usando Bootstrap"
*/

import { Almacenaje, actualizarNavbar } from "./almacenaje.js";

document.addEventListener("DOMContentLoaded", () => {

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

    async function pintarPublicaciones() {
        try {
            const query = {
                query: `query {
                    obtenerOfertas { id titulo empresa ubicacion descripcion fecha }
                    obtenerDemandas { id nombre profesion disponibilidad descripcion fecha }
                }`
            };
            const res = await fetch('/graphql', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Almacenaje.getToken()}` 
                },
                body: JSON.stringify(query)
            });
            const { data } = await res.json();
            
            const usuarioActual = Almacenaje.getUsuario();
            
            // --- LÓGICA DE FILTRADO ---
            let ofertasFiltradas = data.obtenerOfertas;
            let demandasFiltradas = data.obtenerDemandas;

            // Si NO es administrador, filtramos por el nombre del usuario logueado
            if (usuarioActual && usuarioActual.rol !== 'Administrador') {
                // En Ofertas comparamos con el campo 'empresa'
                ofertasFiltradas = data.obtenerOfertas.filter(o => o.empresa === usuarioActual.nombre);
                
                // En Demandas comparamos con el campo 'nombre'
                demandasFiltradas = data.obtenerDemandas.filter(d => d.nombre === usuarioActual.nombre);
            }

            // Enviamos los datos (ya filtrados o totales si es Admin) a los componentes visuales
            pintarTarjetas(ofertasFiltradas, demandasFiltradas);
            pintarTabla(ofertasFiltradas, demandasFiltradas);
            
            // El gráfico también se adapta
            dibujarGrafico(ofertasFiltradas.length, demandasFiltradas.length);

        } catch (error) {
            console.error("Error cargando publicaciones", error);
        }
    }

    function pintarTarjetas(ofertas, demandas) {
        if (!contenedorOfertas) return;
        const usuarioActual = Almacenaje.getUsuario();
        let html = "";

        // --- SECCIÓN OFERTAS ---
        ofertas.forEach(o => {
            // Un usuario borra lo suyo si el nombre coincide, el Admin borra todo
            const puedeBorrar = usuarioActual?.rol === 'Administrador' || usuarioActual?.nombre === o.empresa;
        
            const btnEliminar = puedeBorrar 
                ? `<button class="btn btn-outline-danger btn-sm mt-2" onclick="eliminar('oferta', '${o.id}')">
                    <i class="bi bi-trash"></i> Eliminar
                </button>` 
                : "";

            html += `
                <div class="col-md-6 col-xl-4">
                    <article class="card h-100 shadow-sm border-primary">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <span class="badge text-bg-primary mb-2">Oferta</span>
                                <small class="text-muted">${o.fecha}</small>
                            </div>
                            <h3 class="h4">${o.titulo}</h3>
                            <p class="mb-1 text-primary"><strong>${o.empresa}</strong></p>
                            <p class="text-muted small"><i class="bi bi-geo-alt"></i> ${o.ubicacion}</p>
                            <hr>
                            <p class="small text-secondary">${o.descripcion || "Sin descripción"}</p>
                            <div class="text-end">${btnEliminar}</div>
                        </div>
                    </article>
                </div>`;
        });

        // --- SECCIÓN DEMANDAS ---
        demandas.forEach(d => {
            const puedeBorrar = usuarioActual?.rol === 'Administrador' || usuarioActual?.nombre === d.nombre;

            const btnEliminar = puedeBorrar 
                ? `<button class="btn btn-outline-danger btn-sm mt-2" onclick="eliminar('demanda', '${d.id}')">
                    <i class="bi bi-trash"></i> Eliminar
                </button>` 
                : "";

            html += `
                <div class="col-md-6 col-xl-4">
                    <article class="card h-100 shadow-sm border-success">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <span class="badge text-bg-success mb-2">Demanda</span>
                                <small class="text-muted">${d.fecha}</small>
                            </div>
                            <h3 class="h4">${d.nombre}</h3>
                            <p class="mb-1 text-success"><strong>${d.profesion}</strong></p>
                            <p class="text-muted small"><i class="bi bi-clock"></i> ${d.disponibilidad}</p>
                            <hr>
                            <p class="small text-secondary">${d.descripcion || "Sin descripción"}</p>
                            <div class="text-end">${btnEliminar}</div>
                        </div>
                    </article>
                </div>`;
        });

        contenedorOfertas.innerHTML = html || `<div class="col-12"><p class="text-center text-muted">No tienes publicaciones todavía.</p></div>`;
    }

    function pintarTabla(ofertas, demandas) {
        if (!tablaOfertas) return;
        const usuarioActual = Almacenaje.getUsuario();
        let html = "";
        
        // Función auxiliar para generar cada fila de la tabla
        const generarFila = (id, tipo, t1, t2, t3, t4, desc, clase, tipoAccion, propietario) => {
            // LÓGICA DE PERMISOS: Solo Admin o el propio autor (propietario) pueden borrar
            const puedeBorrar = usuarioActual?.rol === 'Administrador' || usuarioActual?.nombre === propietario;

            const btnEliminar = puedeBorrar 
                ? `<button class="btn btn-outline-danger btn-sm" onclick="eliminar('${tipoAccion}', '${id}')">Eliminar</button>` 
                : `<span class="text-muted small">Sin permisos</span>`;

            return `
                <tr>
                    <td class="small text-muted">${id.substring(0, 8)}...</td>
                    <td><span class="badge ${clase}">${tipo}</span></td>
                    <td><strong>${t1}</strong></td>
                    <td>${t2}</td>
                    <td>${t3}</td>
                    <td>${t4}</td>
                    <td class="small text-truncate" style="max-width: 150px;">${desc || "-"}</td>
                    <td class="text-end">
                        ${btnEliminar}
                    </td>
                </tr>`;
        };

        // Renderizamos las Ofertas
        ofertas.forEach(o => {
            html += generarFila(
                o.id, "Oferta", o.titulo, o.empresa, o.ubicacion, o.fecha, o.descripcion, 
                "text-bg-primary", "oferta", o.empresa // Pasamos o.empresa como propietario
            );
        });

        // Renderizamos las Demandas
        demandas.forEach(d => {
            html += generarFila(
                d.id, "Demanda", d.nombre, d.profesion, d.disponibilidad, d.fecha, d.descripcion, 
                "text-bg-success", "demanda", d.nombre // Pasamos d.nombre como propietario
            );
        });
        
        tablaOfertas.innerHTML = html || `<tr><td colspan="8" class="text-center text-muted">No hay publicaciones disponibles.</td></tr>`;
    }

    /**
     * DELETE: Elimina una publicación de MongoDB
     * La declaramos en window para que el 'onclick' del HTML pueda encontrarla
     */
    window.eliminar = async (tipo, id) => {
        // 1. Confirmación de cortesía
        if (!confirm(`¿Estás seguro de que quieres eliminar esta ${tipo}?`)) return;

        // 2. Definimos la Mutation según el tipo
        const mutation = tipo === 'oferta' 
            ? `mutation { eliminarOferta(id: "${id}") }`
            : `mutation { eliminarDemanda(id: "${id}") }`;

        try {
            const res = await fetch('/graphql', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Almacenaje.getToken()}` // Enviamos la llave
                },
                body: JSON.stringify({ query: mutation })
            });

            const json = await res.json();

            if (json.errors) {
                // El servidor nos dirá si no tenemos permiso (ej: borrar algo que no es nuestro)
                mostrarMensaje(json.errors[0].message, "error");
            } else {
                // 3. Si todo ok, refrescamos la lista desde el servidor
                await pintarPublicaciones();
                mostrarMensaje(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} eliminada correctamente.`, "ok");
            }
        } catch (error) {
            console.error("Error al eliminar:", error);
            mostrarMensaje("Error de conexión al intentar eliminar.", "error");
        }
    };

    /**
     * CREATE: Crear Oferta o Demanda
     */
    async function crearPublicacion(evento) {
        evento.preventDefault();
        
        const tipo = inputTipo.value; 
        const titulo = inputTitulo.value.trim();
        const empresa = inputEmpresa.value.trim(); 
        const ubicacion = inputUbicacion.value.trim(); 
        const descripcion = inputDescripcion.value.trim();

        // 1. Validaciones básicas en el cliente
        if (!tipo || !titulo || !empresa || !ubicacion) {
            mostrarMensaje("Rellena todos los campos obligatorios.", "error");
            return;
        }

        // 2. Validación de usuario logueado
        const usuarioActual = Almacenaje.getUsuario();
        if (!usuarioActual) {
            mostrarMensaje("Debes estar logueado para publicar.", "error");
            return;
        }

        // 3. Construcción de la Mutation según el tipo seleccionado
        let queryStr = "";
        if (tipo === "oferta") {
            queryStr = `
                mutation {
                    crearOferta(
                        titulo: "${titulo}", 
                        empresa: "${empresa}", 
                        ubicacion: "${ubicacion}", 
                        descripcion: "${descripcion}"
                    ) { id }
                }`;
        } else {
            queryStr = `
                mutation {
                    crearDemanda(
                        nombre: "${empresa}", 
                        profesion: "${titulo}", 
                        disponibilidad: "${ubicacion}", 
                        descripcion: "${descripcion}"
                    ) { id }
                }`;
        }

        try {
            const respuesta = await fetch('/graphql', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Almacenaje.getToken()}` // Enviamos el token para validar rol
                },
                body: JSON.stringify({ query: queryStr })
            });

            const json = await respuesta.json();

            if (json.errors) {
                // El servidor nos dirá si, por ejemplo, un Candidato intenta crear una Oferta
                mostrarMensaje(json.errors[0].message, "error");
            } else {
                // Éxito
                if (formularioOferta) formularioOferta.reset();
                
                // Refrescamos los datos pidiéndolos de nuevo al servidor
                await pintarPublicaciones(); 
                
                mostrarMensaje(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} publicada con éxito.`, "ok");
            }
        } catch (error) {
            console.error("Error al crear publicación:", error);
            mostrarMensaje("Error de conexión con el servidor.", "error");
        }
    }

    /*
    Función para dibujar el gráfico canvas
    */
    function dibujarGrafico(numOfertas, numDemandas) {
        const canvas = document.getElementById("grafico-stats");
        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        // 1. Limpiar el canvas antes de redibujar
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 2. Configuración de dimensiones
        const margen = 50;
        const anchoBarra = 80;
        const alturaMax = canvas.height - (margen * 2);
    
        // Calcular escala (para que las barras no se salgan si hay muchos datos)
        const maxDatos = Math.max(numOfertas, numDemandas, 1); 
        const escala = alturaMax / maxDatos;

        // 3. Dibujar Ejes
        ctx.beginPath();
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 2;
        ctx.moveTo(margen, margen); // Eje Y
        ctx.lineTo(margen, canvas.height - margen); // Esquina
        ctx.lineTo(canvas.width - margen, canvas.height - margen); // Eje X
        ctx.stroke();

        /**
        * Función interna para dibujar cada barra
        */
        function dibujarBarra(x, valor, color, etiqueta) {
            const h = valor * escala;
            const y = (canvas.height - margen) - h;

            // Dibujar la barra
            ctx.fillStyle = color;
            ctx.fillRect(x, y, anchoBarra, h);

            // Texto del valor (encima de la barra)
            ctx.fillStyle = "#000";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "center";
            ctx.fillText(valor, x + (anchoBarra / 2), y - 10);

            // Etiqueta (debajo de la barra)
            ctx.font = "12px Arial";
            ctx.fillText(etiqueta, x + (anchoBarra / 2), canvas.height - (margen / 2));
        }

        // 4. Pintar las barras (Ofertas en Azul, Demandas en Verde)
        dibujarBarra(margen + 50, numOfertas, "#0d6efd", "Ofertas");
        dibujarBarra(margen + 180, numDemandas, "#198754", "Demandas");
    }

    actualizarNavbar();
    pintarPublicaciones();
    if (formularioOferta) formularioOferta.addEventListener("submit", crearPublicacion);
});