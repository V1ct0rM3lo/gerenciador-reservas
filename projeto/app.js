const fs = require('fs');
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: true });
const express = require('express');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Importando o bcrypt para comparação segura de senhas
const app = express();
const port = 5000;

app.use(session({
    'secret': 'adosaipoda9989ahu8uijjsd', // Altere para uma chave mais segura em produção
    'resave': false,
    'saveUninitialized': true,
    'cookie': {
        secure: process.env.NODE_ENV === 'production', // Habilita cookie seguro em produção
        httpOnly: true,  // Impede acesso ao cookie via JavaScript
    }
}));

const admin = require("./firebase");
const db = admin.database();

// Função para verificar o token JWT
async function verificaToken(req, res, next) {
    const token = req.session.authToken; // Obtém o token da sessão
    if (!token) {
        return res.redirect('/'); // Redireciona para a página de login se não houver token
    }
    try {
        const decoded = jwt.verify(token, '7UIT6¨7&8H*jshh'); // Altere para seu segredo
        req.user = decoded; // Armazena os dados do usuário decodificado na requisição
        next(); // Chama o próximo middleware
    } catch (err) {
        // Token inválido, removendo a sessão e redirecionando para login
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).send("Erro ao destruir sessão.");
            }
            return res.redirect('/'); // Redireciona para a página de login
        });
    }
}

// Função para verificar se o usuário é administrador
async function verificaAdmin(req, res, next) {
    if (req.user.nivel !== "Administrador") {
        return res.redirect('/'); // Redireciona para a página inicial ou de login
    }
    next();
}

// Rota da página de formulário de login
app.get('/', (req, res) => {
    fs.readFile('src/login.html', (e, dados) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(dados);
        res.end();
    });
});

// Rota da página principal
app.post('/login', urlencodedParser, async (req, res) => {
    const { email, senha } = req.body;

    // Consulta ao banco de dados Firebase para verificar se o usuário existe
    const snapshot = await db.ref('usuario').orderByChild('email').equalTo(email).once('value');
    const usuario = snapshot.val();

    if (usuario) {
        const usuarioId = Object.keys(usuario)[0];
        const usuarioDados = usuario[usuarioId];
        if (usuarioDados.DataNascimento === senha) {
            // Gera o token JWT com nível de usuário
            const token = jwt.sign({ id: usuarioId, nivel: usuarioDados.nivel }, '7UIT6¨7&8H*jshh', { expiresIn: '1h' });
            req.session.authToken = token; // Armazena o token na sessão
            req.session.authId = usuarioId; // Armazena o id na sessão
            req.session.authName = usuarioDados.nome; // Armazena o Nome na sessão
            if (usuarioDados.nivel == "Administrador")
                res.redirect("/home-adm");
            else
                res.redirect("/home");
        } else {
            res.redirect("/?error=senha_incorreta");
        }
    } else {
        res.redirect("/?error=usuario_nao_encontrado");
    }
});

// Rota de logout
app.get('/sair', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Erro ao destruir sessão.');
        }
        res.redirect('/'); // Redireciona para a página de login
    });
});

// Rota da página inicial - Admin
app.get('/home-adm', verificaToken, verificaAdmin, (req, res) => {
    fs.readFile('src/cabecalho.html', (e, cabecalho) => {
        fs.readFile('src/rodape.html', (e, rodape) => {
            fs.readFile('src/index_adm.html', (e, dados) => {
                cabecalho = cabecalho.toString().replace("{usuario}", req.session.authName);
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.write(cabecalho + dados + rodape);
                res.end();
            });
        });
    });
});

// Rota da página inicial - Usuário comum
app.get('/home', verificaToken, (req, res) => {
    fs.readFile('src/cabecalho_usu.html', (e, cabecalho) => {
        fs.readFile('src/rodape.html', (e, rodape) => {
            fs.readFile('src/index.html', (e, dados) => {
                cabecalho = cabecalho.toString().replace("{usuario}", req.session.authName);
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.write(cabecalho + dados + rodape);
                res.end();
            });
        });
    });
});

// Rota das reservas (protegida por token)
app.get('/reserva-usu', verificaToken, async (req, res) => {
    const snapshot = await db.ref('confirmacao').once('value');
    const reservas = [];
    snapshot.forEach((childSnapshot) => {
        const reserva = childSnapshot.val();
        if (reserva.nome === req.session.authName) {
            reservas.push({
                ambiente: reserva.ambiente,
                nome: reserva.nome,
                data: reserva.data,
                horario_inicio: reserva.horario_inicio,
                horario_fim: reserva.horario_fim,
                status: reserva.status
            });
        }
    });
    res.json(reservas);
});

// Rota das reservas (protegida por token)
app.get('/reservas', verificaToken, async (req, res) => {
    const snapshot = await db.ref('confirmacao').once('value');
    const reservas = [];
    snapshot.forEach((childSnapshot) => {
        const reserva = childSnapshot.val();
            reservas.push({
                ambiente: reserva.ambiente,
                nome: reserva.nome,
                data: reserva.data,
                horario_inicio: reserva.horario_inicio,
                horario_fim: reserva.horario_fim,
                status: reserva.status
            });
    });
    res.json(reservas);
});

// Rota das reservas (protegida por token)
app.get('/reserva/:key', verificaToken, async (req, res) => {
    const key = req.params.key;  // A chave da reserva passada na URL
    const reservaRef = db.ref('confirmacao/' + key);  // Acessa a reserva pela chave

    try {
        const snapshot = await reservaRef.once('value');  // Pega a reserva única
        const reserva = snapshot.val();  // Valor da reserva

        if (reserva) {
                res.json({
                    ambiente: reserva.ambiente,
                    nome: reserva.nome,
                    data: reserva.data,
                    horario_inicio: reserva.horario_inicio,
                    horario_fim: reserva.horario_fim,
                    status: reserva.status
                });
        } else {
            res.status(404).json({ error: 'Reserva não encontrada' });
        }
    } catch (error) {
        console.error('Erro ao buscar reserva:', error);
        res.status(500).json({ error: 'Erro ao buscar a reserva' });
    }
});



// Rota de relatórios
app.get('/relatorios', verificaToken, (req, res) => {
    fs.readFile('src/cabecalho.html', (err, cabecalho) => {
        cabecalho = cabecalho.toString().replace("{usuario}", req.session.authName);
        if (err) {
            res.status(500).send('Erro ao carregar o cabeçalho.');
            return;
        }
        fs.readFile('src/rodape.html', (err, rodape) => {
            if (err) {
                res.status(500).send('Erro ao carregar o rodapé.');
                return;
            }
            fs.readFile('src/Relatorios/relatorio.html', (err, dados) => {
                if (err) {
                    res.status(500).send('Erro ao carregar a página de relatórios.');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.write(cabecalho + dados + rodape);
                res.end();
            });
        });
    });
});

// Importando rotas adicionais
const usuarioRouter = require("./UsuarioRouter");
app.use("/usuario", verificaToken, usuarioRouter);

const ambienteRouter = require("./ambienteRouter");
app.use("/ambiente", verificaToken, ambienteRouter);

const confirmacaoRouter = require("./confirmacaoRouter");
app.use("/confirmacao", verificaToken, confirmacaoRouter);

// Rota do relatório
app.get('/relatorio', verificaToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'Relatorios', 'relatorio.html'));
});

// Inicia o servidor
app.listen(port, () => {
    console.log('Servidor iniciado na porta ' + port);
});