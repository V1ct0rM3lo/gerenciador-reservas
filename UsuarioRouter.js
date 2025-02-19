const fs = require('fs');
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({extended: true});
const express = require('express');
const app = express();

const admin = require("./firebase");
const db = admin.database();

function criarTabela(dados){
    let tabela = `<table class="table table-striped zebrado">
    <thead>
        <tr>
        <th>Nome do Usuario</th>
        <th>E-mail</th>
        <th>Data de Nascimento</th>
        <th>Telefone</th>
        <th></th>
        <th></th>
        </tr>
    </thead>
    <tbody>`
     for(let chave in dados){
        const ano = dados[chave].DataNascimento.substring(0, 4);
        const mes = dados[chave].DataNascimento.substring(5, 7);
        const dia = dados[chave].DataNascimento.substring(8, 10);
        if(dados[chave].status == "true") {
            tabela+= `<tr>
                <td>${dados[chave].nome}</td>
                <td>${dados[chave].email}</td>
                <td>${dia}/${mes}/${ano}</td>
                <td>${dados[chave].telefone}</td>
                <td>
                    <a class="btn btn-outline-warning" href="/usuario/editar/${chave}">Alterar</a>
                </td>
                <td>
                    <a class="btn btn-outline-danger" href="/usuario/excluir/${chave}">Excluir</a>
                </td>
            </tr>`
        }
     }
     tabela +=`
     </tbody>
    </table>`
     return tabela;
        
}

// Rota da página que exibe os usuario registrados no banco de dados
app.get('/', (req, res) => {
    fs.readFile('src/cabecalho.html', (e, cabecalho) => {
        fs.readFile('src/rodape.html', (e, rodape) => {
            fs.readFile('src/usuario/usuario.html', (e, dados) => {
                cabecalho = cabecalho.toString().replace("{usuario}", req.session.authName)
                console.log();
                let tabela ="";
                let mensagem="";
                const docusuario = db.ref("usuario");
                docusuario.once("value",function(snapshot){
                    tabela = criarTabela(snapshot.val());
                    dados = dados.toString().replace("{tabela}", tabela)
                    if(req.query.acao){
                        let acao = req.query.acao;
                        if(req.query.status){
                            let status = req.query.status;
                            // IF DO INSERIR
                            if(acao == "inserir" && status == "true")
                            mensagem = "usuario inserido com sucesso ";
                            if(acao == "inserir" && status == "false")
                            mensagem = "Erro ao inserir usuario!"
                            // IF DO EDITAR 
                            if(acao == "editar" && status == "true")
                            mensagem = "usuario editado com sucesso ";
                            if(acao == "editar" && status == "false")
                            mensagem = "Erro ao editado usuario!"
                            // IF DO EXCLUIR
                            if(acao == "excluir" && status == "true")
                            mensagem = "usuario excluido com sucesso ";
                            if(acao == "excluir" && status == "false")
                            mensagem = "Erro ao excluido usuario!"
                        }
                    }
                    dados = dados.toString().replace("{mensagem}", mensagem);
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write(cabecalho + dados + rodape);
                    res.end();
                });
            });
            });
        });
    });


// Rota da página para abrir formulário para inserir um novo registro 
app.get('/novo', (req, res) => {
    fs.readFile('src/cabecalho.html', (e, cabecalho) => {
        fs.readFile('src/rodape.html', (e, rodape) => {
            fs.readFile('src/usuario/novo_usuario.html', (e, dados) => {
                cabecalho = cabecalho.toString().replace("{usuario}", req.session.authName)
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(cabecalho + dados + rodape);
                res.end();
            });
        });
    });
});

// Rota da página inserir um novo registro 
app.post('/novo', urlencodedParser, (req, res) => {
                try{
                    const docusuario = db.ref("usuario").push();
                    const usuario = {
                        nome: req.body.nome,
                        email: req.body.email,
                        DataNascimento: req.body.DataNascimento,
                        telefone: req.body.telefone,
                        status: "true"
                    };
                    docusuario.set(usuario);
                    res.redirect("/usuario/?acao=inserir&status=true");
                }catch(e){
                    console.log(e);
                    res.redirect("/usuario/?acao=inserir&status=false");
                }
});

// Rota da página para abrir formuário para editar os dados de um registro 
app.get('/editar/:id', (req, res) => {
    fs.readFile('src/cabecalho.html', (e, cabecalho) => {
        fs.readFile('src/rodape.html', (e, rodape) => {
            fs.readFile('src/usuario/editar_usuario.html', (e, dados) => {
                cabecalho = cabecalho.toString().replace("{usuario}", req.session.authName)
                let id = req.params.id;
                const docusuario = db.ref("usuario/"+id);
                docusuario.once("value", function(snapshot){
                    let nome = snapshot.val().nome;
                    let email = snapshot.val().email;
                    let DataNascimento = snapshot.val().DataNascimento;
                    let telefone = snapshot.val().telefone;
                    dados = dados.toString().replace("{nome}",nome);
                    dados = dados.toString().replace("{email}",email);
                    dados = dados.toString().replace("{DataNascimento}",DataNascimento);
                    dados = dados.toString().replace("{telefone}",telefone);
                    dados = dados.toString().replace("{id}",id);
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write(cabecalho + dados + rodape);
                    res.end();
                });
            });
        });
    });
});

// Rota da página para editar os dados de um registro 
app.post('/editar', urlencodedParser, (req, res) => {
    try{
                let id = req.body.id;
                let nome = req.body.nome;
                let email = req.body.email;
                let DataNascimento = req.body.DataNascimento;
                let telefone = req.body.telefone;
                let docusuario = db.ref("usuario/");
                docusuario.child(id).update(
                {
                    'nome' : nome,
                    'email' : email,
                    'DataNascimento' : DataNascimento,
                    'telefone' : telefone,
                    
                }
            );
            res.redirect("/usuario/?acao=editar&status=true");
        } catch (e){
            console.log(e);
            res.redirect("/usuario/?acao=editar&status=false");
        }
    });

// Rota da página para abrir formulário para excluir um registro 
app.get('/excluir/:id', (req, res) => {
    fs.readFile('src/cabecalho.html', (e, cabecalho) => {
        fs.readFile('src/rodape.html', (e, rodape) => {
            fs.readFile('src/usuario/excluir_usuario.html', (e, dados) => {
                cabecalho = cabecalho.toString().replace("{usuario}", req.session.authName)
                let id = req.params.id;
                const docusuario = db.ref("usuario/"+id);
                docusuario.once("value", function(snapshot){
                    let nome = snapshot.val().nome;
                    let email = snapshot.val().email;
                    let DataNascimento = snapshot.val().DataNascimento;
                    let telefone = snapshot.val().telefone;
                    dados = dados.toString().replace("{nome}",nome);
                    dados = dados.toString().replace("{email}",email);
                    dados = dados.toString().replace("{Datanascimento}",DataNascimento);
                    dados = dados.toString().replace("{telefone}",telefone);
                    dados = dados.toString().replace("{id}",id);
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write(cabecalho + dados + rodape);
                    res.end();
                });
            });
        });
    });
});

// Rota da página para excluir um registro 
app.post('/excluir', urlencodedParser, (req, res) => {
    try{
    let id = req.body.id;
    let docusuario = db.ref("usuario/");
    docusuario.child(id).update(
    {
       'status' : "false"
    });
    res.redirect("/usuario/?acao=excluir&status=true");
    }catch(e){
        console.log(e);
        res.redirect("/usuario/?acao=excluir&status=false");
    }
});

module.exports = app;