window.__ENV__ = {
  NEXT_PUBLIC_API_URL: '{{NEXT_PUBLIC_API_URL}}' === '{{' + 'NEXT_PUBLIC_API_URL' + '}}'
    ? 'http://localhost:5000'  // Default for development
    : '{{NEXT_PUBLIC_API_URL}}'
};
