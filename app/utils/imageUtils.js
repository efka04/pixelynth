const proxyServices = [
  {
    name: 'direct-nocors',
    fetch: async (url) => fetch(url, { mode: 'no-cors' })
  },
  {
    name: 'allorigins',
    fetch: async (url) => fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`)
  },
  {
    name: 'corsproxy',
    fetch: async (url) => fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`)
  }
];

export const fetchWithProxy = async (url, serviceIndex = 0) => {
  if (serviceIndex >= proxyServices.length) {
    throw new Error('All proxy services failed');
  }

  try {
    const service = proxyServices[serviceIndex];
    const response = await service.fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response;
  } catch (proxyError) {
    console.debug(`Proxy ${proxyServices[serviceIndex].name} failed:`, proxyError.message);
    return fetchWithProxy(url, serviceIndex + 1);
  }
};