import livro from '../models/Livro.js';
import { autor } from '../models/Autor.js';
class LivroController {
  static async listarLivros(req, res) {
    try {
      const livros = await livro.find();
      console.log("LIVROS DO BANCO:", livros);
      res.status(200).json(livros);
    } catch (error) {
      console.log("ERRO AO LISTAR LIVROS:", error.message);
      res.status(500).json({message: `Erro ao listar livros: ${error.message}`});
    }
  }
  static async listarLivroPorId(req, res) {
    try {
      const id = req.params.id;
      const livroEncontrado = await livro.findById(id);
      console.log("LIVRO DO BANCO:", livroEncontrado);
      res.status(200).json(livroEncontrado);
    } catch (error) {
      console.log("ERRO AO LISTAR LIVRO POR ID:", error.message);
      res.status(500).json({message: `Erro ao listar livro por id: ${error.message}`});
    }
  }
  static async atualizarLivro(req, res) {
    try {
      const id = req.params.id;
      const livroAtualizado = await livro.findByIdAndUpdate(id, req.body);
      console.log("LIVRO ATUALIZADO:", livro);
      res.status(200).json({message: 'Livro atualizado com sucesso', livro: livroAtualizado });
    } catch (error) {
      console.log("ERRO AO ATUALIZAR LIVRO:", error.message);
      res.status(500).json({message: `Erro ao atualizar livro: ${error.message}`});
    }
  }
  static async cadastrarLivro(req, res) {
    const novoLivro = req.body;
    try {
      const autorEncontrado = await autor.findById(novoLivro.autor);
      const livroCompleto  ={...novoLivro, autor : {...autorEncontrado._doc}};
      const livroCriado = await livro.create(livroCompleto);
      console.log("LIVRO CADASTRADO:", novoLivro);
      res.status(201).json({message: 'Livro cadastrado com sucesso', livro: novoLivro});
    } catch (error) {
      console.log("ERRO AO CADASTRAR LIVRO:", error.message);
      res.status(500).json({message: `Erro ao cadastrar livro: ${error.message}`});  
    }
  }
  static async excluirLivro(req, res) {
    try {
      const id = req.params.id;
      await livro.findByIdAndDelete(id);
      console.log("LIVRO EXCLUIDO:", id);
      res.status(200).json({message: 'Livro excluído com sucesso'});
    } catch (error) {
      console.log("ERRO AO EXCLUIR LIVRO:", error.message);
      res.status(500).json({message: `Erro ao excluir livro: ${error.message}`});
    }
  }
  static async listarLivrosPorEditora(req, res) {
    const editora = req.query.editora;
    try {
      const livrosPorEditora = await livro.find({editora: editora});
      console.log("LIVROS POR EDITORA:", livrosPorEditora);
      res.status(200).json(livrosPorEditora);
    } catch (error) {
      console.log("ERRO AO LISTAR LIVROS POR EDITORA:", error.message);
      res.status(500).json({message: `Erro ao listar livros por editora: ${error.message}`});
    }
  }

}
export default  LivroController;