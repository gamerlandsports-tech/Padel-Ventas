import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Sube una imagen a Firebase Storage y retorna su URL pública
 */
export async function uploadImage(file, folder = 'products') {
  if (!file) return null;

  // Create a unique filename
  const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const storageRef = ref(storage, `${folder}/${fileName}`);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Podríamos manejar progreso aquí si lo necesitamos (snapshot.bytesTransferred / snapshot.totalBytes)
      },
      (error) => {
        console.error('Error uploading image:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Elimina una imagen de Firebase Storage usando su URL
 */
export async function deleteImageByUrl(imageUrl) {
  if (!imageUrl || !imageUrl.includes('firebasestorage.googleapis.com')) return;

  try {
    // Extraer el path del archivo desde la URL de Firebase
    const urlObj = new URL(imageUrl);
    const pathDecoded = decodeURIComponent(urlObj.pathname.split('/o/')[1]);
    const fileRef = ref(storage, pathDecoded);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting image:', error);
  }
}
