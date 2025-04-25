// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC11YLi3ZDPD8vCOwcro1j5yNhAtVOAIGM",
  authDomain: "numeros-casilleros.firebaseapp.com",
  databaseURL: "https://numeros-casilleros-default-rtdb.firebaseio.com",
  projectId: "numeros-casilleros",
  storageBucket: "numeros-casilleros.firebasestorage.app",
  messagingSenderId: "7822384886",
  appId: "1:7822384886:web:d3b29c882984db830116d7",
  measurementId: "G-3EBCME40QD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export { database };