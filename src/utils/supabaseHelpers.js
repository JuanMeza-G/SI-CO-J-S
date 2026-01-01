/**
 * Wraps a Supabase query with a timeout to prevent hanging requests
 * @param {Promise} promise - The Supabase query promise
 * @param {number} timeoutMs - Timeout in milliseconds (default: 30000 = 30s)
 * @returns {Promise} - Promise that rejects if timeout is exceeded
 */
export const withTimeout = (promise, timeoutMs = 30000) => {
  let timeoutId;
  let isResolved = false;
  
  // Asegurar que sea una promesa estándar
  const wrappedPromise = Promise.resolve(promise).then(
    (result) => {
      if (!isResolved) {
        isResolved = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }
      return result;
    },
    (error) => {
      if (!isResolved) {
        isResolved = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }
      throw error;
    }
  );

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        timeoutId = null;
        reject(new Error('La petición ha excedido el tiempo de espera. Por favor, intenta nuevamente.'));
      }
    }, timeoutMs);
  });

  return Promise.race([wrappedPromise, timeoutPromise]).finally(() => {
    // Asegurar limpieza del timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  });
};

/**
 * Wraps a Supabase query with timeout and error handling
 * @param {Function} queryFn - Function that returns a Supabase query promise
 * @param {number} timeoutMs - Timeout in milliseconds (default: 30000 = 30s)
 * @param {number} retries - Number of retries (default: 0)
 * @param {number} maxTotalTimeMs - Maximum total time for all attempts (default: 60000 = 60s)
 * @returns {Promise} - Promise with proper error handling
 */
export const safeQuery = async (queryFn, timeoutMs = 30000, retries = 0, maxTotalTimeMs = 60000) => {
  const startTime = Date.now();
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    // Verificar si hemos excedido el tiempo máximo total
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime >= maxTotalTimeMs) {
      const timeoutError = new Error('La operación ha tardado demasiado tiempo. Por favor, intenta nuevamente más tarde.');
      timeoutError.isTimeout = true;
      throw timeoutError;
    }

    try {
      // Ajustar el timeout restante para no exceder el tiempo máximo total
      const remainingTime = maxTotalTimeMs - elapsedTime;
      const currentTimeout = Math.min(timeoutMs, remainingTime);

      if (currentTimeout <= 0) {
        const timeoutError = new Error('La operación ha tardado demasiado tiempo. Por favor, intenta nuevamente más tarde.');
        timeoutError.isTimeout = true;
        throw timeoutError;
      }

      const result = await withTimeout(queryFn(), currentTimeout);

      // Check for Supabase error structure in the result if it's returned as data/error object
      if (result && result.error) {
        if (
          result.error.code === 'PGRST301' || // JWT Expired
          result.error.message?.includes('JWT expired') ||
          result.error.status === 401 ||
          result.error.status === 403
        ) {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        // Si hay un error de supabase pero no es auth, lo devolvemos tal cual para que lo maneje el componente
        // No reintentamos errores de lógica de negocio (ej. row not found, validation constraint)
        return result;
      }

      return result;
    } catch (error) {
      lastError = error;

      // Check for auth errors in caught exception - Fail immediately
      if (
        error.code === 'PGRST301' ||
        error.message?.includes('JWT expired') ||
        error.status === 401 ||
        error.status === 403
      ) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }

      const isTimeout = error.message?.includes('tiempo de espera') || error.isTimeout;
      const isNetwork = error.message?.includes('fetch') || 
                       error.message?.includes('network') || 
                       error.name === 'NetworkError' ||
                       error.message?.includes('Failed to fetch');

      // Si es el último intento, lanzar error con mensaje apropiado
      if (attempt === retries) {
        if (isNetwork) {
          throw new Error('Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.');
        }
        if (isTimeout) {
          throw new Error('La conexión está tardando demasiado. Por favor, verifica tu conexión a internet e intenta nuevamente.');
        }
        throw error;
      }

      // Si el error no es recuperable (no es timeout ni red), lanzar inmediatamente
      if (!isTimeout && !isNetwork) {
        throw error;
      }

      // Si es un error recuperable y tenemos reintentos disponibles, esperamos antes de reintentar
      const delay = Math.min(1000 * Math.pow(2, attempt), 2000); // Máximo 2 segundos de delay
      
      // Verificar que el delay no exceda el tiempo máximo total restante
      const elapsedTime = Date.now() - startTime;
      const remainingTime = maxTotalTimeMs - elapsedTime;
      if (remainingTime <= delay + timeoutMs) {
        // No hay tiempo suficiente para otro intento completo, lanzar error
        throw new Error('La operación ha tardado demasiado tiempo. Por favor, intenta nuevamente más tarde.');
      }

      // Solo loggear en desarrollo o si es el primer intento
      if (attempt === 0 || import.meta.env.DEV) {
        console.warn(`Supabase query failed (attempt ${attempt + 1}/${retries + 1}). Retrying in ${delay}ms...`, error.message);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Error desconocido al ejecutar la consulta.');
};

