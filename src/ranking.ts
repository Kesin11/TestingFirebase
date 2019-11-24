import { firestore as admin_firestore } from "firebase-admin"

const COLLECTION_PATH = '/rankings'

export class RankingAdminModel {
  constructor(private firestore: admin_firestore.Firestore) {}
  collectionRef() { return this.firestore.collection(COLLECTION_PATH) }
  
  async getAllByRank() {
    return this.firestore.collection(COLLECTION_PATH).orderBy('rank', 'asc').get()
  }
}