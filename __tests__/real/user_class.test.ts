import { User, UserRepository } from "../../src/user"
import config from '../../firebase_config.json'
import { dummyUsers } from "../../src/test_util"
import firebase, { firestore } from "firebase"

// Userクラスに実際にFirestoreにアクセスするUserRepositoryをそのまま使うテストコード
// unit/user_class.test.tsとの対比

const userConfig = dummyUsers()[1]
let uid: string
let db: firestore.Firestore

describe('本物のFirestoreを使うテスト', () => {
  describe('Userクラスで', () => {
    beforeAll(async () => {
      firebase.initializeApp(config)
      await firebase.auth().signInWithEmailAndPassword(userConfig.email, userConfig.password)
      uid = await firebase.auth().currentUser!.uid
      db = firebase.firestore()
    })

    afterAll(async () => {
      // firebaseが裏でコネクションを貼っている（？）のでjestが終了できない
      // 明示的にappを閉じておく
      firebase.app().delete()
    })

    test('ログイン情報にアクセスできる', async () => {
      const userRepository = new UserRepository(db)
      const user = new User(userRepository, uid)
      const userLogin = await user.loginInfo()

      expect(userLogin!).toHaveProperty('num')
      expect(userLogin!).toHaveProperty('lastDate')
    })

    test('ログイン情報を更新できる', async () => {
      const userRepository = new UserRepository(db)
      const user = new User(userRepository, uid)
      const userLogin = await user.loginInfo()

      // ログイン情報を更新
      await user.login()

      const newUserLogin = await user.loginInfo()
      expect(newUserLogin!.num).toBe(userLogin!.num + 1)
      expect(newUserLogin!.lastDate.seconds).toBeGreaterThan(userLogin!.lastDate.seconds)
    })
  })
})