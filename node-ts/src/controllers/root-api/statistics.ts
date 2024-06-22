// controllers/statisticsController.js
const mongoose = require('mongoose');
import { Request, Response } from 'express';
import { SendResponse } from '../base/sendResponse';
// import { SendResponse } from '../api/base/sendResponse';

export class StatisticsController extends SendResponse{
  constructor() {
    super();
    this.getCollectionStatistics = this.getCollectionStatistics.bind(this);
  }
  async getCollectionStatistics(req: Request, res: Response) {
    console.log('getCollectionStatistics');
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const statsPromises = collections.map(async (collection: any) => {
        const collectionName = collection.name;
        const count = await mongoose.connection.db.collection(collectionName).countDocuments();
        return { collectionName, count };
      });

      const stats = await Promise.all(statsPromises);
      const statsObject = await stats.reduce((acc, stat) => {
        acc[stat.collectionName] = stat.count;
        return acc;
      }, {});

      // res.json([statsObject]);
      this.sendResponse(req, res, 200, [statsObject]);
    } catch (error) {
      console.error(error);
      this.sendErrorResponse(req, res, error);
      // res.status(500).json({ error: 'An error occurred while fetching collection statistics' });
    }
  }
}

