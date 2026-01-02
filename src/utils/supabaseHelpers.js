export const withTimeout = (promise, timeoutMs = 30000) => {
  let timeoutId;
  let isResolved = false;


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

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  });
};

export const safeQuery = async (queryFn, timeoutMs = 30000, retries = 0, maxTotalTimeMs = 60000) => {
  const startTime = Date.now();
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime >= maxTotalTimeMs) {
      const timeoutError = new Error('La operación ha tardado demasiado tiempo. Por favor, intenta nuevamente más tarde.');
      timeoutError.isTimeout = true;
      throw timeoutError;
    }

    try {
      const remainingTime = maxTotalTimeMs - elapsedTime;
      const currentTimeout = Math.min(timeoutMs, remainingTime);

      if (currentTimeout <= 0) {
        const timeoutError = new Error('La operación ha tardado demasiado tiempo. Por favor, intenta nuevamente más tarde.');
        timeoutError.isTimeout = true;
        throw timeoutError;
      }

      const result = await withTimeout(queryFn(), currentTimeout);


      if (result && result.error) {
        if (
          result.error.code === 'PGRST301' ||
          result.error.message?.includes('JWT expired') ||
          result.error.status === 401 ||
          result.error.status === 403
        ) {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        return result;
      }

      return result;
    } catch (error) {
      lastError = error;

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

      if (attempt === retries) {
        if (isNetwork) {
          throw new Error('Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.');
        }
        if (isTimeout) {
          throw new Error('La conexión está tardando demasiado. Por favor, verifica tu conexión a internet e intenta nuevamente.');
        }
        throw error;
      }

      if (!isTimeout && !isNetwork) {
        throw error;
      }

      const delay = Math.min(1000 * Math.pow(2, attempt), 2000);

      const elapsedTime = Date.now() - startTime;
      const remainingTime = maxTotalTimeMs - elapsedTime;
      if (remainingTime <= delay + timeoutMs) {
        throw new Error('La operación ha tardado demasiado tiempo. Por favor, intenta nuevamente más tarde.');
      }

      console.warn(`Supabase query failed (attempt ${attempt + 1}/${retries + 1}). Retrying in ${delay}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Error desconocido al ejecutar la consulta.');
};

