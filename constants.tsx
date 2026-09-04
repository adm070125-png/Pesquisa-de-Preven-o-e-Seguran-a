import { Config } from './types';

export const CONFIG: Config = {
  brand: "Grupo Ethernos",
  whatsappNumber: "5547999429130", // Adilson — formato internacional sem símbolos
  consultantTitle: "Consultor",
  consultantName: "Adilson",
  questions: [
    {
      id: "cidade",
      title: "Qual sua cidade?",
      options: [
        { text: "Jaraguá do Sul", score: 0, region: "jaraguajs" },
        { text: "Massaranduba", score: 0, region: "jaraguajs" },
        { text: "Blumenau", score: 0, region: "blumenau" }
      ]
    },
    {
      id: "moradores",
      title: "Quantas pessoas moram com você?",
      options: [
        { text: "Só eu", score: 1 },
        { text: "2 a 3 pessoas", score: 2 },
        { text: "4 pessoas ou mais", score: 3 }
      ]
    },
    {
      id: "plano_atual",
      title: "Você já possui algum plano assistencial ou funerário?",
      options: [
        { text: "Sim, já tenho", score: 0 },
        { text: "Não tenho nenhum", score: 3 },
        { text: "Não sei dizer", score: 2 }
      ]
    },
    {
      id: "faixa_etaria",
      title: "Qual a faixa etária do responsável pela casa?",
      options: [
        { text: "18 a 30 anos", score: 1 },
        { text: "31 a 45 anos", score: 2 },
        { text: "46 a 60 anos", score: 3 },
        { text: "Acima de 60 anos", score: 3 }
      ]
    },
    {
      id: "preocupacao",
      title: "Qual dessas situações te preocupa mais hoje?",
      options: [
        { text: "Ter que pagar uma quantia alta de uma vez, sem aviso", score: 3 },
        { text: "Não ter nenhum plano ou organização para esse momento", score: 3 },
        { text: "Lidar com papelada e burocracia sem saber por onde começar", score: 2 },
        { text: "Ainda não parei pra pensar nisso, mas sei que deveria", score: 1 }
      ]
    }
  ],
  // Tabela de planos por região — score máximo possível (fora a pergunta de cidade): 12
  regions: {
    jaraguajs: {
      label: "Jaraguá do Sul / Massaranduba",
      plans: [
        {
          max: 5, name: "Bronze", price: "R$ 44,90/mês",
          includes: "Casal, filhos, pai, mãe, sogro e sogra",
          benefits: [
            "Cobertura completa no funeral (urna, ornamentação, higienização, translado até 200km, coroa de flores e café para até 50 pessoas)",
            "Cremação para um pet",
            "Aplicativo com descontos",
            "Sorteio mensal de brindes",
            "Empréstimo de equipamentos hospitalares"
          ]
        },
        {
          max: 9, name: "Prata", price: "R$ 69,90/mês",
          includes: "Casal, filhos, pai, mãe, sogro e sogra",
          benefits: [
            "Cobertura completa no funeral (urna, ornamentação, higienização, translado até 200km, coroa de flores e café para até 50 pessoas)",
            "Tanatopraxia",
            "Cremação para um pet",
            "Sorteio mensal de brindes",
            "Empréstimo de equipamentos hospitalares"
          ]
        },
        {
          max: 999, name: "Ouro", price: "R$ 89,90/mês",
          includes: "Casal, filhos, pai, mãe, sogro e sogra",
          benefits: [
            "Cobertura completa no funeral (urna, ornamentação, higienização, translado até 200km, coroa de flores e café para até 50 pessoas)",
            "Tanatopraxia",
            "Cremação",
            "Cremação para um pet",
            "Sorteio mensal de brindes",
            "Empréstimo de equipamentos hospitalares"
          ]
        }
      ]
    },
    blumenau: {
      label: "Blumenau (parceria com Cemitério São José)",
      plans: [
        {
          max: 3, name: "Bronze", price: "R$ 44,90/mês",
          includes: "Casal e filhos",
          benefits: [
            "Cobertura completa no funeral (urna, ornamentação, higienização, translado até 200km, coroa de flores e café para até 50 pessoas)",
            "Aplicativo com descontos",
            "Empréstimo de equipamentos hospitalares",
            "Sorteio mensal de brindes",
            "Cremação para um pet"
          ]
        },
        {
          max: 6, name: "Prata", price: "R$ 69,90/mês",
          includes: "Casal, filhos, pai, mãe, sogro e sogra",
          benefits: [
            "Cobertura completa no funeral (urna, ornamentação, higienização, translado até 200km, coroa de flores e café para até 50 pessoas)",
            "Aplicativo com descontos",
            "Empréstimo de equipamentos hospitalares",
            "Sorteio mensal de brindes",
            "Cremação para um pet"
          ]
        },
        {
          max: 9, name: "Ouro", price: "R$ 99,90/mês",
          includes: "Casal, filhos, pai, mãe, sogro e sogra",
          benefits: [
            "Cobertura completa no funeral (urna, ornamentação, higienização, translado até 200km, coroa de flores e café para até 50 pessoas)",
            "Aplicativo com descontos",
            "Empréstimo de equipamentos hospitalares",
            "Sorteio mensal de brindes",
            "Capela mortuária (Cemitério São José)",
            "Cremação"
          ]
        },
        {
          max: 999, name: "Diamante", price: "R$ 129,90/mês",
          includes: "Casal, filhos, pai, mãe, sogro e sogra",
          benefits: [
            "Cobertura completa no funeral (urna, ornamentação, higienização, translado até 200km, coroa de flores e café para até 50 pessoas)",
            "Aplicativo com descontos",
            "Empréstimo de equipamentos hospitalares",
            "Sorteio mensal de brindes",
            "Sepultamento temporário",
            "Capela mortuária (Cemitério São José)",
            "Cremação",
            "Cremação para um pet"
          ]
        }
      ]
    }
  }
};
