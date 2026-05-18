/**
 * Script de seed: Crea datos iniciales en la base de datos.
 * Ejecutar con: npm run seed
 * 
 * Crea:
 * - 1 usuario admin
 * - 2 usuarios normales
 * - 4 ofertas/demandas de ejemplo
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Offer = require('./models/Offer');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Limpiar colecciones existentes
    await User.deleteMany({});
    await Offer.deleteMany({});
    console.log('🗑️ Colecciones limpiadas');

    // Crear usuarios
    const admin = await User.create({
      username: 'Admin',
      email: 'admin@agrojobs.com',
      password: '123456aA',
      role: 'admin'
    });

    const laura = await User.create({
      username: 'LauraGomez',
      email: 'laura@correo.com',
      password: '123456aA',
      role: 'user'
    });

    const campo = await User.create({
      username: 'CampoGrande',
      email: 'rrhh@campogrande.com',
      password: '123456aA',
      role: 'user'
    });

    console.log('👥 Usuarios creados: Admin, LauraGomez, CampoGrande');

    // Crear ofertas y demandas
    await Offer.create([
      {
        title: 'Tractorista',
        company: 'Campo Grande',
        location: 'Tórrec',
        description: 'Manejo de maquinaria agrícola y apoyo en tareas de campo.',
        type: 'oferta',
        category: 'agricultura',
        userId: campo._id,
        createdBy: campo._id
      },
      {
        title: 'Ingeniero agrónomo',
        company: 'Monmalo',
        location: 'Agramunt',
        description: 'Gestión de fincas, mejora de producción y coordinación técnica.',
        type: 'oferta',
        category: 'agricultura',
        userId: admin._id,
        createdBy: admin._id
      },
      {
        title: 'Laura Gómez - Marketing Digital',
        company: 'Laura Gómez',
        location: 'Disponibilidad inmediata',
        description: 'Interesada en comunicación digital, redes sociales y campañas online.',
        type: 'demanda',
        category: 'tecnologia',
        userId: laura._id,
        createdBy: laura._id
      },
      {
        title: 'Carlos Pérez - Soporte IT',
        company: 'Carlos Pérez',
        location: 'Disponible en 15 días',
        description: 'Experiencia en soporte técnico, incidencias y atención a usuarios.',
        type: 'demanda',
        category: 'tecnologia',
        userId: admin._id,
        createdBy: admin._id
      }
    ]);

    console.log('📋 Ofertas y demandas creadas');
    console.log('\n✅ Seed completado correctamente!');
    console.log('\n📝 Credenciales de acceso:');
    console.log('   Admin: admin@agrojobs.com / 123456aA');
    console.log('   User:  laura@correo.com / 123456aA');
    console.log('   User:  rrhh@campogrande.com / 123456aA');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error.message);
    process.exit(1);
  }
}

seed();
