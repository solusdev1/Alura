import express from 'express';
import LivroController from '../controllers/livroController.js';

const router = express.Router();
router.get('/livros', LivroController.listarLivros);
router.post('/livros', LivroController.cadastrarLivro); 
router.get('/livros/:id', LivroController.listarLivroPorId);
router.put('/livros/:id', LivroController.atualizarLivro);
router.delete('/livros/:id', LivroController.excluirLivro);
export default router;
