const mongoose = require('mongoose');

/**
 * Plugin Mongoose para auditoría automática.
 * Registra quién creó/modificó un documento y mantiene un contador de versión.
 * 
 * Campos añadidos al schema:
 * - createdBy: ObjectId del usuario que creó el documento
 * - updatedBy: ObjectId del último usuario que modificó el documento
 * - version: Número de versión incremental
 * 
 * @param {mongoose.Schema} schema - Schema al que se aplica el plugin
 */
function auditPlugin(schema) {
  // Añadir campos de auditoría al schema
  schema.add({
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      default: null
    },
    updatedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      default: null
    },
    version: { 
      type: Number, 
      default: 0 
    }
  });

  // Hook pre-save: incrementar versión
  schema.pre('save', function(next) {
    if (this.isNew) {
      this.version = 1;
    } else {
      this.version += 1;
    }
    next();
  });

  // Hook pre-findOneAndUpdate: incrementar versión en updates
  schema.pre('findOneAndUpdate', function(next) {
    this.set({ $inc: { version: 1 } });
    next();
  });

  // Hook pre-updateOne: incrementar versión
  schema.pre('updateOne', function(next) {
    this.set({ $inc: { version: 1 } });
    next();
  });
}

module.exports = auditPlugin;
