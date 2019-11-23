import { firestore as admin_firestore } from "firebase-admin"
import { firestore } from 'firebase'

const COLLECTION_PATH = '/restaurants'

export type Restaurant = {
  rateAvg: number
  rateNum: number
  name: string
}

export class RestaurantAdminModel {
  constructor(private firestore: admin_firestore.Firestore) {}
  collectionRef() { return this.firestore.collection(COLLECTION_PATH) }

  async add(name: string) {
    return this.firestore.collection(COLLECTION_PATH).add({
      name,
      rateAvg: 0,
      rateNum: 0
    })
  }
  
  async getAll() {
    return this.firestore.collection(COLLECTION_PATH).get()
  }
}

export class RestaurantUserModel {
  constructor(private firestore: firestore.Firestore) {}
  collectionRef() { return this.firestore.collection(COLLECTION_PATH) }

  async getAll() {
    return this.firestore.collection(COLLECTION_PATH).get()
  }
}