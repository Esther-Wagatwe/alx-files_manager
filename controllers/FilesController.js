import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import UserUtils from '../utils/user';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    try {
      const userid = await UserUtils.getUserIdFromToken(req);

      if (!userid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const {
        name, type, parentId = 0, isPublic = false, data,
      } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }

      if (!type || !['folder', 'file', 'image'].includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
      }

      if (type !== 'folder' && !data) {
        return res.status(400).json({ error: 'Missing data' });
      }
      if (parentId !== 0) {
        const parentFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });
        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }
        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      const newFile = {
        userId: new ObjectId(userid),
        name,
        type,
        parentId: parentId === 0 ? 0 : new ObjectId(parentId),
        isPublic,
        localPath: '',
      };

      if (type === 'folder') {
        const result = await dbClient.db.collection('files').insertOne(newFile);
        return res.status(201).json({
          id: result.insertedId,
          userId: newFile.userId,
          name: newFile.name,
          type: newFile.type,
          isPublic: newFile.isPublic,
          parentId: newFile.parentId,
        });
      }

      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const fileName = uuidv4();
      const filePath = path.join(folderPath, fileName);

      const fileData = Buffer.from(data, 'base64');
      fs.writeFileSync(filePath, fileData);

      newFile.localPath = filePath;
      const result = await dbClient.db.collection('files').insertOne(newFile);

      return res.status(201).json({
        id: result.insertedId,
        userId: newFile.userId,
        name: newFile.name,
        type: newFile.type,
        isPublic: newFile.isPublic,
        parentId: newFile.parentId,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getShow(req, res) {
    try {
      const user = await UserUtils.getUserIdFromToken(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const fileId = req.params.id || '';
      const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId), userId: user._id });
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      return res.status(200).json({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getIndex(req, res) {
    try {
      const user = await UserUtils.getUserIdFromToken(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const parentId = req.query.parentId || '0';
      const pagination = parseInt(req.query.page, 10) || 0;

      const aggregationMatch = {
        $and: [
          { parentId },
          { userId: user._id },
        ],
      };

      let aggregateData = [
        { $match: aggregationMatch },
        { $skip: pagination * 20 },
        { $limit: 20 },
      ];

      if (parentId === '0') aggregateData = [{ $skip: pagination * 20 }, { $limit: 20 }];

      const files = await dbClient.db.collection('files').aggregate(aggregateData);
      const filesArray = [];
      await files.forEach((item) => {
        const fileItem = {
          id: item._id,
          userId: item.userId,
          name: item.name,
          type: item.type,
          isPublic: item.isPublic,
          parentId: item.parentId,
        };
        filesArray.push(fileItem);
      });

      return res.send(filesArray);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default FilesController;
