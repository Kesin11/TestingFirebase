import * as firebase from '@firebase/testing'
import uuid from 'uuid/v4'
import { readFileSync } from 'fs'

// エミュレーターのメモリ空間はprojectId毎に分けられるので、テストスクリプト毎にユニークになるようにprojectIdをランダムにする
const projectId = `test-${uuid()}`
firebase.loadFirestoreRules({
  projectId,
  rules: readFileSync('firestore.rules', 'utf8')
})

const validUserUid = 'valid_user'
const validUserDb = firebase.initializeTestApp({
  projectId,
  auth: { uid: validUserUid }
}).firestore()

describe('rules バリデーション', () => {
  beforeEach(async () => {
    // 初期データ作成
    await validUserDb.collection(`/v/0/users/${validUserUid}/private`).doc('login').set({
      num: 0,
      lastDate: new Date('1970/01/01')
    })
  })

  afterEach(async () => {
    // Firestoreのデータを初期化
    await firebase.clearFirestoreData({
      projectId
    })
  })

  afterAll(async () => {
    await Promise.all(firebase.apps().map(app => app.delete()))
  })

  describe('crudの制限', () => {
    const db = validUserDb

    test('loginはユーザー自身が勝手に削除できない', async () => {
      const now = new Date()
      const login =  db.collection(`/v/0/users/${validUserUid}/private`).doc('login')
      await firebase.assertFails(
        login.delete()
      )
    })
  })

  describe('値の制限', () => {
    const db = validUserDb

    test('numは正の値のみ', async () => {
      const now = new Date()
      const login =  db.collection(`/v/0/users/${validUserUid}/private`).doc('login')
      await firebase.assertSucceeds(
        login.set({
          num: 1,
          lastDate: now,
        })
      )
      await firebase.assertFails(
        login.set({
          num: -1,
          lastDate: now,
        })
      )
    })
  })

  describe('キーの制限', () => {
    const db = validUserDb

    test('numとlastDateはセットで更新する必要がある', async () => {
      const now = new Date()
      const login =  db.collection(`/v/0/users/${validUserUid}/private`).doc('login')
      await firebase.assertSucceeds(
        login.set({
          num: 1,
          lastDate: now,
        })
      )
      await firebase.assertFails(
        login.set({
          num: 2,
        })
      )
    })
  })
})