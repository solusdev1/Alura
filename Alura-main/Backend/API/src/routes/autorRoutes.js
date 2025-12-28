import express from 'express';
import AutorController from '../controllers/autorController.js';

const router = express.Router();

router.get('/autores', AutorController.listarAutores);
router.get('/autores/:id', AutorController.listarAutorPorId);
router.post('/autores', AutorController.cadastrarAutor);
router.put('/autores/:id', AutorController.atualizarAutor);
router.delete('/autores/:id', AutorController.excluirAutor);

export default router;
