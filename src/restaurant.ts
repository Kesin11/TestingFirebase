const COLLECTION_PATH = '/restaurants'

export type Restaurant = {
  avgRating: number
  numRatings: number
  name: string
}

export class RestaurantModel {
  constructor(public firestore: FirebaseFirestore.Firestore) {}

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