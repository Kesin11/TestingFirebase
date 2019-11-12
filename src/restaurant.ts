import { firestore as admin_firestore } from "firebase-admin"
import { firestore } from 'firebase'

const COLLECTION_PATH = '/restaurants'

export type Restaurant = {
  avgRating: number
  numRatings: number
  name: string
}

export class RestaurantAdminModel {
  constructor(private firestore: admin_firestore.Firestore) {}

  async add(name: string) {
    return this.firestore.collection(COLLECTION_PATH).add({
      name,
      avgRating: 0,
      numRatings: 0
    })
  }
  
  async getAll() {
    return this.firestore.collection(COLLECTION_PATH).get()
  }
}

export class RestaurantUserModel {
  constructor(private firestore: firestore.Firestore) {}

  async getAll() {
    return this.firestore.collection(COLLECTION_PATH).get()
  }
}