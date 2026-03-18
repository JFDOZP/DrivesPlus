import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// Estos datos los obtienes de la consola de Firebase (Project Settings)
const firebaseConfig = {
  apiKey: "AIzaSyDTsRys4l_EyC6AW2HBAFh3i85vzcA_9t0",
  authDomain: "drivesplus-98b23.firebaseapp.com",
  databaseURL: "https://drivesplus-98b23-default-rtdb.firebaseio.com",
  projectId: "drivesplus-98b23",
  storageBucket: "drivesplus-98b23.firebasestorage.app",
  messagingSenderId: "529007236695",
  appId: "1:529007236695:web:33fc23c52603187683b512",
  measurementId: "G-Z44YF9DBJW"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); // Base de datos lista para usar
export const auth = getAuth(app);
