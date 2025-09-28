// ===================================================================
// 1. VARIÁVEIS E FUNÇÕES GLOBAIS DE SUPORTE (DEFINIÇÕES DE ESCOPO)
// ===================================================================

const BACKEND_URL = 'https://financas-pessoais-backend-0dbj.onrender.com';

// FUNÇÃO GLOBAL DE FECHAMENTO DE MODAL (Solução para o botão 'X' e 'Cancelar')
window.closeModal = function() {
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }
};

// FUNÇÃO GLOBAL DE TOAST
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => { toast.classList.add('show'); }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { toast.remove(); }, 300);
    }, 3000);
}

// FUNÇÃO GLOBAL PARA CRIAR O MODAL
function createModal(title, message, type = 'info', onConfirm = null) {
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = `modal modal-${type}`;
    
    const modalContent = `
        <div class="modal-header">
            <h3>${title}</h3>
            <button class="modal-close" onclick="window.closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <p>${message}</p>
        </div>
        <div class="modal-footer">
            ${onConfirm ? 
                `<button class="btn btn-secondary" onclick="window.closeModal()">Cancelar</button>
                 <button class="btn btn-primary" id="confirm-action-btn">Confirmar</button>` :
                `<button class="btn btn-primary" onclick="window.closeModal()">OK</button>`
            }
        </div>
    `;
    
    modal.innerHTML = modalContent;
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
    
    setTimeout(() => { modalOverlay.classList.add('show'); modal.classList.add('show'); }, 10);
    
    // Configura a função de confirmação para FECHAR o modal após a ação da API
    if (onConfirm) {
        document.getElementById('confirm-action-btn').onclick = async () => {
            await onConfirm(); 
            window.closeModal(); 
        };
    }
    
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            window.closeModal();
        }
    });
}

// ===================================================================
// 2. FUNÇÕES DE ATUALIZAÇÃO DE DADOS (FETCH...) - ELEVADAS AO ESCOPO GLOBAL
//    (Agora disponíveis para as funções de Ação e o DOMContentLoaded)
// ===================================================================

async function fetchReceitas() {
    const tabelaReceitasBody = document.querySelector('#tabela-receitas tbody');
    tabelaReceitasBody.innerHTML = '<tr><td colspan="5">Carregando receitas...</td></tr>';
    try {
        const response = await fetch(`${BACKEND_URL}/receitas`);
        const data = await response.json();
        if (data.message === 'success') {
            tabelaReceitasBody.innerHTML = '';
            data.data.forEach(receita => {
                const row = tabelaReceitasBody.insertRow();
                row.insertCell(0).textContent = receita.descricao;
                row.insertCell(1).textContent = `R$ ${receita.valor.toFixed(2)}`;
                row.insertCell(2).textContent = receita.data;
                row.insertCell(3).textContent = receita.categoria;
                const actionsCell = row.insertCell(4);
                actionsCell.innerHTML = `<button class="btn-delete" onclick="window.deleteReceita(${receita.id})">Excluir</button>`;
            });
        } else { tabelaReceitasBody.innerHTML = `<tr><td colspan="5">Erro ao carregar receitas: ${data.error}</td></tr>`; }
    } catch (error) { tabelaReceitasBody.innerHTML = `<tr><td colspan="5">Erro de conexão: ${error.message}</td></tr>`; console.error('Erro ao buscar receitas:', error); }
}

async function fetchDespesas() {
    const tabelaDespesasBody = document.querySelector('#tabela-despesas tbody');
    tabelaDespesasBody.innerHTML = '<tr><td colspan="6">Carregando despesas...</td></tr>';
    try {
        const response = await fetch(`${BACKEND_URL}/despesas`);
        const data = await response.json();
        if (data.message === 'success') {
            tabelaDespesasBody.innerHTML = '';
            data.data.forEach(despesa => {
                const row = tabelaDespesasBody.insertRow();
                row.insertCell(0).textContent = despesa.descricao_original;
                row.insertCell(1).textContent = `${despesa.numero_parcela}/${despesa.total_parcelas}`;
                row.insertCell(2).textContent = `R$ ${despesa.valor.toFixed(2)}`;
                row.insertCell(3).textContent = despesa.data_vencimento;
                const statusCell = row.insertCell(4);
                statusCell.textContent = despesa.status;
                if (despesa.status === 'em aberto') {
                    statusCell.innerHTML += ` <button class="btn-mark-paid" onclick="window.markParcelaAsPaid(${despesa.id})">Pagar</button>`;
                }
                const actionsCell = row.insertCell(5);
                actionsCell.innerHTML = `<button class="btn-delete" onclick="window.deleteDespesa(${despesa.despesa_id})">Excluir Despesa</button>`;
            });
        } else { tabelaDespesasBody.innerHTML = `<tr><td colspan="6">Erro ao carregar despesas: ${data.error}</td></tr>`; }
    } catch (error) { tabelaDespesasBody.innerHTML = `<tr><td colspan="6">Erro de conexão: ${error.message}</td></tr>`; console.error('Erro ao buscar despesas:', error); }
}

