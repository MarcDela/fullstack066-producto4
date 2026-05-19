require('dotenv').config();
const conectarDB = require('../config/db');
const Usuario = require('../models/Usuario');
const Oferta = require('../models/Oferta');
const Demanda = require('../models/Demanda');

async function seed() {
  await conectarDB();
  await Promise.all([Usuario.deleteMany(), Oferta.deleteMany(), Demanda.deleteMany()]);
  const admin = await Usuario.create({ nombre: 'Admin AgroJobs', email: 'admin@test.com', password: '123456', rol: 'ADMIN' });
  const user = await Usuario.create({ nombre: 'Usuario AgroJobs', email: 'user@test.com', password: '123456', rol: 'USUARIO' });
  await Oferta.create([
    { titulo: 'Recolector de fruta', empresa: 'Agro Zaragoza', ubicacion: 'Zaragoza', descripcion: 'Trabajo de temporada en campo.', salario: 1200, creadaPor: admin.id },
    { titulo: 'Mozo de almacén agrícola', empresa: 'Campo Norte', ubicacion: 'Huesca', descripcion: 'Preparación de pedidos agrícolas.', salario: 1300, creadaPor: admin.id }
  ]);
  await Demanda.create({ nombre: 'Juan Pérez', profesion: 'Tractorista', disponibilidad: 'Inmediata', descripcion: 'Experiencia con maquinaria agrícola.', creadaPor: user.id });
  console.log('✅ Datos de prueba creados: admin@test.com / user@test.com contraseña 123456');
  process.exit(0);
}
seed();
