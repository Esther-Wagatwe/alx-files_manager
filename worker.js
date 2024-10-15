import dbClient from "./utils/db";
const Bull = require("bull");
const { ObjectId } = require("mongodb");
const imageThumbnail = require("image-thumbnail");
const fs = require("fs");

const fileQueue = new Bull("fileQueue");

const generateThumbnail = async (path, options) => {
    try {
        const thumbnail = await imageThumbnail(path, options);
        const thumbnailPath = `${path}_${options.width}`;
        await fs.writeFileSync(thumbnailPath, thumbnail);
    } catch (error) {
        console.log(error);
    }
};

fileQueue.process(async (job) => {
    const  { fileId } = job.data;
    if (!fileId) throw Error("Missing fileId");

    const { userId } = job.data;
    if (!userId) throw Error("Missing userId");

    const fileDoc = await dbClient.db.collection("files").findOne({
        _id: ObjectId(fileId),
        userId: ObjectId(userId),
    });

    if (!fileDoc) throw Error("File not found");

    await generateThumbnail(fileDoc.localPath, { width: 500 });
    await generateThumbnail(fileDoc.localPath, { width: 250 });
    await generateThumbnail(fileDoc.localPath, { width: 100 });
});

userQueue.process(async (job) => {
    const { userId } = job.data;
    if (!userId) throw Error('Missing userId');
  
    const userDocument = await DBClient.db.collection('users').findOne({ _id: ObjectId(userId) });
    if (!userDocument) throw Error('User not found');
  
    console.log(`Welcome ${userDocument.email}`);
  });