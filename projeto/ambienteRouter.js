const fs = require('fs');
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: true });
const express = require('express');
const app = express();

const admin = require("./firebase");
const db = admin.database();



function criarTabela(dados) {
    let tabela = `<table class="table table-striped hover">
    <thead>
        <tr>
        <th>Ambiente</th>
        <th></th>
        </tr>
    </thead>
    <tbody class='tabela-corpo-ambientes' id='tabela-corpo-ambientes'>`;
    
    for (let chave in dados) {
        tabela += `<tr data-id="${chave}">
            <td class="nome-ambiente">${dados[chave].descricao}</td>
            <td>
            <a class="btn btn-outline-warning btn-alterar" data-id="${chave}" href="#">Alterar</a>
            </td>
        </tr>`;
    }
    
    tabela += `</tbody></table>`;
    return tabela;
}


// Rota da página que exibe os professore registrados no banco de dados
app.get('/', (req, res) => {
    fs.readFile('src/cabecalho.html', (e, cabecalho) => {
        fs.readFile('src/rodape.html', (e, rodape) => {
            fs.readFile('src/ambientes/ambiente.html', (e, dados) => {
                cabecalho = cabecalho.toString().replace("{usuario}", req.session.authName)
                let tabela ="";
                const docAmbiente = db.ref("ambiente");
                docAmbiente.once("value",function(snapshot){
                    tabela = criarTabela(snapshot.val());
                    console.log(snapshot.val());
                    dados = dados.toString().replace("{tabela}", tabela)
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write(cabecalho + dados + rodape);
                    res.end();
                });
            });
            });
        });
    });

app.get('/novo/', async (req,res) =>{
    const docAmbiente = db.ref("ambiente").push();
    const ambiente = {
        descricao: req.query.nome
    };
    docAmbiente.set(ambiente);
    res.json({id : docAmbiente.key });
});
/*
app.get('/ambiente', async(req, res) => {
    const docAmbiente = db.ref("livros");
    await docAmbiente.once("value", function(snapshot){
        const ambiente = snapshot.val();
        return res.json(ambiente);
    })
});*/

app.get("/ambiente/:id",async (req,res) => {
    let ambiente = req.params.id;
    const docAmbiente = db.ref("ambiente/"+ambiente);
    await docAmbiente.once("value",function(snapshot){
        ambiente = snapshot.val();
        res.json(ambiente);
    });
});

app.get('/ambiente-alterar/:id', async (req, res) => {
    const ambienteId = req.params.id;
    try {
        // Obter o ambiente
        const docAmbiente = db.ref("ambiente/" + ambienteId);
        const ambienteSnapshot = await docAmbiente.once("value");
        const ambiente = ambienteSnapshot.val();

        // Obter os equipamentos associados ao ambiente
        const equipamentosSnapshot = await db.ref("ambiente/" + ambienteId + "/equipamento").once("value");
        const equipamentos = equipamentosSnapshot.val();

        // Se houver equipamentos, criamos um array com as chaves e valores
        const equipamentosComKeys = equipamentos ? Object.entries(equipamentos).map(([key, valor]) => ({
            key, // A chave do equipamento
            ...valor // Dados do equipamento
        })) : [];

        // Retornar os dados
        res.json({ nome: ambiente.descricao, equipamentos: equipamentosComKeys });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar ambiente' });
    }
});



// Rota para alterar ambiente
app.post('/ambiente/alterar/:id', async (req, res) => {
    const ambienteId = req.params.id;
    const novaDescricao = req.body.descricao; // Assume que você enviará a descrição nova no corpo da requisição

    try {
        const docAmbiente = db.ref("ambiente/" + ambienteId);
        await docAmbiente.update({ descricao: novaDescricao });
        res.json({ sucesso: true });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao alterar ambiente' });
    }
});

app.post('/ambiente-alterar-nome/:id/:nome', async (req, res) => {
    const ambienteId = req.params.id;
    const nome = req.params.nome;

    try {
        const docAmbiente = db.ref("ambiente/" + ambienteId);
        await docAmbiente.update({ descricao: nome });
        res.json({ sucesso: true });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao atualizar ambiente' });
    }
});


app.get('/addEquipamento/:AmbienteId/:NomeEquipamento', async (req,res) =>{
    let NomeEquipamento = req.params.NomeEquipamento;
    let AmbienteId = req.params.AmbienteId;
    const docAmbiente = db.ref("ambiente/"+AmbienteId+"/equipamento").push();
    const ambiente = {
        descricao: NomeEquipamento
    };
    docAmbiente.set(ambiente);
    res.json({sucesso: true, id : docAmbiente.key });
});



app.get("/excluirEquipamento/:AmbienteId/:EquipamentoId", async (req, res) => {
    let EquipamentoId = req.params.EquipamentoId;
    let AmbienteId = req.params.AmbienteId;
    try {
        const docAmbiente = db.ref("ambiente/" + AmbienteId + "/equipamento/" + EquipamentoId);
        await docAmbiente.remove();
        res.json({ sucesso: true });
    } catch (error) {
        res.json({ sucesso: false, erro: error.message });
    }
});



app.get('/ambiente/editar/:id', (req, res) => {
    const ambienteId = req.params.id;
    fs.readFile('src/cabecalho.html', (e, cabecalho) => {
        fs.readFile('src/rodape.html', (e, rodape) => {
            fs.readFile('src/Ambientes/editar_ambiente.html', (e, dados) => { // Verifique se o caminho está correto
                const docAmbiente = db.ref("ambiente/" + ambienteId);
                docAmbiente.once("value", function(snapshot) {
                    const ambiente = snapshot.val();
                    dados = dados.toString().replace("{nome_ambiente}", ambiente.descricao); // Substitui o nome no template
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write(cabecalho + dados + rodape);
                    res.end();
                });
            });
        });
    });
});



module.exports = app;