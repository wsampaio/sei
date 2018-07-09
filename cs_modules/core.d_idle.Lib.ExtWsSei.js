/**
 * Métodos não suportados no múdulo de webservice do sei:
 * core.d_idle.Lib.WsSei.js
 */
const ext_wsapiname = "WebService_Sei++: ";
var ext_wsapi = {
  processo: {
    consultar: "__ProcessoConsultar",
    consultar_dados: "procedimento_alterar",
    marcador: "andamento_marcador_gerenciar"
  },
  marcador: {
    listar: "marcador_listar"
  }
}

function ext_ws_post(apirest, json_data) {

}

function ext_ws_get(apirest, params = null, id_url = null) {
  return Promise.resolve().then(() => {
    var link = "";
    if (__isInGroup(ext_wsapi, apirest)) {
      if (__isInGroup(ext_wsapi.processo, apirest)) {
        if (apirest == ext_wsapi.processo.consultar) {
          if (params != null && params != "") {
            link = params;
          } else if (id_url != null) {
            link = GetBaseUrl() + "controlador.php?acao=procedimento_trabalhar&id_procedimento=" + id_url;
          } else {
            throw new Error("IdProcesso não informado");
          }
        } else {/** Pega o link do comando */
          link = params.LinkComandos.reduce((acc, cur, i) => {
            if (cur.indexOf(apirest) != -1) acc = cur;
            return acc;
          });
        }
      } else { /** comandos do menu */
        link = $("#main-menu li a[href^='controlador.php?acao='" + apirest + "']");
      }
    } else {
      throw new Error("Api não implementada: " + apirest);
    }
    /** Execulta a consulta */
    console.log(ext_wsapiname + "GET " + apirest + " > " + link);
    return fetch(link, { method: 'GET' });
  }).then(function (response) {
    var contentType = response.headers.get("content-type");
    if (response.ok) {
      if (contentType && contentType.includes("text/html")) {
        return response.arrayBuffer().then(buf => new TextDecoder('ISO-8859-1').decode(buf));
      } else { console.log(contentType); throw new Error("Erro no Content Type esperado!"); }
    } else {
      throw new Error(response.statusText + ": " + response.status);
    }
  }).then(function (resp) {
    switch (apirest) {
      case ext_wsapi.processo.consultar:
        return __ProcessoConsultar(resp);
      case ext_wsapi.processo.consultar_dados:
        return __ProcessoConsultarDados(resp);
      case ext_wsapi.processo.marcador:
        return __ProcessoConsultarMarcador(resp);
      case ext_wsapi.marcador.listar:
        return __MarcadorListar(resp);
      default:
        throw new Error("Api não implementada");
    }
  });
}

function __isInGroup(group, value) {
  for (const iterator in group) {
    if (typeof group[iterator] == "object") return __isInGroup(group[iterator], value);
    if (group[iterator] == value) return true;
  }
  return false;
}

/**
 * Retorna JSON com os dados e comandos do processo.
 * @param {*} resp
 */
function __ProcessoConsultar(resp) {
  return new Promise((resolve, reject) => {
    var $html = $($.parseHTML(resp));
    var Processo = {
      __tipo: "processo",
      id: -1,
      Numero: -1,
      Flags: {
        Restrito: null,
        PontoControle: null,
        Marcador: {
          Nome: null,
          Cor: null,
        },
      },
      LinkComandos: [],
    };

    var linkArvore = $("#ifrArvore", $html).attr("src");
    if (linkArvore != undefined) {
      linkArvore = GetBaseUrl() + linkArvore;
      resolve(ext_ws_get(ext_wsapi.processo.consultar, linkArvore));
    } else {
      /** Pega os links dos camandos do processo */
      var x = resp.indexOf("Nos[0].acoes");
      x = resp.indexOf("'", x) + 1;
      var y = resp.indexOf("Nos[0]", x) - 3;
      var $html2 = $($.parseHTML(resp.substring(x, y)));
      $html2.each(function (i, tag) {
        var href = $(tag).attr("href");
        if (href != "#") Processo.LinkComandos.push(GetBaseUrl() + href);
      });
      if (Processo.LinkComandos.length < 1) {
        throw new Error("Link de comandos do processo não encontrado.");
      }
      /** Pega as ações flags do processo */
      x = resp.indexOf('infraArvoreAcao("NIVEL_ACESSO'); /** ACESSO RESTRITO */
      if (x != -1) {
        x = resp.indexOf("Acesso Restrito\\n", x) + 17;
        y = resp.indexOf('"', x);
        Processo.Flags.Restrito = resp.substring(x, y);
      }
      x = resp.indexOf('infraArvoreAcao("SITUACAO'); /** PONTO DE CONTROLE */
      if (x != -1) {
        x = resp.indexOf("Ponto de Controle\\n", x) + 19;
        y = resp.indexOf('"', x);
        Processo.Flags.PontoControle = resp.substring(x, y);
      }
      x = resp.indexOf('infraArvoreAcao("MARCADOR'); /** MARCADOR */
      if (x != -1) {
        x = resp.indexOf("Marcador\\n", x) + 10;
        y = resp.indexOf('"', x);
        Processo.Flags.Marcador.Nome = resp.substring(x, y);
        x = resp.indexOf('_', y) + 1;
        y = resp.indexOf('.png', x);
        Processo.Flags.Marcador.Cor = resp.substring(x, y);
      }
      /** Pega o número do processo */
      x = resp.indexOf("Nos[0].acoes") - 30;
      x = resp.indexOf('"', x) + 1;
      y = resp.indexOf('"', x);
      Processo.Numero = resp.substring(x, y);

      /** Pega o id do processo */
      x = resp.indexOf("id_procedimento=");
      x = resp.indexOf('=', x) + 1;
      y = resp.indexOf('&', x);
      Processo.id = resp.substring(x, y);

      resolve(Processo);
    }
  });
}

