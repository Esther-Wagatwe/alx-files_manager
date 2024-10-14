import redisClient from './redis';
import dbClient from './db';

class UserUtils {
  static async getAuthToken(request) {
    const token = request.headers['x-token'];
    return `auth_${token}`;
  }

  static async getUserIdFromToken(request) {
    const key = await this.getAuthToken(request);
    return await redisClient.get(key) || null;
  }

  static async getUserbyId(userId) {
    const user = await dbClient.db.collection('users').findOne({ _id: userId });
    return user;
  }
}

const userUtils = new UserUtils();
export default userUtils;
