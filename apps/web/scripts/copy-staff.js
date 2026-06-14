const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccount.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const schoolId = 'idpscherukupalli';

async function copy() {
  const staffSnap = await db.collection('schools').doc(schoolId).collection('staff').get();
  const teachersRef = db.collection('schools').doc(schoolId).collection('teachers');
  
  let count = 0;
  for(const doc of staffSnap.docs) {
    await teachersRef.doc(doc.id).set(doc.data(), {merge: true});
    count++;
  }
  console.log(`Copied ${count} staff members to teachers collection.`);
}

copy().catch(console.error).finally(() => process.exit(0));
