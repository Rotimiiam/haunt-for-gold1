/**
 * Socket.IO Error Handling Utilities
 * Provides comprehensive error handling for socket events
 */

/**
 * Wraps a socket event handler with error handling
 * @param {Function} handler - The socket event handler function
 * @returns {Function} Wrapped handler with try-catch
 */
function wrapSocketHandler(handler) {
  return async function(...args) {
    try {
      await handler.apply(this, args);
    } catch (error) {
      console.error('Socket handler error:', error);
      
      // If there's a callback, send error response
      const callback = args[args.length - 1];
      if (typeof callback === 'function') {
        callback({
          status: 'ERROR',
          message: error.message || 'An error occurred'
        });
      }
      
      // Emit error event to client
      if (this && this.emit) {
        this.emit('error', {
          message: 'An error occurred processing your request',
          code: 'HANDLER_ERROR'
        });
      }
    }
  };
}

/**
 * Validates socket event data
 * @param {Object} data - Data to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} Validation result
 */
function validateSocketData(data, schema) {
  const errors = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    if (rules.required && (value === undefined || value === null)) {
      errors.push(`${field} is required`);
      continue;
    }
    
    if (value !== undefined && value !== null) {
      if (rules.type && typeof value !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}`);
      }
      
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
      }
      
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must be at most ${rules.maxLength} characters`);
      }
      
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  wrapSocketHandler,
  validateSocketData
};
