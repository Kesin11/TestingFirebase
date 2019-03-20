import { firestore } from "firebase";

// テスト対象としたいクラス
export class User {
  constructor(private userRepository: UserRepositoryInterface, private uid: string) {}

  async loginInfo() {
    return await this.userRepository.fetchLogin(this.uid)
  }

  async login() {
    await this.userRepository.updateLogin(this.uid)
  }
}

// UserのuserRepositoryをMockに差し替えられるようにインターフェースに依存させる
export interface UserRepositoryInterface {
  fetchLogin: (uid: string) => Promise<FirebaseFirestore.DocumentData | undefined>
  updateLogin: (uid: string) => Promise<void>
}

// 実装コードで使用することを想定したFirestoreにアクセスするクラス
// Unitテストではmockされるので使用しないことになる
export class UserRepository implements UserRepositoryInterface {
  constructor(private db: firestore.Firestore) {}

  async fetchLogin (uid: string) {
    const doc = await this.db.collection(`/v/0/users/${uid}/private`).doc('login').get()
    return doc.data()
  }

  async updateLogin(uid: string) {
    const userLogin = await this.fetchLogin(uid)
    if (!userLogin) return
    await this.db.collection(`/v/0/users/${uid}/private`).doc('login').set({
      ...userLogin,
      num: userLogin.num + 1,
      lastDate: new Date(),
    })
  }
}