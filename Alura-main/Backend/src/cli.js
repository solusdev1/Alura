import fs from 'fs';
import trataErros from './erros/funcoesErros.js';
import { contaPalavras } from './index.js';
import { montaSaidaArquivo } from './helpers.js';
import { Command } from 'commander';
import chalk from 'chalk';


const programa = new Command(); // cria uma nova instância do comando

programa // comando para executar o programa
  .version('1.0.0') // versão do programa
  .description('Programa para contar palavras em um arquivo') // descrição do programa
  .option('-t, --texto <caminho>', 'caminho do arquivo de texto') // opção para o caminho do arquivo de texto
  .option('-d, --diretorio <diretorio>', 'diretório de saída') // opção para o diretório de saída
  .action(({ texto, diretorio }) => { // ação para executar o programa

    if (!texto || !diretorio) {
      console.error(chalk.red('❌ Uso: node cli.js -t <texto> -d <diretorio>'));
      programa.help();
      return;
    }

    // 🔹 Resolve caminhos a partir do terminal usando process.cwd()
    const arquivoEntrada = `${process.cwd()}/${texto}`;
    const pastaDestino = `${process.cwd()}/${diretorio}`;

    processaArquivo(arquivoEntrada, pastaDestino);
  });

programa.parse(process.argv);

// ===============================
// 🔹 Função principal de leitura do arquivo 
// ===============================
function processaArquivo(caminhoArquivo, diretorio) {

  fs.readFile(caminhoArquivo, 'utf-8', async (erro, conteudo) => {
    try {
      if (erro) throw erro;

      const resultado = contaPalavras(conteudo);
      await criaESalvaArquivo(resultado, diretorio);

      console.log(chalk.green('✅ Arquivo processado com sucesso!'));
      console.log(chalk.blue('📄 Entrada:'), caminhoArquivo);
      console.log(chalk.blue('📂 Saída:'), diretorio);

    } catch (erro) {
      trataErros(erro);
    }
  });
}

// ===============================
// 🔹 Cria diretório e salva o arquivo com o nome resultado.txt
// ===============================
async function criaESalvaArquivo(listaPalavras, endereco) {

  const arquivoNovo = `${endereco}/resultado.txt`;
  const textoFinal = montaSaidaArquivo(listaPalavras);

  try {
    await fs.promises.mkdir(endereco, { recursive: true });
    await fs.promises.writeFile(arquivoNovo, textoFinal, 'utf-8');

    console.log(chalk.green('📄 Resultado salvo em:'), chalk.blue(arquivoNovo));

  } catch (erro) {
    console.error(chalk.red('❌ Erro ao criar o arquivo:'), erro);
    throw erro;
  }
}
