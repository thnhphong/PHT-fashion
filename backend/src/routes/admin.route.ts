import { Router } from 'express';

const adminRouter = Router();

adminRouter.get('/', (_req, res) => {
  res.send('Admin route');
});

export default adminRouter;