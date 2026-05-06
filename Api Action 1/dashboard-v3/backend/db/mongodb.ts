import { MongoClient, Db } from 'mongodb';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGODB_DATABASE || 'action1_inventory';

declare global {
  // Persiste a conexão entre hot-reloads em dev
  var _mongoClient: MongoClient | undefined;
}

let client: MongoClient;

export async function getDb(): Promise<Db> {
  if (!global._mongoClient) {
    const isCloud = MONGO_URI.includes('mongodb+srv') || MONGO_URI.includes('mongodb.net');
    global._mongoClient = new MongoClient(MONGO_URI, isCloud
      ? { serverSelectionTimeoutMS: 10000, socketTimeoutMS: 45000 }
      : { serverSelectionTimeoutMS: 5000 });
  }
  client = global._mongoClient;
  await client.connect();
  return client.db(DB_NAME);
}
