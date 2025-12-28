import { autor } from '../models/Autor.js';
import mongoose from 'mongoose';
class AutorController {
  static async listarAutores(req, res) {
    try {
      const autores = await autor.find();
      console.log("AUTORES DO BANCO:", autores);
      res.status(200).json(autores);
    } catch (error) {
      console.log("ERRO AO LISTAR AUTORES:", error.message);
      res.status(500).json({message: `Erro ao listar autores: ${error.message}`});
    }
  }
  static async listarAutorPorId(req, res) {
    try {
      const id = req.params.id;
      const autorEncontrado = await autor.findById(id);
      console.log("AUTOR DO BANCO:", autorEncontrado);
      res.status(200).json(autorEncontrado);
    } catch (error) {
      console.log("ERRO AO LISTAR AUTOR POR ID:", error.message);
      res.status(500).json({message: `Erro ao listar autor por id: ${error.message}`});
    }
  }
  static async atualizarAutor(req, res) {
    try {
      const id = req.params.id;
      const autorAtualizado = await autor.findByIdAndUpdate(id, req.body);
      console.log("AUTOR ATUALIZADO:", autor);
      res.status(200).json({message: 'Autor atualizado com sucesso', autor: autorAtualizado });
    } catch (error) {
      console.log("ERRO AO ATUALIZAR AUTOR:", error.message);
      res.status(500).json({message: `Erro ao atualizar autor: ${error.message}`});
    }
  }
  static async cadastrarAutor(req, res) {
    try {
            const novoAutor = await autor.create(req.body);
      console.log("AUTOR CADASTRADO:", novoAutor);
      res.status(201).json({message: 'Autor cadastrado com sucesso', autor: novoAutor});
    } catch (error) {
      console.log("ERRO AO CADASTRAR AUTOR:", error.message);
      res.status(500).json({message: `Erro ao cadastrar autor: ${error.message}`});  
    }
  }
  static async excluirAutor(req, res) {
    try {
      const id = req.params.id;
      await autor.findByIdAndDelete(id);
      console.log("AUTOR EXCLUIDO:", id);
      res.status(200).json({message: 'Autor excluído com sucesso'});
    } catch (error) {
      console.log("ERRO AO EXCLUIR AUTOR:", error.message);
      res.status(500).json({message: `Erro ao excluir autor: ${error.message}`});
    }
  }

}
export default  AutorController;