import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  Auth,
  GoogleAuthProvider,
  User,
  signInWithPopup,
  signOut,
  user as authUser,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc, serverTimestamp, setDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);
  private readonly router = inject(Router);

  readonly user = toSignal(authUser(this.auth), { initialValue: undefined });

  constructor() {
    authUser(this.auth).subscribe((firebaseUser) => {
      if (firebaseUser) {
        this.ensureUserDocument(firebaseUser);
      }
    });
  }

  async signInWithGoogle(): Promise<void> {
    await signInWithPopup(this.auth, new GoogleAuthProvider());
    await this.router.navigateByUrl('/today');
  }

  async signOutUser(): Promise<void> {
    await signOut(this.auth);
    await this.router.navigateByUrl('/login');
  }

  private async ensureUserDocument(firebaseUser: User): Promise<void> {
    const userRef = doc(this.firestore, `users/${firebaseUser.uid}`);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      await setDoc(
        userRef,
        {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        },
        { merge: true }
      );
      return;
    }

    await setDoc(userRef, {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      settings: {
        accessibilityMode: false,
        fontSize: 'normal',
        theme: 'light',
        reduceMotion: false,
      },
      createdAt: serverTimestamp(),
    });
  }
}
