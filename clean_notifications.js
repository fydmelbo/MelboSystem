import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, writeBatch, limit, query } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAE9wNWG2fTcchmQ5hYOyxAg8a1ygX21qg",
  authDomain: "melbosys.firebaseapp.com",
  projectId: "melbosys",
  storageBucket: "melbosys.firebasestorage.app",
  messagingSenderId: "857735403239",
  appId: "1:857735403239:web:6a9c66a2d63fc54878f442",
  measurementId: "G-70QYQ765RR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteInBatches() {
  const collRef = collection(db, "notifications");
  let totalDeleted = 0;
  let keepGoing = true;

  while (keepGoing) {
    const q = query(collRef, limit(500));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      keepGoing = false;
      break;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    totalDeleted += snapshot.size;
    console.log(`Borradas ${totalDeleted} notificaciones...`);
  }

  console.log(`¡Listo! Se borraron un total de ${totalDeleted} notificaciones spam.`);
  process.exit(0);
}

deleteInBatches().catch(console.error);
