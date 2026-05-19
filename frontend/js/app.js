import { io } from 'socket.io-client';

const API_URL = 'http://localhost:4000/graphql';
const SOCKET_URL = 'http://localhost:4000';
let token = localStorage.getItem('token') || '';
let usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

const $ = id => document.getElementById(id);
const mensajes = $('mensajes');

function log(msg, tipo = '') {
  mensajes.textContent = `[${new Date().toLocaleTimeString()}] ${msg}\n` + mensajes.textContent;
  mensajes.className = tipo;
}

async function gql(query, variables = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map(e => e.message).join('\n'));
  return json.data;
}

function actualizarSesion() {
  if (usuario) {
    $('estadoSesion').textContent = `Sesión iniciada: ${usuario.nombre} (${usuario.rol})`;
    $('navUsuarios').classList.toggle('oculto', usuario.rol !== 'ADMIN');
    $('usuarios').classList.toggle('oculto', usuario.rol !== 'ADMIN');
  } else {
    $('estadoSesion').textContent = 'No has iniciado sesión.';
    $('navUsuarios').classList.add('oculto');
    $('usuarios').classList.add('oculto');
  }
}

function pintarOfertas(ofertas) {
  $('listaOfertas').innerHTML = ofertas.map(o => `
    <article class="item" data-id="${o.id}">
      <h3>${o.titulo}</h3>
      <p><strong>Empresa:</strong> ${o.empresa}</p>
      <p><strong>Ubicación:</strong> ${o.ubicacion}</p>
      <p><strong>Salario:</strong> ${o.salario || 0} €</p>
      <p>${o.descripcion || ''}</p>
      <p class="mini">Creada por: ${o.creadaPor?.nombre || 'sin usuario'}</p>
      ${usuario?.rol === 'ADMIN' ? `<button data-eliminar-oferta="${o.id}">Eliminar</button>` : ''}
    </article>`).join('') || '<p>No hay ofertas todavía.</p>';
}

function pintarDemandas(demandas) {
  $('listaDemandas').innerHTML = demandas.map(d => `
    <article class="item" data-id="${d.id}">
      <h3>${d.nombre}</h3>
      <p><strong>Profesión:</strong> ${d.profesion}</p>
      <p><strong>Disponibilidad:</strong> ${d.disponibilidad}</p>
      <p>${d.descripcion || ''}</p>
      <p class="mini">Creada por: ${d.creadaPor?.nombre || 'sin usuario'}</p>
      ${usuario?.rol === 'ADMIN' ? `<button data-eliminar-demanda="${d.id}">Eliminar</button>` : ''}
    </article>`).join('') || '<p>No hay demandas todavía.</p>';
}

async function cargarDatos() {
  const data = await gql(`
    query {
      obtenerOfertas { id titulo empresa ubicacion descripcion salario creadaPor { nombre } }
      obtenerDemandas { id nombre profesion disponibilidad descripcion creadaPor { nombre } }
    }
  `);
  pintarOfertas(data.obtenerOfertas);
  pintarDemandas(data.obtenerDemandas);
}

$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const data = await gql(`mutation Login($email:String!, $password:String!) {
      login(email:$email, password:$password) { token usuario { id nombre email rol } }
    }`, { email: $('loginEmail').value, password: $('loginPassword').value });
    token = data.login.token;
    usuario = data.login.usuario;
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    actualizarSesion();
    await cargarDatos();
    log('Login correcto', 'ok');
  } catch (err) { log(err.message, 'error'); }
});

$('registroForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const data = await gql(`mutation Register($nombre:String!, $email:String!, $password:String!) {
      register(nombre:$nombre, email:$email, password:$password) { token usuario { id nombre email rol } }
    }`, { nombre: $('regNombre').value, email: $('regEmail').value, password: $('regPassword').value });
    token = data.register.token;
    usuario = data.register.usuario;
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    actualizarSesion();
    await cargarDatos();
    log('Usuario registrado. El primer usuario de la BD será ADMIN; el resto USUARIO.', 'ok');
  } catch (err) { log(err.message, 'error'); }
});

$('logoutBtn').addEventListener('click', () => {
  token = ''; usuario = null;
  localStorage.clear();
  actualizarSesion();
  cargarDatos();
  log('Sesión cerrada');
});

$('ofertaForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await gql(`mutation CrearOferta($titulo:String!, $empresa:String!, $ubicacion:String!, $descripcion:String, $salario:Float) {
      crearOferta(titulo:$titulo, empresa:$empresa, ubicacion:$ubicacion, descripcion:$descripcion, salario:$salario) { id }
    }`, {
      titulo: $('ofertaTitulo').value,
      empresa: $('ofertaEmpresa').value,
      ubicacion: $('ofertaUbicacion').value,
      descripcion: $('ofertaDescripcion').value,
      salario: Number($('ofertaSalario').value || 0)
    });
    e.target.reset();
    await cargarDatos();
    log('Oferta creada con Fetch + GraphQL', 'ok');
  } catch (err) { log(err.message, 'error'); }
});

$('demandaForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await gql(`mutation CrearDemanda($nombre:String!, $profesion:String!, $disponibilidad:String!, $descripcion:String) {
      crearDemanda(nombre:$nombre, profesion:$profesion, disponibilidad:$disponibilidad, descripcion:$descripcion) { id }
    }`, {
      nombre: $('demandaNombre').value,
      profesion: $('demandaProfesion').value,
      disponibilidad: $('demandaDisponibilidad').value,
      descripcion: $('demandaDescripcion').value
    });
    e.target.reset();
    await cargarDatos();
    log('Demanda creada con Fetch + GraphQL', 'ok');
  } catch (err) { log(err.message, 'error'); }
});

document.body.addEventListener('click', async e => {
  const ofertaId = e.target.dataset.eliminarOferta;
  const demandaId = e.target.dataset.eliminarDemanda;
  try {
    if (ofertaId) await gql(`mutation($id:ID!){ eliminarOferta(id:$id) }`, { id: ofertaId });
    if (demandaId) await gql(`mutation($id:ID!){ eliminarDemanda(id:$id) }`, { id: demandaId });
    if (ofertaId || demandaId) { await cargarDatos(); log('Elemento eliminado como ADMIN', 'ok'); }
  } catch (err) { log(err.message, 'error'); }
});

$('cargarUsuarios').addEventListener('click', async () => {
  try {
    const data = await gql(`query { obtenerUsuarios { id nombre email rol } }`);
    $('listaUsuarios').innerHTML = data.obtenerUsuarios.map(u => `
      <article class="item"><strong>${u.nombre}</strong><br>${u.email}<br>Rol: ${u.rol}</article>
    `).join('');
  } catch (err) { log(err.message, 'error'); }
});

const socket = io(SOCKET_URL);
socket.on('connect', () => $('estadoSocket').textContent = 'Socket.io conectado en tiempo real');
socket.on('servidorActivo', msg => log(msg, 'ok'));
socket.on('ofertaCreada', () => { cargarDatos(); log('Socket.io: nueva oferta recibida', 'ok'); });
socket.on('ofertaEliminada', () => { cargarDatos(); log('Socket.io: oferta eliminada', 'ok'); });
socket.on('demandaCreada', () => { cargarDatos(); log('Socket.io: nueva demanda recibida', 'ok'); });
socket.on('demandaEliminada', () => { cargarDatos(); log('Socket.io: demanda eliminada', 'ok'); });

actualizarSesion();
cargarDatos().catch(err => log('No se pudo cargar datos. Comprueba que el backend esté arrancado. ' + err.message, 'error'));
