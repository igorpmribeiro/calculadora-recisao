import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Resultado } from "../types/Resultado.tsx";

interface ResultadoModalProps {
  resultado: Resultado;
  isOpen: boolean;
  onClose: () => void;
  formatarMoeda: (valor: string) => string;
}

export function ResultadoModal({
  resultado,
  isOpen,
  onClose,
  formatarMoeda,
}: ResultadoModalProps) {
  // Calcular totais do FGTS para exibição
  const totalFGTS =
    resultado.fgtsSobreSaldo + resultado.fgtsSobreAviso + resultado.fgtsSobre13;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-2xl font-semibold leading-6 text-gray-900 mb-8 text-center"
                    >
                      Resumo da Rescisão
                    </Dialog.Title>

                    {/* Informações Gerais */}
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                      <h4 className="text-lg font-medium text-blue-900">
                        Informações Gerais
                      </h4>
                      <div className="mt-2 grid grid-cols-2 gap-4">
                        <p>
                          Período trabalhado: {resultado.mesesTrabalhados} meses
                        </p>
                        <p>
                          Motivo:{" "}
                          {resultado.motivoRescisao === "PEDIDO_DEMISSAO"
                            ? "Pedido de Demissão"
                            : resultado.motivoRescisao ===
                              "DEMISSAO_SEM_JUSTA_CAUSA"
                            ? "Demissão sem Justa Causa"
                            : resultado.motivoRescisao ===
                              "DEMISSAO_COM_JUSTA_CAUSA"
                            ? "Demissão com Justa Causa"
                            : "Acordo entre as partes"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Verbas Rescisórias */}
                      <div>
                        <div className="bg-white rounded-lg shadow">
                          <div className="px-4 py-5 sm:p-6">
                            <h4 className="text-lg font-medium text-gray-900 mb-4">
                              Verbas Rescisórias
                            </h4>
                            <dl className="space-y-3">
                              <div className="flex justify-between">
                                <dt>Saldo de Salário</dt>
                                <dd className="font-medium text-right">
                                  {formatarMoeda(
                                    resultado.saldoSalario.toFixed(2)
                                  )}
                                </dd>
                              </div>
                              {resultado.valorFeriasProporcionais > 0 && (
                                <>
                                  <div className="flex justify-between border-t pt-2">
                                    <dt>Férias Proporcionais</dt>
                                    <dd className="font-medium text-right">
                                      {formatarMoeda(
                                        resultado.valorFeriasProporcionais.toFixed(
                                          2
                                        )
                                      )}
                                    </dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt>1/3 Férias</dt>
                                    <dd className="font-medium text-right">
                                      {formatarMoeda(
                                        resultado.umTercoFerias.toFixed(2)
                                      )}
                                    </dd>
                                  </div>
                                </>
                              )}
                              {resultado.feriasVencidasTotal > 0 && (
                                <div className="flex justify-between border-t pt-2">
                                  <dt>Férias Vencidas + 1/3</dt>
                                  <dd className="font-medium text-right">
                                    {formatarMoeda(
                                      resultado.feriasVencidasTotal.toFixed(2)
                                    )}
                                  </dd>
                                </div>
                              )}
                              <div className="flex justify-between border-t pt-2">
                                <dt>13º Salário</dt>
                                <dd className="font-medium text-right">
                                  {formatarMoeda(
                                    resultado.decimoTerceiro.toFixed(2)
                                  )}
                                </dd>
                              </div>
                              {resultado.avisoIndenizado > 0 && (
                                <div className="flex justify-between border-t pt-2">
                                  <dt>Aviso Prévio</dt>
                                  <dd className="font-medium text-right">
                                    {formatarMoeda(
                                      resultado.avisoIndenizado.toFixed(2)
                                    )}
                                  </dd>
                                </div>
                              )}
                            </dl>
                          </div>
                        </div>
                      </div>

                      {/* FGTS e Totais */}
                      <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow">
                          <div className="px-4 py-5 sm:p-6">
                            <h4 className="text-lg font-medium text-gray-900 mb-4">
                              Detalhamento FGTS
                            </h4>
                            <dl className="space-y-3">
                              <div className="flex justify-between">
                                <dt>Saldo FGTS</dt>
                                <dd className="font-medium">
                                  {formatarMoeda(
                                    resultado.saldoFgts.toFixed(2)
                                  )}
                                </dd>
                              </div>
                              <div className="flex justify-between">
                                <dt>FGTS sobre Saldo</dt>
                                <dd className="font-medium">
                                  {formatarMoeda(
                                    resultado.fgtsSobreSaldo.toFixed(2)
                                  )}
                                </dd>
                              </div>
                              <div className="flex justify-between">
                                <dt>FGTS sobre 13º</dt>
                                <dd className="font-medium">
                                  {formatarMoeda(
                                    resultado.fgtsSobre13.toFixed(2)
                                  )}
                                </dd>
                              </div>
                              {resultado.fgtsSobreAviso > 0 && (
                                <div className="flex justify-between">
                                  <dt>FGTS sobre Aviso</dt>
                                  <dd className="font-medium">
                                    {formatarMoeda(
                                      resultado.fgtsSobreAviso.toFixed(2)
                                    )}
                                  </dd>
                                </div>
                              )}
                              <div className="flex justify-between border-t pt-2">
                                <dt>Total FGTS</dt>
                                <dd className="font-medium">
                                  {formatarMoeda(totalFGTS.toFixed(2))}
                                </dd>
                              </div>
                              {resultado.multaFgts > 0 && (
                                <div className="flex justify-between border-t pt-2">
                                  <dt>Multa FGTS</dt>
                                  <dd className="font-medium">
                                    {formatarMoeda(
                                      resultado.multaFgts.toFixed(2)
                                    )}
                                  </dd>
                                </div>
                              )}
                            </dl>
                          </div>
                        </div>

                        <div className="bg-blue-100 rounded-lg shadow p-6">
                          <h4 className="text-xl font-semibold text-blue-900">
                            Total da Rescisão
                          </h4>
                          <p className="text-3xl font-bold text-blue-700 mt-2">
                            {formatarMoeda(resultado.totalRecisao.toFixed(2))}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Valores sobre Aviso Prévio */}
                    {resultado.avisoIndenizado > 0 && (
                      <div className="mt-6 bg-gray-50 rounded-lg shadow p-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">
                          Valores Adicionais sobre Aviso Prévio
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <dt className="font-medium">13º sobre Aviso</dt>
                            <dd>
                              {formatarMoeda(
                                resultado.decimoTerceiroSobreAviso.toFixed(2)
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-medium">Férias sobre Aviso</dt>
                            <dd>
                              {formatarMoeda(
                                resultado.feriasProporcionaisSobreAviso.toFixed(
                                  2
                                )
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-medium">
                              1/3 Férias sobre Aviso
                            </dt>
                            <dd>
                              {formatarMoeda(
                                resultado.umTercoFeriasSobreAviso.toFixed(2)
                              )}
                            </dd>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
