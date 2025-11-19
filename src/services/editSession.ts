


let currentImageUrl: string | null = null;

export function setCurrentImageUrl(url: string) {
  currentImageUrl = url;
}

export function getCurrentImageUrl(): string | null {
  return currentImageUrl;
}
