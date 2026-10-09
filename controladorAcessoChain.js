// 1. Classe Base do Chain (DEVE ESTAR NO TOPO DO FICHEIRO)
export class ProcessadorCadastro {
    setProximo(proximo) {
        this.proximo = proximo;
        return proximo;
    }

    async processar(requisicao) {
        if (this.proximo) {
            return await this.proximo.processar(requisicao);
        }
        return { sucesso: true };
    }
}

// 2. Elo: Validação dos Campos Obrigatórios
export class ValidadorDadosCampos extends ProcessadorCadastro {
    async processar(requisicao) {
        console.log("\n--- [ETAPA 1/3: Chain] Validando campos obrigatórios... ---");
        const { nome, email, tipo } = requisicao.data;

        if (!nome || !email || !tipo) {
            console.log("❌ [ETAPA 1 FALHOU] Campos obrigatórios ausentes.");
            return {
                sucesso: false,
                status: 400,
                mensagem: "Campos obrigatórios (nome, email, tipo) não preenchidos."
            };
        }

        console.log("✅ [ETAPA 1 APROVADA] Todos os campos obrigatórios estão presentes.");
        return await super.processar(requisicao);
    }
}

// 3. Elo: Validação do Perfil e Instanciação via Factory
export class ValidadorPerfilPessoa extends ProcessadorCadastro {
    constructor(fabricas) {
        super();
        this.fabricas = fabricas;
    }

    async processar(requisicao) {
        console.log("--- [ETAPA 2/3: Chain] Validando perfil e instanciando objeto... ---");
        const tipoPessoa = requisicao.data.tipo || 'visitante';
        const fabrica = this.fabricas[tipoPessoa];

        if (!fabrica) {
            console.log(`❌ [ETAPA 2 FALHOU] Perfil inválido: "${tipoPessoa}".`);
            return {
                sucesso: false,
                status: 400,
                mensagem: `Tipo de cadastro inválido: ${tipoPessoa}`
            };
        }

        requisicao.instanciaPessoa = fabrica.criarPessoa(requisicao.data);
        console.log(`✅ [ETAPA 2 APROVADA] Objeto do tipo "${tipoPessoa}" instanciado com sucesso.`);
        return await super.processar(requisicao);
    }
}

// 4. Elo: Persistência na Base de Dados
export class SalvarBancoDados extends ProcessadorCadastro {
    constructor(db) {
        super();
        this.db = db;
    }

    async processar(requisicao) {
        console.log("--- [ETAPA 3/3: Chain] Salvando registro no SQLite... ---");
        const p = requisicao.instanciaPessoa;
        const sql = `INSERT INTO pessoas (nome, tipo, email, telefone, cep, logradouro, numero, complemento, bairro, cidade, estado)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        return new Promise((resolve) => {
            this.db.run(sql, [
                p.nome, p.tipo, p.email, p.telefone,
                p.cep, p.logradouro, p.numero, p.complemento,
                p.bairro, p.cidade, p.estado
            ], function (err) {
                if (err) {
                    console.log("❌ [ETAPA 3 FALHOU] Erro no SQLite: " + err.message);
                    return resolve({ sucesso: false, status: 500, mensagem: err.message });
                }
                console.log("✅ [ETAPA 3 APROVADA] Registro salvo no banco com ID: " + this.lastID);
                resolve({ sucesso: true, status: 201, id: this.lastID, mensagem: 'Cadastrado com sucesso!' });
            });
        });
    }
}
