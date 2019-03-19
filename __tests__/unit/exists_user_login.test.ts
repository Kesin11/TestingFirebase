import firebase, { firestore } from 'firebase'

// Firestoreに実際にアクセスする部分をmockすることで外部サービスに依存しないユニットテストとする例

// テスト対象としたいクラス
class User {
  constructor(private userRepository: UserRepositoryInterface, private uid: string) {}

  async loginInfo() {
    return await this.userRepository.fetchLogin(this.uid)
  }

  async login() {
    await this.userRepository.updateLogin(this.uid)
  }
}

// UserのuserRepositoryをMockに差し替えられるようにインターフェースに依存させる
interface UserRepositoryInterface {
  fetchLogin: (uid: string) => Promise<FirebaseFirestore.DocumentData | undefined>
  updateLogin: (uid: string) => Promise<void>
}

// 実装コードで使用することを想定したFirestoreにアクセスするクラス
// 今回のテストコードでは使用しないことになる
class UserRepository implements UserRepositoryInterface {
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

// テストでFirestoreへの依存を切るために使用するMockクラス
class UserRepositoryMock implements UserRepositoryInterface {
  constructor() {}
  async fetchLogin (uid: string) {
    return {
      num: 1,
      lastDate: new Date('2019/02/01 00:00')
    }
  }
  async updateLogin (uid: string) {
    return
  }
}

const userId = 'dummy'
const userRepositoryMock = new UserRepositoryMock()

describe('ユニットテスト', () => {
  describe('Userクラスで', () => {
    // UserRepositoryMockを使うことでFirestoreへ依存しなくて済むため、firebase.firestore()が不要
    // Firestoreを使用しないので、firebase.initializeApp()すら不要になる

    test('ログイン情報にアクセスできる', async () => {
      const user = new User(userRepositoryMock, userId)
      const userLogin = await user.loginInfo()

      expect(userLogin!).toHaveProperty('num')
      expect(userLogin!).toHaveProperty('lastDate')
    });

    test('ログイン情報を更新できる', async () => {
      const user = new User(userRepositoryMock, userId)

      // ログイン情報を更新
      await user.login()
    
      // UserRepositoryMockではログイン情報を実際に更新しないため、更新後の値が正しいかをexpectで確認することはできない
      // ここでは単にuser.login()がエラーにならないことだけを確認している
    })
  })
})