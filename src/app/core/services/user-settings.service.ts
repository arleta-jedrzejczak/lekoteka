import { Injectable, inject } from '@angular/core';
import { Auth, user as authUser } from '@angular/fire/auth';
import { Firestore, doc, docData, updateDoc } from '@angular/fire/firestore';
import { Observable, of, switchMap } from 'rxjs';

export interface UserSettings {
  accessibilityMode: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
  theme: 'light' | 'dark' | 'high-contrast';
  reduceMotion: boolean;
}

interface UserDocument {
  settings: UserSettings;
}

@Injectable({ providedIn: 'root' })
export class UserSettingsService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);

  readonly settings$: Observable<UserSettings | undefined> = authUser(this.auth).pipe(
    switchMap((firebaseUser) => {
      if (!firebaseUser) {
        return of(undefined);
      }
      return (docData(doc(this.firestore, `users/${firebaseUser.uid}`)) as Observable<UserDocument | undefined>).pipe(
        switchMap((userDoc) => of(userDoc?.settings))
      );
    })
  );

  async setAccessibilityMode(enabled: boolean): Promise<void> {
    const userId = this.auth.currentUser?.uid;
    if (!userId) {
      return;
    }
    await updateDoc(doc(this.firestore, `users/${userId}`), {
      'settings.accessibilityMode': enabled,
    });
  }

  async setTheme(theme: 'light' | 'dark'): Promise<void> {
    const userId = this.auth.currentUser?.uid;
    if (!userId) {
      return;
    }
    await updateDoc(doc(this.firestore, `users/${userId}`), {
      'settings.theme': theme,
    });
  }
}
