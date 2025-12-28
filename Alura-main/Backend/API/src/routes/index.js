import express from 'express';
import livrosRoutes from './livrosRoutes.js';
import autorRoutes from './autorRoutes.js';

function routes(app) {
  app.route('/').get((req, res) =>
    res.status(200).send('Curso de Node.js')
  );

  app.use(express.json());
  app.use(livrosRoutes);
  app.use(autorRoutes);
}

export default routes;