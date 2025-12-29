import styled from 'styled-components';
import React from 'react';
import { livros } from '../../componentes/Pesquisa/dadospesquisa';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color:#fff;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
  margin: 20px;
  padding: 20px;
  border: 1px solid #000;
  cursor: pointer;
  &:hover {
    background-color: #f0f0f0;
  }
  `;
const listaCursos = livros
console.log(listaCursos);

function CursosContainer() {
  return (
    <Container>
      {listaCursos.map(livro => (
        <div key={livro.id}>
          <h2>{livro.titulo}</h2>
          <p>{livro.autor}</p>
          <p>{livro.preco}</p>
          <img src={livro.src} alt={livro.titulo} />
        </div>
      ))}
    </Container>
  )
}

export default CursosContainer;