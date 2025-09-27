const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

// Servir arquivos estáticos do front-end
app.use(express.static("../frontend"));

const PORT = process.env.PORT || 3000;

//app.use(cors({
 //   origin: "https://financas-pessoais-frontend.onrender.com"
//}));
app.use(cors());

app.use(express.json());

// Rotas para Receitas
app.get('/receitas', async (req, res) => {
    try {
        const receitas = await prisma.receita.findMany();
        res.json({
            "message": "success",
            "data": receitas.map(r => ({ ...r, data: r.data.toISOString().split('T')[0] }))
        });
    } catch (error) {
        res.status(400).json({ "error": error.message });
    }
});

app.post('/receitas', async (req, res) => {
    const { descricao, valor, data, categoria } = req.body;
    try {
        const newReceita = await prisma.receita.create({
            data: { descricao, valor: parseFloat(valor), data: new Date(data), categoria }
        });
        res.status(201).json({
            "message": "success",
            "data": { ...newReceita, data: newReceita.data.toISOString().split('T')[0] }
        });
    } catch (error) {
        res.status(400).json({ "error": error.message });
    }
});

app.delete('/receitas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deletedReceita = await prisma.receita.delete({
            where: { id: parseInt(id) }
        });
        res.json({
            "message": "success",
            "data": { id: deletedReceita.id, changes: 1 }
        });
    } catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ "error": "Receita não encontrada" });
        } else {
            res.status(400).json({ "error": error.message });
        }
    }
});

// Rotas para Despesas
app.get('/despesas', async (req, res) => {
    try {
        const parcelas = await prisma.parcela.findMany({
            include: { despesa: true },
            orderBy: { data_vencimento: 'asc' }
        });
        res.json({
            "message": "success",
            "data": parcelas.map(p => ({
                ...p,
                descricao_original: p.despesa.descricao,
                data_vencimento: p.data_vencimento.toISOString().split('T')[0]
            }))
        });
    } catch (error) {
        res.status(400).json({ "error": error.message });
    }
});

app.post('/despesas', async (req, res) => {
    const { descricao, valor, data, categoria, parcelada, parcelas_total, data_primeira_parcela } = req.body;
    try {
        const newDespesa = await prisma.despesa.create({
            data: { descricao, valor: parseFloat(valor), data: new Date(data), categoria }
        });

        if (parcelada && parcelas_total > 1) {
            const valorPorParcela = parseFloat((parseFloat(valor) / parseInt(parcelas_total)).toFixed(2));
            const dataVencimento = new Date(data_primeira_parcela || data);
            const parcelasData = [];

            for (let i = 1; i <= parseInt(parcelas_total); i++) {
                const vencimento = new Date(dataVencimento);
                vencimento.setMonth(dataVencimento.getMonth() + (i - 1));
                parcelasData.push({
                    despesa_id: newDespesa.id,
                    descricao: `${descricao} (Parcela ${i}/${parcelas_total})`,
                    valor: valorPorParcela,
                    data_vencimento: vencimento,
                    status: "em aberto",
                    numero_parcela: i,
                    total_parcelas: parseInt(parcelas_total)
                });
            }
            await prisma.parcela.createMany({ data: parcelasData });
        } else {
            await prisma.parcela.create({
                data: {
                    despesa_id: newDespesa.id,
                    descricao: descricao,
                    valor: parseFloat(valor),
                    data_vencimento: new Date(data),
                    status: "em aberto",
                    numero_parcela: 1,
                    total_parcelas: 1
                }
            });
        }

        res.status(201).json({
            "message": "success",
            "data": { id: newDespesa.id, descricao, valor, data, categoria, parcelada, parcelas_total }
        });
    } catch (error) {
        res.status(400).json({ "error": error.message });
    }
});

