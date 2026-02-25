export function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export const formatCurrency = (amount: number | string) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `৳${numAmount.toFixed(2)}`;
};

export const formatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const getImageUrl = (path: string | null | undefined) => {
  if (!path) return "";
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';
  
  if (path.startsWith('http')) {
    // If it's already an absolute URL, check if it already has /public/
    if (path.includes(baseUrl) && !path.includes(`${baseUrl}/public/`)) {
      return path.replace(baseUrl, `${baseUrl}/public`);
    }
    return path;
  }
  
  // For relative paths, prepend the base URL and /public/
  return `${baseUrl}/public/${path}`;
};