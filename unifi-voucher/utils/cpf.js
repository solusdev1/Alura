/**
 * Valida se um CPF é válido
 * @param {string} cpf - CPF com ou sem formatação
 * @returns {boolean} - true se CPF é válido, false caso contrário
 */
function validarCPF(cpf) {
  // Remove caracteres especiais
  cpf = cpf.replace(/[^\d]/g, '');

  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) {
    return false;
  }

  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  // Calcula primeiro dígito verificador
  let soma = 0;
  let multiplicador = 10;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf[i]) * multiplicador;
    multiplicador--;
  }

  let resto = soma % 11;
  let primeiroDigito = resto < 2 ? 0 : 11 - resto;

  // Valida primeiro dígito verificador
  if (parseInt(cpf[9]) !== primeiroDigito) {
    return false;
  }

  // Calcula segundo dígito verificador
  soma = 0;
  multiplicador = 11;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf[i]) * multiplicador;
    multiplicador--;
  }

  resto = soma % 11;
  let segundoDigito = resto < 2 ? 0 : 11 - resto;

  // Valida segundo dígito verificador
  if (parseInt(cpf[10]) !== segundoDigito) {
    return false;
  }

  return true;
}

module.exports = { validarCPF };
