import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import userUtils from '../utils/user';
import dbClient from '../utils/db';

class FilesController {
    static async postUpload(request, response) {
      const fileQ = new Queue('fileQ');
      const dir = process.env.FOLDER_PATH || '/tmp/files_manager';
  
      const { userId } = await getIdAndKey(request);
      if (!isValidUser(userId)) return response.status(401).send({ error: 'Unauthorized' });
  
      const user = await dbClient.users.findOne({ _id: ObjectId(userId) });
      if (!user) return response.status(401).send({ error: 'Unauthorized' });
  
      const fileName = request.body.name;
      if (!fileName) return response.status(400).send({ error: 'Missing name' });
  
      const fileType = request.body.type;
      if (!fileType || !['folder', 'file', 'image'].includes(fileType)) return response.status(400).send({ error: 'Missing type' });
  
      const fileData = request.body.data;
      if (!fileData && fileType !== 'folder') return response.status(400).send({ error: 'Missing data' });
  
      const publicFile = request.body.isPublic || false;
      let parentId = request.body.parentId || 0;
      parentId = parentId === '0' ? 0 : parentId;
  
      if (parentId !== 0) {
        const parentFile = await dbClient.files.findOne({ _id: ObjectId(parentId) });
        if (!parentFile) return response.status(400).send({ error: 'Parent not found' });
        if (parentFile.type !== 'folder') return response.status(400).send({ error: 'Parent is not a folder' });
      }
  
      const fileInsertData = {
        userId: user._id,
        name: fileName,
        type: fileType,
        isPublic: publicFile,
        parentId
      };
  
      if (fileType === 'folder') {
        await dbClient.files.insertOne(fileInsertData);
        return response.status(201).send({
          id: fileInsertData._id,
          userId: fileInsertData.userId,
          name: fileInsertData.name,
          type: fileInsertData.type,
          isPublic: fileInsertData.isPublic,
          parentId: fileInsertData.parentId
        });
      } else {
        // Handle file and image storage
        const fileUUID = uuidv4();
        const filePath = path.join(dir, fileUUID);
  
        // Ensure the directory exists
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
  
        // Write the file to the disk
        const buffer = Buffer.from(fileData, 'base64');
        fs.writeFileSync(filePath, buffer);
  
        // Add the localPath to fileInsertData
        fileInsertData.localPath = filePath;
        const result = await dbClient.files.insertOne(fileInsertData);
  
        return response.status(201).send({
          id: result.insertedId,
          userId: fileInsertData.userId,
          name: fileInsertData.name,
          type: fileInsertData.type,
          isPublic: fileInsertData.isPublic,
          parentId: fileInsertData.parentId,
          localPath: fileInsertData.localPath
        });
      }
    }
  }  

export default FilesController;
