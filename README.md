# Projeto 05 - Controlador de Acesso (Chain of Responsibility)

Este projeto implementa o padrão de projeto comportamental **Chain of Responsibility** para controlar e validar o fluxo de requisições durante o cadastro de pessoas num sistema web CRUD, integrado com o padrão **Factory Method** e persistência em **SQLite**.

---

## 🚀 Arquitetura e Padrões Aplicados

- **Chain of Responsibility**: Encadeamento de validadores e processadores na rota POST (`/api/pessoas`):
  1. `ValidadorDadosCampos`: Verifica se os campos obrigatórios (nome, email, tipo) estão preenchidos.
  2. `ValidadorPerfilPessoa`: Valida o perfil e delega a criação da instância ao Factory Method.
  3. `SalvarBancoDados`: Realiza a gravação na base de dados SQLite.
- **Factory Method**: Criação dinâmica de instâncias para cada perfil (`Estudante`, `Professor`, `Administrativo`, `Terceiro`, `Visitante`).
- **ViaCEP API**: Preenchimento automático do endereço no formulário.

---

## 📁 Estrutura do Projeto

```text
Projeto05-ControladorDeAcesso-Chain/
├── public/                 # Ficheiros estáticos do front-end
│   ├── cadastrar.html      # Formulário com opção de perfil
│   ├── editar.html         # Edição de registos
│   ├── index.html          # Menu principal
│   └── listar.html         # Tabela de consulta
├── app.js                  # Servidor HTTP e montagem da Chain
├── cadastroPessoas.js      # Classes e Fábricas (Factory Method)
├── controladorAcessoChain.js # Elo da Corrente (Chain of Responsibility)
├── database.js             # Conexão SQLite
└── package.json            # Configurações do projeto Node.js