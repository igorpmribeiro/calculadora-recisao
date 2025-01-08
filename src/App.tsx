import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { ResultadoModal } from "./components/ResultadoModal";

enum MotivoRescisao {
  PEDIDO_DEMISSAO = "PEDIDO_DEMISSAO",
  DEMISSAO_SEM_JUSTA_CAUSA = "DEMISSAO_SEM_JUSTA_CAUSA",
  DEMISSAO_COM_JUSTA_CAUSA = "DEMISSAO_COM_JUSTA_CAUSA",
  ACORDO = "ACORDO",
}

interface Resultado {
  mesesTrabalhados: number;
  saldoFgts: number;
  feriasProporcionais: number;
  decimoTerceiro: number;
  feriasVencidasTotal: number;
  avisoIndenizado: number;
  multaFgts: number;
  totalRecisao: number;
  valorFeriasProporcionais: number;
  umTercoFerias: number;
  motivoRescisao: MotivoRescisao;
  saldoSalario: number;
  fgtsSobreSaldo: number;
  fgtsSobreAviso: number;
  fgtsSobre13: number;
  decimoTerceiroSobreAviso: number;
  feriasProporcionaisSobreAviso: number;
  umTercoFeriasSobreAviso: number;
}

interface FormData {
  dataAdmissao: string;
  dataDemissao: string;
  ultimoSalario: string;
  diasAvisoPrevio: string; // Novo campo
  motivoRescisao: MotivoRescisao;
  avisoPrevioIndenizado: boolean;
  temFeriasVencidas: boolean;
  feriasPeriodosVencidos: PeriodoFeriasVencidas[]; // adicionar esta linha
  incluirFeriasProporcionais: boolean; // novo campo
}

interface PeriodoFeriasVencidas {
  id: string;
  anoInicio: number;
  anoFim: number;
  periodo?: string; // mantido para compatibilidade, mas será removido posteriormente
}

