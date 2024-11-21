const fs = require('fs');
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: true });
const express = require('express');
const app = express();

const admin = require("./firebase");
const db = admin.database();

function criarTabela(dados) {
    let tabela = `<table class="table table-striped zebrado">
                    <thead>
                        <tr>
                            <th>Nome do Solicitante</th>
                            <th>Ambiente</th>
                            <th>Data</th>
                            <th>Horário inicio</th>
                            <th>Horário fim</th>
                            <th></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>`;
    for (let chave in dados) {
        var botaoAnalisar = !dados[chave].status ? `<a class="btn btn-outline-warning" href="/confirmacao/analisar/${chave}">Analisar</a>` : "";
        const ano = dados[chave].data.substring(0, 4);
        const mes = dados[chave].data.substring(5, 7);
        const dia = dados[chave].data.substring(8, 10);

        tabela += `<tr>
                        <td>${dados[chave].nome}</td>
                        <td>${dados[chave].ambiente}</td>
                        <td>${dia}/${mes}/${ano}</td>
                        <td>${dados[chave].horario_inicio}</td>
                        <td>${dados[chave].horario_fim}</td>
                        <td>
                             ${botaoAnalisar}
                        </td>
                        
                       
                    </tr>`;
    }            
    tabela += `</tbody >
            </table > `;
    return tabela;
}
function criarTabelaUsu(dados) {
    let tabela = `<table class="table table-striped zebrado">
                    <thead>
                        <tr>
                            <th>Nome do Solicitante</th>
                            <th>Ambiente</th>
                            <th>Data</th>
                            <th>Horário inicio</th>
                            <th>Horário fim</th>
                            <th></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>`;
    for (let chave in dados) {
        const ano = dados[chave].data.substring(0, 4);
        const mes = dados[chave].data.substring(5, 7);
        const dia = dados[chave].data.substring(8, 10);
        tabela += `<tr>
                        <td>${dados[chave].nome}</td>
                        <td>${dados[chave].ambiente}</td>
                        <td>${dia}/${mes}/${ano}</td>
                        <td>${dados[chave].horario_inicio}</td>
                        <td>${dados[chave].horario_fim}</td>
                        <td>
                             ${dados[chave].status ? "Aceito" : "Aguardando Análise"} 
                        </td>
                        
                       
                    </tr>`;
    }            
    tabela += `</tbody >
            </table > `;
    return tabela;
}

