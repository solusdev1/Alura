import React from 'react'

function TestApp() {
  return (
    <div style={{ padding: '50px', background: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
      <h1>✅ Frontend Carregando!</h1>
      <p>Se você vê esta mensagem, o React está funcionando.</p>
      <p>Porta: {window.location.port}</p>
      <p>URL: {window.location.href}</p>
      <button onClick={() => alert('React funcionando!')}>Testar Clique</button>
    </div>
  )
}

export default TestApp
