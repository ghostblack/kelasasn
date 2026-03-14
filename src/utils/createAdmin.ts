import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export const createAdminUser = async (email: string, password: string, displayName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, 'admins', user.uid), {
      uid: user.uid,
      email: email,
      role: 'admin',
      displayName: displayName,
      createdAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email,
      displayName: displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('Admin user created successfully!');
    console.log('Email:', email);
    console.log('UID:', user.uid);

    return { success: true, uid: user.uid };
  } catch (error: any) {
    console.error('Error creating admin user:', error);
    return { success: false, error: error.message };
  }
};
