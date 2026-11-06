const service = require('../services/authService.js');
const sessoes = require('../sessoes.js');
const usuariosRepository = require('../repositories/usuariosRepository.js');

function lerToken(req) {
    const cab = req.headers.authorization || '';
    return cab.startsWith('Bearer ') ? cab.slice(7) : undefined;
}

function login(req, res) {
    const { usuario, senha } = req.body || {};
    const resultado = service.login(usuario, senha);
    if (resultado.invalido) {
        return res.status(401).json({ erro: 'Usuario ou senha invalidos.' });
    }
    const token = sessoes.criar(resultado.usuario.id);
    res.status(200).json({ token, usuario: resultado.usuario });
}

function perfil(req, res) {
    const id = sessoes.usuarioIdDaSessao(lerToken(req));
    if (id === undefined) {
        return res.status(401).json({ erro: 'Nao autenticado.' });
    }
    res.status(200).json(usuariosRepository.buscarPorId(id));
}

function logout(req, res) {
    sessoes.encerrar(lerToken(req));
    res.status(204).end();
}

module.exports = { login, perfil, logout };