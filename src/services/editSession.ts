let currentImageUrl: string | null = null;

export function setCurrentImageUrl(url: string) {
  currentImageUrl = url;
}

export function getCurrentImageUrl(): string | null {
  return currentImageUrl;
}


// ----- tests
export function updateFilter(filter: any) {
  console.log('Filtro actualizado:', filter);
}

export function resetSession() {
  console.log('Sesión reiniciada');
}