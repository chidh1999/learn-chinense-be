import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as itemController from '../controllers/itemController.js';
import * as audioController from '../controllers/audioController.js';
import * as reviewController from '../controllers/reviewController.js';
import * as statsController from '../controllers/statsController.js';
import * as dataController from '../controllers/dataController.js';
import { audioUpload } from '../middleware/upload.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
});

router.get('/items', asyncHandler(itemController.list));
router.post('/items', asyncHandler(itemController.create));
router.get('/items/:id', asyncHandler(itemController.getOne));
router.patch('/items/:id', asyncHandler(itemController.update));
router.delete('/items/:id', asyncHandler(itemController.remove));

router.post(
  '/items/:id/audio',
  audioUpload.single('audio'),
  asyncHandler(audioController.upload)
);
router.get('/items/:id/audio', asyncHandler(audioController.play));
router.delete('/items/:id/audio', asyncHandler(audioController.remove));

router.get('/reviews/due', asyncHandler(reviewController.due));
router.post('/reviews/:itemId/complete', asyncHandler(reviewController.complete));
router.get('/reviews/history', asyncHandler(reviewController.history));

router.get('/stats', asyncHandler(statsController.stats));

router.get('/export', asyncHandler(dataController.exportAll));
router.post('/import', asyncHandler(dataController.importAll));

export default router;
