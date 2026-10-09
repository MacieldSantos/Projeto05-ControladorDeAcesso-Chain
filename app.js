import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from './database.js';
import { fabricas } from './cadastroPessoas.js'; // IMPORT DA FÁBRICA
import {
    ValidadorDadosCampos,
    ValidadorPerfilPessoa,
    SalvarBancoDados
} from './controladorAcessoChain.js';
import { error } from 'console';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8'
};

// Helper para ler o corpo da requisição (POST/PUT)
function getRequestBody(request) {
    return new Promise((resolve, reject) => {
        let body = '';
        request.on('data', chunk => body += chunk.toString());
        request.on('end', () => {
            try { resolve(body ? JSON.parse(body) : {}); }
            catch (e) { reject(e); }
        });
    });
}

function serveStaticFile(response, file) {
    fs.readFile(file, (err, data) => {
        if (err) {
            response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            return response.end('404 - Página Não encontrada');
        }
        const ext = path.extname(file).toLowerCase();
        response.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
        response.end(data);
    });
}

// Montagem da Chain of Responsibility
const validadorCampos = new ValidadorDadosCampos();
const validadorPerfil = new ValidadorPerfilPessoa(fabricas);
const salvadorBanco = new SalvarBancoDados(db);

validadorCampos.setProximo(validadorPerfil).setProximo(salvadorBanco);

async function callback(request, response) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathname = decodeURIComponent(url.pathname);
    const method = request.method;

    // ROTAS DA API (CRUD)
    if (pathname.startsWith('/api/pessoas')) {
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        const id = url.searchParams.get('id');

        // CREATE usando Chain of Responsibility
        if (method === 'POST') {
            try{
                const data = await getRequestBody(request);

                // Executa o fluxo encadeado
                const resultado = await validadorCampos.processar({ data });

                if (resultado.sucesso) {
                    response.writeHead(resultado.status).end(JSON.stringify({ id: resultado.id, message: resultado.mensagem }));
                } else {
                    response.writeHead(resultado.status).end(JSON.stringify({ error: resultado.mensagem }));
                }
            } catch (err) {
                response.writeHead(400).end(JSON.stringify({ error: 'Erro no playload enviado.'}));
            }
            return;
        }

        // READ
        if (method === 'GET') {
            if (id) { // Busca 1 pessoa
                db.get(`SELECT * FROM pessoas WHERE id = ?`, [id], (err, row) => {
                    if (err) return response.writeHead(500).end(JSON.stringify({ error: err.message }));
                    response.writeHead(200).end(JSON.stringify(row || {}));
                });
            } else { // Busca todas
                db.all(`SELECT * FROM pessoas`, [], (err, rows) => {
                    if (err) return response.writeHead(500).end(JSON.stringify({ error: err.message }));
                    response.writeHead(200).end(JSON.stringify(rows));
                });
            }
            return;
        }

        // UPDATE
        if (method === 'PUT' && id) {
            const data = await getRequestBody(request);
            const sql = `
                UPDATE pessoas
                SET
                    nome = ?,
                    tipo = ?,
                    email = ?,
                    telefone = ?,
                    cep = ?,
                    logradouro = ?,
                    numero = ?,
                    complemento = ?,
                    bairro = ?,
                    cidade = ?,
                    estado = ?
                WHERE id = ?
            `;

            const params = [
                data.nome,
                data.tipo,
                data.email,
                data.telefone,
                data.cep,
                data.logradouro,
                data.numero,
                data.complemento,
                data.bairro,
                data.cidade,
                data.estado,
                id
            ];

            db.run(sql, params, function(err) {
                if (err) {
                    return response.writeHead(500).end(JSON.stringify({ error: err.message }));
                }
                response.writeHead(200).end(JSON.stringify({ message: 'Atualizado com sucesso!' }));
            });

            return;
        }

        // DELETE
        if (method === 'DELETE' && id) {
            db.run(`DELETE FROM pessoas WHERE id = ?`, [id], function(err) {
                if (err) return response.writeHead(500).end(JSON.stringify({ error: err.message }));
                response.writeHead(200).end(JSON.stringify({ message: 'Deletado com sucesso!' }));
            });
            return;
        }
    }

    // ROTAS DE ARQUIVOS ESTÁTICOS
    let file = path.join(publicDir, pathname === '/' ? 'index.html' : pathname);

    // Segurança contra Directory Traversal
    if (!file.startsWith(publicDir)) {
        response.writeHead(403).end('Proibido');
        return;
    }

    serveStaticFile(response, file);
}

// WebServer - Cria e Configura:
const server = http.createServer(callback);
const PORT = 5000;
server.listen(PORT, () =>{
    console.log(`Servidor iniciado em http://localhost:${PORT}/`);
})

//
//npm install -y
//npm install sqlite3