app.put('/parcelas/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const updatedParcela = await prisma.parcela.update({
            where: { id: parseInt(id) },
            data: { status }
        });
        res.json({
            "message": "success",
            "data": { id: updatedParcela.id, status: updatedParcela.status, changes: 1 }
        });
    } catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ "error": "Parcela não encontrada" });
        } else {
            res.status(400).json({ "error": error.message });
        }
    }
});

app.delete('/despesas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.parcela.deleteMany({
            where: { despesa_id: parseInt(id) }
        });
        const deletedDespesa = await prisma.despesa.delete({
            where: { id: parseInt(id) }
        });
        res.json({
            "message": "success",
            "data": { id: deletedDespesa.id, changes: 1 }
        });
    } catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ "error": "Despesa não encontrada" });
        } else {
            res.status(400).json({ "error": error.message });
        }
    }
});

// Rotas para Metas
app.get('/metas', async (req, res) => {
    try {
        const metas = await prisma.meta.findMany();
        res.json({
            "message": "success",
            "data": metas.map(m => ({ ...m, data_inicio: m.data_inicio.toISOString().split('T')[0], data_fim: m.data_fim.toISOString().split('T')[0] }))
        });
    } catch (error) {
        res.status(400).json({ "error": error.message });
    }
});

app.post('/metas', async (req, res) => {
    const { descricao, valor_meta, valor_atual, tipo, data_inicio, data_fim } = req.body;
    try {
        const newMeta = await prisma.meta.create({
            data: { descricao, valor_meta: parseFloat(valor_meta), valor_atual: parseFloat(valor_atual || 0), tipo, data_inicio: new Date(data_inicio), data_fim: new Date(data_fim) }
        });
        res.status(201).json({
            "message": "success",
            "data": { ...newMeta, data_inicio: newMeta.data_inicio.toISOString().split('T')[0], data_fim: newMeta.data_fim.toISOString().split('T')[0] }
        });
    } catch (error) {
        res.status(400).json({ "error": error.message });
    }
});

app.put('/metas/:id/valor', async (req, res) => {
    const { id } = req.params;
    const { valor_adicional } = req.body;
    try {
        const meta = await prisma.meta.findUnique({
            where: { id: parseInt(id) }
        });
        if (!meta) {
            res.status(404).json({ "error": "Meta não encontrada" });
            return;
        }
        const novoValor = (meta.valor_atual || 0) + parseFloat(valor_adicional);
        const updatedMeta = await prisma.meta.update({
            where: { id: parseInt(id) },
            data: { valor_atual: novoValor }
        });
        res.json({
            "message": "success",
            "data": { id: updatedMeta.id, novo_valor_atual: updatedMeta.valor_atual, valor_adicionado: valor_adicional }
        });
    } catch (error) {
        res.status(400).json({ "error": error.message });
    }
});

app.delete('/metas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deletedMeta = await prisma.meta.delete({
            where: { id: parseInt(id) }
        });
        res.json({
            "message": "success",
            "data": { id: deletedMeta.id, changes: 1 }
        });
    } catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ "error": "Meta não encontrada" });
        } else {
            res.status(400).json({ "error": error.message });
        }
    }
});

// Rota para o Dashboard (resumo)
app.get('/dashboard', async (req, res) => {
    try {
        const totalReceitas = await prisma.receita.aggregate({
            _sum: { valor: true }
        });
        const totalDespesas = await prisma.parcela.aggregate({
            _sum: { valor: true },
            where: { status: 'em aberto' }
        });
        const metas = await prisma.meta.findMany();

        const receitas = totalReceitas._sum.valor || 0;
        const despesas = totalDespesas._sum.valor || 0;
        const saldoAtual = receitas - despesas;

        res.json({
            message: "success",
            data: {
                totalReceitas: receitas,
                totalDespesas: despesas,
                saldoAtual: saldoAtual,
                metas: metas.map(m => ({ ...m, data_inicio: m.data_inicio.toISOString().split('T')[0], data_fim: m.data_fim.toISOString().split('T')[0] }))
            }
        });

    } catch (error) {
        res.status(400).json({ "error": error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

