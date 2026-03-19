;(function () {
  try {
    // No-op Vite client shim to avoid runtime errors when extensions inject /@vite/*
    // Intentionally minimal to be valid in both module and classic scripts
    if (typeof window !== 'undefined') {
      window.__VITE_CLIENT_SHIM__ = true
    }
  } catch (e) {
    // swallow
  }
})()
