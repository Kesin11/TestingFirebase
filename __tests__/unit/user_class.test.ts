import { UserRepositoryInterface, User } from "../../src/user";

// Userクラスが使用するRepositoryをmockすることでFirestoreの依存を外したテストコード
// real/user_class.test.tsとの対比

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