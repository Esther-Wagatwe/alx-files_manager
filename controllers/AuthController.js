import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');

class AuthController {
  static async getConnect(req, res) {
    try {
      if (!dbClient.isAlive()) {
        return res.status(500).json({ error: 'Database connection error' });
      }

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Basic ')) {
        return res.status(401).send('Unauthorized');
      }

      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [email, password] = credentials.split(':');

      // Fetch user by email and verify the hashed password
      const user = await dbClient.db.collection('users').findOne({ email });
      if (!user || user.password !== sha1(password)) {
        return res.status(401).send('Unauthorized');
      }

      const token = uuidv4();
      const key = `auth_${token}`;
      await redisClient.set(key, user._id.toString(), 86400);

      return res.status(200).json({ token });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getDisconnect(req, res) {
    try {
      const { token } = req.headers;
      const userId = await redisClient.get(`auth_${token}`);

      if (!userId) {
        return res.status(401).send('Unauthorized');
      }

      await redisClient.del(`auth_${token}`);

      return res.status(204).end();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default AuthController;
