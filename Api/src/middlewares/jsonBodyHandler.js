export async function jsonBodyHandler(request, response) {
     // Criamos uma lista vazia para guardar os pedaços de dados que chegam da requisição, porque os dados podem vir em partes.
    const buffers = []
    // Usamos um loop especial que espera cada pedaço (chunk) de dados chegar.
    for await (const chunk of request) {
      // Adicionamos cada pedaço à nossa lista.
      buffers.push(chunk)
    }
    try {
        //concatena os chunks e converte para string,Em seguida, converte a string para um objeto JSON..
        request.body = JSON.parse(Buffer.concat(buffers).toString())
    }
        catch (error) {
            request.body = null
        }
    
    // Define o cabeçalho da resposta para indicar que o conteúdo é JSON
    response.setHeader("Content-Type", "application/json")

}