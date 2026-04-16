/**
 * Formata data para horário de Brasília (America/Sao_Paulo)
 * @param {Date|string|number} date - Data para formatar
 * @returns {object} - {data, hora, completo}
 */
function formatarDataBrasil(date) {
  // Converter para Date object
  if (typeof date === 'number') {
    // Se for número, pode ser timestamp em segundos ou milissegundos
    if (date < 10000000000) {
      // Provavelmente segundos (Unix timestamp)
      date = new Date(date * 1000);
    } else {
      // Provavelmente milissegundos
      date = new Date(date);
    }
  } else if (typeof date === 'string') {
    // Se for string, avaliar o formato
    if (date.includes('T') && (date.includes('Z') || date.includes('+') || date.includes('-'))) {
      // ISO format com timezone info
      date = new Date(date);
    } else if (date.includes('-') && date.includes(':')) {
      // Formato "YYYY-MM-DD HH:MM:SS" sem timezone - tratar como UTC
      // Adicionar Z para indicar UTC
      date = new Date(date + 'Z');
    } else {
      // Tentar parsing direto
      date = new Date(date);
    }
  } else if (!(date instanceof Date)) {
    // Se não for Date, tentar converter
    date = new Date(date);
  }

  // Garantir que é uma Data válida
  if (isNaN(date.getTime())) {
    return {
      data: 'N/A',
      hora: 'N/A',
      completo: 'Data inválida',
      iso: ''
    };
  }

  // Converter para horário de Brasília (America/Sao_Paulo = UTC-3 or UTC-2)
  const options = {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };

  const formatter = new Intl.DateTimeFormat('pt-BR', options);
  const parts = formatter.formatToParts(date);

  const resultado = {};
  parts.forEach(part => {
    if (part.type !== 'literal') {
      resultado[part.type] = part.value;
    }
  });

  const dataStr = `${resultado.day}/${resultado.month}/${resultado.year}`;
  const horaStr = `${resultado.hour}:${resultado.minute}:${resultado.second}`;
  
  return {
    data: dataStr,
    hora: horaStr,
    completo: `${dataStr} ${horaStr}`,
    iso: date.toISOString()
  };
}

/**
 * Converte data UTC para horário de Brasília (timestamp útil para comparações)
 * @param {Date} date - Data UTC
 * @returns {Date} - Data ajustada para Brasil
 */
function ajustarToBrasil(date) {
  if (typeof date === 'string') {
    date = new Date(date);
  }

  // Brasília é UTC-3 (ou UTC-2 em horário de verão)
  // Mas vamos usar Intl para ser preciso
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const partes = formatter.format(date).split(/[\/\s:]/);
  return new Date(`${partes[2]}-${partes[1]}-${partes[0]}T${partes[3]}:${partes[4]}:${partes[5]}`);
}

/**
 * Get hora atual de Brasil
 * @returns {object} - {data, hora, completo}
 */
function agora() {
  return formatarDataBrasil(new Date());
}

module.exports = {
  formatarDataBrasil,
  ajustarToBrasil,
  agora
};