async function fetchMetas() {
    const metasCards = document.getElementById('metas-cards');
    metasCards.innerHTML = '<p>Carregando metas...</p>';
    try {
        const response = await fetch(`${BACKEND_URL}/metas`);
        const data = await response.json();
        if (data.message === 'success') {
            metasCards.innerHTML = '';
            if (data.data.length === 0) { metasCards.innerHTML = '<p>Nenhuma meta cadastrada.</p>'; return; }
            
            data.data.forEach(meta => {
                const valorAtual = meta.valor_atual || 0;
                const valorMeta = meta.valor_meta;
                const progresso = Math.min((valorAtual / valorMeta) * 100, 100);
                const valorRestante = Math.max(valorMeta - valorAtual, 0);
                
                const metaCard = document.createElement('div');
                metaCard.className = 'meta-card';
                metaCard.innerHTML = `
                    <div class="meta-header">
                        <h4>${meta.descricao}</h4>
                        <span class="meta-tipo">${meta.tipo}</span>
                    </div>
                    <div class="meta-valores">
                        <div class="valor-info"><span class="label">Atual:</span><span class="valor">R$ ${valorAtual.toFixed(2)}</span></div>
                        <div class="valor-info"><span class="label">Meta:</span><span class="valor">R$ ${valorMeta.toFixed(2)}</span></div>
                        <div class="valor-info"><span class="label">Restante:</span><span class="valor valor-restante">R$ ${valorRestante.toFixed(2)}</span></div>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar"><div class="progress-fill" style="width: ${progresso}%"></div></div>
                        <span class="progress-text">${progresso.toFixed(1)}%</span>
                    </div>
                    <div class="meta-periodo"><small>Período: ${meta.data_inicio} até ${meta.data_fim}</small></div>
                    <div class="meta-actions">
                     <form class="form-adicionar-valor" onsubmit="window.adicionarValorMeta(event, ${meta.id})">\n                                <input type="number" step="0.01" placeholder="Valor a adicionar" required>\n                                <button type="submit">Adicionar</button>\n                            </form>\n                            <button class="btn-delete" onclick="window.deleteMeta(${meta.id})">Excluir Meta</button>
                    </div>
                `;
                metasCards.appendChild(metaCard);
            });
        } else { metasCards.innerHTML = `<p>Erro ao carregar metas: ${data.error}</p>`; }
    } catch (error) { metasCards.innerHTML = `<p>Erro de conexão: ${error.message}</p>`; console.error('Erro ao buscar metas:', error); }
}


// ===================================================================
// 3. FUNÇÕES DE AÇÃO CRUD (Chamadas pelo HTML/onlick)
// ===================================================================

window.deleteReceita = async function(id) {
    createModal('Confirmar Exclusão', 'Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.', 'warning', async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/receitas/${id}`, { method: 'DELETE' });
            const result = await response.json();
            if (result.message === 'success') {
                showToast('Receita excluída com sucesso!', 'success');
                await fetchReceitas();
                await loadDashboard(); 
            } else { showToast(`Erro ao excluir receita: ${result.error}`, 'error'); }
        } catch (error) { showToast(`Erro de conexão: ${error.message}`, 'error'); }
    });
};

window.markParcelaAsPaid = async function(id) {
    createModal('Confirmar Pagamento', 'Tem certeza que deseja marcar esta parcela como paga?', 'info', async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/parcelas/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'paga' }) });
            const result = await response.json();
            if (result.message === 'success') {
                showToast("Parcela marcada como paga com sucesso!", "success");
                await fetchDespesas();
                await loadDashboard();
            } else { showToast(`Erro ao marcar parcela como paga: ${result.error}`, 'error'); }
        } catch (error) { showToast(`Erro de conexão: ${error.message}`, 'error'); }
    });
};

window.deleteDespesa = async function(id) {
    createModal('Confirmar Exclusão', 'Tem certeza que deseja excluir esta despesa?', 'warning', async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/despesas/${id}`, { method: 'DELETE' });
            const result = await response.json();
            if (result.message === 'success') {
                showToast('Despesa excluída com sucesso!', 'success');
                await fetchDespesas();
                await loadDashboard();
            } else { showToast(`Erro ao excluir despesa: ${result.error}`, 'error'); }
        } catch (error) { showToast(`Erro de conexão: ${error.message}`, '
