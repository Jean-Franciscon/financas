document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('nav ul li a');
    const sections = document.querySelectorAll('main section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = e.target.getAttribute('href').substring(1);

            sections.forEach(section => {
                section.classList.remove('active');
            });

            document.getElementById(targetId).classList.add('active');
            loadContent(targetId);
        });
    });

    // Carregar o dashboard por padrão ao carregar a página
    loadContent('dashboard');

    async function loadContent(sectionId) {
        switch (sectionId) {
            case 'dashboard':
                await loadDashboard();
                break;
            case 'receitas':
                await loadReceitas();
                break;
            case 'despesas':
                await loadDespesas();
                break;
            case 'metas':
                await loadMetas();
                break;
            default:
                break;
        }
    }

    // --- Funções para carregar e exibir dados --- //

    async function loadDashboard() {
        const dashboardContent = document.getElementById('dashboard-content');
        dashboardContent.innerHTML = 'Carregando dashboard...';
        try {
            const response = await fetch('http://localhost:3000/dashboard');
            const data = await response.json();
            if (data.message === 'success') {
                const { totalReceitas, totalDespesas, saldoAtual, metas } = data.data;
                dashboardContent.innerHTML = `
                    <div class="dashboard-card">
                        <h3>Total de Receitas</h3>
                        <p>R$ ${totalReceitas.toFixed(2)}</p>
                    </div>
                    <div class="dashboard-card">
                        <h3>Total de Despesas</h3>
                        <p>R$ ${totalDespesas.toFixed(2)}</p>
                    </div>
                    <div class="dashboard-card">
                        <h3>Saldo Atual</h3>
                        <p>R$ ${saldoAtual.toFixed(2)}</p>
                    </div>
                    <div class="dashboard-card">
                        <h3>Metas Financeiras</h3>
                        <ul>
                            ${metas.map(meta => `<li>${meta.descricao}: R$ ${meta.valor_atual.toFixed(2)} / R$ ${meta.valor_meta.toFixed(2)}</li>`).join('')}
                        </ul>
                    </div>
                `;
            } else {
                dashboardContent.innerHTML = `<p>Erro ao carregar dashboard: ${data.error}</p>`;
            }
        } catch (error) {
            dashboardContent.innerHTML = `<p>Erro de conexão: ${error.message}</p>`;
            console.error('Erro ao carregar dashboard:', error);
        }
    }

    async function loadReceitas() {
        const receitasContent = document.getElementById('receitas-content');
        receitasContent.innerHTML = `
            <h3>Cadastrar Nova Receita</h3>
            <form id="form-receita">
                <div>
                    <label for="receita-descricao">Descrição:</label>
                    <input type="text" id="receita-descricao" required>
                </div>
                <div>
                    <label for="receita-valor">Valor:</label>
                    <input type="number" id="receita-valor" step="0.01" required>
                </div>
                <div>
                    <label for="receita-data">Data:</label>
                    <input type="date" id="receita-data" required>
                </div>
                <div>
                    <label for="receita-categoria">Categoria:</label>
                    <input type="text" id="receita-categoria" required>
                </div>
                <button type="submit">Adicionar Receita</button>
            </form>
            <h3>Histórico de Receitas</h3>
            <table id="tabela-receitas">
                <thead>
                    <tr>
                        <th>Descrição</th>
                        <th>Valor</th>
                        <th>Data</th>
                        <th>Categoria</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Receitas serão carregadas aqui -->
                </tbody>
            </table>
        `;

        const formReceita = document.getElementById('form-receita');
        formReceita.addEventListener('submit', async (e) => {
            e.preventDefault();
            const descricao = document.getElementById('receita-descricao').value;
            const valor = parseFloat(document.getElementById('receita-valor').value);
            const data = document.getElementById('receita-data').value;
            const categoria = document.getElementById('receita-categoria').value;

            try {
                const response = await fetch('http://localhost:3000/receitas', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ descricao, valor, data, categoria })
                });
                const result = await response.json();
                if (result.message === 'success') {
                    alert('Receita adicionada com sucesso!');
                    formReceita.reset();
                    await fetchReceitas();
                    await loadDashboard(); // Atualiza o dashboard após adicionar receita
                } else {
                    alert(`Erro ao adicionar receita: ${result.error}`);
                }
            } catch (error) {
                alert(`Erro de conexão: ${error.message}`);
                console.error('Erro ao adicionar receita:', error);
            }
        });

        await fetchReceitas();
    }

    async function fetchReceitas() {
        const tabelaReceitasBody = document.querySelector('#tabela-receitas tbody');
        tabelaReceitasBody.innerHTML = '<tr><td colspan="4">Carregando receitas...</td></tr>';
        try {
            const response = await fetch('http://localhost:3000/receitas');
            const data = await response.json();
            if (data.message === 'success') {
                tabelaReceitasBody.innerHTML = '';
                data.data.forEach(receita => {
                    const row = tabelaReceitasBody.insertRow();
                    row.insertCell(0).textContent = receita.descricao;
                    row.insertCell(1).textContent = `R$ ${receita.valor.toFixed(2)}`;
                    row.insertCell(2).textContent = receita.data;
                    row.insertCell(3).textContent = receita.categoria;
                });
            } else {
                tabelaReceitasBody.innerHTML = `<tr><td colspan="4">Erro ao carregar receitas: ${data.error}</td></tr>`;
            }
        } catch (error) {
            tabelaReceitasBody.innerHTML = `<tr><td colspan="4">Erro de conexão: ${error.message}</td></tr>`;
            console.error('Erro ao buscar receitas:', error);
        }
    }

    async function loadDespesas() {
        const despesasContent = document.getElementById('despesas-content');
        despesasContent.innerHTML = `
            <h3>Cadastrar Nova Despesa</h3>
            <form id="form-despesa">
                <div>
                    <label for="despesa-descricao">Descrição:</label>
                    <input type="text" id="despesa-descricao" required>
                </div>
                <div>
                    <label for="despesa-valor">Valor:</label>
                    <input type="number" id="despesa-valor" step="0.01" required>
                </div>
                <div>
                    <label for="despesa-data">Data:</label>
                    <input type="date" id="despesa-data" required>
                </div>
                <div>
                    <label for="despesa-categoria">Categoria:</label>
                    <input type="text" id="despesa-categoria" required>
                </div>
                <div>
                    <label for="despesa-parcelada">Despesa Parcelada?</label>
                    <input type="checkbox" id="despesa-parcelada">
                </div>
                <div id="parcelas-fields" style="display: none;">
                    <label for="despesa-parcelas-total">Total de Parcelas:</label>
                    <input type="number" id="despesa-parcelas-total" min="1" value="1">
                    <label for="despesa-parcela-atual">Parcela Atual:</label>
                    <input type="number" id="despesa-parcela-atual" min="1" value="1">
                </div>
                <div>
                    <label for="despesa-status">Status:</label>
                    <select id="despesa-status">
                        <option value="em aberto">Em Aberto</option>
                        <option value="paga">Paga</option>
                    </select>
                </div>
                <button type="submit">Adicionar Despesa</button>
            </form>
            <h3>Histórico de Despesas</h3>
            <table id="tabela-despesas">
                <thead>
                    <tr>
                        <th>Descrição</th>
                        <th>Valor</th>
                        <th>Data</th>
                        <th>Categoria</th>
                        <th>Parcelas</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Despesas serão carregadas aqui -->
                </tbody>
            </table>
        `;

        const formDespesa = document.getElementById('form-despesa');
        const despesaParceladaCheckbox = document.getElementById('despesa-parcelada');
        const parcelasFields = document.getElementById('parcelas-fields');

        despesaParceladaCheckbox.addEventListener('change', () => {
            parcelasFields.style.display = despesaParceladaCheckbox.checked ? 'block' : 'none';
        });

        formDespesa.addEventListener('submit', async (e) => {
            e.preventDefault();
            const descricao = document.getElementById('despesa-descricao').value;
            const valor = parseFloat(document.getElementById('despesa-valor').value);
            const data = document.getElementById('despesa-data').value;
            const categoria = document.getElementById('despesa-categoria').value;
            const parcelada = despesaParceladaCheckbox.checked ? 1 : 0;
            const parcelas_total = document.getElementById('despesa-parcelas-total').value;
            const parcela_atual = document.getElementById('despesa-parcela-atual').value;
            const status = document.getElementById('despesa-status').value;

            try {
                const response = await fetch('http://localhost:3000/despesas', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ descricao, valor, data, categoria, parcelada, parcelas_total, parcela_atual, status })
                });
                const result = await response.json();
                if (result.message === 'success') {
                    alert('Despesa adicionada com sucesso!');
                    formDespesa.reset();
                    parcelasFields.style.display = 'none';
                    await fetchDespesas();
                    await loadDashboard(); // Atualiza o dashboard após adicionar despesa
                } else {
                    alert(`Erro ao adicionar despesa: ${result.error}`);
                }
            } catch (error) {
                alert(`Erro de conexão: ${error.message}`);
                console.error('Erro ao adicionar despesa:', error);
            }
        });

        await fetchDespesas();
    }

    async function fetchDespesas() {
        const tabelaDespesasBody = document.querySelector('#tabela-despesas tbody');
        tabelaDespesasBody.innerHTML = '<tr><td colspan="6">Carregando despesas...</td></tr>';
        try {
            const response = await fetch('http://localhost:3000/despesas');
            const data = await response.json();
            if (data.message === 'success') {
                tabelaDespesasBody.innerHTML = '';
                data.data.forEach(despesa => {
                    const row = tabelaDespesasBody.insertRow();
                    row.insertCell(0).textContent = despesa.descricao;
                    row.insertCell(1).textContent = `R$ ${despesa.valor.toFixed(2)}`;
                    row.insertCell(2).textContent = despesa.data;
                    row.insertCell(3).textContent = despesa.categoria;
                    row.insertCell(4).textContent = despesa.parcelada ? `${despesa.parcela_atual}/${despesa.parcelas_total}` : 'Não';
                    row.insertCell(5).textContent = despesa.status;
                });
            } else {
                tabelaDespesasBody.innerHTML = `<tr><td colspan="6">Erro ao carregar despesas: ${data.error}</td></tr>`;
            }
        } catch (error) {
            tabelaDespesasBody.innerHTML = `<tr><td colspan="6">Erro de conexão: ${error.message}</td></tr>`;
            console.error('Erro ao buscar despesas:', error);
        }
    }

    async function loadMetas() {
        const metasContent = document.getElementById('metas-content');
        metasContent.innerHTML = `
            <h3>Definir Nova Meta</h3>
            <form id="form-meta">
                <div>
                    <label for="meta-descricao">Descrição:</label>
                    <input type="text" id="meta-descricao" required>
                </div>
                <div>
                    <label for="meta-valor">Valor da Meta:</label>
                    <input type="number" id="meta-valor" step="0.01" required>
                </div>
                <div>
                    <label for="meta-tipo">Tipo:</label>
                    <select id="meta-tipo">
                        <option value="mensal">Mensal</option>
                        <option value="anual">Anual</option>
                    </select>
                </div>
                <div>
                    <label for="meta-data-inicio">Data de Início:</label>
                    <input type="date" id="meta-data-inicio" required>
                </div>
                <div>
                    <label for="meta-data-fim">Data de Fim:</label>
                    <input type="date" id="meta-data-fim" required>
                </div>
                <button type="submit">Adicionar Meta</button>
            </form>
            <h3>Metas Atuais</h3>
            <table id="tabela-metas">
                <thead>
                    <tr>
                        <th>Descrição</th>
                        <th>Valor da Meta</th>
                        <th>Valor Atual</th>
                        <th>Tipo</th>
                        <th>Período</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Metas serão carregadas aqui -->
                </tbody>
            </table>
        `;

        const formMeta = document.getElementById('form-meta');
        formMeta.addEventListener('submit', async (e) => {
            e.preventDefault();
            const descricao = document.getElementById('meta-descricao').value;
            const valor_meta = parseFloat(document.getElementById('meta-valor').value);
            const tipo = document.getElementById('meta-tipo').value;
            const data_inicio = document.getElementById('meta-data-inicio').value;
            const data_fim = document.getElementById('meta-data-fim').value;

            try {
                const response = await fetch('http://localhost:3000/metas', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ descricao, valor_meta, tipo, data_inicio, data_fim })
                });
                const result = await response.json();
                if (result.message === 'success') {
                    alert('Meta adicionada com sucesso!');
                    formMeta.reset();
                    await fetchMetas();
                    await loadDashboard(); // Atualiza o dashboard após adicionar meta
                } else {
                    alert(`Erro ao adicionar meta: ${result.error}`);
                }
            } catch (error) {
                alert(`Erro de conexão: ${error.message}`);
                console.error('Erro ao adicionar meta:', error);
            }
        });

        await fetchMetas();
    }

    async function fetchMetas() {
        const tabelaMetasBody = document.querySelector('#tabela-metas tbody');
        tabelaMetasBody.innerHTML = '<tr><td colspan="5">Carregando metas...</td></tr>';
        try {
            const response = await fetch('http://localhost:3000/metas');
            const data = await response.json();
            if (data.message === 'success') {
                tabelaMetasBody.innerHTML = '';
                data.data.forEach(meta => {
                    const row = tabelaMetasBody.insertRow();
                    row.insertCell(0).textContent = meta.descricao;
                    row.insertCell(1).textContent = `R$ ${meta.valor_meta.toFixed(2)}`;
                    row.insertCell(2).textContent = `R$ ${meta.valor_atual.toFixed(2)}`;
                    row.insertCell(3).textContent = meta.tipo;
                    row.insertCell(4).textContent = `${meta.data_inicio} a ${meta.data_fim}`;
                });
            } else {
                tabelaMetasBody.innerHTML = `<tr><td colspan="5">Erro ao carregar metas: ${data.error}</td></tr>`;
            }
        } catch (error) {
            tabelaMetasBody.innerHTML = `<tr><td colspan="5">Erro de conexão: ${error.message}</td></tr>`;
            console.error('Erro ao buscar metas:', error);
        }
    }
});