function App() {
  const [formData, setFormData] = useState<FormData>({
    dataAdmissao: "",
    dataDemissao: "",
    ultimoSalario: "",
    diasAvisoPrevio: "30", // Padrão 30 dias
    motivoRescisao: MotivoRescisao.DEMISSAO_SEM_JUSTA_CAUSA,
    avisoPrevioIndenizado: false, // Alterado para false
    temFeriasVencidas: false,
    feriasPeriodosVencidos: [], // substituir periodoFeriasVencidas por esta linha
    incluirFeriasProporcionais: true, // inicializa como true
  });

  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatarMoeda = (valor: string) => {
    const number = valor.replace(/\D/g, "");
    const valorEmReais = parseFloat(number) / 100;
    return valorEmReais.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (name === "ultimoSalario") {
      const numeroLimpo = value.replace(/\D/g, "");
      setFormData((prev) => ({
        ...prev,
        [name]: numeroLimpo,
      }));
    } else if (name === "dataAdmissao" || name === "dataDemissao") {
      setFormData((prev) => {
        const newFormData = {
          ...prev,
          [name]: value,
        };
        // Atualiza automaticamente os dias de aviso prévio quando as datas mudam
        if (newFormData.dataAdmissao && newFormData.dataDemissao) {
          const diasAviso = calcularDiasAvisoPrevio(
            newFormData.dataAdmissao,
            newFormData.dataDemissao
          );
          newFormData.diasAvisoPrevio = diasAviso.toString();
        }
        return newFormData;
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const calcularMesesTrabalhados = (dataInicio: string, dataFim: string) => {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diffEmMeses =
      (fim.getFullYear() - inicio.getFullYear()) * 12 +
      (fim.getMonth() - inicio.getMonth());
    return diffEmMeses;
  };

  const calcularMesesDecimoTerceiro = (dataInicio: string, dataFim: string) => {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const anoAtual = fim.getFullYear();

    // Se começou em anos anteriores, considera 1º de janeiro como início
    const dataInicioCalculo =
      inicio.getFullYear() < anoAtual ? new Date(anoAtual, 0, 1) : inicio;

    // Calcula os meses trabalhados no ano atual
    let meses = fim.getMonth() - dataInicioCalculo.getMonth();

    // Adiciona 12 meses se começou em anos anteriores
    if (inicio.getFullYear() < anoAtual) {
      meses = fim.getMonth() + 1; // +1 porque os meses começam em 0
    }

    // Se foi demitido antes do dia 15, desconta um mês
    if (fim.getDate() < 15) {
      meses -= 1;
    }

    return Math.max(0, meses); // Garante que não retorne número negativo
  };

  const calcularMesesFeriasProporcionais = (
    dataInicio: string,
    dataFim: string
  ) => {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const anoAtual = fim.getFullYear();

    // Se começou em anos anteriores, considera 1º de janeiro como início
    const dataInicioCalculo =
      inicio.getFullYear() < anoAtual ? new Date(anoAtual, 0, 1) : inicio;

    // Calcula os meses trabalhados no ano atual
    let meses = fim.getMonth() - dataInicioCalculo.getMonth() + 1; // +1 para incluir o mês atual

    // Adiciona 12 meses se começou em anos anteriores
    if (inicio.getFullYear() < anoAtual) {
      meses = fim.getMonth() + 1;
    }

    return Math.max(0, meses); // Garante que não retorne número negativo
  };

  const calcularDiasAvisoPrevio = (
    dataInicio: string,
    dataFim: string
  ): number => {
    if (!dataInicio || !dataFim) return 30;

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    // Calcula anos completos
    const diffEmAnos = fim.getFullYear() - inicio.getFullYear();
    const mesAtualMaior =
      fim.getMonth() > inicio.getMonth() ||
      (fim.getMonth() === inicio.getMonth() &&
        fim.getDate() >= inicio.getDate());
    const anosCompletos = mesAtualMaior ? diffEmAnos : diffEmAnos - 1;

    // Calcula dias adicionais (3 por ano)
    const diasAdicionais = Math.max(0, anosCompletos * 3);

    return 30 + diasAdicionais;
  };

  const calcularFeriasVencidas = (
    salario: number,
    temFeriasVencidas: boolean,
    periodos: PeriodoFeriasVencidas[]
  ): number => {
    if (!temFeriasVencidas || periodos.length === 0) return 0;

    let totalFerias = 0;
    const hoje = new Date().getFullYear();

    periodos.forEach((periodo) => {
      // Verifica se o período está vencido (ano fim menor ou igual ao ano atual)
      if (periodo.anoFim <= hoje) {
        totalFerias += salario;
      }
    });

    return totalFerias;
  };

  const calcularAvisoPrevio = (
    salario: number,
    diasAviso: number,
    avisoPrevioIndenizado: boolean
  ): number => {
    if (!avisoPrevioIndenizado) return 0;
    const valorDiario = salario / 30;
    const valorAvisoPrevio = valorDiario * diasAviso;
    return valorAvisoPrevio;
  };

  const calcularDiasTrabalhadosUltimoMes = (dataDemissao: string): number => {
    const fim = new Date(dataDemissao);
    const ultimoDia = fim.getDate();
    console.log(ultimoDia);

    // Se trabalhou até o último dia do mês, considera 30 dias
    const diasNoMes = new Date(
      fim.getFullYear(),
      fim.getMonth() + 1,
      0
    ).getDate();
    if (ultimoDia === diasNoMes) {
      return 30;
    }

    // Se saiu antes do último dia, considera os dias trabalhados
    return ultimoDia;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Inicializar todas as variáveis que serão modificadas com let
    let saldoFgts = 0;
    let fgtsSobreSaldo = 0;
    let fgtsSobreAviso = 0;
    let fgtsSobre13 = 0;
    let saldoFgtsTotal = 0;
    let multaFgts = 0;
    let decimoTerceiro = 0;
    let avisoIndenizado = 0;
    let decimoTerceiroSobreAviso = 0;
    let feriasProporcionaisSobreAviso = 0;
    let umTercoFeriasSobreAviso = 0;

    const salario = parseFloat(formData.ultimoSalario) / 100;
    const diasAviso = parseInt(formData.diasAvisoPrevio);

    // Cálculos base
    const mesesTrabalhados = calcularMesesTrabalhados(
      formData.dataAdmissao,
      formData.dataDemissao
    );

    // FGTS base
    saldoFgts = Number((salario * 0.08 * mesesTrabalhados).toFixed(2));

    // 13º proporcional base
    const mesesDecimoTerceiro = calcularMesesDecimoTerceiro(
      formData.dataAdmissao,
      formData.dataDemissao
    );
    decimoTerceiro = Number((salario * (mesesDecimoTerceiro / 12)).toFixed(2));

    // Férias proporcionais base (não mudam)
    const mesesFeriasProporcionais = calcularMesesFeriasProporcionais(
      formData.dataAdmissao,
      formData.dataDemissao
    );
    const valorFeriasProporcionais = formData.incluirFeriasProporcionais
      ? Number(((salario * mesesFeriasProporcionais) / 12).toFixed(2))
      : 0;
    const umTercoFerias = Number((valorFeriasProporcionais / 3).toFixed(2));

    // Férias vencidas (não mudam)
    const valorFeriasVencidas = calcularFeriasVencidas(
      salario,
      formData.temFeriasVencidas,
      formData.feriasPeriodosVencidos
    );
    const umTercoFeriasVencidas = valorFeriasVencidas / 3;
    const feriasVencidasTotal = valorFeriasVencidas + umTercoFeriasVencidas;

    // Saldo de salário
    const diasTrabalhados = calcularDiasTrabalhadosUltimoMes(
      formData.dataDemissao
    );
    const saldoSalario = Number(
      ((salario / 30) * (diasTrabalhados + 1)).toFixed(2)
    );
    fgtsSobreSaldo = Number((saldoSalario * 0.08).toFixed(2));

    // Cálculo do aviso prévio e proporcionais
    if (formData.avisoPrevioIndenizado) {
      avisoIndenizado = calcularAvisoPrevio(salario, diasAviso, true);
      fgtsSobreAviso = Number((avisoIndenizado * 0.08).toFixed(2));

      const avosAviso = Math.floor(diasAviso / 30);
      const diasRestantes = diasAviso % 30;
      const avosFinais = diasRestantes >= 15 ? avosAviso + 1 : avosAviso;

      decimoTerceiroSobreAviso = Number(
        ((avisoIndenizado / 12) * avosFinais).toFixed(2)
      );
      feriasProporcionaisSobreAviso = Number(
        ((avisoIndenizado / 12) * avosFinais).toFixed(2)
      );
      umTercoFeriasSobreAviso = Number(
        (feriasProporcionaisSobreAviso / 3).toFixed(2)
      );

      // Atualizar 13º com valor do aviso
    }

    // Calcular FGTS sobre 13º total
    fgtsSobre13 = Number((decimoTerceiro * 0.08).toFixed(2));

    // Calcular saldo FGTS total
    saldoFgtsTotal = saldoFgts + fgtsSobreSaldo + fgtsSobreAviso + fgtsSobre13;

    // Aplicar regras do motivo da rescisão
    switch (formData.motivoRescisao) {
      case MotivoRescisao.DEMISSAO_SEM_JUSTA_CAUSA:
        multaFgts = Number((saldoFgtsTotal * 0.4).toFixed(2));
        break;
      case MotivoRescisao.PEDIDO_DEMISSAO:
        avisoIndenizado = 0;
        decimoTerceiro = Number((decimoTerceiro * 0.5).toFixed(2));
        break;
      case MotivoRescisao.DEMISSAO_COM_JUSTA_CAUSA:
        avisoIndenizado = 0;
        decimoTerceiro = 0;
        multaFgts = 0;
        break;
      case MotivoRescisao.ACORDO:
        multaFgts = Number((saldoFgtsTotal * 0.2).toFixed(2));
        avisoIndenizado = Number((avisoIndenizado * 0.5).toFixed(2));
        decimoTerceiro = Number((decimoTerceiro * 0.5).toFixed(2));
        break;
    }

    // Calcular total final
    const totalRecisao = Number(
      (
        saldoSalario +
        (formData.incluirFeriasProporcionais
          ? valorFeriasProporcionais + umTercoFerias
          : 0) +
        feriasVencidasTotal +
        decimoTerceiro +
        avisoIndenizado +
        multaFgts +
        feriasProporcionaisSobreAviso +
        umTercoFeriasSobreAviso +
        saldoFgtsTotal
      ).toFixed(2)
    );

    setResultado({
      mesesTrabalhados,
      saldoFgts: saldoFgtsTotal,
      feriasProporcionais: mesesFeriasProporcionais,
      decimoTerceiro,
      feriasVencidasTotal,
      avisoIndenizado,
      multaFgts,
      totalRecisao,
      valorFeriasProporcionais,
      umTercoFerias,
      motivoRescisao: formData.motivoRescisao,
      saldoSalario,
      fgtsSobreSaldo,
      fgtsSobreAviso,
      fgtsSobre13,
      decimoTerceiroSobreAviso,
      feriasProporcionaisSobreAviso,
      umTercoFeriasSobreAviso,
    });
    setIsModalOpen(true); // Abre o modal após calcular
  };

  const FeriasSection = () => {
    // Função para gerar anos disponíveis baseado na data de admissão
    const gerarAnosDisponiveis = (): number[] => {
      if (!formData.dataAdmissao) return [];

      const dataAdmissao = new Date(formData.dataAdmissao);
      const anoAdmissao = dataAdmissao.getFullYear();
      const mesAdmissao = dataAdmissao.getMonth();
      const diaAdmissao = dataAdmissao.getDate();

      const hoje = new Date();
      const anoAtual = hoje.getFullYear();
      const anos: number[] = [];

      // Começamos do ano seguinte à admissão (primeiro período aquisitivo completo)
      let primeiroPeriodoAquisitivo = anoAdmissao;

      // Se foi admitido após o dia 15, o primeiro período começa no ano seguinte
      if (mesAdmissao === 11 && diaAdmissao > 15) {
        primeiroPeriodoAquisitivo++;
      }

      // Adiciona anos até o penúltimo ano (períodos já vencidos)
      for (let ano = primeiroPeriodoAquisitivo; ano < anoAtual - 1; ano++) {
        // Verifica se o período já venceu (12 meses após o início)
        const dataVencimento = new Date(ano + 1, mesAdmissao, diaAdmissao);
        if (dataVencimento < hoje) {
          anos.push(ano);
        }
      }

      return anos;
    };

    const adicionarPeriodo = () => {
      const anoAdmissao = new Date(formData.dataAdmissao).getFullYear();
      setFormData((prev) => ({
        ...prev,
        feriasPeriodosVencidos: [
          ...prev.feriasPeriodosVencidos,
          {
            id: crypto.randomUUID(),
            anoInicio: anoAdmissao,
            anoFim: anoAdmissao + 1,
            periodo: `${anoAdmissao}-${anoAdmissao + 1}`, // opcional
          },
        ],
      }));
    };

    const removerPeriodo = (id: string) => {
      setFormData((prev) => ({
        ...prev,
        feriasPeriodosVencidos: prev.feriasPeriodosVencidos.filter(
          (p) => p.id !== id
        ),
      }));
    };

    const handlePeriodoChange = (id: string, anoInicio: number) => {
      setFormData((prev) => ({
        ...prev,
        feriasPeriodosVencidos: prev.feriasPeriodosVencidos.map((p) =>
          p.id === id ? { ...p, anoInicio, anoFim: anoInicio + 1 } : p
        ),
      }));
    };

    const anosDisponiveis = gerarAnosDisponiveis();

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="temFeriasVencidas"
            checked={formData.temFeriasVencidas}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="text-sm font-medium text-gray-700">
            Possui férias vencidas não gozadas?
          </label>
        </div>

        {formData.temFeriasVencidas && (
          <div className="space-y-4">
            {formData.feriasPeriodosVencidos.map(({ id, anoInicio }) => (
              <div key={id} className="flex items-center space-x-2">
                <select
                  value={anoInicio}
                  onChange={(e) =>
                    handlePeriodoChange(id, Number(e.target.value))
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione o período</option>
                  {anosDisponiveis.map((ano) => (
                    <option key={ano} value={ano}>
                      Período aquisitivo: {ano}-{ano + 1}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removerPeriodo(id)}
                  className="p-2 text-red-600 hover:text-red-800"
                >
                  <span>Remover</span>
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={adicionarPeriodo}
              className="mt-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Adicionar Período
            </button>

            <small className="text-gray-500 block">
              Selecione os períodos de férias vencidas não gozadas
            </small>
          </div>
        )}

        {/* Rest of the component remains the same */}
        <div className="mt-4">
          <label className="text-sm font-medium text-gray-700">
            Férias Proporcionais (Período Atual)
          </label>
          {formData.dataAdmissao && formData.dataDemissao && (
            <div className="mt-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between items-center">
                <span>Período atual:</span>
                <span className="font-medium">
                  {calcularMesesFeriasProporcionais(
                    formData.dataAdmissao,
                    formData.dataDemissao
                  )}
                  /12 avos
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Adicionar checkbox para férias proporcionais */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="incluirFeriasProporcionais"
            checked={formData.incluirFeriasProporcionais}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="text-sm font-medium text-gray-700">
            Incluir férias proporcionais no cálculo?
          </label>
        </div>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Calculadora de Rescisão Trabalhista</title>
        <meta
          name="description"
          content="Calcule sua rescisão trabalhista de forma rápida e precisa. Ferramenta gratuita que considera férias, 13º salário, FGTS e todos os direitos trabalhistas."
        />
        <meta
          name="keywords"
          content="calculadora rescisão, rescisão trabalhista, cálculo trabalhista, direitos trabalhistas, FGTS, férias, 13º salário"
        />
        <meta
          name="google-site-verification"
          content="UYRszih-jsHyDoZ6kEYk5vRU2FPfqpAdoDQOkk8Gy_4"
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Calculadora de Rescisão Trabalhista"
        />
        <meta
          property="og:description"
          content="Calcule sua rescisão trabalhista de forma rápida e precisa."
        />
        <meta
          property="og:url"
          content="https://calculadora-recisao.vercel.app/"
        />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Calculadora de Rescisão Trabalhista"
        />
        <meta
          name="twitter:description"
          content="Calcule sua rescisão trabalhista de forma rápida e precisa."
        />

        {/* Tags adicionais para SEO */}
        <link rel="canonical" href="https://calculadora-recisao.vercel.app/" />
        <meta name="robots" content="index, follow" />
        <html lang="pt-BR" />

        {/* Adicionar logo após as meta tags existentes no Helmet */}

        {/* Estruturação de dados JSON-LD para Rich Snippets */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Calculadora de Rescisão Trabalhista",
              "description": "Ferramenta gratuita para cálculo de rescisão trabalhista",
              "applicationCategory": "Calculadora",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "BRL"
              }
            }
          `}
        </script>

        {/* PWA tags */}
        <meta name="application-name" content="Calculadora de Rescisão" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta
          name="apple-mobile-web-app-title"
          content="Calculadora de Rescisão"
        />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#FFFFFF" />
      </Helmet>

      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-4xl lg:max-w-6xl sm:mx-auto">
          <div className="relative px-4 py-10 bg-white mx-4 md:mx-0 shadow rounded-3xl sm:p-10">
            <div className="max-w-6xl mx-auto">
              <div className="divide-y divide-gray-200">
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">
                    Calculadora de Rescisão Trabalhista
                  </h1>

                  {/* Form em duas colunas */}
                  <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div className="space-y-6">
                      {" "}
                      {/* Coluna 1 */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Data de Admissão
                        </label>
                        <input
                          type="date"
                          name="dataAdmissao"
                          value={formData.dataAdmissao}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Data de Demissão
                        </label>
                        <input
                          type="date"
                          name="dataDemissao"
                          value={formData.dataDemissao}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Último Salário
                        </label>
                        <input
                          type="text"
                          name="ultimoSalario"
                          value={
                            formData.ultimoSalario
                              ? formatarMoeda(formData.ultimoSalario)
                              : ""
                          }
                          onChange={handleInputChange}
                          placeholder="R$ 0,00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      {" "}
                      {/* Coluna 2 */}
                      <FeriasSection />
                      {/* Aviso Prévio section */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            name="avisoPrevioIndenizado"
                            checked={formData.avisoPrevioIndenizado}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label className="text-sm font-medium text-gray-700">
                            Aviso Prévio Indenizado
                          </label>
                        </div>

                        {formData.avisoPrevioIndenizado && (
                          <div className="space-y-2 transition-all duration-300 ease-in-out">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">
                                Dias de Aviso Prévio:
                              </span>
                              <span className="text-sm font-bold text-gray-900">
                                {formData.diasAvisoPrevio} dias
                              </span>
                            </div>
                            <small className="text-gray-500 block">
                              30 dias +{" "}
                              {parseInt(formData.diasAvisoPrevio) - 30} dias
                              adicionais (
                              {Math.floor(
                                (parseInt(formData.diasAvisoPrevio) - 30) / 3
                              )}{" "}
                              anos completos)
                            </small>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Motivo da Rescisão
                        </label>
                        <select
                          name="motivoRescisao"
                          value={formData.motivoRescisao}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option
                            value={MotivoRescisao.DEMISSAO_SEM_JUSTA_CAUSA}
                          >
                            Demissão sem Justa Causa
                          </option>
                          <option value={MotivoRescisao.PEDIDO_DEMISSAO}>
                            Pedido de Demissão
                          </option>
                          <option
                            value={MotivoRescisao.DEMISSAO_COM_JUSTA_CAUSA}
                          >
                            Demissão com Justa Causa
                          </option>
                          <option value={MotivoRescisao.ACORDO}>
                            Acordo entre as partes
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Botão ocupando as duas colunas */}
                    <div className="md:col-span-2">
                      <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                      >
                        Calcular Rescisão
                      </button>
                    </div>
                  </form>
                </div>

                {resultado && (
                  <ResultadoModal
                    resultado={resultado}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    formatarMoeda={formatarMoeda}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
