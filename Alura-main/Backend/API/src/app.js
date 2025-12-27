import express from 'express';
import connectDatabase from './config/dbconnect.js';
import livro from './models/Livro.js';

const conexao = await connectDatabase();

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).send('Curso de Node.js');
});

app.get('/livros', async (req, res) => {
  const livros = await livro.find();
  console.log("LIVROS DO BANCO:", livros);
  res.status(200).json(livros);
});

// app.get('/livros', async (req, res) => {
//   const listaLivros = await livro.find();
//   res.status(200).json(listaLivros);
// });

app.post('/livros', async (req, res) => {
  const novoLivro = await livro.create(req.body);
  res.status(201).json(novoLivro);
});

app.put('/livros/:id', async (req, res) => {
  const livroAtualizado = await livro.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.status(200).json(livroAtualizado);
});

app.delete('/livros/:id', async (req, res) => {
  await livro.findByIdAndDelete(req.params.id);
  res.status(200).send('Livro deletado com sucesso');
});

export default app;
