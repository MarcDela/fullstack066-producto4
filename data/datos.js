/*
IA utilizada: ChatGPT

Prompt 1: "Cómo organizar datos de ejemplo en un archivo modular JavaScript"
Prompt 2: "Cómo exportar arrays de objetos para reutilizarlos en varios archivos JS"
Prompt 3: "Qué estructura deben tener usuarios, ofertas y demandas en un prototipo frontend"
Prompt 4: "Cómo definir datos iniciales en memoria para una aplicación sin persistencia"
*/

let ofertas = [
    {
        id: 1,
        titulo: "Tractorista",
        empresa: "Campo Grande",
        ubicacion: "Tórrec",
        descripcion: "Manejo de maquinaria agrícola y apoyo en tareas de campo.",
        fecha: "27/03/2026"
    },
    {
        id: 2,
        titulo: "Ingeniero agrónomo",
        empresa: "Monmalo",
        ubicacion: "Agramunt",
        descripcion: "Gestión de fincas, mejora de producción y coordinación técnica.",
        fecha: "25/03/2026"
    }
];

let demandas = [
    {
        id: 3,
        nombre: "Laura Gómez",
        profesion: "Marketing Digital",
        disponibilidad: "Inmediata",
        descripcion: "Interesada en comunicación digital, redes sociales y campañas online.",
        fecha: "26/03/2026"
    },
    {
        id: 4,
        nombre: "Carlos Pérez",
        profesion: "Soporte IT",
        disponibilidad: "15 días",
        descripcion: "Experiencia en soporte técnico, incidencias y atención a usuarios.",
        fecha: "27/03/2026"
    }
];

let usuarios = [
    {
        id: 1,
        nombre: "Admin",
        email: "admin@agrojobs.com",
        password: "123456aA",
        rol: "Administrador"
    },
    {
        id: 2,
        nombre: "Laura Gómez",
        email: "laura@correo.com",
        password: "123456aA",
        rol: "Candidato"
    },
    {
        id: 3,
        nombre: "Campo Grande",
        email: "rrhh@campogrande.com",
        password: "123456aA",
        rol: "Empresa"
    }
];

// Exportación para Node.js (CommonJS)
module.exports = {
    ofertas,
    demandas,
    usuarios
};