/**
 * Consulta os dados do processo (Tela alterar processo)
 * @param {*} $html
 */
function __ProcessoConsultarDados(resp) {
  return new Promise((resolve, reject) => {
    var $html = $($.parseHTML(resp));
    var DadosProcesso = {
      IdProcedimento: -1,
      ProtocoloProcedimentoFormatado: "",
      NomeTipoProcedimento: "",
      /** Novos */
      Numero: "",
      DataAutuacao: null,
      Tipo: "",
      Especificacao: "",
      Interessados: [],
      Observacao: "",
      NivelAcesso: -1,
      HipoteseLegal: null
    }
    DadosProcesso.IdProcedimento = $("#hdnIdProcedimento", $html).val();
    DadosProcesso.ProtocoloProcedimentoFormatado = $("#hdnProtocoloProcedimentoFormatado", $html).val();
    DadosProcesso.NomeTipoProcedimento = $("#hdnNomeTipoProcedimento", $html).val();
    DadosProcesso.Numero = DadosProcesso.ProtocoloProcedimentoFormatado.replace(/\D/g, "");
    DadosProcesso.DataAutuacao = $("#txtDtaGeracaoExibir", $html).val();
    DadosProcesso.Tipo = DadosProcesso.NomeTipoProcedimento;
    DadosProcesso.Especificacao = $("#txtDescricao", $html).val();
    $("#selInteressadosProcedimento > option", $html).each(function name(params) {
      DadosProcesso.Interessados.push($(this).text());
    })
    DadosProcesso.Observacao = $("#txaObservacoes", $html).text();
    DadosProcesso.NivelAcesso = $("input[name='rdoNivelAcesso'][checked]", $html).val();
    if (DadosProcesso.NivelAcesso == 1) {
      var Acesso = { nome: "", valor: -1 };
      var $acesso = $("#selHipoteseLegal option[selected]", $html);
      Acesso.nome = $acesso.text();
      Acesso.valor = $acesso.val();
      DadosProcesso.HipoteseLegal = Acesso;
    }
    resolve(DadosProcesso);
  });
}

function __ProcessoConsultarMarcador(resp) {
  return new Promise((resolve, reject) => {
    var $html = $($.parseHTML(resp));
    var marcador = {
      id: -1,
      marcador: "",
      data: null,
      usuario: "",
      texto: "",
      cor: "",
      historico: []
    };
    var $tabela = $("#tblHistorico tr[class='infraTrClara']", $html);
    if ($tabela.length) {
      $tabela.each(function () {
        var historico = {
          data: $("td:eq(0)", $(this)).text(),
          usuario: $("td:eq(1)", $(this)).text(),
          marcador: $("td:eq(2)", $(this)).text(),
          texto: $("td:eq(3)", $(this)).text()
        };
        marcador.historico.push(historico);
      });
      var $optsel = $("#selMarcador option[selected]", $html);
      marcador.id = $optsel.val();
      marcador.marcador = $optsel.text();
      marcador.data = marcador.historico[0].data;
      marcador.usuario = marcador.historico[0].usuario;
      marcador.texto = marcador.historico[0].texto;
      marcador.cor = $optsel.attr("data-imagesrc");
      marcador.cor = marcador.cor.substring(
        marcador.cor.indexOf("_") + 1,
        marcador.cor.indexOf(".png")
      );
    }
    resolve(marcador);
  });
}

function __MarcadorListar(resp) {
  return new new Promise((resolve, reject) => {
    var $html = $($.parseHTML(resp));
    var marcadores = [];
    var $tabela = $("#frmMarcadorLista table tr[class]", $html);
    if ($tabela.length) {
      $tabela.each(function () {
        var marcador = {
          id: $("td:eq(3)", $(this)).text(),
          nome: $("td:eq(2)", $(this)).text(),
          cor: $("td:eq(1) > a > img", $(this)).attr("src")
        };
        marcador.cor = marcador.cor.substring(
          marcador.cor.indexOf("_") + 1,
          marcador.cor.indexOf(".png")
        );
        marcadores.push(marcador);
      });
      resolve(marcadores);
    } else {
      reject("Não existem marcadores");
    }
  });
}