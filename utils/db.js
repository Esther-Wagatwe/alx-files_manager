const { MongoClient, ObjectId } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.db = null;

    // Connect to the database
    this.client.connect()
      .then(() => {
        console.log('DB connected');
        this.db = this.client.db(database);
      })
      .catch((err) => console.error('Database connection error:', err));
  }

  async ensureConnected() {
    if (!this.db) {
      throw new Error('Database connection not established');
    }
    return this.db;
  }

  async nbUsers() {
    const db = await this.ensureConnected();
    return db.collection('users').countDocuments();
  }

  async nbFiles() {
    const db = await this.ensureConnected();
    return db.collection('files').countDocuments();
  }

  async getUserByEmail(email) {
    const db = await this.ensureConnected();
    return db.collection('users').findOne({ email });
  }

  async getUserById(id) {
    const db = await this.ensureConnected();
    return db.collection('users').findOne({ _id: new ObjectId(id) });
  }
}

const dbClient = new DBClient();
export default dbClient;
