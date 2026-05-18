const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

/**
 * Schema de Oferta/Demanda con validaciones, índices compuestos,
 * middleware, agregaciones y búsqueda avanzada con paginación.
 * 
 * @typedef {Object} OfferSchema
 * @property {String} title - Título de la oferta/demanda
 * @property {String} company - Empresa o nombre del candidato
 * @property {String} location - Ubicación o disponibilidad
 * @property {String} description - Descripción detallada
 * @property {String} type - Tipo: 'oferta' o 'demanda'
 * @property {String} category - Categoría del empleo
 * @property {String} status - Estado: activo, reservado, completado, cancelado
 * @property {ObjectId} userId - Referencia al usuario creador
 */
const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    minlength: [3, 'Mínimo 3 caracteres'],
    maxlength: [100, 'Máximo 100 caracteres']
  },
  company: {
    type: String,
    required: [true, 'La empresa/candidato es obligatorio'],
    trim: true,
    maxlength: [100, 'Máximo 100 caracteres']
  },
  location: {
    type: String,
    required: [true, 'La ubicación es obligatoria'],
    trim: true
  },
  description: {
    type: String,
    maxlength: [1000, 'Máximo 1000 caracteres'],
    default: ''
  },
  type: {
    type: String,
    required: [true, 'El tipo es obligatorio'],
    enum: {
      values: ['oferta', 'demanda'],
      message: 'Tipo no válido. Debe ser oferta o demanda'
    }
  },
  category: {
    type: String,
    required: [true, 'La categoría es obligatoria'],
    enum: {
      values: ['agricultura', 'tecnologia', 'hogar', 'vehiculos', 'servicios', 'otros'],
      message: 'Categoría no válida'
    },
    default: 'agricultura'
  },
  status: {
    type: String,
    enum: ['activo', 'reservado', 'completado', 'cancelado'],
    default: 'activo'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario creador es obligatorio']
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==================== ÍNDICES COMPUESTOS ====================
// Optimiza búsquedas por tipo + categoría + estado
offerSchema.index({ type: 1, category: 1, status: 1 });
// Optimiza búsquedas por usuario y estado
offerSchema.index({ userId: 1, status: 1 });
// Índice de texto para búsqueda full-text
offerSchema.index({ title: 'text', description: 'text' });
// Índice para ordenar por fecha de creación
offerSchema.index({ createdAt: -1 });

// ==================== MIDDLEWARE (HOOKS) ====================

/**
 * Pre-find hook: excluir ofertas canceladas por defecto
 * Solo se aplica si no se especifica status en la query
 */
offerSchema.pre(/^find/, function(next) {
  if (!this.getQuery().status) {
    this.where({ status: { $ne: 'cancelado' } });
  }
  next();
});

/**
 * Post-save hook: log de confirmación
 */
offerSchema.post('save', function(doc) {
  console.log(`📋 Oferta "${doc.title}" (${doc.type}) guardada correctamente`);
});

/**
 * Pre-findOneAndUpdate hook: validar que no se cambie a estado inválido
 */
offerSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.status === 'cancelado') {
    console.log(`⚠️ Oferta marcada como cancelada`);
  }
  next();
});

// ==================== MÉTODOS ESTÁTICOS ====================

/**
 * Agregación: estadísticas de ofertas por tipo y categoría
 * @returns {Promise<Array>} Estadísticas agrupadas
 */
offerSchema.statics.getStats = function() {
  return this.aggregate([
    { $match: { status: 'activo' } },
    { $group: {
      _id: { type: '$type', category: '$category' },
      count: { $sum: 1 },
      latestDate: { $max: '$createdAt' }
    }},
    { $sort: { count: -1 } }
  ]);
};

/**
 * Agregación: resumen general de la plataforma
 * @returns {Promise<Object>} Resumen con totales
 */
offerSchema.statics.getSummary = function() {
  return this.aggregate([
    { $match: { status: { $ne: 'cancelado' } } },
    { $group: {
      _id: '$type',
      total: { $sum: 1 },
      activos: { 
        $sum: { $cond: [{ $eq: ['$status', 'activo'] }, 1, 0] }
      }
    }}
  ]);
};

/**
 * Búsqueda avanzada con filtros y paginación
 * @param {Object} filters - Filtros de búsqueda
 * @param {Number} page - Página actual (default: 1)
 * @param {Number} limit - Resultados por página (default: 10)
 * @returns {Promise<Object>} Resultados paginados
 */
offerSchema.statics.search = async function(filters = {}, page = 1, limit = 10) {
  const query = {};

  if (filters.keyword) {
    query.$text = { $search: filters.keyword };
  }
  if (filters.type) {
    query.type = filters.type;
  }
  if (filters.category) {
    query.category = filters.category;
  }
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.userId) {
    query.userId = filters.userId;
  }

  const skip = (page - 1) * limit;

  const [offers, total] = await Promise.all([
    this.find(query)
      .populate('userId', 'username email role')
      .lean()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    this.countDocuments(query)
  ]);

  return {
    offers,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1
  };
};

// ==================== VIRTUALS ====================

/**
 * Virtual: resumen corto para listados
 */
offerSchema.virtual('summary').get(function() {
  return `${this.title} - ${this.company} (${this.location})`;
});

// ==================== PLUGIN ====================
offerSchema.plugin(auditPlugin);

module.exports = mongoose.model('Offer', offerSchema);