app.get('/', (req, res) => {
    fs.readFile('src/cabecalho.html', (e, cabecalho) => {
        fs.readFile('src/rodape.html', (e, rodape) => {
            fs.readFile('src/confirmacao/confirmacao.html', (e, dados) => {
                cabecalho = cabecalho.toString().replace("{usuario}", req.session.authName)
                let tabela = "";
                let mensagem = "";
                const docConfirmacao = db.ref("confirmacao");
                docConfirmacao.once("value", function(snapshot){
                    tabela = criarTabela(snapshot.val());
                    dados = dados.toString().replace("{tabela}", tabela);
                    if (req.query.acao){
                        let acao = req.query.acao;
                        if (req.query.status){
                            let status = req.query.status;
                            if (acao == "inserir" && status == "true")
                                mensagem = "Solicitação inserido com sucesso!";
                            else if (acao == "inserir" && status == "false")
                                mensagem = "Erro ao inserir Solicitação!";
                            else if (acao == "aceitar" && status == "true")
                                mensagem = "Solicitação aceitada com sucesso!";
                            else if (acao == "aceitar" && status == "false")
                                mensagem = "Erro ao aceitar a Solicitação!";
                            else if (acao == "excluir" && status == "true")
                                mensagem = "Solicitação excluída com sucesso!";
                            else if (acao == "excluir" && status == "false")
                                mensagem = "Erro ao excluir Solicitação!";
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

//1
app.get('/novo', (req, res) => {
    fs.readFile('src/cabecalho.html', (e, cabecalho) => {
        fs.readFile('src/rodape.html', (e, rodape) => {
            fs.readFile('src/confirmacao/nova_confirmacao.html', (e, dados) => {
                cabecalho = cabecalho.toString().replace("{usuario}", req.session.authName)
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(cabecalho + dados + rodape);
                res.end();
            });
        });
    });
});

app.get('/novo-usuario', (req, res) => {
    fs.readFile('src/cabecalho_usu.html', (e, cabecalho) => {
        cabecalho = cabecalho.toString().replace("{usuario}", req.session.authName)
        fs.readFile('src/rodape.html', (e, rodape) => {
            fs.readFile('src/confirmacao/nova_confirmacao_usu.html', (e, dados) => {
                dados = dados.toString().replace("{usuario}", req.session.authName)
                dados = dados.toString().replace("{usuario}", req.session.authName)
                let ambientes = [];

                const docAmbiente = db.ref("ambiente");
                docAmbiente.once("value", function(snapshot) {
                    // Aqui, pegamos os dados dos ambientes do Firebase
                    const ambientesData = snapshot.val();

                    // Armazenamos os ambientes em uma variável JavaScript
                    for (let chave in ambientesData) {
                        ambientes.push({
                            id: chave,
                            nome: ambientesData[chave].descricao,
                            equipamentos: ambientesData[chave].equipamento || [] // Equipamentos podem ser um array
                        });
                    }

                    // Passamos a variável ambientes para o template HTML
                    dados = dados.toString().replace("{ambientes_json}", JSON.stringify(ambientes));
                    
                    // Agora renderizamos o HTML com os dados já substituídos
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write(cabecalho + dados + rodape);
                    res.end();
                });
            });
        });
    });
});

//2
app.post('/novo', urlencodedParser, (req, res) => {
    try{
        const docConfirmacao = db.ref("confirmacao").push();
        const confirmacao = {
            nome: req.body.nome,
            ambiente: req.body.ambiente,
            data: req.body.data,
            horario_inicio: req.body.horario_inicio,
            horario_fim: req.body.horario_fim,
            status: true
        };
        docConfirmacao.set(confirmacao);
        res.redirect("/confirmacao/?acao=inserir&status=true");
    }catch(e){
        console.log(e);
        res.redirect("/confirmacao/?acao=inserir&status=false");
    }
});

app.post('/novo-usuario', urlencodedParser, (req, res) => {
    try{
        const docConfirmacao = db.ref("confirmacao").push();
        const confirmacao = {
            nome: req.body.nome,
            ambiente: req.body.ambiente,
            data: req.body.data,
            horario_inicio: req.body.horario_inicio,
            horario_fim: req.body.horario_fim,
            status: false
        };
        docConfirmacao.set(confirmacao);
        res.redirect("/confirmacao/historico");
    }catch(e){
        console.log(e);
    }
});

// aceitar
app.get('/aceitar/:id', (req, res) => {
    fs.readFile('src/cabecalho.html', (e, cabecalho) => {
        fs.readFile('src/rodape.html', (e, rodape) => {
            fs.readFile('src/confirmacao/aceitar_confirmacao.html', (e, dados) => {
                cabecalho = cabecalho.toString().replace("{usuario}", req.session.authName)
                let id = req.params.id;
                const docConfirmacao = db.ref("confirmacao/"+id);
                docConfirmacao.once("value", function(snapshot){
                    let nome = snapshot.val().nome;
                    let ambiente = snapshot.val().ambiente;
                    let data = snapshot.val().data;
                    let horario_inicio = snapshot.val().horario_inicio;
                    let horario_fim = snapshot.val().horario_fim;
                    dados = dados.toString().replace("{nome}", nome);
                    dados = dados.toString().replace("{ambiente}", ambiente);
                    dados = dados.toString().replace("{data}", data);
                    dados = dados.toString().replace("{horario_inicio}", horario_inicio);
                    dados = dados.toString().replace("{horario_fim}", horario_fim);
                    dados = dados.toString().replace("{id}", id);
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write(cabecalho + dados + rodape);
                    res.end();
                });
            });
        });
    });
});

// aceitar
app.get('/analisar/:id', (req, res) => {
    fs.readFile('src/cabecalho.html', (e, cabecalho) => {
        fs.readFile('src/rodape.html', (e, rodape) => {
            fs.readFile('src/confirmacao/analisar.html', (e, dados) => {
                cabecalho = cabecalho.toString().replace("{usuario}", req.session.authName);
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.write(cabecalho + dados + rodape);
                res.end();
            });
        });
    });
});

// Aceitar solicitação
app.post('/aceitar', urlencodedParser, (req, res) => {
    try{
        let id = req.body.id;
        let docConfirmacao = db.ref("confirmacao");
        docConfirmacao.child(id).update(
            {
                'status' : false
            }
        );
        console.log("Certo");
        res.redirect("/confirmacao/?acao=aceitar&status=true");
    } catch (e){
        console.log(e);
        res.redirect("/confirmacao/?acao=aceitar&status=false");
    }
});



//- excluir
app.get('/excluir/:id', (req, res) => {
    fs.readFile('src/cabecalho.html', (e, cabecalho) => {
        fs.readFile('src/rodape.html', (e, rodape) => {
            fs.readFile('src/confirmacao/excluir_confirmacao.html', (e, dados) => {
                cabecalho = cabecalho.toString().replace("{usuario}", req.session.authName)
                let id = req.params.id;
                const docConfirmacao = db.ref("confirmacao/"+id);
                docConfirmacao.once("value", function(snapshot){
                    let nome = snapshot.val().nome;
                    let ambiente = snapshot.val().ambiente;
                    let data = snapshot.val().data;
                    let horario_inicio = snapshot.val().horario_inicio;
                    let horario_fim = snapshot.val().horario_fim;
                    dados = dados.toString().replace("{nome}", nome);
                    dados = dados.toString().replace("{ambiente}", ambiente);
                    dados = dados.toString().replace("{data}", data);
                    dados = dados.toString().replace("{horario_inicio}", horario_inicio);
                    dados = dados.toString().replace("{id}", id);
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write(cabecalho + dados + rodape);
                    res.end();
                });
            });
        });
    });
});

//- excluir
app.post('/excluir', urlencodedParser, (req, res) => {
    try{
        let id = req.body.id;
        const docConfirmacao = db.ref("confirmacao/"+id);
        docConfirmacao.remove();
        res.redirect("/confirmacao/?acao=excluir&status=true");
    } catch(e){
        console.log(e);
        res.redirect("/confirmacao/?acao=excluir&status=false")
    }
    
});
app.get('/historico', urlencodedParser, (req, res) => {
    fs.readFile('src/cabecalho_usu.html', (e, cabecalho) => {
        fs.readFile('src/rodape.html', (e, rodape) => {
            fs.readFile('src/confirmacao/Historico.html', (e, dados) => {
                cabecalho = cabecalho.toString().replace("{usuario}", req.session.authName)
                let tabela = "";
                const usuarioId = req.session.authName; // Obtém o ID do usuário da sessão
                const docConfirmacao = db.ref("confirmacao");
                
                docConfirmacao.once("value", function(snapshot) {
                    const confirmacoes = snapshot.val();
                    if (confirmacoes) {
                        // Filtra as confirmações que pertencem ao usuário logado
                        const confirmacoesUsuario = Object.values(confirmacoes).filter(confirmacao => {
                            return confirmacao.nome === usuarioId; // Verifica se o ID do usuário é igual ao ID na confirmação
                        });

                        tabela = criarTabelaUsu(confirmacoesUsuario); // Cria a tabela com as confirmações filtradas
                    }

                    dados = dados.toString().replace("{tabela}", tabela);
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.write(cabecalho + dados + rodape);
                    res.end();
                });
            });
        });
    });
});


module.exports = app;