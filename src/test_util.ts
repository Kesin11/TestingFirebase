import uuid from 'uuid/v4'
import { Firestore } from '@google-cloud/firestore';

export const generateRandomUserConfig = () => {
  return {
    email: `${uuid()}@example.com`,
    password: Math.round(Math.random()*100000000).toString()
  }
}

export const dummyUsers = () => {
  return [
    {"email": "test1@example.com", "password": "testtest"},
    {"email": "test2@example.com", "password": "testtest"},
  ]
}

export const insertUserFixutre = async (db: Firestore, firestoreVersionPrefix: string, uids: string[]) => {
  for (const uid of uids) {
    await db.collection(`/v/${firestoreVersionPrefix}/users/${uid}/private`).doc('login').set({
      num: Math.round(Math.random() * 100),
      lastDate: new Date()
    })
  }
}