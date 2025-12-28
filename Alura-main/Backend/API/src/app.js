import express from 'express';
import connectDatabase from './config/dbconnect.js';
import routes from './routes/index.js';

const conexao = await connectDatabase();

const app = express();

routes(app);


export default app;
