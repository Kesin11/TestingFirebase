import firebase from 'firebase'
import config from '../../firebase_config.json'
import { dummyUsers } from '../../src/test_util'

// 元々存在しているユーザーがauthで認証でき、ログインに相当する自分のFirestoreの変更ができるかのテスト

const userConfig = dummyUsers()[0]
let user: firebase.User | null

describe('既存のダミーユーザーが', () => {
  let userId: string | undefined = undefined
  beforeAll(async () => {
    firebase.initializeApp(config)
    await firebase.auth().signInWithEmailAndPassword(userConfig.email, userConfig.password)
    user = await firebase.auth().currentUser
  })

  afterAll(async () => {
    // firebaseが裏でコネクションを貼っている（？）のでjestが終了できない
    // 明示的にappを閉じておく
    firebase.app().delete()
  })

  test('存在していること', () => {
    expect(user).toBeTruthy()
  })

  test('ログイン情報にアクセスできる', async () => {
    const userId = user!.uid
    const db = firebase.firestore()
    const userLogin = await db.collection(`/v/0/users/${userId}/private`).doc('login').get().then(doc => doc.data())
    expect(userLogin!).toHaveProperty('num')
    expect(userLogin!).toHaveProperty('lastDate')
  });

  test('ログイン情報を更新できる', async () => {
    const userId = user!.uid
    const db = firebase.firestore()
    const userLogin = await db.collection(`/v/0/users/${userId}/private`).doc('login').get().then(doc => doc.data())

    // ログイン情報を更新
    await db.collection(`/v/0/users/${userId}/private`).doc('login').set({
      ...userLogin,
      num: userLogin!.num + 1,
      lastDate: new Date(),
    })

    const newUserLogin = await db.collection(`/v/0/users/${userId}/private`).doc('login').get().then(doc => doc.data())
    expect(newUserLogin!.num).toBe(userLogin!.num + 1)
    expect(newUserLogin!.lastDate.seconds).toBeGreaterThan(userLogin!.lastDate.seconds)
  });
});