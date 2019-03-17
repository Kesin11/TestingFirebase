import * as firebase from '@firebase/testing'
import uuid from 'uuid/v4'
import { readFileSync } from 'fs';

const projectId = `test-${uuid()}`
firebase.loadFirestoreRules({
  projectId,
  rules: readFileSync('firestore.rules', 'utf8')
})

let validUserUid = 'valid_user'
let invalidUserUid = 'invalid_user'

const validUserDb = firebase.initializeTestApp({
  projectId,
  auth: { uid: validUserUid }
}).firestore()
const invalidUserDb = firebase.initializeTestApp({
  projectId,
  auth: { uid: invalidUserUid }
}).firestore()

describe('rules 自分しかアクセスできないデータに', () => {
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

  describe('自分が', () => {
    const db = validUserDb

    test('ログイン情報をreadできる', async () => {
      const login =  db.collection(`/v/0/users/${validUserUid}/private`).doc('login')
      await firebase.assertSucceeds(login.get())
    })

    test('ログイン情報をwriteできる', async () => {
      const now = new Date()
      const login = db.collection(`/v/0/users/${validUserUid}/private`).doc('login')
      await firebase.assertSucceeds(
        login.set({
          num: 1,
          lastDate: now,
        })
      )
    })
  })

  describe('別のユーザーが', () => {
    const db = invalidUserDb

    test('ログイン情報をreadできない', async () => {
      const login =  db.collection(`/v/0/users/${validUserUid}/private`).doc('login')
      await firebase.assertFails(login.get())
    })

    test('ログイン情報をwriteできない', async () => {
      const now = new Date()
      const login = db.collection(`/v/0/users/${validUserUid}/private`).doc('login')
      await firebase.assertFails(
        login.set({
          num: 1,
          lastDate: now,
        })
      )
    })
  })
})