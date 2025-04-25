// utils/db.js
import { ref, set, get } from "firebase/database";
import { database } from "../firebaseConfig";

// Guardar número en Firebase
export const guardarNumero = (numero) => {
  set(ref(database, 'numeroActual'), {
    valor: numero
  });
};

// Leer número desde Firebase
export const leerNumero = async () => {
  const snapshot = await get(ref(database, 'numeroActual'));
  if (snapshot.exists()) {
    return snapshot.val().valor;
  } else {
    return null;
  }
};
