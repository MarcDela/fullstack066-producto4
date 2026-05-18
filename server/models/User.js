const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const auditPlugin = require('./plugins/auditPlugin');

/**
 * Schema de Usuario con validaciones avanzadas, middleware (hooks),
 * métodos de instancia, métodos estáticos, virtuals e índices.
 * 
 * @typedef {Object} UserSchema
 * @property {String} username - Nombre de usuario único
 * @property {String} email - Email único y validado
 * @property {String} password - Contraseña hasheada con bcrypt
 * @property {String} role - Rol del usuario: 'admin' o 'user'
 * @property {Date} lastLogin - Última fecha de inicio de sesión
 * @property {Boolean} isActive - Estado activo/inactivo del usuario
 */
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'El nombre de usuario es obligatorio'],
    unique: true,
    trim: true,
    minlength: [3, 'Mínimo 3 caracteres'],
    maxlength: [30, 'Máximo 30 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Formato de email no válido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'Mínimo 6 caracteres'],
    select: false // No incluir en queries por defecto (seguridad)
  },
  role: {
    type: String,
    enum: { 
      values: ['admin', 'user'], 
      message: 'Rol no válido. Debe ser admin o user' 
    },
    default: 'user'
  },
  lastLogin: {
    type: Date,
    default: null
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true,  // Añade createdAt y updatedAt automáticamente
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==================== ÍNDICES ====================
// Índice compuesto para filtrar por rol y estado
userSchema.index({ role: 1, isActive: 1 });

// ==================== MIDDLEWARE (HOOKS) ====================

/**
 * Pre-save hook: hashea la contraseña antes de guardar
 * Solo se ejecuta si el campo password fue modificado
 */
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Post-save hook: log de confirmación
 */
userSchema.post('save', function(doc) {
  console.log(`📝 Usuario "${doc.username}" guardado correctamente (v${doc.version})`);
});

/**
 * Pre-find hook: excluir usuarios inactivos por defecto
 */
userSchema.pre(/^find/, function(next) {
  // Solo aplicar si no se especifica explícitamente isActive en la query
  if (!this.getQuery().hasOwnProperty('isActive')) {
    this.where({ isActive: { $ne: false } });
  }
  next();
});

// ==================== MÉTODOS DE INSTANCIA ====================

/**
 * Compara una contraseña candidata con la hasheada del usuario
 * @param {String} candidatePassword - Contraseña a verificar
 * @returns {Promise<Boolean>} true si coincide
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Actualiza la fecha de último login
 * @returns {Promise<User>} Usuario actualizado
 */
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  return await this.save();
};

// ==================== MÉTODOS ESTÁTICOS ====================

/**
 * Busca usuarios activos por rol
 * @param {String} role - Rol a buscar ('admin' o 'user')
 * @returns {Query} Query de Mongoose
 */
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

/**
 * Busca un usuario por email incluyendo la contraseña (para login)
 * @param {String} email - Email del usuario
 * @returns {Promise<User|null>} Usuario con password incluido
 */
userSchema.statics.findByEmailWithPassword = function(email) {
  return this.findOne({ email }).select('+password');
};

/**
 * Agregación: estadísticas de usuarios por rol
 * @returns {Promise<Array>} Estadísticas agrupadas
 */
userSchema.statics.getUserStats = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    { $group: {
      _id: '$role',
      count: { $sum: 1 },
      lastRegistered: { $max: '$createdAt' }
    }},
    { $sort: { count: -1 } }
  ]);
};

// ==================== VIRTUALS ====================

/**
 * Virtual: nombre para display con rol
 */
userSchema.virtual('displayName').get(function() {
  return `${this.username} (${this.role})`;
});

// ==================== PLUGIN ====================
userSchema.plugin(auditPlugin);

module.exports = mongoose.model('User', userSchema);
