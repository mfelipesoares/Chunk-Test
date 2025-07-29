import express from 'express';
import path from 'path';

const app = express();
const PORT = 3000;

// Serve arquivos estáticos da raiz do projeto
app.use(express.static(path.resolve('./')));

// Serve especificamente a pasta chunks
app.use('/chunks', express.static(path.resolve('./chunks')));

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.resolve('./index.html'));
});

// Middleware para lidar com CORS se necessário
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});