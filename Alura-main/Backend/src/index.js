const fs = require('fs'); //file system

const caminhoArquivo = process.argv; //pegar o caminho do arquivo passado por parâmetro
const link = caminhoArquivo[2]; //pegar o terceiro item do array, que é o caminho do arquivo

fs.readFile(link, 'utf-8', (erro, texto) => { //ler o arquivo de forma assíncrona
  quebraEmParagrafos(texto);
 //verificaPalavrasDuplicadas(texto);
})

//criar um array com as palavras do texto 
//verificar se alguma palavra está repetida
//se estiver repetida, mostrar a palavra e a quantidade de vezes que ela aparece no texto
//contar as ocorrências de cada palavra no texto
//montar um objeto com o resultado
function quebraEmParagrafos(texto) { //quebrar o texto em parágrafos
  const paragrafos = texto.toLowerCase().split('\n'); //quebrar o texto em parágrafos, transformando tudo em minúsculo
  const contagem = paragrafos.flatMap((paragrafo) => { //flatmap para juntar os arrays resultantes em um único array
    if(!paragrafo) return [];
    return verificaPalavrasDuplicadas(paragrafo);//verificar as palavras duplicadas em cada parágrafo
  })
  console.log(contagem);
}
function limpaPalavra(palavra) { //remover pontuações das palavras
   return palavra.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ''); //remover pontuações das palavras
}
function verificaPalavrasDuplicadas(texto) { //verificar as palavras duplicadas no texto
const listaPalavras = texto.split(" "); //quebrar o texto em palavras
const resultado = {};
//objeto[propriedade] = valor;
listaPalavras.forEach(palavra => { //percorrer cada palavra
  if(palavra.length>=3){ //considerar apenas palavras com 3 ou mais caracteres
    const palavraLimpa = limpaPalavra(palavra);
    resultado[palavraLimpa] = (resultado[palavraLimpa] || 0) + 1;  //se a palavra já existe no objeto, incrementar o valor em 1, caso contrário, iniciar com 1

  }
})
return(resultado); 
}