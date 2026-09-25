// ============================================================
// API do Diario de Treinos
// Back-End I - CEEP Pedro Boaretto Neto
// ============================================================
// Este arquivo esta quase vazio DE PROPOSITO.
// Hoje voce vai escrever as rotas, uma de cada vez, conferindo
// no testes.http se cada uma responde o status certo.
// O que cada rota deve fazer esta no README.md.
// ============================================================

const express = require('express');
const { DatabaseSync } = require('node:sqlite');

const app = express();

app.use(express.json());

// Conecta ao banco (cria o arquivo treinos.db se nao existir)
const db = new DatabaseSync('treinos.db');

// Garante que a tabela existe
db.exec(`
    CREATE TABLE IF NOT EXISTS treinos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    duracao INTEGER NOT NULL
)
`);

// ------------------------------------------------------------
// Os dados moram aqui, na memoria. Somem quando o servidor cai.
// (Na Aula 03 isso vira banco de dados.)
// ------------------------------------------------------------
const treinos = [];
let proximoId = 1;

// ------------------------------------------------------------
// Validacao
// Escreva a funcao validarTreino(corpo), que devolve a mensagem
// de erro quando algo esta errado, ou null quando esta tudo certo.
// ------------------------------------------------------------

function validarTreino(corpo) {
    if(typeof corpo.nome !== 'string' || corpo.nome == '') {
        return "O campo nome eh obrigatorio e deve ser um texto"
    }
    
    if(typeof corpo.duracao !== 'number' || corpo.duracao <= 0) {
        return "o campo duracao eh obrigatorio e deve ser um numero maior que zero"
    }
    return null;
}

// ------------------------------------------------------------
// GET /treinos - lista todos os treinos
// Aceita ?busca=texto e devolve so os treinos cujo nome contem
// esse texto (LIKE). O % vai no valor, nunca dentro do SQL.
// ------------------------------------------------------------

app.get('/treinos', (req, res) => {
    const { busca } = req.query;

    if (busca) {
        const treinos = db
            .prepare('SELECT * FROM treinos WHERE nome LIKE ?')
            .all(`%${busca}%`);
        return res.status(200).json(treinos);
    }

    const treinos = db.prepare('SELECT * FROM treinos').all();
    res.status(200).json(treinos);
});

// ------------------------------------------------------------
// GET /treinos/resumo - total, minutos e media numa consulta so
// Precisa vir ANTES de /treinos/:id, senao "resumo" seria
// interpretado como um id.
// ------------------------------------------------------------

app.get('/treinos/resumo', (req, res) => {
    const resumo = db
        .prepare('SELECT COUNT(*) AS total, SUM(duracao) AS minutos, AVG(duracao) AS media FROM treinos')
        .get();

    res.status(200).json({
        total: resumo.total,
        minutos: resumo.minutos ?? 0,
        media: resumo.media ?? 0
    });
});

// ------------------------------------------------------------
// GET /treinos/:id - busca um treino pelo id (404 se nao existir)
// 400 se o id nao for um numero inteiro
// ------------------------------------------------------------

app.get('/treinos/:id', (req, res) => {
    if (!Number.isInteger(Number(req.params.id))) {
        return res.status(400).json({ erro: 'Id invalido. Deve ser um numero inteiro.' });
    }

    const id = Number(req.params.id);
    const treino = db.prepare('SELECT * FROM treinos WHERE id = ?').get(id);
    
    if (treino === undefined) {
        return res.status(404).json({ erro: 'Treino nao encontrado.' });
    }
    
    res.status(200).json(treino);
});

// ------------------------------------------------------------
// POST /treinos - cria um treino (400 se os dados forem invalidos)
// ------------------------------------------------------------

app.post('/treinos', (req, res) => {
    const erro = validarTreino(req.body);
    if (erro !== null){
        return res.status(400).json({ erro: erro });
    }

    // Insere no banco
    const resultado = db
        .prepare('INSERT INTO treinos (nome, duracao) VALUES (?, ?)')
        .run(req.body.nome, req.body.duracao);

    // Busca o treino recem-criado para devolver com o id gerado
    const novo = db
        .prepare('SELECT * FROM treinos WHERE id = ?')
        .get(resultado.lastInsertRowid);

    res.status(201).json(novo);
});

// ------------------------------------------------------------
// PUT /treinos/:id - substitui um treino
// ------------------------------------------------------------


app.put('/treinos/:id', (req, res) => {
    const id = Number(req.params.id);
    
    const treino = db.prepare('SELECT * FROM treinos WHERE id = ?').get(id);
    if (treino === undefined) {
        return res.status(404).json({ erro: 'Treino nao encontrado.' });
    }
    
    const erro = validarTreino(req.body);
    if (erro !== null){
        return res.status(400).json({ erro: erro });
    }
    
    db.prepare('UPDATE treinos SET nome = ?, duracao = ? WHERE id = ?')
        .run(req.body.nome, req.body.duracao, id);
        const atualizado = db.prepare('SELECT * FROM treinos WHERE id = ?').get(id);
    
    res.status(200).json(atualizado);
});

// ------------------------------------------------------------
// DELETE /treinos/:id - remove um treino
// ------------------------------------------------------------

app.delete('/treinos/:id', (req, res) => {
    const id = Number(req.params.id);
    
    const treino = db.prepare('SELECT * FROM treinos WHERE id = ?').get(id);
    if (treino === undefined) {
        return res.status(404).json({ erro: 'Treino nao encontrado.' });
    }

    db.prepare('DELETE FROM treinos WHERE id = ?').run(id);
    
    res.status(204).end();
});

// ------------------------------------------------------------
const PORTA = 3000;
app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
});
