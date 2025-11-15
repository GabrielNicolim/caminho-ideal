# Proposta de Trabalho — Estrutura de Dados II

## Integrantes

- Gabriel Gomes Nicolim — RA 231021909
- Roberto Prado Ribeiro Silva — RA 221022597
- Vinícius Person de Oliveira — RA 221022503
- Otávio de Lucas Campezzi — RA 231021259

## Descrição

Esta aplicação é um protótipo web para simulação de rotas de entrega entre cidades.
O objetivo é demonstrar, de forma prática e interativa, como estruturas de grafos e
algoritmos de caminho mínimo podem ser usados para resolver problemas de logística.

## Funcionalidades

- Cadastrar cidades (vértices do grafo).
- Cadastrar estradas entre cidades com peso (distância).
- Inserir pedidos de entrega em cidades específicas.
- Calcular e visualizar a rota ideal para o caminhão, minimizando a distância total e atrasos.

## Modelagem (visão geral)

O problema é modelado como um grafo ponderado:

- Vértices: cidades cadastradas.
- Arestas: estradas entre cidades.
- Pesos: distância de viagem entre cidades.

O desafio é encontrar a sequência de visitas que otimiza o critério escolhido.
