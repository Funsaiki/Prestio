/**
 * Compresse une image avant upload
 * @param file - Fichier image à compresser
 * @param maxWidth - Largeur maximale (défaut: 800px)
 * @param maxHeight - Hauteur maximale (défaut: 800px)
 * @param quality - Qualité JPEG (0-1, défaut: 0.8)
 * @returns Promise<Blob> - Image compressée
 */
export async function compressImage(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = reject;

    img.onload = () => {
      // Calculer les dimensions
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Créer un canvas pour redimensionner
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Impossible de créer le contexte canvas'));
        return;
      }

      // Dessiner l'image redimensionnée
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir en blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Échec de la compression'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}
