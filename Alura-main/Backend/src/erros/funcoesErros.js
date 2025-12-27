import chalk from 'chalk';
export default function trataErros(erro) {
  if (erro.code === 'ENOENT') {
    console.error(chalk.red('❌ Arquivo não encontrado'), erro.path);
  } else {
    console.error(chalk.red('❌ Erro na aplicação:'), erro.message);
  }
}